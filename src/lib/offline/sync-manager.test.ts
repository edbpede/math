/**
 * Sync Manager Tests
 *
 * Tests for sync queue manager functionality.
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import type { SyncQueueItem } from './types'

// Use vi.hoisted to ensure mocks are created before imports
const mocks = vi.hoisted(() => {
  // Stateful mock queue to track items
  let mockQueue: SyncQueueItem[] = []
  let nextId = 1

  return {
    mockInit: vi.fn().mockResolvedValue(undefined),
    mockAddToSyncQueue: vi.fn().mockImplementation(async (item: Omit<SyncQueueItem, 'id'>) => {
      const id = nextId++
      mockQueue.push({ ...item, id } as SyncQueueItem)
      return id
    }),
    mockGetAllSyncQueue: vi.fn().mockImplementation(async () => [...mockQueue]),
    mockRemoveFromSyncQueue: vi.fn().mockImplementation(async (id: number) => {
      mockQueue = mockQueue.filter(item => item.id !== id)
    }),
    mockIncrementSyncRetries: vi.fn().mockImplementation(async (id: number) => {
      const item = mockQueue.find(item => item.id === id)
      if (item) {
        item.retries += 1
      }
    }),
    mockGetSyncQueueCount: vi.fn().mockImplementation(async () => mockQueue.length),
    mockClearSyncQueue: vi.fn().mockImplementation(async () => {
      mockQueue = []
      nextId = 1
    }),
    mockSyncQueueItem: vi.fn().mockResolvedValue(undefined),
    // Helper to reset the mock queue state
    resetMockQueue: () => {
      mockQueue = []
      nextId = 1
    },
  }
})

// Mock the storage layer
vi.mock('./storage', () => ({
  offlineStorage: {
    init: mocks.mockInit,
    addToSyncQueue: mocks.mockAddToSyncQueue,
    getAllSyncQueue: mocks.mockGetAllSyncQueue,
    removeFromSyncQueue: mocks.mockRemoveFromSyncQueue,
    incrementSyncRetries: mocks.mockIncrementSyncRetries,
    getSyncQueueCount: mocks.mockGetSyncQueueCount,
    clearSyncQueue: mocks.mockClearSyncQueue,
  },
}))

// Mock sync operations
vi.mock('./sync-operations', () => ({
  syncQueueItem: mocks.mockSyncQueueItem,
}))

// Import after mocks are set up
import { SyncManager } from './sync-manager'

// Destructure mocks for easier access in tests
const { mockInit, mockAddToSyncQueue, mockGetAllSyncQueue, mockRemoveFromSyncQueue,
        mockIncrementSyncRetries, mockGetSyncQueueCount, mockClearSyncQueue } = mocks

describe('SyncManager', () => {
  let syncManager: SyncManager

  beforeEach(() => {
    vi.clearAllMocks()
    mocks.resetMockQueue()
    // Create a fresh sync manager instance with auto-sync disabled for tests
    syncManager = new SyncManager({ autoSync: false })
  })

  afterEach(() => {
    syncManager.destroy()
  })

  describe('initialization', () => {
    it('should initialize successfully', async () => {
      await syncManager.initialize()
      // Verify the sync manager is initialized by checking it can perform operations
      expect(syncManager.isOnline).toBeDefined()
    })

    it('should not initialize twice', async () => {
      await syncManager.initialize()
      await syncManager.initialize()
      // Should not throw an error when initialized twice
      expect(syncManager.isOnline).toBeDefined()
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

      // Verify the item was added by checking we got an ID back
      expect(id).toBeGreaterThanOrEqual(1)
    })

    it('should throw error when queue is full', async () => {
      const smallQueue = new SyncManager({ maxQueueSize: 1, autoSync: false })
      await smallQueue.initialize()

      // Clear any existing items from previous tests
      await smallQueue.clearQueue()

      // Add one item to fill the queue
      const firstId = await smallQueue.addToQueue({
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
      })

      // Verify the first item was added
      expect(firstId).toBeGreaterThanOrEqual(1)
      const count = await smallQueue.getQueueCount()
      expect(count).toBe(1)

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

      await expect(smallQueue.addToQueue(item)).rejects.toThrow('Sync queue is full')

      smallQueue.destroy()
    })

    it('should get queue count', async () => {
      const count = await syncManager.getQueueCount()

      // Verify we get a valid count (should be 0 or more)
      expect(count).toBeGreaterThanOrEqual(0)
    })

    it('should clear queue', async () => {
      await syncManager.clearQueue()

      // Verify the queue was cleared by checking the count is 0
      const count = await syncManager.getQueueCount()
      expect(count).toBe(0)
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
      expect(status).toBeTypeOf('boolean')
      expect(status === true || status === false).toBe(true)
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
      // Mock offline state - need to trigger the offline event handler
      if (typeof window !== 'undefined') {
        Object.defineProperty(navigator, 'onLine', {
          writable: true,
          configurable: true,
          value: false,
        })
        // Trigger offline event to update sync manager state
        window.dispatchEvent(new Event('offline'))
      } else {
        // In Node environment, manually set offline state via the private property
        // This is a test-only workaround
        ;(syncManager as any).isOnline = false
      }

      await expect(syncManager.manualSync()).rejects.toThrow('Cannot sync while offline')

      // Restore online state
      if (typeof window !== 'undefined') {
        Object.defineProperty(navigator, 'onLine', {
          writable: true,
          configurable: true,
          value: true,
        })
        window.dispatchEvent(new Event('online'))
      } else {
        ;(syncManager as any).isOnline = true
      }
    })

    it('should return 0 when queue is empty', async () => {
      // Ensure online state for this test
      if (typeof window !== 'undefined') {
        Object.defineProperty(navigator, 'onLine', {
          writable: true,
          configurable: true,
          value: true,
        })
        window.dispatchEvent(new Event('online'))
      } else {
        ;(syncManager as any).isOnline = true
      }

      mockGetSyncQueueCount.mockResolvedValue(0)

      const count = await syncManager.manualSync()

      expect(count).toBe(0)
    })
  })
})

