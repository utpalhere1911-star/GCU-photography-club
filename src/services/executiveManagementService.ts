import { getSupabaseAdminClient } from "@/lib/supabase";

export interface ExecutiveMember {
  id: string;
  email: string;
  fullName: string;
  status: "active" | "disabled";
  createdAt: string;
  lastSignInAt?: string | null;
}

export interface ExecutiveSessionEvent {
  id: string;
  userId: string;
  email: string;
  fullName: string;
  loginAt: string;
  logoutAt: string | null;
  duration: string;
  status: "completed" | "active" | "expired";
  userAgent?: string | null;
}

export interface ExecutiveActivitySummary {
  totalExecutiveMembers: number;
  loginsLast5Days: number;
  logoutsLast5Days: number;
  activeOrIncompleteSessions: number;
}

export interface ExecutiveActivityReport {
  summary: ExecutiveActivitySummary;
  events: ExecutiveSessionEvent[];
}

/**
 * Format session duration into a clean human-readable string.
 */
function calculateDuration(
  loginAt: string,
  logoutAt: string | null
): { duration: string; status: "completed" | "active" | "expired" } {
  const loginTime = new Date(loginAt).getTime();
  const now = Date.now();
  const SESSION_TTL_MS = 8 * 60 * 60 * 1000; // 8 hours

  if (logoutAt) {
    const logoutTime = new Date(logoutAt).getTime();
    const diffSec = Math.max(0, Math.floor((logoutTime - loginTime) / 1000));
    const hours = Math.floor(diffSec / 3600);
    const minutes = Math.floor((diffSec % 3600) / 60);
    const seconds = diffSec % 60;

    let str = "";
    if (hours > 0) str += `${hours}h `;
    if (minutes > 0 || hours > 0) str += `${minutes}m `;
    str += `${seconds}s`;

    return { duration: str.trim(), status: "completed" };
  }

  // No logout timestamp recorded
  if (now - loginTime > SESSION_TTL_MS) {
    return { duration: "Session expired (Incomplete)", status: "expired" };
  }

  const activeSec = Math.max(0, Math.floor((now - loginTime) / 1000));
  const activeMin = Math.floor(activeSec / 60);
  return {
    duration: activeMin > 0 ? `Active (${activeMin}m in)` : "Active (< 1m)",
    status: "active",
  };
}

/**
 * List all Executive Member accounts.
 * Queries public.user_roles and enriches with Supabase Auth metadata.
 * Strictly excludes Administrator accounts.
 */
export async function listExecutiveMembers(): Promise<ExecutiveMember[]> {
  const adminClient = getSupabaseAdminClient();
  if (!adminClient) {
    throw new Error("Supabase Admin client is not configured.");
  }

  // 1. Fetch all user_roles rows with role = 'executive'
  let rolesData:
    | {
        user_id: string;
        role?: string;
        full_name?: string | null;
        status?: string | null;
        created_at?: string;
      }[]
    | null = null;
  const { data: fullRolesData, error: rolesError } = await adminClient
    .from("user_roles")
    .select("user_id, role, full_name, status, created_at")
    .eq("role", "executive")
    .order("created_at", { ascending: false });

  if (rolesError) {
    console.warn("Could not query extended user_roles columns, falling back to base columns:", rolesError.message);
    const { data: fallbackRolesData, error: fallbackError } = await adminClient
      .from("user_roles")
      .select("user_id, role, created_at")
      .eq("role", "executive")
      .order("created_at", { ascending: false });

    if (fallbackError) {
      console.error("Error fetching executive user roles:", fallbackError.message);
      throw new Error("Failed to query executive accounts.");
    }
    rolesData = fallbackRolesData;
  } else {
    rolesData = fullRolesData;
  }

  if (!rolesData || rolesData.length === 0) {
    return [];
  }

  // 2. Fetch Auth metadata for each user
  const members: ExecutiveMember[] = [];

  for (const row of rolesData) {
    try {
      const { data: authUser, error: authError } =
        await adminClient.auth.admin.getUserById(row.user_id);

      if (!authError && authUser?.user) {
        const u = authUser.user;
        const resolvedName =
          row.full_name ||
          (u.user_metadata?.full_name as string) ||
          "Executive Member";
        const isBanned =
          Boolean(u.banned_until) && new Date(u.banned_until!) > new Date();

        members.push({
          id: row.user_id,
          email: u.email || "unknown@gcuniversity.ac.in",
          fullName: resolvedName,
          status: isBanned || row.status === "disabled" ? "disabled" : "active",
          createdAt: row.created_at || u.created_at,
          lastSignInAt: u.last_sign_in_at || null,
        });
      }
    } catch {
      console.warn("Could not fetch auth user details for:", row.user_id);
    }
  }

  return members;
}

/**
 * Create a new Executive Member account with Supabase Authentication.
 * Transactional: rolls back Supabase Auth user if public.user_roles insertion fails.
 */
export async function createExecutiveMember(params: {
  fullName: string;
  email: string;
  password: string;
  adminUserId: string;
}): Promise<ExecutiveMember> {
  const adminClient = getSupabaseAdminClient();
  if (!adminClient) {
    throw new Error("Supabase Admin client is not configured.");
  }

  const { fullName, email, password } = params;
  const cleanEmail = email.trim().toLowerCase();
  const cleanName = fullName.trim();

  // 1. Create the user in Supabase Authentication
  const { data: authData, error: authError } =
    await adminClient.auth.admin.createUser({
      email: cleanEmail,
      password,
      email_confirm: true,
      user_metadata: {
        full_name: cleanName,
      },
    });

  if (authError || !authData?.user) {
    const errorMsg = authError?.message || "Failed to create user in authentication provider.";
    if (errorMsg.toLowerCase().includes("already registered") || errorMsg.toLowerCase().includes("unique")) {
      throw new Error("An account with this email address already exists.");
    }
    throw new Error(errorMsg);
  }

  const newUserId = authData.user.id;

  // 2. Assign the executive role in public.user_roles
  let { error: roleError } = await adminClient.from("user_roles").insert({
    user_id: newUserId,
    role: "executive",
    full_name: cleanName,
    status: "active",
  });

  if (roleError) {
    console.warn("Could not insert extended columns into user_roles, falling back to base columns:", roleError.message);
    const fallback = await adminClient.from("user_roles").insert({
      user_id: newUserId,
      role: "executive",
    });
    roleError = fallback.error;
  }

  if (roleError) {
    // Transactional rollback: clean up the newly created Supabase Auth user
    console.error("Failed to assign executive role; rolling back auth user:", roleError.message);
    await adminClient.auth.admin.deleteUser(newUserId).catch(() => {});
    throw new Error(`Failed to assign executive role: ${roleError.message}. Account creation was rolled back.`);
  }

  return {
    id: newUserId,
    email: cleanEmail,
    fullName: cleanName,
    status: "active",
    createdAt: new Date().toISOString(),
    lastSignInAt: null,
  };
}

/**
 * Toggle an Executive account's active or disabled status.
 */
export async function updateExecutiveStatus(
  userId: string,
  newStatus: "active" | "disabled"
): Promise<{ success: boolean; message: string }> {
  const adminClient = getSupabaseAdminClient();
  if (!adminClient) throw new Error("Supabase Admin client is not configured.");

  // Verify target is an executive (never modify admin via this method)
  const { data: roleRow, error: roleCheckError } = await adminClient
    .from("user_roles")
    .select("role")
    .eq("user_id", userId)
    .maybeSingle();

  if (roleCheckError || !roleRow || roleRow.role !== "executive") {
    throw new Error("Target user is not an Executive Member.");
  }

  // 1. Update public.user_roles
  const { error: updateError } = await adminClient
    .from("user_roles")
    .update({ status: newStatus, updated_at: new Date().toISOString() })
    .eq("user_id", userId);

  if (updateError) {
    // If column status does not exist yet in live DB, log warning and still update Auth ban
    console.warn("Could not update status column in user_roles:", updateError.message);
  }

  // 2. Update Supabase Auth ban
  const banDuration = newStatus === "disabled" ? "876000h" : "none";
  const { error: authBanError } = await adminClient.auth.admin.updateUserById(
    userId,
    { ban_duration: banDuration }
  );

  if (authBanError) {
    throw new Error(`Failed to update account ban status: ${authBanError.message}`);
  }

  return {
    success: true,
    message: `Executive Member account ${newStatus === "active" ? "reactivated" : "deactivated"} successfully.`,
  };
}

/**
 * Securely reset an Executive Member's password from the Admin dashboard.
 */
export async function resetExecutivePassword(
  userId: string,
  newPassword: string
): Promise<{ success: boolean; message: string }> {
  const adminClient = getSupabaseAdminClient();
  if (!adminClient) throw new Error("Supabase Admin client is not configured.");

  if (!newPassword || newPassword.length < 6) {
    throw new Error("Password must be at least 6 characters.");
  }

  // Verify target is an executive
  const { data: roleRow, error: roleCheckError } = await adminClient
    .from("user_roles")
    .select("role")
    .eq("user_id", userId)
    .maybeSingle();

  if (roleCheckError || !roleRow || roleRow.role !== "executive") {
    throw new Error("Target user is not an Executive Member.");
  }

  // Update password in Supabase Auth
  const { error } = await adminClient.auth.admin.updateUserById(userId, {
    password: newPassword,
  });

  if (error) {
    throw new Error(`Failed to update password: ${error.message}`);
  }

  return {
    success: true,
    message: "Executive account password has been reset successfully.",
  };
}

/**
 * Permanently delete an Executive Member account after confirmation.
 * Prevents accidental deletion of Admin accounts or self-deletion.
 */
export async function deleteExecutiveMember(
  userId: string,
  requestingAdminId: string
): Promise<{ success: boolean; message: string }> {
  const adminClient = getSupabaseAdminClient();
  if (!adminClient) throw new Error("Supabase Admin client is not configured.");

  if (userId === requestingAdminId) {
    throw new Error("Cannot delete your own Administrator account.");
  }

  // Verify target is strictly an executive
  const { data: roleRow, error: roleCheckError } = await adminClient
    .from("user_roles")
    .select("role")
    .eq("user_id", userId)
    .maybeSingle();

  if (roleCheckError || !roleRow) {
    throw new Error("User record not found in club directory.");
  }

  if (roleRow.role !== "executive") {
    throw new Error("Security Violation: Cannot delete an Administrator account.");
  }

  // 1. Delete from public.user_roles
  await adminClient.from("user_roles").delete().eq("user_id", userId);

  // 2. Delete from executive_session_activity
  try {
    await adminClient
      .from("executive_session_activity")
      .delete()
      .eq("user_id", userId);
  } catch {
    // Graceful fallback if table does not exist yet
  }

  // 3. Delete from Supabase Auth
  const { error: authDeleteError } = await adminClient.auth.admin.deleteUser(
    userId
  );

  if (authDeleteError) {
    console.warn("Could not delete user from Auth, or already deleted:", authDeleteError.message);
  }

  return {
    success: true,
    message: "Executive Member account removed successfully.",
  };
}

/**
 * Record an executive login event.
 * Proactively cleans up session records older than 5 days to enforce rolling retention.
 */
export async function recordExecutiveLogin(params: {
  userId: string;
  email: string;
  fullName: string;
  sessionId: string;
  userAgent?: string;
}): Promise<void> {
  const adminClient = getSupabaseAdminClient();
  if (!adminClient) return;

  const { userId, email, fullName, sessionId, userAgent } = params;

  try {
    // 1. Automatic 5-day rolling retention cleanup via database function or fallback
    try {
      const { error: rpcErr } = await adminClient.rpc("cleanup_expired_executive_activity");
      if (rpcErr) throw rpcErr;
    } catch (cleanupErr) {
      console.warn(
        "Notice: cleanup_expired_executive_activity RPC not available or failed; invoking application retention fallback:",
        cleanupErr instanceof Error ? cleanupErr.message : cleanupErr
      );
      const fiveDaysAgo = new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString();
      try {
        const { error: delErr } = await adminClient
          .from("executive_session_activity")
          .delete()
          .lt("login_at", fiveDaysAgo);
        if (delErr) {
          console.warn("Direct query retention fallback warning:", delErr.message);
        }
      } catch (delCatchErr) {
        console.warn("Direct query retention execution error:", delCatchErr);
      }
    }

    // 2. Insert new session event (without IP address collection)
    await adminClient.from("executive_session_activity").insert({
      user_id: userId,
      session_id: sessionId,
      email,
      full_name: fullName,
      login_at: new Date().toISOString(),
      user_agent: userAgent ? userAgent.slice(0, 255) : null,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Error recording login";
    console.warn("Could not record executive session event:", msg);
  }
}

/**
 * Record an executive logout event for a specific session ID.
 */
export async function recordExecutiveLogout(sessionId: string): Promise<void> {
  const adminClient = getSupabaseAdminClient();
  if (!adminClient || !sessionId) return;

  try {
    await adminClient
      .from("executive_session_activity")
      .update({ logout_at: new Date().toISOString() })
      .eq("session_id", sessionId)
      .is("logout_at", null);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Error recording logout";
    console.warn("Could not record executive logout event:", msg);
  }
}

/**
 * Query the rolling 5-day Executive Member session activity report.
 * Performs automatic cleanup of events older than 5 days.
 */
export async function getExecutiveActivityReport(
  filterUserId?: string
): Promise<ExecutiveActivityReport> {
  const adminClient = getSupabaseAdminClient();
  if (!adminClient) {
    throw new Error("Supabase Admin client is not configured.");
  }

  const fiveDaysAgo = new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString();

  // 1. Proactively delete records older than 5 days (retention requirement via RPC or fallback)
  try {
    const { error: rpcErr } = await adminClient.rpc("cleanup_expired_executive_activity");
    if (rpcErr) throw rpcErr;
  } catch (cleanupErr) {
    console.warn(
      "Notice: cleanup_expired_executive_activity RPC not available or failed; invoking application retention fallback:",
      cleanupErr instanceof Error ? cleanupErr.message : cleanupErr
    );
    try {
      const { error: delErr } = await adminClient
        .from("executive_session_activity")
        .delete()
        .lt("login_at", fiveDaysAgo);
      if (delErr) {
        console.warn("Direct query retention fallback warning:", delErr.message);
      }
    } catch (delCatchErr) {
      console.warn("Direct query retention execution error:", delCatchErr);
    }
  }

  // 2. Query total Executive Members count
  const { count: totalExecs } = await adminClient
    .from("user_roles")
    .select("user_id", { count: "exact", head: true })
    .eq("role", "executive");

  // 3. Query rolling 5-day activity records
  let query = adminClient
    .from("executive_session_activity")
    .select("id, user_id, email, full_name, login_at, logout_at, user_agent")
    .gte("login_at", fiveDaysAgo)
    .order("login_at", { ascending: false });

  if (filterUserId && filterUserId !== "all") {
    query = query.eq("user_id", filterUserId);
  }

  const { data: rows, error } = await query;

  if (error) {
    console.warn("Could not query executive_session_activity table:", error.message);
    return {
      summary: {
        totalExecutiveMembers: totalExecs || 0,
        loginsLast5Days: 0,
        logoutsLast5Days: 0,
        activeOrIncompleteSessions: 0,
      },
      events: [],
    };
  }

  const events: ExecutiveSessionEvent[] = (rows || []).map((row) => {
    const { duration, status } = calculateDuration(row.login_at, row.logout_at);
    return {
      id: row.id,
      userId: row.user_id,
      email: row.email,
      fullName: row.full_name,
      loginAt: row.login_at,
      logoutAt: row.logout_at,
      duration,
      status,
      userAgent: row.user_agent,
    };
  });

  const loginsLast5Days = events.length;
  const logoutsLast5Days = events.filter((e) => e.status === "completed").length;
  const activeOrIncompleteSessions = events.filter((e) => e.status !== "completed").length;

  return {
    summary: {
      totalExecutiveMembers: totalExecs || 0,
      loginsLast5Days,
      logoutsLast5Days,
      activeOrIncompleteSessions,
    },
    events,
  };
}
