import { NextRequest, NextResponse } from "next/server";
import {
  verifyUserCredentials,
  createSessionToken,
  SESSION_COOKIE_NAME,
  UserRole,
} from "@/lib/auth";
import { checkRateLimit, isAllowedOrigin } from "@/lib/rateLimit";

export async function POST(req: NextRequest) {
  // CSRF Origin validation
  if (!isAllowedOrigin(req)) {
    return NextResponse.json(
      { success: false, error: "Cross-site request forgery detected. Request rejected." },
      { status: 403 }
    );
  }

  // Rate limiting: max 8 login attempts per 15 minutes per IP
  const rateLimit = checkRateLimit(req, {
    windowMs: 15 * 60 * 1000,
    maxRequests: 8,
    keyPrefix: "login",
  });

  if (!rateLimit.allowed) {
    return NextResponse.json(
      {
        success: false,
        error: `Too many login attempts. Please wait ${rateLimit.resetInSeconds} seconds before trying again.`,
        retryAfter: rateLimit.resetInSeconds,
      },
      {
        status: 429,
        headers: {
          "Retry-After": String(rateLimit.resetInSeconds),
        },
      }
    );
  }

  try {
    const body = await req.json().catch(() => null);

    if (!body || typeof body !== "object") {
      return NextResponse.json(
        { success: false, error: "Invalid request payload." },
        { status: 400 }
      );
    }

    const { email, password, role } = body;

    // Validate role selected on login form
    if (role && role !== "admin" && role !== "executive") {
      return NextResponse.json(
        { success: false, error: "Invalid role specified." },
        { status: 400 }
      );
    }

    // Validate email
    if (!email || typeof email !== "string") {
      return NextResponse.json(
        { success: false, error: "Email address is required." },
        { status: 400 }
      );
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      return NextResponse.json(
        { success: false, error: "Please enter a valid email address." },
        { status: 400 }
      );
    }

    // Validate password
    if (!password || typeof password !== "string") {
      return NextResponse.json(
        { success: false, error: "Password is required." },
        { status: 400 }
      );
    }

    // Perform secure server verification via Supabase Auth with server-verified role lookup
    const verification = await verifyUserCredentials(
      email.trim(),
      password
    );

    if (!verification.configured) {
      return NextResponse.json(
        {
          success: false,
          configured: false,
          error: verification.error,
          code: verification.code || "AUTH_NOT_CONFIGURED",
        },
        { status: 503 }
      );
    }

    if (!verification.success || !verification.user) {
      const statusCode =
        verification.code === "UNAUTHORIZED_ROLE" ||
        verification.code === "ACCOUNT_DISABLED"
          ? 403
          : 401;
      return NextResponse.json(
        {
          success: false,
          configured: true,
          error: verification.error || "Invalid credentials.",
          code: verification.code || "INVALID_CREDENTIALS",
          authProvider: verification.authProvider,
        },
        { status: statusCode }
      );
    }

    // Generate unique session identifier for tracking & duration calculation
    const sessionId = crypto.randomUUID();
    const sessionUser = {
      ...verification.user,
      sessionId,
    };

    // If Executive Member, accurately record login event in rolling 5-day activity table
    if (sessionUser.role === "executive" && sessionUser.id) {
      const userAgent = req.headers.get("user-agent") || undefined;

      const { recordExecutiveLogin } = await import(
        "@/services/executiveManagementService"
      );
      await recordExecutiveLogin({
        userId: sessionUser.id,
        email: sessionUser.email,
        fullName: sessionUser.name,
        sessionId,
        userAgent,
      }).catch((err) => {
        console.warn("Could not log executive session:", err instanceof Error ? err.message : err);
      });
    }

    // Authentication succeeded - generate cryptographically signed session token
    const token = createSessionToken(sessionUser);

    // Redirect to the authorized dashboard based on the server-verified role
    const redirectUrl = "/dashboard";

    const response = NextResponse.json({
      success: true,
      configured: true,
      user: sessionUser,
      redirectUrl,
      authProvider: verification.authProvider,
      message: "Authentication successful.",
    });

    // Set secure httpOnly cookie
    response.cookies.set({
      name: SESSION_COOKIE_NAME,
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 8, // 8 hours
    });

    return response;
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unexpected error";
    console.error("Login API route error:", msg);
    return NextResponse.json(
      {
        success: false,
        error: "An unexpected server error occurred during authentication.",
      },
      { status: 500 }
    );
  }
}
