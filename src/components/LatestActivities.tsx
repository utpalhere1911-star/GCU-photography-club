"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Sparkles, Camera } from "lucide-react";
import { Activity, formatActivityDate } from "@/data/activities";
import {
  getStoredActivities,
  fetchActivities,
  subscribeActivities,
} from "@/services/activityService";
import { subscribeToRealtimeTable } from "@/lib/realtimeSync";

export default function LatestActivities() {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [failedImages, setFailedImages] = useState<Record<string, boolean>>({});

  useEffect(() => {
    let isMounted = true;

    const syncActivities = (list: Activity[]) => {
      const published = list.filter((a) => a.published !== false);
      setActivities(published.slice(0, 3));
    };

    // 1. Initial cached load
    syncActivities(getStoredActivities());

    // 2. Fetch fresh from backend
    fetchActivities()
      .then((fresh) => {
        if (isMounted && Array.isArray(fresh)) {
          syncActivities(fresh);
        }
      })
      .catch((err) => {
        console.warn("Could not fetch latest activities in LatestActivities:", err);
      });

    // 3. Realtime Supabase changes
    const unsubRealtime = subscribeToRealtimeTable("activities", () => {
      fetchActivities().then((fresh) => {
        if (isMounted && Array.isArray(fresh)) {
          syncActivities(fresh);
        }
      });
    });

    // 4. Local browser events
    const unsubLocal = subscribeActivities((updated) => {
      if (isMounted) {
        syncActivities(updated);
      }
    });

    return () => {
      isMounted = false;
      unsubRealtime();
      unsubLocal();
    };
  }, []);

  return (
    <div
      id="activities"
      className="bg-[#111315]/95 backdrop-blur-xl border border-[#303338] rounded-2xl sm:rounded-3xl p-5 sm:p-6 shadow-2xl shadow-black/70 flex flex-col justify-between h-full"
    >
      {/* Panel Header */}
      <div className="flex items-center justify-between pb-4 border-b border-[#303338] mb-5">
        <div className="flex items-center gap-2.5">
          <span className="w-5 h-1 bg-white rounded-full inline-block" />
          <h2 className="text-[#F5F5F3] text-base sm:text-lg font-bold tracking-tight">
            Latest Activities
          </h2>
        </div>

        <Link
          href="/activities"
          className="text-[#D5D9DE] hover:text-white font-semibold text-xs flex items-center gap-1 transition group"
        >
          <span>View All Activities</span>
          <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
        </Link>
      </div>

      {/* Activities Grid */}
      {activities.length === 0 ? (
        <div className="py-10 text-center space-y-2">
          <Sparkles className="w-6 h-6 text-[#858A91] mx-auto mb-2" />
          <p className="text-xs text-[#858A91]">No activities published yet.</p>
          <Link
            href="/activities"
            className="text-xs text-white hover:underline font-medium inline-block"
          >
            Explore Activities Page
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-4 flex-1">
          {activities.map((activity) => (
            <Link
              key={activity.id}
              href="/activities"
              className="group rounded-2xl bg-[#17191C]/60 border border-[#303338] hover:border-zinc-500/60 p-2.5 transition-all duration-300 flex flex-col justify-between"
            >
              <div>
                {/* Thumbnail Image */}
                <div className="relative w-full aspect-[4/3] rounded-xl overflow-hidden mb-3 border border-[#303338] bg-black">
                  {failedImages[activity.id] ? (
                    <div className="w-full h-full bg-[#121316] flex flex-col items-center justify-center text-neutral-400 p-2 text-center">
                      <Camera className="w-6 h-6 opacity-50 mb-1" />
                      <span className="text-[10px] font-mono">Image unavailable</span>
                    </div>
                  ) : (
                    <Image
                      src={activity.coverImage}
                      alt={activity.title}
                      fill
                      onError={() => setFailedImages((prev) => ({ ...prev, [activity.id]: true }))}
                      className="object-cover transition-transform duration-500 group-hover:scale-105"
                      sizes="(max-width: 640px) 100vw, 220px"
                      unoptimized={activity.coverImage.startsWith("data:")}
                    />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-80 group-hover:opacity-60 transition-opacity pointer-events-none" />

                  {/* Date pill overlay */}
                  <div className="absolute top-2 left-2 bg-black/80 backdrop-blur-md px-2 py-0.5 rounded text-[10px] font-mono text-[#D5D9DE] border border-[#303338]">
                    {formatActivityDate(activity.startDate)}
                  </div>
                </div>

                {/* Title & Description */}
                <h3 className="text-[#F5F5F3] text-xs sm:text-sm font-bold tracking-tight leading-snug group-hover:text-white transition-colors line-clamp-1">
                  {activity.title}
                </h3>
                <p className="text-[#B5B8BC] text-[11px] leading-relaxed mt-1.5 line-clamp-2">
                  {activity.shortDescription}
                </p>
              </div>

              {/* Bottom Row with Arrow */}
              <div className="flex items-center justify-end pt-3 mt-2 border-t border-[#303338]/60">
                <div className="w-6 h-6 rounded-full bg-[#111315] border border-[#303338] flex items-center justify-center text-[#B5B8BC] group-hover:bg-white group-hover:text-[#08090A] group-hover:border-white transition-all">
                  <ArrowRight className="w-3 h-3" />
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
