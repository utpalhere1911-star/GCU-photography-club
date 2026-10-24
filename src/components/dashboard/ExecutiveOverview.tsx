"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Calendar,
  Image as ImageIcon,
  Users,
  ArrowRight,
  ExternalLink,
  Camera,
  Clock,
  Sparkles,
  Database,
  CheckCircle2,
  LogOut,
  Star,
  Eye,
} from "lucide-react";
import { Activity } from "@/data/activities";
import { GalleryPhoto } from "@/data/gallery";
import { TeamMember } from "@/data/team";
import { DashboardTab } from "./DashboardSidebar";

interface SessionUser {
  id?: string;
  email: string;
  role: "admin" | "executive";
  name: string;
}

interface ExecutiveOverviewProps {
  user: SessionUser;
  activities: Activity[];
  gallery: GalleryPhoto[];
  team: TeamMember[];
  onNavigateTab: (tab: DashboardTab) => void;
  onOpenCreateActivity: () => void;
  onOpenUploadPhoto: () => void;
  onOpenAddTeamMember: () => void;
  onLogout: () => void;
}

export default function ExecutiveOverview({
  user,
  activities,
  gallery,
  team,
  onNavigateTab,
  onOpenCreateActivity,
  onOpenUploadPhoto,
  onOpenAddTeamMember,
  onLogout,
}: ExecutiveOverviewProps) {
  const upcomingActivities = activities.filter((a) => a.status === "upcoming").length;
  const publishedPhotos = gallery.filter((p) => p.published !== false).length;
  const featuredPhotos = gallery.filter((p) => p.isFeatured).length;

  const userInitials = user.name
    ? user.name
        .split(" ")
        .map((w) => w[0])
        .join("")
        .slice(0, 2)
        .toUpperCase()
    : "EM";

  // Recent content items for Executive review
  const recentItems = [
    ...activities.slice(0, 3).map((a) => ({
      id: `act-${a.id}`,
      title: a.title,
      subtitle: `${a.category} • ${a.venue}`,
      badge: "ACTIVITY",
      color: "bg-white/[0.08] text-neutral-200 border-white/20",
      dateStr: a.startDate,
    })),
    ...gallery.slice(0, 3).map((g) => ({
      id: `gal-${g.id}`,
      title: g.title,
      subtitle: `By ${g.photographer} • ${g.category}`,
      badge: "GALLERY",
      color: "bg-white/[0.06] text-neutral-300 border-white/15",
      dateStr: g.date,
    })),
  ].slice(0, 5);

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* ============================================================== */}
      {/* 1. HERO BANNER TAILORED FOR EXECUTIVE MEMBERS (MONOCHROME PRO) */}
      {/* ============================================================== */}
      <div className="relative rounded-3xl overflow-hidden bg-gradient-to-r from-[#141418] via-[#0E0E12] to-[#08080A] border border-white/10 p-6 sm:p-8 lg:p-10 shadow-[0_12px_40px_rgba(0,0,0,0.8)]">
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-white/[0.03] rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div className="space-y-2 max-w-xl">
            <span className="inline-flex items-center gap-1.5 text-xs font-mono font-semibold tracking-wider text-neutral-400 uppercase">
              <Camera className="w-3.5 h-3.5 text-white" /> Executive Content Studio
            </span>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-white tracking-tight">
              Welcome back, <br className="hidden sm:inline" />
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-white via-neutral-100 to-neutral-400">
                {user.name}
              </span>{" "}
              👋
            </h1>
            <p className="text-xs sm:text-sm text-neutral-400 leading-relaxed max-w-lg">
              As an Executive Member, you have full content management access to curate campus photography, schedule club events, and update committee records.
            </p>
          </div>

          {/* Quote Card */}
          <div className="relative w-full lg:w-96 rounded-2xl overflow-hidden border border-white/15 bg-black/75 shadow-[0_8px_30px_rgba(0,0,0,0.8)] group">
            <div className="absolute inset-0 opacity-35 mix-blend-luminosity filter grayscale pointer-events-none">
              <Image
                src="/images/hero-photographer.jpg"
                alt="Photography Lens"
                fill
                sizes="384px"
                className="object-cover group-hover:scale-105 transition-transform duration-700"
              />
            </div>
            <div className="absolute inset-0 bg-gradient-to-t from-[#08080B] via-[#08080B]/85 to-transparent" />

            <div className="relative z-10 p-5 space-y-2">
              <div className="flex items-center gap-1.5 text-white">
                <Sparkles className="w-3.5 h-3.5" />
                <span className="text-[10px] font-mono tracking-wider uppercase font-semibold text-neutral-300">
                  Club Philosophy
                </span>
              </div>
              <p className="text-xs sm:text-sm italic text-neutral-200 font-serif leading-relaxed">
                &ldquo;Photography is the story I fail to put into words.&rdquo;
              </p>
              <p className="text-[11px] font-mono text-neutral-400 pt-1 text-right">
                — Destin Sparks
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ============================================================== */}
      {/* 2. 4 METRIC CARDS FOR EXECUTIVE WORKFLOW (MONOCHROME GLOWING)   */}
      {/* ============================================================== */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Activities */}
        <div
          onClick={() => onNavigateTab("activities")}
          className="p-5 rounded-2xl bg-[#101014] border border-white/10 hover:border-white/30 hover:shadow-[0_0_25px_rgba(255,255,255,0.06)] transition-all shadow-md group cursor-pointer relative overflow-hidden"
        >
          <div className="flex items-start justify-between">
            <div className="w-11 h-11 rounded-xl bg-white/[0.06] border border-white/15 text-white flex items-center justify-center group-hover:bg-white group-hover:text-black group-hover:shadow-[0_0_15px_rgba(255,255,255,0.3)] transition-all">
              <Calendar className="w-5 h-5" />
            </div>
            <svg className="w-16 h-8 text-neutral-500 group-hover:text-white transition-colors" viewBox="0 0 64 32" fill="none">
              <path
                d="M2 24C12 24 16 8 26 12C36 16 42 2 52 14C58 20 60 22 62 20"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
            </svg>
          </div>
          <div className="mt-4">
            <span className="text-[11px] font-medium text-neutral-400 block">
              Total Activities
            </span>
            <div className="flex items-baseline gap-2 mt-0.5">
              <span className="text-2xl font-bold text-white tracking-tight">
                {activities.length}
              </span>
              <span className="text-xs text-neutral-500 font-mono">
                {upcomingActivities} upcoming
              </span>
            </div>
          </div>
        </div>

        {/* Card 2: Gallery Archive */}
        <div
          onClick={() => onNavigateTab("gallery")}
          className="p-5 rounded-2xl bg-[#101014] border border-white/10 hover:border-white/30 hover:shadow-[0_0_25px_rgba(255,255,255,0.06)] transition-all shadow-md group cursor-pointer relative overflow-hidden"
        >
          <div className="flex items-start justify-between">
            <div className="w-11 h-11 rounded-xl bg-white/[0.06] border border-white/15 text-white flex items-center justify-center group-hover:bg-white group-hover:text-black group-hover:shadow-[0_0_15px_rgba(255,255,255,0.3)] transition-all">
              <ImageIcon className="w-5 h-5" />
            </div>
            <svg className="w-16 h-8 text-neutral-500 group-hover:text-white transition-colors" viewBox="0 0 64 32" fill="none">
              <path
                d="M2 18C10 18 16 28 24 22C32 16 38 4 48 8C54 10 58 16 62 14"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
            </svg>
          </div>
          <div className="mt-4">
            <span className="text-[11px] font-medium text-neutral-400 block">
              Gallery Photos
            </span>
            <div className="flex items-baseline gap-2 mt-0.5">
              <span className="text-2xl font-bold text-white tracking-tight">
                {gallery.length}
              </span>
              <span className="text-xs text-neutral-500 font-mono">
                {publishedPhotos} published
              </span>
            </div>
          </div>
        </div>

        {/* Card 3: Team Members */}
        <div
          onClick={() => onNavigateTab("team")}
          className="p-5 rounded-2xl bg-[#101014] border border-white/10 hover:border-white/30 hover:shadow-[0_0_25px_rgba(255,255,255,0.06)] transition-all shadow-md group cursor-pointer relative overflow-hidden"
        >
          <div className="flex items-start justify-between">
            <div className="w-11 h-11 rounded-xl bg-white/[0.06] border border-white/15 text-white flex items-center justify-center group-hover:bg-white group-hover:text-black group-hover:shadow-[0_0_15px_rgba(255,255,255,0.3)] transition-all">
              <Users className="w-5 h-5" />
            </div>
            <svg className="w-16 h-8 text-neutral-500 group-hover:text-white transition-colors" viewBox="0 0 64 32" fill="none">
              <path
                d="M2 22C10 22 18 10 26 14C34 18 40 8 48 6C54 4 58 12 62 10"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
            </svg>
          </div>
          <div className="mt-4">
            <span className="text-[11px] font-medium text-neutral-400 block">
              Team Members
            </span>
            <div className="flex items-baseline gap-2 mt-0.5">
              <span className="text-2xl font-bold text-white tracking-tight">
                {team.length}
              </span>
              <span className="text-xs text-neutral-500 font-mono">
                3 categories
              </span>
            </div>
          </div>
        </div>

        {/* Card 4: Featured Showcase Works */}
        <div
          onClick={() => onNavigateTab("gallery")}
          className="p-5 rounded-2xl bg-[#101014] border border-white/10 hover:border-white/30 hover:shadow-[0_0_25px_rgba(255,255,255,0.06)] transition-all shadow-md group cursor-pointer relative overflow-hidden"
        >
          <div className="flex items-start justify-between">
            <div className="w-11 h-11 rounded-xl bg-white/[0.06] border border-white/15 text-white flex items-center justify-center group-hover:bg-white group-hover:text-black group-hover:shadow-[0_0_15px_rgba(255,255,255,0.3)] transition-all">
              <Star className="w-5 h-5" />
            </div>
            <svg className="w-16 h-8 text-neutral-500 group-hover:text-white transition-colors" viewBox="0 0 64 32" fill="none">
              <path
                d="M2 14C8 14 14 26 22 20C30 14 36 24 44 18C52 12 56 6 62 8"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
            </svg>
          </div>
          <div className="mt-4">
            <span className="text-[11px] font-medium text-neutral-400 block">
              Featured Showcase Works
            </span>
            <div className="flex items-baseline gap-2 mt-0.5">
              <span className="text-2xl font-bold text-white tracking-tight">
                {featuredPhotos}
              </span>
              <span className="text-xs text-neutral-500 font-mono">
                homepage priority
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ============================================================== */}
      {/* 3. QUICK ACTIONS (EXECUTIVE PERMITTED ACTIONS)                 */}
      {/* ============================================================== */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-white flex items-center gap-2">
            <span>⚡ Content Actions</span>
          </h2>
          <button
            onClick={() => onNavigateTab("activities")}
            className="text-xs text-neutral-400 hover:text-white font-medium inline-flex items-center gap-1 transition-colors cursor-pointer"
          >
            <span>Manage content</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          <button
            onClick={onOpenCreateActivity}
            className="p-4 rounded-xl bg-[#101014] border border-white/10 hover:border-white/30 hover:bg-[#15151A] hover:shadow-[0_0_20px_rgba(255,255,255,0.06)] transition-all flex items-center justify-between text-left group cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-white/[0.06] text-white border border-white/15 group-hover:bg-white group-hover:text-black group-hover:shadow-[0_0_12px_rgba(255,255,255,0.25)] transition-all">
                <Calendar className="w-4 h-4" />
              </div>
              <span className="text-xs sm:text-sm font-semibold text-white">
                Create Activity
              </span>
            </div>
            <ArrowRight className="w-4 h-4 text-neutral-500 group-hover:text-white group-hover:translate-x-1 transition-all" />
          </button>

          <button
            onClick={onOpenUploadPhoto}
            className="p-4 rounded-xl bg-[#101014] border border-white/10 hover:border-white/30 hover:bg-[#15151A] hover:shadow-[0_0_20px_rgba(255,255,255,0.06)] transition-all flex items-center justify-between text-left group cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-white/[0.06] text-white border border-white/15 group-hover:bg-white group-hover:text-black group-hover:shadow-[0_0_12px_rgba(255,255,255,0.25)] transition-all">
                <ImageIcon className="w-4 h-4" />
              </div>
              <span className="text-xs sm:text-sm font-semibold text-white">
                Upload Photographs
              </span>
            </div>
            <ArrowRight className="w-4 h-4 text-neutral-500 group-hover:text-white group-hover:translate-x-1 transition-all" />
          </button>

          <button
            onClick={onOpenAddTeamMember}
            className="p-4 rounded-xl bg-[#101014] border border-white/10 hover:border-white/30 hover:bg-[#15151A] hover:shadow-[0_0_20px_rgba(255,255,255,0.06)] transition-all flex items-center justify-between text-left group cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-white/[0.06] text-white border border-white/15 group-hover:bg-white group-hover:text-black group-hover:shadow-[0_0_12px_rgba(255,255,255,0.25)] transition-all">
                <Users className="w-4 h-4" />
              </div>
              <span className="text-xs sm:text-sm font-semibold text-white">
                Add Team Member
              </span>
            </div>
            <ArrowRight className="w-4 h-4 text-neutral-500 group-hover:text-white group-hover:translate-x-1 transition-all" />
          </button>

          <button
            onClick={() => onNavigateTab("gallery")}
            className="p-4 rounded-xl bg-[#101014] border border-white/10 hover:border-white/30 hover:bg-[#15151A] hover:shadow-[0_0_20px_rgba(255,255,255,0.06)] transition-all flex items-center justify-between text-left group cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-white/[0.06] text-white border border-white/15 group-hover:bg-white group-hover:text-black group-hover:shadow-[0_0_12px_rgba(255,255,255,0.25)] transition-all">
                <Eye className="w-4 h-4" />
              </div>
              <span className="text-xs sm:text-sm font-semibold text-white">
                Browse Gallery Archive
              </span>
            </div>
            <ArrowRight className="w-4 h-4 text-neutral-500 group-hover:text-white group-hover:translate-x-1 transition-all" />
          </button>
        </div>
      </div>

      {/* ============================================================== */}
      {/* 4. WORKSPACE: RECENT CONTENT & SECONDARY PANEL                 */}
      {/* ============================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* CENTER COLUMN (2/3 WIDTH) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Recent Club Content */}
          <div className="p-5 sm:p-6 rounded-2xl bg-[#101014] border border-white/10 shadow-[0_8px_30px_rgba(0,0,0,0.6)]">
            <div className="flex items-center justify-between pb-4 border-b border-white/[0.08]">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-white" />
                <h3 className="text-sm font-bold text-white">Recent Club Content</h3>
              </div>
              <button
                onClick={() => onNavigateTab("activities")}
                className="text-xs text-neutral-400 hover:text-white font-medium inline-flex items-center gap-1 transition-colors cursor-pointer"
              >
                <span>View Content</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="divide-y divide-white/[0.06] mt-2">
              {recentItems.length === 0 ? (
                <div className="py-8 text-center text-xs text-neutral-400">
                  No content records found.
                </div>
              ) : (
                recentItems.map((item) => (
                  <div
                    key={item.id}
                    className="py-3.5 flex items-center justify-between gap-3 text-xs"
                  >
                    <div className="min-w-0">
                      <p className="text-white font-medium truncate">{item.title}</p>
                      <p className="text-neutral-500 text-[11px] truncate">
                        {item.subtitle}
                      </p>
                    </div>

                    <span className="px-2 py-0.5 rounded-full text-[9px] font-mono font-medium uppercase border shrink-0 bg-white/[0.06] text-neutral-300 border-white/15">
                      {item.badge}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Quick Manage 3-Card Grid for Executive */}
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <span>⊞ Quick Manage</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Activities */}
              <div
                onClick={() => onNavigateTab("activities")}
                className="relative rounded-2xl overflow-hidden p-5 border border-white/10 hover:border-white/30 hover:shadow-[0_0_25px_rgba(255,255,255,0.08)] transition-all cursor-pointer group shadow-lg min-h-[140px] flex flex-col justify-end"
              >
                <div className="absolute inset-0 opacity-25 group-hover:opacity-35 transition-opacity mix-blend-luminosity filter grayscale">
                  <Image
                    src="/images/exhibition-2026.jpg"
                    alt="Activities"
                    fill
                    sizes="300px"
                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                </div>
                <div className="absolute inset-0 bg-gradient-to-t from-[#08080B] via-[#08080B]/80 to-transparent" />

                <div className="relative z-10 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white text-xs sm:text-sm">
                      Activities & Events
                    </span>
                    <div className="w-6 h-6 rounded-full bg-white/10 group-hover:bg-white text-white group-hover:text-black flex items-center justify-center transition-all group-hover:shadow-[0_0_12px_rgba(255,255,255,0.3)]">
                      <ArrowRight className="w-3 h-3" />
                    </div>
                  </div>
                  <p className="text-[10px] text-neutral-400">
                    Manage schedules & registration
                  </p>
                </div>
              </div>

              {/* Gallery */}
              <div
                onClick={() => onNavigateTab("gallery")}
                className="relative rounded-2xl overflow-hidden p-5 border border-white/10 hover:border-white/30 hover:shadow-[0_0_25px_rgba(255,255,255,0.08)] transition-all cursor-pointer group shadow-lg min-h-[140px] flex flex-col justify-end"
              >
                <div className="absolute inset-0 opacity-25 group-hover:opacity-35 transition-opacity mix-blend-luminosity filter grayscale">
                  <Image
                    src="/images/golden-hour-gcu.jpg"
                    alt="Gallery"
                    fill
                    sizes="300px"
                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                </div>
                <div className="absolute inset-0 bg-gradient-to-t from-[#08080B] via-[#08080B]/80 to-transparent" />

                <div className="relative z-10 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white text-xs sm:text-sm">
                      Gallery Archive
                    </span>
                    <div className="w-6 h-6 rounded-full bg-white/10 group-hover:bg-white text-white group-hover:text-black flex items-center justify-center transition-all group-hover:shadow-[0_0_12px_rgba(255,255,255,0.3)]">
                      <ArrowRight className="w-3 h-3" />
                    </div>
                  </div>
                  <p className="text-[10px] text-neutral-400">
                    Curate photographs & credits
                  </p>
                </div>
              </div>

              {/* Team */}
              <div
                onClick={() => onNavigateTab("team")}
                className="relative rounded-2xl overflow-hidden p-5 border border-white/10 hover:border-white/30 hover:shadow-[0_0_25px_rgba(255,255,255,0.08)] transition-all cursor-pointer group shadow-lg min-h-[140px] flex flex-col justify-end"
              >
                <div className="absolute inset-0 opacity-25 group-hover:opacity-35 transition-opacity mix-blend-luminosity filter grayscale">
                  <Image
                    src="/images/about-students-sunset.jpg"
                    alt="Team"
                    fill
                    sizes="300px"
                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                </div>
                <div className="absolute inset-0 bg-gradient-to-t from-[#08080B] via-[#08080B]/80 to-transparent" />

                <div className="relative z-10 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white text-xs sm:text-sm">
                      Team Members
                    </span>
                    <div className="w-6 h-6 rounded-full bg-white/10 group-hover:bg-white text-white group-hover:text-black flex items-center justify-center transition-all group-hover:shadow-[0_0_12px_rgba(255,255,255,0.3)]">
                      <ArrowRight className="w-3 h-3" />
                    </div>
                  </div>
                  <p className="text-[10px] text-neutral-400">
                    Update committee leadership
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT SECONDARY PANEL (1/3 WIDTH) */}
        <div className="space-y-6">
          {/* Executive Member Profile Card */}
          <div className="p-5 rounded-2xl bg-[#101014] border border-white/10 shadow-[0_8px_30px_rgba(0,0,0,0.6)] space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-mono text-neutral-400 uppercase tracking-wider flex items-center gap-1.5 font-semibold">
                <Camera className="w-3.5 h-3.5 text-white" /> Executive Member
              </span>
              <span className="inline-flex items-center gap-1 text-[10px] font-mono px-2.5 py-0.5 rounded-full bg-white/[0.08] text-white border border-white/20">
                <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                Online
              </span>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-white text-black flex items-center justify-center font-bold text-base shadow-[0_0_18px_rgba(255,255,255,0.25)]">
                {userInitials}
              </div>
              <div className="min-w-0">
                <h4 className="text-sm font-bold text-white truncate">
                  {user.name}
                </h4>
                <p className="text-xs text-neutral-400 font-mono truncate">
                  {user.email}
                </p>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-[#16161C] border border-white/10 text-xs text-neutral-300 leading-relaxed">
              You are signed in with Executive Member permissions. Changes you make to activities, gallery, or team are synchronized live to the website.
            </div>

            <Link
              href="/"
              target="_blank"
              className="w-full inline-flex items-center justify-center gap-2 text-xs font-semibold px-4 py-2 rounded-xl border border-white/15 hover:border-white/30 bg-white/[0.06] hover:bg-white/[0.12] text-white transition-all shadow-[0_2px_10px_rgba(0,0,0,0.4)]"
            >
              <span>View Public Website</span>
              <ExternalLink className="w-3.5 h-3.5 text-neutral-400" />
            </Link>
          </div>

          {/* Database & Storage Status */}
          <div className="p-5 rounded-2xl bg-[#101014] border border-white/10 shadow-[0_8px_30px_rgba(0,0,0,0.6)] space-y-3.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Database className="w-4 h-4 text-white" />
                <h4 className="text-xs font-bold text-white">Database & Sync</h4>
              </div>
              <span className="text-[10px] font-mono text-neutral-300 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3 text-white" /> Supabase
              </span>
            </div>

            <div className="space-y-1.5 text-xs">
              <div className="flex justify-between text-neutral-400">
                <span>Total Live Records</span>
                <span className="text-white font-mono font-semibold">
                  {activities.length + gallery.length + team.length}
                </span>
              </div>

              <div className="w-full h-2 rounded-full bg-white/[0.06] overflow-hidden flex border border-white/10">
                <div
                  className="bg-white h-full"
                  style={{
                    width: `${Math.round(
                      (gallery.length /
                        Math.max(1, activities.length + gallery.length + team.length)) *
                        100
                    )}%`,
                  }}
                  title="Gallery Photos"
                />
                <div
                  className="bg-neutral-400 h-full"
                  style={{
                    width: `${Math.round(
                      (activities.length /
                        Math.max(1, activities.length + gallery.length + team.length)) *
                        100
                    )}%`,
                  }}
                  title="Activities"
                />
                <div
                  className="bg-neutral-600 h-full"
                  style={{
                    width: `${Math.round(
                      (team.length /
                        Math.max(1, activities.length + gallery.length + team.length)) *
                        100
                    )}%`,
                  }}
                  title="Team Members"
                />
              </div>

              <div className="flex items-center justify-between text-[10px] font-mono text-neutral-400 pt-1">
                <span>Gallery ({gallery.length})</span>
                <span>Activities ({activities.length})</span>
                <span>Team ({team.length})</span>
              </div>
            </div>
          </div>

          {/* Quick Links */}
          <div className="p-5 rounded-2xl bg-[#101014] border border-white/10 shadow-[0_8px_30px_rgba(0,0,0,0.6)] space-y-2 text-xs">
            <span className="text-[11px] font-mono text-neutral-400 uppercase tracking-wider font-semibold block mb-2">
              Quick Links
            </span>

            <Link
              href="/"
              target="_blank"
              className="flex items-center justify-between p-2 rounded-lg text-neutral-300 hover:text-white hover:bg-white/[0.06] transition-colors"
            >
              <span>View Public Website</span>
              <ExternalLink className="w-3.5 h-3.5 text-neutral-400" />
            </Link>

            <Link
              href="/gallery"
              target="_blank"
              className="flex items-center justify-between p-2 rounded-lg text-neutral-300 hover:text-white hover:bg-white/[0.06] transition-colors"
            >
              <span>Open Gallery in New Tab</span>
              <ExternalLink className="w-3.5 h-3.5 text-neutral-400" />
            </Link>

            <button
              onClick={onLogout}
              className="w-full flex items-center justify-between p-2 rounded-lg text-neutral-300 hover:text-white hover:bg-white/[0.08] transition-colors cursor-pointer"
            >
              <span className="flex items-center gap-2">
                <LogOut className="w-3.5 h-3.5 text-neutral-400" />
                <span>Log Out</span>
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
