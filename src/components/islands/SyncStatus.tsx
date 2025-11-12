/**
 * SyncStatus Component
 *
 * Displays online/offline status and last sync timestamp for offline-capable PWA.
 * Shows sync status indicator in footer per Requirement 15.4.
 *
 * Requirements:
 * - 15.4: Display last sync timestamp and online/offline status clearly in UI
 * - 6.3: Show offline status indication
 * - 6.4: Indicate when sync is in progress
 */

import { createSignal, onMount, onCleanup, Show } from "solid-js";
import { useStore } from "@nanostores/solid";
import { $t } from "@/lib/i18n";

export interface SyncStatusProps {
  /** Optional CSS class for styling */
  class?: string;
  /** Show manual sync button (only for authenticated users) */
  showSyncButton?: boolean;
}

/**
 * SyncStatus - Displays connection status and sync information
 *
 * Features:
 * - Real-time online/offline detection
 * - Last sync timestamp with relative time formatting
 * - Syncing animation indicator
 * - Manual sync trigger button (optional)
 * - Accessible with ARIA live regions
 *
 * @example
 * ```tsx
 * <SyncStatus showSyncButton={true} />
 * ```
 */
export default function SyncStatus(props: SyncStatusProps) {
  const t = useStore($t);
  const [isOnline, setIsOnline] = createSignal(true);
  const [isSyncing, setIsSyncing] = createSignal(false);
  const [lastSync, setLastSync] = createSignal<Date | null>(null);
  const [relativeTime, setRelativeTime] = createSignal<string>("");

  /**
   * Update online/offline status
   */
  const updateOnlineStatus = () => {
    if (typeof navigator !== "undefined") {
      setIsOnline(navigator.onLine);
    }
  };

  /**
   * Format relative time (e.g., "2 minutes ago")
   */
  const formatRelativeTime = (date: Date): string => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffSeconds = Math.floor(diffMs / 1000);
    const diffMinutes = Math.floor(diffSeconds / 60);
    const diffHours = Math.floor(diffMinutes / 60);
    const diffDays = Math.floor(diffHours / 24);

    const translations = t();

    if (diffSeconds < 60) {
      return translations("common.time.justNow");
    } else if (diffMinutes < 60) {
      return `${diffMinutes} ${translations("common.time.minutes")} ${translations("common.time.ago")}`;
    } else if (diffHours < 24) {
      return `${diffHours} ${translations("common.time.hours")} ${translations("common.time.ago")}`;
    } else {
      return `${diffDays} ${translations("common.time.days")} ${translations("common.time.ago")}`;
    }
  };

  /**
   * Update relative time display
   */
  const updateRelativeTime = () => {
    const sync = lastSync();
    if (sync) {
      setRelativeTime(formatRelativeTime(sync));
    }
  };

  /**
   * Manual sync trigger
   */
  const handleSyncClick = async () => {
    if (isSyncing() || !isOnline()) return;

    setIsSyncing(true);
    try {
      // Import sync manager dynamically to avoid SSR issues
      const { triggerManualSync } = await import("@/lib/stores/network-status");
      await triggerManualSync();
      setLastSync(new Date());
    } catch (error) {
      console.error("Sync failed:", error);
    } finally {
      setIsSyncing(false);
    }
  };

  onMount(() => {
    if (typeof window === "undefined") {
      return;
    }

    // Set initial online status
    updateOnlineStatus();

    // Listen for online/offline events
    window.addEventListener("online", updateOnlineStatus);
    window.addEventListener("offline", updateOnlineStatus);

    // Initialize last sync from localStorage if available
    if (typeof localStorage !== "undefined") {
      const storedSync = localStorage.getItem("lastSyncTimestamp");
      if (storedSync) {
        setLastSync(new Date(storedSync));
      }
    }

    // Update relative time every 30 seconds
    const intervalId = setInterval(updateRelativeTime, 30000);
    updateRelativeTime();

    // Listen for custom sync events
    const handleSyncStart = () => setIsSyncing(true);
    const handleSyncComplete = (event: CustomEvent) => {
      setIsSyncing(false);
      const timestamp = new Date(event.detail.timestamp || Date.now());
      setLastSync(timestamp);
      if (typeof localStorage !== "undefined") {
        localStorage.setItem("lastSyncTimestamp", timestamp.toISOString());
      }
    };

    window.addEventListener("sync:start", handleSyncStart as EventListener);
    window.addEventListener(
      "sync:complete",
      handleSyncComplete as EventListener,
    );

    onCleanup(() => {
      if (typeof window !== "undefined") {
        window.removeEventListener("online", updateOnlineStatus);
        window.removeEventListener("offline", updateOnlineStatus);
        window.removeEventListener(
          "sync:start",
          handleSyncStart as EventListener,
        );
        window.removeEventListener(
          "sync:complete",
          handleSyncComplete as EventListener,
        );
      }
      clearInterval(intervalId);
    });
  });

  const statusText = () => {
    if (isSyncing()) return t()("common.status.syncing");
    if (!isOnline()) return t()("common.status.offline");
    return t()("common.status.online");
  };

  const statusColor = () => {
    if (isSyncing()) return "text-blue-600";
    if (!isOnline()) return "text-gray-500";
    return "text-green-600";
  };

  const dotColor = () => {
    if (isSyncing()) return "bg-blue-600";
    if (!isOnline()) return "bg-gray-400";
    return "bg-green-600";
  };

  return (
    <div
      class={`sync-status flex items-center gap-3 ${props.class || ""}`}
      role="status"
      aria-live="polite"
      aria-atomic="true"
    >
      {/* Status indicator with dot */}
      <div class="flex items-center gap-2">
        {/* Animated dot for syncing state */}
        <div class="relative">
          <span
            class={`inline-block w-2 h-2 rounded-full ${dotColor()}`}
            aria-hidden="true"
          />
          <Show when={isSyncing()}>
            <span
              class="absolute inset-0 w-2 h-2 rounded-full bg-blue-600 animate-ping opacity-75"
              aria-hidden="true"
            />
          </Show>
        </div>

        {/* Status text */}
        <span class={`text-sm font-medium ${statusColor()}`}>
          {statusText()}
        </span>
      </div>

      {/* Last sync timestamp */}
      <Show when={lastSync() && !isSyncing()}>
        <span class="text-sm text-gray-600 hidden sm:inline">
          {t()("common.status.synced")} {relativeTime()}
        </span>
      </Show>

      {/* Manual sync button */}
      <Show when={props.showSyncButton && isOnline()}>
        <button
          type="button"
          onClick={handleSyncClick}
          disabled={isSyncing()}
          class="btn-ghost text-xs touch-target"
          aria-label={t()("common.status.syncing")}
          title={t()("common.status.syncing")}
        >
          <svg
            class={`w-4 h-4 ${isSyncing() ? "animate-spin" : ""}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            aria-hidden="true"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
            />
          </svg>
        </button>
      </Show>
    </div>
  );
}
