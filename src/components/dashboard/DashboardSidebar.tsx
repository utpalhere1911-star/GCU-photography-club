"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Home,
  Calendar,
  Image as ImageIcon,
  Users,
  UserCheck,
  Activity as ActivityIcon,
  ExternalLink,
  RefreshCw,
  Camera,
  X,
  ArrowRight,
} from "lucide-react";
import ShutterScapeLogo from "@/components/ShutterScapeLogo";

export type DashboardTab =
  | "overview"
  | "activities"
  | "gallery"
  | "team"
  | "accounts"
  | "activity";

interface DashboardSidebarProps {
  role: "admin" | "executive";
  activeTab: DashboardTab;
  setActiveTab: (tab: DashboardTab) => void;
  activitiesCount: number;
  galleryCount: number;
  teamCount: number;
  executivesCount?: number;
  isMobileOpen: boolean;
  setIsMobileOpen: (open: boolean) => void;
  onResetArchive: () => void;
}

export default function DashboardSidebar({
  role,
  activeTab,
  setActiveTab,
  activitiesCount,
  galleryCount,
  teamCount,
  executivesCount = 0,
  isMobileOpen,
  setIsMobileOpen,
  onResetArchive,
}: DashboardSidebarProps) {
  const isAdmin = role === "admin";

  const navItems = [
    {
      id: "overview" as DashboardTab,
      label: "Dashboard",
      icon: Home,
      badge: null,
      adminOnly: false,
    },
    {
      id: "activities" as DashboardTab,
      label: "Activities & Events",
      icon: Calendar,
      badge: activitiesCount > 0 ? String(activitiesCount) : null,
      adminOnly: false,
    },
    {
      id: "gallery" as DashboardTab,
      label: "Gallery Archive",
      icon: ImageIcon,
      badge: galleryCount > 0 ? String(galleryCount) : null,
      adminOnly: false,
    },
    {
      id: "team" as DashboardTab,
      label: "Team Members",
      icon: Users,
      badge: teamCount > 0 ? String(teamCount) : null,
      adminOnly: false,
    },
    {
      id: "accounts" as DashboardTab,
      label: "Executive Accounts",
      icon: UserCheck,
      badge: executivesCount > 0 ? String(executivesCount) : "Admin",
      adminOnly: true,
    },
    {
      id: "activity" as DashboardTab,
      label: "Activity Monitoring",
      icon: ActivityIcon,
      badge: "5-Day",
      adminOnly: true,
    },
  ];

  const handleSelectTab = (tab: DashboardTab) => {
    setActiveTab(tab);
    setIsMobileOpen(false);
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isMobileOpen && (
        <div
          onClick={() => setIsMobileOpen(false)}
          className="fixed inset-0 z-40 bg-black/80 backdrop-blur-sm lg:hidden animate-fade-in"
          aria-hidden="true"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-72 bg-[#0A0A0D] border-r border-white/[0.08] flex flex-col justify-between transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          isMobileOpen ? "translate-x-0 shadow-[0_0_50px_rgba(0,0,0,0.9)]" : "-translate-x-full"
        }`}
      >
        {/* Top Header Section */}
        <div className="flex flex-col">
          <div className="px-6 py-5 border-b border-white/[0.08] flex items-center justify-between">
            <div className="flex flex-col gap-1.5">
              <Link
                href="/"
                className="flex items-center gap-2 focus:outline-none group"
                aria-label="ShutterScape Home"
              >
                <ShutterScapeLogo height={28} priority />
              </Link>

              {/* Role Indicator Badge */}
              <div className="flex items-center gap-2 mt-1">
                {isAdmin ? (
                  <span className="inline-flex items-center gap-1.5 text-[10px] font-mono font-semibold tracking-wider uppercase px-2.5 py-0.5 rounded-full bg-white/[0.08] text-white border border-white/20 shadow-[0_0_12px_rgba(255,255,255,0.06)]">
                    <span className="text-white">●</span> Club Admin
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 text-[10px] font-mono font-semibold tracking-wider uppercase px-2.5 py-0.5 rounded-full bg-white/[0.06] text-neutral-200 border border-white/15">
                    <Camera className="w-3 h-3 text-neutral-300" /> Executive Studio
                  </span>
                )}
                <span className="text-[10px] font-mono text-neutral-400 uppercase tracking-wider">
                  Panel
                </span>
              </div>
            </div>

            {/* Mobile Close Button */}
            <button
              onClick={() => setIsMobileOpen(false)}
              className="lg:hidden p-1.5 rounded-xl text-neutral-400 hover:text-white hover:bg-white/[0.08] transition-colors"
              aria-label="Close menu"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation Links */}
          <nav className="px-3.5 py-4 space-y-1.5 overflow-y-auto dashboard-scrollbar">
            {navItems
              .filter((item) => !item.adminOnly || isAdmin)
              .map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;

                return (
                  <button
                    key={item.id}
                    onClick={() => handleSelectTab(item.id)}
                    className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-medium transition-all cursor-pointer ${
                      isActive
                        ? "dashboard-nav-active font-semibold"
                        : "text-neutral-400 hover:text-white hover:bg-white/[0.05]"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Icon
                        className={`w-4 h-4 transition-colors ${
                          isActive ? "text-[#050507]" : "text-neutral-400"
                        }`}
                      />
                      <span>{item.label}</span>
                    </div>

                    {item.badge && (
                      <span
                        className={`px-2 py-0.5 text-[10px] font-mono rounded-full font-medium transition-colors ${
                          isActive
                            ? "bg-black/15 text-black"
                            : "bg-white/[0.06] text-neutral-300 border border-white/10"
                        }`}
                      >
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}

            {/* External Links & Utility Actions */}
            <div className="pt-3 mt-3 border-t border-white/[0.08] space-y-1">
              <Link
                href="/"
                target="_blank"
                className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-medium text-neutral-400 hover:text-white hover:bg-white/[0.05] transition-colors"
              >
                <div className="flex items-center gap-3">
                  <ExternalLink className="w-4 h-4 text-neutral-400" />
                  <span>Website Preview</span>
                </div>
                <span className="text-[10px] font-mono text-neutral-400">live</span>
              </Link>

              <button
                onClick={onResetArchive}
                className="w-full flex items-center justify-between px-3.5 py-2 rounded-xl text-xs font-medium text-neutral-400 hover:text-white hover:bg-white/[0.06] transition-colors cursor-pointer group"
                title="Reset sample test items back to official club archive seeds"
              >
                <div className="flex items-center gap-3">
                  <RefreshCw className="w-3.5 h-3.5 group-hover:rotate-180 transition-transform duration-500 text-neutral-400 group-hover:text-white" />
                  <span>Reset Archive</span>
                </div>
                <span className="text-[9px] font-mono text-neutral-400 uppercase">
                  seed
                </span>
              </button>
            </div>
          </nav>
        </div>

        {/* Bottom Card — Photography Inspiration */}
        <div className="p-4 m-3.5 rounded-2xl bg-gradient-to-br from-[#121216] to-[#0A0A0D] border border-white/10 relative overflow-hidden group shadow-[0_8px_24px_rgba(0,0,0,0.6)] hover:border-white/25 transition-all">
          {/* Subtle photography lens reflection background */}
          <div className="absolute inset-0 opacity-15 pointer-events-none mix-blend-luminosity filter grayscale">
            <Image
              src="/images/through-viewfinder.jpg"
              alt="Viewfinder"
              fill
              sizes="260px"
              className="object-cover group-hover:scale-105 transition-transform duration-700"
            />
          </div>

          <div className="relative z-10 space-y-2.5">
            <div className="w-9 h-9 rounded-xl bg-white text-black flex items-center justify-center shadow-[0_0_15px_rgba(255,255,255,0.25)]">
              <Camera className="w-4 h-4" />
            </div>

            <div>
              <p className="text-[10px] font-mono tracking-widest uppercase text-neutral-400 font-semibold">
                Capture • Create • Inspire
              </p>
              <h4 className="text-xs font-bold text-white mt-0.5">
                ShutterScape Club
              </h4>
              <p className="text-[10px] text-neutral-400 leading-tight mt-0.5">
                Girijananda Chowdhury University, Guwahati
              </p>
            </div>

            <Link
              href="/gallery"
              target="_blank"
              className="inline-flex items-center gap-1.5 text-[11px] font-medium text-white/90 hover:text-white pt-1 group-hover:translate-x-0.5 transition-all"
            >
              <span>Explore Public Showcase</span>
              <ArrowRight className="w-3 h-3 text-white" />
            </Link>
          </div>
        </div>
      </aside>
    </>
  );
}
