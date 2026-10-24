import { createClient, SupabaseClient, User } from "@supabase/supabase-js";
export type UserRole = "admin" | "executive";

/**
 * Sanitize environment variable value by trimming whitespace, quotes, and markdown formatting.
 */
function cleanEnv(val?: string): string {
  if (!val) return "";
  let cleaned = val.trim();
  // Strip wrapping double or single quotes
  if (
    (cleaned.startsWith('"') && cleaned.endsWith('"')) ||
    (cleaned.startsWith("'") && cleaned.endsWith("'"))
  ) {
    cleaned = cleaned.slice(1, -1).trim();
  }
  // Strip Markdown link formatting if any (e.g., [https://...] or <https://...>)
  if (
    (cleaned.startsWith("[") && cleaned.endsWith("]")) ||
    (cleaned.startsWith("<") && cleaned.endsWith(">")) ||
    (cleaned.startsWith("(") && cleaned.endsWith(")"))
  ) {
    cleaned = cleaned.slice(1, -1).trim();
  }
  return cleaned;
}

/**
 * Check whether Supabase environment variables are configured.
 * Validates that URL and anon key are non-empty, formatted properly, and are not placeholder values.
 */
export function isSupabaseConfigured(): boolean {
  const url = cleanEnv(
    process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
  );
  const anonKey = cleanEnv(
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY
  );

  const isPlaceholderUrl =
    url.includes("your-project") || url.includes("your-supabase-url");
  const isPlaceholderKey = anonKey.includes("your-anon-key");

  return Boolean(
    url &&
    anonKey &&
    !isPlaceholderUrl &&
    !isPlaceholderKey &&
    (url.startsWith("https://") || url.startsWith("http://"))
  );
}

/**
 * Check if the Supabase Service Role Key is configured for elevated server operations.
 */
export function isSupabaseAdminConfigured(): boolean {
  const url = cleanEnv(
    process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
  );
  const serviceKey = cleanEnv(process.env.SUPABASE_SERVICE_ROLE_KEY);

  const isPlaceholderUrl =
    url.includes("your-project") || url.includes("your-supabase-url");
  const isPlaceholderKey = serviceKey.includes("your-service-role-key");

  return Boolean(
    url &&
    serviceKey &&
    !isPlaceholderUrl &&
    !isPlaceholderKey &&
    (url.startsWith("https://") || url.startsWith("http://"))
  );
}

let browserClientInstance: SupabaseClient | null = null;

/**
 * Get the client-side Supabase client using anon key.
 * Used for Realtime subscriptions and public browser-side queries.
 */
export function getSupabaseBrowserClient(): SupabaseClient | null {
  if (typeof window === "undefined") {
    return null;
  }
  if (!isSupabaseConfigured()) {
    return null;
  }
  if (!browserClientInstance) {
    const url = cleanEnv(
      process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
    );
    const anonKey = cleanEnv(
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY
    );
    browserClientInstance = createClient(url, anonKey, {
      realtime: {
        params: {
          eventsPerSecond: 10,
        },
      },
    });
  }
  return browserClientInstance;
}

/**
 * Get the server-side Supabase client using anon key.
 * This client runs strictly on the server and does not expose keys to browser bundles.
 */
export function getSupabaseServerClient(): SupabaseClient | null {
  if (!isSupabaseConfigured()) {
    return null;
  }

  const url = cleanEnv(
    process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
  );
  const anonKey = cleanEnv(
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY
  );

  return createClient(url, anonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

/**
 * Get the server-side Supabase client using the service role key.
 * Used exclusively for server-side role lookups and account provisioning verification.
 * NEVER expose this client or key to browser code.
 */
export function getSupabaseAdminClient(): SupabaseClient | null {
  if (!isSupabaseAdminConfigured()) {
    return null;
  }

  const url = cleanEnv(
    process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
  );
  const serviceKey = cleanEnv(process.env.SUPABASE_SERVICE_ROLE_KEY);

  return createClient(url, serviceKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

export interface UserRoleRecord {
  role: UserRole;
  status: "active" | "disabled";
  fullName?: string;
}

/**
 * Query detailed role record from public.user_roles (including status and full_name).
 */
export async function getUserRoleDetailsFromSupabase(
  userId: string,
  user?: User | null
): Promise<UserRoleRecord | null> {
  const adminClient = getSupabaseAdminClient();
  const serverClient = getSupabaseServerClient();
  const client = adminClient || serverClient;

  if (client) {
    try {
      const { data, error } = await client
        .from("user_roles")
        .select("role, status, full_name")
        .eq("user_id", userId)
        .maybeSingle();

      if (!error && data && data.role) {
        const rawRole = String(data.role).toLowerCase().trim();
        if (rawRole === "admin" || rawRole === "executive") {
          return {
            role: rawRole as UserRole,
            status: data.status === "disabled" ? "disabled" : "active",
            fullName: data.full_name || undefined,
          };
        }
      }
    } catch {
      // Fallback query if status/full_name column does not exist yet
      try {
        const { data } = await client
          .from("user_roles")
          .select("role")
          .eq("user_id", userId)
          .maybeSingle();
        if (data && (data.role === "admin" || data.role === "executive")) {
          return { role: data.role as UserRole, status: "active" };
        }
      } catch { }
    }
  }

  // Fallback to server-assigned app_metadata (set via Supabase Admin API)
  if (user) {
    const appRole = (user.app_metadata?.role as string)?.toLowerCase().trim();
    if (appRole === "admin" || appRole === "executive") {
      return { role: appRole as UserRole, status: "active" };
    }
  }

  return null;
}

/**
 * Query the user's authorized role from Supabase.
 * Checks:
 * 1. public.user_roles table (using Admin client or Server client)
 * 2. user.app_metadata.role (set via Supabase Admin API)
 *
 * Enforces that only 'admin' or 'executive' are accepted as valid roles.
 */
export async function getUserRoleFromSupabase(
  userId: string,
  user?: User | null
): Promise<UserRole | null> {
  const details = await getUserRoleDetailsFromSupabase(userId, user);
  return details ? details.role : null;
}

export interface SupabaseAuthResult {
  success: boolean;
  configured: boolean;
  user?: {
    id: string;
    email: string;
    role: UserRole;
    name: string;
    authProvider: "supabase";
  };
  error?: string;
  code?: string;
}

/**
 * Authenticate a user via Supabase Auth and verify their assigned club role.
 * Both Admin and Executive Member have equal content management rights.
 */
export async function authenticateWithSupabase(
  email: string,
  passwordAttempt: string
): Promise<SupabaseAuthResult> {
  if (!isSupabaseConfigured()) {
    return {
      success: false,
      configured: false,
      error:
        "Supabase credentials are not configured. Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local.",
      code: "SUPABASE_NOT_CONFIGURED",
    };
  }

  const supabase = getSupabaseServerClient();
  if (!supabase) {
    return {
      success: false,
      configured: false,
      error: "Failed to initialize Supabase server client.",
      code: "CLIENT_INIT_FAILED",
    };
  }

  try {
    // Authenticate with Supabase Auth
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password: passwordAttempt,
    });

    if (error || !data.user) {
      return {
        success: false,
        configured: true,
        error: error?.message || "Invalid email or password.",
        code: error?.code || "INVALID_CREDENTIALS",
      };
    }

    const sbUser = data.user;
    const userEmail = sbUser.email || email.trim().toLowerCase();

    // Verify assigned role and status on the server
    const roleDetails = await getUserRoleDetailsFromSupabase(sbUser.id, sbUser);

    if (!roleDetails || !roleDetails.role) {
      return {
        success: false,
        configured: true,
        error:
          "Access Denied: Your account was authenticated, but has not been assigned an approved club role ('admin' or 'executive'). Please contact club administration to request access.",
        code: "UNAUTHORIZED_ROLE",
      };
    }

    if (roleDetails.role === "executive" && roleDetails.status === "disabled") {
      return {
        success: false,
        configured: true,
        error:
          "Access Denied: Your Executive Member account has been deactivated by club administration.",
        code: "ACCOUNT_DISABLED",
      };
    }

    const role = roleDetails.role;
    const roleName =
      role === "admin" ? "Club Administrator" : "Executive Member";

    const resolvedName =
      roleDetails.fullName ||
      (sbUser.user_metadata?.full_name as string) ||
      roleName;

    return {
      success: true,
      configured: true,
      user: {
        id: sbUser.id,
        email: userEmail,
        role,
        name: resolvedName,
        authProvider: "supabase",
      },
    };
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : "Supabase authentication failed.";
    console.error("Supabase authentication error:", message);
    return {
      success: false,
      configured: true,
      error: message,
      code: "AUTH_EXCEPTION",
    };
  }
}
