"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import {
  Search,
  Menu,
  LogOut,
  ExternalLink,
  ChevronDown,
  Shield,
  Camera,
  X,
} from "lucide-react";

interface SessionUser {
  id?: string;
  email: string;
  role: "admin" | "executive";
  name: string;
  authProvider?: "supabase" | "local";
}

interface DashboardTopBarProps {
  user: SessionUser;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  onToggleMobileMenu: () => void;
  onLogout: () => void;
}

export default function DashboardTopBar({
  user,
  searchQuery,
  onSearchChange,
  onToggleMobileMenu,
  onLogout,
}: DashboardTopBarProps) {
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const profileMenuRef = useRef<HTMLDivElement>(null);

  // Keyboard shortcut Ctrl+K or Cmd+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Close profile dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        profileMenuRef.current &&
        !profileMenuRef.current.contains(e.target as Node)
      ) {
        setIsProfileMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const initials = user.name
    ? user.name
        .split(" ")
        .map((w) => w[0])
        .join("")
        .slice(0, 2)
        .toUpperCase()
    : user.role === "admin"
    ? "CA"
    : "EM";

  const isAdmin = user.role === "admin";

  return (
    <header className="sticky top-0 z-30 w-full bg-[#0A0A0D]/90 backdrop-blur-md border-b border-white/[0.08] px-4 sm:px-8 py-3 transition-all">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-3 sm:gap-6">
        {/* Left Side: Mobile Menu Button & Search */}
        <div className="flex items-center gap-3 flex-1 max-w-xl">
          <button
            onClick={onToggleMobileMenu}
            className="lg:hidden p-2 rounded-xl text-neutral-400 hover:text-white bg-[#141418] border border-white/10 hover:border-white/25 transition-all cursor-pointer"
            aria-label="Toggle navigation menu"
          >
            <Menu className="w-5 h-5" />
          </button>

          {/* Monochromatic Glowing Search Bar */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-500 pointer-events-none" />
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search activities, photos, members..."
              className="w-full bg-[#121216] border border-white/10 hover:border-white/25 focus:border-white/60 focus:ring-1 focus:ring-white/20 rounded-xl pl-9 pr-14 sm:pr-16 py-2 text-xs sm:text-sm text-white placeholder-neutral-500 focus:outline-none transition-all shadow-[inset_0_1px_2px_rgba(0,0,0,0.5)]"
            />
            {searchQuery ? (
              <button
                onClick={() => onSearchChange("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-white p-0.5 cursor-pointer"
                title="Clear search"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            ) : (
              <div className="hidden sm:flex items-center absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                <kbd className="px-1.5 py-0.5 rounded text-[10px] font-mono font-medium text-neutral-400 bg-[#1A1A20] border border-white/10">
                  Ctrl K
                </kbd>
              </div>
            )}
          </div>
        </div>

        {/* Right Side: Status Badge, Website Link & Profile Pill */}
        <div className="flex items-center gap-2.5 sm:gap-4 shrink-0">
          {/* Monochromatic Realtime Sync Indicator */}
          <div className="hidden md:flex items-center gap-2 px-3 py-1 rounded-full bg-[#121216] border border-white/10 text-[11px] font-mono text-neutral-300 shadow-[0_0_12px_rgba(255,255,255,0.03)]">
            <span className="w-1.5 h-1.5 rounded-full bg-white shadow-[0_0_8px_rgba(255,255,255,0.8)] animate-pulse" />
            <span>Live Sync</span>
          </div>

          {/* View Website Button */}
          <Link
            href="/"
            target="_blank"
            className="hidden sm:inline-flex items-center gap-1.5 text-xs font-medium text-neutral-300 hover:text-white px-3 py-1.5 rounded-xl border border-white/10 hover:border-white/30 bg-[#121216] hover:bg-white/[0.06] transition-all"
          >
            <span>Live Site</span>
            <ExternalLink className="w-3.5 h-3.5 text-neutral-400" />
          </Link>

          {/* Profile Pill & Dropdown */}
          <div className="relative" ref={profileMenuRef}>
            <button
              onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
              className="flex items-center gap-2.5 p-1 sm:px-2.5 sm:py-1 rounded-full sm:rounded-xl bg-[#121216] border border-white/10 hover:border-white/25 transition-all cursor-pointer group shadow-[0_2px_10px_rgba(0,0,0,0.5)]"
              aria-label="User account menu"
              aria-expanded={isProfileMenuOpen}
            >
              {/* Initials Avatar */}
              <div className="w-8 h-8 rounded-full bg-white text-black flex items-center justify-center text-xs font-bold shadow-[0_0_12px_rgba(255,255,255,0.25)]">
                {initials}
              </div>

              {/* Text Info */}
              <div className="hidden sm:flex flex-col text-left">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-semibold text-white group-hover:text-neutral-200 transition-colors truncate max-w-[120px]">
                    {user.name}
                  </span>
                  <span className="w-1.5 h-1.5 rounded-full bg-white shadow-[0_0_6px_rgba(255,255,255,0.7)]" />
                </div>
                <span className="text-[10px] text-neutral-400 font-mono capitalize">
                  {isAdmin ? "Administrator" : "Executive"}
                </span>
              </div>

              <ChevronDown
                className={`hidden sm:block w-3.5 h-3.5 text-neutral-400 transition-transform duration-200 ${
                  isProfileMenuOpen ? "rotate-180 text-white" : ""
                }`}
              />
            </button>

            {/* Dropdown Menu */}
            {isProfileMenuOpen && (
              <div className="absolute right-0 mt-2 w-64 bg-[#101014] border border-white/15 rounded-2xl shadow-[0_16px_40px_rgba(0,0,0,0.8),0_0_30px_rgba(255,255,255,0.05)] p-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                <div className="p-3 border-b border-white/[0.08] mb-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-bold text-white truncate">
                      {user.name}
                    </span>
                    <span className="text-[9px] font-mono uppercase px-2 py-0.5 rounded-full bg-white/[0.08] text-white border border-white/20">
                      Online
                    </span>
                  </div>
                  <p className="text-[11px] text-neutral-400 font-mono truncate">
                    {user.email}
                  </p>
                  <div className="mt-2 flex items-center gap-1.5">
                    {isAdmin ? (
                      <span className="inline-flex items-center gap-1.5 text-[10px] font-mono font-semibold px-2.5 py-0.5 rounded-full bg-white/[0.08] text-white border border-white/20">
                        <Shield className="w-3 h-3 text-white" /> Club Administrator
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 text-[10px] font-mono font-semibold px-2.5 py-0.5 rounded-full bg-white/[0.06] text-neutral-200 border border-white/15">
                        <Camera className="w-3 h-3 text-neutral-300" /> Executive Member
                      </span>
                    )}
                  </div>
                </div>

                <div className="space-y-0.5">
                  <Link
                    href="/"
                    target="_blank"
                    className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs text-neutral-300 hover:text-white hover:bg-white/[0.06] transition-colors"
                  >
                    <span className="flex items-center gap-2">
                      <ExternalLink className="w-3.5 h-3.5 text-neutral-400" />
                      <span>View Public Website</span>
                    </span>
                    <span className="text-[10px] font-mono text-neutral-400">↗</span>
                  </Link>

                  <button
                    onClick={() => {
                      setIsProfileMenuOpen(false);
                      onLogout();
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs text-neutral-300 hover:text-white hover:bg-white/[0.08] transition-colors cursor-pointer text-left"
                  >
                    <LogOut className="w-3.5 h-3.5 text-neutral-400" />
                    <span>Sign Out of Studio</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
