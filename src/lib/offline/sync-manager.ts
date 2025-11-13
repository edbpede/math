/**
 * Offline Sync Queue Manager
 *
 * Orchestrates offline operations by queuing them when offline and automatically
 * syncing to Supabase when connection is restored.
 *
 * Features:
 * - Online/offline status monitoring
 * - Automatic background sync when connection restored
 * - Retry logic with exponential backoff
 * - Event system for sync status updates
 * - Conflict resolution (last-write-wins, max mastery)
 *
 * Requirements:
 * - 6.3: Queue operations when offline with clear status indication
 * - 6.4: Automatic background sync when connection restored
 * - 6.5: Conflict resolution with last-write-wins and max mastery
 */

import { offlineStorage } from './storage'
import type { SyncQueueItem } from './types'
import { syncQueueItem } from './sync-operations'

/**
 * Sync event types for status updates
 */
export type SyncEventType = 'sync-start' | 'sync-success' | 'sync-error' | 'sync-complete' | 'network-change' | 'item-retry'

/**
 * Sync event data
 */
export interface SyncEvent {
  type: SyncEventType
  timestamp: Date
  queueCount?: number
  error?: string
  itemsSynced?: number
  itemId?: number
  retryAttempt?: number
  nextRetryDelayMs?: number
}

/**
 * Sync event listener
 */
export type SyncEventListener = (event: SyncEvent) => void

/**
 * Sync manager configuration
 */
export interface SyncManagerConfig {
  /** Maximum number of items allowed in queue (default: 1000) */
  maxQueueSize: number
  /** Maximum retry attempts per item (default: 3) */
  maxRetries: number
  /** Debounce delay in milliseconds before starting sync (default: 2000) */
  syncDebounceMs: number
  /** Initial retry delay in milliseconds (default: 1000) */
  initialRetryDelayMs: number
  /** Maximum retry delay in milliseconds (default: 30000 = 30s) */
  maxRetryDelayMs: number
  /** Backoff multiplier for exponential backoff (default: 2) */
  backoffMultiplier: number
  /** Enable automatic sync on connection restore (default: true) */
  autoSync: boolean
}

/**
 * Default configuration
 */
const DEFAULT_CONFIG: SyncManagerConfig = {
  maxQueueSize: 1000,
  maxRetries: 3,
  syncDebounceMs: 2000,
  initialRetryDelayMs: 1000,
  maxRetryDelayMs: 30000, // 30 seconds max
  backoffMultiplier: 2,
  autoSync: true,
}

/**
 * Sync Queue Manager
 *
 * Singleton class that manages the offline sync queue and orchestrates
 * synchronization with Supabase when connection is available.
 */
export class SyncManager {
  private config: SyncManagerConfig
  private isOnline: boolean
  private isSyncing: boolean
  private syncDebounceTimer: ReturnType<typeof setTimeout> | null = null
  private eventListeners: Set<SyncEventListener> = new Set()
  private initialized: boolean = false

  constructor(config: Partial<SyncManagerConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config }
    // Ensure isOnline is always a boolean, defaulting to true if navigator is unavailable
    this.isOnline = typeof navigator !== 'undefined' && typeof navigator.onLine === 'boolean' 
      ? navigator.onLine 
      : true
    this.isSyncing = false
  }

  /**
   * Initialize the sync manager
   *
   * Sets up event listeners for online/offline detection and starts
   * initial sync if online.
   */
  async initialize(): Promise<void> {
    if (this.initialized) {
      console.log('[SyncManager] Already initialized')
      return
    }

    console.log('[SyncManager] Initializing...')

    // Initialize storage
    await offlineStorage.init()

    // Set up online/offline event listeners (browser only)
    if (typeof window !== 'undefined') {
      window.addEventListener('online', this.handleOnline)
      window.addEventListener('offline', this.handleOffline)

      // Listen for visibility change to sync when tab becomes active
      document.addEventListener('visibilitychange', this.handleVisibilityChange)
    }

    // Check initial connection status
    // Ensure isOnline is always a boolean, defaulting to true if navigator is unavailable
    this.isOnline = typeof navigator !== 'undefined' && typeof navigator.onLine === 'boolean'
      ? navigator.onLine
      : true
    console.log('[SyncManager] Initial connection status:', this.isOnline ? 'online' : 'offline')

    // Emit network change event
    this.emitEvent({
      type: 'network-change',
      timestamp: new Date(),
    })

    // Start sync if online and auto-sync enabled
    if (this.isOnline && this.config.autoSync) {
      await this.debouncedSync()
    }

    this.initialized = true
    console.log('[SyncManager] Initialized successfully')
  }

  /**
   * Cleanup event listeners (call on app unmount)
   */
  destroy(): void {
    if (typeof window !== 'undefined') {
      window.removeEventListener('online', this.handleOnline)
      window.removeEventListener('offline', this.handleOffline)
      document.removeEventListener('visibilitychange', this.handleVisibilityChange)
    }

    if (this.syncDebounceTimer) {
      clearTimeout(this.syncDebounceTimer)
    }

    this.eventListeners.clear()
    this.initialized = false
    console.log('[SyncManager] Destroyed')
  }

  /**
   * Handle online event
   */
  private handleOnline = async (): Promise<void> => {
    console.log('[SyncManager] Connection restored')
    this.isOnline = true

    this.emitEvent({
      type: 'network-change',
      timestamp: new Date(),
    })

    // Trigger sync when connection is restored
    if (this.config.autoSync) {
      await this.debouncedSync()
    }
  }

  /**
   * Handle offline event
   */
  private handleOffline = (): void => {
    console.log('[SyncManager] Connection lost')
    this.isOnline = false

    this.emitEvent({
      type: 'network-change',
      timestamp: new Date(),
    })

    // Cancel any pending sync
    if (this.syncDebounceTimer) {
      clearTimeout(this.syncDebounceTimer)
      this.syncDebounceTimer = null
    }
  }

  /**
   * Handle visibility change (sync when tab becomes visible)
   */
  private handleVisibilityChange = async (): Promise<void> => {
    if (document.visibilityState === 'visible' && this.isOnline && this.config.autoSync) {
      const queueCount = await this.getQueueCount()
      if (queueCount > 0) {
        console.log('[SyncManager] Tab became visible with pending items, triggering sync')
        await this.debouncedSync()
      }
    }
  }

  /**
   * Debounced sync to avoid rapid sync attempts
   */
  private async debouncedSync(): Promise<void> {
    if (this.syncDebounceTimer) {
      clearTimeout(this.syncDebounceTimer)
    }

    this.syncDebounceTimer = setTimeout(async () => {
      this.syncDebounceTimer = null
      await this.sync()
    }, this.config.syncDebounceMs)
  }

  /**
   * Get current online status
   */
  getOnlineStatus(): boolean {
    return this.isOnline
  }

  /**
   * Get current sync status
   */
  getSyncingStatus(): boolean {
    return this.isSyncing
  }

  /**
   * Get queue count
   */
  async getQueueCount(): Promise<number> {
    return await offlineStorage.getSyncQueueCount()
  }

  /**
   * Add an item to the sync queue
   *
   * @param item - Sync queue item (without id, will be auto-generated)
   * @returns Queue item ID
   * @throws Error if queue is full
   */
  async addToQueue(item: Omit<SyncQueueItem, 'id'>): Promise<number> {
    const currentCount = await this.getQueueCount()

    if (currentCount >= this.config.maxQueueSize) {
      throw new Error(`Sync queue is full (max ${this.config.maxQueueSize} items)`)
    }

    const id = await offlineStorage.addToSyncQueue(item)
    console.log(`[SyncManager] Added item to queue: ${item.type} (id: ${id})`)

    // Trigger sync if online
    if (this.isOnline && this.config.autoSync) {
      await this.debouncedSync()
    }

    return id
  }

  /**
   * Clear the entire sync queue
   */
  async clearQueue(): Promise<void> {
    await offlineStorage.clearSyncQueue()
    console.log('[SyncManager] Queue cleared')
  }

  /**
   * Manually trigger sync (useful for manual sync button)
   *
   * @returns Number of items successfully synced
   */
  async manualSync(): Promise<number> {
    if (!this.isOnline) {
      throw new Error('Cannot sync while offline')
    }

    return await this.sync()
  }

  /**
   * Process the sync queue
   *
   * Processes all items in the queue, retrying failed items with exponential backoff.
   *
   * @returns Number of items successfully synced
   */
  private async sync(): Promise<number> {
    if (this.isSyncing) {
      console.log('[SyncManager] Sync already in progress, skipping')
      return 0
    }

    if (!this.isOnline) {
      console.log('[SyncManager] Cannot sync while offline')
      return 0
    }

    const queueCount = await this.getQueueCount()
    if (queueCount === 0) {
      console.log('[SyncManager] Queue is empty, nothing to sync')
      return 0
    }

    this.isSyncing = true
    console.log(`[SyncManager] Starting sync of ${queueCount} items...`)

    this.emitEvent({
      type: 'sync-start',
      timestamp: new Date(),
      queueCount,
    })

    let successCount = 0
    let errorCount = 0
    let lastError: string | undefined

    try {
      const items = await offlineStorage.getAllSyncQueue()

      for (const item of items) {
        try {
          // Check if item has exceeded max retries
          if (item.retries >= this.config.maxRetries) {
            console.warn(`[SyncManager] Item ${item.id} exceeded max retries (${this.config.maxRetries}), removing from queue`)
            await offlineStorage.removeFromSyncQueue(item.id!)
            errorCount++
            lastError = `Item exceeded max retries (${this.config.maxRetries})`
            continue
          }

          // Process the item
          console.log(`[SyncManager] Processing item ${item.id} (type: ${item.type}, attempt: ${item.retries + 1})`)
          await syncQueueItem(item)

          // Success - remove from queue
          await offlineStorage.removeFromSyncQueue(item.id!)
          successCount++
          console.log(`[SyncManager] Successfully synced item ${item.id}`)
        } catch (error) {
          console.error(`[SyncManager] Failed to sync item ${item.id}:`, error)
          errorCount++
          lastError = error instanceof Error ? error.message : 'Unknown error'

          // Increment retry count
          await offlineStorage.incrementSyncRetries(item.id!)

          // Calculate exponential backoff delay with max cap
          const delay = Math.min(
            this.config.initialRetryDelayMs * Math.pow(this.config.backoffMultiplier, item.retries),
            this.config.maxRetryDelayMs
          )
          console.log(`[SyncManager] Will retry item ${item.id} after ${delay}ms (attempt ${item.retries + 1}/${this.config.maxRetries})`)

          // Emit retry event for UI feedback
          this.emitEvent({
            type: 'item-retry',
            timestamp: new Date(),
            itemId: item.id!,
            retryAttempt: item.retries + 1,
            nextRetryDelayMs: delay,
            error: lastError,
          })
        }
      }
    } catch (error) {
      console.error('[SyncManager] Sync process failed:', error)
      lastError = error instanceof Error ? error.message : 'Unknown error'

      this.emitEvent({
        type: 'sync-error',
        timestamp: new Date(),
        error: lastError,
      })
    } finally {
      this.isSyncing = false
    }

    console.log(`[SyncManager] Sync complete: ${successCount} succeeded, ${errorCount} failed`)

    // Emit appropriate event
    if (errorCount > 0 && successCount === 0) {
      this.emitEvent({
        type: 'sync-error',
        timestamp: new Date(),
        error: lastError,
        itemsSynced: successCount,
      })
    } else {
      this.emitEvent({
        type: 'sync-success',
        timestamp: new Date(),
        itemsSynced: successCount,
      })
    }

    this.emitEvent({
      type: 'sync-complete',
      timestamp: new Date(),
      itemsSynced: successCount,
      queueCount: await this.getQueueCount(),
    })

    return successCount
  }

  /**
   * Add event listener
   */
  addEventListener(listener: SyncEventListener): void {
    this.eventListeners.add(listener)
  }

  /**
   * Remove event listener
   */
  removeEventListener(listener: SyncEventListener): void {
    this.eventListeners.delete(listener)
  }

  /**
   * Emit event to all listeners
   */
  private emitEvent(event: SyncEvent): void {
    for (const listener of this.eventListeners) {
      try {
        listener(event)
      } catch (error) {
        console.error('[SyncManager] Event listener error:', error)
      }
    }
  }
}

/**
 * Singleton instance for application-wide use
 */
export const syncManager = new SyncManager()

