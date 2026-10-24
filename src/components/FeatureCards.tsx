"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Calendar, MapPin, Play, Camera } from "lucide-react";
import { GalleryPhoto } from "@/data/gallery";
import { Activity, formatActivityDate } from "@/data/activities";
import {
  getStoredGallery,
  fetchGalleryPhotos,
  subscribeGallery,
} from "@/services/galleryService";
import {
  getStoredActivities,
  fetchActivities,
  subscribeActivities,
} from "@/services/activityService";
import { subscribeToRealtimeTable } from "@/lib/realtimeSync";

interface FeatureCardsProps {
  onOpenJoin?: () => void;
}

/**
 * Filter activities for the authoritative upcoming/ongoing event.
 * Strictly respects publication status, lifecycle rules, and current date.
 */
function findEligibleUpcomingActivity(activities: Activity[]): Activity | null {
  const published = activities.filter((a) => a.published !== false);

  // 1. Explicitly marked upcoming featured activity (must not be past/completed/archived)
  const featured = published.find(
    (a) =>
      a.isFeaturedUpcoming &&
      (a.status || "").toLowerCase() !== "past" &&
      (a.status || "").toLowerCase() !== "completed" &&
      (a.status || "").toLowerCase() !== "archived"
  );
  if (featured) return featured;

  // 2. Any active activity with status "upcoming" or "ongoing"
  const upcomingOrOngoing = published.find((a) => {
    const st = (a.status || "").toLowerCase();
    return st === "upcoming" || st === "ongoing";
  });
  if (upcomingOrOngoing) return upcomingOrOngoing;

  // 3. Fallback: Future date (>= start of today) if status is not explicitly past
  const today = new Date().setHours(0, 0, 0, 0);
  const futureActivities = published
    .filter((a) => {
      const st = (a.status || "").toLowerCase();
      if (st === "past" || st === "completed" || st === "archived") return false;
      if (!a.startDate) return false;
      const t = new Date(a.startDate).getTime();
      return !isNaN(t) && t >= today;
    })
    .sort(
      (a, b) =>
        new Date(a.startDate).getTime() - new Date(b.startDate).getTime()
    );

  return futureActivities[0] || null;
}

function findFeaturedPhoto(photos: GalleryPhoto[]): GalleryPhoto | null {
  const published = photos.filter((p) => p.published !== false);
  return published.find((p) => p.isFeatured) || published[0] || null;
}

export default function FeatureCards({ onOpenJoin }: FeatureCardsProps = {}) {
  const [featuredPhoto, setFeaturedPhoto] = useState<GalleryPhoto | null>(null);
  const [upcomingActivity, setUpcomingActivity] = useState<Activity | null>(null);
  const [photoError, setPhotoError] = useState(false);
  const [coverError, setCoverError] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const syncContent = () => {
      setFeaturedPhoto(findFeaturedPhoto(getStoredGallery()));
      setUpcomingActivity(findEligibleUpcomingActivity(getStoredActivities()));
      setPhotoError(false);
      setCoverError(false);
    };

    // 1. Immediate cached state
    syncContent();

    // 2. Fetch fresh from backend Supabase API
    fetchGalleryPhotos().then((fresh) => {
      if (isMounted && Array.isArray(fresh)) {
        setFeaturedPhoto(findFeaturedPhoto(fresh));
      }
    });

    fetchActivities().then((fresh) => {
      if (isMounted && Array.isArray(fresh)) {
        setUpcomingActivity(findEligibleUpcomingActivity(fresh));
      }
    });

    // 3. Listen to Supabase Realtime changes
    const unsubRealtimeGallery = subscribeToRealtimeTable("gallery_photos", () => {
      fetchGalleryPhotos().then((fresh) => {
        if (isMounted && Array.isArray(fresh)) {
          setFeaturedPhoto(findFeaturedPhoto(fresh));
        }
      });
    });

    const unsubRealtimeActivities = subscribeToRealtimeTable("activities", () => {
      fetchActivities().then((fresh) => {
        if (isMounted && Array.isArray(fresh)) {
          setUpcomingActivity(findEligibleUpcomingActivity(fresh));
        }
      });
    });

    // 4. Listen to local browser events from Dashboard mutations
    const unsubLocalGallery = subscribeGallery((updated) => {
      if (isMounted && Array.isArray(updated)) {
        setFeaturedPhoto(findFeaturedPhoto(updated));
      }
    });

    const unsubLocalActivities = subscribeActivities((updated) => {
      if (isMounted && Array.isArray(updated)) {
        setUpcomingActivity(findEligibleUpcomingActivity(updated));
      }
    });

    return () => {
      isMounted = false;
      unsubRealtimeGallery();
      unsubRealtimeActivities();
      unsubLocalGallery();
      unsubLocalActivities();
    };
  }, []);

  const photoInitials =
    featuredPhoto?.avatarInitials ||
    (featuredPhoto?.photographer
      ? featuredPhoto.photographer
          .split(" ")
          .map((w) => w[0])
          .join("")
          .slice(0, 2)
          .toUpperCase()
      : "GC");

  return (
    <section
      id="featured"
      className="relative z-20 max-w-7xl mx-auto px-4 sm:px-8 -mt-6 sm:-mt-10 mb-8 sm:mb-12"
    >
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-6 items-stretch">
        {/* Card 1: Featured Photograph (7 cols on lg) */}
        <Link
          href="/gallery"
          className="lg:col-span-7 bg-[#111315]/95 backdrop-blur-xl border border-[#303338] rounded-2xl sm:rounded-3xl p-4 sm:p-6 flex flex-col justify-between shadow-2xl shadow-black/70 group hover:border-zinc-500/50 transition-all duration-300 cursor-pointer"
        >
          {featuredPhoto ? (
            <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 items-stretch h-full">
              {/* Image Thumbnail with Badge */}
              <div className="relative w-full sm:w-[52%] min-h-[220px] sm:min-h-[230px] rounded-xl sm:rounded-2xl overflow-hidden shrink-0 bg-[#0d0e11] border border-[#23262b] flex items-center justify-center">
                {!photoError ? (
                  <>
                    <Image
                      src={featuredPhoto.imageSrc}
                      alt={featuredPhoto.title}
                      fill
                      className="object-cover transition-transform duration-700 group-hover:scale-105"
                      sizes="(max-width: 640px) 100vw, 400px"
                      unoptimized={featuredPhoto.imageSrc.startsWith("data:")}
                      onError={() => setPhotoError(true)}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
                  </>
                ) : (
                  <div className="flex flex-col items-center justify-center text-center p-4 text-[#858A91]">
                    <Camera className="w-8 h-8 text-[#555a61] mb-2" />
                    <span className="text-xs font-mono font-medium text-[#B5B8BC]">Photograph Preview</span>
                    <span className="text-[10px] text-[#71767e] mt-0.5">Image unavailable</span>
                  </div>
                )}

                {/* Badge */}
                <div className="absolute top-3 left-3 bg-black/80 backdrop-blur-md border border-[#303338] px-2.5 py-1 rounded-md flex items-center gap-1.5 shadow-md">
                  <Play className="w-2.5 h-2.5 fill-white text-white" />
                  <span className="text-[10px] font-semibold tracking-wider text-white uppercase">
                    Featured Photograph
                  </span>
                </div>
              </div>

              {/* Content Details */}
              <div className="flex flex-col justify-between flex-1 py-1">
                <div>
                  <div className="flex items-center justify-between text-[#858A91] font-mono text-xs mb-2">
                    <span>CURATED HIGHLIGHT</span>
                  </div>
                  <h3 className="text-[#F5F5F3] text-lg sm:text-xl font-bold tracking-tight group-hover:text-white transition-colors">
                    {featuredPhoto.title}
                  </h3>
                  <p className="text-[#B5B8BC] text-xs sm:text-[13px] leading-relaxed mt-2.5 line-clamp-3">
                    {featuredPhoto.caption || "A photographic highlight from the GCU campus archive."}
                  </p>
                </div>

                {/* Bottom Member Attribution & Arrow */}
                <div className="flex items-center justify-between pt-4 mt-4 border-t border-[#303338]">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-[#17191C] border border-[#303338] flex items-center justify-center text-white overflow-hidden shrink-0">
                      <span className="text-[10px] font-mono font-bold">
                        {photoInitials}
                      </span>
                    </div>
                    <div className="text-left">
                      <span className="text-[10px] text-[#858A91] block leading-tight">
                        Photographed by
                      </span>
                      <span className="text-xs font-medium text-[#F5F5F3] block leading-tight">
                        {featuredPhoto.photographer}
                      </span>
                    </div>
                  </div>

                  <div className="w-8 h-8 rounded-full bg-[#17191C] border border-[#303338] flex items-center justify-center text-[#B5B8BC] group-hover:bg-white group-hover:text-[#08090A] group-hover:border-white transition-all">
                    <ArrowRight className="w-3.5 h-3.5" />
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col justify-between h-full py-1 min-h-[220px]">
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Camera className="w-4 h-4 text-white" />
                  <span className="text-[10px] font-semibold tracking-wider text-white uppercase font-mono">
                    Curated Highlight
                  </span>
                </div>
                <h3 className="text-[#F5F5F3] text-lg sm:text-xl font-bold tracking-tight group-hover:text-white transition-colors">
                  No Featured Photograph Yet
                </h3>
                <p className="text-[#858A91] text-xs sm:text-[13px] leading-relaxed mt-2.5 max-w-md">
                  The photography club gallery is currently being curated. Check back soon for new member submissions, campus perspectives, and event showcases.
                </p>
              </div>

              <div className="flex items-center justify-between pt-4 mt-6 border-t border-[#303338]">
                <span className="text-xs font-semibold text-[#D5D9DE] group-hover:text-white transition-colors">
                  Explore Photo Gallery
                </span>
                <div className="w-8 h-8 rounded-full bg-[#17191C] border border-[#303338] flex items-center justify-center text-[#B5B8BC] group-hover:bg-white group-hover:text-[#08090A] group-hover:border-white transition-all">
                  <ArrowRight className="w-3.5 h-3.5" />
                </div>
              </div>
            </div>
          )}
        </Link>

        {/* Card 2: Upcoming Activity (5 cols on lg) */}
        <Link
          href="/activities"
          className="lg:col-span-5 bg-[#111315]/95 backdrop-blur-xl border border-[#303338] rounded-2xl sm:rounded-3xl p-4 sm:p-6 flex flex-col justify-between shadow-2xl shadow-black/70 group hover:border-zinc-500/50 transition-all duration-300 cursor-pointer"
        >
          {upcomingActivity ? (
            <div className="flex flex-col justify-between h-full">
              <div>
                {/* Header Tag */}
                <div className="flex items-center gap-2 mb-3 sm:mb-4">
                  <Calendar className="w-4 h-4 text-white" />
                  <span className="text-white text-[10px] font-semibold tracking-wider uppercase">
                    {(upcomingActivity.status || "").toLowerCase() === "ongoing"
                      ? "Ongoing Activity"
                      : "Upcoming Activity"}
                  </span>
                </div>

                {/* Split row: Details on left, vertical gallery preview on right */}
                <div className="flex gap-4 sm:gap-5 items-stretch">
                  {/* Left details */}
                  <div className="flex-1 flex flex-col justify-between">
                    <div>
                      <h3 className="text-[#F5F5F3] text-base sm:text-lg font-bold tracking-tight leading-snug group-hover:text-white transition-colors">
                        {upcomingActivity.title}
                      </h3>

                      <div className="mt-3 space-y-2 text-xs text-[#B5B8BC]">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-3.5 h-3.5 text-[#858A91]" />
                          <span className="font-mono">
                            {formatActivityDate(upcomingActivity.startDate)}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <MapPin className="w-3.5 h-3.5 text-[#858A91]" />
                          <span className="line-clamp-1">{upcomingActivity.venue || "GCU Campus"}</span>
                        </div>
                      </div>

                      <p className="text-[#B5B8BC] text-xs leading-relaxed mt-3.5 line-clamp-3">
                        {upcomingActivity.shortDescription}
                      </p>
                    </div>
                  </div>

                  {/* Right Vertical Image */}
                  {upcomingActivity.coverImage && (
                    <div className="relative w-28 sm:w-36 min-h-[170px] sm:min-h-[190px] rounded-xl sm:rounded-2xl overflow-hidden shrink-0 border border-[#303338] bg-[#0d0e11] flex items-center justify-center">
                      {!coverError ? (
                        <>
                          <Image
                            src={upcomingActivity.coverImage}
                            alt={upcomingActivity.title}
                            fill
                            className="object-cover transition-transform duration-700 group-hover:scale-105"
                            sizes="150px"
                            unoptimized={upcomingActivity.coverImage.startsWith("data:")}
                            onError={() => setCoverError(true)}
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
                        </>
                      ) : (
                        <div className="flex flex-col items-center justify-center text-center p-2 text-[#858A91]">
                          <Calendar className="w-5 h-5 text-[#555a61] mb-1" />
                          <span className="text-[10px] font-mono text-[#B5B8BC]">Event Poster</span>
                        </div>
                      )}

                      {/* Arrow inside Image */}
                      <div className="absolute bottom-2.5 right-2.5 w-7 h-7 rounded-full bg-black/80 backdrop-blur-md border border-[#303338] flex items-center justify-center text-white group-hover:bg-white group-hover:text-[#08090A] group-hover:border-white transition-all">
                        <ArrowRight className="w-3.5 h-3.5" />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col justify-between h-full py-1 min-h-[220px]">
              <div>
                <div className="flex items-center gap-2 mb-3 sm:mb-4">
                  <Calendar className="w-4 h-4 text-white" />
                  <span className="text-white text-[10px] font-semibold tracking-wider uppercase">
                    Upcoming Activity
                  </span>
                </div>

                <div className="space-y-2.5 my-2">
                  <h3 className="text-[#F5F5F3] text-base sm:text-lg font-bold tracking-tight group-hover:text-white transition-colors">
                    No Upcoming Activities Scheduled
                  </h3>
                  <p className="text-[#858A91] text-xs sm:text-[13px] leading-relaxed">
                    There are no upcoming activities scheduled at the moment. Stay tuned for new photo walks, workshops, exhibitions, and campus competitions!
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between pt-4 mt-6 border-t border-[#303338]">
                <span className="text-xs font-semibold text-[#D5D9DE] group-hover:text-white transition-colors">
                  View Activities Archive
                </span>
                <div className="w-8 h-8 rounded-full bg-[#17191C] border border-[#303338] flex items-center justify-center text-[#B5B8BC] group-hover:bg-white group-hover:text-[#08090A] group-hover:border-white transition-all">
                  <ArrowRight className="w-3.5 h-3.5" />
                </div>
              </div>
            </div>
          )}
        </Link>
      </div>
    </section>
  );
}
