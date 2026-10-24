"use client";

import React from "react";
import { Target, Eye, Users } from "lucide-react";

export default function MissionVisionValues() {
  return (
    <section className="relative w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
        
        {/* Card 1: Our Mission */}
        <div className="bg-[#111315]/95 backdrop-blur-xl border border-[#303338] hover:border-[#555a62] rounded-2xl sm:rounded-3xl p-6 sm:p-7 shadow-xl shadow-black/60 transition-all duration-300 flex flex-col justify-between group text-left">
          <div>
            <div className="w-11 h-11 rounded-full bg-[#17191C] border border-[#303338] flex items-center justify-center text-white mb-4 group-hover:border-white/50 group-hover:scale-105 transition-all shadow-inner">
              <Target className="w-5 h-5 text-white/90 group-hover:text-white" />
            </div>

            <h3 className="text-lg sm:text-xl font-bold text-[#F5F5F3] tracking-tight group-hover:text-white transition-colors">
              Our Mission
            </h3>

            <p className="mt-2.5 text-xs sm:text-[13px] text-[#B5B8BC] leading-relaxed">
              To provide GCU students with hands-on opportunities to learn camera craft, develop visual skills, and document campus life.
            </p>
          </div>
        </div>

        {/* Card 2: Our Vision */}
        <div className="bg-[#111315]/95 backdrop-blur-xl border border-[#303338] hover:border-[#555a62] rounded-2xl sm:rounded-3xl p-6 sm:p-7 shadow-xl shadow-black/60 transition-all duration-300 flex flex-col justify-between group text-left">
          <div>
            <div className="w-11 h-11 rounded-full bg-[#17191C] border border-[#303338] flex items-center justify-center text-white mb-4 group-hover:border-white/50 group-hover:scale-105 transition-all shadow-inner">
              <Eye className="w-5 h-5 text-white/90 group-hover:text-white" />
            </div>

            <h3 className="text-lg sm:text-xl font-bold text-[#F5F5F3] tracking-tight group-hover:text-white transition-colors">
              Our Vision
            </h3>

            <p className="mt-2.5 text-xs sm:text-[13px] text-[#B5B8BC] leading-relaxed">
              To build an active, student-led community recognized for thoughtful visual storytelling and inclusive campus participation.
            </p>
          </div>
        </div>

        {/* Card 3: Our Values */}
        <div className="bg-[#111315]/95 backdrop-blur-xl border border-[#303338] hover:border-[#555a62] rounded-2xl sm:rounded-3xl p-6 sm:p-7 shadow-xl shadow-black/60 transition-all duration-300 flex flex-col justify-between group text-left">
          <div>
            <div className="w-11 h-11 rounded-full bg-[#17191C] border border-[#303338] flex items-center justify-center text-white mb-4 group-hover:border-white/50 group-hover:scale-105 transition-all shadow-inner">
              <Users className="w-5 h-5 text-white/90 group-hover:text-white" />
            </div>

            <h3 className="text-lg sm:text-xl font-bold text-[#F5F5F3] tracking-tight group-hover:text-white transition-colors">
              Our Values
            </h3>

            <div className="mt-2.5 space-y-1.5 text-xs sm:text-[13px] text-[#B5B8BC] leading-relaxed">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[#F5F5F3] font-medium">Learning</span>
                <span className="text-[#858A91]">·</span>
                <span className="text-[#F5F5F3] font-medium">Practice</span>
                <span className="text-[#858A91]">·</span>
                <span className="text-[#F5F5F3] font-medium">Inclusivity</span>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[#B5B8BC]">Creativity</span>
                <span className="text-[#858A91]">·</span>
                <span className="text-[#B5B8BC]">Collaboration</span>
                <span className="text-[#858A91]">·</span>
                <span className="text-[#B5B8BC]">Community</span>
              </div>
            </div>
          </div>
        </div>

      </div>
    </section>
  );
}
