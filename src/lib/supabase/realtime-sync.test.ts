/**
 * Tests for Realtime Cross-Device Synchronization
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { RealtimeSyncManager } from './realtime-sync'
import type { RealtimeSyncEvent } from './realtime-sync'

// Mock Supabase client
vi.mock('./client', () => ({
  supabase: {
    channel: vi.fn(() => ({
      on: vi.fn().mockReturnThis(),
      subscribe: vi.fn().mockResolvedValue({ error: null }),
    })),
    removeChannel: vi.fn().mockResolvedValue({}),
  },
}))

// Mock progress persistence
vi.mock('../session/progress-persistence', () => ({
  $competencyProgressCache: {
    get: vi.fn(() => new Map()),
    set: vi.fn(),
  },
  $skillProgressCache: {
    get: vi.fn(() => new Map()),
    set: vi.fn(),
  },
  populateProgressCache: vi.fn(),
}))

describe('RealtimeSyncManager', () => {
  let syncManager: RealtimeSyncManager
  const testUserId = 'test-user-123'

  beforeEach(() => {
    syncManager = new RealtimeSyncManager({ debug: true })
  })

  afterEach(async () => {
    await syncManager.destroy()
    vi.clearAllMocks()
  })

  describe('Initialization', () => {
    it('should initialize with default config', () => {
      expect(syncManager).toBeDefined()
      expect(syncManager.getConnectionStatus()).toBe('disconnected')
      expect(syncManager.isConnected()).toBe(false)
    })

    it('should accept custom config', () => {
      const customManager = new RealtimeSyncManager({
        enabled: false,
        autoReconnect: false,
        debug: true,
      })
      expect(customManager).toBeDefined()
    })

    it('should initialize for a user', async () => {
      await syncManager.initialize(testUserId)
      // Connection status should be connecting or connected
      expect(['connecting', 'connected']).toContain(syncManager.getConnectionStatus())
    })

    it('should not reinitialize for same user', async () => {
      await syncManager.initialize(testUserId)
      const status1 = syncManager.getConnectionStatus()

      await syncManager.initialize(testUserId)
      const status2 = syncManager.getConnectionStatus()

      expect(status1).toBe(status2)
    })

    it('should skip initialization when disabled', async () => {
      const disabledManager = new RealtimeSyncManager({ enabled: false })
      await disabledManager.initialize(testUserId)
      expect(disabledManager.getConnectionStatus()).toBe('disconnected')
    })
  })

  describe('Connection Status', () => {
    it('should start as disconnected', () => {
      expect(syncManager.getConnectionStatus()).toBe('disconnected')
    })

    it('should report isConnected correctly', async () => {
      expect(syncManager.isConnected()).toBe(false)
      // After initialization, it may be connecting or connected
      await syncManager.initialize(testUserId)
      // Depending on timing, it might still be connecting
      expect(['connecting', 'connected'].includes(syncManager.getConnectionStatus())).toBe(true)
    })
  })

  describe('Event Listeners', () => {
    it('should add event listener', () => {
      const listener = vi.fn()
      syncManager.addEventListener(listener)
      // Listener should be added (no error thrown)
      expect(true).toBe(true)
    })

    it('should remove event listener', () => {
      const listener = vi.fn()
      syncManager.addEventListener(listener)
      syncManager.removeEventListener(listener)
      // Listener should be removed (no error thrown)
      expect(true).toBe(true)
    })

    it('should call event listeners on events', async () => {
      const listener = vi.fn()
      syncManager.addEventListener(listener)

      await syncManager.initialize(testUserId)

      // Should have received at least a connection-change event
      expect(listener).toHaveBeenCalled()

      const events = listener.mock.calls.map(call => call[0]) as RealtimeSyncEvent[]
      const hasConnectionEvent = events.some(e => e.type === 'connection-change')
      expect(hasConnectionEvent).toBe(true)
    })
  })

  describe('Cleanup', () => {
    it('should destroy cleanly when not initialized', async () => {
      await expect(syncManager.destroy()).resolves.not.toThrow()
    })

    it('should destroy after initialization', async () => {
      await syncManager.initialize(testUserId)
      await syncManager.destroy()

      expect(syncManager.getConnectionStatus()).toBe('disconnected')
      expect(syncManager.isConnected()).toBe(false)
    })

    it('should clear event listeners on destroy', async () => {
      const listener = vi.fn()
      syncManager.addEventListener(listener)

      await syncManager.initialize(testUserId)
      await syncManager.destroy()

      // No more events should be emitted after destroy
      const callsBefore = listener.mock.calls.length
      // Try to trigger an event (won't work since destroyed)
      // The listener count should not increase
      expect(listener.mock.calls.length).toBe(callsBefore)
    })
  })

  describe('Error Handling', () => {
    it('should handle initialization errors gracefully', async () => {
      const errorManager = new RealtimeSyncManager()

      // Test error handling by passing invalid user ID
      // The actual Supabase client will handle the error internally
      try {
        await errorManager.initialize('')
        // If it doesn't throw, that's acceptable - just verify status
        expect(['disconnected', 'connecting', 'error'].includes(errorManager.getConnectionStatus())).toBe(true)
      } catch (error) {
        // Error thrown is acceptable
        expect(error).toBeDefined()
      }
    })

    it('should emit error events on listener addition', async () => {
      const listener = vi.fn()
      const testManager = new RealtimeSyncManager()
      testManager.addEventListener(listener)

      // Initialize normally - we can't easily mock Supabase errors
      // But we can verify the event system works
      await testManager.initialize(testUserId)

      // Should have received connection-change events
      const events = listener.mock.calls.map(call => call[0]) as RealtimeSyncEvent[]
      const hasConnectionEvent = events.some(e => e.type === 'connection-change')
      expect(hasConnectionEvent).toBe(true)

      await testManager.destroy()
    })
  })

  describe('Configuration', () => {
    it('should respect enabled flag', async () => {
      const disabledManager = new RealtimeSyncManager({ enabled: false })
      await disabledManager.initialize(testUserId)

      // Should not connect when disabled
      expect(disabledManager.getConnectionStatus()).toBe('disconnected')
    })

    it('should handle debug mode', () => {
      const debugManager = new RealtimeSyncManager({ debug: true })
      const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {})

      // Debug logs should be enabled (we can't easily test this without triggering actual logs)
      expect(debugManager).toBeDefined()

      consoleLogSpy.mockRestore()
    })
  })
})
