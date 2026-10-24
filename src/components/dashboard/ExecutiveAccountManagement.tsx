"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  Users,
  UserPlus,
  Search,
  RefreshCw,
  Eye,
  KeyRound,
  Ban,
  CheckCircle2,
  Trash2,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { ExecutiveMember, formatToKolkata } from "./types";
import CreateExecutiveModal from "./CreateExecutiveModal";
import ExecutiveDetailsModal from "./ExecutiveDetailsModal";
import ResetPasswordModal from "./ResetPasswordModal";
import ConfirmActionModal, { ConfirmActionType } from "./ConfirmActionModal";

interface ExecutiveAccountManagementProps {
  currentAdminEmail?: string;
  onNotify?: (type: "success" | "error", message: string) => void;
}

export default function ExecutiveAccountManagement({
  onNotify,
}: ExecutiveAccountManagementProps) {
  const [members, setMembers] = useState<ExecutiveMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Search filter
  const [searchQuery, setSearchQuery] = useState("");

  // Modals state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [detailsMember, setDetailsMember] = useState<ExecutiveMember | null>(null);
  const [resetMember, setResetMember] = useState<ExecutiveMember | null>(null);

  // Confirm Action Modal
  const [confirmModalState, setConfirmModalState] = useState<{
    isOpen: boolean;
    actionType: ConfirmActionType;
    member: ExecutiveMember | null;
  }>({
    isOpen: false,
    actionType: "delete",
    member: null,
  });
  const [isActionLoading, setIsActionLoading] = useState(false);

  // Fetch accounts list
  const fetchMembers = useCallback(
    async (quiet = false) => {
      if (quiet) setIsRefreshing(true);
      setError(null);

      try {
        const res = await fetch("/api/admin/executives");
        const data = await res.json();

        if (!res.ok || !data.success) {
          throw new Error(data.error || "Failed to load executive accounts.");
        }

        setMembers(data.data || []);
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Failed to load accounts.";
        setError(msg);
        onNotify?.("error", msg);
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    [onNotify]
  );

  useEffect(() => {
    let isMounted = true;
    async function initLoad() {
      try {
        const res = await fetch("/api/admin/executives");
        const data = await res.json();
        if (isMounted) {
          if (res.ok && data.success && Array.isArray(data.data)) {
            setMembers(data.data);
          } else {
            setError(data.error || "Failed to load executive accounts.");
          }
        }
      } catch (err) {
        if (isMounted) {
          setError(err instanceof Error ? err.message : "Failed to load accounts.");
        }
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }
    initLoad();
    return () => {
      isMounted = false;
    };
  }, []);

  // Handle successful creation
  const handleCreatedSuccess = (newMember: ExecutiveMember, message: string) => {
    setIsCreateModalOpen(false);
    setMembers((prev) => [newMember, ...prev.filter((m) => m.id !== newMember.id)]);
    onNotify?.("success", message);
    fetchMembers(true);
  };

  // Handle successful password reset
  const handleResetSuccess = (message: string) => {
    setResetMember(null);
    onNotify?.("success", message);
  };

  // Open confirm action modal
  const handleOpenConfirm = (member: ExecutiveMember, actionType: ConfirmActionType) => {
    setConfirmModalState({
      isOpen: true,
      actionType,
      member,
    });
  };

  // Execute confirmed action (delete or toggle-status)
  const handleExecuteConfirm = async () => {
    const { actionType, member } = confirmModalState;
    if (!member) return;

    setIsActionLoading(true);

    try {
      if (actionType === "delete") {
        const res = await fetch(`/api/admin/executives?id=${member.id}`, {
          method: "DELETE",
        });
        const data = await res.json();

        if (!res.ok || !data.success) {
          throw new Error(data.error || "Failed to delete account.");
        }

        setMembers((prev) => prev.filter((m) => m.id !== member.id));
        onNotify?.("success", data.message || `Account for "${member.fullName}" deleted.`);
      } else if (actionType === "toggle-status") {
        const newStatus = member.status === "active" ? "disabled" : "active";
        const res = await fetch("/api/admin/executives", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: member.id,
            action: "toggle-status",
            status: newStatus,
          }),
        });
        const data = await res.json();

        if (!res.ok || !data.success) {
          throw new Error(data.error || "Failed to update account status.");
        }

        setMembers((prev) =>
          prev.map((m) => (m.id === member.id ? { ...m, status: newStatus } : m))
        );
        onNotify?.("success", data.message || `Account status updated to ${newStatus}.`);
      }

      setConfirmModalState({ isOpen: false, actionType: "delete", member: null });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Action failed.";
      onNotify?.("error", msg);
    } finally {
      setIsActionLoading(false);
    }
  };

  // Filtered members list
  const filteredMembers = useMemo(() => {
    if (!searchQuery.trim()) return members;
    const q = searchQuery.toLowerCase().trim();
    return members.filter(
      (m) =>
        m.fullName.toLowerCase().includes(q) ||
        m.email.toLowerCase().includes(q) ||
        m.status.toLowerCase().includes(q)
    );
  }, [members, searchQuery]);

  // Summary counts
  const totalCount = members.length;
  const activeCount = members.filter((m) => m.status === "active").length;
  const disabledCount = members.filter((m) => m.status === "disabled").length;

  return (
    <div className="space-y-6">
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-5 sm:p-6 rounded-2xl bg-[#101014] border border-white/10 shadow-[0_10px_30px_rgba(0,0,0,0.5)] relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-40 bg-radial from-white/[0.05] via-transparent to-transparent pointer-events-none" />
        <div className="space-y-1 relative z-10">
          <div className="flex items-center gap-2">
            <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">
              Executive Account Management
            </h2>
            <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-semibold bg-white/[0.08] text-white border border-white/20 uppercase tracking-wider">
              Admin Privilege
            </span>
          </div>
          <p className="text-xs text-neutral-400 max-w-2xl leading-relaxed">
            Create, monitor, and manage individual Supabase login credentials for Executive Members.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0 self-end sm:self-center relative z-10">
          <button
            onClick={() => fetchMembers(true)}
            disabled={isLoading || isRefreshing}
            className="p-2.5 rounded-xl border border-white/10 hover:border-white/30 text-neutral-400 hover:text-white bg-white/[0.03] hover:bg-white/[0.08] transition-colors cursor-pointer disabled:opacity-50"
            title="Refresh accounts directory"
            aria-label="Refresh accounts directory"
          >
            <RefreshCw
              className={`w-4 h-4 ${isRefreshing ? "animate-spin text-white" : ""}`}
            />
          </button>

          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="inline-flex items-center gap-2 bg-white text-black hover:bg-neutral-200 font-semibold px-4 py-2.5 rounded-xl text-xs sm:text-sm transition-all cursor-pointer shadow-[0_0_20px_rgba(255,255,255,0.2)] hover:shadow-[0_0_25px_rgba(255,255,255,0.35)]"
          >
            <UserPlus className="w-4 h-4" />
            <span>Create Executive Account</span>
          </button>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-xl bg-[#101014] border border-white/10 hover:border-white/20 transition-all flex items-center justify-between">
          <div>
            <span className="text-[11px] font-mono uppercase tracking-wider text-neutral-400 block">
              Total Executive Accounts
            </span>
            <span className="text-2xl font-bold text-white mt-1 block">
              {totalCount}
            </span>
          </div>
          <div className="p-2.5 rounded-xl bg-white/[0.06] text-white border border-white/15">
            <Users className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 rounded-xl bg-[#101014] border border-white/10 hover:border-white/20 transition-all flex items-center justify-between">
          <div>
            <span className="text-[11px] font-mono uppercase tracking-wider text-neutral-400 block">
              Active Login Access
            </span>
            <span className="text-2xl font-bold text-white mt-1 block">
              {activeCount}
            </span>
          </div>
          <div className="p-2.5 rounded-xl bg-white/[0.06] text-white border border-white/15">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 rounded-xl bg-[#101014] border border-white/10 hover:border-white/20 transition-all flex items-center justify-between">
          <div>
            <span className="text-[11px] font-mono uppercase tracking-wider text-neutral-400 block">
              Deactivated Accounts
            </span>
            <span className="text-2xl font-bold text-neutral-400 mt-1 block">
              {disabledCount}
            </span>
          </div>
          <div className="p-2.5 rounded-xl bg-white/[0.03] text-neutral-400 border border-white/10">
            <Ban className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Search and Action Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-500" />
          <input
            type="text"
            placeholder="Search accounts by name or email address..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#0a0a0e] border border-white/15 text-xs sm:text-sm rounded-xl pl-9 pr-3 py-2 text-white placeholder-neutral-500 focus:outline-none focus:border-white focus:ring-1 focus:ring-white/30 transition-all"
          />
        </div>

        <span className="text-xs font-mono text-neutral-400 self-center">
          Showing {filteredMembers.length} of {totalCount} account{totalCount === 1 ? "" : "s"}
        </span>
      </div>

      {/* Error state */}
      {error && (
        <div className="p-4 rounded-xl bg-white/[0.04] border border-white/20 text-neutral-200 text-xs sm:text-sm flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <AlertCircle className="w-4 h-4 text-white shrink-0" />
            <span>{error}</span>
          </div>
          <button
            onClick={() => fetchMembers()}
            className="text-xs font-semibold text-white underline hover:no-underline cursor-pointer"
          >
            Retry
          </button>
        </div>
      )}

      {/* Accounts Table */}
      <div className="rounded-2xl border border-white/10 bg-[#101014] overflow-hidden shadow-2xl">
        {isLoading ? (
          <div className="py-20 flex flex-col items-center justify-center space-y-3">
            <Loader2 className="w-7 h-7 animate-spin text-white" />
            <p className="text-xs font-mono text-neutral-400">
              Loading executive accounts directory...
            </p>
          </div>
        ) : filteredMembers.length === 0 ? (
          <div className="py-16 px-4 text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-white/[0.04] border border-white/10 flex items-center justify-center mx-auto text-neutral-400">
              <Users className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h3 className="text-sm font-semibold text-white">
                {searchQuery ? "No matching accounts found" : "No Executive Accounts Provisioned"}
              </h3>
              <p className="text-xs text-neutral-400 max-w-sm mx-auto">
                {searchQuery
                  ? "Try adjusting your search query."
                  : "Click 'Create Executive Account' above to provision login credentials for an executive member."}
              </p>
            </div>
            {!searchQuery && (
              <button
                onClick={() => setIsCreateModalOpen(true)}
                className="inline-flex items-center gap-2 bg-white text-black font-semibold text-xs px-4 py-2 rounded-xl transition-all cursor-pointer shadow-[0_0_15px_rgba(255,255,255,0.2)] hover:bg-neutral-200"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>Create First Executive Account</span>
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto dashboard-scrollbar">
            <table className="w-full text-left text-xs sm:text-sm border-collapse">
              <thead>
                <tr className="border-b border-white/10 bg-[#0c0c10] text-neutral-400 font-mono text-[11px] uppercase tracking-wider">
                  <th className="py-3.5 px-4 font-semibold">Executive Member</th>
                  <th className="py-3.5 px-4 font-semibold hidden md:table-cell">Status</th>
                  <th className="py-3.5 px-4 font-semibold hidden lg:table-cell">Created Date</th>
                  <th className="py-3.5 px-4 font-semibold hidden sm:table-cell">Last Login (IST)</th>
                  <th className="py-3.5 px-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filteredMembers.map((member) => (
                  <tr
                    key={member.id}
                    className="hover:bg-white/[0.03] transition-colors group"
                  >
                    {/* Full Name & Email */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-white/[0.08] border border-white/20 flex items-center justify-center text-white font-bold text-xs shrink-0 shadow-[0_0_10px_rgba(255,255,255,0.1)]">
                          {member.fullName.charAt(0) || "E"}
                        </div>
                        <div className="min-w-0">
                          <span className="font-semibold text-white block truncate">
                            {member.fullName}
                          </span>
                          <span className="text-xs text-neutral-400 font-mono block truncate">
                            {member.email}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Status Badge */}
                    <td className="py-3.5 px-4 hidden md:table-cell">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-mono font-medium ${
                          member.status === "active"
                            ? "bg-white/[0.08] text-white border border-white/20"
                            : "bg-white/[0.03] text-neutral-500 border border-white/10"
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            member.status === "active" ? "bg-white shadow-[0_0_6px_rgba(255,255,255,0.8)]" : "bg-neutral-600"
                          }`}
                        />
                        <span className="capitalize">{member.status}</span>
                      </span>
                    </td>

                    {/* Date Created */}
                    <td className="py-3.5 px-4 text-neutral-400 text-xs hidden lg:table-cell">
                      {formatToKolkata(member.createdAt)}
                    </td>

                    {/* Last Login */}
                    <td className="py-3.5 px-4 text-neutral-400 text-xs hidden sm:table-cell font-mono">
                      {formatToKolkata(member.lastSignInAt)}
                    </td>

                    {/* Actions Group */}
                    <td className="py-3.5 px-4 text-right">
                      <div className="inline-flex items-center gap-1.5">
                        {/* View Details */}
                        <button
                          onClick={() => setDetailsMember(member)}
                          className="p-1.5 rounded-lg border border-white/10 hover:border-white/30 text-neutral-400 hover:text-white bg-white/[0.04] hover:bg-white/[0.08] transition-colors cursor-pointer"
                          title="View account details"
                          aria-label={`View details for ${member.fullName}`}
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>

                        {/* Reset Password */}
                        <button
                          onClick={() => setResetMember(member)}
                          className="p-1.5 rounded-lg border border-white/10 hover:border-white/30 text-neutral-400 hover:text-white bg-white/[0.04] hover:bg-white/[0.08] transition-colors cursor-pointer"
                          title="Reset password"
                          aria-label={`Reset password for ${member.fullName}`}
                        >
                          <KeyRound className="w-3.5 h-3.5" />
                        </button>

                        {/* Toggle Active / Disabled */}
                        <button
                          onClick={() => handleOpenConfirm(member, "toggle-status")}
                          className="p-1.5 rounded-lg border border-white/15 hover:border-white/35 text-white hover:bg-white/[0.08] bg-white/[0.04] transition-colors cursor-pointer"
                          title={member.status === "active" ? "Deactivate account" : "Reactivate account"}
                          aria-label={member.status === "active" ? `Deactivate ${member.fullName}` : `Reactivate ${member.fullName}`}
                        >
                          {member.status === "active" ? (
                            <Ban className="w-3.5 h-3.5 text-neutral-400 hover:text-white" />
                          ) : (
                            <CheckCircle2 className="w-3.5 h-3.5 text-white" />
                          )}
                        </button>

                        {/* Delete Account */}
                        <button
                          onClick={() => handleOpenConfirm(member, "delete")}
                          className="p-1.5 rounded-lg border border-white/15 hover:border-white/35 text-neutral-400 hover:text-white bg-white/[0.04] hover:bg-white/[0.1] transition-colors cursor-pointer"
                          title="Delete account"
                          aria-label={`Delete account for ${member.fullName}`}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modals */}
      <CreateExecutiveModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={handleCreatedSuccess}
      />

      <ExecutiveDetailsModal
        isOpen={Boolean(detailsMember)}
        member={detailsMember}
        onClose={() => setDetailsMember(null)}
        onOpenResetPassword={(m) => setResetMember(m)}
        onToggleStatus={(m) => handleOpenConfirm(m, "toggle-status")}
      />

      <ResetPasswordModal
        isOpen={Boolean(resetMember)}
        member={resetMember}
        onClose={() => setResetMember(null)}
        onSuccess={handleResetSuccess}
      />

      <ConfirmActionModal
        isOpen={confirmModalState.isOpen}
        actionType={confirmModalState.actionType}
        member={confirmModalState.member}
        isLoading={isActionLoading}
        onClose={() =>
          setConfirmModalState({ isOpen: false, actionType: "delete", member: null })
        }
        onConfirm={handleExecuteConfirm}
      />
    </div>
  );
}
