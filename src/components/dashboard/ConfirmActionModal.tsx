"use client";

import React from "react";
import { Trash2, Ban, CheckCircle2, Loader2, X } from "lucide-react";
import { ExecutiveMember } from "./types";

export type ConfirmActionType = "delete" | "toggle-status";

interface ConfirmActionModalProps {
  isOpen: boolean;
  actionType: ConfirmActionType;
  member: ExecutiveMember | null;
  isLoading: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export default function ConfirmActionModal({
  isOpen,
  actionType,
  member,
  isLoading,
  onClose,
  onConfirm,
}: ConfirmActionModalProps) {
  if (!isOpen || !member) return null;

  const isDelete = actionType === "delete";
  const isDeactivating = !isDelete && member.status === "active";

  const title = isDelete
    ? "Delete Executive Account"
    : isDeactivating
    ? "Deactivate Executive Account"
    : "Reactivate Executive Account";

  const description = isDelete
    ? `Are you sure you want to permanently delete the account for "${member.fullName}" (${member.email})? This action will remove their Supabase authentication record, assigned role, and session history. This action cannot be undone.`
    : isDeactivating
    ? `Are you sure you want to deactivate the login account for "${member.fullName}" (${member.email})? The member will be barred from signing in until reactivated.`
    : `Reactivate login access for "${member.fullName}" (${member.email})? The member will regain access to sign in with their existing credentials.`;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200"
    >
      <div className="relative w-full max-w-md bg-[#101014] border border-white/15 rounded-2xl shadow-2xl overflow-hidden flex flex-col my-auto">
        <div className="p-6 space-y-4">
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-2xl shrink-0 bg-white/[0.08] text-white border border-white/20 shadow-[0_0_15px_rgba(255,255,255,0.12)]">
              {isDelete ? (
                <Trash2 className="w-6 h-6" />
              ) : isDeactivating ? (
                <Ban className="w-6 h-6" />
              ) : (
                <CheckCircle2 className="w-6 h-6" />
              )}
            </div>

            <div className="flex-1 min-w-0">
              <h2 id="confirm-title" className="text-base font-bold text-white tracking-tight">
                {title}
              </h2>
              <p className="text-xs text-neutral-400 mt-1.5 leading-relaxed">
                {description}
              </p>
            </div>

            <button
              onClick={onClose}
              disabled={isLoading}
              className="text-neutral-400 hover:text-white p-1 rounded-lg cursor-pointer"
              aria-label="Close"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Member Card preview */}
          <div className="p-3.5 rounded-xl bg-[#0a0a0e] border border-white/10 text-xs font-mono">
            <div className="text-white font-semibold truncate">{member.fullName}</div>
            <div className="text-neutral-400 truncate">{member.email}</div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/10">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="px-4 py-2 rounded-xl text-xs sm:text-sm font-medium border border-white/15 hover:border-white/30 text-neutral-300 hover:text-white bg-white/[0.03] transition-colors disabled:opacity-50 cursor-pointer"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={onConfirm}
              disabled={isLoading}
              className="px-5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all disabled:opacity-50 flex items-center gap-2 cursor-pointer shadow-[0_0_20px_rgba(255,255,255,0.2)] bg-white text-black hover:bg-neutral-200"
            >
              {isLoading && <Loader2 className="w-4 h-4 animate-spin text-black" />}
              <span>
                {isDelete
                  ? "Confirm Deletion"
                  : isDeactivating
                  ? "Deactivate Account"
                  : "Reactivate Account"}
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
