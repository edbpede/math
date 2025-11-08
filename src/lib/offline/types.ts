/**
 * TypeScript types for offline functionality
 *
 * Defines interfaces for service worker status, cache configuration,
 * and offline data structures.
 */

/**
 * Cache configuration for service worker
 */
export interface CacheConfig {
  /** Cache version number (increment to invalidate all caches) */
  version: number
  /** Named cache buckets */
  caches: {
    /** Static assets cache (HTML, CSS, JS, fonts) */
    static: string
    /** Exercise templates cache */
    templates: string
    /** Runtime cache for dynamic content */
    runtime: string
  }
  /** List of assets to pre-cache during installation */
  precacheAssets: string[]
}

/**
 * Service worker registration status
 */
export interface ServiceWorkerStatus {
  /** Whether service worker is registered */
  registered: boolean
  /** Whether service worker is currently installing */
  installing: boolean
  /** Whether an updated service worker is waiting to activate */
  waiting: boolean
  /** Whether service worker is active and controlling pages */
  active: boolean
  /** Error message if registration failed */
  error?: string
}

/**
 * Network status
 */
export interface NetworkStatus {
  /** Whether the browser is currently online */
  online: boolean
  /** Timestamp of last status change */
  lastChanged: Date
}

/**
 * Cache strategy types
 */
export type CacheStrategy =
  | 'cache-first'      // Cache first, fallback to network
  | 'network-first'    // Network first, fallback to cache
  | 'cache-only'       // Cache only (fail if not cached)
  | 'network-only'     // Network only (never cache)
  | 'stale-while-revalidate' // Serve from cache, update in background

/**
 * Cache entry metadata
 */
export interface CacheEntry {
  /** Cached request URL */
  url: string
  /** Timestamp when cached */
  cachedAt: Date
  /** Cache expiration date (optional) */
  expiresAt?: Date
  /** Cache strategy used */
  strategy: CacheStrategy
}

/**
 * Service worker message types
 */
export interface ServiceWorkerMessage {
  /** Message type identifier */
  type: 'SKIP_WAITING' | 'CACHE_UPDATED' | 'CLIENTS_CLAIMED'
  /** Optional message payload */
  payload?: unknown
}

/**
 * Asset manifest entry generated at build time
 */
export interface AssetManifestEntry {
  /** Asset path relative to site root */
  path: string
  /** Asset file size in bytes */
  size: number
  /** Asset MIME type */
  type: string
  /** Whether this is a critical asset (should be pre-cached) */
  critical: boolean
}

/**
 * Complete asset manifest generated at build time
 */
export interface AssetManifest {
  /** Build version/timestamp */
  version: string
  /** Generated timestamp */
  generatedAt: string
  /** List of all assets */
  assets: AssetManifestEntry[]
}

/**
 * IndexedDB Storage Types
 *
 * Type definitions for offline data storage in IndexedDB.
 * Requirement 6.2: Store exercise history and progress data in IndexedDB
 */

import type { ExerciseInstance } from '../exercises/types'
import type { CompetencyProgress, SkillProgress, ExerciseAttempt } from '../mastery/types'

/**
 * Exercise cache entry for pre-generated exercise instances
 */
export interface ExerciseCacheEntry {
  /** The cached exercise instance */
  instance: ExerciseInstance
  /** Timestamp when the exercise was generated and cached */
  generatedAt: Date
  /** Whether this exercise has been used (presented to user) */
  used: boolean
}

/**
 * Sync queue item types (discriminated union)
 */
export type SyncQueueItemType = 'exercise_complete' | 'progress_update' | 'session_end'

/**
 * Base sync queue item
 */
interface BaseSyncQueueItem {
  /** Unique ID for the queue item (auto-generated) */
  id?: number
  /** Timestamp when item was added to queue */
  timestamp: Date
  /** Number of sync retry attempts */
  retries: number
}

/**
 * Exercise completion sync item
 */
export interface ExerciseCompleteSyncItem extends BaseSyncQueueItem {
  type: 'exercise_complete'
  data: ExerciseAttempt
}

/**
 * Progress update sync item
 */
export interface ProgressUpdateSyncItem extends BaseSyncQueueItem {
  type: 'progress_update'
  data: {
    userId: string
    competencyProgress?: CompetencyProgress[]
    skillsProgress?: SkillProgress[]
  }
}

/**
 * Session end sync item
 */
export interface SessionEndSyncItem extends BaseSyncQueueItem {
  type: 'session_end'
  data: {
    sessionId: string
    endedAt: Date
    totalExercises: number
    correctCount: number
    avgTimePerExerciseSeconds: number
  }
}

/**
 * Discriminated union of all sync queue item types
 */
export type SyncQueueItem = 
  | ExerciseCompleteSyncItem 
  | ProgressUpdateSyncItem 
  | SessionEndSyncItem

/**
 * Progress cache types
 */
export type ProgressCacheType = 'competency' | 'skills' | 'history'

/**
 * Progress cache entry with expiration
 */
export interface ProgressCacheEntry {
  /** The cached data (structure depends on cache type) */
  data: unknown
  /** Timestamp when data was cached */
  cachedAt: Date
  /** Timestamp when cache expires */
  expiresAt: Date
}

/**
 * User preference entry
 */
export interface PreferenceEntry {
  /** Preference key */
  key: string
  /** Preference value */
  value: unknown
}

/**
 * IndexedDB database schema
 *
 * Defines the structure of the offline database with 4 object stores.
 */
export interface OfflineDatabase {
  /** Exercise instance cache store */
  exercises: {
    key: string
    value: ExerciseCacheEntry
  }
  /** Sync queue store for pending operations */
  syncQueue: {
    key: number
    value: SyncQueueItem
  }
  /** Progress cache store */
  progressCache: {
    key: ProgressCacheType
    value: ProgressCacheEntry
  }
  /** User preferences store */
  preferences: {
    key: string
    value: PreferenceEntry
  }
}

