/**
 * Network and Sync Status Stores
 *
 * Nanostores for reactive network and sync status across the application.
 * Framework-agnostic stores that work with Astro, SolidJS, and other frameworks.
 *
 * Requirements:
 * - 6.3: Display clear offline status indication
 * - 15.4: Display last sync timestamp and online/offline status
 */

import { atom, computed } from 'nanostores'
import { syncManager } from '../offline/sync-manager'
import type { SyncEvent } from '../offline/sync-manager'

/**
 * Network status store
 */
export interface NetworkStatus {
  /** Whether the browser is currently online */
  online: boolean
  /** Timestamp of last status change */
  lastChanged: Date
}

/**
 * Sync status store
 */
export interface SyncStatus {
  /** Whether sync is currently in progress */
  syncing: boolean
  /** Number of items in the sync queue */
  queueCount: number
  /** Timestamp of last successful sync */
  lastSyncTime: Date | null
  /** Error message from last failed sync */
  error: string | null
  /** Number of items synced in last sync */
  lastSyncedCount: number
}

/**
 * Network status atom
 */
export const $networkStatus = atom<NetworkStatus>({
  online: typeof navigator !== 'undefined' ? navigator.onLine : true,
  lastChanged: new Date(),
})

/**
 * Sync status atom
 */
export const $syncStatus = atom<SyncStatus>({
  syncing: false,
  queueCount: 0,
  lastSyncTime: null,
  error: null,
  lastSyncedCount: 0,
})

/**
 * Computed store for human-readable status
 */
export const $connectionStatusText = computed($networkStatus, (status) => {
  return status.online ? 'online' : 'offline'
})

/**
 * Computed store for sync status text
 */
export const $syncStatusText = computed($syncStatus, (status) => {
  if (status.syncing) {
    return 'syncing'
  }
  if (status.error) {
    return 'error'
  }
  if (status.queueCount > 0) {
    return 'pending'
  }
  if (status.lastSyncTime) {
    return 'synced'
  }
  return 'idle'
})

/**
 * Initialize network and sync status monitoring
 *
 * Sets up event listeners and sync manager integration.
 * Should be called once on app initialization.
 */
export async function initializeStatusStores(): Promise<void> {
  console.log('[NetworkStatus] Initializing status stores...')

  // Initialize sync manager
  await syncManager.initialize()

  // Update network status from sync manager
  updateNetworkStatus()

  // Update sync status from sync manager
  await updateSyncStatus()

  // Listen to sync manager events
  syncManager.addEventListener(handleSyncEvent)

  // Set up periodic queue count updates (every 5 seconds)
  if (typeof window !== 'undefined') {
    setInterval(async () => {
      const queueCount = await syncManager.getQueueCount()
      $syncStatus.set({
        ...$syncStatus.get(),
        queueCount,
      })
    }, 5000)
  }

  // Load last sync time from IndexedDB preferences
  if (typeof window !== 'undefined') {
    try {
      const { offlineStorage } = await import('../offline/storage')
      const lastSyncTimeStr = await offlineStorage.getPreference('lastSyncTime')
      if (lastSyncTimeStr && typeof lastSyncTimeStr === 'string') {
        $syncStatus.set({
          ...$syncStatus.get(),
          lastSyncTime: new Date(lastSyncTimeStr),
        })
      }
    } catch (error) {
      console.warn('[NetworkStatus] Could not load last sync time:', error)
    }
  }

  console.log('[NetworkStatus] Status stores initialized')
}

/**
 * Update network status from sync manager
 */
function updateNetworkStatus(): void {
  const online = syncManager.getOnlineStatus()
  $networkStatus.set({
    online,
    lastChanged: new Date(),
  })
}

/**
 * Update sync status from sync manager
 */
async function updateSyncStatus(): Promise<void> {
  const syncing = syncManager.getSyncingStatus()
  const queueCount = await syncManager.getQueueCount()

  $syncStatus.set({
    ...$syncStatus.get(),
    syncing,
    queueCount,
  })
}

/**
 * Handle sync manager events
 */
function handleSyncEvent(event: SyncEvent): void {
  console.log('[NetworkStatus] Sync event:', event.type)

  switch (event.type) {
    case 'network-change':
      updateNetworkStatus()
      updateSyncStatus()
      break

    case 'sync-start':
      $syncStatus.set({
        ...$syncStatus.get(),
        syncing: true,
        error: null,
      })
      break

    case 'sync-success':
      $syncStatus.set({
        ...$syncStatus.get(),
        syncing: false,
        error: null,
        lastSyncTime: event.timestamp,
        lastSyncedCount: event.itemsSynced ?? 0,
      })
      // Persist last sync time to IndexedDB
      persistLastSyncTime(event.timestamp)
      break

    case 'sync-error':
      $syncStatus.set({
        ...$syncStatus.get(),
        syncing: false,
        error: event.error ?? 'Unknown error',
      })
      break

    case 'sync-complete':
      $syncStatus.set({
        ...$syncStatus.get(),
        syncing: false,
        queueCount: event.queueCount ?? 0,
      })
      break
  }
}

/**
 * Persist last sync time to IndexedDB
 */
async function persistLastSyncTime(timestamp: Date): Promise<void> {
  try {
    const { offlineStorage } = await import('../offline/storage')
    await offlineStorage.setPreference('lastSyncTime', timestamp.toISOString())
  } catch (error) {
    console.warn('[NetworkStatus] Could not persist last sync time:', error)
  }
}

/**
 * Manually trigger sync (for manual sync button)
 *
 * @returns Number of items synced
 * @throws Error if offline or sync fails
 */
export async function triggerManualSync(): Promise<number> {
  if (!$networkStatus.get().online) {
    throw new Error('Cannot sync while offline')
  }

  return await syncManager.manualSync()
}

/**
 * Get formatted time since last sync
 *
 * @returns Human-readable string like "2 minutes ago" or "Never"
 */
export function getTimeSinceLastSync(): string {
  const { lastSyncTime } = $syncStatus.get()

  if (!lastSyncTime) {
    return 'Never'
  }

  const now = new Date()
  const diffMs = now.getTime() - lastSyncTime.getTime()
  const diffSeconds = Math.floor(diffMs / 1000)
  const diffMinutes = Math.floor(diffSeconds / 60)
  const diffHours = Math.floor(diffMinutes / 60)
  const diffDays = Math.floor(diffHours / 24)

  if (diffSeconds < 60) {
    return 'Just now'
  } else if (diffMinutes < 60) {
    return `${diffMinutes} minute${diffMinutes > 1 ? 's' : ''} ago`
  } else if (diffHours < 24) {
    return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`
  } else {
    return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`
  }
}

/**
 * Cleanup status stores (call on app unmount)
 */
export function destroyStatusStores(): void {
  syncManager.destroy()
  console.log('[NetworkStatus] Status stores destroyed')
}

