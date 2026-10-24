"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowRight, User } from "lucide-react";
import { teamMembers as defaultTeam, TeamMember } from "@/data/team";
import { getStoredTeam, fetchTeam, subscribeTeam } from "@/services/teamService";
import { subscribeToRealtimeTable } from "@/lib/realtimeSync";

export default function TeamPreview() {
  const [members, setMembers] = useState<TeamMember[]>(defaultTeam);
  const [failedImages, setFailedImages] = useState<Record<string, boolean>>({});

  useEffect(() => {
    let isMounted = true;

    // 1. Initial client sync from local storage
    setMembers(getStoredTeam());

    // 2. Fetch fresh team from Supabase backend
    fetchTeam()
      .then((fresh) => {
        if (isMounted && fresh && fresh.length > 0) {
          setMembers(fresh);
        }
      })
      .catch((err) => {
        console.warn("Could not fetch team in TeamPreview:", err);
      });

    // 3. Subscribe to Realtime PostgreSQL changes on team_members
    const unsubRealtime = subscribeToRealtimeTable("team_members", () => {
      fetchTeam().then((fresh) => {
        if (isMounted && fresh && fresh.length > 0) {
          setMembers(fresh);
        }
      });
    });

    // 4. Subscribe to dynamic local updates
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

  // Feature official leadership office bearers (President, Vice-President, Secretary)
  const featuredMembers = members.filter((m) => m.category === "Leadership");
  const remainingCount = Math.max(0, members.length - featuredMembers.length);

  return (
    <div
      id="team"
      className="bg-[#111315]/95 backdrop-blur-xl border border-[#303338] rounded-2xl sm:rounded-3xl p-5 sm:p-6 shadow-2xl shadow-black/70 flex flex-col justify-between"
    >
      {/* Panel Header */}
      <div className="flex items-center justify-between pb-4 border-b border-[#303338] mb-5">
        <div className="flex items-center gap-2.5">
          <span className="w-5 h-1 bg-white rounded-full inline-block" />
          <h2 className="text-[#F5F5F3] text-base sm:text-lg font-bold tracking-tight">
            The People Behind ShutterScape
          </h2>
        </div>

        <Link
          href="/about#team"
          className="text-[#D5D9DE] hover:text-white font-semibold text-xs flex items-center gap-1 transition group"
        >
          <span>View Full Team</span>
          <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
        </Link>
      </div>

      {/* Members Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 items-center">
        {featuredMembers.map((member) => (
          <Link
            key={member.id}
            href="/about#team"
            className="flex flex-col items-center text-center p-2 rounded-2xl bg-[#17191C]/60 border border-[#303338] hover:border-zinc-500/60 transition-all duration-300 group cursor-pointer"
          >
            {/* Portrait Image Container */}
            <div className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-br from-[#17191C] to-[#111315] border border-[#303338] flex items-center justify-center mb-3 shadow-md group-hover:border-white/50 transition-all overflow-hidden">
              {member.photoUrl && !failedImages[member.id] ? (
                <Image
                  src={member.photoUrl}
                  alt={`${member.name} — ${member.role}, ShutterScape GCU`}
                  fill
                  sizes="80px"
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                  style={{ objectPosition: member.objectPosition || "center 25%" }}
                  onError={() =>
                    setFailedImages((prev) => ({ ...prev, [member.id]: true }))
                  }
                />
              ) : (
                <div className="flex flex-col items-center justify-center text-[#B5B8BC] group-hover:text-white transition-colors">
                  <User className="w-6 h-6 mb-0.5" />
                  <span className="text-[10px] font-mono font-bold tracking-wider">
                    {member.initials}
                  </span>
                </div>
              )}
            </div>

            {/* Member Details */}
            <h3 className="text-[#F5F5F3] text-xs sm:text-[13px] font-bold tracking-tight leading-snug group-hover:text-white transition-colors truncate w-full px-1">
              {member.name}
            </h3>
            <span className="text-[#858A91] text-[11px] font-medium leading-tight mt-1 truncate w-full px-1">
              {member.role}
            </span>
          </Link>
        ))}

        {/* Additional Members Indicator (+8 or dynamic count) */}
        <Link
          href="/about#team"
          className="flex flex-col items-center text-center p-2 rounded-2xl bg-[#17191C]/60 border border-[#303338] hover:border-zinc-500/60 transition-all duration-300 group cursor-pointer"
        >
          <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-[#111315] border border-dashed border-[#303338] group-hover:border-white/60 flex items-center justify-center mb-3 transition-all shadow-inner">
            <span className="text-lg sm:text-xl font-bold text-white transition-colors">
              +{remainingCount}
            </span>
          </div>

          <span className="text-[#F5F5F3] text-xs sm:text-[13px] font-semibold leading-snug group-hover:text-white transition-colors">
            More Members
          </span>
          <span className="text-[#858A91] text-[10px] mt-1">Faculty & Core</span>
        </Link>
      </div>
    </div>
  );
}
