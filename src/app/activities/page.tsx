"use client";

import React, { useState, useMemo, useEffect, useCallback } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import JoinModal from "@/components/JoinModal";
import SearchModal from "@/components/SearchModal";
import ActivitiesHero from "@/components/activities/ActivitiesHero";
import ActivityToolbar from "@/components/activities/ActivityToolbar";
import UpcomingSection from "@/components/activities/UpcomingSection";
import PastActivitiesTimeline from "@/components/activities/PastActivitiesTimeline";
import ActivityDetailModal from "@/components/activities/ActivityDetailModal";
import {
  Activity,
  ActivityCategory,
} from "@/data/activities";
import {
  getStoredActivities,
  fetchActivities,
  subscribeActivities,
} from "@/services/activityService";
import { subscribeToRealtimeTable } from "@/lib/realtimeSync";

export default function ActivitiesPage() {
  const [activitiesList, setActivitiesList] = useState<Activity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] =
    useState<ActivityCategory>("All Activities");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortOrder, setSortOrder] = useState<"newest" | "oldest">("newest");
  const [selectedActivity, setSelectedActivity] = useState<Activity | null>(null);
  const [isJoinModalOpen, setIsJoinModalOpen] = useState(false);
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);

  const [clientToday, setClientToday] = useState<number | null>(null);

  const loadActivitiesData = useCallback(async () => {
    try {
      setIsLoading(true);
      setLoadError(null);
      const fresh = await fetchActivities();
      if (Array.isArray(fresh)) {
        setActivitiesList(fresh);
      }
    } catch (err) {
      console.error("Could not fetch activities from server:", err);
      setLoadError("Failed to load activities. Please check your network and try again.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Initialize from cache immediately, then fetch fresh data from backend
  useEffect(() => {
    // Set client today start-of-day timestamp on mount safely without breaking SSR prerendering
    setClientToday(new Date().setHours(0, 0, 0, 0));

    // 1. Instant cache load for immediate rendering without layout shift
    const cached = getStoredActivities();
    if (cached && cached.length > 0) {
      setActivitiesList(cached);
    }

    // 2. Fetch latest persisted activities from Supabase backend
    let isMounted = true;
    fetchActivities()
      .then((fresh) => {
        if (isMounted && Array.isArray(fresh)) {
          setActivitiesList(fresh);
          setIsLoading(false);
          setLoadError(null);
        }
      })
      .catch((err) => {
        if (isMounted) {
          console.warn("Could not fetch latest activities from server:", err);
          setIsLoading(false);
          setLoadError("Unable to fetch activities from server.");
        }
      });

    // 3. Listen to live Realtime database changes
    const unsubRealtime = subscribeToRealtimeTable("activities", () => {
      fetchActivities().then((fresh) => {
        if (isMounted && Array.isArray(fresh)) {
          setActivitiesList(fresh);
        }
      });
    });

    // 4. Listen to live updates from dashboard actions on the same browser
    const unsubscribe = subscribeActivities((updated) => {
      if (isMounted && Array.isArray(updated)) {
        setActivitiesList(updated);
      }
    });

    return () => {
      isMounted = false;
      unsubRealtime();
      unsubscribe();
    };
  }, []);

  // Filter and sort activities dynamically based on toolbar controls
  const { upcomingActivities, pastActivities } = useMemo(() => {
    // 1. Filter by category, search query, and publication status
    const filtered = activitiesList.filter((item) => {
      // Never display draft / unpublished activities on public page
      if (item.published === false) {
        return false;
      }

      // Category filter
      if (
        selectedCategory !== "All Activities" &&
        item.category !== selectedCategory
      ) {
        return false;
      }

      // Search query filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesTitle = (item.title || "").toLowerCase().includes(q);
        const matchesDesc =
          (item.shortDescription || "").toLowerCase().includes(q) ||
          (item.fullDescription || "").toLowerCase().includes(q);
        const matchesVenue = (item.venue || "").toLowerCase().includes(q);
        const matchesCategory = (item.category || "").toLowerCase().includes(q);
        if (!matchesTitle && !matchesDesc && !matchesVenue && !matchesCategory) {
          return false;
        }
      }

      return true;
    });

    // 2. Separate into Upcoming (including Ongoing) and Past
    const upcoming = filtered.filter((a) => {
      const st = (a.status || "").toLowerCase();
      return st === "upcoming" || st === "ongoing";
    });

    const past = filtered.filter((a) => {
      const st = (a.status || "").toLowerCase();
      return st === "past" || st === "completed" || st === "archived";
    });

    // Fallback categorization by date for any items with non-standard status
    const handledIds = new Set([
      ...upcoming.map((u) => u.id),
      ...past.map((p) => p.id),
    ]);
    if (clientToday !== null) {
      filtered.forEach((item) => {
        if (!handledIds.has(item.id)) {
          const itemDate = new Date(item.startDate).getTime();
          if (itemDate >= clientToday) {
            upcoming.push(item);
          } else {
            past.push(item);
          }
        }
      });
    } else {
      // During prerender / initial server render, avoid dynamic new Date()
      // Fallback deterministic classification
      filtered.forEach((item) => {
        if (!handledIds.has(item.id)) {
          upcoming.push(item);
        }
      });
    }

    // 3. Apply sort order
    const sortFn = (a: Activity, b: Activity) => {
      const dateA = new Date(a.startDate).getTime();
      const dateB = new Date(b.startDate).getTime();
      return sortOrder === "newest" ? dateB - dateA : dateA - dateB;
    };

    past.sort(sortFn);

    // For upcoming: prioritize featured upcoming at the top, then sort
    upcoming.sort((a, b) => {
      if (a.isFeaturedUpcoming && !b.isFeaturedUpcoming) return -1;
      if (!a.isFeaturedUpcoming && b.isFeaturedUpcoming) return 1;
      return sortFn(a, b);
    });

    return {
      upcomingActivities: upcoming,
      pastActivities: past,
    };
  }, [activitiesList, selectedCategory, searchQuery, sortOrder, clientToday]);

  return (
    <div className="min-h-screen bg-[#08090A] text-[#F5F5F3] flex flex-col font-sans selection:bg-white selection:text-[#08090A]">
      {/* Top Floating Navigation Header */}
      <Header
        activePage="activities"
        onOpenJoin={() => setIsJoinModalOpen(true)}
        onOpenSearch={() => setIsSearchModalOpen(true)}
      />

      {/* Main Content Area */}
      <main className="flex-1 w-full">
        {/* Activities Hero Section */}
        <ActivitiesHero />

        {/* Content Container */}
        <div className="max-w-7xl mx-auto px-4 sm:px-8 space-y-10 sm:space-y-14 -mt-4 sm:-mt-6 pb-16 sm:pb-24">
          
          {/* Error Banner with Retry */}
          {loadError && activitiesList.length === 0 && (
            <div className="w-full bg-[#1c1214] border border-red-500/40 rounded-2xl p-6 text-center space-y-3 shadow-lg">
              <p className="text-red-300 text-sm font-medium">{loadError}</p>
              <button
                type="button"
                onClick={() => loadActivitiesData()}
                className="px-4 py-2 bg-red-600/30 hover:bg-red-600/50 border border-red-500/50 text-white rounded-xl text-xs font-semibold transition"
              >
                Retry Loading Activities
              </button>
            </div>
          )}

          {/* Read-Only Activity Discovery Toolbar */}
          <ActivityToolbar
            selectedCategory={selectedCategory}
            onSelectCategory={setSelectedCategory}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            sortOrder={sortOrder}
            onSortChange={setSortOrder}
          />

          {/* Upcoming Opportunities Section (Read-Only) */}
          <section id="upcoming" className="space-y-4">
            <div className="flex items-center gap-3">
              <span className="w-1.5 h-6 bg-white rounded-full inline-block shadow-[0_0_8px_rgba(255,255,255,0.6)]" />
              <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-[#F5F5F3]">
                Coming Up at ShutterScape
              </h2>
            </div>
            <UpcomingSection
              upcomingActivities={upcomingActivities}
              onSelectActivity={setSelectedActivity}
            />
          </section>

          {/* Past Activities Chronological Timeline (Read-Only) */}
          <section id="past">
            <PastActivitiesTimeline
              pastActivities={pastActivities}
              onSelectActivity={setSelectedActivity}
            />
          </section>

        </div>
      </main>

      {/* Shared Compact Official Footer */}
      <Footer />

      {/* Modals & Dialogs (Read-Only) */}
      <ActivityDetailModal
        activity={selectedActivity}
        onClose={() => setSelectedActivity(null)}
      />
      <JoinModal
        isOpen={isJoinModalOpen}
        onClose={() => setIsJoinModalOpen(false)}
      />
      <SearchModal
        isOpen={isSearchModalOpen}
        onClose={() => setIsSearchModalOpen(false)}
      />
    </div>
  );
}
