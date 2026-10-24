"use client";

import React, { useState, useEffect, useMemo } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  Calendar,
  Image as ImageIcon,
  Users,
  Plus,
  Edit2,
  Trash2,
  ArrowUp,
  ArrowDown,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  Loader2,
  X,
  Upload,
  Search,
} from "lucide-react";
import DashboardSidebar, { DashboardTab } from "@/components/dashboard/DashboardSidebar";
import DashboardTopBar from "@/components/dashboard/DashboardTopBar";
import AdminOverview from "@/components/dashboard/AdminOverview";
import ExecutiveOverview from "@/components/dashboard/ExecutiveOverview";
import ExecutiveAccountManagement from "@/components/dashboard/ExecutiveAccountManagement";
import ExecutiveActivityMonitor from "@/components/dashboard/ExecutiveActivityMonitor";
import ActivityFormModal from "@/components/dashboard/ActivityFormModal";
import GalleryFormModal from "@/components/dashboard/GalleryFormModal";
import MultiPhotoUploadModal from "@/components/dashboard/MultiPhotoUploadModal";
import TeamMemberFormModal from "@/components/dashboard/TeamMemberFormModal";
import CreateExecutiveModal from "@/components/dashboard/CreateExecutiveModal";

import {
  Activity,
  formatActivityDate,
} from "@/data/activities";
import {
  getStoredActivities,
  fetchActivities,
  saveActivity,
  deleteActivity,
  resetActivitiesToDefault,
} from "@/services/activityService";
import {
  GalleryPhoto,
} from "@/data/gallery";
import {
  getStoredGallery,
  fetchGalleryPhotos,
  saveGalleryPhoto,
  saveMultipleGalleryPhotos,
  deleteGalleryPhoto,
  reorderGallery,
  resetGalleryToDefault,
} from "@/services/galleryService";
import {
  TeamMember,
} from "@/data/team";
import {
  getStoredTeam,
  fetchTeam,
  saveTeamMember,
  deleteTeamMember,
  reorderTeam,
  resetTeamToDefault,
} from "@/services/teamService";
import { subscribeToRealtimeTable } from "@/lib/realtimeSync";

interface SessionUser {
  id?: string;
  email: string;
  role: "admin" | "executive";
  name: string;
  authProvider?: "supabase" | "local";
}

export default function DashboardPage() {
  const router = useRouter();

  // Auth & Session
  const [sessionUser, setSessionUser] = useState<SessionUser | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);

  // Active Tab
  const [activeTab, setActiveTab] = useState<DashboardTab>("overview");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Initialize active tab from query string if present (e.g. ?tab=activity)
  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const tabParam = params.get("tab") as DashboardTab | null;
      if (
        tabParam &&
        ["overview", "activities", "gallery", "team", "accounts", "activity"].includes(tabParam)
      ) {
        setActiveTab(tabParam);
      }
    }
  }, []);

  // Global & Per-tab Search
  const [searchQuery, setSearchQuery] = useState("");
  const [activitySearch, setActivitySearch] = useState("");
  const [gallerySearch, setGallerySearch] = useState("");
  const [teamSearch, setTeamSearch] = useState("");

  // Notifications / Feedback toast
  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  // Data States
  const [activities, setActivities] = useState<Activity[]>([]);
  const [gallery, setGallery] = useState<GalleryPhoto[]>([]);
  const [team, setTeam] = useState<TeamMember[]>([]);

  // Modals
  const [activityModalOpen, setActivityModalOpen] = useState(false);
  const [editingActivity, setEditingActivity] = useState<Activity | null>(null);

  const [galleryModalOpen, setGalleryModalOpen] = useState(false);
  const [editingPhoto, setEditingPhoto] = useState<GalleryPhoto | null>(null);
  const [isMultiUploadOpen, setIsMultiUploadOpen] = useState(false);

  const [teamModalOpen, setTeamModalOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<TeamMember | null>(null);

  const [isCreateExecutiveOpen, setIsCreateExecutiveOpen] = useState(false);

  const [deleteConfirm, setDeleteConfirm] = useState<{
    type: "activity" | "photo" | "member";
    id: string;
    title: string;
  } | null>(null);

  // Verify server session
  useEffect(() => {
    let isMounted = true;
    async function checkAuth() {
      try {
        const res = await fetch("/api/auth/session");
        if (res.ok) {
          const data = await res.json();
          if (isMounted) {
            if (data.authenticated && data.user) {
              setSessionUser(data.user);
            } else {
              router.push("/login");
            }
          }
        } else {
          if (isMounted) router.push("/login");
        }
      } catch (err) {
        console.error("Auth check failed:", err);
        if (isMounted) router.push("/login");
      } finally {
        if (isMounted) setIsAuthLoading(false);
      }
    }
    checkAuth();
    return () => {
      isMounted = false;
    };
  }, [router]);

  // Load content
  const refreshAllData = async () => {
    setActivities(getStoredActivities());
    setGallery(getStoredGallery());
    setTeam(getStoredTeam());

    try {
      const fresh = await fetchActivities();
      if (Array.isArray(fresh)) setActivities(fresh);
    } catch (err) {
      console.warn("Could not fetch remote activities in dashboard:", err);
    }

    try {
      const freshPhotos = await fetchGalleryPhotos();
      if (Array.isArray(freshPhotos)) setGallery(freshPhotos);
    } catch (err) {
      console.warn("Could not fetch remote gallery in dashboard:", err);
    }

    try {
      const freshTeam = await fetchTeam();
      if (Array.isArray(freshTeam)) setTeam(freshTeam);
    } catch (err) {
      console.warn("Could not fetch remote team in dashboard:", err);
    }
  };

  useEffect(() => {
    refreshAllData();

    // Subscribe to Realtime updates on Supabase tables
    const unsubActs = subscribeToRealtimeTable("activities", () => {
      fetchActivities().then((fresh) => Array.isArray(fresh) && setActivities(fresh));
    });
    const unsubGallery = subscribeToRealtimeTable("gallery_photos", () => {
      fetchGalleryPhotos().then((fresh) => Array.isArray(fresh) && setGallery(fresh));
    });
    const unsubTeam = subscribeToRealtimeTable("team_members", () => {
      fetchTeam().then((fresh) => Array.isArray(fresh) && setTeam(fresh));
    });

    return () => {
      unsubActs();
      unsubGallery();
      unsubTeam();
    };
  }, []);

  // Auto clear feedback toast
  useEffect(() => {
    if (feedback) {
      const timer = setTimeout(() => setFeedback(null), 4500);
      return () => clearTimeout(timer);
    }
  }, [feedback]);

  // Security guard: If Executive navigates to Admin-only tabs, redirect to overview
  useEffect(() => {
    if (sessionUser && sessionUser.role === "executive") {
      if (activeTab === "accounts" || activeTab === "activity") {
        setActiveTab("overview");
      }
    }
  }, [sessionUser, activeTab]);

  // Sign out
  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      router.push("/login");
    } catch (err) {
      console.error("Logout failed:", err);
    }
  };

  // Reset archive to official seeds
  const handleResetArchive = () => {
    if (
      confirm(
        "Are you sure you want to reset all data back to the official default club archive? This will clear test items."
      )
    ) {
      resetActivitiesToDefault();
      resetGalleryToDefault();
      resetTeamToDefault();
      refreshAllData();
      setFeedback({
        type: "success",
        message: "All sections reset to official default club archive.",
      });
    }
  };

  // --- ACTIVITIES HANDLERS ---
  const handleSaveActivity = async (item: Activity) => {
    const res = await saveActivity(item);
    if (res.success) {
      setFeedback({
        type: "success",
        message: `Activity "${item.title}" saved successfully.`,
      });
      setActivities(getStoredActivities());
      setActivityModalOpen(false);
      setEditingActivity(null);
    } else {
      setFeedback({
        type: "error",
        message: res.error || "Failed to save activity.",
      });
    }
  };

  const handleDeleteActivity = async (id: string) => {
    const res = await deleteActivity(id);
    if (res.success) {
      setFeedback({
        type: "success",
        message: "Activity removed successfully.",
      });
      setActivities(getStoredActivities());
      setDeleteConfirm(null);
    } else {
      setFeedback({
        type: "error",
        message: res.error || "Failed to delete activity.",
      });
    }
  };

  const handleTogglePublishActivity = async (act: Activity) => {
    const updated = { ...act, published: !act.published };
    await handleSaveActivity(updated);
  };

  // --- GALLERY HANDLERS ---
  const handleSavePhoto = async (photo: GalleryPhoto) => {
    const res = await saveGalleryPhoto(photo);
    if (res.success) {
      setFeedback({
        type: "success",
        message: `Photograph "${photo.title}" saved successfully.`,
      });
      setGallery(getStoredGallery());
      setGalleryModalOpen(false);
      setEditingPhoto(null);
    } else {
      setFeedback({
        type: "error",
        message: res.error || "Failed to save photograph.",
      });
    }
  };

  const handleDeletePhoto = async (id: string) => {
    const res = await deleteGalleryPhoto(id);
    if (res.success) {
      setFeedback({
        type: "success",
        message: "Photograph removed from gallery.",
      });
      setGallery(getStoredGallery());
      setDeleteConfirm(null);
    } else {
      setFeedback({
        type: "error",
        message: res.error || "Failed to delete photograph.",
      });
    }
  };

  const handleMovePhoto = async (index: number, direction: "up" | "down") => {
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= gallery.length) return;

    const updated = [...gallery];
    const [moved] = updated.splice(index, 1);
    updated.splice(targetIndex, 0, moved);

    const res = await reorderGallery(updated);
    if (res.success) {
      setGallery(updated);
      setFeedback({ type: "success", message: "Gallery ordering updated." });
    }
  };

  // --- TEAM HANDLERS ---
  const handleSaveMember = async (member: TeamMember) => {
    const res = await saveTeamMember(member);
    if (res.success) {
      setFeedback({
        type: "success",
        message: `Team member "${member.name}" saved successfully.`,
      });
      setTeam(getStoredTeam());
      setTeamModalOpen(false);
      setEditingMember(null);
    } else {
      setFeedback({
        type: "error",
        message: res.error || "Failed to save team member.",
      });
    }
  };

  const handleDeleteMember = async (id: string) => {
    const res = await deleteTeamMember(id);
    if (res.success) {
      setFeedback({
        type: "success",
        message: "Team member removed successfully.",
      });
      setTeam(getStoredTeam());
      setDeleteConfirm(null);
    } else {
      setFeedback({
        type: "error",
        message: res.error || "Failed to delete team member.",
      });
    }
  };

  const handleMoveMember = async (index: number, direction: "up" | "down") => {
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= team.length) return;

    const updated = [...team];
    const [moved] = updated.splice(index, 1);
    updated.splice(targetIndex, 0, moved);

    const res = await reorderTeam(updated);
    if (res.success) {
      setTeam(updated);
      setFeedback({ type: "success", message: "Team display ordering updated." });
    }
  };

  // Synced search queries
  const effectiveActivityQuery = activitySearch || searchQuery;
  const effectiveGalleryQuery = gallerySearch || searchQuery;
  const effectiveTeamQuery = teamSearch || searchQuery;

  // Filtered lists
  const filteredActivities = useMemo(() => {
    if (!effectiveActivityQuery.trim()) return activities;
    const q = effectiveActivityQuery.toLowerCase();
    return activities.filter(
      (a) =>
        a.title.toLowerCase().includes(q) ||
        a.category.toLowerCase().includes(q) ||
        a.venue.toLowerCase().includes(q) ||
        a.shortDescription.toLowerCase().includes(q)
    );
  }, [activities, effectiveActivityQuery]);

  const filteredGallery = useMemo(() => {
    if (!effectiveGalleryQuery.trim()) return gallery;
    const q = effectiveGalleryQuery.toLowerCase();
    return gallery.filter(
      (p) =>
        p.title.toLowerCase().includes(q) ||
        p.photographer.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q) ||
        p.caption.toLowerCase().includes(q)
    );
  }, [gallery, effectiveGalleryQuery]);

  const filteredTeam = useMemo(() => {
    if (!effectiveTeamQuery.trim()) return team;
    const q = effectiveTeamQuery.toLowerCase();
    return team.filter(
      (m) =>
        m.name.toLowerCase().includes(q) ||
        m.role.toLowerCase().includes(q) ||
        m.category.toLowerCase().includes(q) ||
        (m.department && m.department.toLowerCase().includes(q))
    );
  }, [team, effectiveTeamQuery]);

  if (isAuthLoading) {
    return (
      <div className="min-h-screen bg-[#060608] text-white flex flex-col items-center justify-center font-sans">
        <div className="w-10 h-10 rounded-2xl bg-white/[0.05] border border-white/15 flex items-center justify-center mb-4 shadow-[0_0_20px_rgba(255,255,255,0.08)]">
          <Loader2 className="w-5 h-5 animate-spin text-white" />
        </div>
        <p className="text-xs font-mono text-neutral-400">
          Verifying server session & permissions...
        </p>
      </div>
    );
  }

  if (!sessionUser) {
    return null; // Router redirecting to /login
  }

  const isAdmin = sessionUser.role === "admin";

  return (
    <div className="min-h-screen bg-[#060608] text-neutral-100 flex font-sans selection:bg-white selection:text-black">
      {/* 1. PERSISTENT / COLLAPSIBLE SIDEBAR */}
      <DashboardSidebar
        role={sessionUser.role}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        activitiesCount={activities.length}
        galleryCount={gallery.length}
        teamCount={team.length}
        isMobileOpen={isMobileMenuOpen}
        setIsMobileOpen={setIsMobileMenuOpen}
        onResetArchive={handleResetArchive}
      />

      {/* 2. MAIN APPLICATION CONTENT AREA */}
      <div className="flex-1 lg:pl-72 flex flex-col min-w-0 min-h-screen">
        {/* TOP BAR */}
        <DashboardTopBar
          user={sessionUser}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          onToggleMobileMenu={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          onLogout={handleLogout}
        />

        {/* WORKSPACE MAIN */}
        <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-8 py-6 sm:py-8 space-y-6">
          {/* Feedback Alert Toast */}
          {feedback && (
            <div
              role="status"
              className={`p-4 rounded-2xl border flex items-center justify-between gap-3 text-xs sm:text-sm shadow-xl transition-all duration-300 animate-in fade-in slide-in-from-top-2 ${
                feedback.type === "success"
                  ? "bg-white/[0.08] border-white/20 text-white shadow-[0_0_20px_rgba(255,255,255,0.1)]"
                  : "bg-white/[0.04] border-white/20 text-neutral-200"
              }`}
            >
              <div className="flex items-center gap-2.5">
                {feedback.type === "success" ? (
                  <CheckCircle2 className="w-4 h-4 text-white shrink-0" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-white shrink-0" />
                )}
                <span>{feedback.message}</span>
              </div>
              <button
                onClick={() => setFeedback(null)}
                className="text-current opacity-70 hover:opacity-100 p-1 cursor-pointer"
                aria-label="Dismiss feedback"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* ============================================================== */}
          {/* TAB 0: DASHBOARD OVERVIEW (ROLE-SPECIFIC PANELS)               */}
          {/* ============================================================== */}
          {activeTab === "overview" && (
            isAdmin ? (
              <AdminOverview
                user={sessionUser}
                activities={activities}
                gallery={gallery}
                team={team}
                onNavigateTab={setActiveTab}
                onOpenCreateActivity={() => {
                  setEditingActivity(null);
                  setActivityModalOpen(true);
                }}
                onOpenUploadPhoto={() => setIsMultiUploadOpen(true)}
                onOpenAddTeamMember={() => {
                  setEditingMember(null);
                  setTeamModalOpen(true);
                }}
                onOpenProvisionExecutive={() => setIsCreateExecutiveOpen(true)}
                onLogout={handleLogout}
              />
            ) : (
              <ExecutiveOverview
                user={sessionUser}
                activities={activities}
                gallery={gallery}
                team={team}
                onNavigateTab={setActiveTab}
                onOpenCreateActivity={() => {
                  setEditingActivity(null);
                  setActivityModalOpen(true);
                }}
                onOpenUploadPhoto={() => setIsMultiUploadOpen(true)}
                onOpenAddTeamMember={() => {
                  setEditingMember(null);
                  setTeamModalOpen(true);
                }}
                onLogout={handleLogout}
              />
            )
          )}

          {/* ============================================================== */}
          {/* TAB 1: ACTIVITIES & EVENTS MANAGEMENT                          */}
          {/* ============================================================== */}
          {activeTab === "activities" && (
            <div className="space-y-5 animate-fade-in pb-12">
              {/* Header & Action Bar */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 p-5 sm:p-6 rounded-2xl bg-[#101014] border border-white/10 shadow-[0_10px_30px_rgba(0,0,0,0.5)] relative overflow-hidden">
                <div className="absolute top-0 right-0 w-80 h-40 bg-radial from-white/[0.05] via-transparent to-transparent pointer-events-none" />
                <div className="space-y-1 relative z-10">
                  <div className="flex items-center gap-2">
                    <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">
                      Activities & Events Management
                    </h2>
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-semibold bg-white/[0.08] text-white border border-white/20">
                      {activities.length} Total
                    </span>
                  </div>
                  <p className="text-xs text-neutral-400 max-w-xl">
                    Create photo walks, exhibitions, and campus workshops. Toggle visibility and registration links.
                  </p>
                </div>

                <button
                  onClick={() => {
                    setEditingActivity(null);
                    setActivityModalOpen(true);
                  }}
                  className="inline-flex items-center justify-center gap-2 bg-white text-black hover:bg-neutral-200 font-semibold px-4 py-2.5 rounded-xl text-xs sm:text-sm transition-all cursor-pointer shadow-[0_0_20px_rgba(255,255,255,0.2)] hover:shadow-[0_0_25px_rgba(255,255,255,0.35)] shrink-0 relative z-10"
                >
                  <Plus className="w-4 h-4" />
                  <span>Create Activity</span>
                </button>
              </div>

              {/* Search Bar */}
              <div className="flex items-center justify-between gap-3">
                <div className="relative flex-1 max-w-md">
                  <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-500" />
                  <input
                    type="text"
                    placeholder="Filter activities by title, category, venue..."
                    value={activitySearch}
                    onChange={(e) => setActivitySearch(e.target.value)}
                    className="w-full bg-[#0a0a0e] border border-white/15 text-xs sm:text-sm rounded-xl pl-9 pr-3 py-2 text-white placeholder-neutral-500 focus:outline-none focus:border-white focus:ring-1 focus:ring-white/30 transition-all"
                  />
                </div>
                <span className="text-xs font-mono text-neutral-400">
                  Showing {filteredActivities.length} of {activities.length}
                </span>
              </div>

              {/* Activities Table */}
              <div className="border border-white/10 rounded-2xl bg-[#101014] overflow-hidden shadow-2xl">
                <div className="overflow-x-auto dashboard-scrollbar">
                  <table className="w-full text-left text-xs sm:text-sm border-collapse">
                    <thead>
                      <tr className="border-b border-white/10 bg-[#0c0c10] text-neutral-400 text-[11px] font-mono uppercase tracking-wider">
                        <th className="py-3.5 px-4 font-semibold">Activity</th>
                        <th className="py-3.5 px-4 font-semibold">Category</th>
                        <th className="py-3.5 px-4 font-semibold">Date & Time</th>
                        <th className="py-3.5 px-4 font-semibold">Venue</th>
                        <th className="py-3.5 px-4 font-semibold">Status</th>
                        <th className="py-3.5 px-4 font-semibold">Visibility</th>
                        <th className="py-3.5 px-4 font-semibold text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {filteredActivities.length === 0 ? (
                        <tr>
                          <td
                            colSpan={7}
                            className="py-12 text-center text-xs text-neutral-400"
                          >
                            No activities found matching your search.
                          </td>
                        </tr>
                      ) : (
                        filteredActivities.map((act) => (
                          <tr
                            key={act.id}
                            className="hover:bg-white/[0.03] transition-colors group"
                          >
                            <td className="py-3.5 px-4">
                              <div className="flex items-center gap-3">
                                <div className="relative w-12 h-12 rounded-xl bg-black/60 border border-white/15 overflow-hidden shrink-0 flex items-center justify-center">
                                  {act.coverImage ? (
                                    <Image
                                      src={act.coverImage}
                                      alt={act.title}
                                      fill
                                      sizes="48px"
                                      className="object-cover"
                                    />
                                  ) : (
                                    <Calendar className="w-5 h-5 text-neutral-600" />
                                  )}
                                </div>
                                <div className="min-w-0">
                                  <p className="font-semibold text-white truncate max-w-xs">
                                    {act.title}
                                  </p>
                                  <p className="text-[11px] text-neutral-400 truncate max-w-xs">
                                    {act.shortDescription}
                                  </p>
                                </div>
                              </div>
                            </td>
                            <td className="py-3.5 px-4 whitespace-nowrap">
                              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono bg-white/[0.05] border border-white/10 text-neutral-300">
                                {act.category}
                              </span>
                            </td>
                            <td className="py-3.5 px-4 whitespace-nowrap text-neutral-300 font-mono text-[11px]">
                              <div>{formatActivityDate(act.startDate)}</div>
                              {act.time && (
                                <div className="text-[10px] text-neutral-500">
                                  {act.time}
                                </div>
                              )}
                            </td>
                            <td className="py-3.5 px-4 text-neutral-400 text-xs truncate max-w-[140px]">
                              {act.venue}
                            </td>
                            <td className="py-3.5 px-4 whitespace-nowrap">
                              <span
                                className={`px-2 py-0.5 rounded-md text-[10px] font-mono uppercase tracking-wider font-semibold ${
                                  act.status === "upcoming"
                                    ? "bg-white/[0.08] text-white border border-white/20"
                                    : act.status === "ongoing"
                                    ? "bg-white text-black font-bold shadow-[0_0_10px_rgba(255,255,255,0.4)]"
                                    : "bg-white/[0.03] text-neutral-400 border border-white/10"
                                }`}
                              >
                                {act.status}
                              </span>
                            </td>
                            <td className="py-3.5 px-4 whitespace-nowrap">
                              <button
                                onClick={() => handleTogglePublishActivity(act)}
                                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-mono uppercase font-semibold transition-colors cursor-pointer border ${
                                  act.published
                                    ? "bg-white/[0.08] text-white border-white/25 hover:bg-white/[0.14]"
                                    : "bg-white/[0.03] text-neutral-500 border-white/10 hover:text-neutral-300"
                                }`}
                                title={act.published ? "Click to set Draft" : "Click to Publish"}
                              >
                                {act.published ? (
                                  <>
                                    <Eye className="w-3 h-3 text-white" />
                                    <span>Public</span>
                                  </>
                                ) : (
                                  <>
                                    <EyeOff className="w-3 h-3 text-neutral-500" />
                                    <span>Draft</span>
                                  </>
                                )}
                              </button>
                            </td>
                            <td className="py-3.5 px-4 whitespace-nowrap text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                <button
                                  onClick={() => {
                                    setEditingActivity(act);
                                    setActivityModalOpen(true);
                                  }}
                                  className="p-1.5 rounded-lg border border-white/10 hover:border-white/30 text-neutral-400 hover:text-white bg-white/[0.04] hover:bg-white/[0.08] transition-colors cursor-pointer"
                                  title="Edit activity"
                                >
                                  <Edit2 className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() =>
                                    setDeleteConfirm({
                                      type: "activity",
                                      id: act.id,
                                      title: act.title,
                                    })
                                  }
                                  className="p-1.5 rounded-lg border border-white/15 hover:border-white/35 text-neutral-400 hover:text-white bg-white/[0.04] hover:bg-white/[0.1] transition-colors cursor-pointer"
                                  title="Delete activity"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ============================================================== */}
          {/* TAB 2: GALLERY ARCHIVE MANAGEMENT                             */}
          {/* ============================================================== */}
          {activeTab === "gallery" && (
            <div className="space-y-5 animate-fade-in pb-12">
              {/* Header & Action Bar */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 p-5 sm:p-6 rounded-2xl bg-[#101014] border border-white/10 shadow-[0_10px_30px_rgba(0,0,0,0.5)] relative overflow-hidden">
                <div className="absolute top-0 right-0 w-80 h-40 bg-radial from-white/[0.05] via-transparent to-transparent pointer-events-none" />
                <div className="space-y-1 relative z-10">
                  <div className="flex items-center gap-2">
                    <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">
                      Gallery Archive Management
                    </h2>
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-semibold bg-white/[0.08] text-white border border-white/20">
                      {gallery.length} Photographs
                    </span>
                  </div>
                  <p className="text-xs text-neutral-400 max-w-xl">
                    Curate campus photography, upload batch media to Supabase Storage, and reorder homepage showcases.
                  </p>
                </div>

                <div className="flex items-center gap-2.5 shrink-0 relative z-10">
                  <button
                    onClick={() => setIsMultiUploadOpen(true)}
                    className="inline-flex items-center justify-center gap-1.5 bg-white/[0.05] hover:bg-white/[0.1] text-white border border-white/15 hover:border-white/30 px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-medium transition-colors cursor-pointer"
                  >
                    <Upload className="w-3.5 h-3.5 text-white" />
                    <span>Batch Upload</span>
                  </button>

                  <button
                    onClick={() => {
                      setEditingPhoto(null);
                      setGalleryModalOpen(true);
                    }}
                    className="inline-flex items-center justify-center gap-2 bg-white text-black hover:bg-neutral-200 font-semibold px-4 py-2.5 rounded-xl text-xs sm:text-sm transition-all cursor-pointer shadow-[0_0_20px_rgba(255,255,255,0.2)] hover:shadow-[0_0_25px_rgba(255,255,255,0.35)]"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Add Photograph</span>
                  </button>
                </div>
              </div>

              {/* Search Bar */}
              <div className="flex items-center justify-between gap-3">
                <div className="relative flex-1 max-w-md">
                  <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-500" />
                  <input
                    type="text"
                    placeholder="Filter gallery by title, photographer, category..."
                    value={gallerySearch}
                    onChange={(e) => setGallerySearch(e.target.value)}
                    className="w-full bg-[#0a0a0e] border border-white/15 text-xs sm:text-sm rounded-xl pl-9 pr-3 py-2 text-white placeholder-neutral-500 focus:outline-none focus:border-white focus:ring-1 focus:ring-white/30 transition-all"
                  />
                </div>
                <span className="text-xs font-mono text-neutral-400">
                  Showing {filteredGallery.length} of {gallery.length}
                </span>
              </div>

              {/* Gallery Grid Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {filteredGallery.length === 0 ? (
                  <div className="col-span-full py-16 text-center text-xs text-neutral-400 border border-white/10 rounded-2xl bg-[#101014]">
                    No photographs found matching your search.
                  </div>
                ) : (
                  filteredGallery.map((photo, idx) => (
                    <div
                      key={photo.id}
                      className="group border border-white/10 hover:border-white/30 rounded-2xl bg-[#101014] overflow-hidden flex flex-col justify-between transition-all shadow-xl hover:shadow-[0_10px_30px_rgba(255,255,255,0.05)]"
                    >
                      {/* Image Preview */}
                      <div className="relative aspect-[4/3] bg-black/60 overflow-hidden">
                        <Image
                          src={photo.imageSrc}
                          alt={photo.alt || photo.title}
                          fill
                          sizes="(max-width: 640px) 100vw, 300px"
                          className="object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                        <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-black/80 backdrop-blur-md text-white border border-white/20 uppercase">
                            {photo.category}
                          </span>
                        </div>
                        <div className="absolute top-2.5 right-2.5 flex items-center gap-1 bg-black/80 backdrop-blur-md px-2 py-0.5 rounded-md border border-white/20 text-[10px] font-mono text-neutral-300">
                          <span>#{idx + 1}</span>
                        </div>
                      </div>

                      {/* Metadata Details */}
                      <div className="p-4 space-y-2.5 flex-1 flex flex-col justify-between">
                        <div>
                          <h3 className="font-semibold text-white text-sm truncate">
                            {photo.title}
                          </h3>
                          <p className="text-[11px] text-neutral-400 truncate mt-0.5">
                            by <strong className="text-white font-medium">{photo.photographer}</strong>
                          </p>
                          <p className="text-xs text-neutral-500 line-clamp-2 mt-1.5 leading-relaxed">
                            {photo.caption}
                          </p>
                        </div>

                        {/* Card Actions */}
                        <div className="pt-3 border-t border-white/10 flex items-center justify-between text-xs">
                          {/* Reorder Buttons */}
                          <div className="flex items-center gap-1">
                            <button
                              disabled={idx === 0}
                              onClick={() => handleMovePhoto(idx, "up")}
                              className="p-1.5 rounded-lg border border-white/10 disabled:opacity-20 disabled:cursor-not-allowed hover:border-white text-neutral-400 hover:text-white transition-colors cursor-pointer bg-white/[0.03]"
                              title="Move photo earlier"
                            >
                              <ArrowUp className="w-3 h-3" />
                            </button>
                            <button
                              disabled={idx === gallery.length - 1}
                              onClick={() => handleMovePhoto(idx, "down")}
                              className="p-1.5 rounded-lg border border-white/10 disabled:opacity-20 disabled:cursor-not-allowed hover:border-white text-neutral-400 hover:text-white transition-colors cursor-pointer bg-white/[0.03]"
                              title="Move photo later"
                            >
                              <ArrowDown className="w-3 h-3" />
                            </button>
                          </div>

                          {/* Edit & Delete */}
                          <div className="flex items-center gap-1.5">
                            <button
                              onClick={() => {
                                setEditingPhoto(photo);
                                setGalleryModalOpen(true);
                              }}
                              className="p-1.5 rounded-lg border border-white/10 hover:border-white/30 text-neutral-400 hover:text-white bg-white/[0.04] hover:bg-white/[0.08] transition-colors cursor-pointer"
                              title="Edit photo details"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() =>
                                setDeleteConfirm({
                                  type: "photo",
                                  id: photo.id,
                                  title: photo.title,
                                })
                              }
                              className="p-1.5 rounded-lg border border-white/15 hover:border-white/35 text-neutral-400 hover:text-white bg-white/[0.04] hover:bg-white/[0.1] transition-colors cursor-pointer"
                              title="Remove photograph"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* ============================================================== */}
          {/* TAB 3: TEAM MEMBERS MANAGEMENT                                */}
          {/* ============================================================== */}
          {activeTab === "team" && (
            <div className="space-y-5 animate-fade-in pb-12">
              {/* Header & Action Bar */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 p-5 sm:p-6 rounded-2xl bg-[#101014] border border-white/10 shadow-[0_10px_30px_rgba(0,0,0,0.5)] relative overflow-hidden">
                <div className="absolute top-0 right-0 w-80 h-40 bg-radial from-white/[0.05] via-transparent to-transparent pointer-events-none" />
                <div className="space-y-1 relative z-10">
                  <div className="flex items-center gap-2">
                    <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">
                      People Behind ShutterScape
                    </h2>
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-semibold bg-white/[0.08] text-white border border-white/20">
                      {team.length} Members
                    </span>
                  </div>
                  <p className="text-xs text-neutral-400 max-w-xl">
                    Manage official club committee members, faculty coordinators, and leadership designations.
                  </p>
                </div>

                <button
                  onClick={() => {
                    setEditingMember(null);
                    setTeamModalOpen(true);
                  }}
                  className="inline-flex items-center justify-center gap-2 bg-white text-black hover:bg-neutral-200 font-semibold px-4 py-2.5 rounded-xl text-xs sm:text-sm transition-all cursor-pointer shadow-[0_0_20px_rgba(255,255,255,0.2)] hover:shadow-[0_0_25px_rgba(255,255,255,0.35)] shrink-0 relative z-10"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Member</span>
                </button>
              </div>

              {/* Search Bar */}
              <div className="flex items-center justify-between gap-3">
                <div className="relative flex-1 max-w-md">
                  <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-500" />
                  <input
                    type="text"
                    placeholder="Filter team by name, role, department..."
                    value={teamSearch}
                    onChange={(e) => setTeamSearch(e.target.value)}
                    className="w-full bg-[#0a0a0e] border border-white/15 text-xs sm:text-sm rounded-xl pl-9 pr-3 py-2 text-white placeholder-neutral-500 focus:outline-none focus:border-white focus:ring-1 focus:ring-white/30 transition-all"
                  />
                </div>
                <span className="text-xs font-mono text-neutral-400">
                  Showing {filteredTeam.length} of {team.length}
                </span>
              </div>

              {/* Team Table */}
              <div className="border border-white/10 rounded-2xl bg-[#101014] overflow-hidden shadow-2xl">
                <div className="overflow-x-auto dashboard-scrollbar">
                  <table className="w-full text-left text-xs sm:text-sm border-collapse">
                    <thead>
                      <tr className="border-b border-white/10 bg-[#0c0c10] text-neutral-400 text-[11px] font-mono uppercase tracking-wider">
                        <th className="py-3.5 px-4 font-semibold">Order</th>
                        <th className="py-3.5 px-4 font-semibold">Member</th>
                        <th className="py-3.5 px-4 font-semibold">Category</th>
                        <th className="py-3.5 px-4 font-semibold">Role / Designation</th>
                        <th className="py-3.5 px-4 font-semibold">Department</th>
                        <th className="py-3.5 px-4 font-semibold text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {filteredTeam.length === 0 ? (
                        <tr>
                          <td
                            colSpan={6}
                            className="py-12 text-center text-xs text-neutral-400"
                          >
                            No team members found matching your search.
                          </td>
                        </tr>
                      ) : (
                        filteredTeam.map((member, idx) => (
                          <tr
                            key={member.id}
                            className="hover:bg-white/[0.03] transition-colors group"
                          >
                            <td className="py-3.5 px-4 whitespace-nowrap">
                              <div className="flex items-center gap-1 font-mono text-xs text-neutral-400">
                                <span className="w-5 text-right font-bold text-white">
                                  {idx + 1}
                                </span>
                                <div className="flex flex-col ml-1">
                                  <button
                                    disabled={idx === 0}
                                    onClick={() => handleMoveMember(idx, "up")}
                                    className="p-0.5 hover:text-white disabled:opacity-20 cursor-pointer text-neutral-400"
                                    title="Move member up"
                                  >
                                    <ArrowUp className="w-3 h-3" />
                                  </button>
                                  <button
                                    disabled={idx === team.length - 1}
                                    onClick={() => handleMoveMember(idx, "down")}
                                    className="p-0.5 hover:text-white disabled:opacity-20 cursor-pointer text-neutral-400"
                                    title="Move member down"
                                  >
                                    <ArrowDown className="w-3 h-3" />
                                  </button>
                                </div>
                              </div>
                            </td>
                            <td className="py-3.5 px-4">
                              <div className="flex items-center gap-3">
                                <div className="relative w-11 h-11 rounded-xl bg-black/60 border border-white/15 overflow-hidden shrink-0 flex items-center justify-center">
                                  {member.photoUrl ? (
                                    <Image
                                      src={member.photoUrl}
                                      alt={member.name}
                                      fill
                                      sizes="44px"
                                      className="object-cover"
                                      style={{
                                        objectPosition:
                                          member.objectPosition || "center 25%",
                                      }}
                                    />
                                  ) : (
                                    <span className="text-xs font-mono font-bold text-white">
                                      {member.initials}
                                    </span>
                                  )}
                                </div>
                                <div>
                                  <p className="font-semibold text-white">
                                    {member.name}
                                  </p>
                                  <p className="text-[10px] font-mono text-neutral-500">
                                    ID: {member.id}
                                  </p>
                                </div>
                              </div>
                            </td>
                            <td className="py-3.5 px-4 whitespace-nowrap">
                              <span
                                className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono uppercase tracking-wider font-semibold ${
                                  member.category === "Faculty"
                                    ? "bg-white/[0.1] text-white border border-white/25"
                                    : member.category === "Leadership"
                                    ? "bg-white/[0.07] text-neutral-200 border border-white/20"
                                    : "bg-white/[0.04] text-neutral-400 border border-white/10"
                                }`}
                              >
                                {member.category}
                              </span>
                            </td>
                            <td className="py-3.5 px-4 whitespace-nowrap font-medium text-white">
                              {member.role}
                            </td>
                            <td className="py-3.5 px-4 text-neutral-400 text-xs">
                              {member.department || "—"}
                            </td>
                            <td className="py-3.5 px-4 whitespace-nowrap text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                <button
                                  onClick={() => {
                                    setEditingMember(member);
                                    setTeamModalOpen(true);
                                  }}
                                  className="p-1.5 rounded-lg border border-white/10 hover:border-white/30 text-neutral-400 hover:text-white bg-white/[0.04] hover:bg-white/[0.08] transition-colors cursor-pointer"
                                  title="Edit member profile"
                                >
                                  <Edit2 className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() =>
                                    setDeleteConfirm({
                                      type: "member",
                                      id: member.id,
                                      title: member.name,
                                    })
                                  }
                                  className="p-1.5 rounded-lg border border-white/15 hover:border-white/35 text-neutral-400 hover:text-white bg-white/[0.04] hover:bg-white/[0.1] transition-colors cursor-pointer"
                                  title="Remove team member"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ============================================================== */}
          {/* TAB 4: EXECUTIVE ACCOUNTS (ADMIN ONLY)                          */}
          {/* ============================================================== */}
          {activeTab === "accounts" && isAdmin && (
            <div className="animate-fade-in pb-12">
              <ExecutiveAccountManagement
                currentAdminEmail={sessionUser.email}
                onNotify={(type, message) => setFeedback({ type, message })}
              />
            </div>
          )}

          {/* ============================================================== */}
          {/* TAB 5: EXECUTIVE ACTIVITY MONITOR (ADMIN ONLY)                 */}
          {/* ============================================================== */}
          {activeTab === "activity" && isAdmin && (
            <div className="animate-fade-in pb-12">
              <ExecutiveActivityMonitor
                onNotify={(type, message) => setFeedback({ type, message })}
              />
            </div>
          )}
        </main>
      </div>

      {/* ============================================================== */}
      {/* MODALS                                                         */}
      {/* ============================================================== */}
      {activityModalOpen && (
        <ActivityFormModal
          activity={editingActivity}
          onClose={() => {
            setActivityModalOpen(false);
            setEditingActivity(null);
          }}
          onSave={handleSaveActivity}
        />
      )}

      {galleryModalOpen && (
        <GalleryFormModal
          photo={editingPhoto}
          onClose={() => {
            setGalleryModalOpen(false);
            setEditingPhoto(null);
          }}
          onSave={handleSavePhoto}
        />
      )}

      {isMultiUploadOpen && (
        <MultiPhotoUploadModal
          onClose={() => setIsMultiUploadOpen(false)}
          onUploadSuccess={(photos) => {
            saveMultipleGalleryPhotos(photos);
            setGallery(getStoredGallery());
            setIsMultiUploadOpen(false);
            setFeedback({
              type: "success",
              message: `${photos.length} photograph(s) uploaded into gallery.`,
            });
          }}
        />
      )}

      {teamModalOpen && (
        <TeamMemberFormModal
          member={editingMember}
          onClose={() => {
            setTeamModalOpen(false);
            setEditingMember(null);
          }}
          onSave={handleSaveMember}
        />
      )}

      {isCreateExecutiveOpen && isAdmin && (
        <CreateExecutiveModal
          isOpen={isCreateExecutiveOpen}
          onClose={() => setIsCreateExecutiveOpen(false)}
          onSuccess={(member, msg) => {
            setIsCreateExecutiveOpen(false);
            setFeedback({ type: "success", message: msg });
          }}
        />
      )}

      {/* CONFIRMATION MODAL: DELETION */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in">
          <div className="w-full max-w-md bg-[#101014] border border-white/15 rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-white">
              <div className="p-2.5 rounded-full bg-white/[0.08] border border-white/20 text-white shadow-[0_0_12px_rgba(255,255,255,0.15)]">
                <Trash2 className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-white">Confirm Removal</h3>
            </div>
            <p className="text-xs sm:text-sm text-neutral-300 leading-relaxed">
              Are you sure you want to remove{" "}
              <strong className="text-white font-semibold">
                &ldquo;{deleteConfirm.title}&rdquo;
              </strong>
              ? This action will immediately remove the content from the website.
            </p>
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/10">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="px-4 py-2.5 rounded-xl text-xs sm:text-sm font-medium border border-white/15 hover:border-white/30 text-neutral-300 hover:text-white bg-white/[0.03] transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (deleteConfirm.type === "activity") {
                    handleDeleteActivity(deleteConfirm.id);
                  } else if (deleteConfirm.type === "photo") {
                    handleDeletePhoto(deleteConfirm.id);
                  } else if (deleteConfirm.type === "member") {
                    handleDeleteMember(deleteConfirm.id);
                  }
                }}
                className="px-5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold bg-white text-black hover:bg-neutral-200 transition-all cursor-pointer shadow-[0_0_20px_rgba(255,255,255,0.25)]"
              >
                Delete Content
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
