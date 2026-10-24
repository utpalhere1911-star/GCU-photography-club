import { NextResponse } from "next/server";
import { SESSION_COOKIE_NAME, getSessionUser } from "@/lib/auth";
import { getSupabaseServerClient } from "@/lib/supabase";
import { recordExecutiveLogout } from "@/services/executiveManagementService";

export async function POST() {
  try {
    const sessionUser = await getSessionUser();
    if (sessionUser?.role === "executive" && sessionUser.sessionId) {
      await recordExecutiveLogout(sessionUser.sessionId).catch((err) => {
        console.warn("Could not log executive logout:", err instanceof Error ? err.message : err);
      });
    }

    const supabase = getSupabaseServerClient();
    if (supabase) {
      await supabase.auth.signOut().catch(() => {});
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Sign out error";
    console.warn("Supabase signOut error:", msg);
  }

  const response = NextResponse.json({
    success: true,
    message: "Logged out successfully.",
  });

  // Clear session cookie
  response.cookies.set({
    name: SESSION_COOKIE_NAME,
    value: "",
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });

  return response;
}
