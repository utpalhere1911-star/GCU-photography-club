"use client";

import React from "react";
import Link from "next/link";
import { ArrowRight, Play } from "lucide-react";

interface HeroSectionProps {
  onOpenJoin?: () => void;
}

export default function HeroSection({
  onOpenJoin,
}: HeroSectionProps) {
  return (
    <section className="relative w-full min-h-[500px] sm:min-h-[580px] lg:min-h-[660px] pt-24 sm:pt-28 pb-14 sm:pb-20 flex items-end overflow-hidden">
      {/* Responsive Background Picture Element */}
      <div className="absolute inset-0 z-0 overflow-hidden">
        <picture className="absolute inset-0 w-full h-full block">
          {/* Mobile view (< 768px): portrait format showcasing photographer & SHUTTERSCAPE wordmark */}
          <source
            media="(max-width: 767px)"
            srcSet="/images/hero-mobile.png"
          />
          {/* Desktop view (>= 768px): landscape format */}
          <source
            media="(min-width: 768px)"
            srcSet="/images/hero-campus.png"
          />
          <img
            src="/images/hero-campus.png"
            alt="ShutterScape photographer in silhouette with dramatic backlighting"
            className="w-full h-full object-cover object-[center_top] sm:object-[center_25%] md:object-[center_35%] lg:object-center brightness-[0.98] contrast-[1.06] transition-all"
            loading="eager"
            fetchPriority="high"
          />
        </picture>

        {/* Cinematic Subtle Monochrome Gradient Overlays */}
        {/* Top subtle vignette for header integration */}
        <div className="absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-[#08090A]/85 via-transparent to-transparent pointer-events-none" />

        {/* Bottom smooth fade to card sections */}
        <div className="absolute inset-x-0 bottom-0 h-36 sm:h-48 bg-gradient-to-t from-[#08090A] via-[#08090A]/70 to-transparent pointer-events-none" />
      </div>

      {/* Content Container */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-8 w-full">
        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-4 sm:gap-6">
          {/* Primary White Button: Join the Club */}
          <button
            onClick={onOpenJoin}
            className="inline-flex items-center gap-2.5 bg-white hover:bg-[#D5D9DE] text-[#08090A] font-semibold px-6 sm:px-7 py-3 sm:py-3.5 rounded-full text-xs sm:text-sm shadow-xl shadow-white/10 transition-all duration-200 transform hover:-translate-y-0.5 active:translate-y-0 cursor-pointer"
          >
            <span>Join the Club</span>
            <ArrowRight className="w-4 h-4" />
          </button>

          {/* Secondary Monochrome Outline Action: Navigate directly to /activities */}
          <Link
            href="/activities"
            className="inline-flex items-center gap-3 text-[#F5F5F3] hover:text-white text-xs sm:text-sm font-medium transition-all group py-2"
          >
            <span className="w-9 h-9 rounded-full bg-[#17191C]/80 border border-[#303338] backdrop-blur-md flex items-center justify-center group-hover:border-white group-hover:bg-white group-hover:text-[#08090A] transition-all duration-200">
              <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
            </span>
            <span>Discover Our Activities</span>
          </Link>
        </div>
      </div>
    </section>
  );
}
