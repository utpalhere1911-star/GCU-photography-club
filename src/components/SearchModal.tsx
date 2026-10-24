"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { X, Search, Camera, Calendar, Image as ImageIcon, Users, ArrowRight } from "lucide-react";
import { getStoredActivities } from "@/services/activityService";
import { getStoredGallery } from "@/services/galleryService";
import { getStoredTeam } from "@/services/teamService";

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SearchModal({ isOpen, onClose }: SearchModalProps) {
  const [query, setQuery] = useState("");

  const searchResults = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return null;

    const activities = getStoredActivities().filter((a) => a.published !== false);
    const photos = getStoredGallery().filter((p) => p.published !== false);
    const team = getStoredTeam();

    const matchedActivities = activities
      .filter(
        (a) =>
          a.title.toLowerCase().includes(q) ||
          (a.shortDescription || "").toLowerCase().includes(q) ||
          (a.category || "").toLowerCase().includes(q) ||
          (a.venue || "").toLowerCase().includes(q)
      )
      .slice(0, 4)
      .map((a) => ({
        id: `act-${a.id}`,
        title: a.title,
        subtitle: `${a.category} · ${a.venue || "Campus"}`,
        type: "Activity" as const,
        href: "/activities",
        icon: Calendar,
      }));

    const matchedPhotos = photos
      .filter(
        (p) =>
          p.title.toLowerCase().includes(q) ||
          p.photographer.toLowerCase().includes(q) ||
          (p.category || "").toLowerCase().includes(q)
      )
      .slice(0, 4)
      .map((p) => ({
        id: `photo-${p.id}`,
        title: p.title,
        subtitle: `Photographed by ${p.photographer} · ${p.category}`,
        type: "Photograph" as const,
        href: "/gallery",
        icon: ImageIcon,
      }));

    const matchedTeam = team
      .filter(
        (m) =>
          m.name.toLowerCase().includes(q) ||
          m.role.toLowerCase().includes(q) ||
          (m.department || "").toLowerCase().includes(q) ||
          m.category.toLowerCase().includes(q)
      )
      .slice(0, 4)
      .map((m) => ({
        id: `team-${m.id}`,
        title: m.name,
        subtitle: `${m.role} · ${m.category}`,
        type: "Team" as const,
        href: "/about#team",
        icon: Users,
      }));

    return [...matchedActivities, ...matchedPhotos, ...matchedTeam];
  }, [query]);

  if (!isOpen) return null;

  const quickLinks = [
    { label: "All Upcoming & Past Activities", icon: Calendar, href: "/activities" },
    { label: "Photography Gallery Collection", icon: ImageIcon, href: "/gallery" },
    { label: "Official Leadership & Faculty Mentors", icon: Users, href: "/about#team" },
    { label: "Our Story & Club Heritage", icon: Camera, href: "/about" },
  ];

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-20 sm:pt-24 px-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="relative w-full max-w-xl rounded-2xl bg-[#111315] border border-[#303338] p-4 sm:p-5 shadow-2xl text-left max-h-[85vh] flex flex-col">
        {/* Search Input */}
        <div className="relative flex items-center mb-3">
          <Search className="absolute left-3.5 w-4 h-4 text-[#858A91]" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search activities, photographs, or team members..."
            className="w-full bg-[#17191C] border border-[#303338] rounded-xl pl-10 pr-10 py-2.5 text-xs sm:text-sm text-[#F5F5F3] placeholder:text-[#858A91] focus:outline-none focus:border-white focus:ring-1 focus:ring-white transition"
            autoFocus
          />
          <button
            onClick={onClose}
            className="absolute right-3 text-[#858A91] hover:text-white p-1"
            aria-label="Close search dialog"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto space-y-3 pt-1">
          {searchResults === null ? (
            /* Quick Suggestions when query is empty */
            <div className="space-y-1">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-[#858A91] px-2 py-1">
                Quick Navigation
              </p>
              {quickLinks.map((item, idx) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={idx}
                    href={item.href}
                    onClick={onClose}
                    className="flex items-center justify-between px-3 py-2 rounded-lg text-xs text-[#B5B8BC] hover:bg-[#17191C] hover:text-white transition group"
                  >
                    <div className="flex items-center gap-2.5">
                      <Icon className="w-4 h-4 text-[#858A91] group-hover:text-white transition-colors" />
                      <span>{item.label}</span>
                    </div>
                    <ArrowRight className="w-3.5 h-3.5 text-[#60646C] group-hover:text-white group-hover:translate-x-0.5 transition-all" />
                  </Link>
                );
              })}
            </div>
          ) : searchResults.length === 0 ? (
            /* No search results found */
            <div className="py-8 text-center space-y-1">
              <p className="text-xs text-[#F5F5F3] font-semibold">
                No matching results found
              </p>
              <p className="text-[11px] text-[#858A91]">
                Try searching for event names, photographers, or committee members.
              </p>
            </div>
          ) : (
            /* Matching Live Results */
            <div className="space-y-1">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-[#858A91] px-2 py-1">
                Results ({searchResults.length})
              </p>
              {searchResults.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.id}
                    href={item.href}
                    onClick={onClose}
                    className="flex items-center justify-between px-3 py-2.5 rounded-xl text-xs text-[#B5B8BC] hover:bg-[#17191C] hover:text-white transition group"
                  >
                    <div className="flex items-center gap-3 min-w-0 pr-2">
                      <div className="w-7 h-7 rounded-lg bg-[#08090A] border border-[#303338] flex items-center justify-center shrink-0">
                        <Icon className="w-3.5 h-3.5 text-white" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-white font-medium text-xs truncate">
                          {item.title}
                        </p>
                        <p className="text-[#858A91] text-[10px] truncate">
                          {item.subtitle}
                        </p>
                      </div>
                    </div>
                    <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-[#08090A] border border-[#303338] text-[#858A91] shrink-0">
                      {item.type}
                    </span>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
