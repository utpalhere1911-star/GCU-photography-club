"use client";

import React, { useRef, useState, useEffect, useCallback } from "react";
import Image from "next/image";
import { User, Camera, ShieldCheck } from "lucide-react";
import { teamMembers, TeamMember } from "@/data/team";
import { getStoredTeam, fetchTeam, subscribeTeam } from "@/services/teamService";
import { subscribeToRealtimeTable } from "@/lib/realtimeSync";

interface TeamCardProps {
  member: TeamMember;
  isClone?: boolean;
}

function TeamCard({ member, isClone = false }: TeamCardProps) {
  const [imgError, setImgError] = useState(false);

  return (
    <article
      aria-hidden={isClone ? "true" : undefined}
      tabIndex={isClone ? -1 : undefined}
      className="w-[185px] sm:w-[210px] shrink-0 bg-[#111315]/95 backdrop-blur-xl border border-[#303338] hover:border-[#555a62] rounded-2xl overflow-hidden shadow-xl shadow-black/60 group transition-all duration-300 flex flex-col justify-between select-none"
    >
      {/* Visual Portrait / Official Photograph Area */}
      <div className="relative w-full aspect-[4/5] bg-gradient-to-b from-[#1c1f24] to-[#111315] border-b border-[#303338] flex flex-col items-center justify-center p-4 overflow-hidden select-none">
        {/* Category Badge Pill */}
        <div className="absolute top-2.5 left-2.5 z-10 pointer-events-none">
          <span className="px-2 py-0.5 rounded-full text-[9px] font-mono tracking-wider text-[#D1D5DB] bg-black/70 backdrop-blur-md border border-white/10 uppercase shadow-sm">
            {member.category}
          </span>
        </div>

        {member.photoUrl && !imgError ? (
          <Image
            src={member.photoUrl}
            alt={isClone ? "" : `${member.name} — ${member.role}, ShutterScape GCU`}
            fill
            sizes="(max-width: 640px) 185px, 210px"
            className="object-cover transition-transform duration-500 group-hover:scale-105 pointer-events-none"
            style={{ objectPosition: member.objectPosition || "center 25%" }}
            priority={!isClone && (member.category === "Faculty" || member.role === "President")}
            draggable={false}
            onError={() => setImgError(true)}
          />
        ) : (
          <>
            {/* Viewfinder Reticle Framing Elements */}
            <div className="absolute inset-3 border border-white/10 rounded-xl pointer-events-none transition-colors group-hover:border-white/25" />

            {/* Top-Right Corner Aperture Accent */}
            <div className="absolute top-4 right-4 text-[#858A91]/60 group-hover:text-white/60 transition-colors">
              <Camera className="w-3.5 h-3.5" />
            </div>

            {/* Central Initials Monogram Badge */}
            <div className="relative z-10 w-16 h-16 sm:w-18 sm:h-18 rounded-2xl bg-[#08090A] border border-[#303338] group-hover:border-white/60 flex flex-col items-center justify-center shadow-xl shadow-black/80 transition-all duration-300 group-hover:scale-105">
              <span className="text-xl sm:text-2xl font-black font-mono text-[#F5F5F3] tracking-wider group-hover:text-white transition-colors">
                {member.initials}
              </span>
              <span className="text-[8px] font-mono tracking-widest text-[#858A91] uppercase -mt-0.5">
                GCU
              </span>
            </div>

            {/* Subtle Background Glow */}
            <div className="absolute -bottom-8 w-28 h-28 rounded-full bg-white/[0.03] group-hover:bg-white/[0.08] blur-xl transition-all" />
          </>
        )}

        {/* Bottom Subtle Gradient */}
        <div className="absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-[#111315] to-transparent pointer-events-none" />
      </div>

      {/* Member Details */}
      <div className="p-3.5 sm:p-4 text-left">
        <h3
          className="text-xs sm:text-sm font-bold text-[#F5F5F3] tracking-tight group-hover:text-white transition-colors truncate"
          title={member.name}
        >
          {member.name}
        </h3>

        <div
          className="flex items-center gap-1.5 text-[11px] text-[#858A91] font-medium mt-1 truncate"
          title={member.role}
        >
          {member.category === "Faculty" ? (
            <ShieldCheck className="w-3.5 h-3.5 text-[#B5B8BC] shrink-0" />
          ) : (
            <User className="w-3.5 h-3.5 text-[#B5B8BC] shrink-0" />
          )}
          <span className="truncate">{member.role}</span>
        </div>
        {member.department && (
          <p
            className="text-[10px] text-[#636870] font-normal truncate mt-0.5"
            title={member.department}
          >
            {member.department}
          </p>
        )}
      </div>
    </article>
  );
}

export default function TeamSection() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [members, setMembers] = useState<TeamMember[]>(teamMembers);
  const [isHovered, setIsHovered] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [isTouching, setIsTouching] = useState(false);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  // Synchronize team members with dynamic store & Supabase Realtime
  useEffect(() => {
    let isMounted = true;
    setMembers(getStoredTeam());

    fetchTeam()
      .then((fresh) => {
        if (isMounted && fresh && fresh.length > 0) {
          setMembers(fresh);
        }
      })
      .catch((err) => {
        console.warn("Could not fetch team in TeamSection:", err);
      });

    const unsubRealtime = subscribeToRealtimeTable("team_members", () => {
      fetchTeam().then((fresh) => {
        if (isMounted && fresh && fresh.length > 0) {
          setMembers(fresh);
        }
      });
    });

    const unsubLocal = subscribeTeam((updated) => {
      if (isMounted) {
        setMembers(updated);
      }
    });

    return () => {
      isMounted = false;
      unsubRealtime();
      unsubLocal();
    };
  }, []);

  // Mouse drag tracking refs
  const dragStartX = useRef<number>(0);
  const dragStartScrollLeft = useRef<number>(0);
  const animationFrameId = useRef<number | null>(null);

  // Speed: ~0.55px per frame gives a slow, cinematic right-to-left glide
  const SCROLL_SPEED = 0.55;

  // Check for prefers-reduced-motion
  useEffect(() => {
    if (typeof window === "undefined") return;
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    setPrefersReducedMotion(mediaQuery.matches);

    const listener = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches);
    mediaQuery.addEventListener("change", listener);
    return () => mediaQuery.removeEventListener("change", listener);
  }, []);

  // Continuous animation loop using requestAnimationFrame
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let running = true;

    const step = () => {
      if (!running) return;

      const shouldPause =
        isHovered || isDragging || isTouching || prefersReducedMotion;

      if (!shouldPause && container) {
        // Continuous slow increment
        container.scrollLeft += SCROLL_SPEED;

        // Seamless wrap around when reaching the midpoint of duplicate content
        const halfWidth = container.scrollWidth / 2;
        if (halfWidth > 0) {
          if (container.scrollLeft >= halfWidth) {
            container.scrollLeft -= halfWidth;
          } else if (container.scrollLeft <= 0) {
            container.scrollLeft += halfWidth;
          }
        }
      }

      animationFrameId.current = requestAnimationFrame(step);
    };

    animationFrameId.current = requestAnimationFrame(step);

    return () => {
      running = false;
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
      }
    };
  }, [isHovered, isDragging, isTouching, prefersReducedMotion]);

  // Mouse Drag Handlers
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (!containerRef.current) return;
    setIsDragging(true);
    dragStartX.current = e.pageX;
    dragStartScrollLeft.current = containerRef.current.scrollLeft;
  }, []);

  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (!containerRef.current) return;
      e.preventDefault();
      const delta = e.pageX - dragStartX.current;
      containerRef.current.scrollLeft = dragStartScrollLeft.current - delta;

      // Handle wrapping while actively dragging
      const halfWidth = containerRef.current.scrollWidth / 2;
      if (halfWidth > 0) {
        if (containerRef.current.scrollLeft >= halfWidth) {
          containerRef.current.scrollLeft -= halfWidth;
          dragStartScrollLeft.current -= halfWidth;
        } else if (containerRef.current.scrollLeft <= 0) {
          containerRef.current.scrollLeft += halfWidth;
          dragStartScrollLeft.current += halfWidth;
        }
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDragging]);

  // Touch Handlers for mobile swipe with vertical-pan preservation
  const handleTouchStart = () => {
    setIsTouching(true);
  };

  const handleTouchEnd = () => {
    setIsTouching(false);
  };

  return (
    <section
      id="team"
      className="relative w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16 overflow-hidden"
    >
      {/* Header Row: Title & Subtitle without separate arrow buttons */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 sm:gap-6 pb-6 border-b border-[#303338] mb-8">
        {/* Left: Eyebrow & Main Heading */}
        <div className="text-left">
          <div className="inline-flex items-center gap-2 mb-2.5">
            <span className="w-1.5 h-1.5 rounded-full bg-white shadow-[0_0_8px_rgba(255,255,255,0.7)]" />
            <span className="text-[#858A91] text-[11px] font-mono font-medium tracking-[0.24em] uppercase">
              OUR TEAM
            </span>
          </div>

          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-[#F5F5F3] tracking-tight">
            The People Behind ShutterScape
          </h2>
        </div>

        {/* Right: Supporting Text */}
        <div className="max-w-md self-start md:self-end">
          <p className="text-xs sm:text-sm text-[#858A91] text-left md:text-right leading-relaxed">
            Students and faculty advisors collaborating to document campus events, mentor new members, and organize club activities.
          </p>
        </div>
      </div>

      {/* Seamless Moving Horizontal Track */}
      <div
        ref={containerRef}
        role="region"
        aria-label="The People Behind ShutterScape carousel"
        tabIndex={0}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onMouseDown={handleMouseDown}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        className={`flex items-stretch gap-4 sm:gap-5 overflow-x-scroll [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden pb-4 pt-1 px-1 touch-pan-y ${
          isDragging ? "cursor-grabbing" : "cursor-grab"
        }`}
        style={{
          WebkitOverflowScrolling: "touch",
        }}
      >
        {/* Dynamic Set of Club Members */}
        {members.map((member) => (
          <TeamCard key={`orig-${member.id}`} member={member} />
        ))}

        {/* Duplicate Set of Members for Seamless Infinite Looping */}
        {members.map((member) => (
          <TeamCard key={`clone-${member.id}`} member={member} isClone />
        ))}
      </div>
    </section>
  );
}
