"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { Mail, MapPin, ArrowRight, ArrowUpRight } from "lucide-react";
import ShutterScapeLogo from "./ShutterScapeLogo";

export default function Footer() {
  return (
    <footer className="w-full bg-[#08090A] border-t border-[#222428] relative text-[#B5B8BC] text-xs">
      {/* Subtle atmospheric top gradient */}
      <div
        aria-hidden="true"
        className="absolute inset-x-0 top-0 h-16 bg-gradient-to-b from-white/[0.02] to-transparent pointer-events-none"
      />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-8 space-y-8">
        
        {/* Main Footer Content Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-8 lg:gap-10 pb-8 border-b border-[#222428] items-start">
          
          {/* Column 1: ShutterScape Brand Anchor (4 cols on lg) */}
          <div className="lg:col-span-4 flex flex-col items-start min-w-0">
            <Link
              href="/"
              className="inline-block group focus:outline-none focus-visible:ring-1 focus-visible:ring-white/70 rounded-md"
              aria-label="ShutterScape — Home"
            >
              <ShutterScapeLogo
                height={50}
                className="transition-opacity group-hover:opacity-90"
              />
            </Link>
            <span className="text-xs font-medium tracking-normal text-[#858A91] leading-tight select-none mt-2">
              Photography Club GCU
            </span>
            <p className="text-xs text-[#858A91] leading-relaxed mt-3 max-w-sm">
              The official photographic society of Girijananda Chowdhury University, capturing stories, perspectives, and moments across campus life.
            </p>
          </div>

          {/* Column 2: Navigation Links (2 cols on lg) */}
          <div className="lg:col-span-2 flex flex-col items-start min-w-0">
            <p className="text-[11px] font-semibold tracking-[0.16em] text-[#F5F5F3] uppercase mb-3.5">
              Quick Links
            </p>
            <nav
              aria-label="Footer Navigation"
              className="grid grid-cols-2 sm:flex sm:flex-col gap-2.5 text-xs w-full"
            >
              <Link
                href="/"
                className="text-[#858A91] hover:text-[#F5F5F3] transition-colors font-medium py-0.5 focus:outline-none focus-visible:ring-1 focus-visible:ring-white/70 rounded"
              >
                Home
              </Link>
              <Link
                href="/activities"
                className="text-[#858A91] hover:text-[#F5F5F3] transition-colors font-medium py-0.5 focus:outline-none focus-visible:ring-1 focus-visible:ring-white/70 rounded"
              >
                Activities
              </Link>
              <Link
                href="/gallery"
                className="text-[#858A91] hover:text-[#F5F5F3] transition-colors font-medium py-0.5 focus:outline-none focus-visible:ring-1 focus-visible:ring-white/70 rounded"
              >
                Gallery
              </Link>
              <Link
                href="/about"
                className="text-[#858A91] hover:text-[#F5F5F3] transition-colors font-medium py-0.5 focus:outline-none focus-visible:ring-1 focus-visible:ring-white/70 rounded"
              >
                About
              </Link>
            </nav>
          </div>

          {/* Column 3: University Identity & Location (3 cols on lg) */}
          <div className="lg:col-span-3 flex flex-col items-start min-w-0 text-left">
            <p className="text-[11px] font-semibold tracking-[0.16em] text-[#F5F5F3] uppercase mb-3.5">
              University
            </p>
            <a
              href="https://gcuniversity.ac.in/"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Visit the official GCU website"
              title="Girijananda Chowdhury University (Official Website)"
              className="relative h-[44px] w-[116px] sm:h-[48px] sm:w-[126px] block group focus:outline-none focus-visible:ring-1 focus-visible:ring-white/70 rounded-md shrink-0 mb-2.5"
            >
              <Image
                src="/images/gcu-logo-white-footer.png"
                alt="Girijananda Chowdhury University"
                fill
                sizes="(max-width: 640px) 116px, 126px"
                className="object-contain object-left transition-opacity group-hover:opacity-85"
              />
            </a>
            <div className="flex items-start gap-1.5 text-[#858A91] text-xs leading-relaxed">
              <MapPin className="w-3.5 h-3.5 text-[#858A91] shrink-0 mt-0.5" />
              <span className="break-words">Hathkhopara, Azara, Guwahati, Assam, India</span>
            </div>
            <a
              href="https://maps.app.goo.gl/NhdHs1u76Bjxo2J87"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs text-[#D5D9DE] hover:text-white font-medium mt-2 group transition-colors focus:outline-none focus-visible:ring-1 focus-visible:ring-white/70 rounded"
            >
              <span>View on Maps</span>
              <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform text-[#858A91] group-hover:text-white" />
            </a>
          </div>

          {/* Column 4: Contact & Social Community (3 cols on lg) */}
          <div className="lg:col-span-3 flex flex-col items-start min-w-0">
            <p className="text-[11px] font-semibold tracking-[0.16em] text-[#F5F5F3] uppercase mb-3.5">
              Connect
            </p>
            
            {/* Email link */}
            <a
              href="mailto:shutterscape@gcuniversity.ac.in"
              className="inline-flex items-center gap-2 text-xs text-[#B5B8BC] hover:text-white transition-colors group max-w-full focus:outline-none focus-visible:ring-1 focus-visible:ring-white/70 rounded"
            >
              <div className="w-6 h-6 rounded-md bg-[#111315] border border-[#222428] flex items-center justify-center text-[#858A91] group-hover:text-white group-hover:border-white/40 transition-colors shrink-0">
                <Mail className="w-3.5 h-3.5" />
              </div>
              <span className="font-mono text-[11px] sm:text-xs break-all sm:break-normal">
                shutterscape@gcuniversity.ac.in
              </span>
            </a>

            {/* Social Icons */}
            <div className="flex items-center gap-2 mt-4">
              {/* Instagram */}
              <a
                href="https://www.instagram.com/shutterscape_gcu"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Follow ShutterScape GCU on Instagram"
                className="w-8 h-8 rounded-lg bg-[#111315] border border-[#222428] hover:border-white/40 hover:bg-[#17191C] flex items-center justify-center text-[#858A91] hover:text-white transition-all duration-200 focus:outline-none focus-visible:ring-1 focus-visible:ring-white/70"
              >
                <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                </svg>
              </a>

              {/* WhatsApp */}
              <a
                href="https://chat.whatsapp.com/Hs71BicR1Xj3PmOyPJ5wdc?s=sw&p=a&mlu=4&ilr=4"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Join ShutterScape GCU on WhatsApp"
                className="w-8 h-8 rounded-lg bg-[#111315] border border-[#222428] hover:border-white/40 hover:bg-[#17191C] flex items-center justify-center text-[#858A91] hover:text-white transition-all duration-200 focus:outline-none focus-visible:ring-1 focus-visible:ring-white/70"
              >
                <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z" />
                </svg>
              </a>
            </div>
          </div>

        </div>

        {/* Bottom Colophon & Attribution Line */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-[#858A91] text-[11px] pt-1">
          <div>
            © 2026 ShutterScape — Girijananda Chowdhury University Photography Club. All rights reserved.
          </div>

          <a
            href="https://codingclub.gcuniversity.ac.in"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-[#B5B8BC] hover:text-white transition group font-medium focus:outline-none focus-visible:ring-1 focus-visible:ring-white/70 rounded"
          >
            <span>Website Maintained by Codénix (GCU Coding Club)</span>
            <ArrowUpRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
          </a>
        </div>

      </div>
    </footer>
  );
}
