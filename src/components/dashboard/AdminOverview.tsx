"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Calendar,
  Image as ImageIcon,
  Users,
  UserCheck,
  ArrowRight,
  ExternalLink,
  Shield,
  Clock,
  Sparkles,
  Activity as ActivityIcon,
  ChevronRight,
  Database,
  CheckCircle2,
  LogOut,
} from "lucide-react";
import { Activity } from "@/data/activities";
import { GalleryPhoto } from "@/data/gallery";
import { TeamMember } from "@/data/team";
import { DashboardTab } from "./DashboardSidebar";
import { ExecutiveMember, ExecutiveSessionEvent } from "./types";

interface SessionUser {
  id?: string;
  email: string;
  role: "admin" | "executive";
  name: string;
}

interface AdminOverviewProps {
  user: SessionUser;
  activities: Activity[];
  gallery: GalleryPhoto[];
  team: TeamMember[];
  onNavigateTab: (tab: DashboardTab) => void;
  onOpenCreateActivity: () => void;
  onOpenUploadPhoto: () => void;
  onOpenAddTeamMember: () => void;
  onOpenProvisionExecutive: () => void;
  onLogout: () => void;
}

interface ActivityEventItem {
  id: string;
  title: string;
  subtitle: string;
  timeAgo: string;
  type: "LOGIN" | "ACTIVITY" | "GALLERY" | "TEAM" | "SESSION";
  color: string;
}

export default function AdminOverview({
  user,
  activities,
  gallery,
  team,
  onNavigateTab,
  onOpenCreateActivity,
  onOpenUploadPhoto,
  onOpenAddTeamMember,
  onOpenProvisionExecutive,
  onLogout,
}: AdminOverviewProps) {
  const [executives, setExecutives] = useState<ExecutiveMember[]>([]);
  const [sessionEvents, setSessionEvents] = useState<ExecutiveSessionEvent[]>([]);
  const [chartData, setChartData] = useState<{ dayLabel: string; count: number }[]>([]);

  // Fetch real executive accounts and activity report for metrics and chart
  useEffect(() => {
    let isMounted = true;

    async function loadAdminData() {
      try {
        const [execRes, actRes] = await Promise.all([
          fetch("/api/admin/executives").then((r) => r.json()).catch(() => null),
          fetch("/api/admin/activity").then((r) => r.json()).catch(() => null),
        ]);

        if (!isMounted) return;

        if (execRes?.success && Array.isArray(execRes.data)) {
          setExecutives(execRes.data);
        }

        if (actRes?.success && actRes.data) {
          const events: ExecutiveSessionEvent[] = actRes.data.events || [];
          setSessionEvents(events);

          // Calculate 5-day session activity breakdown
          const now = new Date();
          const days: { dayLabel: string; count: number }[] = [];

          for (let i = 4; i >= 0; i--) {
            const targetDate = new Date(now);
            targetDate.setDate(now.getDate() - i);
            const dateStr = targetDate.toISOString().split("T")[0];
            const dayNum = String(targetDate.getDate());

            const count = events.filter((e) => {
              if (!e.loginAt) return false;
              return e.loginAt.startsWith(dateStr);
            }).length;

            days.push({ dayLabel: dayNum, count });
          }

          setChartData(days);
        }
      } catch {
        // Fallback gracefully
      }
    }

    loadAdminData();

    return () => {
      isMounted = false;
    };
  }, []);

  // Compute actual counts
  const upcomingActivities = activities.filter((a) => a.status === "upcoming").length;
  const publishedPhotos = gallery.filter((p) => p.published !== false).length;
  const activeExecutives = executives.filter((e) => e.status === "active").length;

  // Build real recent activity list combining session events and content
  const timelineItems: ActivityEventItem[] = [];

  // Add real session events if available
  sessionEvents.slice(0, 3).forEach((ev) => {
    timelineItems.push({
      id: `ev-${ev.id}`,
      title: `${ev.fullName || ev.email} logged in to executive portal`,
      subtitle: ev.duration ? `Session duration: ${ev.duration}` : "Active executive session",
      timeAgo: formatTimeAgo(ev.loginAt),
      type: "LOGIN",
      color: "bg-white/[0.08] text-white border-white/20",
    });
  });

  // Add recent activities
  activities.slice(0, 2).forEach((act) => {
    timelineItems.push({
      id: `act-${act.id}`,
      title: `Event registered: "${act.title}"`,
      subtitle: `${act.category} • ${act.venue}`,
      timeAgo: formatTimeAgo(act.startDate),
      type: "ACTIVITY",
      color: "bg-white/[0.06] text-neutral-300 border-white/15",
    });
  });

  // Add recent gallery photos
  gallery.slice(0, 2).forEach((p) => {
    timelineItems.push({
      id: `gal-${p.id}`,
      title: `Photograph curated: "${p.title}"`,
      subtitle: `By ${p.photographer} • ${p.category}`,
      timeAgo: formatTimeAgo(p.date),
      type: "GALLERY",
      color: "bg-white/[0.04] text-neutral-400 border-white/10",
    });
  });

  // Slice to max 5 items
  const displayTimeline = timelineItems.slice(0, 5);

  const maxChartCount = Math.max(...chartData.map((d) => d.count), 5);

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* ============================================================== */}
      {/* 1. HERO WELCOME BANNER (GLOWING MONOCHROME PRO)                 */}
      {/* ============================================================== */}
      <div className="relative rounded-3xl overflow-hidden bg-gradient-to-r from-[#141418] via-[#0E0E12] to-[#08080A] border border-white/10 p-6 sm:p-8 lg:p-10 shadow-[0_12px_40px_rgba(0,0,0,0.8)]">
        {/* Subtle white radial glow overlay */}
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-white/[0.03] rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          {/* Welcome Text */}
          <div className="space-y-2 max-w-xl">
            <span className="text-xs font-mono font-semibold tracking-wider text-neutral-400 uppercase">
              Club Administration Dashboard
            </span>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-white tracking-tight">
              Welcome back, <br className="hidden sm:inline" />
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-white via-neutral-100 to-neutral-400">
                {user.name || "Club Administrator"}
              </span>{" "}
              👋
            </h1>
            <p className="text-xs sm:text-sm text-neutral-400 leading-relaxed max-w-lg">
              Manage your photography club&apos;s content, members, and monitor activities all in one place.
            </p>
          </div>

          {/* Destin Sparks Quote Card with Camera Lens Backdrop */}
          <div className="relative w-full lg:w-96 rounded-2xl overflow-hidden border border-white/15 bg-black/75 shadow-[0_8px_30px_rgba(0,0,0,0.8)] group">
            <div className="absolute inset-0 opacity-35 mix-blend-luminosity filter grayscale pointer-events-none">
              <Image
                src="/images/through-viewfinder.jpg"
                alt="Camera Lens"
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
      {/* 2. 4 METRICS SUMMARY CARDS (MONOCHROMATIC GLOWING PRO)          */}
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
            {/* Monochromatic Sparkline wave decoration */}
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

        {/* Card 2: Gallery Photos */}
        <div
          onClick={() => onNavigateTab("gallery")}
          className="p-5 rounded-2xl bg-[#101014] border border-white/10 hover:border-white/30 hover:shadow-[0_0_25px_rgba(255,255,255,0.06)] transition-all shadow-md group cursor-pointer relative overflow-hidden"
        >
          <div className="flex items-start justify-between">
            <div className="w-11 h-11 rounded-xl bg-white/[0.06] border border-white/15 text-white flex items-center justify-center group-hover:bg-white group-hover:text-black group-hover:shadow-[0_0_15px_rgba(255,255,255,0.3)] transition-all">
              <ImageIcon className="w-5 h-5" />
            </div>
            {/* Monochromatic Sparkline wave decoration */}
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
            {/* Monochromatic Sparkline wave decoration */}
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

        {/* Card 4: Executive Accounts */}
        <div
          onClick={() => onNavigateTab("accounts")}
          className="p-5 rounded-2xl bg-[#101014] border border-white/10 hover:border-white/30 hover:shadow-[0_0_25px_rgba(255,255,255,0.06)] transition-all shadow-md group cursor-pointer relative overflow-hidden"
        >
          <div className="flex items-start justify-between">
            <div className="w-11 h-11 rounded-xl bg-white/[0.06] border border-white/15 text-white flex items-center justify-center group-hover:bg-white group-hover:text-black group-hover:shadow-[0_0_15px_rgba(255,255,255,0.3)] transition-all">
              <UserCheck className="w-5 h-5" />
            </div>
            {/* Monochromatic Sparkline wave decoration */}
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
              Executive Accounts
            </span>
            <div className="flex items-baseline gap-2 mt-0.5">
              <span className="text-2xl font-bold text-white tracking-tight">
                {executives.length}
              </span>
              <span className="text-xs text-neutral-500 font-mono">
                {activeExecutives} active
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ============================================================== */}
      {/* 3. QUICK ACTIONS (GLOWING MONOCHROME PRO)                       */}
      {/* ============================================================== */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-white flex items-center gap-2">
            <span>⚡ Quick Actions</span>
          </h2>
          <button
            onClick={() => onNavigateTab("activities")}
            className="text-xs text-neutral-400 hover:text-white font-medium inline-flex items-center gap-1 transition-colors cursor-pointer"
          >
            <span>Manage all content</span>
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
                Upload Photo
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
            onClick={onOpenProvisionExecutive}
            className="p-4 rounded-xl bg-[#101014] border border-white/10 hover:border-white/30 hover:bg-[#15151A] hover:shadow-[0_0_20px_rgba(255,255,255,0.06)] transition-all flex items-center justify-between text-left group cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-white/[0.06] text-white border border-white/15 group-hover:bg-white group-hover:text-black group-hover:shadow-[0_0_12px_rgba(255,255,255,0.25)] transition-all">
                <Shield className="w-4 h-4" />
              </div>
              <span className="text-xs sm:text-sm font-semibold text-white">
                Provision Executive
              </span>
            </div>
            <ArrowRight className="w-4 h-4 text-neutral-500 group-hover:text-white group-hover:translate-x-1 transition-all" />
          </button>
        </div>
      </div>

      {/* ============================================================== */}
      {/* 4. MAIN SPLIT WORKSPACE: CENTER CONTENT & RIGHT SECONDARY PANEL */}
      {/* ============================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* CENTER COLUMN (2/3 WIDTH) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Recent Activities Timeline */}
          <div className="p-5 sm:p-6 rounded-2xl bg-[#101014] border border-white/10 shadow-[0_8px_30px_rgba(0,0,0,0.6)]">
            <div className="flex items-center justify-between pb-4 border-b border-white/[0.08]">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-white" />
                <h3 className="text-sm font-bold text-white">Recent Activities</h3>
              </div>
              <button
                onClick={() => onNavigateTab("activity")}
                className="text-xs text-neutral-400 hover:text-white font-medium inline-flex items-center gap-1 transition-colors cursor-pointer"
              >
                <span>View All Logs</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="divide-y divide-white/[0.06] mt-2">
              {displayTimeline.length === 0 ? (
                <div className="py-8 text-center text-xs text-neutral-400">
                  No recent activity logged yet.
                </div>
              ) : (
                displayTimeline.map((item) => (
                  <div
                    key={item.id}
                    className="py-3.5 flex items-center justify-between gap-3 text-xs"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-8 h-8 rounded-full bg-white text-black flex items-center justify-center text-[11px] font-bold shrink-0 shadow-[0_0_10px_rgba(255,255,255,0.2)]">
                        CA
                      </div>
                      <div className="min-w-0">
                        <p className="text-white font-medium truncate">
                          {item.title}
                        </p>
                        <p className="text-neutral-500 text-[11px] truncate">
                          {item.subtitle}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2.5 shrink-0">
                      <span className="text-[11px] font-mono text-neutral-500">
                        {item.timeAgo}
                      </span>
                      <span className="px-2 py-0.5 rounded-full text-[9px] font-mono font-medium uppercase bg-white/[0.06] text-neutral-300 border border-white/15">
                        {item.type}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Quick Manage Cards (Monochromatic with Club Photography Covers) */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <span>⊞ Quick Manage</span>
              </h3>
              <button
                onClick={() => onNavigateTab("activities")}
                className="text-xs text-neutral-400 hover:text-white font-medium inline-flex items-center gap-1 transition-colors cursor-pointer"
              >
                <span>View All</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Manage Activities */}
              <div
                onClick={() => onNavigateTab("activities")}
                className="relative rounded-2xl overflow-hidden p-5 border border-white/10 hover:border-white/30 hover:shadow-[0_0_25px_rgba(255,255,255,0.08)] transition-all cursor-pointer group shadow-lg min-h-[140px] flex flex-col justify-end"
              >
                <div className="absolute inset-0 opacity-25 group-hover:opacity-35 transition-opacity mix-blend-luminosity filter grayscale">
                  <Image
                    src="/images/exhibition-2026.jpg"
                    alt="Activities"
                    fill
                    sizes="350px"
                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                </div>
                <div className="absolute inset-0 bg-gradient-to-t from-[#08080B] via-[#08080B]/80 to-transparent" />

                <div className="relative z-10 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white text-sm">
                      Activities & Events
                    </span>
                    <div className="w-7 h-7 rounded-full bg-white/10 group-hover:bg-white text-white group-hover:text-black flex items-center justify-center transition-all group-hover:shadow-[0_0_12px_rgba(255,255,255,0.3)]">
                      <ArrowRight className="w-3.5 h-3.5" />
                    </div>
                  </div>
                  <p className="text-[11px] text-neutral-400">
                    Create, edit, publish and manage club activities.
                  </p>
                </div>
              </div>

              {/* Manage Gallery */}
              <div
                onClick={() => onNavigateTab("gallery")}
                className="relative rounded-2xl overflow-hidden p-5 border border-white/10 hover:border-white/30 hover:shadow-[0_0_25px_rgba(255,255,255,0.08)] transition-all cursor-pointer group shadow-lg min-h-[140px] flex flex-col justify-end"
              >
                <div className="absolute inset-0 opacity-25 group-hover:opacity-35 transition-opacity mix-blend-luminosity filter grayscale">
                  <Image
                    src="/images/golden-hour-gcu.jpg"
                    alt="Gallery"
                    fill
                    sizes="350px"
                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                </div>
                <div className="absolute inset-0 bg-gradient-to-t from-[#08080B] via-[#08080B]/80 to-transparent" />

                <div className="relative z-10 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white text-sm">
                      Gallery Management
                    </span>
                    <div className="w-7 h-7 rounded-full bg-white/10 group-hover:bg-white text-white group-hover:text-black flex items-center justify-center transition-all group-hover:shadow-[0_0_12px_rgba(255,255,255,0.3)]">
                      <ArrowRight className="w-3.5 h-3.5" />
                    </div>
                  </div>
                  <p className="text-[11px] text-neutral-400">
                    Upload, organize and curate photography gallery.
                  </p>
                </div>
              </div>

              {/* Manage Team */}
              <div
                onClick={() => onNavigateTab("team")}
                className="relative rounded-2xl overflow-hidden p-5 border border-white/10 hover:border-white/30 hover:shadow-[0_0_25px_rgba(255,255,255,0.08)] transition-all cursor-pointer group shadow-lg min-h-[140px] flex flex-col justify-end"
              >
                <div className="absolute inset-0 opacity-25 group-hover:opacity-35 transition-opacity mix-blend-luminosity filter grayscale">
                  <Image
                    src="/images/about-students-sunset.jpg"
                    alt="Team"
                    fill
                    sizes="350px"
                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                </div>
                <div className="absolute inset-0 bg-gradient-to-t from-[#08080B] via-[#08080B]/80 to-transparent" />

                <div className="relative z-10 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white text-sm">
                      Team Members
                    </span>
                    <div className="w-7 h-7 rounded-full bg-white/10 group-hover:bg-white text-white group-hover:text-black flex items-center justify-center transition-all group-hover:shadow-[0_0_12px_rgba(255,255,255,0.3)]">
                      <ArrowRight className="w-3.5 h-3.5" />
                    </div>
                  </div>
                  <p className="text-[11px] text-neutral-400">
                    Manage committee members, roles and profiles.
                  </p>
                </div>
              </div>

              {/* Manage Accounts */}
              <div
                onClick={() => onNavigateTab("accounts")}
                className="relative rounded-2xl overflow-hidden p-5 border border-white/10 hover:border-white/30 hover:shadow-[0_0_25px_rgba(255,255,255,0.08)] transition-all cursor-pointer group shadow-lg min-h-[140px] flex flex-col justify-end"
              >
                <div className="absolute inset-0 opacity-25 group-hover:opacity-35 transition-opacity mix-blend-luminosity filter grayscale">
                  <Image
                    src="/images/gcu-building-facade.jpg"
                    alt="Executive Accounts"
                    fill
                    sizes="350px"
                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                </div>
                <div className="absolute inset-0 bg-gradient-to-t from-[#08080B] via-[#08080B]/80 to-transparent" />

                <div className="relative z-10 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white text-sm">
                      Executive Accounts
                    </span>
                    <div className="w-7 h-7 rounded-full bg-white/10 group-hover:bg-white text-white group-hover:text-black flex items-center justify-center transition-all group-hover:shadow-[0_0_12px_rgba(255,255,255,0.3)]">
                      <ArrowRight className="w-3.5 h-3.5" />
                    </div>
                  </div>
                  <p className="text-[11px] text-neutral-400">
                    Provision individual executive login credentials.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT SECONDARY PANEL (1/3 WIDTH) */}
        <div className="space-y-6">
          {/* Administrator Profile Card */}
          <div className="p-5 rounded-2xl bg-[#101014] border border-white/10 shadow-[0_8px_30px_rgba(0,0,0,0.6)] space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-mono text-neutral-400 uppercase tracking-wider flex items-center gap-1.5 font-semibold">
                ● Administrator
              </span>
              <span className="inline-flex items-center gap-1 text-[10px] font-mono px-2.5 py-0.5 rounded-full bg-white/[0.08] text-white border border-white/20">
                <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                Online
              </span>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-white text-black flex items-center justify-center font-bold text-base shadow-[0_0_18px_rgba(255,255,255,0.25)]">
                CA
              </div>
              <div className="min-w-0">
                <h4 className="text-sm font-bold text-white truncate">
                  {user.name || "Club Administrator"}
                </h4>
                <p className="text-xs text-neutral-400 font-mono truncate">
                  {user.email}
                </p>
              </div>
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

          {/* Executive Activity (Last 5 Days) Mini Bar Chart */}
          <div className="p-5 rounded-2xl bg-[#101014] border border-white/10 shadow-[0_8px_30px_rgba(0,0,0,0.6)] space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ActivityIcon className="w-4 h-4 text-white" />
                <h4 className="text-xs font-bold text-white">Executive Activity</h4>
              </div>
              <button
                onClick={() => onNavigateTab("activity")}
                className="text-neutral-400 hover:text-white cursor-pointer"
                title="View full activity report"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            <div className="flex items-center justify-between text-xs">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono bg-white/[0.08] text-white border border-white/20">
                Last 5 Days
              </span>
              <span className="text-[11px] font-mono text-neutral-400">
                {sessionEvents.length} total sessions
              </span>
            </div>

            {/* Glowing Monochromatic Bar Chart based on real 5-day login activity */}
            <div className="pt-2">
              <div className="h-28 flex items-end justify-between gap-3 px-2 border-b border-white/[0.08] pb-2">
                {chartData.map((bar, idx) => {
                  const heightPercent =
                    bar.count > 0
                      ? Math.min(100, Math.max(18, Math.round((bar.count / maxChartCount) * 100)))
                      : 8;

                  return (
                    <div
                      key={idx}
                      className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end group"
                    >
                      <div className="text-[9px] font-mono text-neutral-400 opacity-0 group-hover:opacity-100 transition-opacity">
                        {bar.count}
                      </div>
                      <div
                        className={`w-full rounded-t-md transition-all duration-500 ${
                          bar.count > 0
                            ? "bg-white group-hover:bg-neutral-100 shadow-[0_0_15px_rgba(255,255,255,0.3)]"
                            : "bg-white/[0.06]"
                        }`}
                        style={{ height: `${heightPercent}%` }}
                      />
                    </div>
                  );
                })}
              </div>

              {/* X-axis day labels */}
              <div className="flex justify-between px-2 pt-2 text-[10px] font-mono text-neutral-500">
                {chartData.map((bar, idx) => (
                  <span key={idx} className="flex-1 text-center">
                    {bar.dayLabel}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Database & Storage Status (Real Connection Info) */}
          <div className="p-5 rounded-2xl bg-[#101014] border border-white/10 shadow-[0_8px_30px_rgba(0,0,0,0.6)] space-y-3.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Database className="w-4 h-4 text-white" />
                <h4 className="text-xs font-bold text-white">Database & Media</h4>
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

              {/* Content distribution progress bar - Monochromatic layers */}
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
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-white" /> Gallery ({gallery.length})
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-neutral-400" /> Activities ({activities.length})
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-neutral-600" /> Team ({team.length})
                </span>
              </div>
            </div>

            <div className="pt-2 border-t border-white/[0.08] text-[10px] text-neutral-500 font-mono leading-relaxed">
              Storage: gallery-photos, event-posters, team-portraits, shutterscape-media
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

function formatTimeAgo(dateStr?: string | null): string {
  if (!dateStr) return "recently";
  try {
    const diffMs = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diffMs / 60000);
    if (mins < 1) return "just now";
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  } catch {
    return "recently";
  }
}
