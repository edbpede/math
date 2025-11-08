/**
 * IndexedDB Storage Layer
 *
 * Typed wrapper for IndexedDB using the idb library. Provides offline storage
 * for exercise instances, sync queue, progress cache, and user preferences.
 *
 * Requirements:
 * - 6.2: Store exercise history and progress data in IndexedDB for offline access
 */

import { openDB, type IDBPDatabase } from 'idb'
import type {
  OfflineDatabase,
  ExerciseCacheEntry,
  SyncQueueItem,
  ProgressCacheEntry,
  ProgressCacheType,
  PreferenceEntry,
} from './types'
import type { ExerciseInstance } from '../exercises/types'

/**
 * Database configuration
 */
const DB_NAME = 'arithmetic-practice-offline'
const DB_VERSION = 1

/**
 * Custom error class for storage operations
 */
export class StorageError extends Error {
  constructor(
    message: string,
    public operation: string,
    public cause?: unknown
  ) {
    super(`Storage error during ${operation}: ${message}`)
    this.name = 'StorageError'
  }
}

/**
 * OfflineStorage class
 *
 * Provides typed access to IndexedDB stores for offline functionality.
 * Uses the idb library for a Promise-based interface.
 */
export class OfflineStorage {
  private dbPromise: Promise<IDBPDatabase<OfflineDatabase>> | null = null

  /**
   * Initialize the database connection
   *
   * Creates the database schema with 4 object stores and their indexes.
   * Safe to call multiple times - will reuse existing connection.
   */
  async init(): Promise<void> {
    if (this.dbPromise) {
      return
    }

    try {
      this.dbPromise = openDB<OfflineDatabase>(DB_NAME, DB_VERSION, {
        upgrade(db, oldVersion, newVersion, transaction) {
          console.log('[Storage] Upgrading database from version', oldVersion, 'to', newVersion)

          // Create exercises store
          if (!db.objectStoreNames.contains('exercises')) {
            const exerciseStore = db.createObjectStore('exercises', { keyPath: 'instance.id' })
            exerciseStore.createIndex('generatedAt', 'generatedAt')
            exerciseStore.createIndex('used', 'used')
            console.log('[Storage] Created exercises store')
          }

          // Create syncQueue store
          if (!db.objectStoreNames.contains('syncQueue')) {
            const syncStore = db.createObjectStore('syncQueue', { 
              keyPath: 'id', 
              autoIncrement: true 
            })
            syncStore.createIndex('timestamp', 'timestamp')
            syncStore.createIndex('type', 'type')
            console.log('[Storage] Created syncQueue store')
          }

          // Create progressCache store
          if (!db.objectStoreNames.contains('progressCache')) {
            db.createObjectStore('progressCache')
            console.log('[Storage] Created progressCache store')
          }

          // Create preferences store
          if (!db.objectStoreNames.contains('preferences')) {
            db.createObjectStore('preferences', { keyPath: 'key' })
            console.log('[Storage] Created preferences store')
          }
        },
        blocked() {
          console.warn('[Storage] Database upgrade blocked - close other tabs')
        },
        blocking() {
          console.warn('[Storage] This tab is blocking a database upgrade')
        },
      })

      await this.dbPromise
      console.log('[Storage] Database initialized successfully')
    } catch (error) {
      console.error('[Storage] Database initialization failed:', error)
      this.dbPromise = null
      throw new StorageError(
        'Failed to initialize database',
        'init',
        error
      )
    }
  }

  /**
   * Get database instance
   *
   * Ensures database is initialized before returning.
   */
  private async getDB(): Promise<IDBPDatabase<OfflineDatabase>> {
    if (!this.dbPromise) {
      await this.init()
    }
    return this.dbPromise!
  }

  /**
   * Check if IndexedDB is available
   */
  static isAvailable(): boolean {
    try {
      return typeof indexedDB !== 'undefined'
    } catch {
      return false
    }
  }

  /**
   * Close the database connection
   */
  async close(): Promise<void> {
    if (this.dbPromise) {
      const db = await this.dbPromise
      db.close()
      this.dbPromise = null
      console.log('[Storage] Database connection closed')
    }
  }

  /**
   * Clear all data from the database (for testing/debugging)
   */
  async clearAll(): Promise<void> {
    try {
      const db = await this.getDB()
      const tx = db.transaction(['exercises', 'syncQueue', 'progressCache', 'preferences'], 'readwrite')
      
      await Promise.all([
        tx.objectStore('exercises').clear(),
        tx.objectStore('syncQueue').clear(),
        tx.objectStore('progressCache').clear(),
        tx.objectStore('preferences').clear(),
      ])
      
      await tx.done
      console.log('[Storage] All stores cleared')
    } catch (error) {
      throw new StorageError('Failed to clear all stores', 'clearAll', error)
    }
  }

  // ============================================================================
  // Exercise Cache Store Operations
  // ============================================================================

  /**
   * Add an exercise instance to the cache
   */
  async addExercise(instance: ExerciseInstance): Promise<void> {
    try {
      const db = await this.getDB()
      const entry: ExerciseCacheEntry = {
        instance,
        generatedAt: new Date(),
        used: false,
      }
      await db.put('exercises', entry)
    } catch (error) {
      throw new StorageError(
        `Failed to add exercise ${instance.id}`,
        'addExercise',
        error
      )
    }
  }

  /**
   * Get an exercise by ID
   */
  async getExercise(id: string): Promise<ExerciseCacheEntry | undefined> {
    try {
      const db = await this.getDB()
      return await db.get('exercises', id)
    } catch (error) {
      throw new StorageError(
        `Failed to get exercise ${id}`,
        'getExercise',
        error
      )
    }
  }

  /**
   * Get all unused (not yet presented to user) exercises
   *
   * @param limit - Maximum number of exercises to return
   */
  async getUnusedExercises(limit?: number): Promise<ExerciseInstance[]> {
    try {
      const db = await this.getDB()
      const store = db.transaction('exercises').objectStore('exercises')
      // Get all entries and filter because fake-indexeddb may not support boolean keys in IDBKeyRange
      const allEntries = await store.getAll()
      const unusedEntries = allEntries.filter(entry => entry.used === false)
      const limitedEntries = limit ? unusedEntries.slice(0, limit) : unusedEntries
      return limitedEntries.map(entry => entry.instance)
    } catch (error) {
      throw new StorageError(
        'Failed to get unused exercises',
        'getUnusedExercises',
        error
      )
    }
  }

  /**
   * Mark an exercise as used
   */
  async markExerciseUsed(id: string): Promise<void> {
    try {
      const db = await this.getDB()
      const entry = await db.get('exercises', id)
      if (entry) {
        entry.used = true
        await db.put('exercises', entry)
      }
    } catch (error) {
      throw new StorageError(
        `Failed to mark exercise ${id} as used`,
        'markExerciseUsed',
        error
      )
    }
  }

  /**
   * Clear all exercises from cache
   */
  async clearExercises(): Promise<void> {
    try {
      const db = await this.getDB()
      await db.clear('exercises')
    } catch (error) {
      throw new StorageError(
        'Failed to clear exercises',
        'clearExercises',
        error
      )
    }
  }

  /**
   * Store multiple exercises in the pool (batch operation)
   *
   * @param instances - Array of exercise instances to store
   */
  async storeExercisePool(instances: ExerciseInstance[]): Promise<void> {
    try {
      const db = await this.getDB()
      const tx = db.transaction('exercises', 'readwrite')
      const store = tx.objectStore('exercises')

      for (const instance of instances) {
        const entry: ExerciseCacheEntry = {
          instance,
          generatedAt: new Date(),
          used: false,
        }
        await store.put(entry)
      }

      await tx.done
    } catch (error) {
      throw new StorageError(
        `Failed to store ${instances.length} exercises`,
        'storeExercisePool',
        error
      )
    }
  }

  /**
   * Get exercise pool statistics
   */
  async getExercisePoolStats(): Promise<{
    total: number;
    unused: number;
    used: number;
    oldestAge: number | null;
  }> {
    try {
      const db = await this.getDB()
      const allExercises = await db.getAll('exercises')

      const unused = allExercises.filter(entry => !entry.used).length
      const used = allExercises.filter(entry => entry.used).length

      let oldestAge: number | null = null
      if (allExercises.length > 0) {
        const oldestDate = Math.min(
          ...allExercises.map(entry => entry.generatedAt.getTime())
        )
        oldestAge = Math.floor((Date.now() - oldestDate) / (1000 * 60 * 60 * 24))
      }

      return {
        total: allExercises.length,
        unused,
        used,
        oldestAge,
      }
    } catch (error) {
      throw new StorageError(
        'Failed to get pool stats',
        'getExercisePoolStats',
        error
      )
    }
  }

  /**
   * Clean up old exercises
   *
   * @param cutoffDate - Remove exercises older than this date
   * @returns Number of exercises removed
   */
  async cleanupOldExercises(cutoffDate: Date): Promise<number> {
    try {
      const db = await this.getDB()
      const tx = db.transaction('exercises', 'readwrite')
      const store = tx.objectStore('exercises')
      const index = store.index('generatedAt')

      // Get exercises older than cutoff
      const oldExercises = await index.getAll(
        IDBKeyRange.upperBound(cutoffDate)
      )

      // Delete them
      for (const entry of oldExercises) {
        await store.delete(entry.instance.id)
      }

      await tx.done
      return oldExercises.length
    } catch (error) {
      throw new StorageError(
        'Failed to cleanup old exercises',
        'cleanupOldExercises',
        error
      )
    }
  }

  /**
   * Clear the entire exercise pool
   */
  async clearExercisePool(): Promise<void> {
    return this.clearExercises()
  }

  /**
   * Get count of cached exercises
   */
  async getExerciseCount(): Promise<{ total: number; unused: number }> {
    try {
      const db = await this.getDB()
      const total = await db.count('exercises')
      const allExercises = await db.getAll('exercises')
      const unused = allExercises.filter(entry => !entry.used).length
      return { total, unused }
    } catch (error) {
      throw new StorageError(
        'Failed to get exercise count',
        'getExerciseCount',
        error
      )
    }
  }

  // ============================================================================
  // Sync Queue Store Operations
  // ============================================================================

  /**
   * Add an item to the sync queue
   */
  async addToSyncQueue(item: Omit<SyncQueueItem, 'id'>): Promise<number> {
    try {
      const db = await this.getDB()
      return await db.add('syncQueue', item as SyncQueueItem)
    } catch (error) {
      throw new StorageError(
        'Failed to add item to sync queue',
        'addToSyncQueue',
        error
      )
    }
  }

  /**
   * Get all items from the sync queue
   */
  async getAllSyncQueue(): Promise<SyncQueueItem[]> {
    try {
      const db = await this.getDB()
      return await db.getAll('syncQueue')
    } catch (error) {
      throw new StorageError(
        'Failed to get all sync queue items',
        'getAllSyncQueue',
        error
      )
    }
  }

  /**
   * Get sync queue items by type
   */
  async getSyncQueueByType(type: SyncQueueItem['type']): Promise<SyncQueueItem[]> {
    try {
      const db = await this.getDB()
      const index = db.transaction('syncQueue').store.index('type')
      return await index.getAll(type)
    } catch (error) {
      throw new StorageError(
        `Failed to get sync queue items of type ${type}`,
        'getSyncQueueByType',
        error
      )
    }
  }

  /**
   * Remove an item from the sync queue
   */
  async removeFromSyncQueue(id: number): Promise<void> {
    try {
      const db = await this.getDB()
      await db.delete('syncQueue', id)
    } catch (error) {
      throw new StorageError(
        `Failed to remove item ${id} from sync queue`,
        'removeFromSyncQueue',
        error
      )
    }
  }

  /**
   * Increment retry count for a sync queue item
   */
  async incrementSyncRetries(id: number): Promise<void> {
    try {
      const db = await this.getDB()
      const item = await db.get('syncQueue', id)
      if (item) {
        item.retries += 1
        await db.put('syncQueue', item)
      }
    } catch (error) {
      throw new StorageError(
        `Failed to increment retries for item ${id}`,
        'incrementSyncRetries',
        error
      )
    }
  }

  /**
   * Clear the sync queue
   */
  async clearSyncQueue(): Promise<void> {
    try {
      const db = await this.getDB()
      await db.clear('syncQueue')
    } catch (error) {
      throw new StorageError(
        'Failed to clear sync queue',
        'clearSyncQueue',
        error
      )
    }
  }

  /**
   * Get count of items in sync queue
   */
  async getSyncQueueCount(): Promise<number> {
    try {
      const db = await this.getDB()
      return await db.count('syncQueue')
    } catch (error) {
      throw new StorageError(
        'Failed to get sync queue count',
        'getSyncQueueCount',
        error
      )
    }
  }

  // ============================================================================
  // Progress Cache Store Operations
  // ============================================================================

  /**
   * Set progress cache with expiration
   */
  async setProgressCache(
    type: ProgressCacheType,
    data: unknown,
    ttlMinutes: number = 60
  ): Promise<void> {
    try {
      const db = await this.getDB()
      const now = new Date()
      const expiresAt = new Date(now.getTime() + ttlMinutes * 60 * 1000)
      
      const entry: ProgressCacheEntry = {
        data,
        cachedAt: now,
        expiresAt,
      }
      
      await db.put('progressCache', entry, type)
    } catch (error) {
      throw new StorageError(
        `Failed to set progress cache for ${type}`,
        'setProgressCache',
        error
      )
    }
  }

  /**
   * Get progress cache entry
   */
  async getProgressCache(type: ProgressCacheType): Promise<ProgressCacheEntry | undefined> {
    try {
      const db = await this.getDB()
      return await db.get('progressCache', type)
    } catch (error) {
      throw new StorageError(
        `Failed to get progress cache for ${type}`,
        'getProgressCache',
        error
      )
    }
  }

  /**
   * Check if progress cache is expired
   */
  async isProgressCacheExpired(type: ProgressCacheType): Promise<boolean> {
    try {
      const entry = await this.getProgressCache(type)
      if (!entry) {
        return true
      }
      return new Date() > entry.expiresAt
    } catch (error) {
      throw new StorageError(
        `Failed to check cache expiration for ${type}`,
        'isProgressCacheExpired',
        error
      )
    }
  }

  /**
   * Get progress cache data if not expired
   */
  async getValidProgressCache(type: ProgressCacheType): Promise<unknown | null> {
    try {
      const entry = await this.getProgressCache(type)
      if (!entry) {
        return null
      }
      
      const isExpired = new Date() > entry.expiresAt
      if (isExpired) {
        // Clean up expired entry
        await this.clearProgressCache(type)
        return null
      }
      
      return entry.data
    } catch (error) {
      throw new StorageError(
        `Failed to get valid progress cache for ${type}`,
        'getValidProgressCache',
        error
      )
    }
  }

  /**
   * Clear specific progress cache
   */
  async clearProgressCache(type: ProgressCacheType): Promise<void> {
    try {
      const db = await this.getDB()
      await db.delete('progressCache', type)
    } catch (error) {
      throw new StorageError(
        `Failed to clear progress cache for ${type}`,
        'clearProgressCache',
        error
      )
    }
  }

  /**
   * Clear all progress caches
   */
  async clearAllProgressCache(): Promise<void> {
    try {
      const db = await this.getDB()
      await db.clear('progressCache')
    } catch (error) {
      throw new StorageError(
        'Failed to clear all progress cache',
        'clearAllProgressCache',
        error
      )
    }
  }

  // ============================================================================
  // Preferences Store Operations
  // ============================================================================

  /**
   * Set a preference
   */
  async setPreference(key: string, value: unknown): Promise<void> {
    try {
      const db = await this.getDB()
      const entry: PreferenceEntry = { key, value }
      await db.put('preferences', entry)
    } catch (error) {
      throw new StorageError(
        `Failed to set preference ${key}`,
        'setPreference',
        error
      )
    }
  }

  /**
   * Get a preference
   */
  async getPreference(key: string): Promise<unknown | undefined> {
    try {
      const db = await this.getDB()
      const entry = await db.get('preferences', key)
      return entry?.value
    } catch (error) {
      throw new StorageError(
        `Failed to get preference ${key}`,
        'getPreference',
        error
      )
    }
  }

  /**
   * Get all preferences
   */
  async getAllPreferences(): Promise<Record<string, unknown>> {
    try {
      const db = await this.getDB()
      const entries = await db.getAll('preferences')
      
      const preferences: Record<string, unknown> = {}
      for (const entry of entries) {
        preferences[entry.key] = entry.value
      }
      
      return preferences
    } catch (error) {
      throw new StorageError(
        'Failed to get all preferences',
        'getAllPreferences',
        error
      )
    }
  }

  /**
   * Remove a preference
   */
  async removePreference(key: string): Promise<void> {
    try {
      const db = await this.getDB()
      await db.delete('preferences', key)
    } catch (error) {
      throw new StorageError(
        `Failed to remove preference ${key}`,
        'removePreference',
        error
      )
    }
  }

  /**
   * Clear all preferences
   */
  async clearPreferences(): Promise<void> {
    try {
      const db = await this.getDB()
      await db.clear('preferences')
    } catch (error) {
      throw new StorageError(
        'Failed to clear preferences',
        'clearPreferences',
        error
      )
    }
  }
}

/**
 * Singleton instance for application-wide use
 */
export const offlineStorage = new OfflineStorage()

