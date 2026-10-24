"use client";

import { Activity, ActivityStatus } from "@/data/activities";
import {
  subscribeToRealtimeTable,
  RealtimeChangePayload,
} from "@/lib/realtimeSync";

const STORAGE_KEY = "shutterscape_activities_store_v1";
export const ACTIVITIES_UPDATED_EVENT = "shutterscape_activities_updated";

/**
 * Retrieve cached activities from local storage.
 * Returns an empty array if no cached records exist.
 */
export function getStoredActivities(): Activity[] {
  if (typeof window === "undefined") {
    return [];
  }

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return [];
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed;
    }
    return [];
  } catch (err) {
    console.error("Error loading activities from local storage:", err);
    return [];
  }
}

function broadcastActivityChange(activities: Activity[]) {
  if (typeof window !== "undefined") {
    window.dispatchEvent(
      new CustomEvent(ACTIVITIES_UPDATED_EVENT, { detail: activities })
    );
  }
}

/**
 * Fetch activities from the backend API (Supabase), update local cache, and broadcast changes.
 */
export async function fetchActivities(): Promise<Activity[]> {
  if (typeof window === "undefined") {
    return [];
  }

  try {
    const res = await fetch("/api/content/activities", {
      method: "GET",
      cache: "no-store",
    });

    if (!res.ok) {
      console.warn(`Activities API returned status ${res.status}, using local storage fallback.`);
      return getStoredActivities();
    }

    const json = await res.json();
    if (json.success && Array.isArray(json.data)) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(json.data));
      broadcastActivityChange(json.data);
      return json.data;
    }

    return getStoredActivities();
  } catch (err) {
    console.warn("Could not fetch activities from server, using local storage fallback:", err);
    return getStoredActivities();
  }
}

/**
 * Save or insert an activity.
 * Both Admin and Executive Member call this with equal access.
 */
export async function saveActivity(
  newActivity: Activity
): Promise<{ success: boolean; error?: string }> {
  if (typeof window === "undefined") {
    return { success: false, error: "Cannot save activity in server context" };
  }

  try {
    // 1. Verify and persist with secure backend API
    const res = await fetch("/api/content/activities", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newActivity),
    });

    const data = await res.json().catch(() => null);

    if (!res.ok || (data && data.success === false)) {
      const errorMsg =
        data?.error ||
        (res.status === 401 || res.status === 403
          ? "Unauthorized: Valid Admin or Executive login required."
          : `Failed to save activity (${res.status})`);
      console.error("Activity save error from backend:", errorMsg);
      return { success: false, error: errorMsg };
    }

    // 2. Persist locally for immediate client reactivity
    const current = getStoredActivities();
    const existingIndex = current.findIndex((a) => a.id === newActivity.id);

    let updated: Activity[];
    if (existingIndex >= 0) {
      updated = [...current];
      updated[existingIndex] = { ...current[existingIndex], ...newActivity };
    } else {
      updated = [newActivity, ...current];
    }

    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    broadcastActivityChange(updated);
    return { success: true };
  } catch (err: unknown) {
    console.error("Error persisting activity:", err);
    const message = err instanceof Error ? err.message : "Failed to save activity";
    return { success: false, error: message };
  }
}

/**
 * Delete an activity by ID.
 * Both Admin and Executive Member have equal deletion rights.
 */
export async function deleteActivity(
  id: string
): Promise<{ success: boolean; error?: string }> {
  if (typeof window === "undefined") {
    return { success: false, error: "Cannot delete activity in server context" };
  }

  try {
    // 1. Call server API
    const res = await fetch(`/api/content/activities?id=${encodeURIComponent(id)}`, {
      method: "DELETE",
    });

    const data = await res.json().catch(() => null);

    if (!res.ok || (data && data.success === false)) {
      const errorMsg =
        data?.error ||
        (res.status === 401 || res.status === 403
          ? "Unauthorized: Valid Admin or Executive login required."
          : `Failed to delete activity (${res.status})`);
      console.error("Activity deletion error from backend:", errorMsg);
      return { success: false, error: errorMsg };
    }

    // 2. Update local state
    const current = getStoredActivities();
    const updated = current.filter((a) => a.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    broadcastActivityChange(updated);
    return { success: true };
  } catch (err) {
    console.error("Error deleting activity:", err);
    return { success: false, error: "Failed to delete activity" };
  }
}

function mapDbRowToActivity(row: Record<string, unknown>): Activity {
  return {
    id: String(row.id || ""),
    title: String(row.title || ""),
    category: (row.category as Activity["category"]) || "Photo Walk",
    shortDescription: String(row.short_description || row.shortDescription || ""),
    fullDescription: String(row.full_description || row.fullDescription || ""),
    coverImage: String(row.cover_image || row.coverImage || ""),
    galleryImages: Array.isArray(row.gallery_images)
      ? (row.gallery_images as string[])
      : Array.isArray(row.galleryImages)
      ? (row.galleryImages as string[])
      : [],
    startDate: String(row.start_date || row.startDate || ""),
    endDate: row.end_date ? String(row.end_date) : row.endDate ? String(row.endDate) : undefined,
    time: row.time ? String(row.time) : undefined,
    venue: String(row.venue || ""),
    status: (String(row.status || "upcoming").toLowerCase()) as ActivityStatus,
    registrationStatus: (row.registration_status || row.registrationStatus) as Activity["registrationStatus"],
    registrationUrl: row.registration_url ? String(row.registration_url) : row.registrationUrl ? String(row.registrationUrl) : undefined,
    isFeaturedUpcoming: Boolean(row.is_featured_upcoming ?? row.isFeaturedUpcoming),
    published: typeof row.published === "boolean" ? row.published : true,
    year: typeof row.year === "number"
      ? row.year
      : parseInt(String(row.year || ""), 10) || (row.start_date ? parseInt(String(row.start_date).split("-")[0], 10) : new Date().getFullYear()),
  };
}

let unsubRealtimeActivities: (() => void) | null = null;
let realtimeActivitiesRefCount = 0;

function handleRealtimeActivityEvent(payload?: RealtimeChangePayload) {
  if (!payload || payload.eventType === "*") {
    fetchActivities();
    return;
  }

  const current = getStoredActivities();

  if (payload.eventType === "DELETE") {
    const deletedId = (payload.old?.id || payload.new?.id) as string;
    if (deletedId) {
      const updated = current.filter((a) => a.id !== deletedId);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      broadcastActivityChange(updated);
    }
    fetchActivities();
    return;
  }

  if (payload.eventType === "INSERT" || payload.eventType === "UPDATE") {
    const rawRow = payload.new;
    if (!rawRow || !rawRow.id) {
      fetchActivities();
      return;
    }

    const activity = mapDbRowToActivity(rawRow);

    // If item is unpublished, remove it from visible local cache
    if (activity.published === false) {
      const updated = current.filter((a) => a.id !== activity.id);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      broadcastActivityChange(updated);
      fetchActivities();
      return;
    }

    const existingIdx = current.findIndex((a) => a.id === activity.id);
    let updated: Activity[];
    if (existingIdx >= 0) {
      updated = [...current];
      updated[existingIdx] = { ...current[existingIdx], ...activity };
    } else {
      updated = [activity, ...current];
    }

    updated.sort((a, b) => new Date(b.startDate || 0).getTime() - new Date(a.startDate || 0).getTime());

    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    broadcastActivityChange(updated);

    fetchActivities();
  }
}

function attachRealtimeActivities() {
  if (typeof window === "undefined") return () => {};
  realtimeActivitiesRefCount++;
  if (!unsubRealtimeActivities) {
    unsubRealtimeActivities = subscribeToRealtimeTable("activities", handleRealtimeActivityEvent);
  }
  return () => {
    realtimeActivitiesRefCount = Math.max(0, realtimeActivitiesRefCount - 1);
    if (realtimeActivitiesRefCount === 0 && unsubRealtimeActivities) {
      unsubRealtimeActivities();
      unsubRealtimeActivities = null;
    }
  };
}

/**
 * Subscribe to activity updates across components.
 * Automatically manages Supabase Realtime synchronization, local storage events,
 * and component unmounting cleanup.
 */
export function subscribeActivities(callback: (activities: Activity[]) => void): () => void {
  if (typeof window === "undefined") return () => {};

  const detachRealtime = attachRealtimeActivities();

  const handler = () => {
    callback(getStoredActivities());
  };

  window.addEventListener(ACTIVITIES_UPDATED_EVENT, handler);
  window.addEventListener("storage", handler);

  return () => {
    detachRealtime();
    window.removeEventListener(ACTIVITIES_UPDATED_EVENT, handler);
    window.removeEventListener("storage", handler);
  };
}

/**
 * Reset activities store to empty state.
 */
export function resetActivitiesToDefault(): Activity[] {
  if (typeof window !== "undefined") {
    try {
      localStorage.removeItem(STORAGE_KEY);
      broadcastActivityChange([]);
    } catch (err) {
      console.error("Error resetting activities:", err);
    }
  }
  return [];
}
