"use client";

import React, { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { SlidersHorizontal, ChevronDown, Check, X } from "lucide-react";
import { GalleryCategory, galleryCategories } from "@/data/gallery";

export type SortOption =
  | "newest"
  | "oldest"
  | "likes-desc"
  | "title-asc"
  | "title-desc";

interface SortItem {
  value: SortOption;
  label: string;
}

const SORT_OPTIONS: SortItem[] = [
  { value: "newest", label: "Newest First" },
  { value: "likes-desc", label: "Most Liked" },
  { value: "oldest", label: "Oldest First" },
  { value: "title-asc", label: "Title (A to Z)" },
  { value: "title-desc", label: "Title (Z to A)" },
];

interface GalleryToolbarProps {
  selectedCategory: GalleryCategory;
  onSelectCategory: (category: GalleryCategory) => void;
  sortBy: SortOption;
  onSortChange: (sort: SortOption) => void;
}

export default function GalleryToolbar({
  selectedCategory,
  onSelectCategory,
  sortBy,
  onSortChange,
}: GalleryToolbarProps) {
  const [sortOpen, setSortOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Lock background scroll on mobile when bottom sheet is active
  useEffect(() => {
    if (sortOpen && typeof window !== "undefined" && window.innerWidth < 640) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [sortOpen]);

  // Close sorting menu when clicking outside on desktop or pressing Escape
  useEffect(() => {
    if (!sortOpen) return;

    const handleClickOutside = (e: MouseEvent) => {
      // On mobile, backdrop onClick handles dismissal cleanly
      if (typeof window !== "undefined" && window.innerWidth < 640) return;

      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(e.target as Node)
      ) {
        setSortOpen(false);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setSortOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [sortOpen]);

  const currentSortLabel =
    SORT_OPTIONS.find((opt) => opt.value === sortBy)?.label || "Sort";

  return (
    <div className="relative w-full bg-[#111315]/95 backdrop-blur-xl border border-[#303338] rounded-2xl sm:rounded-3xl p-2 sm:p-2.5 shadow-2xl">
      <div className="flex items-center justify-between gap-2.5 sm:gap-4 w-full min-w-0">
        
        {/* Dedicated Horizontal Scrolling Category Container */}
        <div
          className="flex-1 min-w-0 overflow-x-auto overflow-y-hidden [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden touch-pan-x py-1 px-0.5"
          role="tablist"
          aria-label="Filter gallery by category"
        >
          <div className="flex items-center gap-1.5 sm:gap-2 flex-nowrap w-max">
            {galleryCategories.map((cat) => {
              const isActive = selectedCategory === cat;
              return (
                <button
                  key={cat}
                  role="tab"
                  aria-selected={isActive}
                  onClick={() => onSelectCategory(cat)}
                  className={`shrink-0 inline-flex items-center justify-center px-3 sm:px-3.5 py-1 sm:py-1.5 h-7 sm:h-8 rounded-full text-[11px] sm:text-xs font-medium cursor-pointer select-none transition-all duration-200 ease-out motion-reduce:transition-none focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-1 focus-visible:ring-offset-[#111315] ${
                    isActive
                      ? "bg-white text-[#08090A] font-bold border border-white scale-[1.04] sm:scale-[1.05] shadow-[0_2px_12px_rgba(255,255,255,0.2)] z-10"
                      : "bg-[#17191C] hover:bg-[#202327] text-[#B5B8BC] hover:text-[#F5F5F3] border border-[#303338] scale-100 hover:border-zinc-500/70"
                  }`}
                >
                  <span>{cat}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Sorting Control Container */}
        <div className="relative shrink-0 pl-1.5 sm:pl-2 border-l border-[#303338]/80">
          <button
            ref={buttonRef}
            type="button"
            onClick={() => setSortOpen(!sortOpen)}
            className="flex items-center gap-1.5 bg-[#17191C] hover:bg-[#202327] border border-[#303338] hover:border-zinc-500 rounded-full px-2.5 sm:px-3 py-1.5 text-[11px] sm:text-xs text-[#F5F5F3] transition cursor-pointer select-none shrink-0 shadow-sm focus:outline-none focus-visible:ring-1 focus-visible:ring-white"
            aria-expanded={sortOpen}
            aria-haspopup="listbox"
            aria-label="Sort photographs"
          >
            <SlidersHorizontal className="w-3.5 h-3.5 text-[#858A91] shrink-0" />
            <span className="font-medium whitespace-nowrap hidden sm:inline">
              {currentSortLabel}
            </span>
            <span className="font-medium whitespace-nowrap sm:hidden">
              Sort
            </span>
            <ChevronDown
              className={`w-3.5 h-3.5 text-[#858A91] transition-transform duration-200 ${
                sortOpen ? "rotate-180 text-white" : ""
              }`}
            />
          </button>

          {/* Desktop Anchored Dropdown Menu (Hidden on mobile) */}
          {sortOpen && (
            <div
              ref={dropdownRef}
              role="listbox"
              aria-label="Sort options"
              className="hidden sm:block absolute right-0 top-full mt-2 w-48 rounded-2xl bg-[#111315]/95 backdrop-blur-xl border border-[#303338] p-1.5 shadow-[0_16px_40px_rgba(0,0,0,0.95)] z-50 animate-in fade-in duration-150"
            >
              {SORT_OPTIONS.map((opt) => {
                const isSelected = sortBy === opt.value;
                return (
                  <button
                    key={opt.value}
                    role="option"
                    aria-selected={isSelected}
                    onClick={() => {
                      onSortChange(opt.value);
                      setSortOpen(false);
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition cursor-pointer text-left ${
                      isSelected
                        ? "bg-white text-[#08090A] font-bold shadow-sm"
                        : "text-[#B5B8BC] hover:text-[#F5F5F3] hover:bg-white/[0.06]"
                    }`}
                  >
                    <span>{opt.label}</span>
                    {isSelected && (
                      <Check className="w-3.5 h-3.5 text-[#08090A] stroke-[2.5]" />
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>

      </div>

      {/* Mobile Bottom Sheet Drawer: Portaled to document.body to escape backdrop-filter containing block */}
      {mounted && sortOpen && createPortal(
        <div className="sm:hidden fixed inset-0 z-[999] flex flex-col justify-end">
          {/* Dimmed backdrop */}
          <div
            className="fixed inset-0 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200"
            onClick={() => setSortOpen(false)}
            aria-hidden="true"
          />

          {/* Bottom Sheet Card */}
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Sort photographs"
            className="relative z-10 w-full max-h-[85vh] overflow-y-auto bg-[#111315] border-t border-[#303338] rounded-t-3xl p-4 sm:p-5 pb-[max(1.5rem,env(safe-area-inset-bottom))] shadow-[0_-12px_40px_rgba(0,0,0,0.95)] animate-in slide-in-from-bottom duration-200"
          >
            {/* Grab Handle */}
            <div className="w-10 h-1 bg-zinc-700/80 rounded-full mx-auto mb-3.5" />

            {/* Header */}
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-[#303338]">
              <div className="flex items-center gap-2">
                <SlidersHorizontal className="w-4 h-4 text-white" />
                <h3 className="text-sm font-bold text-[#F5F5F3] tracking-tight">
                  Sort Photographs
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSortOpen(false)}
                className="w-8 h-8 rounded-full bg-[#17191C] border border-[#303338] flex items-center justify-center text-[#858A91] hover:text-white cursor-pointer active:scale-95 transition-transform"
                aria-label="Close sort menu"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Options List */}
            <div className="space-y-2" role="listbox">
              {SORT_OPTIONS.map((opt) => {
                const isSelected = sortBy === opt.value;
                return (
                  <button
                    key={opt.value}
                    role="option"
                    aria-selected={isSelected}
                    onClick={() => {
                      onSortChange(opt.value);
                      setSortOpen(false);
                    }}
                    className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-xs sm:text-sm font-semibold transition active:scale-[0.98] text-left cursor-pointer min-h-[48px] ${
                      isSelected
                        ? "bg-white text-[#08090A] shadow-md font-bold"
                        : "bg-[#17191C] text-[#B5B8BC] hover:text-white border border-[#303338]/60"
                    }`}
                  >
                    <span>{opt.label}</span>
                    {isSelected && (
                      <Check className="w-4 h-4 text-[#08090A] stroke-[2.5]" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
