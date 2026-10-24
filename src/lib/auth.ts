import crypto from "crypto";
import { cookies } from "next/headers";
import {
  isSupabaseConfigured,
  authenticateWithSupabase,
  getSupabaseAdminClient,
  UserRole,
} from "./supabase";

export type { UserRole };

export interface SessionUser {
  id?: string;
  email: string;
  role: UserRole;
  name: string;
  sessionId?: string;
  authProvider?: "supabase" | "local";
}

export interface SessionPayload {
  id?: string;
  email: string;
  role: UserRole;
  name: string;
  sessionId?: string;
  authProvider?: "supabase" | "local";
  iat: number;
  exp: number;
}

export const SESSION_COOKIE_NAME = "shutterscape_session";
const SESSION_DURATION_SECONDS = 60 * 60 * 8; // 8 hours

/**
 * Get the secret key used for HMAC signing of session tokens.
 */
function getAuthSecret(): string {
  const secret = process.env.SHUTTERSCAPE_AUTH_SECRET || process.env.AUTH_SECRET;
  if (secret) {
    let cleaned = secret.trim();
    if (
      (cleaned.startsWith('"') && cleaned.endsWith('"')) ||
      (cleaned.startsWith("'") && cleaned.endsWith("'"))
    ) {
      cleaned = cleaned.slice(1, -1).trim();
    }
    if (cleaned.length >= 32) {
      return cleaned;
    }
    if (process.env.NODE_ENV === "production") {
      throw new Error(
        "CRITICAL SECURITY CONFIGURATION ERROR: SHUTTERSCAPE_AUTH_SECRET must be at least 32 characters in production."
      );
    }
    if (cleaned.length >= 16) {
      return cleaned;
    }
  }

  if (process.env.NODE_ENV === "production") {
    throw new Error(
      "CRITICAL SECURITY CONFIGURATION ERROR: SHUTTERSCAPE_AUTH_SECRET environment variable is not defined in production. Token signing aborted to prevent forged credentials."
    );
  }

  if (process.env.NODE_ENV !== "test") {
    console.warn(
      "[SECURITY WARNING] SHUTTERSCAPE_AUTH_SECRET is not configured. Using temporary dev fallback secret. DO NOT RUN IN PRODUCTION."
    );
  }

  return "shutterscape_dev_fallback_secret_key_at_least_32_chars_long!";
}

/**
 * Check if the backend authentication provider (Supabase Auth) is configured in the environment.
 */
export function isBackendAuthConfigured(): boolean {
  return isSupabaseConfigured();
}

/**
 * Get active authentication provider name.
 */
export function getActiveAuthProvider(): "supabase" | "none" {
  return isSupabaseConfigured() ? "supabase" : "none";
}

/**
 * Verify user credentials using Supabase Auth as the sole production authentication mechanism.
 * Server strictly verifies the user's assigned role ('admin' or 'executive') from Supabase.
 * Does NOT authenticate using hardcoded fallback credentials.
 */
export async function verifyUserCredentials(
  email: string,
  passwordAttempt: string
): Promise<{
  configured: boolean;
  success: boolean;
  user?: SessionUser;
  error?: string;
  code?: string;
  authProvider?: "supabase";
}> {
  if (!isSupabaseConfigured()) {
    return {
      configured: false,
      success: false,
      error:
        "Supabase authentication is not configured. Please ensure NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are set in .env.local.",
      code: "SUPABASE_NOT_CONFIGURED",
    };
  }

  const sbResult = await authenticateWithSupabase(email, passwordAttempt);
  if (!sbResult.success || !sbResult.user) {
    return {
      configured: true,
      success: false,
      error: sbResult.error || "Authentication failed. Please verify your credentials and try again.",
      code: sbResult.code || "AUTH_FAILED",
      authProvider: "supabase",
    };
  }

  return {
    configured: true,
    success: true,
    user: {
      id: sbResult.user.id,
      email: sbResult.user.email,
      role: sbResult.user.role,
      name: sbResult.user.name,
      authProvider: "supabase",
    },
    authProvider: "supabase",
  };
}

/**
 * Generate a cryptographically signed HMAC token for a session.
 */
export function createSessionToken(user: SessionUser): string {
  const now = Math.floor(Date.now() / 1000);
  const payload: SessionPayload = {
    id: user.id,
    email: user.email,
    role: user.role,
    name: user.name,
    sessionId: user.sessionId,
    authProvider: user.authProvider || "local",
    iat: now,
    exp: now + SESSION_DURATION_SECONDS,
  };

  const payloadEncoded = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const signature = crypto
    .createHmac("sha256", getAuthSecret())
    .update(payloadEncoded)
    .digest("base64url");

  return `${payloadEncoded}.${signature}`;
}

/**
 * Verify and decode an HMAC-signed session token.
 */
export function verifySessionToken(token: string): SessionUser | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 2) return null;

    const [payloadEncoded, signature] = parts;
    const expectedSig = crypto
      .createHmac("sha256", getAuthSecret())
      .update(payloadEncoded)
      .digest("base64url");

    const bufSig = Buffer.from(signature);
    const bufExpected = Buffer.from(expectedSig);

    if (bufSig.length !== bufExpected.length || !crypto.timingSafeEqual(bufSig, bufExpected)) {
      return null;
    }

    const payload: SessionPayload = JSON.parse(
      Buffer.from(payloadEncoded, "base64url").toString("utf-8")
    );

    const now = Math.floor(Date.now() / 1000);
    if (payload.exp < now) {
      return null; // Expired
    }

    return {
      id: payload.id,
      email: payload.email,
      role: payload.role,
      name: payload.name,
      sessionId: payload.sessionId,
      authProvider: payload.authProvider,
    };
  } catch {
    return null;
  }
}

/**
 * Retrieve the current server session from cookies.
 */
export async function getSessionUser(): Promise<SessionUser | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
    if (!token) return null;
    return verifySessionToken(token);
  } catch {
    return null;
  }
}

/**
 * Returns true if the user has authorization to manage website content.
 * Admin and Executive Member have EQUAL permissions for:
 * 1. Activities Management (create, edit, publish, archive, delete, upload/remove photos)
 * 2. Gallery Management (add, edit, replace, remove, reorder, categorize photos)
 * 3. People Behind ShutterScape (add, edit, replace photo, remove, reorder team members)
 */
export function canManageContent(user: SessionUser | null): boolean {
  if (!user) return false;
  return user.role === "admin" || user.role === "executive";
}

export type ContentAuthResult =
  | { authorized: true; user: SessionUser }
  | { authorized: false; status: 401 | 403; error: string };

/**
 * Backend authorization guard for API routes and server actions.
 * Enforces cryptographic HMAC-SHA256 session verification and equal content-management authorization.
 */
export async function requireContentManager(): Promise<ContentAuthResult> {
  const user = await getSessionUser();
  if (!user) {
    return {
      authorized: false,
      status: 401,
      error: "Authentication required. Please sign in to manage club content.",
    };
  }

  if (!canManageContent(user)) {
    return {
      authorized: false,
      status: 403,
      error: "Forbidden. Content management permissions are required.",
    };
  }

  // If Executive Member, verify that account has not been deactivated by Admin
  if (user.role === "executive" && user.id) {
    const adminClient = getSupabaseAdminClient();
    if (adminClient) {
      try {
        const { data: roleRow } = await adminClient
          .from("user_roles")
          .select("status")
          .eq("user_id", user.id)
          .maybeSingle();

        if (roleRow && roleRow.status === "disabled") {
          return {
            authorized: false,
            status: 403,
            error: "Access Denied: Your Executive Member account has been deactivated. Please contact club administration.",
          };
        }
      } catch {
        // Fall back gracefully if table/column is not yet populated
      }
    }
  }

  return { authorized: true, user };
}

export type AdminAuthResult =
  | { authorized: true; user: SessionUser }
  | { authorized: false; status: 401 | 403; error: string };

/**
 * Backend authorization guard strictly restricting access to Club Administrators.
 * Executive Members and unauthenticated callers are rejected with 401 or 403.
 */
export async function requireAdmin(): Promise<AdminAuthResult> {
  const user = await getSessionUser();
  if (!user) {
    return {
      authorized: false,
      status: 401,
      error: "Authentication required. Please sign in as an Administrator.",
    };
  }

  if (user.role !== "admin") {
    return {
      authorized: false,
      status: 403,
      error: "Forbidden. Administrator privileges are required to access this resource.",
    };
  }

  // Verify that Admin account is active and has not been revoked or disabled in the database
  if (user.id) {
    const adminClient = getSupabaseAdminClient();
    if (adminClient) {
      try {
        const { data: roleRow } = await adminClient
          .from("user_roles")
          .select("role, status")
          .eq("user_id", user.id)
          .maybeSingle();

        if (roleRow) {
          if (roleRow.status === "disabled") {
            return {
              authorized: false,
              status: 403,
              error: "Access Denied: Your Administrator account has been deactivated.",
            };
          }
          if (roleRow.role !== "admin") {
            return {
              authorized: false,
              status: 403,
              error: "Access Denied: Administrator role privileges are no longer assigned to this account.",
            };
          }
        }
      } catch {
        // Fall back gracefully if table/column is not yet populated
      }
    }
  }

  return { authorized: true, user };
}
