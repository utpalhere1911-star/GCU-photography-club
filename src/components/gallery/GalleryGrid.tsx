"use client";

import React, { useState } from "react";
import Image from "next/image";
import { Heart, SearchX, Camera } from "lucide-react";
import { GalleryPhoto } from "@/data/gallery";
import { formatLikes } from "@/services/likeService";

interface GalleryGridProps {
  photos: GalleryPhoto[];
  isFiltered: boolean;
  onSelectPhoto: (photo: GalleryPhoto) => void;
  likesMap: Record<string, { count: number; hasLiked: boolean; isPending?: boolean }>;
  onToggleLike: (photoId: string) => void;
}

export default function GalleryGrid({
  photos,
  isFiltered,
  onSelectPhoto,
  likesMap,
  onToggleLike,
}: GalleryGridProps) {
  const [failedImages, setFailedImages] = useState<Record<string, boolean>>({});

  if (photos.length === 0) {
    return (
      <div className="w-full bg-[#111315]/80 backdrop-blur-md border border-[#303338] rounded-3xl p-10 sm:p-16 text-center my-8">
        <div className="w-14 h-14 rounded-2xl bg-[#17191C] border border-[#303338] mx-auto flex items-center justify-center text-[#858A91] mb-4">
          <SearchX className="w-7 h-7" />
        </div>
        <h3 className="text-lg sm:text-xl font-bold text-[#F5F5F3] tracking-tight">
          No Photographs Found
        </h3>
        <p className="text-xs sm:text-sm text-[#858A91] max-w-md mx-auto mt-2 leading-relaxed">
          No photographs in this category yet. Select &ldquo;All&rdquo; in the filters above to view the complete collection.
        </p>
      </div>
    );
  }

  return (
    <div className="w-full grid grid-cols-12 gap-3 sm:gap-3.5 lg:gap-4">
      {photos.map((photo, index) => {
        const likeInfo = likesMap[photo.id] || {
          count: photo.likesCount ?? photo.initialLikes ?? 0,
          hasLiked: false,
          isPending: false,
        };

        // When all photos are displayed, use the exact column spans from Image 2.
        // On mobile screens (< sm / < 640px), ensure cards take col-span-12 so they are not crushed into 135px.
        // On tablet (sm: 640px+) and desktop (lg: 1024px+), preserve the intended editorial masonry spans.
        const spanClass = isFiltered
          ? "col-span-12 sm:col-span-6 lg:col-span-4"
          : (photo.gridSpanClass
              ? photo.gridSpanClass.replace(/^col-span-6\b/, "col-span-12 sm:col-span-6")
              : "col-span-12 sm:col-span-6 lg:col-span-3");

        return (
          <article
            key={photo.id}
            onClick={() => onSelectPhoto(photo)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onSelectPhoto(photo);
              }
            }}
            tabIndex={0}
            role="button"
            aria-label={`View photo: ${photo.title} by ${photo.photographer}`}
            className={`${spanClass} relative rounded-xl sm:rounded-2xl overflow-hidden bg-[#17191C] border border-[#303338] hover:border-zinc-500/70 transition-all duration-300 group cursor-pointer shadow-lg shadow-black/40 h-[220px] sm:h-[240px] md:h-[260px] focus:outline-none focus:ring-2 focus:ring-white`}
          >
            {/* Background Full-Bleed Photograph */}
            <div className="absolute inset-0 w-full h-full">
              {failedImages[photo.id] ? (
                <div className="w-full h-full bg-[#121316] flex flex-col items-center justify-center text-neutral-500 p-4 text-center">
                  <Camera className="w-8 h-8 mb-2 opacity-50 text-neutral-400" />
                  <span className="text-[11px] font-mono text-neutral-400">Photograph unavailable</span>
                </div>
              ) : (
                <Image
                  src={photo.imageSrc}
                  alt={photo.alt}
                  fill
                  priority={index < 4}
                  onError={() => setFailedImages((prev) => ({ ...prev, [photo.id]: true }))}
                  className="object-cover object-center transition-transform duration-700 ease-out group-hover:scale-105"
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                />
              )}

              {/* Cinematic Vignette & Bottom Text Contrast Gradient */}
              <div className="absolute inset-0 bg-gradient-to-t from-[#08090A]/95 via-[#08090A]/35 to-transparent pointer-events-none" />
              <div className="absolute inset-0 bg-black/10 group-hover:bg-transparent transition-colors pointer-events-none" />
            </div>

            {/* Top Right Heart-shaped Like Button & Count (Matching Image 2) */}
            <div className="absolute top-2.5 right-2.5 z-20">
              <button
                type="button"
                disabled={likeInfo.isPending}
                aria-busy={likeInfo.isPending}
                onClick={(e) => {
                  e.stopPropagation();
                  e.preventDefault();
                  if (!likeInfo.isPending) {
                    onToggleLike(photo.id);
                  }
                }}
                aria-label={
                  likeInfo.hasLiked
                    ? `Unlike ${photo.title}`
                    : `Like ${photo.title}`
                }
                className={`group/like flex flex-col items-center px-2.5 py-1.5 rounded-2xl border transition-all duration-200 shadow-md focus:outline-none focus:ring-1 focus:ring-white ${
                  likeInfo.isPending
                    ? "opacity-60 cursor-not-allowed bg-black/70 border-white/20"
                    : "cursor-pointer bg-black/50 hover:bg-black/80 border-white/10 hover:border-white/30"
                } ${likeInfo.hasLiked ? "border-white/50 bg-black/80" : ""}`}
                title={likeInfo.isPending ? "Processing..." : likeInfo.hasLiked ? "Unlike" : "Like"}
              >
                <Heart
                  className={`w-3.5 h-3.5 sm:w-4 sm:h-4 transition-transform duration-200 ${
                    likeInfo.hasLiked
                      ? "fill-white text-white scale-110"
                      : "text-white/80 group-hover/like:text-white group-hover/like:scale-110"
                  } ${likeInfo.isPending ? "animate-pulse" : ""}`}
                />
                <span className="text-[9px] sm:text-[10px] font-mono text-white/90 leading-tight mt-0.5 whitespace-nowrap">
                  {formatLikes(likeInfo.count)}
                </span>
              </button>
            </div>

            {/* Bottom Card Overlay: Title, Photographer, and Category */}
            <div className="absolute inset-x-0 bottom-0 p-3 sm:p-3.5 flex items-end justify-between gap-2 z-10 pointer-events-none">
              {/* Left Column: Photograph Title and Creator */}
              <div className="min-w-0 pr-2">
                <h2 className="text-xs sm:text-sm font-bold text-[#F5F5F3] leading-snug tracking-tight truncate group-hover:text-white transition-colors">
                  {photo.title}
                </h2>
                
                <div className="flex items-center gap-1.5 mt-1">
                  <div className="w-4 h-4 rounded-full bg-[#111315] border border-white/20 text-[8px] font-bold text-white flex items-center justify-center shrink-0">
                    {photo.avatarInitials || photo.photographer.charAt(0)}
                  </div>
                  <span className="text-[11px] text-[#B5B8BC] leading-none truncate">
                    by {photo.photographer}
                  </span>
                </div>
              </div>

              {/* Right Column: Category Label in Clean Uppercase */}
              <div className="shrink-0 text-right pb-0.5">
                <span className="text-[9px] sm:text-[10px] font-mono font-medium tracking-wider text-[#858A91] uppercase">
                  {photo.category}
                </span>
              </div>
            </div>
          </article>
        );
      })}
    </div>
  );
}
