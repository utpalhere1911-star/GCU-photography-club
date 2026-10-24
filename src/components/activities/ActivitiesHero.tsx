"use client";

import React from "react";
import Image from "next/image";

export default function ActivitiesHero() {
  return (
    <section className="relative w-full pt-24 sm:pt-28 pb-12 sm:pb-20 overflow-hidden bg-[#08090A]">
      {/* Background Student Photographer Framing Campus Life */}
      <div className="absolute inset-0 z-0">
        <Image
          src="/images/hero-photographer.jpg"
          alt="ShutterScape student photographer capturing campus moments at Girijananda Chowdhury University"
          fill
          priority
          className="object-cover object-[75%_25%] sm:object-[80%_center] lg:object-right brightness-[0.62] contrast-[1.12]"
          sizes="100vw"
        />

        {/* Ambient monochrome gradient overlays for high legibility */}
        <div className="absolute inset-0 bg-gradient-to-r from-[#08090A] via-[#08090A]/90 via-45% to-transparent pointer-events-none" />
        <div className="absolute inset-0 bg-gradient-to-b from-[#08090A]/95 via-transparent to-transparent h-28 pointer-events-none" />
        <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-[#08090A] via-[#08090A]/85 to-transparent pointer-events-none" />
      </div>

      {/* Hero Content */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-8 w-full">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pt-2 sm:pt-6">
          
          {/* Left Column: Headline and Description */}
          <div className="max-w-2xl text-left">
            {/* Category Pill Tag */}
            <div className="inline-flex items-center gap-2 mb-3 sm:mb-3.5">
              <span className="w-1.5 h-1.5 rounded-full bg-white shadow-[0_0_8px_rgba(255,255,255,0.7)]" />
              <span className="text-[#B5B8BC] text-[10px] sm:text-xs font-semibold tracking-[0.24em] uppercase">
                OUR ACTIVITIES
              </span>
            </div>

            {/* Main Headline */}
            <h1 className="text-3xl sm:text-5xl lg:text-[62px] font-extrabold tracking-tight text-[#F5F5F3] leading-[1.1]">
              Moments Beyond
              <br />
              <span className="text-white drop-shadow-[0_2px_15px_rgba(255,255,255,0.15)]">the</span> Classroom
            </h1>

            {/* Subtitle */}
            <p className="mt-4 sm:mt-5 text-[#B5B8BC] text-sm sm:text-base lg:text-[16px] font-normal leading-relaxed max-w-xl">
              From photo walks to exhibitions, workshops to challenges — explore the events, experiences and stories that make ShutterScape a vibrant community.
            </p>
          </div>

          {/* Right Column: Editorial Badges */}
          <div className="hidden lg:flex flex-col items-end justify-center text-right py-4">
            <div className="text-left border-l border-[#303338] pl-4 py-1.5 bg-[#08090A]/40 backdrop-blur-md rounded-r-xl">
              <div className="font-mono text-[11px] tracking-[0.24em] font-medium text-[#858A91] space-y-2 uppercase">
                <div className="hover:text-white transition cursor-default">PEOPLE</div>
                <div className="hover:text-white transition cursor-default">PLACES</div>
                <div className="hover:text-white transition cursor-default">PERSPECTIVES</div>
                <div className="hover:text-white transition cursor-default text-[#B5B8BC] font-semibold">GCU GUWAHATI</div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
