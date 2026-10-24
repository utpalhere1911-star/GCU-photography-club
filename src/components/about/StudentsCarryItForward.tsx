"use client";

import React, { useState } from "react";
import Image from "next/image";
import { Users2 } from "lucide-react";

interface StudentPioneer {
  id: string;
  name: string;
  role: string;
  cohort: string;
  note: string;
  imageSrc: string;
  alt: string;
  objectPosition: string;
}

const studentPioneers: StudentPioneer[] = [
  {
    id: "gargi-medhi",
    name: "Gargi Medhi",
    role: "Founding Member & Contributor",
    cohort: "Founding Cohort",
    note: "Organized early photo walks and helped curate student work for campus showcases.",
    imageSrc: "/images/about/students/gargi-medhi.jpg",
    alt: "Gargi Medhi — ShutterScape GCU Student Contributor",
    objectPosition: "center 20%",
  },
  {
    id: "dheemaan-deka",
    name: "Dheemaan Deka",
    role: "Co-Founder & Alumni Mentor",
    cohort: "Founding Cohort",
    note: "Supported subsequent student batches through technical workshops and hands-on guidance.",
    imageSrc: "/images/about/students/dheemaan-deka.jpg",
    alt: "Dheemaan Deka — ShutterScape GCU",
    objectPosition: "center 20%",
  },
  {
    id: "imran-farhat",
    name: "Imran Farhat",
    role: "Founding Member & Contributor",
    cohort: "Founding Cohort",
    note: "Contributed to campus event documentation and collaborative student exhibitions.",
    imageSrc: "/images/about/students/imran-farhat.jpg",
    alt: "Imran Farhat — ShutterScape GCU Student Contributor",
    objectPosition: "center 22%",
  },
  {
    id: "subhrajyoti-goswami",
    name: "Subhrajyoti Goswami",
    role: "Co-Founder & Alumni Mentor",
    cohort: "Founding Cohort",
    note: "Helped establish the club's collaborative culture and event coverage standards.",
    imageSrc: "/images/about/students/subhrajyoti-goswami.jpg",
    alt: "Subhrajyoti Goswami — ShutterScape GCU",
    objectPosition: "center 20%",
  },
];

const corePillars = [
  { number: "01", label: "LEARN", desc: "Camera fundamentals, lighting, and composition." },
  { number: "02", label: "CREATE", desc: "Turning everyday campus moments into visual stories." },
  { number: "03", label: "COLLABORATE", desc: "Working together across student events and shoots." },
  { number: "04", label: "EXPERIMENT", desc: "Trying new perspectives, techniques, and styles." },
  { number: "05", label: "SHOWCASE", desc: "Exhibiting student photography across the university." },
];

export default function StudentsCarryItForward() {
  const [imageErrors, setImageErrors] = useState<Record<string, boolean>>({});

  const handleImageError = (id: string) => {
    setImageErrors((prev) => ({ ...prev, [id]: true }));
  };

  return (
    <section className="relative w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16">
      {/* Header Block: Clear hierarchy with natural, human text */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-8 sm:pb-10 border-b border-[#303338]/80">
        <div className="max-w-2xl text-left">
          {/* Eyebrow */}
          <div className="inline-flex items-center gap-2 mb-3">
            <span className="w-1.5 h-1.5 rounded-full bg-white shadow-[0_0_8px_rgba(255,255,255,0.7)]" />
            <span className="text-[#858A91] text-[11px] font-mono font-medium tracking-[0.24em] uppercase">
              STUDENT CONTINUITY
            </span>
          </div>

          {/* Heading */}
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-[#F5F5F3] tracking-tight leading-tight">
            Students Carry It Forward
          </h2>

          {/* Natural Human Lead Narrative */}
          <p className="mt-3.5 text-xs sm:text-sm text-[#B5B8BC] leading-relaxed max-w-xl">
            A club stays active through the students who step up each semester. Following our founders, early members organized events, mentored newcomers, and established the foundation that current batches build upon today.
          </p>
        </div>

        {/* Continuity Badge */}
        <div className="inline-flex items-center gap-2.5 bg-[#111315] border border-[#303338] px-4 py-2.5 rounded-2xl text-left self-start md:self-auto shrink-0">
          <Users2 className="w-4 h-4 text-white" />
          <div>
            <div className="text-[11px] font-mono font-bold text-[#F5F5F3]">
              STUDENT-LED CONTINUITY
            </div>
            <div className="text-[10px] text-[#858A91]">
              Girijananda Chowdhury University
            </div>
          </div>
        </div>
      </div>

      {/* Balanced 4-Column Student Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5 pt-6 sm:pt-8">
        {studentPioneers.map((student) => {
          const hasError = imageErrors[student.id];

          return (
            <article
              key={student.id}
              className="rounded-2xl border border-[#303338] bg-[#111315]/95 backdrop-blur-xl p-4 sm:p-5 shadow-xl shadow-black/60 hover:border-zinc-500/80 transition-all duration-300 group flex flex-col justify-between text-left select-none"
            >
              <div>
                {/* Photo Area with Uniform Aspect Ratio */}
                <div className="relative w-full aspect-[4/5] rounded-xl overflow-hidden border border-[#303338] bg-[#17191C] shadow-md">
                  {!hasError ? (
                    <Image
                      src={student.imageSrc}
                      alt={student.alt}
                      fill
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                      className="object-cover transition-transform duration-500 group-hover:scale-105"
                      style={{ objectPosition: student.objectPosition }}
                      onError={() => handleImageError(student.id)}
                    />
                  ) : (
                    <div className="absolute inset-0 flex flex-col items-center justify-center p-4 text-center">
                      <div className="w-12 h-12 rounded-xl bg-[#08090A] border border-[#303338] flex items-center justify-center font-mono text-lg font-bold text-white">
                        {student.name.split(" ").map((n) => n[0]).join("")}
                      </div>
                      <span className="text-[11px] text-[#858A91] mt-2">{student.name}</span>
                    </div>
                  )}

                  {/* Gradient Fade */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />

                  {/* Top Badge */}
                  <div className="absolute top-2.5 left-2.5 z-10">
                    <span className="px-2 py-0.5 rounded-full text-[9px] font-mono tracking-wider text-[#D1D5DB] bg-black/75 backdrop-blur-md border border-white/10 uppercase shadow-sm">
                      {student.cohort}
                    </span>
                  </div>
                </div>

                {/* Identity & Specific Contribution Note */}
                <div className="pt-4">
                  <h3 className="text-base font-bold text-[#F5F5F3] tracking-tight group-hover:text-white transition-colors">
                    {student.name}
                  </h3>

                  <p className="text-[11px] text-[#858A91] font-mono mt-0.5">
                    {student.role}
                  </p>

                  <p className="mt-2.5 text-xs text-[#B5B8BC] leading-relaxed">
                    {student.note}
                  </p>
                </div>
              </div>

              {/* Verified GCU Alumni Badge */}
              <div className="mt-4 pt-3 border-t border-white/[0.06] flex items-center justify-between text-[10px] font-mono text-[#636870]">
                <span>GCU ALUMNI</span>
                <span className="text-white/60">VERIFIED</span>
              </div>
            </article>
          );
        })}
      </div>

      {/* 5 Core Pillars: Balanced, Readable & Clean */}
      <div className="mt-10 sm:mt-12 rounded-2xl sm:rounded-3xl border border-[#303338] bg-[#111315]/90 backdrop-blur-xl p-5 sm:p-8 shadow-2xl">
        <div className="text-left mb-5 sm:mb-6">
          <span className="text-[10px] sm:text-[11px] font-mono font-medium tracking-[0.24em] text-[#858A91] uppercase">
            HOW THE CLUB OPERATES
          </span>
          <h3 className="text-lg sm:text-2xl font-black text-[#F5F5F3] tracking-tight mt-1">
            Our Continuing Commitment
          </h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4 pt-1">
          {corePillars.map((pillar) => (
            <div
              key={pillar.label}
              className="p-4 rounded-xl border border-white/[0.06] bg-[#17191C]/60 hover:bg-[#17191C] hover:border-white/20 transition-all text-left flex flex-col justify-between group"
            >
              <div>
                <span className="text-[10px] font-mono text-[#858A91] group-hover:text-white/60 transition-colors">
                  {pillar.number}
                </span>
                <div className="text-xs sm:text-sm font-black font-mono tracking-wider text-[#F5F5F3] mt-1 group-hover:text-white transition-colors">
                  {pillar.label}
                </div>
              </div>
              <p className="text-[11px] text-[#858A91] leading-snug mt-2">
                {pillar.desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
