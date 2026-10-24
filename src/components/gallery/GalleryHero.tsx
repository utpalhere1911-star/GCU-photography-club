"use client";

import React from "react";
import Image from "next/image";

interface GalleryHeroProps {
  totalPhotosCount: number;
}

export default function GalleryHero({ totalPhotosCount }: GalleryHeroProps) {
  return (
    <section className="relative w-full pt-24 sm:pt-28 md:pt-32 pb-10 sm:pb-14 overflow-hidden bg-[#08090A]">
      {/* Background Photographer Silhouette aligned right */}
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 sm:left-1/3 md:left-2/5">
          <Image
            src="/images/hero-photographer.jpg"
            alt="ShutterScape photographer framing campus life"
            fill
            priority
            className="object-cover object-[75%_25%] sm:object-[center_30%] md:object-right brightness-[0.7] sm:brightness-[0.8] contrast-[1.12]"
            sizes="100vw"
          />
        </div>

        {/* Cinematic Smooth Gradients matching Image 2 */}
        {/* Horizontal blend from solid black on the left to photographer on the right */}
        <div className="absolute inset-0 bg-gradient-to-r from-[#08090A] via-[#08090A] via-35% sm:via-45% md:via-55% to-transparent pointer-events-none" />

        {/* Top vignette to blend with fixed header */}
        <div className="absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-[#08090A] via-[#08090A]/80 to-transparent pointer-events-none" />

        {/* Bottom smooth fade to category toolbar */}
        <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-[#08090A] via-[#08090A]/90 to-transparent pointer-events-none" />
      </div>

      {/* Content Container */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-8 w-full">
        <div className="max-w-xl lg:max-w-2xl text-left py-2 sm:py-4">
          
          {/* Section Label: OUR GALLERY */}
          <div className="inline-block mb-3 sm:mb-4">
            <span className="text-[11px] sm:text-xs font-mono font-medium tracking-[0.26em] text-[#858A91] uppercase">
              OUR GALLERY
            </span>
          </div>

          {/* Heading: Moments in Frames */}
          <h1 className="text-4xl sm:text-6xl lg:text-[68px] font-black tracking-tight text-[#F5F5F3] leading-[1.04]">
            Moments
            <br />
            in Frames
          </h1>

          {/* Supporting Copy */}
          <p className="mt-4 sm:mt-5 text-xs sm:text-sm md:text-[15px] text-[#B5B8BC] font-normal leading-relaxed max-w-lg">
            A visual journey through the eyes of our community — capturing campus life,
            people, places and perspectives that make GCU special.
          </p>
        </div>
      </div>
    </section>
  );
}
