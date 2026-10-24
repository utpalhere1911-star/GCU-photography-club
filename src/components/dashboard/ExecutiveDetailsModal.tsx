"use client";

import React from "react";
import { X, User, Calendar, Clock, Shield, Key, Ban, CheckCircle2 } from "lucide-react";
import { ExecutiveMember, formatToKolkata } from "./types";

interface ExecutiveDetailsModalProps {
  isOpen: boolean;
  member: ExecutiveMember | null;
  onClose: () => void;
  onOpenResetPassword: (member: ExecutiveMember) => void;
  onToggleStatus: (member: ExecutiveMember) => void;
}

export default function ExecutiveDetailsModal({
  isOpen,
  member,
  onClose,
  onOpenResetPassword,
  onToggleStatus,
}: ExecutiveDetailsModalProps) {
  if (!isOpen || !member) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="details-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200"
    >
      <div className="relative w-full max-w-lg bg-[#101014] border border-white/15 rounded-2xl shadow-2xl overflow-hidden flex flex-col my-auto max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-[#0c0c10]/90">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-white/[0.08] text-white border border-white/20 shadow-[0_0_12px_rgba(255,255,255,0.15)]">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h2 id="details-title" className="text-base font-bold text-white tracking-tight">
                Executive Member Details
              </h2>
              <p className="text-xs text-neutral-400">
                Supabase Authentication & Role Directory record
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

        {/* Content Body */}
        <div className="p-6 space-y-5 overflow-y-auto dashboard-scrollbar">
          {/* Member Profile Card */}
          <div className="p-4 rounded-xl bg-[#0a0a0e] border border-white/10 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-12 h-12 rounded-full bg-white/[0.08] border border-white/20 flex items-center justify-center text-white font-bold text-base uppercase shrink-0 shadow-[0_0_10px_rgba(255,255,255,0.15)]">
                {member.fullName.charAt(0) || "E"}
              </div>
              <div className="min-w-0">
                <h3 className="text-sm font-bold text-white truncate">
                  {member.fullName}
                </h3>
                <p className="text-xs text-neutral-400 font-mono truncate">
                  {member.email}
                </p>
              </div>
            </div>

            <span
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium shrink-0 ${
                member.status === "active"
                  ? "bg-white/[0.08] text-white border border-white/20"
                  : "bg-white/[0.03] text-neutral-400 border border-white/10"
              }`}
            >
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  member.status === "active" ? "bg-white shadow-[0_0_6px_rgba(255,255,255,0.8)]" : "bg-neutral-600"
                }`}
              />
              <span className="capitalize">{member.status}</span>
            </span>
          </div>

          {/* Details Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-xs">
            <div className="p-3.5 rounded-xl bg-[#0e0e12] border border-white/10 space-y-1">
              <span className="text-neutral-400 flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5 text-white" />
                Assigned Role
              </span>
              <span className="font-semibold text-white uppercase tracking-wider block font-mono">
                Executive Member
              </span>
            </div>

            <div className="p-3.5 rounded-xl bg-[#0e0e12] border border-white/10 space-y-1">
              <span className="text-neutral-400 flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-white" />
                Auth Status
              </span>
              <span className="font-semibold text-white capitalize block font-mono">
                {member.status === "active" ? "Active (Login Permitted)" : "Deactivated"}
              </span>
            </div>

            <div className="p-3.5 rounded-xl bg-[#0e0e12] border border-white/10 space-y-1">
              <span className="text-neutral-400 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-neutral-400" />
                Account Created
              </span>
              <span className="font-mono text-white block">
                {formatToKolkata(member.createdAt)}
              </span>
            </div>

            <div className="p-3.5 rounded-xl bg-[#0e0e12] border border-white/10 space-y-1">
              <span className="text-neutral-400 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-neutral-400" />
                Last Sign-In (IST)
              </span>
              <span className="font-mono text-white block">
                {formatToKolkata(member.lastSignInAt)}
              </span>
            </div>
          </div>

          {/* User ID Reference */}
          <div className="p-3 rounded-xl bg-[#0e0e12] border border-white/10 text-xs font-mono">
            <span className="text-neutral-500 block text-[10px] uppercase tracking-wider">
              Supabase User UUID
            </span>
            <span className="text-neutral-300 break-all select-all">{member.id}</span>
          </div>

          {/* Actions */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-white/10">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenResetPassword(member);
                }}
                className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-2 rounded-xl border border-white/15 hover:border-white/35 text-neutral-200 hover:text-white bg-white/[0.04] hover:bg-white/[0.08] transition-colors cursor-pointer"
              >
                <Key className="w-3.5 h-3.5 text-white" />
                <span>Reset Password</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  onClose();
                  onToggleStatus(member);
                }}
                className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-2 rounded-xl border border-white/15 hover:border-white/35 text-neutral-200 hover:text-white bg-white/[0.04] hover:bg-white/[0.08] transition-colors cursor-pointer"
              >
                {member.status === "active" ? (
                  <>
                    <Ban className="w-3.5 h-3.5 text-neutral-400" />
                    <span>Deactivate</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5 text-white" />
                    <span>Reactivate</span>
                  </>
                )}
              </button>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs sm:text-sm font-medium border border-white/15 text-neutral-300 hover:text-white bg-white/[0.03] transition-colors cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
