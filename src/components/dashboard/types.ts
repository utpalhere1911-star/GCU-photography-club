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

export function formatToKolkata(dateStr: string | null | undefined): string {
  if (!dateStr) return "Never";
  try {
    const d = new Date(dateStr);
    return new Intl.DateTimeFormat("en-IN", {
      timeZone: "Asia/Kolkata",
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: true,
    }).format(d);
  } catch {
    return dateStr;
  }
}
