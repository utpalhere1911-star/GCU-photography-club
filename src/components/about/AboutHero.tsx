"use client";

import React from "react";
import Image from "next/image";

export default function AboutHero() {
  return (
    <section className="relative w-full pt-24 sm:pt-32 pb-12 sm:pb-18 overflow-hidden bg-[#08090A]">
      {/* Background Student Photographer Framing Campus Life */}
      <div className="absolute inset-0 z-0">
        <Image
          src="/images/hero-photographer.jpg"
          alt="ShutterScape student photographer framing moments at Girijananda Chowdhury University"
          fill
          priority
          className="object-cover object-[75%_25%] sm:object-[75%_30%] brightness-[0.7] contrast-[1.14]"
          sizes="100vw"
        />

        {/* Cinematic gradient overlays */}
        <div className="absolute inset-0 bg-gradient-to-r from-[#08090A] via-[#08090A]/90 via-40% sm:via-50% to-transparent pointer-events-none" />
        <div className="absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-[#08090A]/95 via-[#08090A]/70 to-transparent pointer-events-none" />
        <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-[#08090A] via-[#08090A]/80 to-transparent pointer-events-none" />
      </div>

      {/* Hero Content Container */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 sm:gap-8 pt-2 sm:pt-6">
          
          {/* Left Column: Eyebrow, Main Headline, and Supporting Copy */}
          <div className="max-w-2xl text-left">
            {/* Section Eyebrow */}
            <div className="inline-flex items-center gap-2 mb-3 sm:mb-3.5">
              <span className="w-1.5 h-1.5 rounded-full bg-white shadow-[0_0_8px_rgba(255,255,255,0.7)]" />
              <span className="text-[#858A91] text-[11px] sm:text-xs font-mono font-medium tracking-[0.26em] uppercase">
                ABOUT SHUTTERSCAPE
              </span>
            </div>

            {/* Main Headline */}
            <h1 className="text-3xl xs:text-4xl sm:text-5xl lg:text-[62px] font-black tracking-tight text-[#F5F5F3] leading-[1.08]">
              Capturing GCU
              <br />
              Through Every Lens
            </h1>

            {/* Natural Supporting Copy */}
            <p className="mt-4 sm:mt-5 text-[#B5B8BC] text-sm sm:text-base font-normal leading-relaxed max-w-xl">
              The official student photography club of Girijananda Chowdhury University — bringing together students to practice camera craft, cover campus life, and share visual stories.
            </p>
          </div>

          {/* Right Column: Understated Script Phrase */}
          <div className="hidden lg:flex flex-col items-start pr-6 pt-6 select-none pointer-events-none transform -rotate-2">
            <div className="font-handwriting text-3xl xl:text-4xl text-[#B5B8BC]/80 leading-snug drop-shadow-sm">
              <span>Different</span>
              <br />
              <span className="pl-3">Perspectives</span>
              <br />
              <span className="pl-6">One Campus</span>
            </div>
            <svg
              className="w-40 h-3 text-[#858A91]/50 ml-6 -mt-1"
              viewBox="0 0 160 12"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              aria-hidden="true"
            >
              <path
                d="M3 9C45 3 110 2 157 9"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
          </div>

        </div>
      </div>
    </section>
  );
}
