"use client";

import React, { useState } from "react";
import Image from "next/image";
import { Calendar, MapPin, ArrowRight, Sparkles, Clock, Camera } from "lucide-react";
import { Activity, formatActivityDate } from "@/data/activities";

interface UpcomingSectionProps {
  upcomingActivities: Activity[];
  onSelectActivity: (activity: Activity) => void;
}

export default function UpcomingSection({
  upcomingActivities,
  onSelectActivity,
}: UpcomingSectionProps) {
  const [featuredImgError, setFeaturedImgError] = useState(false);
  const [failedOtherImages, setFailedOtherImages] = useState<Record<string, boolean>>({});

  // If no upcoming activities, show graceful monochrome empty state
  if (!upcomingActivities || upcomingActivities.length === 0) {
    return (
      <div className="w-full bg-[#111315] border border-[#303338] rounded-2xl sm:rounded-3xl p-8 sm:p-12 text-center shadow-[0_8px_32px_rgba(0,0,0,0.6)]">
        <div className="max-w-md mx-auto space-y-3">
          <div className="w-12 h-12 rounded-full bg-[#17191C] border border-[#303338] text-[#F5F5F3] flex items-center justify-center mx-auto shadow-inner">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <h3 className="text-[#F5F5F3] font-bold text-lg tracking-tight">
            No Upcoming Activities Scheduled
          </h3>
          <p className="text-[#858A91] text-xs sm:text-sm leading-relaxed">
            There are no upcoming activities scheduled at the moment. Check back soon for new photo walks, workshops, exhibitions, and campus competitions!
          </p>
        </div>
      </div>
    );
  }

  // Major featured upcoming activity
  const featured = upcomingActivities[0];
  const others = upcomingActivities.slice(1);

  return (
    <div className="w-full space-y-4">
      {/* Featured Upcoming Major Card */}
      <div className="bg-[#111315] backdrop-blur-xl border border-[#303338] rounded-2xl sm:rounded-3xl p-3.5 sm:p-6 shadow-[0_12px_40px_rgba(0,0,0,0.8),0_0_24px_rgba(255,255,255,0.02)] group hover:border-[#555a62] transition-all duration-300">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-6 items-stretch">
          
          {/* Left Details Column */}
          <div className="lg:col-span-5 flex flex-col justify-between py-1">
            <div>
              {/* Badges Row */}
              <div className="flex flex-wrap items-center gap-2 mb-3 sm:mb-3.5">
                <div className="px-2.5 sm:px-3 py-1 rounded-full border border-[#444850] bg-[#17191C] flex items-center gap-1.5 shadow-sm">
                  <span className="w-1.5 h-1.5 rounded-full bg-white shadow-[0_0_6px_rgba(255,255,255,0.7)]" />
                  <span className="text-[#F5F5F3] text-[10px] sm:text-[11px] font-semibold tracking-wider uppercase">
                    {(featured.status || "").toLowerCase() === "ongoing"
                      ? "Ongoing Activity"
                      : "Upcoming Activity"}
                  </span>
                </div>
                <span className="px-2 sm:px-2.5 py-0.5 rounded-full border border-[#303338] bg-[#08090A] text-[#B5B8BC] text-[10px] sm:text-[11px] font-medium tracking-wide uppercase">
                  {featured.category}
                </span>
                {featured.registrationStatus && (
                  <span className="px-2 sm:px-2.5 py-0.5 rounded-full border border-emerald-900/60 bg-emerald-950/40 text-emerald-300 text-[10px] sm:text-[11px] font-medium">
                    {featured.registrationStatus}
                  </span>
                )}
              </div>

              {/* Title */}
              <h2 className="text-lg sm:text-2xl lg:text-[26px] font-extrabold text-[#F5F5F3] tracking-tight leading-snug group-hover:text-white transition-colors">
                {featured.title}
              </h2>

              {/* Date, Time & Venue Meta */}
              <div className="mt-2.5 sm:mt-3 flex flex-wrap items-center gap-x-3.5 gap-y-1.5 text-xs text-[#B5B8BC]">
                <div className="flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-white" />
                  <span className="font-mono">{formatActivityDate(featured.startDate)}</span>
                </div>
                {featured.time && (
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-[#858A91]" />
                    <span>{featured.time}</span>
                  </div>
                )}
                <div className="flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-[#858A91]" />
                  <span>{featured.venue}</span>
                </div>
              </div>

              {/* Description */}
              <p className="text-[#858A91] text-xs sm:text-[13px] leading-relaxed mt-3 sm:mt-3.5 max-w-lg">
                {featured.shortDescription}
              </p>
            </div>

            {/* Actions CTA (Read-only View Details) */}
            <div className="pt-4 sm:pt-6 mt-3 sm:mt-4">
              <button
                onClick={() => onSelectActivity(featured)}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-white hover:bg-[#D5D9DE] text-[#08090A] font-semibold px-5 py-2.5 rounded-full text-xs sm:text-sm shadow-lg shadow-white/5 transition-all duration-200 transform hover:-translate-y-0.5 active:translate-y-0 cursor-pointer"
              >
                <span>View Details</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Right Wide Panoramic Photograph */}
          <div className="lg:col-span-7 relative min-h-[190px] xs:min-h-[220px] sm:min-h-[280px] rounded-xl sm:rounded-2xl overflow-hidden shadow-lg border border-[#303338] bg-black">
            {featuredImgError ? (
              <div className="w-full h-full min-h-[190px] xs:min-h-[220px] sm:min-h-[280px] bg-[#121316] flex flex-col items-center justify-center text-neutral-400 p-6 text-center">
                <Camera className="w-10 h-10 mb-2 opacity-50 text-neutral-400" />
                <span className="text-xs font-mono text-neutral-400">Cover image unavailable</span>
              </div>
            ) : (
              <Image
                src={featured.coverImage}
                alt={featured.title}
                fill
                onError={() => setFeaturedImgError(true)}
                className="object-cover transition-transform duration-700 group-hover:scale-105"
                sizes="(max-width: 1024px) 100vw, 700px"
                unoptimized={featured.coverImage.startsWith("data:")}
              />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />
          </div>

        </div>
      </div>

      {/* Additional Upcoming Cards (if any) */}
      {others.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4 pt-2">
          {others.map((item) => (
            <div
              key={item.id}
              onClick={() => onSelectActivity(item)}
              className="bg-[#111315] border border-[#303338] hover:border-[#555a62] rounded-2xl p-3 sm:p-4 flex flex-col xs:flex-row gap-3 sm:gap-4 cursor-pointer transition-all duration-300 group shadow-md"
            >
              <div className="relative w-full xs:w-24 h-36 xs:h-24 rounded-xl overflow-hidden shrink-0 border border-[#303338] bg-black">
                {failedOtherImages[item.id] ? (
                  <div className="w-full h-full bg-[#121316] flex flex-col items-center justify-center text-neutral-400 p-2 text-center">
                    <Camera className="w-5 h-5 opacity-50" />
                  </div>
                ) : (
                  <Image
                    src={item.coverImage}
                    alt={item.title}
                    fill
                    onError={() => setFailedOtherImages((prev) => ({ ...prev, [item.id]: true }))}
                    className="object-cover group-hover:scale-105 transition-transform"
                    sizes="100px"
                    unoptimized={item.coverImage.startsWith("data:")}
                  />
                )}
              </div>
              <div className="flex-1 flex flex-col justify-between">
                <div>
                  <span className="text-[10px] text-[#B5B8BC] font-semibold uppercase tracking-wider block">
                    {item.category}
                  </span>
                  <h4 className="text-[#F5F5F3] text-sm font-bold line-clamp-1 group-hover:text-white transition-colors">
                    {item.title}
                  </h4>
                  <p className="text-[#858A91] text-xs line-clamp-2 mt-1">
                    {item.shortDescription}
                  </p>
                </div>
                <div className="text-[11px] text-[#858A91] flex items-center justify-between pt-2">
                  <span className="font-mono">{formatActivityDate(item.startDate)}</span>
                  <span className="text-[#F5F5F3] group-hover:translate-x-0.5 transition-transform flex items-center gap-1 font-medium">
                    Details <ArrowRight className="w-3 h-3" />
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
