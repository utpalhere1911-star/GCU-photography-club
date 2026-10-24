"use client";

import React, { useState } from "react";
import Image from "next/image";
import { ArrowRight, Calendar, Compass, MapPin, Camera } from "lucide-react";
import { Activity, formatActivityDate } from "@/data/activities";

interface PastActivitiesTimelineProps {
  pastActivities: Activity[];
  onSelectActivity: (activity: Activity) => void;
}

export default function PastActivitiesTimeline({
  pastActivities,
  onSelectActivity,
}: PastActivitiesTimelineProps) {
  const [failedImages, setFailedImages] = useState<Record<string, boolean>>({});

  if (!pastActivities || pastActivities.length === 0) {
    return (
      <div className="w-full bg-[#111315] border border-[#303338] rounded-2xl sm:rounded-3xl p-8 text-center shadow-[0_8px_32px_rgba(0,0,0,0.6)]">
        <div className="max-w-md mx-auto space-y-2">
          <Compass className="w-8 h-8 text-[#858A91] mx-auto" />
          <h3 className="text-[#F5F5F3] font-bold text-base">No Activities Found</h3>
          <p className="text-[#858A91] text-xs sm:text-sm">
            No past activities match your selected filter or search query. Try clearing your search or switching categories.
          </p>
        </div>
      </div>
    );
  }

  // Group activities by year in descending order
  const groupedByYear = pastActivities.reduce<Record<number, Activity[]>>(
    (acc, activity) => {
      const year = activity.year || (activity.startDate ? parseInt(activity.startDate.split("-")[0], 10) : 2026);
      if (!acc[year]) acc[year] = [];
      acc[year].push(activity);
      return acc;
    },
    {}
  );

  const years = Object.keys(groupedByYear)
    .map(Number)
    .sort((a, b) => b - a);

  // Sort activities within each year newest first
  years.forEach((yr) => {
    groupedByYear[yr].sort((a, b) => {
      const timeA = new Date(a.startDate).getTime();
      const timeB = new Date(b.startDate).getTime();
      return timeB - timeA;
    });
  });

  return (
    <div className="w-full space-y-6 sm:space-y-8">
      {/* Section Header */}
      <div className="flex items-center justify-between pb-3 border-b border-[#303338]">
        <div className="flex items-center gap-3">
          <span className="w-1.5 h-6 bg-white rounded-full inline-block shadow-[0_0_8px_rgba(255,255,255,0.6)]" />
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-[#F5F5F3]">
            Past Activities
          </h2>
          <span className="text-[#858A91] text-xs sm:text-sm font-normal hidden sm:inline ml-2">
            A timeline of our events, experiences and creative journeys.
          </span>
        </div>
      </div>

      {/* Chronological Timeline Container */}
      <div className="relative space-y-10 sm:space-y-12">
        
        {/* Continuous visible vertical timeline line connecting all years and items */}
        <div 
          aria-hidden="true"
          className="absolute left-[15px] sm:left-[19px] top-4 bottom-4 w-0.5 bg-gradient-to-b from-white/70 via-[#444850] to-[#303338] pointer-events-none z-0" 
        />

        {years.map((year) => {
          const yearActivities = groupedByYear[year];
          return (
            <div key={year} className="relative z-10 space-y-4">
              
              {/* Year Heading & Node Badge */}
              <div className="flex items-center gap-3 select-none">
                {/* Year Marker Badge on the rail */}
                <div className="relative z-10 w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-[#08090A] border-2 border-white text-white flex items-center justify-center shadow-[0_0_12px_rgba(255,255,255,0.4)] shrink-0">
                  <Calendar className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white" />
                </div>
                
                {/* Year Badge Tag */}
                <div className="flex items-center gap-2.5 px-3.5 py-1 rounded-full bg-[#111315] border border-[#303338] shadow-md">
                  <span className="font-mono text-sm sm:text-base font-extrabold text-[#F5F5F3] tracking-wider">
                    {year}
                  </span>
                  <span className="text-[11px] text-[#858A91] font-medium">
                    · {yearActivities.length} {yearActivities.length === 1 ? "event" : "events"}
                  </span>
                </div>
              </div>

              {/* Year Activities List with Left Timeline Markers */}
              <div className="space-y-4 pt-1">
                {yearActivities.map((activity) => (
                  <div
                    key={activity.id}
                    className="relative flex items-start gap-2.5 sm:gap-5 group min-w-0"
                  >
                    {/* Left Timeline Node Dot aligned with Card */}
                    <div className="w-8 sm:w-10 shrink-0 flex items-center justify-center pt-3.5 sm:pt-5 z-10 select-none">
                      <div className="relative flex items-center justify-center">
                        {/* Soft white ambient halo on hover */}
                        <div className="absolute -inset-1 rounded-full bg-white/10 group-hover:bg-white/30 blur-[2px] transition-all duration-300" />
                        {/* Dot marker */}
                        <div className="relative w-3.5 h-3.5 rounded-full bg-[#08090A] border-2 border-white group-hover:bg-white transition-all duration-200 shadow-[0_0_8px_rgba(255,255,255,0.5)]" />
                      </div>
                    </div>

                    {/* Main Activity Card */}
                    <div
                      onClick={() => onSelectActivity(activity)}
                      className="flex-1 min-w-0 bg-[#17191C] backdrop-blur-xl border border-[#303338] hover:border-[#555a62] rounded-2xl sm:rounded-3xl p-3 sm:p-4 shadow-[0_8px_30px_rgba(0,0,0,0.7)] hover:shadow-[0_12px_36px_rgba(0,0,0,0.9),0_0_20px_rgba(255,255,255,0.03)] transition-all duration-300 cursor-pointer flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 sm:gap-5 z-10"
                    >
                      {/* Left: Cover Thumbnail */}
                      <div className="relative w-full sm:w-44 md:w-48 aspect-[16/10] sm:aspect-[16/9] rounded-xl overflow-hidden shrink-0 shadow-md border border-[#303338] bg-black">
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
                            sizes="(max-width: 640px) 100vw, 200px"
                            unoptimized={activity.coverImage.startsWith("data:")}
                          />
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />
                      </div>

                      {/* Middle: Content & Metadata */}
                      <div className="flex-1 min-w-0 flex flex-col justify-center">
                        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 mb-2">
                          {/* Editorial activity date badge */}
                          <span className="inline-flex items-center gap-1.5 text-[11px] sm:text-xs font-medium text-[#E0E2E6] bg-[#111315] px-2.5 py-0.5 rounded-md border border-[#303338] tracking-wide">
                            <Calendar className="w-3 h-3 text-[#858A91] shrink-0" />
                            <span>{formatActivityDate(activity.startDate, activity.endDate)}</span>
                          </span>
                          <span className="text-[10px] sm:text-[11px] font-semibold text-[#858A91] tracking-wider uppercase px-2 sm:px-2.5 py-0.5 rounded-full bg-[#111315] border border-[#303338]">
                            {activity.category}
                          </span>
                        </div>

                        <h3 className="text-[#F5F5F3] text-sm sm:text-lg font-bold tracking-tight group-hover:text-white transition-colors leading-snug break-words">
                          {activity.title}
                        </h3>

                        <p className="text-[#858A91] text-xs sm:text-[13px] leading-relaxed mt-1.5 line-clamp-2 break-words">
                          {activity.shortDescription}
                        </p>

                        {activity.venue && (
                          <div className="flex items-center gap-1.5 text-[11px] text-[#858A91] mt-2">
                            <MapPin className="w-3 h-3 text-[#B5B8BC] shrink-0" />
                            <span className="truncate">{activity.venue}</span>
                          </div>
                        )}
                      </div>

                      {/* Right: Supporting Gallery Thumbnails & Circular Arrow */}
                      <div className="flex items-center gap-2 sm:gap-3 shrink-0 self-end md:self-center">
                        {activity.galleryImages && activity.galleryImages.length > 0 && (
                          <div className="hidden lg:flex items-center gap-2">
                            {activity.galleryImages.slice(0, 2).map((thumb, idx) => (
                              <div
                                key={idx}
                                className="relative w-16 sm:w-20 aspect-[4/3] rounded-lg overflow-hidden border border-[#303338] shadow-sm bg-black"
                              >
                                <Image
                                  src={thumb}
                                  alt={`Highlight ${idx + 1}`}
                                  fill
                                  className="object-cover transition-transform duration-300 group-hover:scale-105"
                                  sizes="80px"
                                  unoptimized={thumb.startsWith("data:")}
                                />
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Arrow Button */}
                        <div className="w-8 h-8 rounded-full bg-[#111315] border border-[#303338] flex items-center justify-center text-[#B5B8BC] group-hover:bg-white group-hover:text-[#08090A] group-hover:border-white transition-all ml-0.5 shadow-sm">
                          <ArrowRight className="w-3.5 h-3.5" />
                        </div>
                      </div>

                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
