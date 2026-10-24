import {
  subscribeToRealtimeTable,
  RealtimeChangePayload,
} from "@/lib/realtimeSync";

/**
 * Like Service for ShutterScape Gallery
 * 
 * Manages visitor identity, optimistic UI updates, atomic database persistence,
 * server rate-limit reconciliation, and concurrency-safe duplicate prevention.
 */

export interface LikeState {
  count: number;
  hasLiked: boolean;
  isPending?: boolean;
}

const STORAGE_KEY_LIKES = "shutterscape_gallery_likes_v2";
const STORAGE_KEY_USER_LIKED = "shutterscape_gallery_user_liked_v2";
const STORAGE_KEY_VISITOR_TOKEN = "shutterscape_visitor_token_v2";

type LikeListener = (photoId: string, state: LikeState) => void;
type ErrorListener = (photoId: string, error: string) => void;

class GalleryLikeService {
  private listeners: Set<LikeListener> = new Set();
  private errorListeners: Set<ErrorListener> = new Set();
  private likeCounts: Record<string, number> = {};
  private userLikedMap: Record<string, boolean> = {};
  private pendingPhotos: Set<string> = new Set();
  private visitorToken: string = "";
  private isInitialized = false;
  private unsubRealtime: (() => void) | null = null;

  private init() {
    if (this.isInitialized) return;
    if (typeof window === "undefined") return;

    try {
      // 1. Initialize or load persistent anonymous visitor token
      let token = localStorage.getItem(STORAGE_KEY_VISITOR_TOKEN);
      if (!token || token.length < 8) {
        token = `vst_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 10)}${Math.random().toString(36).substring(2, 10)}`;
        localStorage.setItem(STORAGE_KEY_VISITOR_TOKEN, token);
      }
      this.visitorToken = token;

      // 2. Load cached like counts and user likes
      const storedCounts = localStorage.getItem(STORAGE_KEY_LIKES);
      if (storedCounts) {
        this.likeCounts = JSON.parse(storedCounts);
      }

      const storedUserLikes = localStorage.getItem(STORAGE_KEY_USER_LIKED);
      if (storedUserLikes) {
        this.userLikedMap = JSON.parse(storedUserLikes);
      }
    } catch (err) {
      console.warn("Failed to read like state from localStorage:", err);
    }

    // 3. Attach Supabase Realtime subscription to gallery_photos for live cross-visitor like counters
    if (!this.unsubRealtime) {
      this.unsubRealtime = subscribeToRealtimeTable("gallery_photos", (payload) => {
        if (payload) {
          this.handleRemoteUpdate(payload);
        }
      });
    }

    this.isInitialized = true;
  }

  private save() {
    if (typeof window === "undefined") return;
    try {
      localStorage.setItem(STORAGE_KEY_LIKES, JSON.stringify(this.likeCounts));
      localStorage.setItem(STORAGE_KEY_USER_LIKED, JSON.stringify(this.userLikedMap));
    } catch (err) {
      console.warn("Failed to persist like state to localStorage:", err);
    }
  }

  /**
   * Process Realtime changes on gallery_photos table.
   * Authoritatively updates persisted like counts and notifies active components.
   */
  public handleRemoteUpdate(payload: RealtimeChangePayload): void {
    if (payload.eventType === "UPDATE" && payload.new) {
      const photoId = String(payload.new.id || "");
      const newCount = typeof payload.new.likes_count === "number" ? payload.new.likes_count : undefined;
      if (photoId && typeof newCount === "number") {
        this.updateRemoteCount(photoId, newCount);
      }
    } else if (payload.eventType === "DELETE" && (payload.old || payload.new)) {
      const photoId = String(payload.old?.id || payload.new?.id || "");
      if (photoId) {
        delete this.likeCounts[photoId];
        delete this.userLikedMap[photoId];
        this.save();
      }
    } else if (payload.eventType === "*") {
      const activeIds = Object.keys(this.likeCounts);
      if (activeIds.length > 0) {
        this.syncFromServer(activeIds);
      }
    }
  }

  /**
   * Applies an authoritative count update received from Supabase Realtime.
   * Concurrency-safe: prevents clobbering in-flight user toggles.
   */
  public updateRemoteCount(photoId: string, authoritativeCount: number): void {
    this.init();
    if (this.pendingPhotos.has(photoId)) {
      return;
    }

    const safeCount = Math.max(0, authoritativeCount);
    if (this.likeCounts[photoId] === safeCount) {
      return;
    }

    this.likeCounts[photoId] = safeCount;
    this.save();

    this.notify(photoId, {
      count: safeCount,
      hasLiked: Boolean(this.userLikedMap[photoId]),
      isPending: false,
    });
  }

  /**
   * Returns the current persistent anonymous visitor token
   */
  public getVisitorToken(): string {
    this.init();
    return this.visitorToken;
  }

  /**
   * Checks whether a like request is currently in-flight for a photo
   */
  public isPending(photoId: string): boolean {
    return this.pendingPhotos.has(photoId);
  }

  /**
   * Returns current like state for a photo
   */
  public getLikeState(photoId: string, fallbackCount: number = 0): LikeState {
    this.init();
    const count = typeof this.likeCounts[photoId] === "number"
      ? this.likeCounts[photoId]
      : Math.max(0, fallbackCount);

    return {
      count,
      hasLiked: Boolean(this.userLikedMap[photoId]),
      isPending: this.pendingPhotos.has(photoId),
    };
  }

  /**
   * Sync authoritative like counts and visitor like status from backend API
   */
  public async syncFromServer(photoIds?: string[]): Promise<void> {
    this.init();
    const token = this.getVisitorToken();
    if (!token) return;

    try {
      const res = await fetch(`/api/content/gallery/like?visitorToken=${encodeURIComponent(token)}`, {
        method: "GET",
        cache: "no-store",
      });

      if (!res.ok) {
        console.warn(`Sync likes returned status ${res.status}`);
        return;
      }

      const data = await res.json().catch(() => null);
      if (data?.success) {
        const likedSet = new Set<string>(data.likedPhotoIds || []);
        const counts: Record<string, number> = data.counts || {};

        // Update counts
        Object.keys(counts).forEach((id) => {
          this.likeCounts[id] = counts[id];
        });

        // Update visitor liked status
        const relevantIds = photoIds && photoIds.length > 0 ? photoIds : Object.keys(counts);
        relevantIds.forEach((id) => {
          this.userLikedMap[id] = likedSet.has(id);
        });

        this.save();

        // Broadcast updated states
        relevantIds.forEach((id) => {
          this.notify(id, {
            count: this.likeCounts[id] ?? 0,
            hasLiked: Boolean(this.userLikedMap[id]),
            isPending: this.pendingPhotos.has(id),
          });
        });
      }
    } catch (err) {
      console.warn("Could not sync likes from server:", err);
    }
  }

  /**
   * Atomically toggles like state with optimistic UI and error rollback.
   * Prevents concurrent duplicate requests.
   */
  public async toggleLike(
    photoId: string,
    fallbackCount: number = 0
  ): Promise<{ success: boolean; state: LikeState; error?: string }> {
    this.init();

    // 1. Concurrency guard: ignore if a request for this photo is already pending
    if (this.pendingPhotos.has(photoId)) {
      return { success: false, state: this.getLikeState(photoId, fallbackCount), error: "Request already pending." };
    }

    const previousState = this.getLikeState(photoId, fallbackCount);
    const newHasLiked = !previousState.hasLiked;
    const optimisticCount = newHasLiked
      ? previousState.count + 1
      : Math.max(0, previousState.count - 1);

    // 2. Mark pending and apply optimistic update
    this.pendingPhotos.add(photoId);
    this.userLikedMap[photoId] = newHasLiked;
    this.likeCounts[photoId] = optimisticCount;
    this.save();

    const optimisticState: LikeState = {
      count: optimisticCount,
      hasLiked: newHasLiked,
      isPending: true,
    };
    this.notify(photoId, optimisticState);

    // 3. Send real backend request
    try {
      const res = await fetch("/api/content/gallery/like", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          photoId,
          visitorToken: this.getVisitorToken(),
        }),
      });

      const data = await res.json().catch(() => null);

      if (!res.ok || !data?.success) {
        const errorMsg = data?.error || `Server responded with status ${res.status}`;
        throw new Error(errorMsg);
      }

      // 4. Reconcile with authoritative server state
      const confirmedCount = typeof data.likesCount === "number" ? data.likesCount : optimisticCount;
      const confirmedHasLiked = typeof data.hasLiked === "boolean" ? data.hasLiked : newHasLiked;

      this.pendingPhotos.delete(photoId);
      this.likeCounts[photoId] = confirmedCount;
      this.userLikedMap[photoId] = confirmedHasLiked;
      this.save();

      const finalState: LikeState = {
        count: confirmedCount,
        hasLiked: confirmedHasLiked,
        isPending: false,
      };
      this.notify(photoId, finalState);

      return { success: true, state: finalState };
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : "Failed to record like.";
      console.error(`Like toggle failed for ${photoId}:`, errorMsg);

      // 5. Rollback on failure
      this.pendingPhotos.delete(photoId);
      this.likeCounts[photoId] = previousState.count;
      this.userLikedMap[photoId] = previousState.hasLiked;
      this.save();

      const rollbackState: LikeState = {
        count: previousState.count,
        hasLiked: previousState.hasLiked,
        isPending: false,
      };
      this.notify(photoId, rollbackState);
      this.notifyError(photoId, errorMsg);

      return { success: false, state: rollbackState, error: errorMsg };
    }
  }

  private notify(photoId: string, state: LikeState) {
    this.listeners.forEach((listener) => {
      try {
        listener(photoId, state);
      } catch (err) {
        console.error("Error in like listener:", err);
      }
    });
  }

  private notifyError(photoId: string, error: string) {
    this.errorListeners.forEach((listener) => {
      try {
        listener(photoId, error);
      } catch (err) {
        console.error("Error in like error listener:", err);
      }
    });
  }

  /**
   * Subscribe to like state changes across all gallery components
   */
  public subscribe(listener: LikeListener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  /**
   * Subscribe to error notifications for user feedback
   */
  public subscribeErrors(listener: ErrorListener): () => void {
    this.errorListeners.add(listener);
    return () => {
      this.errorListeners.delete(listener);
    };
  }
}

// Global singleton instance
export const likeService = new GalleryLikeService();

/**
 * Helper to format like count into natural string
 * e.g., "0 likes", "1 like", "24 likes"
 */
export function formatLikes(count: number): string {
  const safeCount = Math.max(0, count || 0);
  return safeCount === 1 ? "1 like" : `${safeCount} likes`;
}
