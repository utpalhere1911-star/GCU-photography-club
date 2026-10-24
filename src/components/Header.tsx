"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Menu, X, LogIn, ExternalLink } from "lucide-react";
import ShutterScapeLogo from "./ShutterScapeLogo";

interface HeaderProps {
  onOpenJoin?: () => void;
  onOpenSearch?: () => void;
  activePage?: "home" | "activities" | "gallery" | "about" | "login";
}

export default function Header({
  activePage = "home",
}: HeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="absolute top-0 left-0 right-0 z-40 w-full px-3.5 sm:px-8 py-3 sm:py-4 transition-all duration-300">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        
        {/* Brand / Logos: Stationary at top-left on desktop; fluid on mobile */}
        <div className="shrink-0 min-w-0 md:w-64 h-11 flex items-center">
          <div
            className="flex items-center gap-1.5 sm:gap-3 shrink-0 md:fixed md:top-3 z-50 md:bg-[#08090A]/90 md:backdrop-blur-md md:py-1.5 md:px-3.5 md:-ml-3 md:rounded-2xl md:border md:border-[#303338]/80 md:shadow-lg md:shadow-black/50 transition-all duration-200"
            style={{ left: "max(2rem, calc(50vw - 38rem))" }}
          >
            {/* 1. ShutterScape Brand Logo Link */}
            <Link
              href="/"
              className="flex items-center group/brand shrink-0 rounded-md focus:outline-none focus-visible:ring-1 focus-visible:ring-white/70"
              aria-label="ShutterScape Home"
            >
              <ShutterScapeLogo
                height={32}
                priority
                className="transition-transform group-hover/brand:scale-105"
              />
            </Link>

            {/* Subtle Vertical Divider */}
            <div
              className="h-5 sm:h-6 w-px bg-white/20 shrink-0"
              aria-hidden="true"
            />

            {/* 2. Official Girijananda Chowdhury University (GCU) Logo Link */}
            <a
              href="https://gcuniversity.ac.in/"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center group/gcu shrink-0 rounded-md transition-opacity hover:opacity-90 focus:outline-none focus-visible:ring-1 focus-visible:ring-white/70"
              aria-label="Visit the official GCU website"
              title="Girijananda Chowdhury University (Official Website)"
            >
              <div className="relative h-[28px] w-[72px] sm:h-[34px] sm:w-[86px] md:h-[36px] md:w-[92px]">
                <Image
                  src="/images/gcu-logo-white-footer.png"
                  alt="Girijananda Chowdhury University"
                  fill
                  priority
                  sizes="(max-width: 640px) 72px, (max-width: 768px) 86px, 92px"
                  className="object-contain object-left transition-transform group-hover/gcu:scale-105"
                />
              </div>
            </a>
          </div>
        </div>

        {/* Desktop Navigation Pill (Scrolls away with page) */}
        <nav
          aria-label="Main Navigation"
          className="hidden md:flex items-center bg-[#111315]/90 backdrop-blur-md border border-[#303338] rounded-full p-1.5 shadow-xl shadow-black/60"
        >
          {(
            [
              { id: "home", label: "Home", href: "/" },
              { id: "activities", label: "Activities", href: "/activities" },
              { id: "gallery", label: "Gallery", href: "/gallery" },
              { id: "about", label: "About", href: "/about" },
            ] as const
          ).map((item) => {
            const isActive = activePage === item.id;
            return (
              <Link
                key={item.id}
                href={item.href}
                className={`relative px-4 py-1.5 rounded-full text-xs sm:text-sm font-medium transition-all duration-200 ease-out select-none focus:outline-none focus-visible:ring-1 focus-visible:ring-white/70 ${
                  isActive
                    ? "flex items-center gap-1.5 bg-[#08090A] text-[#F5F5F3] font-semibold border border-[#444850] shadow-[0_2px_14px_rgba(0,0,0,0.9),inset_0_1px_1px_rgba(255,255,255,0.08)]"
                    : "text-[#858A91] hover:text-[#F5F5F3] hover:bg-white/[0.04]"
                }`}
                aria-current={isActive ? "page" : undefined}
              >
                {isActive && (
                  <span
                    className="w-1.5 h-1.5 rounded-full bg-white shrink-0"
                    aria-hidden="true"
                  />
                )}
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Right CTA Controls (Scrolls away with page) */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Login Button */}
          <Link
            href="/login"
            className="flex items-center gap-1.5 bg-white hover:bg-[#D5D9DE] text-[#08090A] font-semibold px-3.5 sm:px-5 py-2 sm:py-2.5 rounded-full text-xs sm:text-sm shadow-lg shadow-white/5 transition-all duration-200 transform hover:-translate-y-0.5 active:translate-y-0 cursor-pointer"
          >
            <LogIn className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            <span>Login</span>
          </Link>

          {/* Mobile Hamburger Menu Toggle */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden w-9 h-9 rounded-full bg-[#111315]/90 border border-[#303338] flex items-center justify-center text-[#B5B8BC] hover:text-white transition cursor-pointer"
            aria-label="Toggle mobile menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden mt-3 mx-auto max-w-sm rounded-2xl bg-[#111315]/95 backdrop-blur-xl border border-[#303338] p-4 shadow-2xl flex flex-col gap-2.5 animate-in slide-in-from-top-4 duration-200">
          {(
            [
              { id: "home", label: "Home", href: "/" },
              { id: "activities", label: "Activities", href: "/activities" },
              { id: "gallery", label: "Gallery", href: "/gallery" },
              { id: "about", label: "About", href: "/about" },
            ] as const
          ).map((item) => {
            const isActive = activePage === item.id;
            return (
              <Link
                key={item.id}
                href={item.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center justify-between px-4 py-2.5 rounded-xl text-sm transition-all duration-200 ${
                  isActive
                    ? "bg-[#08090A] text-white font-semibold border border-[#444850] shadow-[0_2px_10px_rgba(0,0,0,0.85)]"
                    : "text-[#858A91] hover:text-[#F5F5F3] hover:bg-white/[0.04]"
                }`}
                aria-current={isActive ? "page" : undefined}
              >
                <span>{item.label}</span>
                {isActive && (
                  <span
                    className="w-2 h-2 rounded-full bg-white shrink-0"
                    aria-hidden="true"
                  />
                )}
              </Link>
            );
          })}
          <div className="pt-2 border-t border-[#303338] flex flex-col gap-2">
            <a
              href="https://gcuniversity.ac.in/"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between px-4 py-2 rounded-xl text-xs text-[#858A91] hover:text-white bg-white/[0.02] hover:bg-white/[0.06] border border-white/5 transition-colors"
              aria-label="Visit the official GCU website"
              title="Girijananda Chowdhury University"
            >
              <span>Visit Official GCU Website</span>
              <ExternalLink className="w-3.5 h-3.5 text-[#858A91]" />
            </a>

            <Link
              href="/login"
              onClick={() => setMobileMenuOpen(false)}
              className="w-full flex items-center justify-center gap-2 bg-white hover:bg-[#D5D9DE] text-[#08090A] font-semibold py-2.5 px-4 rounded-xl text-sm shadow-md"
            >
              <LogIn className="w-4 h-4" />
              <span>Login</span>
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
