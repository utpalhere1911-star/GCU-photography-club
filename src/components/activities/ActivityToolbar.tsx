"use client";

import React from "react";
import { Search, Calendar, ChevronDown, X } from "lucide-react";
import { ActivityCategory } from "@/data/activities";

interface ActivityToolbarProps {
  selectedCategory: ActivityCategory;
  onSelectCategory: (category: ActivityCategory) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  sortOrder: "newest" | "oldest";
  onSortChange: (order: "newest" | "oldest") => void;
}

const categories: ActivityCategory[] = [
  "All Activities",
  "Photo Walk",
  "Exhibition",
  "Workshop",
  "Challenge",
  "Event Coverage",
];

export default function ActivityToolbar({
  selectedCategory,
  onSelectCategory,
  searchQuery,
  onSearchChange,
  sortOrder,
  onSortChange,
}: ActivityToolbarProps) {
  return (
    <div className="w-full bg-[#111315]/95 backdrop-blur-xl border border-[#303338] rounded-2xl sm:rounded-3xl p-3 sm:p-4 shadow-[0_8px_32px_rgba(0,0,0,0.7)]">
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 sm:gap-4 w-full min-w-0">
        
        {/* Category Filter Pills (Horizontal scroll on mobile with zero page overflow) */}
        <div 
          className="w-full min-w-0 overflow-x-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden touch-pan-x py-0.5"
          role="tablist"
          aria-label="Filter activities by category"
        >
          <div className="flex items-center gap-1.5 sm:gap-2 flex-nowrap w-max">
            {categories.map((cat) => {
              const isActive = selectedCategory === cat;
              return (
                <button
                  key={cat}
                  role="tab"
                  aria-selected={isActive}
                  onClick={() => onSelectCategory(cat)}
                  className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-full text-xs sm:text-[13px] font-medium transition-all duration-200 shrink-0 border cursor-pointer select-none ${
                    isActive
                      ? "bg-white text-[#08090A] border-white font-semibold shadow-[0_2px_12px_rgba(255,255,255,0.12)]"
                      : "bg-[#17191C] hover:bg-[#202327] text-[#B5B8BC] hover:text-[#F5F5F3] border-[#303338] hover:border-[#555a62]"
                  }`}
                >
                  {cat}
                </button>
              );
            })}
          </div>
        </div>

        {/* Right Controls: Search Field & Sort Dropdown */}
        <div className="flex flex-col xs:flex-row items-stretch xs:items-center gap-2 sm:gap-3 w-full lg:w-auto shrink-0">
          {/* Search Field */}
          <div className="relative flex-1 sm:w-64 min-w-0">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#858A91] pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search activities..."
              className="w-full bg-[#17191C] border border-[#303338] rounded-xl pl-9 pr-8 py-2 text-xs text-[#F5F5F3] placeholder:text-[#858A91] focus:outline-none focus:border-white focus:ring-1 focus:ring-white transition"
            />
            {searchQuery && (
              <button
                onClick={() => onSearchChange("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#858A91] hover:text-white"
                aria-label="Clear search"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Sort Order Control */}
          <button
            onClick={() => onSortChange(sortOrder === "newest" ? "oldest" : "newest")}
            className="flex items-center justify-between xs:justify-center gap-2 bg-[#17191C] border border-[#303338] hover:border-[#555a62] text-[#F5F5F3] px-3.5 py-2 rounded-xl text-xs font-medium transition shrink-0 cursor-pointer"
            title="Toggle sort order"
          >
            <div className="flex items-center gap-2">
              <Calendar className="w-3.5 h-3.5 text-[#B5B8BC]" />
              <span>{sortOrder === "newest" ? "Newest First" : "Oldest First"}</span>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-[#858A91] ml-0.5" />
          </button>
        </div>

      </div>
    </div>
  );
}
