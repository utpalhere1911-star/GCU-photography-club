"use client";

import React, { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import {
  X,
  ChevronLeft,
  ChevronRight,
  Heart,
  Calendar,
  MapPin,
  Tag,
  Camera,
} from "lucide-react";
import { GalleryPhoto } from "@/data/gallery";
import { formatLikes } from "@/services/likeService";

interface GalleryLightboxProps {
  photo: GalleryPhoto | null;
  photos: GalleryPhoto[];
  onClose: () => void;
  onSelectPhoto: (photo: GalleryPhoto) => void;
  likesMap: Record<string, { count: number; hasLiked: boolean; isPending?: boolean }>;
  onToggleLike: (photoId: string) => void;
}

export default function GalleryLightbox({
  photo,
  photos,
  onClose,
  onSelectPhoto,
  likesMap,
  onToggleLike,
}: GalleryLightboxProps) {
  const [imageError, setImageError] = useState(false);

  useEffect(() => {
    setImageError(false);
  }, [photo?.id]);

  const currentIndex = photo
    ? photos.findIndex((p) => p.id === photo.id)
    : -1;

  const handlePrev = useCallback(() => {
    if (currentIndex > 0) {
      onSelectPhoto(photos[currentIndex - 1]);
    } else if (currentIndex === 0) {
      onSelectPhoto(photos[photos.length - 1]);
    }
  }, [currentIndex, photos, onSelectPhoto]);

  const handleNext = useCallback(() => {
    if (currentIndex >= 0 && currentIndex < photos.length - 1) {
      onSelectPhoto(photos[currentIndex + 1]);
    } else if (currentIndex === photos.length - 1) {
      onSelectPhoto(photos[0]);
    }
  }, [currentIndex, photos, onSelectPhoto]);

  // Keyboard navigation: Escape to close, Left/Right arrow keys for navigation
  useEffect(() => {
    if (!photo) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        handlePrev();
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        handleNext();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    document.body.style.overflow = "hidden";

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [photo, onClose, handlePrev, handleNext]);

  if (!photo) return null;

  const likeInfo = likesMap[photo.id] || {
    count: photo.likesCount ?? photo.initialLikes ?? 0,
    hasLiked: false,
    isPending: false,
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-[#08090A]/95 backdrop-blur-xl flex flex-col justify-between p-3 sm:p-5 md:p-6 animate-in fade-in duration-200 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-label={`Expanded view of ${photo.title}`}
    >
      {/* Top Bar: Index Indicator & Actions */}
      <div className="w-full max-w-6xl mx-auto flex items-center justify-between pb-3 border-b border-[#303338]/80 text-[#B5B8BC]">
        {/* Index Counter */}
        <div className="flex items-center gap-2 text-xs sm:text-sm font-mono text-[#858A91]">
          <span className="text-[#F5F5F3] font-bold">
            {String(currentIndex + 1).padStart(2, "0")}
          </span>
          <span>/</span>
          <span>{String(photos.length).padStart(2, "0")}</span>
          <span className="hidden sm:inline-block text-[#303338] mx-2">|</span>
          <span className="hidden sm:inline-block text-[11px] uppercase tracking-wider text-[#858A91]">
            ShutterScape GCU Gallery
          </span>
        </div>

        {/* Prev / Next & Close Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={handlePrev}
            className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-[#17191C] border border-[#303338] flex items-center justify-center text-[#B5B8BC] hover:text-white hover:border-white transition cursor-pointer"
            aria-label="Previous photograph"
            title="Previous (Left Arrow)"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={handleNext}
            className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-[#17191C] border border-[#303338] flex items-center justify-center text-[#B5B8BC] hover:text-white hover:border-white transition cursor-pointer"
            aria-label="Next photograph"
            title="Next (Right Arrow)"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
          <button
            onClick={onClose}
            className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-white hover:bg-[#D5D9DE] text-[#08090A] flex items-center justify-center shadow-lg transition ml-2 cursor-pointer"
            aria-label="Close viewer"
            title="Close (Escape)"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Image Viewport */}
      <div className="relative w-full max-w-5xl mx-auto my-auto flex-1 min-h-[300px] max-h-[64vh] sm:max-h-[68vh] flex items-center justify-center py-2">
        {/* Floating Desktop Navigation Buttons */}
        <button
          onClick={handlePrev}
          className="hidden md:flex absolute -left-14 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-[#111315]/90 border border-[#303338] hover:border-white items-center justify-center text-[#B5B8BC] hover:text-white transition shadow-2xl cursor-pointer z-10"
          aria-label="Previous photograph"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>

        <button
          onClick={handleNext}
          className="hidden md:flex absolute -right-14 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-[#111315]/90 border border-[#303338] hover:border-white items-center justify-center text-[#B5B8BC] hover:text-white transition shadow-2xl cursor-pointer z-10"
          aria-label="Next photograph"
        >
          <ChevronRight className="w-5 h-5" />
        </button>

        <div className="relative w-full h-full flex items-center justify-center">
          {imageError ? (
            <div className="w-full h-64 sm:h-96 bg-[#121316] rounded-2xl border border-white/10 flex flex-col items-center justify-center text-neutral-400 p-6 text-center">
              <Camera className="w-12 h-12 mb-3 text-neutral-500" />
              <h4 className="text-base font-bold text-white mb-1">Photograph Unavailable</h4>
              <p className="text-xs text-neutral-400 max-w-sm">
                This image could not be loaded from storage.
              </p>
            </div>
          ) : (
            <Image
              src={photo.imageSrc}
              alt={photo.alt}
              fill
              onError={() => setImageError(true)}
              className="object-contain"
              sizes="(max-width: 1024px) 100vw, 1200px"
              priority
            />
          )}
        </div>
      </div>

      {/* Caption & Synchronized Like Control Panel */}
      <div className="w-full max-w-4xl mx-auto bg-[#111315]/90 backdrop-blur-md border border-[#303338] rounded-2xl p-4 sm:p-5 shadow-2xl mt-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 sm:gap-4">
          
          {/* Title & Caption */}
          <div className="flex-1 text-left">
            <div className="flex items-center gap-2 mb-1.5 flex-wrap">
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#17191C] border border-[#303338] text-[10px] font-mono text-[#F5F5F3] uppercase">
                <Tag className="w-2.5 h-2.5 text-[#858A91]" />
                {photo.category}
              </span>
              {photo.location && (
                <span className="inline-flex items-center gap-1 text-[11px] text-[#858A91]">
                  <MapPin className="w-3 h-3 text-[#858A91]" />
                  {photo.location}
                </span>
              )}
            </div>

            <h3 className="text-base sm:text-lg font-bold text-[#F5F5F3] tracking-tight">
              {photo.title}
            </h3>

            {photo.caption && (
              <p className="text-xs sm:text-[13px] text-[#B5B8BC] leading-relaxed mt-1">
                {photo.caption}
              </p>
            )}
          </div>

          {/* Synchronized Like Button & Creator Info */}
          <div className="flex flex-row md:flex-col items-center md:items-end justify-between md:justify-center gap-3 pt-3 md:pt-0 border-t md:border-t-0 md:border-l border-[#303338] md:pl-5 shrink-0">
            {/* Interactive Synchronized Like Button */}
            <button
              type="button"
              disabled={likeInfo.isPending}
              aria-busy={likeInfo.isPending}
              onClick={() => {
                if (!likeInfo.isPending) {
                  onToggleLike(photo.id);
                }
              }}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-full border transition text-xs font-semibold shadow-md ${
                likeInfo.isPending
                  ? "opacity-60 cursor-not-allowed border-white/20 bg-[#17191C]/70"
                  : "cursor-pointer"
              } ${
                likeInfo.hasLiked
                  ? "bg-white text-[#08090A] border-white"
                  : "bg-[#17191C] text-[#F5F5F3] border-[#303338] hover:border-white"
              }`}
              aria-label={likeInfo.hasLiked ? "Unlike photograph" : "Like photograph"}
              title={likeInfo.isPending ? "Processing..." : likeInfo.hasLiked ? "Unlike" : "Like"}
            >
              <Heart
                className={`w-4 h-4 transition-transform ${
                  likeInfo.hasLiked
                    ? "fill-[#08090A] text-[#08090A] scale-110"
                    : "text-white"
                } ${likeInfo.isPending ? "animate-pulse" : ""}`}
              />
              <span>{formatLikes(likeInfo.count)}</span>
            </button>

            {/* Photographer attribution */}
            <div className="flex items-center gap-1.5 text-xs text-[#B5B8BC]">
              <div className="w-5 h-5 rounded-full bg-[#17191C] border border-white/20 text-[9px] font-bold text-white flex items-center justify-center">
                {photo.avatarInitials || photo.photographer.charAt(0)}
              </div>
              <span className="font-medium text-[#F5F5F3]">by {photo.photographer}</span>
            </div>

            {photo.formattedDate && (
              <div className="hidden md:flex items-center gap-1 text-[10px] font-mono text-[#858A91]">
                <Calendar className="w-3 h-3" />
                <span>{photo.formattedDate}</span>
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
