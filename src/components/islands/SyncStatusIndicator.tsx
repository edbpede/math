/**
 * Sync Status Indicator Component
 *
 * A compact, expandable indicator showing online/offline status,
 * sync progress, queue count, and manual sync controls.
 *
 * Requirements:
 * - 6.3: Display clear offline status indication
 * - 15.4: Display last sync timestamp and online/offline status
 */

import { Show, createSignal, onMount, onCleanup, createEffect } from "solid-js";
import { useStore } from "@nanostores/solid";
import {
  $networkStatus,
  $syncStatus,
  $syncStatusText,
  initializeStatusStores,
  triggerManualSync,
  getTimeSinceLastSync,
} from "../../lib/stores/network-status";
import { $t } from "../../lib/i18n";

export default function SyncStatusIndicator() {
  const [expanded, setExpanded] = createSignal(false);
  const [syncing, setSyncing] = createSignal(false);
  const [error, setError] = createSignal<string | null>(null);
  const [timeSinceSync, setTimeSinceSync] = createSignal("Never");

  const t = useStore($t);
  const networkStatus = useStore($networkStatus);
  const syncStatus = useStore($syncStatus);
  // const syncStatusText = useStore($syncStatusText)

  // Initialize status stores on mount
  onMount(async () => {
    try {
      await initializeStatusStores();
    } catch (err) {
      console.error("[SyncStatusIndicator] Failed to initialize:", err);
      setError("Initialization failed");
    }

    // Update time since last sync every 10 seconds
    const intervalId = setInterval(() => {
      setTimeSinceSync(getTimeSinceLastSync());
    }, 10000);

    onCleanup(() => clearInterval(intervalId));
  });

  // Update time since sync when sync status changes
  createEffect(() => {
    const status = syncStatus();
    if (status) {
      setTimeSinceSync(getTimeSinceLastSync());
    }
  });

  // Handle manual sync button click
  const handleManualSync = async () => {
    if (!networkStatus().online) {
      setError(t()("sync.errors.cannotSyncOffline"));
      return;
    }

    setSyncing(true);
    setError(null);

    try {
      const itemsSynced = await triggerManualSync();
      console.log(
        `[SyncStatusIndicator] Manual sync completed: ${itemsSynced} items`,
      );
      // Success - the store will update automatically
    } catch (err) {
      console.error("[SyncStatusIndicator] Manual sync failed:", err);
      setError(
        err instanceof Error ? err.message : t()("sync.errors.syncFailed"),
      );
    } finally {
      setSyncing(false);
    }
  };

  // Get status indicator color
  const getStatusColor = () => {
    if (!networkStatus().online) return "bg-red-500";
    if (syncStatus().syncing || syncing()) return "bg-yellow-500";
    if (syncStatus().error || error()) return "bg-orange-500";
    if (syncStatus().queueCount > 0) return "bg-blue-500";
    return "bg-green-500";
  };

  // Get status text
  const getStatusText = () => {
    if (!networkStatus().online) return t()("sync.status.offline");
    if (syncStatus().syncing || syncing()) return t()("sync.status.syncing");
    if (syncStatus().error || error()) return t()("sync.status.error");
    if (syncStatus().queueCount > 0) return t()("sync.status.pending");
    return t()("sync.status.online");
  };

  return (
    <div class="fixed bottom-4 right-4 z-50">
      {/* Compact indicator */}
      <button
        type="button"
        onClick={() => setExpanded(!expanded())}
        class="flex items-center gap-2 bg-white dark:bg-gray-800 rounded-lg shadow-lg px-3 py-2 transition-all hover:shadow-xl"
        aria-label="Sync status"
        aria-expanded={expanded()}
      >
        {/* Status dot */}
        <div
          class={`w-3 h-3 rounded-full ${getStatusColor()} ${syncStatus().syncing || syncing() ? "animate-pulse" : ""}`}
        />

        {/* Status text */}
        <span class="text-sm font-medium text-gray-700 dark:text-gray-300">
          {getStatusText()}
        </span>

        {/* Queue count badge */}
        <Show when={syncStatus().queueCount > 0}>
          <span class="bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-xs font-semibold px-2 py-0.5 rounded-full">
            {syncStatus().queueCount}
          </span>
        </Show>

        {/* Expand/collapse icon */}
        <svg
          class={`w-4 h-4 transition-transform ${expanded() ? "rotate-180" : ""}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>

      {/* Expanded details panel */}
      <Show when={expanded()}>
        <div class="absolute bottom-full right-0 mb-2 w-80 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 p-4">
          {/* Header */}
          <div class="flex items-center justify-between mb-3 pb-3 border-b border-gray-200 dark:border-gray-700">
            <h3 class="font-semibold text-gray-900 dark:text-white">
              {t()("sync.settings.title")}
            </h3>
          </div>

          {/* Network status */}
          <div class="mb-3">
            <div class="flex items-center gap-2 mb-1">
              <div
                class={`w-2 h-2 rounded-full ${networkStatus().online ? "bg-green-500" : "bg-red-500"}`}
              />
              <span class="text-sm text-gray-600 dark:text-gray-400">
                {networkStatus().online
                  ? t()("sync.status.online")
                  : t()("sync.status.offline")}
              </span>
            </div>
          </div>

          {/* Queue count */}
          <Show when={syncStatus().queueCount > 0}>
            <div class="mb-3 p-2 bg-blue-50 dark:bg-blue-900/20 rounded text-sm">
              <span class="text-blue-800 dark:text-blue-200">
                {t()("sync.ui.queueCount", { count: syncStatus().queueCount })}
              </span>
            </div>
          </Show>

          {/* Last sync time */}
          <div class="mb-3 text-sm text-gray-600 dark:text-gray-400">
            {t()("sync.ui.lastSync", { time: timeSinceSync() })}
          </div>

          {/* Error message */}
          <Show when={syncStatus().error || error()}>
            <div class="mb-3 p-2 bg-red-50 dark:bg-red-900/20 rounded text-sm text-red-800 dark:text-red-200">
              {syncStatus().error || error()}
            </div>
          </Show>

          {/* Manual sync button */}
          <Show when={networkStatus().online}>
            <button
              type="button"
              onClick={handleManualSync}
              disabled={
                syncStatus().syncing ||
                syncing() ||
                syncStatus().queueCount === 0
              }
              class="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-medium py-2 px-4 rounded transition-colors"
            >
              <Show
                when={syncStatus().syncing || syncing()}
                fallback={t()("sync.ui.manualSync")}
              >
                <span class="flex items-center justify-center gap-2">
                  <svg class="animate-spin h-4 w-4" viewBox="0 0 24 24">
                    <circle
                      class="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      stroke-width="4"
                      fill="none"
                    />
                    <path
                      class="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  {t()("sync.ui.syncInProgress")}
                </span>
              </Show>
            </button>
          </Show>

          {/* Offline message */}
          <Show when={!networkStatus().online}>
            <div class="text-sm text-center text-gray-500 dark:text-gray-400 py-2">
              {t()("sync.messages.offlineMode")}
            </div>
          </Show>
        </div>
      </Show>
    </div>
  );
}
