import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export const SESSION_COOKIE_NAME = "shutterscape_session";

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1. Edge Route Protection for /dashboard
  // Immediately redirect unauthorized direct navigation at the HTTP request boundary
  if (pathname.startsWith("/dashboard")) {
    const sessionCookie = request.cookies.get(SESSION_COOKIE_NAME)?.value;

    if (!sessionCookie || sessionCookie.trim().length === 0) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("redirect", pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  // 2. Strict Origin/CSRF verification for state-changing API mutations
  if (
    request.method !== "GET" &&
    request.method !== "HEAD" &&
    request.method !== "OPTIONS" &&
    (pathname.startsWith("/api/admin") || pathname.startsWith("/api/content"))
  ) {
    const origin = request.headers.get("origin");
    const host = request.headers.get("host");

    if (origin && host) {
      try {
        const originUrl = new URL(origin);
        const isLocal =
          process.env.NODE_ENV !== "production" &&
          (originUrl.hostname === "localhost" || originUrl.hostname === "127.0.0.1");

        if (originUrl.host !== host && !isLocal) {
          return NextResponse.json(
            { success: false, error: "Cross-site request rejected by security boundary." },
            { status: 403 }
          );
        }
      } catch {
        return NextResponse.json(
          { success: false, error: "Malformed origin header." },
          { status: 400 }
        );
      }
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/api/admin/:path*",
    "/api/content/:path*",
  ],
};
