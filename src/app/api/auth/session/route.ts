import { NextResponse } from "next/server";
import {
  getSessionUser,
  isBackendAuthConfigured,
  getActiveAuthProvider,
  SESSION_COOKIE_NAME,
} from "@/lib/auth";
import { isSupabaseConfigured, getSupabaseAdminClient } from "@/lib/supabase";

export async function GET() {
  try {
    const user = await getSessionUser();
    const supabaseConfigured = isSupabaseConfigured();
    const activeProvider = getActiveAuthProvider();

    // Verify account status from user_roles in database
    if (user && user.id) {
      const adminClient = getSupabaseAdminClient();
      if (adminClient) {
        try {
          const { data: roleRow } = await adminClient
            .from("user_roles")
            .select("role, status, full_name")
            .eq("user_id", user.id)
            .maybeSingle();

          if (roleRow) {
            if (roleRow.status === "disabled") {
              const res = NextResponse.json({
                authenticated: false,
                user: null,
                authProvider: activeProvider,
                code: "ACCOUNT_DISABLED",
                error: `Access Denied: Your ${user.role === "admin" ? "Administrator" : "Executive"} account has been deactivated.`,
                backendStatus: { supabaseConfigured, activeProvider },
              });
              res.cookies.delete(SESSION_COOKIE_NAME);
              return res;
            }

            // Sync verified role and full name from database
            if (roleRow.role === "admin" || roleRow.role === "executive") {
              user.role = roleRow.role;
            }
            if (roleRow.full_name) {
              user.name = roleRow.full_name;
            }
          }
        } catch {
          // Graceful fallback if database check fails temporarily
        }
      }
    }

    return NextResponse.json({
      authenticated: Boolean(user),
      user: user
        ? {
            id: user.id,
            email: user.email,
            role: user.role,
            name: user.name,
            authProvider: user.authProvider || activeProvider,
            accountStatus: "active",
          }
        : null,
      authProvider: user?.authProvider || activeProvider,
      backendStatus: {
        supabaseConfigured,
        activeProvider,
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to read session";
    console.error("Session verification error:", message);
    return NextResponse.json(
      { authenticated: false, user: null, error: "Failed to read session" },
      { status: 500 }
    );
  }
}
