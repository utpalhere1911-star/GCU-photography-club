"use client";

import { TeamMember, teamMembers } from "@/data/team";
import {
  subscribeToRealtimeTable,
  RealtimeChangePayload,
} from "@/lib/realtimeSync";

const STORAGE_KEY = "shutterscape_team_store_v1";
export const TEAM_UPDATED_EVENT = "shutterscape_team_updated";

/**
 * Retrieve all team members, falling back to seed teamMembers if no local storage exists.
 */
export function getStoredTeam(): TeamMember[] {
  if (typeof window === "undefined") {
    return teamMembers;
  }

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(teamMembers));
      return teamMembers;
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed;
    }
    return teamMembers;
  } catch (err) {
    console.error("Error loading team from local storage:", err);
    return teamMembers;
  }
}

function broadcastTeamChange(team: TeamMember[]) {
  if (typeof window !== "undefined") {
    window.dispatchEvent(
      new CustomEvent(TEAM_UPDATED_EVENT, { detail: team })
    );
  }
}

/**
 * Fetch team members from backend API (Supabase), update local cache, and broadcast changes.
 */
export async function fetchTeam(): Promise<TeamMember[]> {
  if (typeof window === "undefined") {
    return teamMembers;
  }

  try {
    const res = await fetch("/api/content/team", {
      method: "GET",
      cache: "no-store",
    });

    if (!res.ok) {
      console.warn(`Team API returned status ${res.status}, using local storage fallback.`);
      return getStoredTeam();
    }

    const json = await res.json();
    if (json.success && Array.isArray(json.data)) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(json.data));
      broadcastTeamChange(json.data);
      return json.data;
    }

    return getStoredTeam();
  } catch (err) {
    console.warn("Could not fetch team from server, using local storage fallback:", err);
    return getStoredTeam();
  }
}

/**
 * Save or insert a team member.
 * Admin and Executive Member have equal access.
 */
export async function saveTeamMember(
  newMember: TeamMember
): Promise<{ success: boolean; error?: string }> {
  if (typeof window === "undefined") {
    return { success: false, error: "Cannot save team member in server context" };
  }

  try {
    // 1. Authorize with backend API
    const res = await fetch("/api/content/team", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newMember),
    });

    const data = await res.json().catch(() => null);

    if (!res.ok || (data && data.success === false)) {
      const errorMsg =
        data?.error ||
        (res.status === 401 || res.status === 403
          ? "Unauthorized: Valid Admin or Executive login required."
          : `Failed to save team member (${res.status})`);
      console.error("Team member save error from backend:", errorMsg);
      return { success: false, error: errorMsg };
    }

    // 2. Persist in local storage
    const current = getStoredTeam();
    const existingIndex = current.findIndex((m) => m.id === newMember.id);

    let updated: TeamMember[];
    if (existingIndex >= 0) {
      updated = [...current];
      updated[existingIndex] = { ...current[existingIndex], ...newMember };
    } else {
      updated = [...current, newMember];
    }

    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    broadcastTeamChange(updated);
    return { success: true };
  } catch (err: unknown) {
    console.error("Error persisting team member:", err);
    const message = err instanceof Error ? err.message : "Failed to save team member";
    return { success: false, error: message };
  }
}

/**
 * Delete a team member by ID.
 * Admin and Executive Member have equal access.
 */
export async function deleteTeamMember(
  id: string
): Promise<{ success: boolean; error?: string }> {
  if (typeof window === "undefined") {
    return { success: false, error: "Cannot delete team member in server context" };
  }

  try {
    const res = await fetch(`/api/content/team?id=${encodeURIComponent(id)}`, {
      method: "DELETE",
    });

    const data = await res.json().catch(() => null);

    if (!res.ok || (data && data.success === false)) {
      const errorMsg =
        data?.error ||
        (res.status === 401 || res.status === 403
          ? "Unauthorized: Valid Admin or Executive login required."
          : `Failed to delete team member (${res.status})`);
      console.error("Team member deletion error from backend:", errorMsg);
      return { success: false, error: errorMsg };
    }

    const current = getStoredTeam();
    const updated = current.filter((m) => m.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    broadcastTeamChange(updated);
    return { success: true };
  } catch (err) {
    console.error("Error deleting team member:", err);
    return { success: false, error: "Failed to delete team member" };
  }
}

/**
 * Reorder team members.
 */
export async function reorderTeam(
  reordered: TeamMember[]
): Promise<{ success: boolean; error?: string }> {
  if (typeof window === "undefined") {
    return { success: false, error: "Cannot reorder team in server context" };
  }

  try {
    const res = await fetch("/api/content/team", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(reordered),
    });

    const data = await res.json().catch(() => null);

    if (!res.ok || (data && data.success === false)) {
      const errorMsg =
        data?.error ||
        (res.status === 401 || res.status === 403
          ? "Unauthorized: Valid Admin or Executive login required."
          : `Failed to reorder team (${res.status})`);
      return { success: false, error: errorMsg };
    }

    localStorage.setItem(STORAGE_KEY, JSON.stringify(reordered));
    broadcastTeamChange(reordered);
    return { success: true };
  } catch (err) {
    console.error("Error reordering team:", err);
    return { success: false, error: "Failed to reorder team" };
  }
}

function mapDbRowToTeamMember(row: any): TeamMember {
  return {
    id: row.id,
    name: row.name,
    role: row.role,
    category: row.category,
    initials: row.initials,
    department: row.department || undefined,
    photoUrl: row.photo_url || row.photoUrl || undefined,
    objectPosition: row.object_position || row.objectPosition || undefined,
  };
}

let unsubRealtimeTeam: (() => void) | null = null;
let realtimeTeamRefCount = 0;

function handleRealtimeTeamEvent(payload?: RealtimeChangePayload) {
  if (!payload || payload.eventType === "*") {
    fetchTeam();
    return;
  }

  const current = getStoredTeam();

  if (payload.eventType === "DELETE") {
    const deletedId = (payload.old?.id || payload.new?.id) as string;
    if (deletedId) {
      const updated = current.filter((m) => m.id !== deletedId);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      broadcastTeamChange(updated);
    }
    fetchTeam();
    return;
  }

  if (payload.eventType === "INSERT" || payload.eventType === "UPDATE") {
    const rawRow = payload.new;
    if (!rawRow || !rawRow.id) {
      fetchTeam();
      return;
    }

    const member = mapDbRowToTeamMember(rawRow);
    const existingIdx = current.findIndex((m) => m.id === member.id);
    let updated: TeamMember[];
    if (existingIdx >= 0) {
      updated = [...current];
      updated[existingIdx] = { ...current[existingIdx], ...member };
    } else {
      updated = [...current, member];
    }

    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    broadcastTeamChange(updated);

    fetchTeam();
  }
}

function attachRealtimeTeam() {
  if (typeof window === "undefined") return () => {};
  realtimeTeamRefCount++;
  if (!unsubRealtimeTeam) {
    unsubRealtimeTeam = subscribeToRealtimeTable("team_members", handleRealtimeTeamEvent);
  }
  return () => {
    realtimeTeamRefCount = Math.max(0, realtimeTeamRefCount - 1);
    if (realtimeTeamRefCount === 0 && unsubRealtimeTeam) {
      unsubRealtimeTeam();
      unsubRealtimeTeam = null;
    }
  };
}

/**
 * Subscribe to team updates across components.
 * Automatically manages Supabase Realtime synchronization, local storage events,
 * and component unmounting cleanup.
 */
export function subscribeTeam(callback: (team: TeamMember[]) => void): () => void {
  if (typeof window === "undefined") return () => {};

  const detachRealtime = attachRealtimeTeam();

  const handler = () => {
    callback(getStoredTeam());
  };

  window.addEventListener(TEAM_UPDATED_EVENT, handler);
  window.addEventListener("storage", handler);

  return () => {
    detachRealtime();
    window.removeEventListener(TEAM_UPDATED_EVENT, handler);
    window.removeEventListener("storage", handler);
  };
}

/**
 * Reset team store back to official default member list.
 */
export function resetTeamToDefault(): TeamMember[] {
  if (typeof window !== "undefined") {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(teamMembers));
      broadcastTeamChange(teamMembers);
    } catch (err) {
      console.error("Error resetting team:", err);
    }
  }
  return teamMembers;
}
