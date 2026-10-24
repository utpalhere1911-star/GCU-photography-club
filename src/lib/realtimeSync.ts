"use client";

import { getSupabaseBrowserClient } from "@/lib/supabase";
import { RealtimeChannel } from "@supabase/supabase-js";

export type SyncTable =
  | "activities"
  | "gallery_photos"
  | "team_members"
  | "gallery_likes"
  | "site_announcements";

export interface RealtimeChangePayload {
  eventType: "INSERT" | "UPDATE" | "DELETE" | "*";
  schema: string;
  table: string;
  commit_timestamp?: string;
  new?: Record<string, unknown>;
  old?: Record<string, unknown>;
}

export type RealtimeSyncCallback = (payload?: RealtimeChangePayload) => void;

interface ChannelRegistration {
  channel: RealtimeChannel;
  refCount: number;
  callbacks: Set<RealtimeSyncCallback>;
  isSubscribed: boolean;
  hasExperiencedDisconnect: boolean;
}

const channels = new Map<SyncTable, ChannelRegistration>();
let isGlobalLifecycleAttached = false;

/**
 * Triggers reconciliation callbacks across all currently active subscriptions.
 * Used when the browser reconnects or tab becomes visible after backgrounding.
 */
function reconcileAllActiveChannels() {
  channels.forEach((reg, table) => {
    reg.callbacks.forEach((cb) => {
      try {
        cb({
          eventType: "*",
          schema: "public",
          table,
        });
      } catch (err) {
        console.error(`Error in reconciliation callback for ${table}:`, err);
      }
    });
  });
}

function attachGlobalLifecycleListeners() {
  if (isGlobalLifecycleAttached || typeof window === "undefined") return;

  // 1. Tab visibility reconciliation (catches updates missed while tab was backgrounded)
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") {
      reconcileAllActiveChannels();
    }
  });

  // 2. Network online reconciliation (re-syncs after temporary network outage)
  window.addEventListener("online", () => {
    reconcileAllActiveChannels();
  });

  isGlobalLifecycleAttached = true;
}

/**
 * Subscribe to live PostgreSQL changes for a Supabase table.
 * Shared channel prevents duplicate WebSocket connections.
 * Automatically handles INSERT, UPDATE, DELETE events, reconnections, and unmounting.
 *
 * @param table Database table to subscribe to
 * @param onSync Callback invoked when changes occur or reconciliation is triggered
 * @returns Unsubscribe cleanup function
 */
export function subscribeToRealtimeTable(
  table: SyncTable,
  onSync: RealtimeSyncCallback
): () => void {
  if (typeof window === "undefined") {
    return () => {};
  }

  attachGlobalLifecycleListeners();

  const supabase = getSupabaseBrowserClient();
  if (!supabase) {
    return () => {};
  }

  let registration = channels.get(table);

  if (!registration) {
    const callbacks = new Set<RealtimeSyncCallback>();
    callbacks.add(onSync);

    const channelName = `realtime-sync-${table}`;
    const channel = supabase
      .channel(channelName)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: table,
        },
        (payload) => {
          const changePayload: RealtimeChangePayload = {
            eventType: payload.eventType as RealtimeChangePayload["eventType"],
            schema: payload.schema,
            table: payload.table,
            commit_timestamp: payload.commit_timestamp,
            new: payload.new as Record<string, unknown>,
            old: payload.old as Record<string, unknown>,
          };

          // Trigger all registered component callbacks with event payload
          callbacks.forEach((cb) => {
            try {
              cb(changePayload);
            } catch (err) {
              console.error(`Error in realtime callback for ${table}:`, err);
            }
          });
        }
      )
      .subscribe((status, err) => {
        const currentReg = channels.get(table);
        if (!currentReg) return;

        if (status === "SUBSCRIBED") {
          // If recovering from a previous disconnect/error, reconcile missed state immediately
          if (currentReg.hasExperiencedDisconnect) {
            currentReg.hasExperiencedDisconnect = false;
            callbacks.forEach((cb) => {
              try {
                cb({ eventType: "*", schema: "public", table });
              } catch (reconcileErr) {
                console.error(`Error in recovery callback for ${table}:`, reconcileErr);
              }
            });
          }
          currentReg.isSubscribed = true;
        } else if (status === "CHANNEL_ERROR" || status === "TIMED_OUT" || status === "CLOSED") {
          currentReg.hasExperiencedDisconnect = true;
          currentReg.isSubscribed = false;
          if (status === "CHANNEL_ERROR") {
            console.warn(`Realtime channel error on table "${table}":`, err || "Unknown error");
          }
        }
      });

    registration = {
      channel,
      refCount: 1,
      callbacks,
      isSubscribed: false,
      hasExperiencedDisconnect: false,
    };
    channels.set(table, registration);
  } else {
    registration.refCount += 1;
    registration.callbacks.add(onSync);
  }

  return () => {
    const reg = channels.get(table);
    if (!reg) return;

    reg.callbacks.delete(onSync);
    reg.refCount -= 1;

    if (reg.refCount <= 0) {
      supabase.removeChannel(reg.channel).catch(() => {});
      channels.delete(table);
    }
  };
}

/**
 * Manually request an immediate reconciliation refetch across any active subscribers for a table.
 */
export function reconcileTable(table: SyncTable) {
  const reg = channels.get(table);
  if (!reg) return;

  reg.callbacks.forEach((cb) => {
    try {
      cb({
        eventType: "*",
        schema: "public",
        table,
      });
    } catch (err) {
      console.error(`Error during manual reconcile on ${table}:`, err);
    }
  });
}
