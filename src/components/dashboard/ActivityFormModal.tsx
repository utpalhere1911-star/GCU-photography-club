"use client";

import React, { useState, useRef, useEffect } from "react";
import Image from "next/image";
import {
  Calendar,
  X,
  Upload,
  Loader2,
  Image as ImageIcon,
  Clock,
  MapPin,
  Tag,
  Plus,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import {
  Activity,
  ActivityCategory,
  ActivityStatus,
  RegistrationStatus,
} from "@/data/activities";

export interface ActivityModalProps {
  activity: Activity | null;
  onClose: () => void;
  onSave: (activity: Activity) => Promise<void>;
}

interface PendingEventPhoto {
  id: string;
  file: File;
  previewUrl: string;
  name: string;
  size: number;
}

export default function ActivityFormModal({
  activity,
  onClose,
  onSave,
}: ActivityModalProps) {
  const [title, setTitle] = useState(activity?.title || "");
  const [category, setCategory] = useState<Exclude<ActivityCategory, "All Activities">>(
    activity?.category || "Photo Walk"
  );
  const [shortDescription, setShortDescription] = useState(
    activity?.shortDescription || ""
  );
  const [fullDescription, setFullDescription] = useState(
    activity?.fullDescription || ""
  );
  const [coverImage, setCoverImage] = useState(activity?.coverImage || "");
  const [startDate, setStartDate] = useState(
    activity?.startDate
      ? activity.startDate.split("T")[0]
      : new Date().toISOString().split("T")[0]
  );
  const [time, setTime] = useState(activity?.time || "10:00 AM – 4:00 PM IST");
  const [venue, setVenue] = useState(activity?.venue || "GCU Campus, Azara");
  const [status, setStatus] = useState<ActivityStatus>(
    activity?.status || "upcoming"
  );
  const [registrationStatus, setRegistrationStatus] = useState<RegistrationStatus>(
    activity?.registrationStatus || "Registration Open"
  );
  const [registrationUrl, setRegistrationUrl] = useState(
    activity?.registrationUrl || ""
  );
  const [published, setPublished] = useState<boolean>(
    activity ? activity.published : true
  );
  const [isFeaturedUpcoming, setIsFeaturedUpcoming] = useState<boolean>(
    activity?.isFeaturedUpcoming || false
  );

  // Existing saved event photos
  const [existingEventPhotos, setExistingEventPhotos] = useState<string[]>(() => {
    if (!activity?.galleryImages) return [];
    // Separate cover from gallery if previous version mistakenly duplicated only the cover
    if (
      activity.galleryImages.length === 1 &&
      activity.galleryImages[0] === activity.coverImage
    ) {
      return [];
    }
    return activity.galleryImages;
  });

  // Pending unsaved event photos selected by user
  const [pendingEventPhotos, setPendingEventPhotos] = useState<PendingEventPhoto[]>([]);

  // Submission & loading states
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploadingCover, setIsUploadingCover] = useState(false);
  const [coverUploadError, setCoverUploadError] = useState<string | null>(null);

  const [isUploadingEventPhotos, setIsUploadingEventPhotos] = useState(false);
  const [eventUploadProgress, setEventUploadProgress] = useState<{
    current: number;
    total: number;
  } | null>(null);
  const [eventUploadError, setEventUploadError] = useState<string | null>(null);

  // Refs for file inputs
  const coverFileInputRef = useRef<HTMLInputElement>(null);
  const eventPhotosInputRef = useRef<HTMLInputElement>(null);

  // Clean up object URLs on unmount to avoid memory leaks
  useEffect(() => {
    return () => {
      pendingEventPhotos.forEach((p) => URL.revokeObjectURL(p.previewUrl));
    };
  }, [pendingEventPhotos]);

  // Synchronize when active activity prop changes
  const [prevActivity, setPrevActivity] = useState<Activity | null>(activity);
  if (activity !== prevActivity) {
    setPrevActivity(activity);
    if (activity) {
      setTitle(activity.title || "");
      setCategory(activity.category || "Photo Walk");
      setShortDescription(activity.shortDescription || "");
      setFullDescription(activity.fullDescription || "");
      setCoverImage(activity.coverImage || "");
      setStartDate(
        activity.startDate
          ? activity.startDate.split("T")[0]
          : new Date().toISOString().split("T")[0]
      );
      setTime(activity.time || "10:00 AM – 4:00 PM IST");
      setVenue(activity.venue || "GCU Campus, Azara");
      setStatus(activity.status || "upcoming");
      setRegistrationStatus(activity.registrationStatus || "Registration Open");
      setRegistrationUrl(activity.registrationUrl || "");
      setPublished(activity.published ?? true);
      setIsFeaturedUpcoming(Boolean(activity.isFeaturedUpcoming));
      // Filter out duplicate cover image fallback from previous versions
      const initialGallery =
        activity.galleryImages &&
        !(
          activity.galleryImages.length === 1 &&
          activity.galleryImages[0] === activity.coverImage
        )
          ? activity.galleryImages
          : [];
      setExistingEventPhotos(initialGallery);
      setPendingEventPhotos([]);
      setCoverUploadError(null);
      setEventUploadError(null);
    }
  }

  // Handle single Cover Image selection & upload
  const handleCoverFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setCoverUploadError("Only image files (JPEG, PNG, WebP, AVIF) are supported.");
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setCoverUploadError("Cover photo exceeds the maximum size limit of 10MB.");
      return;
    }

    setCoverUploadError(null);
    setIsUploadingCover(true);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("bucket", "event-posters");
      formData.append("folder", "activities/covers");

      const res = await fetch("/api/content/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json().catch(() => null);

      if (res.ok && data?.url) {
        setCoverImage(data.url);
      } else {
        const errorMsg = data?.error || `Upload failed with status ${res.status}`;
        setCoverUploadError(errorMsg);
      }
    } catch (err) {
      console.error("Cover image upload exception:", err);
      setCoverUploadError("Network error while uploading cover image. Please try again.");
    } finally {
      setIsUploadingCover(false);
      if (coverFileInputRef.current) {
        coverFileInputRef.current.value = "";
      }
    }
  };

  // Handle multiple Event Photos selection
  const handleEventPhotosChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const filesArray = Array.from(files);
    const validNewPhotos: PendingEventPhoto[] = [];
    let hasInvalidType = false;
    let hasOverSize = false;

    for (const file of filesArray) {
      if (!file.type.startsWith("image/")) {
        hasInvalidType = true;
        continue;
      }
      if (file.size > 10 * 1024 * 1024) {
        hasOverSize = true;
        continue;
      }

      validNewPhotos.push({
        id: `pending-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
        file,
        previewUrl: URL.createObjectURL(file),
        name: file.name,
        size: file.size,
      });
    }

    if (hasInvalidType) {
      setEventUploadError("Some files were skipped: Only images (JPEG, PNG, WebP, AVIF) are allowed.");
    } else if (hasOverSize) {
      setEventUploadError("Some files were skipped: Maximum allowed size per image is 10MB.");
    } else {
      setEventUploadError(null);
    }

    if (validNewPhotos.length > 0) {
      setPendingEventPhotos((prev) => [...prev, ...validNewPhotos]);
    }

    if (eventPhotosInputRef.current) {
      eventPhotosInputRef.current.value = "";
    }
  };

  // Remove a pending (unsaved) photo from selection
  const handleRemovePendingPhoto = (id: string) => {
    setPendingEventPhotos((prev) => {
      const target = prev.find((p) => p.id === id);
      if (target) {
        URL.revokeObjectURL(target.previewUrl);
      }
      return prev.filter((p) => p.id !== id);
    });
  };

  // Remove an existing saved event photo
  const handleRemoveExistingPhoto = (index: number) => {
    setExistingEventPhotos((prev) => prev.filter((_, idx) => idx !== index));
  };

  // Submit activity form
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || isSubmitting || isUploadingCover || isUploadingEventPhotos) return;

    if (!coverImage.trim()) {
      setCoverUploadError("Please upload or provide a cover photograph.");
      return;
    }

    setIsSubmitting(true);
    setEventUploadError(null);

    // 1. Upload pending event photos if any exist
    const uploadedEventUrls: string[] = [];

    if (pendingEventPhotos.length > 0) {
      setIsUploadingEventPhotos(true);
      setEventUploadProgress({ current: 0, total: pendingEventPhotos.length });

      for (let i = 0; i < pendingEventPhotos.length; i++) {
        const item = pendingEventPhotos[i];
        setEventUploadProgress({ current: i + 1, total: pendingEventPhotos.length });

        try {
          const formData = new FormData();
          formData.append("file", item.file);
          formData.append("bucket", "event-posters");
          formData.append("folder", "activities/highlights");

          const res = await fetch("/api/content/upload", {
            method: "POST",
            body: formData,
          });

          const data = await res.json().catch(() => null);

          if (res.ok && data?.url) {
            uploadedEventUrls.push(data.url);
          } else {
            console.error(`Failed to upload event photo "${item.name}":`, data?.error);
            setEventUploadError(
              `Upload failed for "${item.name}": ${data?.error || "Unknown server error"}. Remaining photos paused.`
            );
            setIsSubmitting(false);
            setIsUploadingEventPhotos(false);
            return;
          }
        } catch (uploadErr) {
          console.error("Event photo upload exception:", uploadErr);
          setEventUploadError(
            `Network error uploading "${item.name}". Please check connection and try again.`
          );
          setIsSubmitting(false);
          setIsUploadingEventPhotos(false);
          return;
        }
      }

      setIsUploadingEventPhotos(false);
      setEventUploadProgress(null);
    }

    // 2. Combine retained saved photos and newly uploaded event photos
    const finalGalleryImages = [...existingEventPhotos, ...uploadedEventUrls];

    const id =
      activity?.id ||
      title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "") +
        "-" +
        Date.now().toString().slice(-4);

    const year = parseInt(startDate.split("-")[0], 10) || new Date().getFullYear();
    const isUpcomingOrOngoing = status === "upcoming" || status === "ongoing";

    const payload: Activity = {
      id,
      title: title.trim(),
      category,
      shortDescription: shortDescription.trim(),
      fullDescription: fullDescription.trim(),
      coverImage: coverImage.trim(),
      galleryImages: finalGalleryImages,
      startDate,
      time: time.trim(),
      venue: venue.trim(),
      status,
      registrationStatus: isUpcomingOrOngoing ? registrationStatus : undefined,
      registrationUrl: isUpcomingOrOngoing ? registrationUrl.trim() || undefined : undefined,
      isFeaturedUpcoming: isUpcomingOrOngoing ? isFeaturedUpcoming : false,
      published,
      year,
    };

    try {
      await onSave(payload);
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="activity-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md overflow-y-auto"
    >
      <div className="w-full max-w-2xl bg-[#101014] border border-white/15 rounded-2xl shadow-2xl overflow-hidden my-auto flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-white/10 bg-[#0c0c10]/90 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-white/[0.08] text-white border border-white/20 shadow-[0_0_12px_rgba(255,255,255,0.15)]">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <h2 id="activity-modal-title" className="text-base sm:text-lg font-bold text-white tracking-tight">
                {activity ? "Edit Club Activity" : "Create Club Activity"}
              </h2>
              <p className="text-xs text-neutral-400">
                {activity ? "Update schedule, venue, cover, and event photography" : "Schedule a photography walk, workshop, or contest"}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-neutral-400 hover:text-white hover:bg-white/[0.08] transition-colors cursor-pointer"
            aria-label="Close dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-5 text-xs sm:text-sm overflow-y-auto dashboard-scrollbar">
          {/* Title */}
          <div className="space-y-1.5">
            <label className="font-semibold text-white">Activity Title *</label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. World Photography Day Exhibition 2026"
              className="w-full bg-[#0a0a0e] border border-white/15 rounded-xl px-3.5 py-2.5 text-white placeholder-neutral-500 focus:outline-none focus:border-white focus:ring-1 focus:ring-white/30 transition-all"
            />
          </div>

          {/* Category & Status */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div className="space-y-1.5">
              <label className="font-semibold text-neutral-300 flex items-center gap-1.5">
                <Tag className="w-3.5 h-3.5 text-white" />
                Category
              </label>
              <select
                value={category}
                onChange={(e) =>
                  setCategory(e.target.value as Exclude<ActivityCategory, "All Activities">)
                }
                className="w-full bg-[#0a0a0e] border border-white/15 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-white"
              >
                <option value="Photo Walk">Photo Walk</option>
                <option value="Workshop">Workshop</option>
                <option value="Exhibition">Exhibition</option>
                <option value="Challenge">Challenge</option>
                <option value="Event Coverage">Event Coverage</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="font-semibold text-neutral-300 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-white" />
                Event Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as ActivityStatus)}
                className="w-full bg-[#0a0a0e] border border-white/15 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-white"
              >
                <option value="upcoming">Upcoming</option>
                <option value="ongoing">Ongoing</option>
                <option value="past">Completed / Archive</option>
              </select>
            </div>
          </div>

          {/* Date, Time & Venue */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
            <div className="space-y-1.5">
              <label className="font-semibold text-neutral-300 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-white" />
                Start Date *
              </label>
              <input
                type="date"
                required
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full bg-[#0a0a0e] border border-white/15 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-white"
              />
            </div>

            <div className="space-y-1.5">
              <label className="font-semibold text-neutral-300 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-white" />
                Time Slot
              </label>
              <input
                type="text"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                placeholder="10:00 AM – 4:00 PM IST"
                className="w-full bg-[#0a0a0e] border border-white/15 rounded-xl px-3 py-2 text-white placeholder-neutral-500 focus:outline-none focus:border-white"
              />
            </div>

            <div className="space-y-1.5">
              <label className="font-semibold text-neutral-300 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-white" />
                Venue / Location
              </label>
              <input
                type="text"
                required
                value={venue}
                onChange={(e) => setVenue(e.target.value)}
                placeholder="GCU Campus, Azara"
                className="w-full bg-[#0a0a0e] border border-white/15 rounded-xl px-3 py-2 text-white placeholder-neutral-500 focus:outline-none focus:border-white"
              />
            </div>
          </div>

          {/* Short Summary */}
          <div className="space-y-1.5">
            <label className="font-semibold text-neutral-300">Short Summary *</label>
            <textarea
              rows={2}
              required
              value={shortDescription}
              onChange={(e) => setShortDescription(e.target.value)}
              placeholder="Brief summary displayed on activities list and preview cards..."
              className="w-full bg-[#0a0a0e] border border-white/15 rounded-xl px-3.5 py-2 text-white placeholder-neutral-500 focus:outline-none focus:border-white transition-all"
            />
          </div>

          {/* Full Description */}
          <div className="space-y-1.5">
            <label className="font-semibold text-neutral-300">Full Description</label>
            <textarea
              rows={3}
              value={fullDescription}
              onChange={(e) => setFullDescription(e.target.value)}
              placeholder="Detailed schedule, equipment recommendations, or overview..."
              className="w-full bg-[#0a0a0e] border border-white/15 rounded-xl px-3.5 py-2 text-white placeholder-neutral-500 focus:outline-none focus:border-white transition-all"
            />
          </div>

          {/* ============================================================== */}
          {/* SECTION 1: ACTIVITY COVER PHOTOGRAPH (SINGLE IMAGE)            */}
          {/* ============================================================== */}
          <div className="space-y-2.5 p-4 rounded-xl bg-[#0a0a0e] border border-white/10">
            <div className="flex items-center justify-between">
              <label className="font-semibold text-white flex items-center gap-1.5">
                <ImageIcon className="w-4 h-4 text-white" />
                Activity Cover Image *
              </label>
              <span className="text-[11px] text-neutral-400 font-mono">Primary Card Poster</span>
            </div>
            <p className="text-[11px] text-neutral-400">
              The primary banner image displayed on activity preview cards, timelines, and featured banners.
            </p>

            <div className="flex items-center gap-3 pt-1">
              <div className="relative w-16 h-16 rounded-xl bg-black/60 border border-white/15 overflow-hidden shrink-0 flex items-center justify-center">
                {coverImage ? (
                  <Image
                    src={coverImage}
                    alt="Cover preview"
                    fill
                    sizes="64px"
                    className="object-cover"
                    unoptimized={coverImage.startsWith("data:")}
                  />
                ) : (
                  <ImageIcon className="w-6 h-6 text-neutral-600" />
                )}
              </div>

              <div className="flex-1 space-y-2">
                <input
                  type="text"
                  value={coverImage}
                  onChange={(e) => setCoverImage(e.target.value)}
                  placeholder="/images/... or https://..."
                  className="w-full bg-[#101014] border border-white/15 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-white font-mono"
                />

                <div className="flex flex-wrap items-center gap-2">
                  <input
                    ref={coverFileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/avif"
                    onChange={handleCoverFileChange}
                    className="hidden"
                  />
                  <button
                    type="button"
                    disabled={isUploadingCover}
                    onClick={() => coverFileInputRef.current?.click()}
                    className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border border-white/15 hover:border-white/35 text-neutral-200 hover:text-white bg-white/[0.04] hover:bg-white/[0.08] transition-colors cursor-pointer disabled:opacity-50"
                  >
                    {isUploadingCover ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-white" />
                    ) : (
                      <Upload className="w-3.5 h-3.5" />
                    )}
                    <span>{isUploadingCover ? "Uploading Cover..." : "Upload Cover Image"}</span>
                  </button>
                  <span className="text-[10px] text-neutral-500 font-mono">
                    JPEG, PNG, WebP (max 10MB)
                  </span>
                </div>

                {coverUploadError && (
                  <p className="text-[11px] text-rose-400 font-medium">
                    {coverUploadError}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* ============================================================== */}
          {/* SECTION 2: EVENT PHOTOS & HIGHLIGHTS (MULTI-PHOTO GALLERY)     */}
          {/* ============================================================== */}
          <div className="space-y-3 p-4 rounded-xl bg-[#0a0a0e] border border-white/10">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <label className="font-semibold text-white flex items-center gap-1.5 text-xs sm:text-sm">
                  <ImageIcon className="w-4 h-4 text-emerald-400" />
                  <span>Event Photos & Highlights</span>
                  <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-white/10 text-neutral-300">
                    {existingEventPhotos.length + pendingEventPhotos.length}
                  </span>
                </label>
                <p className="text-[11px] text-neutral-400 mt-0.5">
                  Multi-photo gallery displayed inside the public event details modal.
                </p>
              </div>

              {/* Multi-photo file picker trigger */}
              <div className="flex items-center gap-2">
                <input
                  ref={eventPhotosInputRef}
                  type="file"
                  multiple
                  accept="image/jpeg,image/png,image/webp,image/avif"
                  onChange={handleEventPhotosChange}
                  className="hidden"
                />
                <button
                  type="button"
                  disabled={isSubmitting || isUploadingEventPhotos}
                  onClick={() => eventPhotosInputRef.current?.click()}
                  className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border border-white/20 hover:border-white/50 text-white bg-white/10 hover:bg-white/15 transition-all cursor-pointer disabled:opacity-50 font-medium"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Event Photos</span>
                </button>
              </div>
            </div>

            {/* Error & Progress Feedback */}
            {eventUploadError && (
              <div className="flex items-center gap-2 p-2.5 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{eventUploadError}</span>
              </div>
            )}

            {isUploadingEventPhotos && eventUploadProgress && (
              <div className="p-3 rounded-lg bg-white/[0.04] border border-white/10 space-y-1.5">
                <div className="flex items-center justify-between text-xs text-neutral-300">
                  <span className="flex items-center gap-2">
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-white" />
                    <span>Uploading highlights to Supabase Storage...</span>
                  </span>
                  <span className="font-mono text-[11px]">
                    {eventUploadProgress.current} / {eventUploadProgress.total}
                  </span>
                </div>
                <div className="w-full bg-white/10 h-1.5 rounded-full overflow-hidden">
                  <div
                    className="bg-white h-full transition-all duration-300"
                    style={{
                      width: `${(eventUploadProgress.current / eventUploadProgress.total) * 100}%`,
                    }}
                  />
                </div>
              </div>
            )}

            {/* Gallery Previews Grid */}
            {existingEventPhotos.length === 0 && pendingEventPhotos.length === 0 ? (
              <div
                onClick={() => eventPhotosInputRef.current?.click()}
                className="p-6 rounded-xl border border-dashed border-white/15 hover:border-white/30 bg-black/40 flex flex-col items-center justify-center text-center cursor-pointer group transition-colors"
              >
                <div className="p-2.5 rounded-full bg-white/[0.05] group-hover:bg-white/10 text-neutral-400 group-hover:text-white transition-colors mb-2">
                  <Upload className="w-4 h-4" />
                </div>
                <p className="text-xs font-medium text-neutral-300">
                  No event highlights added yet
                </p>
                <p className="text-[11px] text-neutral-500 mt-0.5">
                  Click here or select multiple photos to showcase event moments
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5 pt-1">
                {/* 1. Saved Photos (Already in Storage) */}
                {existingEventPhotos.map((photoUrl, idx) => (
                  <div
                    key={`saved-${idx}`}
                    className="relative aspect-[4/3] rounded-xl overflow-hidden border border-white/15 bg-black group shadow-sm"
                  >
                    <Image
                      src={photoUrl}
                      alt={`Event photo ${idx + 1}`}
                      fill
                      sizes="150px"
                      className="object-cover"
                      unoptimized={photoUrl.startsWith("data:")}
                    />

                    {/* Saved Badge */}
                    <div className="absolute top-1.5 left-1.5 z-10">
                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[9px] font-mono font-medium bg-black/80 border border-white/20 text-neutral-200 backdrop-blur-md">
                        <CheckCircle2 className="w-2.5 h-2.5 text-emerald-400" />
                        <span>Saved</span>
                      </span>
                    </div>

                    {/* Remove Action Button */}
                    <button
                      type="button"
                      onClick={() => handleRemoveExistingPhoto(idx)}
                      title="Remove this event photo"
                      aria-label={`Remove event photo ${idx + 1}`}
                      className="absolute top-1.5 right-1.5 z-10 w-6 h-6 rounded-md bg-black/80 hover:bg-rose-600 border border-white/20 text-neutral-300 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}

                {/* 2. Pending Photos (Unsaved / Staged for Upload) */}
                {pendingEventPhotos.map((pending) => (
                  <div
                    key={pending.id}
                    className="relative aspect-[4/3] rounded-xl overflow-hidden border border-amber-500/40 bg-black group shadow-sm"
                  >
                    <Image
                      src={pending.previewUrl}
                      alt={pending.name}
                      fill
                      sizes="150px"
                      className="object-cover"
                      unoptimized
                    />

                    {/* Pending Badge */}
                    <div className="absolute top-1.5 left-1.5 z-10">
                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[9px] font-mono font-medium bg-amber-500/20 border border-amber-500/40 text-amber-300 backdrop-blur-md">
                        <span>Pending</span>
                      </span>
                    </div>

                    {/* Filename & size bottom overlay */}
                    <div className="absolute inset-x-0 bottom-0 p-1.5 bg-gradient-to-t from-black via-black/80 to-transparent z-10">
                      <p className="text-[10px] text-white truncate font-mono">
                        {pending.name}
                      </p>
                      <p className="text-[9px] text-neutral-400 font-mono">
                        {formatFileSize(pending.size)}
                      </p>
                    </div>

                    {/* Remove Pending Photo Button */}
                    <button
                      type="button"
                      onClick={() => handleRemovePendingPhoto(pending.id)}
                      title="Remove unsaved photo"
                      aria-label={`Remove unsaved photo ${pending.name}`}
                      className="absolute top-1.5 right-1.5 z-10 w-6 h-6 rounded-md bg-black/80 hover:bg-rose-600 border border-white/20 text-neutral-300 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Registration Details */}
          {(status === "upcoming" || status === "ongoing") && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 p-3.5 rounded-xl bg-[#0a0a0e] border border-white/10">
              <div className="space-y-1.5">
                <label className="font-semibold text-neutral-300">
                  Registration Status
                </label>
                <select
                  value={registrationStatus}
                  onChange={(e) =>
                    setRegistrationStatus(e.target.value as RegistrationStatus)
                  }
                  className="w-full bg-[#101014] border border-white/15 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-white"
                >
                  <option value="Registration Open">Registration Open</option>
                  <option value="Upcoming">Upcoming</option>
                  <option value="Registration Closed">Registration Closed</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="font-semibold text-neutral-300">
                  Registration / WhatsApp URL
                </label>
                <input
                  type="url"
                  value={registrationUrl}
                  onChange={(e) => setRegistrationUrl(e.target.value)}
                  placeholder="https://chat.whatsapp.com/..."
                  className="w-full bg-[#101014] border border-white/15 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-white font-mono text-xs"
                />
              </div>
            </div>
          )}

          {/* Toggles */}
          <div className="flex flex-wrap items-center gap-6 pt-2 border-t border-white/10">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={published}
                onChange={(e) => setPublished(e.target.checked)}
                className="w-4 h-4 rounded border-white/20 bg-black text-white focus:ring-0"
              />
              <span className="text-xs text-neutral-300">
                Publish on live website immediately
              </span>
            </label>

            {(status === "upcoming" || status === "ongoing") && (
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={isFeaturedUpcoming}
                  onChange={(e) => setIsFeaturedUpcoming(e.target.checked)}
                  className="w-4 h-4 rounded border-white/20 bg-black text-white focus:ring-0"
                />
                <span className="text-xs text-neutral-300">
                  Feature on Activities banner showcase
                </span>
              </label>
            )}
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/10 shrink-0">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting || isUploadingCover || isUploadingEventPhotos}
              className="px-4 py-2.5 rounded-xl text-xs sm:text-sm font-medium border border-white/15 text-neutral-300 hover:text-white bg-white/[0.03] transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || isUploadingCover || isUploadingEventPhotos}
              className="px-5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold bg-white text-black hover:bg-neutral-200 shadow-[0_0_20px_rgba(255,255,255,0.2)] transition-all cursor-pointer flex items-center gap-2 disabled:opacity-50 min-h-[44px]"
            >
              {(isSubmitting || isUploadingCover || isUploadingEventPhotos) && (
                <Loader2 className="w-4 h-4 animate-spin text-black" />
              )}
              <span>
                {isUploadingCover
                  ? "Uploading Cover..."
                  : isUploadingEventPhotos
                  ? "Uploading Event Photos..."
                  : isSubmitting
                  ? "Saving Activity..."
                  : activity
                  ? "Update Activity"
                  : "Create Activity"}
              </span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
