"use client";

import { GalleryPhoto, GalleryCategory } from "@/data/gallery";
import {
  subscribeToRealtimeTable,
  RealtimeChangePayload,
} from "@/lib/realtimeSync";

const STORAGE_KEY = "shutterscape_gallery_store_v1";
export const GALLERY_UPDATED_EVENT = "shutterscape_gallery_updated";

/**
 * Retrieve cached gallery photographs from local storage.
 * Returns an empty array if no cached records exist.
 */
export function getStoredGallery(): GalleryPhoto[] {
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
    console.error("Error loading gallery photos from local storage:", err);
    return [];
  }
}

function broadcastGalleryChange(photos: GalleryPhoto[]) {
  if (typeof window !== "undefined") {
    window.dispatchEvent(
      new CustomEvent(GALLERY_UPDATED_EVENT, { detail: photos })
    );
  }
}

/**
 * Fetch gallery photographs from backend API (Supabase), update local cache, and broadcast changes.
 */
export async function fetchGalleryPhotos(): Promise<GalleryPhoto[]> {
  if (typeof window === "undefined") {
    return [];
  }

  try {
    const res = await fetch("/api/content/gallery", {
      method: "GET",
      cache: "no-store",
    });

    if (!res.ok) {
      console.warn(`Gallery API returned status ${res.status}, using local storage fallback.`);
      return getStoredGallery();
    }

    const json = await res.json();
    if (json.success && Array.isArray(json.data)) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(json.data));
      broadcastGalleryChange(json.data);
      return json.data;
    }

    return getStoredGallery();
  } catch (err) {
    console.warn("Could not fetch gallery photos from server, using local storage fallback:", err);
    return getStoredGallery();
  }
}

/**
 * Save or insert a photograph.
 * Admin and Executive Member have equal access.
 */
export async function saveGalleryPhoto(
  newPhoto: GalleryPhoto
): Promise<{ success: boolean; error?: string }> {
  if (typeof window === "undefined") {
    return { success: false, error: "Cannot save photograph in server context" };
  }

  try {
    // 1. Authorize and persist with backend API
    const res = await fetch("/api/content/gallery", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newPhoto),
    });

    const data = await res.json().catch(() => null);

    if (!res.ok || (data && data.success === false)) {
      const errorMsg =
        data?.error ||
        (res.status === 401 || res.status === 403
          ? "Unauthorized: Valid Admin or Executive login required."
          : `Failed to save photograph (${res.status})`);
      console.error("Gallery save error from backend:", errorMsg);
      return { success: false, error: errorMsg };
    }

    // 2. Persist in local storage
    const current = getStoredGallery();
    const existingIndex = current.findIndex((p) => p.id === newPhoto.id);

    let updated: GalleryPhoto[];
    if (existingIndex >= 0) {
      updated = [...current];
      updated[existingIndex] = { ...current[existingIndex], ...newPhoto };
    } else {
      updated = [newPhoto, ...current];
    }

    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    broadcastGalleryChange(updated);
    return { success: true };
  } catch (err: unknown) {
    console.error("Error persisting gallery photo:", err);
    const message = err instanceof Error ? err.message : "Failed to save photo";
    return { success: false, error: message };
  }
}

/**
 * Save multiple photographs (for multi-upload support).
 */
export async function saveMultipleGalleryPhotos(
  newPhotos: GalleryPhoto[]
): Promise<{ success: boolean; error?: string }> {
  if (typeof window === "undefined") {
    return { success: false, error: "Cannot save photographs in server context" };
  }

  try {
    const res = await fetch("/api/content/gallery", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newPhotos),
    });

    const data = await res.json().catch(() => null);

    if (!res.ok || (data && data.success === false)) {
      const errorMsg =
        data?.error ||
        (res.status === 401 || res.status === 403
          ? "Unauthorized: Valid Admin or Executive login required."
          : `Failed to save photographs (${res.status})`);
      console.error("Gallery batch save error from backend:", errorMsg);
      return { success: false, error: errorMsg };
    }

    const current = getStoredGallery();
    const newIds = new Set(newPhotos.map((p) => p.id));
    const filteredCurrent = current.filter((p) => !newIds.has(p.id));
    const updated = [...newPhotos, ...filteredCurrent];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    broadcastGalleryChange(updated);
    return { success: true };
  } catch (err: unknown) {
    console.error("Error persisting multiple gallery photos:", err);
    const message = err instanceof Error ? err.message : "Failed to save photos";
    return { success: false, error: message };
  }
}

/**
 * Delete a photograph by ID.
 * Admin and Executive Member have equal access.
 */
export async function deleteGalleryPhoto(
  id: string
): Promise<{ success: boolean; error?: string }> {
  if (typeof window === "undefined") {
    return { success: false, error: "Cannot delete photograph in server context" };
  }

  try {
    const res = await fetch(`/api/content/gallery?id=${encodeURIComponent(id)}`, {
      method: "DELETE",
    });

    const data = await res.json().catch(() => null);

    if (!res.ok || (data && data.success === false)) {
      const errorMsg =
        data?.error ||
        (res.status === 401 || res.status === 403
          ? "Unauthorized: Valid Admin or Executive login required."
          : `Failed to delete photograph (${res.status})`);
      console.error("Gallery deletion error from backend:", errorMsg);
      return { success: false, error: errorMsg };
    }

    const current = getStoredGallery();
    const updated = current.filter((p) => p.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    broadcastGalleryChange(updated);
    return { success: true };
  } catch (err) {
    console.error("Error deleting gallery photo:", err);
    return { success: false, error: "Failed to delete photograph" };
  }
}

/**
 * Reorder gallery photos.
 */
export async function reorderGallery(
  reordered: GalleryPhoto[]
): Promise<{ success: boolean; error?: string }> {
  if (typeof window === "undefined") {
    return { success: false, error: "Cannot reorder in server context" };
  }

  try {
    const res = await fetch("/api/content/gallery", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(reordered),
    });

    if (!res.ok) {
      const data = await res.json().catch(() => null);
      if (res.status === 401 || res.status === 403) {
        return {
          success: false,
          error: data?.error || "Unauthorized: Valid Admin or Executive login required.",
        };
      }
    }

    localStorage.setItem(STORAGE_KEY, JSON.stringify(reordered));
    broadcastGalleryChange(reordered);
    return { success: true };
  } catch (err) {
    console.error("Error reordering gallery:", err);
    return { success: false, error: "Failed to reorder gallery" };
  }
}

function mapDbRowToGalleryPhoto(row: any): GalleryPhoto {
  return {
    id: row.id,
    title: row.title,
    caption: row.caption || "",
    category: (row.category || "Campus") as GalleryCategory,
    additionalCategories: Array.isArray(row.additional_categories) ? row.additional_categories : [],
    photographer: row.photographer,
    avatarInitials: row.avatar_initials || "",
    date: row.photo_date || row.created_at?.split("T")[0] || "",
    formattedDate: row.formatted_date || undefined,
    location: row.location || "GCU Campus, Azara",
    imageSrc: row.image_src || row.imageSrc || "",
    alt: row.alt || `${row.title} by ${row.photographer}`,
    aspectRatio: (row.aspect_ratio || "standard") as "landscape" | "portrait" | "standard" | "wide",
    gridSpanClass: row.grid_span_class || "col-span-6 md:col-span-6 lg:col-span-3",
    initialLikes: typeof row.likes_count === "number" ? Math.max(0, row.likes_count) : 0,
    likesCount: typeof row.likes_count === "number" ? Math.max(0, row.likes_count) : 0,
    published: row.published ?? true,
    displayOrder: row.display_order ?? 0,
  };
}

let unsubRealtimeGallery: (() => void) | null = null;
let realtimeGalleryRefCount = 0;

function handleRealtimeGalleryEvent(payload?: RealtimeChangePayload) {
  if (!payload || payload.eventType === "*") {
    fetchGalleryPhotos();
    return;
  }

  const current = getStoredGallery();

  if (payload.eventType === "DELETE") {
    const deletedId = (payload.old?.id || payload.new?.id) as string;
    if (deletedId) {
      const updated = current.filter((p) => p.id !== deletedId);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      broadcastGalleryChange(updated);
    }
    fetchGalleryPhotos();
    return;
  }

  if (payload.eventType === "INSERT" || payload.eventType === "UPDATE") {
    const rawRow = payload.new;
    if (!rawRow || !rawRow.id) {
      fetchGalleryPhotos();
      return;
    }

    const photo = mapDbRowToGalleryPhoto(rawRow);

    // If photo was unpublished, remove it from visible local cache
    if (photo.published === false) {
      const updated = current.filter((p) => p.id !== photo.id);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      broadcastGalleryChange(updated);
      fetchGalleryPhotos();
      return;
    }

    const existingIdx = current.findIndex((p) => p.id === photo.id);
    let updated: GalleryPhoto[];
    if (existingIdx >= 0) {
      updated = [...current];
      const currentLikes = updated[existingIdx].likesCount;
      updated[existingIdx] = {
        ...current[existingIdx],
        ...photo,
        likesCount: typeof photo.likesCount === "number" ? photo.likesCount : currentLikes,
      };
    } else {
      updated = [photo, ...current];
    }

    updated.sort((a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0));

    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    broadcastGalleryChange(updated);

    fetchGalleryPhotos();
  }
}

function attachRealtimeGallery() {
  if (typeof window === "undefined") return () => {};
  realtimeGalleryRefCount++;
  if (!unsubRealtimeGallery) {
    unsubRealtimeGallery = subscribeToRealtimeTable("gallery_photos", handleRealtimeGalleryEvent);
  }
  return () => {
    realtimeGalleryRefCount = Math.max(0, realtimeGalleryRefCount - 1);
    if (realtimeGalleryRefCount === 0 && unsubRealtimeGallery) {
      unsubRealtimeGallery();
      unsubRealtimeGallery = null;
    }
  };
}

/**
 * Subscribe to gallery updates across components.
 * Automatically manages Supabase Realtime synchronization, local storage events,
 * and component unmounting cleanup.
 */
export function subscribeGallery(callback: (photos: GalleryPhoto[]) => void): () => void {
  if (typeof window === "undefined") return () => {};

  const detachRealtime = attachRealtimeGallery();

  const handler = () => {
    callback(getStoredGallery());
  };

  window.addEventListener(GALLERY_UPDATED_EVENT, handler);
  window.addEventListener("storage", handler);

  return () => {
    detachRealtime();
    window.removeEventListener(GALLERY_UPDATED_EVENT, handler);
    window.removeEventListener("storage", handler);
  };
}

/**
 * Reset gallery store to empty state.
 */
export function resetGalleryToDefault(): GalleryPhoto[] {
  if (typeof window !== "undefined") {
    try {
      localStorage.removeItem(STORAGE_KEY);
      broadcastGalleryChange([]);
    } catch (err) {
      console.error("Error resetting gallery:", err);
    }
  }
  return [];
}
