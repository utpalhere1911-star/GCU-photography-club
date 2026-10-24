"use client";

import React from "react";
import Image from "next/image";
import { ArrowRight } from "lucide-react";

interface AboutCTAProps {
  onOpenJoin: () => void;
}

export default function AboutCTA({ onOpenJoin }: AboutCTAProps) {
  return (
    <section className="relative w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-14">
      <div className="relative rounded-2xl sm:rounded-3xl overflow-hidden border border-[#303338] bg-[#111315] p-6 sm:p-10 lg:p-12 shadow-2xl shadow-black/80">
        
        {/* Background Wide Sunset Photographers Silhouette */}
        <div className="absolute inset-0 z-0">
          <Image
            src="/images/about-cta-sunset.jpg"
            alt="University student photographers gathered at dusk"
            fill
            className="object-cover object-right sm:object-center brightness-[0.68] contrast-[1.15]"
            sizes="(max-width: 1280px) 100vw, 1280px"
          />

          {/* Cinematic dark gradients */}
          <div className="absolute inset-0 bg-gradient-to-r from-[#08090A] via-[#08090A]/90 via-50% to-transparent pointer-events-none" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#08090A]/80 via-transparent to-transparent pointer-events-none" />
        </div>

        {/* Top-Right Handwritten Signature Accent */}
        <div 
          aria-hidden="true" 
          className="hidden md:block absolute top-6 right-8 select-none pointer-events-none font-handwriting text-3xl lg:text-4xl text-white/25 transform -rotate-6"
        >
          ShutterScape
        </div>

        {/* Foreground Content */}
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6 sm:gap-8 max-w-xl lg:max-w-none">
          
          {/* Left Text Block */}
          <div className="max-w-xl text-left">
            <div className="inline-flex items-center gap-2 mb-3">
              <span className="w-1.5 h-1.5 rounded-full bg-white shadow-[0_0_8px_rgba(255,255,255,0.7)]" />
              <span className="text-[#858A91] text-[10px] sm:text-[11px] font-mono font-medium tracking-[0.24em] uppercase">
                GET INVOLVED
              </span>
            </div>

            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-[#F5F5F3] tracking-tight leading-tight">
              Join ShutterScape
            </h2>

            <p className="mt-3 text-xs sm:text-sm text-[#B5B8BC] leading-relaxed max-w-lg">
              Whether you shoot on a smartphone or a dedicated camera, join us for campus event coverage, practical workshops, and weekend photo walks.
            </p>
          </div>

          {/* Right Action Button with comfortable touch target */}
          <div className="shrink-0 pt-2 lg:pt-0">
            <button
              onClick={onOpenJoin}
              type="button"
              className="w-full sm:w-auto min-h-[44px] inline-flex items-center justify-center gap-2 bg-white hover:bg-[#D5D9DE] text-[#08090A] font-semibold px-6 py-3 rounded-full text-xs sm:text-sm shadow-xl shadow-white/10 transition-all duration-200 transform hover:-translate-y-0.5 active:translate-y-0 cursor-pointer"
            >
              <span>Join the Club</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

        </div>
      </div>
    </section>
  );
}
