"use client";

import React, { useState } from "react";
import Image from "next/image";
import { Compass, Camera } from "lucide-react";

interface Founder {
  id: string;
  name: string;
  role: string;
  cohort: string;
  contribution: string;
  imageSrc: string;
  alt: string;
  objectPosition: string;
}

const founders: Founder[] = [
  {
    id: "dheemaan-deka",
    name: "Dheemaan Deka",
    role: "Co-Founder",
    cohort: "Class of 2023",
    contribution:
      "Helped establish the club's framework in 2023 and organized its earliest campus photo walks, encouraging students of all experience levels to get involved with photography.",
    imageSrc: "/images/about/origin/dheemaan-deka.jpg",
    alt: "Dheemaan Deka — ShutterScape Co-Founder (2023)",
    objectPosition: "center 20%",
  },
  {
    id: "subhrajyoti-goswami",
    name: "Subhrajyoti Goswami",
    role: "Co-Founder",
    cohort: "Class of 2023",
    contribution:
      "Co-founded ShutterScape to give campus photographers an active peer community, focusing on hands-on camera practice and collaborative event coverage across the university.",
    imageSrc: "/images/about/origin/subhrajyoti-goswami.jpg",
    alt: "Subhrajyoti Goswami — ShutterScape Co-Founder (2023)",
    objectPosition: "center 18%",
  },
];

export default function WhereItAllStarts() {
  const [imageErrors, setImageErrors] = useState<Record<string, boolean>>({});

  const handleImageError = (id: string) => {
    setImageErrors((prev) => ({ ...prev, [id]: true }));
  };

  return (
    <section className="relative w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16">
      {/* Header Block: Natural, Human Historical Introduction */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-8 sm:pb-10 border-b border-[#303338]/80">
        <div className="max-w-2xl text-left">
          {/* Eyebrow */}
          <div className="inline-flex items-center gap-2 mb-3">
            <span className="w-1.5 h-1.5 rounded-full bg-white shadow-[0_0_8px_rgba(255,255,255,0.7)]" />
            <span className="text-[#858A91] text-[11px] font-mono font-medium tracking-[0.24em] uppercase">
              THE BEGINNING · 2023
            </span>
          </div>

          {/* Heading */}
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-[#F5F5F3] tracking-tight leading-tight">
            Where It All Starts
          </h2>

          {/* Natural Human Lead Narrative */}
          <p className="mt-3.5 text-xs sm:text-sm text-[#B5B8BC] leading-relaxed max-w-xl">
            ShutterScape began in 2023 when two students set out to create a dedicated photography group on campus. They wanted a space where anyone interested in taking pictures — with a smartphone or a camera — could practice, share techniques, and document university life together.
          </p>
        </div>

        {/* Narrative Badge */}
        <div className="inline-flex items-center gap-3 bg-[#111315] border border-[#303338] px-4 py-2.5 rounded-2xl shrink-0 text-left self-start md:self-auto">
          <div className="w-8 h-8 rounded-xl bg-[#17191C] border border-white/10 flex items-center justify-center text-white shrink-0">
            <Compass className="w-4 h-4 text-white/90" />
          </div>
          <div>
            <div className="text-[11px] font-mono font-bold text-[#F5F5F3] uppercase tracking-wider">
              Est. 2023
            </div>
            <div className="text-[10px] text-[#858A91]">
              Girijananda Chowdhury University
            </div>
          </div>
        </div>
      </div>

      {/* Balanced Editorial Founder Cards: Compact, Proportional & Human */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 sm:gap-6 pt-6 sm:pt-8">
        {founders.map((founder, index) => {
          const hasError = imageErrors[founder.id];

          return (
            <article
              key={founder.id}
              className="rounded-2xl sm:rounded-3xl border border-[#303338] bg-[#111315]/95 backdrop-blur-xl p-5 sm:p-6 shadow-xl shadow-black/60 hover:border-zinc-500/70 transition-all duration-300 flex flex-col sm:flex-row items-center sm:items-start gap-5 sm:gap-6 group text-left"
            >
              {/* Compact Editorial Portrait: Max dimensions constrained to prevent viewport dominance */}
              <div className="relative w-36 sm:w-40 md:w-44 shrink-0 aspect-[3/4] sm:aspect-[4/5] rounded-xl sm:rounded-2xl overflow-hidden border border-[#303338] bg-[#17191C] shadow-lg">
                {!hasError ? (
                  <Image
                    src={founder.imageSrc}
                    alt={founder.alt}
                    fill
                    sizes="(max-width: 640px) 144px, 176px"
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                    style={{ objectPosition: founder.objectPosition }}
                    onError={() => handleImageError(founder.id)}
                    priority={index === 0}
                  />
                ) : (
                  <div className="absolute inset-0 flex flex-col items-center justify-center p-4 text-center">
                    <div className="w-12 h-12 rounded-xl bg-[#08090A] border border-[#303338] flex items-center justify-center font-mono text-lg font-bold text-white">
                      {founder.name.split(" ").map((n) => n[0]).join("")}
                    </div>
                    <span className="text-[11px] text-[#858A91] mt-2">{founder.name}</span>
                  </div>
                )}

                {/* Subtle Gradient & Badge */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent pointer-events-none" />
                <div className="absolute top-2.5 left-2.5 z-10">
                  <span className="px-2 py-0.5 rounded-full text-[9px] font-mono tracking-wider text-white bg-black/75 backdrop-blur-md border border-white/10 uppercase shadow-sm">
                    {founder.role}
                  </span>
                </div>
              </div>

              {/* Profile Details & Genuine Human Contribution */}
              <div className="flex-1 min-w-0 text-center sm:text-left flex flex-col justify-between self-stretch">
                <div>
                  <div className="inline-flex items-center gap-1.5 text-[10px] sm:text-[11px] font-mono text-[#858A91] mb-1">
                    <span>ALUMNI PIONEER</span>
                    <span>·</span>
                    <span className="text-white/70">{founder.cohort}</span>
                  </div>

                  <h3 className="text-lg sm:text-xl font-bold text-[#F5F5F3] tracking-tight group-hover:text-white transition-colors">
                    {founder.name}
                  </h3>

                  <p className="text-xs font-mono text-[#858A91] mt-0.5">
                    {founder.role} · {founder.cohort}
                  </p>

                  <p className="mt-3 text-xs sm:text-[13px] text-[#B5B8BC] leading-relaxed">
                    {founder.contribution}
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-white/[0.06] flex items-center justify-between text-[10px] font-mono text-[#636870]">
                  <span>FOUNDING CO-LEAD</span>
                  <span className="text-white/60">GCU ARCHIVE</span>
                </div>
              </div>
            </article>
          );
        })}
      </div>

      {/* Grounded Historical Summary Card (Natural & Cliché-Free) */}
      <div className="mt-8 sm:mt-10 p-5 sm:p-6 rounded-2xl border border-[#303338] bg-[#111315]/80 backdrop-blur-xl text-center max-w-3xl mx-auto shadow-lg">
        <p className="text-xs sm:text-sm text-[#B5B8BC] leading-relaxed">
          Started as a student initiative in 2023, ShutterScape continues to provide an inclusive platform for student photographers of all experience levels at Girijananda Chowdhury University.
        </p>
        <div className="mt-2.5 flex items-center justify-center gap-2 text-[10px] font-mono text-[#858A91] uppercase tracking-wider">
          <Camera className="w-3 h-3 text-[#B5B8BC]" />
          <span>Girijananda Chowdhury University · Est. 2023</span>
        </div>
      </div>
    </section>
  );
}
