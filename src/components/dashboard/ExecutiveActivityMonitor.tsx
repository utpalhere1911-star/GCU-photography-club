"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Activity as ActivityIcon,
  Clock,
  LogIn,
  LogOut,
  Users,
  RefreshCw,
  Filter,
  AlertCircle,
  Loader2,
  Calendar,
  ShieldCheck,
} from "lucide-react";
import {
  ExecutiveActivityReport,
  ExecutiveMember,
  ExecutiveSessionEvent,
  formatToKolkata,
} from "./types";

interface ExecutiveActivityMonitorProps {
  onNotify?: (type: "success" | "error", message: string) => void;
}

export default function ExecutiveActivityMonitor({
  onNotify,
}: ExecutiveActivityMonitorProps) {
  const [report, setReport] = useState<ExecutiveActivityReport | null>(null);
  const [membersList, setMembersList] = useState<ExecutiveMember[]>([]);
  const [selectedMemberId, setSelectedMemberId] = useState<string>("all");

  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch report data
  const fetchReport = useCallback(
    async (quiet = false) => {
      if (quiet) setIsRefreshing(true);
      setError(null);

      try {
        const url =
          selectedMemberId && selectedMemberId !== "all"
            ? `/api/admin/activity?userId=${encodeURIComponent(selectedMemberId)}`
            : "/api/admin/activity";

        const res = await fetch(url);
        const data = await res.json();

        if (!res.ok || !data.success) {
          throw new Error(data.error || "Failed to load executive activity report.");
        }

        setReport(data.data);
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Failed to load activity logs.";
        setError(msg);
        onNotify?.("error", msg);
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    [selectedMemberId, onNotify]
  );

  // Initial load
  useEffect(() => {
    let isMounted = true;

    async function initData() {
      try {
        const [execRes, actRes] = await Promise.all([
          fetch("/api/admin/executives").then((r) => r.json()).catch(() => null),
          fetch(
            selectedMemberId && selectedMemberId !== "all"
              ? `/api/admin/activity?userId=${encodeURIComponent(selectedMemberId)}`
              : "/api/admin/activity"
          ).then((r) => r.json()).catch(() => null),
        ]);

        if (!isMounted) return;

        if (execRes?.success && Array.isArray(execRes.data)) {
          setMembersList(execRes.data);
        }

        if (actRes?.success && actRes.data) {
          setReport(actRes.data);
        } else if (actRes && !actRes.success) {
          setError(actRes.error || "Failed to load executive activity report.");
        }
      } catch (err) {
        if (isMounted) {
          setError(err instanceof Error ? err.message : "Failed to load activity logs.");
        }
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    initData();

    return () => {
      isMounted = false;
    };
  }, [selectedMemberId]);

  const summary = report?.summary ?? {
    totalExecutiveMembers: 0,
    loginsLast5Days: 0,
    logoutsLast5Days: 0,
    activeOrIncompleteSessions: 0,
  };

  const events: ExecutiveSessionEvent[] = report?.events ?? [];

  return (
    <div className="space-y-6">
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-5 sm:p-6 rounded-2xl bg-[#101014] border border-white/10 shadow-[0_10px_30px_rgba(0,0,0,0.5)] relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-40 bg-radial from-white/[0.05] via-transparent to-transparent pointer-events-none" />
        <div className="space-y-1 relative z-10">
          <div className="flex items-center gap-2">
            <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">
              Executive Activity Monitoring
            </h2>
            <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-semibold bg-white/[0.08] text-white border border-white/20 uppercase tracking-wider">
              Rolling 5-Day Window
            </span>
          </div>
          <p className="text-xs text-neutral-400 max-w-2xl leading-relaxed">
            Real-time verification of executive login and logout sessions, active durations, and retention tracking. Sessions older than 5 days are automatically pruned.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0 self-end sm:self-center relative z-10">
          <button
            onClick={() => fetchReport(true)}
            disabled={isLoading || isRefreshing}
            className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl border border-white/10 hover:border-white/30 text-neutral-400 hover:text-white bg-white/[0.03] hover:bg-white/[0.08] transition-colors cursor-pointer disabled:opacity-50 text-xs font-medium"
            title="Refresh activity logs"
          >
            <RefreshCw
              className={`w-3.5 h-3.5 ${isRefreshing ? "animate-spin text-white" : ""}`}
            />
            <span>Refresh Activity</span>
          </button>
        </div>
      </div>

      {/* 4 Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Executive Members */}
        <div className="p-4 rounded-xl bg-[#101014] border border-white/10 hover:border-white/20 transition-all flex items-center justify-between">
          <div>
            <span className="text-[11px] font-mono uppercase tracking-wider text-neutral-400 block">
              Total Executive Members
            </span>
            <span className="text-2xl font-bold text-white mt-1 block">
              {summary.totalExecutiveMembers}
            </span>
          </div>
          <div className="p-2.5 rounded-xl bg-white/[0.06] text-white border border-white/15">
            <Users className="w-5 h-5" />
          </div>
        </div>

        {/* Card 2: Logins in Last 5 Days */}
        <div className="p-4 rounded-xl bg-[#101014] border border-white/10 hover:border-white/20 transition-all flex items-center justify-between">
          <div>
            <span className="text-[11px] font-mono uppercase tracking-wider text-neutral-400 block">
              Logins (Last 5 Days)
            </span>
            <span className="text-2xl font-bold text-white mt-1 block">
              {summary.loginsLast5Days}
            </span>
          </div>
          <div className="p-2.5 rounded-xl bg-white/[0.06] text-white border border-white/15">
            <LogIn className="w-5 h-5" />
          </div>
        </div>

        {/* Card 3: Completed Logouts */}
        <div className="p-4 rounded-xl bg-[#101014] border border-white/10 hover:border-white/20 transition-all flex items-center justify-between">
          <div>
            <span className="text-[11px] font-mono uppercase tracking-wider text-neutral-400 block">
              Completed Logouts
            </span>
            <span className="text-2xl font-bold text-white mt-1 block">
              {summary.logoutsLast5Days}
            </span>
          </div>
          <div className="p-2.5 rounded-xl bg-white/[0.06] text-white border border-white/15">
            <LogOut className="w-5 h-5" />
          </div>
        </div>

        {/* Card 4: Active or Incomplete Sessions */}
        <div className="p-4 rounded-xl bg-[#101014] border border-white/10 hover:border-white/20 transition-all flex items-center justify-between">
          <div>
            <span className="text-[11px] font-mono uppercase tracking-wider text-neutral-400 block">
              Active / Open Sessions
            </span>
            <span className="text-2xl font-bold text-neutral-200 mt-1 block">
              {summary.activeOrIncompleteSessions}
            </span>
          </div>
          <div className="p-2.5 rounded-xl bg-white/[0.06] text-white border border-white/15">
            <Clock className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Member Filter and Selector Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-3.5 rounded-xl bg-[#101014] border border-white/10">
        <div className="flex items-center gap-2.5 flex-1 max-w-md">
          <Filter className="w-4 h-4 text-neutral-400 shrink-0" />
          <span className="text-xs text-neutral-400 shrink-0 font-medium">Filter by Member:</span>
          <select
            value={selectedMemberId}
            onChange={(e) => setSelectedMemberId(e.target.value)}
            className="w-full bg-[#0a0a0e] border border-white/15 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-white focus:ring-1 focus:ring-white/30 transition-all cursor-pointer"
          >
            <option value="all">All Executive Members ({membersList.length})</option>
            {membersList.map((m) => (
              <option key={m.id} value={m.id}>
                {m.fullName} ({m.email})
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2 text-[11px] text-neutral-400 font-mono self-end sm:self-center">
          <Calendar className="w-3.5 h-3.5 text-neutral-500" />
          <span>Timestamps in Asia/Kolkata (IST)</span>
        </div>
      </div>

      {/* Error state */}
      {error && (
        <div className="p-4 rounded-xl bg-white/[0.04] border border-white/20 text-neutral-200 text-xs sm:text-sm flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <AlertCircle className="w-4 h-4 text-white shrink-0" />
            <span>{error}</span>
          </div>
          <button
            onClick={() => fetchReport()}
            className="text-xs font-semibold text-white underline hover:no-underline cursor-pointer"
          >
            Retry
          </button>
        </div>
      )}

      {/* Activity Table */}
      <div className="rounded-2xl border border-white/10 bg-[#101014] overflow-hidden shadow-2xl">
        {isLoading ? (
          <div className="py-20 flex flex-col items-center justify-center space-y-3">
            <Loader2 className="w-7 h-7 animate-spin text-white" />
            <p className="text-xs font-mono text-neutral-400">
              Querying rolling 5-day session activity...
            </p>
          </div>
        ) : events.length === 0 ? (
          <div className="py-16 px-4 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-white/[0.04] border border-white/10 flex items-center justify-center mx-auto text-neutral-400">
              <ActivityIcon className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h3 className="text-sm font-semibold text-white">
                No Login Activity in the Last 5 Days
              </h3>
              <p className="text-xs text-neutral-400 max-w-sm mx-auto">
                {selectedMemberId !== "all"
                  ? "This executive member has not recorded any login events in the 5-day rolling window."
                  : "No Executive Members have authenticated during the past 5 days. Events older than 5 days are automatically pruned."}
              </p>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto dashboard-scrollbar">
            <table className="w-full text-left text-xs sm:text-sm border-collapse">
              <thead>
                <tr className="border-b border-white/10 bg-[#0c0c10] text-neutral-400 font-mono text-[11px] uppercase tracking-wider">
                  <th className="py-3.5 px-4 font-semibold">Executive Member</th>
                  <th className="py-3.5 px-4 font-semibold">Login Time (IST)</th>
                  <th className="py-3.5 px-4 font-semibold hidden md:table-cell">Logout Time (IST)</th>
                  <th className="py-3.5 px-4 font-semibold">Session Duration</th>
                  <th className="py-3.5 px-4 font-semibold text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {events.map((event) => (
                  <tr
                    key={event.id}
                    className="hover:bg-white/[0.03] transition-colors group"
                  >
                    {/* Full Name & Email */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-white/[0.08] border border-white/20 flex items-center justify-center text-white font-bold text-xs shrink-0 shadow-[0_0_10px_rgba(255,255,255,0.1)]">
                          {event.fullName.charAt(0) || "E"}
                        </div>
                        <div className="min-w-0">
                          <span className="font-semibold text-white block truncate">
                            {event.fullName}
                          </span>
                          <span className="text-xs text-neutral-400 font-mono block truncate">
                            {event.email}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Login Timestamp */}
                    <td className="py-3.5 px-4 font-mono text-xs text-neutral-300">
                      <div className="flex items-center gap-1.5">
                        <LogIn className="w-3 h-3 text-white shrink-0" />
                        <span>{formatToKolkata(event.loginAt)}</span>
                      </div>
                    </td>

                    {/* Logout Timestamp */}
                    <td className="py-3.5 px-4 font-mono text-xs text-neutral-400 hidden md:table-cell">
                      {event.logoutAt ? (
                        <div className="flex items-center gap-1.5 text-neutral-300">
                          <LogOut className="w-3 h-3 text-neutral-400 shrink-0" />
                          <span>{formatToKolkata(event.logoutAt)}</span>
                        </div>
                      ) : (
                        <span className="text-neutral-600 italic">— (Active or Excluded)</span>
                      )}
                    </td>

                    {/* Duration */}
                    <td className="py-3.5 px-4 font-mono text-xs">
                      <span className="text-white font-medium">
                        {event.duration}
                      </span>
                    </td>

                    {/* Status Badge */}
                    <td className="py-3.5 px-4 text-right">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-mono uppercase tracking-wider font-semibold ${
                          event.status === "completed"
                            ? "bg-white/[0.08] text-white border border-white/20"
                            : event.status === "active"
                            ? "bg-white text-black font-bold shadow-[0_0_12px_rgba(255,255,255,0.4)]"
                            : "bg-white/[0.03] text-neutral-400 border border-white/10"
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            event.status === "completed"
                              ? "bg-white shadow-[0_0_6px_rgba(255,255,255,0.8)]"
                              : event.status === "active"
                              ? "bg-black"
                              : "bg-neutral-600"
                          }`}
                        />
                        <span>{event.status}</span>
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Retention Policy Footer Info Card */}
      <div className="p-4 rounded-xl bg-[#101014] border border-white/10 flex items-start gap-3 text-xs text-neutral-400 leading-relaxed">
        <ShieldCheck className="w-4 h-4 text-white shrink-0 mt-0.5" />
        <div>
          <strong className="text-white block font-medium mb-0.5">
            Automatic 5-Day Data Expiration
          </strong>
          Activity logs are stored in UTC and automatically cleared once they exceed 120 hours (5 days) from creation. No historical session activity is retained permanently, ensuring lightweight performance and member privacy.
        </div>
      </div>
    </div>
  );
}
