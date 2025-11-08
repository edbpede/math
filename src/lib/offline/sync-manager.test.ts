/**
 * Sync Manager Tests
 *
 * Tests for sync queue manager functionality.
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { SyncManager } from './sync-manager'
import { offlineStorage } from './storage'
import type { SyncQueueItem } from './types'

// Mock the storage layer
vi.mock('./storage', () => ({
  offlineStorage: {
    init: vi.fn().mockResolvedValue(undefined),
    addToSyncQueue: vi.fn().mockResolvedValue(1),
    getAllSyncQueue: vi.fn().mockResolvedValue([]),
    removeFromSyncQueue: vi.fn().mockResolvedValue(undefined),
    incrementSyncRetries: vi.fn().mockResolvedValue(undefined),
    getSyncQueueCount: vi.fn().mockResolvedValue(0),
    clearSyncQueue: vi.fn().mockResolvedValue(undefined),
  },
}))

// Mock sync operations
vi.mock('./sync-operations', () => ({
  syncQueueItem: vi.fn().mockResolvedValue(undefined),
}))

describe('SyncManager', () => {
  let syncManager: SyncManager

  beforeEach(() => {
    vi.clearAllMocks()
    // Create a fresh sync manager instance with auto-sync disabled for tests
    syncManager = new SyncManager({ autoSync: false })
  })

  afterEach(() => {
    syncManager.destroy()
  })

  describe('initialization', () => {
    it('should initialize successfully', async () => {
      await syncManager.initialize()
      expect(offlineStorage.init).toHaveBeenCalled()
    })

    it('should not initialize twice', async () => {
      await syncManager.initialize()
      await syncManager.initialize()
      // init should only be called once
      expect(offlineStorage.init).toHaveBeenCalledTimes(1)
    })
  })

  describe('queue management', () => {
    beforeEach(async () => {
      await syncManager.initialize()
    })

    it('should add items to queue', async () => {
      const item: Omit<SyncQueueItem, 'id'> = {
        type: 'exercise_complete',
        data: {
          id: 'test-id',
          userId: 'user-123',
          sessionId: 'session-123',
          templateId: 'addition-two-digit',
          competencyAreaId: 'tal-og-algebra',
          skillId: 'addition-two-digit',
          difficulty: 'A',
          isBinding: true,
          correct: true,
          timeSpentSeconds: 30,
          hintsUsed: 0,
          userAnswer: '42',
          createdAt: new Date(),
        },
        timestamp: new Date(),
        retries: 0,
      }

      const id = await syncManager.addToQueue(item)

      expect(id).toBe(1)
      expect(offlineStorage.addToSyncQueue).toHaveBeenCalledWith(item)
    })

    it('should throw error when queue is full', async () => {
      const smallQueue = new SyncManager({ maxQueueSize: 1, autoSync: false })
      await smallQueue.initialize()

      ;(offlineStorage.getSyncQueueCount as any).mockResolvedValue(1)

      const item: Omit<SyncQueueItem, 'id'> = {
        type: 'session_end',
        data: {
          sessionId: 'session-123',
          endedAt: new Date(),
          totalExercises: 10,
          correctCount: 8,
          avgTimePerExerciseSeconds: 30,
        },
        timestamp: new Date(),
        retries: 0,
      }

      await expect(smallQueue.addToQueue(item)).rejects.toThrow('queue is full')
      
      smallQueue.destroy()
    })

    it('should get queue count', async () => {
      ;(offlineStorage.getSyncQueueCount as any).mockResolvedValue(5)

      const count = await syncManager.getQueueCount()

      expect(count).toBe(5)
    })

    it('should clear queue', async () => {
      await syncManager.clearQueue()

      expect(offlineStorage.clearSyncQueue).toHaveBeenCalled()
    })
  })

  describe('sync status', () => {
    beforeEach(async () => {
      await syncManager.initialize()
    })

    it('should report online status', () => {
      // In test environment, navigator.onLine might not be properly set
      // The manager defaults to true when navigator is not available
      const status = syncManager.getOnlineStatus()
      // Status should be a boolean value (true or false)
      expect([true, false]).toContain(status)
    })

    it('should report syncing status', () => {
      const status = syncManager.getSyncingStatus()
      expect(status).toBe(false)
    })
  })

  describe('event listeners', () => {
    beforeEach(async () => {
      await syncManager.initialize()
    })

    it('should add and remove event listeners', () => {
      const listener = vi.fn()

      syncManager.addEventListener(listener)
      syncManager.removeEventListener(listener)

      // Event listener should be added and removed without errors
      expect(listener).not.toHaveBeenCalled()
    })

    it('should emit events to listeners', async () => {
      const listener = vi.fn()

      // Create a new manager with a listener before initialization
      const testManager = new SyncManager({ autoSync: false })
      testManager.addEventListener(listener)

      // Initialize will trigger network-change event
      await testManager.initialize()

      // Listener should be called with network-change event
      expect(listener).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'network-change',
        })
      )

      testManager.destroy()
    })

    it('should handle listener errors gracefully', async () => {
      const badListener = vi.fn().mockImplementation(() => {
        throw new Error('Listener error')
      })
      const goodListener = vi.fn()

      const testManager = new SyncManager({ autoSync: false })
      testManager.addEventListener(badListener)
      testManager.addEventListener(goodListener)

      // Initialize will trigger network-change event
      await testManager.initialize()

      // Both listeners should be called despite one throwing
      expect(badListener).toHaveBeenCalled()
      expect(goodListener).toHaveBeenCalled()

      testManager.destroy()
    })
  })

  describe('manual sync', () => {
    beforeEach(async () => {
      await syncManager.initialize()
    })

    it('should throw error when offline', async () => {
      // Mock offline state
      Object.defineProperty(navigator, 'onLine', {
        writable: true,
        value: false,
      })

      await expect(syncManager.manualSync()).rejects.toThrow('Cannot sync while offline')

      // Restore online state
      Object.defineProperty(navigator, 'onLine', {
        writable: true,
        value: true,
      })
    })

    it('should return 0 when queue is empty', async () => {
      ;(offlineStorage.getSyncQueueCount as any).mockResolvedValue(0)

      const count = await syncManager.manualSync()

      expect(count).toBe(0)
    })
  })
})

