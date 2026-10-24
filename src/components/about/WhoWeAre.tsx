"use client";

import React from "react";
import { Camera, MapPin } from "lucide-react";

export default function WhoWeAre() {
  return (
    <section className="relative w-full max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14">
      <div className="relative rounded-2xl sm:rounded-3xl border border-[#303338] bg-[#111315]/95 backdrop-blur-xl p-6 sm:p-10 lg:p-12 shadow-2xl shadow-black/60 text-left">
        {/* Top Meta Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-6 border-b border-[#303338]/80">
          <div className="inline-flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-white shadow-[0_0_8px_rgba(255,255,255,0.7)]" />
            <span className="text-[#858A91] text-[11px] font-mono font-medium tracking-[0.24em] uppercase">
              WHO WE ARE
            </span>
          </div>

          <div className="inline-flex items-center gap-2 text-[11px] font-mono text-[#858A91]">
            <MapPin className="w-3.5 h-3.5 text-[#B5B8BC]" />
            <span>GIRJANANDA CHOWDHURY UNIVERSITY · GUWAHATI</span>
          </div>
        </div>

        {/* Core Narrative Body */}
        <div className="pt-6 sm:pt-8 grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
          <div className="lg:col-span-5">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-[#F5F5F3] tracking-tight leading-tight">
              The Photography Club of GCU
            </h2>
            <div className="mt-4 flex items-center gap-2 text-xs font-mono text-[#858A91]">
              <Camera className="w-4 h-4 text-white/80" />
              <span>Student-Led Campus Photography</span>
            </div>
          </div>

          <div className="lg:col-span-7 space-y-4 text-xs sm:text-sm text-[#B5B8BC] leading-relaxed">
            <p>
              ShutterScape is the official photography club of Girijananda Chowdhury University, Guwahati. We bring together students who want to learn photography, practice hands-on shooting, and document university life.
            </p>
            <p className="text-[#858A91]">
              From university festivals and cultural celebrations to weekend photo walks and technical workshops, we provide an open, supportive space for anyone eager to pick up a camera and share their perspective.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
