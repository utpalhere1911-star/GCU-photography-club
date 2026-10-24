"use client";

import React, { useState, useRef } from "react";
import Image from "next/image";
import { Users, X, Upload, Loader2, AlertCircle, Shield, Briefcase, Camera } from "lucide-react";
import { TeamMember } from "@/data/team";

export interface TeamModalProps {
  member: TeamMember | null;
  onClose: () => void;
  onSave: (member: TeamMember) => Promise<void>;
}

export default function TeamMemberFormModal({
  member,
  onClose,
  onSave,
}: TeamModalProps) {
  const [name, setName] = useState(member?.name || "");
  const [role, setRole] = useState(member?.role || "Core Member");
  const [category, setCategory] = useState<"Leadership" | "Faculty" | "Core Member">(
    member?.category || "Core Member"
  );
  const [department, setDepartment] = useState(member?.department || "");
  const [photoUrl, setPhotoUrl] = useState(member?.photoUrl || "");
  const [objectPosition, setObjectPosition] = useState(
    member?.objectPosition || "center 25%"
  );

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [prevMember, setPrevMember] = useState<TeamMember | null>(member);

  if (member !== prevMember) {
    setPrevMember(member);
    if (member) {
      setName(member.name || "");
      setRole(member.role || "Core Member");
      setCategory(member.category || "Core Member");
      setDepartment(member.department || "");
      setPhotoUrl(member.photoUrl || "");
      setObjectPosition(member.objectPosition || "center 25%");
      setUploadError(null);
    }
  }

  const handleImageFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setUploadError("Selected file is not an image.");
      return;
    }
    if (file.size > 8 * 1024 * 1024) {
      setUploadError("Image file size exceeds the 8 MB limit.");
      return;
    }

    setIsUploadingImage(true);
    setUploadError(null);

    const formData = new FormData();
    formData.append("file", file);
    formData.append("bucket", "team-portraits");
    formData.append("folder", "team");

    try {
      const res = await fetch("/api/content/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json().catch(() => null);

      if (res.ok && data?.success && data?.url) {
        setPhotoUrl(data.url);
      } else {
        const errorMsg = data?.error || `Upload failed with status ${res.status}`;
        setUploadError(errorMsg);
      }
    } catch (err) {
      console.error("Portrait upload error:", err);
      setUploadError("Failed to upload portrait. Please check network connection.");
    } finally {
      setIsUploadingImage(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !role.trim() || isUploadingImage) return;

    setIsSubmitting(true);
    const id =
      member?.id ||
      name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "") +
        "-" +
        Date.now().toString().slice(-4);

    const initials = name
      .split(" ")
      .map((w) => w[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);

    const payload: TeamMember = {
      id,
      name: name.trim(),
      role: role.trim(),
      category,
      initials,
      department: department.trim() || undefined,
      photoUrl: photoUrl.trim() || undefined,
      objectPosition,
    };

    await onSave(payload);
    setIsSubmitting(false);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="team-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md overflow-y-auto"
    >
      <div className="w-full max-w-lg bg-[#101014] border border-white/15 rounded-2xl shadow-2xl overflow-hidden my-auto flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-white/10 bg-[#0c0c10]/90 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-white/[0.08] text-white border border-white/20 shadow-[0_0_12px_rgba(255,255,255,0.15)]">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h2 id="team-modal-title" className="text-base sm:text-lg font-bold text-white tracking-tight">
                {member ? "Edit Team Member" : "Add Team Member"}
              </h2>
              <p className="text-xs text-neutral-400">
                {member ? "Update role, category, or portrait photo" : "Register a student lead or faculty coordinator"}
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

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4 text-xs sm:text-sm overflow-y-auto dashboard-scrollbar">
          {/* Name & Role */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div className="space-y-1.5">
              <label className="font-semibold text-white">Full Name *</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Uttama Purkayastha"
                className="w-full bg-[#0a0a0e] border border-white/15 rounded-xl px-3.5 py-2.5 text-white placeholder-neutral-500 focus:outline-none focus:border-white focus:ring-1 focus:ring-white/30 transition-all"
              />
            </div>

            <div className="space-y-1.5">
              <label className="font-semibold text-white">Role / Title *</label>
              <input
                type="text"
                required
                value={role}
                onChange={(e) => setRole(e.target.value)}
                placeholder="e.g. President / Faculty Coordinator"
                className="w-full bg-[#0a0a0e] border border-white/15 rounded-xl px-3.5 py-2.5 text-white placeholder-neutral-500 focus:outline-none focus:border-white focus:ring-1 focus:ring-white/30 transition-all"
              />
            </div>
          </div>

          {/* Category & Department */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div className="space-y-1.5">
              <label className="font-semibold text-neutral-300 flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5 text-white" />
                Category
              </label>
              <select
                value={category}
                onChange={(e) =>
                  setCategory(e.target.value as "Leadership" | "Faculty" | "Core Member")
                }
                className="w-full bg-[#0a0a0e] border border-white/15 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-white focus:ring-1 focus:ring-white/30 transition-all cursor-pointer"
              >
                <option value="Leadership">Leadership (Office Bearer)</option>
                <option value="Faculty">Faculty Coordinator</option>
                <option value="Core Member">Core Member</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="font-semibold text-neutral-300 flex items-center gap-1.5">
                <Briefcase className="w-3.5 h-3.5 text-white" />
                Department (Optional)
              </label>
              <input
                type="text"
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                placeholder="e.g. Dept. of Mechanical Engineering"
                className="w-full bg-[#0a0a0e] border border-white/15 rounded-xl px-3.5 py-2.5 text-white placeholder-neutral-500 focus:outline-none focus:border-white focus:ring-1 focus:ring-white/30 transition-all"
              />
            </div>
          </div>

          {/* Portrait Photo Upload */}
          <div className="space-y-2 p-3.5 rounded-xl bg-[#0a0a0e] border border-white/10">
            <label className="font-semibold text-white flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Camera className="w-4 h-4 text-white" />
                Official Portrait Photograph
              </span>
              <span className="text-[11px] text-neutral-400 font-mono">team-portraits bucket</span>
            </label>

            {uploadError && (
              <div className="p-2.5 rounded-lg bg-white/[0.04] border border-white/20 text-neutral-200 text-xs flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-white" />
                <span>{uploadError}</span>
              </div>
            )}

            <div className="flex items-center gap-3">
              <div className="relative w-16 h-16 rounded-xl bg-black/60 border border-white/15 overflow-hidden shrink-0 flex items-center justify-center">
                {photoUrl ? (
                  <Image
                    src={photoUrl}
                    alt="Preview"
                    fill
                    sizes="64px"
                    className="object-cover"
                    style={{ objectPosition }}
                  />
                ) : (
                  <span className="text-xs font-mono font-bold text-neutral-600">
                    NO PHOTO
                  </span>
                )}
              </div>

              <div className="flex-1 space-y-2">
                <input
                  type="text"
                  value={photoUrl}
                  onChange={(e) => setPhotoUrl(e.target.value)}
                  placeholder="/team/... or upload file below"
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
                    <span>{isUploadingImage ? "Uploading Portrait..." : "Upload Portrait"}</span>
                  </button>
                  <span className="text-[10px] text-neutral-500">
                    Square or vertical ratio recommended
                  </span>
                </div>
              </div>
            </div>
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
              <span>{member ? "Update Member" : "Add to Team"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
