"use client";

import React, { useState, useRef } from "react";
import { Upload, X, AlertCircle, Loader2, CheckCircle2 } from "lucide-react";
import { GalleryPhoto, GalleryCategory, galleryCategories } from "@/data/gallery";

export interface MultiUploadModalProps {
  onClose: () => void;
  onUploadSuccess: (photos: GalleryPhoto[]) => void;
}

export default function MultiPhotoUploadModal({
  onClose,
  onUploadSuccess,
}: MultiUploadModalProps) {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [defaultCategory, setDefaultCategory] = useState<GalleryCategory>("Campus");
  const [defaultPhotographer, setDefaultPhotographer] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<{ current: number; total: number } | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFilesSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const filesArr = Array.from(e.target.files);
      setSelectedFiles((prev) => [...prev, ...filesArr]);
      setUploadError(null);
    }
  };

  const handleUploadAll = async () => {
    if (selectedFiles.length === 0) return;
    setIsProcessing(true);
    setUploadError(null);
    setUploadProgress({ current: 0, total: selectedFiles.length });

    try {
      const createdPhotos: GalleryPhoto[] = [];

      for (let i = 0; i < selectedFiles.length; i++) {
        const file = selectedFiles[i];
        setUploadProgress({ current: i + 1, total: selectedFiles.length });

        let fileUrl: string | null = null;
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
            fileUrl = data.url;
          } else {
            console.warn(`Storage upload failed for ${file.name}:`, data?.error);
          }
        } catch (uploadErr) {
          console.warn("Storage upload exception for batch item:", uploadErr);
        }

        if (!fileUrl) {
          continue;
        }

        const cleanName = file.name.replace(/\.[^/.]+$/, "").replace(/[-_]/g, " ");
        const title = cleanName.charAt(0).toUpperCase() + cleanName.slice(1);
        const photog = defaultPhotographer.trim() || "Club Member";

        const id = `photo-${Date.now()}-${i}-${Math.random().toString(36).substring(2, 6)}`;

        createdPhotos.push({
          id,
          title,
          caption: `Photographic capture from ${title} series at Girijananda Chowdhury University.`,
          category: defaultCategory,
          photographer: photog,
          avatarInitials: photog
            .split(" ")
            .map((w) => w[0])
            .join("")
            .slice(0, 2)
            .toUpperCase(),
          imageSrc: fileUrl,
          alt: `${title} by ${photog}`,
          aspectRatio: "standard",
          gridSpanClass: "col-span-6 md:col-span-6 lg:col-span-3",
          initialLikes: 0,
          likesCount: 0,
          date: new Date().toISOString().split("T")[0],
          location: "GCU Campus, Azara",
          published: true,
          displayOrder: i,
        });
      }

      if (createdPhotos.length > 0) {
        onUploadSuccess(createdPhotos);
      } else {
        setUploadError(
          "Failed to upload photographs to Supabase Storage. Please check storage bucket configuration."
        );
      }
    } catch (err) {
      console.error("Batch upload failed:", err);
      setUploadError(
        "Batch upload encountered an unexpected error. Please verify network connectivity."
      );
    } finally {
      setIsProcessing(false);
      setUploadProgress(null);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="batch-upload-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md overflow-y-auto"
    >
      <div className="w-full max-w-lg bg-[#101014] border border-white/15 rounded-2xl shadow-2xl overflow-hidden my-auto flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-white/10 bg-[#0c0c10]/90 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-white/[0.08] text-white border border-white/20 shadow-[0_0_12px_rgba(255,255,255,0.15)]">
              <Upload className="w-5 h-5" />
            </div>
            <div>
              <h2 id="batch-upload-title" className="text-base sm:text-lg font-bold text-white tracking-tight">
                Batch Photograph Upload
              </h2>
              <p className="text-xs text-neutral-400">
                Upload multiple high-resolution photos into Supabase Storage
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isProcessing}
            className="p-1.5 rounded-xl text-neutral-400 hover:text-white hover:bg-white/[0.08] transition-colors cursor-pointer disabled:opacity-50"
            aria-label="Close dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 sm:p-6 space-y-4 text-xs sm:text-sm overflow-y-auto dashboard-scrollbar">
          {uploadError && (
            <div className="p-3.5 rounded-xl bg-white/[0.04] border border-white/20 text-neutral-200 text-xs flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-white" />
              <span>{uploadError}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div className="space-y-1.5">
              <label className="font-semibold text-neutral-300">Default Category</label>
              <select
                value={defaultCategory}
                onChange={(e) => setDefaultCategory(e.target.value as GalleryCategory)}
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
              <label className="font-semibold text-neutral-300">Default Photographer</label>
              <input
                type="text"
                value={defaultPhotographer}
                onChange={(e) => setDefaultPhotographer(e.target.value)}
                placeholder="e.g. Club Member"
                className="w-full bg-[#0a0a0e] border border-white/15 rounded-xl px-3.5 py-2.5 text-white placeholder-neutral-500 focus:outline-none focus:border-white focus:ring-1 focus:ring-white/30 transition-all"
              />
            </div>
          </div>

          {/* Drop / Select Zone */}
          <div
            onClick={() => !isProcessing && fileInputRef.current?.click()}
            className="border-2 border-dashed border-white/15 hover:border-white/40 rounded-2xl p-7 text-center cursor-pointer transition-all bg-[#0a0a0e] hover:bg-white/[0.03] group"
          >
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/*"
              onChange={handleFilesSelected}
              className="hidden"
            />
            <div className="w-12 h-12 rounded-xl bg-white/[0.08] text-white border border-white/20 flex items-center justify-center mx-auto mb-3 group-hover:scale-105 transition-transform shadow-[0_0_12px_rgba(255,255,255,0.1)]">
              <Upload className="w-6 h-6" />
            </div>
            <p className="font-semibold text-white">Click or drag photos to select</p>
            <p className="text-[11px] text-neutral-400 mt-1">
              Select multiple files (JPEG, PNG, WebP)
            </p>
          </div>

          {selectedFiles.length > 0 && (
            <div className="p-3.5 rounded-xl bg-[#0a0a0e] border border-white/15 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-white" />
                <span className="font-medium text-white">
                  {selectedFiles.length} photograph(s) queued for upload
                </span>
              </div>
              <button
                type="button"
                disabled={isProcessing}
                onClick={() => setSelectedFiles([])}
                className="text-xs text-neutral-400 hover:text-white transition-colors cursor-pointer disabled:opacity-50"
              >
                Clear all
              </button>
            </div>
          )}

          {uploadProgress && (
            <div className="space-y-1.5 p-3.5 rounded-xl bg-[#0a0a0e] border border-white/20 text-xs text-neutral-300">
              <div className="flex justify-between font-mono">
                <span>Uploading to Supabase Storage...</span>
                <span>
                  {uploadProgress.current} / {uploadProgress.total}
                </span>
              </div>
              <div className="w-full bg-[#101014] h-2 rounded-full overflow-hidden border border-white/10">
                <div
                  className="bg-white shadow-[0_0_10px_rgba(255,255,255,0.8)] h-full transition-all duration-300 rounded-full"
                  style={{
                    width: `${Math.round((uploadProgress.current / uploadProgress.total) * 100)}%`,
                  }}
                />
              </div>
            </div>
          )}

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/10">
            <button
              type="button"
              onClick={onClose}
              disabled={isProcessing}
              className="px-4 py-2.5 rounded-xl text-xs sm:text-sm font-medium border border-white/15 text-neutral-300 hover:text-white bg-white/[0.03] transition-colors cursor-pointer disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={selectedFiles.length === 0 || isProcessing}
              onClick={handleUploadAll}
              className="px-5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold bg-white text-black hover:bg-neutral-200 shadow-[0_0_20px_rgba(255,255,255,0.2)] flex items-center gap-2 cursor-pointer disabled:opacity-50 transition-all"
            >
              {isProcessing && <Loader2 className="w-4 h-4 animate-spin text-black" />}
              <span>Upload {selectedFiles.length} Photo(s)</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
