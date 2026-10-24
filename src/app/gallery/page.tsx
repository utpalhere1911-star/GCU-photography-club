"use client";

import React, { useState, useMemo, useEffect, useCallback } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import JoinModal from "@/components/JoinModal";
import SearchModal from "@/components/SearchModal";
import GalleryHero from "@/components/gallery/GalleryHero";
import GalleryToolbar, { SortOption } from "@/components/gallery/GalleryToolbar";
import GalleryGrid from "@/components/gallery/GalleryGrid";
import GalleryLightbox from "@/components/gallery/GalleryLightbox";
import { AlertCircle, X } from "lucide-react";
import {
  GalleryPhoto,
  GalleryCategory,
} from "@/data/gallery";
import { getStoredGallery, fetchGalleryPhotos, subscribeGallery } from "@/services/galleryService";
import { likeService, LikeState } from "@/services/likeService";
import { subscribeToRealtimeTable } from "@/lib/realtimeSync";

export default function GalleryPage() {
  const [photosList, setPhotosList] = useState<GalleryPhoto[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] =
    useState<GalleryCategory>("All");
  const [sortBy, setSortBy] = useState<SortOption>("newest");
  const [activeLightboxPhoto, setActiveLightboxPhoto] =
    useState<GalleryPhoto | null>(null);
  const [isJoinModalOpen, setIsJoinModalOpen] = useState(false);
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);

  // Reactive state map for photo likes: { [photoId]: { count, hasLiked, isPending } }
  const [likesMap, setLikesMap] = useState<Record<string, LikeState>>({});
  const [likeError, setLikeError] = useState<string | null>(null);

  const loadGalleryData = useCallback(async () => {
    try {
      setIsLoading(true);
      setLoadError(null);
      const fresh = await fetchGalleryPhotos();
      if (Array.isArray(fresh)) {
        setPhotosList(fresh);
        setLikesMap((prev) => {
          const next = { ...prev };
          fresh.forEach((photo) => {
            const initialCount = photo.likesCount ?? photo.initialLikes ?? 0;
            if (!next[photo.id]) {
              next[photo.id] = likeService.getLikeState(photo.id, initialCount);
            }
          });
          return next;
        });
        // Reconcile real counts and visitor liked status with Supabase
        likeService.syncFromServer(fresh.map((p) => p.id));
      }
    } catch (err) {
      console.error("Could not fetch gallery photos from server:", err);
      setLoadError("Failed to load gallery photos. Please check your network and try again.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Client-side initialization from localStorage & Supabase backend
  useEffect(() => {
    let isMounted = true;

    // 1. Instant cache load for immediate rendering without layout shift
    const currentPhotos = getStoredGallery();
    setPhotosList(currentPhotos);

    const loadedMap: Record<string, LikeState> = {};
    currentPhotos.forEach((photo) => {
      const initialCount = photo.likesCount ?? photo.initialLikes ?? 0;
      loadedMap[photo.id] = likeService.getLikeState(photo.id, initialCount);
    });
    setLikesMap(loadedMap);

    // Initial server reconciliation for cached photos
    if (currentPhotos.length > 0) {
      likeService.syncFromServer(currentPhotos.map((p) => p.id));
    }

    // 2. Fetch fresh gallery records from Supabase backend API
    fetchGalleryPhotos()
      .then((fresh) => {
        if (isMounted && Array.isArray(fresh)) {
          setPhotosList(fresh);
          setLikesMap((prev) => {
            const next = { ...prev };
            fresh.forEach((photo) => {
              const initialCount = photo.likesCount ?? photo.initialLikes ?? 0;
              if (!next[photo.id]) {
                next[photo.id] = likeService.getLikeState(photo.id, initialCount);
              }
            });
            return next;
          });
          setIsLoading(false);
          setLoadError(null);
          likeService.syncFromServer(fresh.map((p) => p.id));
        }
      })
      .catch((err) => {
        if (isMounted) {
          console.warn("Could not fetch latest gallery photos from server:", err);
          setIsLoading(false);
          setLoadError("Unable to fetch gallery photographs from server.");
        }
      });

    // 3. Subscribe to Realtime database changes across all clients
    const unsubRealtime = subscribeToRealtimeTable("gallery_photos", () => {
      fetchGalleryPhotos().then((fresh) => {
        if (isMounted && Array.isArray(fresh)) {
          setPhotosList(fresh);
          setLikesMap((prev) => {
            const next = { ...prev };
            fresh.forEach((photo) => {
              const initialCount = photo.likesCount ?? photo.initialLikes ?? 0;
              if (!next[photo.id]) {
                next[photo.id] = likeService.getLikeState(photo.id, initialCount);
              }
            });
            return next;
          });
          likeService.syncFromServer(fresh.map((p) => p.id));
        }
      });
    });

    // 4. Subscribe to gallery mutations (adds, edits, removals from dashboard on this client)
    const unsubGallery = subscribeGallery((updatedPhotos) => {
      if (isMounted && Array.isArray(updatedPhotos)) {
        setPhotosList(updatedPhotos);
        setLikesMap((prev) => {
          const next = { ...prev };
          updatedPhotos.forEach((photo) => {
            const initialCount = photo.likesCount ?? photo.initialLikes ?? 0;
            if (!next[photo.id]) {
              next[photo.id] = likeService.getLikeState(photo.id, initialCount);
            }
          });
          return next;
        });
        likeService.syncFromServer(updatedPhotos.map((p) => p.id));
      }
    });

    // 5. Subscribe to like changes (synchronizes all components reactively)
    const unsubLikes = likeService.subscribe((photoId, newState) => {
      setLikesMap((prev) => ({
        ...prev,
        [photoId]: newState,
      }));
    });

    // 6. Subscribe to user-facing like errors (e.g. rate limit, connection)
    const unsubErrors = likeService.subscribeErrors((_photoId, errorMsg) => {
      if (isMounted) {
        setLikeError(errorMsg);
        setTimeout(() => {
          setLikeError((prev) => (prev === errorMsg ? null : prev));
        }, 4000);
      }
    });

    return () => {
      isMounted = false;
      unsubRealtime();
      unsubGallery();
      unsubLikes();
      unsubErrors();
    };
  }, []);

  const handleToggleLike = useCallback(
    async (photoId: string) => {
      const targetPhoto = photosList.find((p) => p.id === photoId);
      const initial = targetPhoto ? (targetPhoto.likesCount ?? targetPhoto.initialLikes ?? 0) : 0;
      await likeService.toggleLike(photoId, initial);
    },
    [photosList]
  );

  // Filter and sort photos based on selected category and sort order
  const filteredPhotos = useMemo(() => {
    let result = photosList.filter((item) => {
      // Category Filter
      if (selectedCategory !== "All") {
        const matchesPrimary = item.category === selectedCategory;
        const matchesAdditional =
          item.additionalCategories?.includes(selectedCategory);
        if (!matchesPrimary && !matchesAdditional) {
          return false;
        }
      }
      return true;
    });

    // Sorting
    result = [...result].sort((a, b) => {
      if (sortBy === "likes-desc") {
        const likesA = likesMap[a.id]?.count ?? a.likesCount ?? a.initialLikes ?? 0;
        const likesB = likesMap[b.id]?.count ?? b.likesCount ?? b.initialLikes ?? 0;
        return likesB - likesA;
      }
      if (sortBy === "title-asc") {
        return a.title.localeCompare(b.title);
      }
      if (sortBy === "title-desc") {
        return b.title.localeCompare(a.title);
      }
      const timeA = a.date ? new Date(a.date).getTime() : 0;
      const timeB = b.date ? new Date(b.date).getTime() : 0;
      return sortBy === "newest" ? timeB - timeA : timeA - timeB;
    });

    return result;
  }, [photosList, selectedCategory, sortBy, likesMap]);

  const isFiltered = selectedCategory !== "All";

  return (
    <div className="min-h-screen bg-[#08090A] text-[#F5F5F3] flex flex-col font-sans selection:bg-white selection:text-black">
      {/* Shared Navigation Header */}
      <Header
        activePage="gallery"
        onOpenJoin={() => setIsJoinModalOpen(true)}
        onOpenSearch={() => setIsSearchModalOpen(true)}
      />

      {/* Main Content Area */}
      <main className="flex-1 w-full">
        {/* Compact Hero Section */}
        <GalleryHero totalPhotosCount={photosList.length} />

        {/* Gallery Content Container */}
        <div className="max-w-7xl mx-auto px-4 sm:px-8 space-y-3 sm:space-y-4 -mt-2 sm:-mt-4 pb-16 sm:pb-24">
          {/* Error Banner with Retry */}
          {loadError && photosList.length === 0 && (
            <div className="w-full bg-[#1c1214] border border-red-500/40 rounded-2xl p-6 text-center space-y-3 shadow-lg">
              <p className="text-red-300 text-sm font-medium">{loadError}</p>
              <button
                type="button"
                onClick={() => loadGalleryData()}
                className="px-4 py-2 bg-red-600/30 hover:bg-red-600/50 border border-red-500/50 text-white rounded-xl text-xs font-semibold transition"
              >
                Retry Loading Gallery
              </button>
            </div>
          )}

          {/* Refined Category Filters & Sort Toolbar */}
          <GalleryToolbar
            selectedCategory={selectedCategory}
            onSelectCategory={setSelectedCategory}
            sortBy={sortBy}
            onSortChange={setSortBy}
          />

          {/* Photograph Count Indicator */}
          <div className="text-xs text-[#858A91] px-1 font-mono">
            <span>Showing </span>
            <span className="text-[#F5F5F3] font-semibold">
              {filteredPhotos.length}
            </span>
            <span> of {photosList.length} photographs</span>
            {selectedCategory !== "All" && (
              <span>
                {" "}
                in <strong className="text-white">{selectedCategory}</strong>
              </span>
            )}
          </div>

          {/* Editorial Masonry Gallery Grid */}
          <GalleryGrid
            photos={filteredPhotos}
            isFiltered={isFiltered}
            onSelectPhoto={(photo) => setActiveLightboxPhoto(photo)}
            likesMap={likesMap}
            onToggleLike={handleToggleLike}
          />
        </div>
      </main>

      {/* Shared Official University-Club Footer */}
      <Footer />

      {/* Modals */}
      <JoinModal
        isOpen={isJoinModalOpen}
        onClose={() => setIsJoinModalOpen(false)}
      />
      <SearchModal
        isOpen={isSearchModalOpen}
        onClose={() => setIsSearchModalOpen(false)}
      />

      {/* Full-Screen Photographic Lightbox with Likes & Metadata */}
      {activeLightboxPhoto && (
        <GalleryLightbox
          photo={activeLightboxPhoto}
          photos={filteredPhotos}
          onSelectPhoto={setActiveLightboxPhoto}
          likesMap={likesMap}
          onToggleLike={handleToggleLike}
          onClose={() => setActiveLightboxPhoto(null)}
        />
      )}

      {/* User-facing Like Error Feedback Toast */}
      {likeError && (
        <div
          role="alert"
          aria-live="polite"
          className="fixed bottom-6 right-6 z-50 bg-[#171214] border border-red-500/50 text-red-200 px-4 py-3 rounded-2xl shadow-2xl flex items-center gap-3 animate-in fade-in slide-in-from-bottom-2 duration-200"
        >
          <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
          <span className="text-xs font-medium">{likeError}</span>
          <button
            type="button"
            onClick={() => setLikeError(null)}
            className="p-1 hover:text-white rounded-lg transition ml-1"
            aria-label="Dismiss notice"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  );
}
