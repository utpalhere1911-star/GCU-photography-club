"use client";

import React, { useState, useRef } from "react";
import Image from "next/image";
import {
  Image as ImageIcon,
  X,
  Upload,
  Loader2,
  Camera,
  MapPin,
  Calendar,
  Layers,
} from "lucide-react";
import { GalleryPhoto, GalleryCategory, galleryCategories } from "@/data/gallery";

export interface GalleryModalProps {
  photo: GalleryPhoto | null;
  onClose: () => void;
  onSave: (photo: GalleryPhoto) => Promise<void>;
}

export default function GalleryFormModal({
  photo,
  onClose,
  onSave,
}: GalleryModalProps) {
  const [title, setTitle] = useState(photo?.title || "");
  const [caption, setCaption] = useState(photo?.caption || "");
  const [category, setCategory] = useState<GalleryCategory>(
    photo?.category || "Campus"
  );
  const [photographer, setPhotographer] = useState(photo?.photographer || "");
  const [location, setLocation] = useState(
    photo?.location || "GCU Campus, Azara"
  );
  const [imageSrc, setImageSrc] = useState(photo?.imageSrc || "");
  const [date, setDate] = useState(
    photo?.date || new Date().toISOString().split("T")[0]
  );
  const [aspectRatio, setAspectRatio] = useState<
    "landscape" | "portrait" | "standard" | "wide"
  >(photo?.aspectRatio || "standard");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [prevPhoto, setPrevPhoto] = useState<GalleryPhoto | null>(photo);

  if (photo !== prevPhoto) {
    setPrevPhoto(photo);
    if (photo) {
      setTitle(photo.title || "");
      setCaption(photo.caption || "");
      setCategory(photo.category || "Campus");
      setPhotographer(photo.photographer || "");
      setLocation(photo.location || "GCU Campus, Azara");
      setImageSrc(photo.imageSrc || "");
      setDate(photo.date || new Date().toISOString().split("T")[0]);
      setAspectRatio(photo.aspectRatio || "standard");
      setUploadError(null);
    }
  }

  const handleImageFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setUploadError("Only image files (JPEG, PNG, WebP, AVIF) are supported.");
      return;
    }

    setUploadError(null);
    setIsUploadingImage(true);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("bucket", "gallery-photos");
      formData.append("folder", "gallery");

      const res = await fetch("/api/content/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json().catch(() => null);

      if (res.ok && data?.url) {
        setImageSrc(data.url);
      } else {
        const errorMsg = data?.error || `Upload failed with status ${res.status}`;
        setUploadError(errorMsg);
      }
    } catch (err) {
      console.error("Gallery photo upload exception:", err);
      setUploadError("Network error while uploading photo. Please try again.");
    } finally {
      setIsUploadingImage(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !photographer.trim() || isUploadingImage) return;
    if (!imageSrc.trim()) {
      setUploadError("Please upload or provide an image URL for this photograph.");
      return;
    }

    setIsSubmitting(true);
    const id =
      photo?.id ||
      title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "") +
        "-" +
        Date.now().toString().slice(-4);

    const initials = photographer
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);

    const payload: GalleryPhoto = {
      id,
      title: title.trim(),
      caption: caption.trim(),
      category,
      photographer: photographer.trim(),
      avatarInitials: initials,
      imageSrc: imageSrc.trim(),
      alt: `${title.trim()} — Photography by ${photographer.trim()}`,
      date,
      location: location.trim(),
      aspectRatio,
      initialLikes: photo?.initialLikes ?? 0,
      likesCount: photo?.likesCount ?? photo?.initialLikes ?? 0,
      gridSpanClass: photo?.gridSpanClass || "col-span-6 md:col-span-6 lg:col-span-3",
      published: photo?.published ?? true,
      displayOrder: photo?.displayOrder ?? 0,
    };

    await onSave(payload);
    setIsSubmitting(false);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="gallery-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md overflow-y-auto"
    >
      <div className="w-full max-w-xl bg-[#101014] border border-white/15 rounded-2xl shadow-2xl overflow-hidden my-auto flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-white/10 bg-[#0c0c10]/90 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-white/[0.08] text-white border border-white/20 shadow-[0_0_12px_rgba(255,255,255,0.15)]">
              <ImageIcon className="w-5 h-5" />
            </div>
            <div>
              <h2 id="gallery-modal-title" className="text-base sm:text-lg font-bold text-white tracking-tight">
                {photo ? "Edit Gallery Photograph" : "Add Photograph to Gallery"}
              </h2>
              <p className="text-xs text-neutral-400">
                {photo ? "Update credits, caption, or category" : "Curate photography into the official club archive"}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-neutral-400 hover:text-white hover:bg-white/[0.08] transition-colors cursor-pointer"
            aria-label="Close dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4 text-xs sm:text-sm overflow-y-auto dashboard-scrollbar">
          {/* Photo Preview & Upload Box */}
          <div className="space-y-2 p-3.5 rounded-xl bg-[#0a0a0e] border border-white/10">
            <label className="font-semibold text-white flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Camera className="w-4 h-4 text-white" />
                Photograph File *
              </span>
              <span className="text-[11px] text-neutral-400 font-mono">gallery-photos bucket</span>
            </label>

            <div className="flex items-center gap-3">
              <div className="relative w-20 h-20 rounded-xl bg-black/60 border border-white/15 overflow-hidden shrink-0 flex items-center justify-center">
                {imageSrc ? (
                  <Image
                    src={imageSrc}
                    alt="Preview"
                    fill
                    sizes="80px"
                    className="object-cover"
                    unoptimized={imageSrc.startsWith("data:")}
                  />
                ) : (
                  <ImageIcon className="w-8 h-8 text-neutral-600" />
                )}
              </div>

              <div className="flex-1 space-y-2">
                <input
                  type="text"
                  value={imageSrc}
                  onChange={(e) => setImageSrc(e.target.value)}
                  placeholder="/images/... or https://..."
                  className="w-full bg-[#101014] border border-white/15 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-white font-mono"
                />

                <div className="flex flex-wrap items-center gap-2">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleImageFileChange}
                    className="hidden"
                  />
                  <button
                    type="button"
                    disabled={isUploadingImage}
                    onClick={() => fileInputRef.current?.click()}
                    className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border border-white/15 hover:border-white/35 text-neutral-200 hover:text-white bg-white/[0.04] hover:bg-white/[0.08] transition-colors cursor-pointer disabled:opacity-50"
                  >
                    {isUploadingImage ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-white" />
                    ) : (
                      <Upload className="w-3.5 h-3.5" />
                    )}
                    <span>{isUploadingImage ? "Uploading Photo..." : "Upload from Device"}</span>
                  </button>
                  <span className="text-[10px] text-neutral-500">
                    High-res JPEG, PNG, WebP supported
                  </span>
                </div>

                {uploadError && (
                  <p className="text-[11px] text-rose-400 font-medium">
                    {uploadError}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Title & Photographer */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div className="space-y-1.5">
              <label className="font-semibold text-white">Photo Title *</label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Sunset Over GCU Amphitheatre"
                className="w-full bg-[#0a0a0e] border border-white/15 rounded-xl px-3.5 py-2.5 text-white placeholder-neutral-500 focus:outline-none focus:border-white focus:ring-1 focus:ring-white/30 transition-all"
              />
            </div>

            <div className="space-y-1.5">
              <label className="font-semibold text-white">Photographer Name *</label>
              <input
                type="text"
                required
                value={photographer}
                onChange={(e) => setPhotographer(e.target.value)}
                placeholder="e.g. Mahadananda Dutta"
                className="w-full bg-[#0a0a0e] border border-white/15 rounded-xl px-3.5 py-2.5 text-white placeholder-neutral-500 focus:outline-none focus:border-white focus:ring-1 focus:ring-white/30 transition-all"
              />
            </div>
          </div>

          {/* Category & Aspect Ratio */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div className="space-y-1.5">
              <label className="font-semibold text-neutral-300 flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-white" />
                Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as GalleryCategory)}
                className="w-full bg-[#0a0a0e] border border-white/15 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-white focus:ring-1 focus:ring-white/30 transition-all cursor-pointer"
              >
                {galleryCategories
                  .filter((c) => c !== "All")
                  .map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="font-semibold text-neutral-300">Aspect Ratio</label>
              <select
                value={aspectRatio}
                onChange={(e) =>
                  setAspectRatio(e.target.value as "landscape" | "portrait" | "standard" | "wide")
                }
                className="w-full bg-[#0a0a0e] border border-white/15 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-white focus:ring-1 focus:ring-white/30 transition-all cursor-pointer"
              >
                <option value="standard">Standard (4:3)</option>
                <option value="landscape">Landscape (3:2)</option>
                <option value="portrait">Portrait (3:4)</option>
                <option value="wide">Panoramic / Wide (16:9)</option>
              </select>
            </div>
          </div>

          {/* Location & Capture Date */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div className="space-y-1.5">
              <label className="font-semibold text-neutral-300 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-white" />
                Capture Location
              </label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="GCU Campus, Azara"
                className="w-full bg-[#0a0a0e] border border-white/15 rounded-xl px-3.5 py-2 text-white placeholder-neutral-500 focus:outline-none focus:border-white transition-all"
              />
            </div>

            <div className="space-y-1.5">
              <label className="font-semibold text-neutral-300 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-white" />
                Date Captured
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full bg-[#0a0a0e] border border-white/15 rounded-xl px-3.5 py-2 text-white focus:outline-none focus:border-white transition-all"
              />
            </div>
          </div>

          {/* Caption */}
          <div className="space-y-1.5">
            <label className="font-semibold text-neutral-300">Photograph Caption / Story</label>
            <textarea
              rows={3}
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder="Behind-the-lens story, camera settings, or artistic intent..."
              className="w-full bg-[#0a0a0e] border border-white/15 rounded-xl px-3.5 py-2 text-white placeholder-neutral-500 focus:outline-none focus:border-white transition-all"
            />
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/10 shrink-0">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting || isUploadingImage}
              className="px-4 py-2.5 rounded-xl text-xs sm:text-sm font-medium border border-white/15 text-neutral-300 hover:text-white bg-white/[0.03] transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || isUploadingImage}
              className="px-5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold bg-white text-black hover:bg-neutral-200 shadow-[0_0_20px_rgba(255,255,255,0.2)] transition-all cursor-pointer flex items-center gap-2 disabled:opacity-50"
            >
              {(isSubmitting || isUploadingImage) && <Loader2 className="w-4 h-4 animate-spin text-black" />}
              <span>
                {isUploadingImage
                  ? "Uploading Photograph..."
                  : isSubmitting
                  ? "Saving Photograph..."
                  : photo
                  ? "Update Photograph"
                  : "Add to Gallery"}
              </span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
