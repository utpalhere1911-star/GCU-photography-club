"use client";

import React, { useEffect, useState, useMemo, useCallback } from "react";
import Image from "next/image";
import {
  Calendar,
  MapPin,
  Clock,
  ArrowRight,
  MessageCircle,
  Camera,
  ChevronLeft,
  ChevronRight,
  X,
  Maximize2,
  AlertCircle,
} from "lucide-react";
import { Activity, formatActivityDate } from "@/data/activities";

interface ActivityDetailModalProps {
  activity: Activity | null;
  onClose: () => void;
}

export default function ActivityDetailModal({
  activity,
  onClose,
}: ActivityDetailModalProps) {
  const [imageError, setImageError] = useState(false);
  const [activeLightboxIndex, setActiveLightboxIndex] = useState<number | null>(null);
  const [lightboxImageError, setLightboxImageError] = useState(false);
  const [failedThumbnailIndices, setFailedThumbnailIndices] = useState<Set<number>>(new Set());

  // Filter out any previous accidental duplicate cover image fallback
  const validGalleryPhotos = useMemo(() => {
    if (!activity?.galleryImages || activity.galleryImages.length === 0) {
      return [];
    }
    // If the gallery contains only a single item identical to the cover image, separate them
    if (
      activity.galleryImages.length === 1 &&
      activity.galleryImages[0] === activity.coverImage
    ) {
      return [];
    }
    return activity.galleryImages;
  }, [activity?.galleryImages, activity?.coverImage]);

  const [prevActivityId, setPrevActivityId] = useState<string | undefined>(activity?.id);
  if (activity?.id !== prevActivityId) {
    setPrevActivityId(activity?.id);
    setImageError(false);
    setActiveLightboxIndex(null);
    setLightboxImageError(false);
    setFailedThumbnailIndices(new Set());
  }

  // Support Lightbox Navigation
  const handlePrevPhoto = useCallback(() => {
    if (activeLightboxIndex === null || validGalleryPhotos.length === 0) return;
    setLightboxImageError(false);
    setActiveLightboxIndex((prev) =>
      prev !== null && prev > 0 ? prev - 1 : validGalleryPhotos.length - 1
    );
  }, [activeLightboxIndex, validGalleryPhotos.length]);

  const handleNextPhoto = useCallback(() => {
    if (activeLightboxIndex === null || validGalleryPhotos.length === 0) return;
    setLightboxImageError(false);
    setActiveLightboxIndex((prev) =>
      prev !== null && prev < validGalleryPhotos.length - 1 ? prev + 1 : 0
    );
  }, [activeLightboxIndex, validGalleryPhotos.length]);

  // Keyboard navigation for modal and lightbox
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // If Lightbox is open, Escape closes lightbox only
      if (activeLightboxIndex !== null) {
        if (e.key === "Escape") {
          e.preventDefault();
          setActiveLightboxIndex(null);
        } else if (e.key === "ArrowLeft") {
          e.preventDefault();
          handlePrevPhoto();
        } else if (e.key === "ArrowRight") {
          e.preventDefault();
          handleNextPhoto();
        }
        return;
      }

      // If Lightbox is closed, Escape closes detail modal
      if (e.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose, activeLightboxIndex, handlePrevPhoto, handleNextPhoto]);

  // Lock background body scroll while modal is active
  useEffect(() => {
    if (!activity) return;
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [activity]);

  if (!activity) return null;

  return (
    <>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="activity-detail-title"
        className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 md:p-6 bg-black/85 backdrop-blur-md animate-in fade-in duration-200 overflow-y-auto"
        onClick={(e) => {
          // Close on clicking backdrop
          if (e.target === e.currentTarget && activeLightboxIndex === null) {
            onClose();
          }
        }}
      >
        <div className="relative w-full max-w-5xl rounded-2xl sm:rounded-3xl bg-[#111315] border border-[#303338] shadow-[0_20px_60px_rgba(0,0,0,0.95),0_0_30px_rgba(255,255,255,0.03)] overflow-hidden my-auto max-h-[94vh] flex flex-col">
          {/* Sticky Top Navigation Bar: Single, prominent "← Back to Activities" control */}
          <div className="sticky top-0 z-30 px-3 sm:px-6 py-2.5 sm:py-3 bg-[#111315]/95 backdrop-blur-md border-b border-[#303338] flex items-center justify-between shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="inline-flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm font-semibold text-[#F5F5F3] hover:text-white bg-[#17191C] hover:bg-[#22252a] border border-[#303338] hover:border-white px-3.5 sm:px-4 py-1.5 sm:py-2 rounded-full transition-all duration-200 shadow-sm cursor-pointer group focus:outline-none focus-visible:ring-1 focus-visible:ring-white min-h-[44px]"
              aria-label="Back to Activities"
            >
              <span
                aria-hidden="true"
                className="group-hover:-translate-x-0.5 transition-transform text-[#B5B8BC] group-hover:text-white"
              >
                ←
              </span>
              <span>Back to Activities</span>
            </button>

            <span className="text-[11px] font-mono uppercase tracking-wider text-neutral-400 hidden xs:inline">
              GCU Photography Club
            </span>
          </div>

          {/* Scrollable Modal Content */}
          <div className="flex-1 overflow-y-auto p-3.5 sm:p-6 lg:p-8 space-y-6 sm:space-y-8">
            {/* Main Grid: Responsive 2-column on desktop, vertical stack on mobile */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
              {/* Cover Image Container: Full containment without awkward mobile cropping */}
              <div className="lg:col-span-6 xl:col-span-7">
                <div className="relative w-full aspect-[16/10] sm:aspect-[16/9] lg:aspect-auto lg:h-[400px] rounded-2xl overflow-hidden border border-[#303338] bg-black shadow-lg flex items-center justify-center group">
                  {imageError ? (
                    <div className="w-full h-full min-h-[220px] bg-[#121316] flex flex-col items-center justify-center text-neutral-400 p-6 text-center">
                      <Camera className="w-12 h-12 mb-2 text-neutral-500 opacity-60" />
                      <h4 className="text-sm font-bold text-white mb-1">
                        Poster Unavailable
                      </h4>
                      <p className="text-xs text-neutral-400 max-w-xs">
                        The cover image could not be loaded from storage.
                      </p>
                    </div>
                  ) : (
                    <>
                      {/* Ambient blurred backdrop so any aspect ratio fills naturally */}
                      <Image
                        src={activity.coverImage}
                        alt=""
                        fill
                        aria-hidden="true"
                        className="object-cover blur-2xl opacity-30 scale-110 pointer-events-none"
                        unoptimized={activity.coverImage.startsWith("data:")}
                      />

                      {/* Foreground uncropped photograph/poster */}
                      <Image
                        src={activity.coverImage}
                        alt={activity.title}
                        fill
                        onError={() => setImageError(true)}
                        className="object-contain relative z-10 transition-transform duration-500 group-hover:scale-[1.02]"
                        sizes="(max-width: 1024px) 100vw, 650px"
                        unoptimized={activity.coverImage.startsWith("data:")}
                        priority
                      />
                    </>
                  )}

                  {/* Badges Overlay at Top Left of Image */}
                  <div className="absolute top-3 left-3 flex flex-wrap items-center gap-2 z-20">
                    <span className="bg-white text-[#08090A] text-xs font-semibold px-3 py-1 rounded-full uppercase tracking-wider shadow-md">
                      {activity.category}
                    </span>
                    {(activity.status || "").toLowerCase() === "upcoming" ? (
                      <span className="bg-[#111315]/90 border border-emerald-900/60 text-emerald-400 text-xs font-medium px-3 py-1 rounded-full shadow-md backdrop-blur-md">
                        {activity.registrationStatus || "Upcoming"}
                      </span>
                    ) : (activity.status || "").toLowerCase() === "ongoing" ? (
                      <span className="bg-emerald-950/70 border border-emerald-500/50 text-emerald-300 text-xs font-medium px-3 py-1 rounded-full shadow-md backdrop-blur-md">
                        Ongoing Event
                      </span>
                    ) : (
                      <span className="bg-[#08090A]/90 border border-[#303338] text-[#B5B8BC] text-xs font-medium px-3 py-1 rounded-full backdrop-blur-md">
                        Completed {activity.year}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Information Column */}
              <div className="lg:col-span-6 xl:col-span-5 flex flex-col justify-between space-y-5">
                {/* Title & Metadata */}
                <div className="space-y-3.5">
                  <h2
                    id="activity-detail-title"
                    className="text-xl sm:text-3xl font-extrabold text-[#F5F5F3] tracking-tight leading-tight break-words"
                  >
                    {activity.title}
                  </h2>

                  {/* Metadata Row */}
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs sm:text-sm text-[#B5B8BC]">
                    <div className="flex items-center gap-1.5 font-mono">
                      <Calendar className="w-4 h-4 text-white" />
                      <span className="text-[#F5F5F3] font-semibold">
                        {formatActivityDate(activity.startDate)}
                      </span>
                    </div>
                    {activity.time && (
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-4 h-4 text-[#858A91]" />
                        <span>{activity.time}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-1.5">
                      <MapPin className="w-4 h-4 text-[#858A91]" />
                      <span>{activity.venue}</span>
                    </div>
                  </div>
                </div>

                {/* Description */}
                <div className="text-sm leading-relaxed space-y-2.5">
                  <p className="text-[#F5F5F3] font-medium">
                    {activity.shortDescription}
                  </p>
                  {activity.fullDescription &&
                    activity.fullDescription !== activity.shortDescription && (
                      <p className="text-[#858A91]">
                        {activity.fullDescription}
                      </p>
                    )}
                </div>

                {/* Participation & Registration CTA */}
                <div className="pt-4 border-t border-[#303338] space-y-3">
                  {activity.status === "upcoming" ? (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-[#858A91]">Participation Status:</span>
                        <span className="font-semibold text-emerald-400">
                          {activity.registrationStatus || "Open to all GCU Students"}
                        </span>
                      </div>

                      <a
                        href={
                          activity.registrationUrl ||
                          "https://chat.whatsapp.com/Hs71BicR1Xj3PmOyPJ5wdc?s=sw&p=a&mlu=4&ilr=4"
                        }
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full inline-flex items-center justify-center gap-2 bg-white hover:bg-[#D5D9DE] text-[#08090A] font-semibold px-5 py-3 rounded-full text-xs sm:text-sm shadow-lg shadow-white/5 transition-all duration-200 transform hover:-translate-y-0.5 active:translate-y-0 cursor-pointer min-h-[44px]"
                      >
                        <MessageCircle className="w-4 h-4" />
                        <span>Join Event WhatsApp Group</span>
                        <ArrowRight className="w-4 h-4" />
                      </a>
                    </div>
                  ) : (
                    <div className="text-xs text-[#858A91]">
                      <span>Girijananda Chowdhury University Photography Club Archive</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* ============================================================== */}
            {/* EVENT PHOTOS & HIGHLIGHTS GALLERY (SEPARATE FROM COVER)        */}
            {/* ============================================================== */}
            <div className="pt-6 border-t border-[#303338] space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <h3 className="text-xs uppercase tracking-wider font-semibold text-white flex items-center gap-2">
                    <Camera className="w-4 h-4 text-emerald-400" />
                    <span>Event Photos & Highlights</span>
                    {validGalleryPhotos.length > 0 && (
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-white/10 text-neutral-300">
                        {validGalleryPhotos.length} {validGalleryPhotos.length === 1 ? "photo" : "photos"}
                      </span>
                    )}
                  </h3>
                  <p className="text-[11px] text-[#858A91]">
                    Photographic moments captured during this club event.
                  </p>
                </div>
              </div>

              {/* Photos Grid or Empty State */}
              {validGalleryPhotos.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 sm:gap-4">
                  {validGalleryPhotos.map((imgSrc, idx) => {
                    const hasFailed = failedThumbnailIndices.has(idx);

                    return (
                      <button
                        key={`highlight-${idx}`}
                        type="button"
                        onClick={() => {
                          if (!hasFailed) {
                            setActiveLightboxIndex(idx);
                          }
                        }}
                        className="relative aspect-[4/3] rounded-xl overflow-hidden border border-[#303338] hover:border-white/40 bg-black shadow-sm group text-left transition-all duration-300 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
                        aria-label={`View photo ${idx + 1} of ${activity.title} in full screen`}
                      >
                        {hasFailed ? (
                          <div className="w-full h-full bg-[#141619] flex flex-col items-center justify-center p-3 text-center text-neutral-400">
                            <AlertCircle className="w-5 h-5 mb-1 text-neutral-500 opacity-60" />
                            <span className="text-[10px] text-neutral-400">Photo Unavailable</span>
                          </div>
                        ) : (
                          <>
                            <Image
                              src={imgSrc}
                              alt={`${activity.title} event highlight ${idx + 1}`}
                              fill
                              onError={() =>
                                setFailedThumbnailIndices((prev) => new Set(prev).add(idx))
                              }
                              className="object-cover transition-transform duration-500 group-hover:scale-105"
                              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 250px"
                              unoptimized={imgSrc.startsWith("data:")}
                            />
                            {/* Hover overlay hint */}
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                              <span className="p-2 rounded-full bg-white/20 text-white backdrop-blur-md">
                                <Maximize2 className="w-4 h-4" />
                              </span>
                            </div>
                          </>
                        )}
                      </button>
                    );
                  })}
                </div>
              ) : (
                /* Appropriate Empty State when no event photos are uploaded */
                <div className="p-6 sm:p-8 rounded-2xl border border-dashed border-[#303338] bg-[#141619]/40 flex flex-col items-center justify-center text-center">
                  <div className="p-3 rounded-full bg-white/[0.04] text-[#858A91] mb-2.5">
                    <Camera className="w-5 h-5 text-neutral-400 opacity-60" />
                  </div>
                  <h4 className="text-xs font-semibold text-[#F5F5F3]">
                    No event photographs uploaded yet
                  </h4>
                  <p className="text-[11px] text-[#858A91] mt-1 max-w-xs leading-relaxed">
                    Event highlights and gallery photos will appear here after the event concludes and is published by club coordinators.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ============================================================== */}
      {/* FULL-SCREEN PHOTOGRAPHIC LIGHTBOX FOR EVENT PHOTOS             */}
      {/* ============================================================== */}
      {activeLightboxIndex !== null && validGalleryPhotos[activeLightboxIndex] && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Event photo preview"
          className="fixed inset-0 z-[60] bg-black/95 backdrop-blur-xl flex flex-col justify-between p-3 sm:p-6 animate-in fade-in duration-200"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setActiveLightboxIndex(null);
            }
          }}
        >
          {/* Lightbox Top Header */}
          <div className="flex items-center justify-between text-white shrink-0 z-10 py-1">
            <div className="flex items-center gap-3">
              <span className="text-xs font-mono px-2.5 py-1 rounded-full bg-white/10 border border-white/15 text-[#E0E2E6]">
                {activeLightboxIndex + 1} / {validGalleryPhotos.length}
              </span>
              <span className="text-xs sm:text-sm font-semibold truncate max-w-[200px] sm:max-w-md text-neutral-300">
                {activity.title}
              </span>
            </div>

            <button
              type="button"
              onClick={() => setActiveLightboxIndex(null)}
              className="p-2 sm:p-2.5 rounded-full bg-white/10 hover:bg-white/20 text-neutral-300 hover:text-white transition-colors cursor-pointer min-h-[44px] min-w-[44px] flex items-center justify-center"
              aria-label="Close photo preview (Escape)"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Lightbox Center Image View */}
          <div className="relative flex-1 w-full my-2 flex items-center justify-center overflow-hidden">
            {lightboxImageError ? (
              <div className="p-8 text-center text-neutral-400 flex flex-col items-center">
                <AlertCircle className="w-10 h-10 mb-2 text-neutral-500 opacity-60" />
                <h4 className="text-sm font-bold text-white mb-1">Image Loading Error</h4>
                <p className="text-xs text-neutral-400">
                  Could not load high-resolution image from storage.
                </p>
              </div>
            ) : (
              <Image
                src={validGalleryPhotos[activeLightboxIndex]}
                alt={`${activity.title} highlight ${activeLightboxIndex + 1}`}
                fill
                onError={() => setLightboxImageError(true)}
                className="object-contain"
                sizes="100vw"
                priority
                unoptimized={validGalleryPhotos[activeLightboxIndex].startsWith("data:")}
              />
            )}

            {/* Left Previous Button */}
            {validGalleryPhotos.length > 1 && (
              <button
                type="button"
                onClick={handlePrevPhoto}
                className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 p-2.5 sm:p-3 rounded-full bg-black/70 hover:bg-black/90 border border-white/20 text-white shadow-xl hover:scale-105 transition-all cursor-pointer min-h-[44px] min-w-[44px] flex items-center justify-center"
                aria-label="Previous photo (ArrowLeft)"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
            )}

            {/* Right Next Button */}
            {validGalleryPhotos.length > 1 && (
              <button
                type="button"
                onClick={handleNextPhoto}
                className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 p-2.5 sm:p-3 rounded-full bg-black/70 hover:bg-black/90 border border-white/20 text-white shadow-xl hover:scale-105 transition-all cursor-pointer min-h-[44px] min-w-[44px] flex items-center justify-center"
                aria-label="Next photo (ArrowRight)"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            )}
          </div>

          {/* Lightbox Bottom Info Bar */}
          <div className="shrink-0 flex items-center justify-between text-neutral-400 text-xs py-1">
            <span className="font-mono text-[11px]">
              Use Arrow Keys (← →) to navigate · Esc to close
            </span>
            <span className="font-mono text-[11px] text-neutral-500">
              GCU ShutterScape
            </span>
          </div>
        </div>
      )}
    </>
  );
}
