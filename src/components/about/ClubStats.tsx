"use client";

import React from "react";
import { Camera, Users, Image as ImageIcon, Trophy } from "lucide-react";

interface StatItem {
  id: string;
  icon: React.ElementType;
  label: string;
  value: string;
  subtitle: string;
}

const stats: StatItem[] = [
  {
    id: "events",
    icon: Camera,
    label: "Events Covered",
    value: "25+",
    subtitle: "Campus & External",
  },
  {
    id: "members",
    icon: Users,
    label: "Active Members",
    value: "100+",
    subtitle: "Students",
  },
  {
    id: "photographs",
    icon: ImageIcon,
    label: "Photographs",
    value: "1000+",
    subtitle: "Moments Captured",
  },
  {
    id: "years",
    icon: Trophy,
    label: "Years of Practice",
    value: "4+",
    subtitle: "Since Foundation",
  },
];

export default function ClubStats() {
  return (
    <section className="relative z-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-5 sm:-mt-8">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div
              key={stat.id}
              className="bg-[#111315]/95 backdrop-blur-xl border border-[#303338] hover:border-[#555a62] rounded-2xl p-3.5 sm:p-5 shadow-xl shadow-black/70 transition-all duration-300 flex flex-col xs:flex-row items-start xs:items-center gap-3 sm:gap-4 group"
            >
              {/* Rounded Icon Box */}
              <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-[#17191C] border border-[#303338] flex items-center justify-center text-white shrink-0 group-hover:border-white/50 group-hover:scale-105 transition-all duration-200 shadow-inner">
                <Icon className="w-5 h-5 text-white/90 group-hover:text-white" />
              </div>

              {/* Stat Details */}
              <div className="min-w-0 flex-1 w-full text-left">
                <div className="text-[11px] sm:text-xs text-[#858A91] font-medium leading-none truncate">
                  {stat.label}
                </div>
                <div className="text-xl sm:text-2xl lg:text-3xl font-extrabold text-[#F5F5F3] font-mono tracking-tight mt-1 group-hover:text-white transition-colors">
                  {stat.value}
                </div>
                <div className="text-[10px] sm:text-[11px] text-[#B5B8BC] leading-none mt-1 truncate">
                  {stat.subtitle}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
