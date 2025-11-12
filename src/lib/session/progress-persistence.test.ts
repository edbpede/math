/**
 * Tests for Progress Persistence Layer
 *
 * Verifies debounced updates, batch writes, optimistic UI updates,
 * error handling, and offline support.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import {
  initializeProgressPersistence,
  resetProgressPersistence,
  destroyProgressPersistence,
  queueCompetencyProgressUpdate,
  queueSkillProgressUpdate,
  queueExerciseAttempt,
  flushProgressUpdates,
  getCachedCompetencyProgress,
  getCachedSkillProgress,
  populateProgressCache,
  $progressQueueState,
  $competencyProgressCache,
  $skillProgressCache,
  $hasPendingUpdates,
  $isSyncInProgress,
} from './progress-persistence'
import type { CompetencyProgress, SkillProgress, ExerciseAttempt } from '../mastery/types'
import type { CompetencyAreaId, GradeRange } from '../curriculum/types'

// Mock Supabase progress functions
vi.mock('../supabase/progress', () => ({
  batchUpdateCompetencyProgress: vi.fn().mockResolvedValue([]),
  batchUpdateSkillProgress: vi.fn().mockResolvedValue([]),
  logExerciseAttempt: vi.fn().mockResolvedValue({
    id: 'test-attempt-id',
    createdAt: new Date(),
  }),
}))

// Mock sync manager
vi.mock('../offline/sync-manager', () => ({
  syncManager: {
    addToQueue: vi.fn().mockResolvedValue(1),
  },
}))

describe('Progress Persistence Layer', () => {
  const testUserId = 'test-user-123'
  const testCompetencyProgress: CompetencyProgress = {
    competencyAreaId: 'tal-og-algebra' as CompetencyAreaId,
    gradeRange: '4-6' as GradeRange,
    masteryLevel: 75,
    totalAttempts: 100,
    successRate: 0.75,
    lastPracticed: new Date(),
  }

  const testSkillProgress: SkillProgress = {
    skillId: 'addition-within-100',
    masteryLevel: 80,
    srsParams: {
      easeFactor: 2.5,
      interval: 7,
      repetitionCount: 3,
    },
    attempts: 50,
    successes: 40,
    avgResponseTime: 5000,
    lastPracticed: new Date(),
    nextReview: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
  }

  const testExerciseAttempt: Omit<ExerciseAttempt, 'id' | 'createdAt'> = {
    userId: testUserId,
    sessionId: 'test-session-123',
    templateId: 'add-within-100',
    competencyAreaId: 'tal-og-algebra' as CompetencyAreaId,
    skillId: 'addition-within-100',
    difficulty: 'A',
    isBinding: true,
    correct: true,
    timeSpentSeconds: 5,
    hintsUsed: 0,
    userAnswer: '42',
  }

  beforeEach(() => {
    // Clear all timers and mocks
    vi.clearAllTimers()
    vi.clearAllMocks()

    // Use fake timers for testing debounce
    vi.useFakeTimers()

    // Initialize progress persistence
    initializeProgressPersistence(testUserId, {
      debounceMs: 1000, // Use shorter interval for testing
      autoSync: true,
      maxQueueSize: 5,
    })
  })

  afterEach(() => {
    // Cleanup
    destroyProgressPersistence()
    vi.useRealTimers()
  })

  describe('Initialization', () => {
    it('should initialize with idle state', () => {
      const state = $progressQueueState.get()
      expect(state.status).toBe('idle')
      expect(state.pendingCount).toBe(0)
      expect(state.lastSyncTime).toBeNull()
      expect(state.error).toBeNull()
    })

    it('should initialize empty caches', () => {
      const competencyCache = $competencyProgressCache.get()
      const skillCache = $skillProgressCache.get()
      expect(competencyCache.size).toBe(0)
      expect(skillCache.size).toBe(0)
    })
  })

  describe('Competency Progress Updates', () => {
    it('should queue competency progress update', () => {
      const result = queueCompetencyProgressUpdate(testCompetencyProgress)

      expect(result.status).toBe('queued')
      expect(result).toHaveProperty('queueSize')

      const state = $progressQueueState.get()
      expect(state.status).toBe('pending')
      expect(state.pendingCount).toBe(1)
      expect($hasPendingUpdates.get()).toBe(true)
    })

    it('should update optimistic cache immediately', () => {
      queueCompetencyProgressUpdate(testCompetencyProgress)

      const cached = getCachedCompetencyProgress(
        testCompetencyProgress.competencyAreaId,
        testCompetencyProgress.gradeRange
      )

      expect(cached).not.toBeNull()
      expect(cached?.masteryLevel).toBe(75)
      expect(cached?.totalAttempts).toBe(100)
    })

    it('should overwrite existing update with same key', () => {
      // Queue first update
      queueCompetencyProgressUpdate(testCompetencyProgress)

      // Queue second update with higher mastery
      const updatedProgress: CompetencyProgress = {
        ...testCompetencyProgress,
        masteryLevel: 85,
        totalAttempts: 120,
      }
      queueCompetencyProgressUpdate(updatedProgress)

      // Should still have only 1 pending update
      const state = $progressQueueState.get()
      expect(state.pendingCount).toBe(1)

      // Cache should have latest values
      const cached = getCachedCompetencyProgress(
        testCompetencyProgress.competencyAreaId,
        testCompetencyProgress.gradeRange
      )
      expect(cached?.masteryLevel).toBe(85)
      expect(cached?.totalAttempts).toBe(120)
    })
  })

  describe('Skill Progress Updates', () => {
    it('should queue skill progress update', () => {
      const result = queueSkillProgressUpdate(testSkillProgress)

      expect(result.status).toBe('queued')
      const state = $progressQueueState.get()
      expect(state.status).toBe('pending')
      expect(state.pendingCount).toBe(1)
    })

    it('should update optimistic cache immediately', () => {
      queueSkillProgressUpdate(testSkillProgress)

      const cached = getCachedSkillProgress(testSkillProgress.skillId)

      expect(cached).not.toBeNull()
      expect(cached?.masteryLevel).toBe(80)
      expect(cached?.attempts).toBe(50)
      expect(cached?.successes).toBe(40)
    })

    it('should overwrite existing update with same skill ID', () => {
      queueSkillProgressUpdate(testSkillProgress)

      const updatedProgress: SkillProgress = {
        ...testSkillProgress,
        masteryLevel: 90,
        attempts: 60,
      }
      queueSkillProgressUpdate(updatedProgress)

      const state = $progressQueueState.get()
      expect(state.pendingCount).toBe(1)

      const cached = getCachedSkillProgress(testSkillProgress.skillId)
      expect(cached?.masteryLevel).toBe(90)
      expect(cached?.attempts).toBe(60)
    })
  })

  describe('Exercise Attempts', () => {
    it('should log exercise attempt immediately', async () => {
      const result = await queueExerciseAttempt(testExerciseAttempt)

      expect(result.status).toBe('success')
      expect(result).toHaveProperty('timestamp')
    })

    it('should queue for offline sync if logging fails', async () => {
      // Mock failure
      const { logExerciseAttempt } = await import('../supabase/progress')
      vi.mocked(logExerciseAttempt).mockRejectedValueOnce(new Error('Network error'))

      const result = await queueExerciseAttempt(testExerciseAttempt)

      expect(result.status).toBe('queued')

      // Should have queued for sync manager
      const { syncManager } = await import('../offline/sync-manager')
      expect(syncManager.addToQueue).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'exercise-attempt',
          data: testExerciseAttempt,
        })
      )
    })
  })

  describe('Debounced Flush', () => {
    it('should schedule flush after debounce interval', () => {
      queueCompetencyProgressUpdate(testCompetencyProgress)

      const state = $progressQueueState.get()
      expect(state.status).toBe('pending')
      expect(state.nextSyncTime).not.toBeNull()
    })

    it('should flush after debounce timer expires', async () => {
      queueCompetencyProgressUpdate(testCompetencyProgress)

      // Fast-forward time past debounce interval
      vi.advanceTimersByTime(1000)

      // Wait for async operations
      await vi.runAllTimersAsync()

      const state = $progressQueueState.get()
      expect(state.status).toBe('idle')
      expect(state.pendingCount).toBe(0)
      expect(state.lastSyncTime).not.toBeNull()
    })

    it('should reset timer if new update arrives', () => {
      queueCompetencyProgressUpdate(testCompetencyProgress)

      // Advance time partway through debounce
      vi.advanceTimersByTime(500)

      // Queue another update - should reset timer
      queueSkillProgressUpdate(testSkillProgress)

      // Advance to where first timer would have fired
      vi.advanceTimersByTime(500)

      // Should still be pending (timer was reset)
      const state = $progressQueueState.get()
      expect(state.status).toBe('pending')
    })

    it('should force flush if queue size exceeds max', async () => {
      // Queue multiple updates to exceed maxQueueSize (5)
      for (let i = 0; i < 6; i++) {
        queueSkillProgressUpdate({
          ...testSkillProgress,
          skillId: `skill-${i}`,
        })
      }

      // Should trigger immediate flush without waiting for debounce
      await vi.runAllTimersAsync()

      const state = $progressQueueState.get()
      expect(state.status).toBe('idle')
      expect(state.pendingCount).toBe(0)
    })
  })

  describe('Manual Flush', () => {
    it('should flush immediately when called', async () => {
      queueCompetencyProgressUpdate(testCompetencyProgress)
      queueSkillProgressUpdate(testSkillProgress)

      const result = await flushProgressUpdates()

      expect(result.status).toBe('success')

      const state = $progressQueueState.get()
      expect(state.status).toBe('idle')
      expect(state.pendingCount).toBe(0)
    })

    it('should cancel pending debounce timer', async () => {
      queueCompetencyProgressUpdate(testCompetencyProgress)

      // Manual flush should cancel timer
      await flushProgressUpdates()

      // Advance time - no additional flush should occur
      vi.advanceTimersByTime(2000)

      // Batch write should have been called only once
      const { batchUpdateCompetencyProgress } = await import('../supabase/progress')
      expect(batchUpdateCompetencyProgress).toHaveBeenCalledTimes(1)
    })
  })

  describe('Batch Operations', () => {
    it('should batch multiple competency updates', async () => {
      const progress1: CompetencyProgress = {
        ...testCompetencyProgress,
        competencyAreaId: 'tal-og-algebra' as CompetencyAreaId,
      }
      const progress2: CompetencyProgress = {
        ...testCompetencyProgress,
        competencyAreaId: 'geometri-og-maling' as CompetencyAreaId,
      }

      queueCompetencyProgressUpdate(progress1)
      queueCompetencyProgressUpdate(progress2)

      await flushProgressUpdates()

      const { batchUpdateCompetencyProgress } = await import('../supabase/progress')
      expect(batchUpdateCompetencyProgress).toHaveBeenCalledWith(
        testUserId,
        expect.arrayContaining([
          expect.objectContaining({ competencyAreaId: 'tal-og-algebra' }),
          expect.objectContaining({ competencyAreaId: 'geometri-og-maling' }),
        ])
      )
    })

    it('should batch multiple skill updates', async () => {
      const skill1: SkillProgress = { ...testSkillProgress, skillId: 'skill-1' }
      const skill2: SkillProgress = { ...testSkillProgress, skillId: 'skill-2' }
      const skill3: SkillProgress = { ...testSkillProgress, skillId: 'skill-3' }

      queueSkillProgressUpdate(skill1)
      queueSkillProgressUpdate(skill2)
      queueSkillProgressUpdate(skill3)

      await flushProgressUpdates()

      const { batchUpdateSkillProgress } = await import('../supabase/progress')
      expect(batchUpdateSkillProgress).toHaveBeenCalledWith(
        testUserId,
        expect.arrayContaining([
          expect.objectContaining({ skillId: 'skill-1' }),
          expect.objectContaining({ skillId: 'skill-2' }),
          expect.objectContaining({ skillId: 'skill-3' }),
        ])
      )
    })
  })

  describe('Error Handling', () => {
    it('should handle batch write failures', async () => {
      const { batchUpdateCompetencyProgress } = await import('../supabase/progress')
      vi.mocked(batchUpdateCompetencyProgress).mockRejectedValueOnce(
        new Error('Database error')
      )

      queueCompetencyProgressUpdate(testCompetencyProgress)

      const result = await flushProgressUpdates()

      expect(result.status).toBe('error')
      expect(result).toHaveProperty('message')

      // State should show error
      const state = $progressQueueState.get()
      expect(state.status).toBe('error')
      expect(state.error).toBeTruthy()
    })

    it('should queue for offline sync on batch write failure', async () => {
      const { batchUpdateSkillProgress } = await import('../supabase/progress')
      vi.mocked(batchUpdateSkillProgress).mockRejectedValueOnce(
        new Error('Network error')
      )

      queueSkillProgressUpdate(testSkillProgress)

      await flushProgressUpdates()

      // Should have queued for sync manager
      const { syncManager } = await import('../offline/sync-manager')
      expect(syncManager.addToQueue).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'skill-progress-batch',
          data: expect.objectContaining({
            userId: testUserId,
            progressList: expect.any(Array),
          }),
        })
      )
    })
  })

  describe('Cache Population', () => {
    it('should populate cache from fetched data', () => {
      const competencyList: CompetencyProgress[] = [
        testCompetencyProgress,
        {
          ...testCompetencyProgress,
          competencyAreaId: 'geometri-og-maling' as CompetencyAreaId,
        },
      ]

      const skillList: SkillProgress[] = [
        testSkillProgress,
        { ...testSkillProgress, skillId: 'multiplication-tables' },
      ]

      populateProgressCache(competencyList, skillList)

      const competencyCache = $competencyProgressCache.get()
      const skillCache = $skillProgressCache.get()

      expect(competencyCache.size).toBe(2)
      expect(skillCache.size).toBe(2)

      expect(getCachedCompetencyProgress('tal-og-algebra', '4-6')).not.toBeNull()
      expect(getCachedSkillProgress('addition-within-100')).not.toBeNull()
      expect(getCachedSkillProgress('multiplication-tables')).not.toBeNull()
    })
  })

  describe('Computed Stores', () => {
    it('should compute hasPendingUpdates correctly', () => {
      expect($hasPendingUpdates.get()).toBe(false)

      queueCompetencyProgressUpdate(testCompetencyProgress)
      expect($hasPendingUpdates.get()).toBe(true)
    })

    it('should compute isSyncInProgress correctly', async () => {
      expect($isSyncInProgress.get()).toBe(false)

      queueCompetencyProgressUpdate(testCompetencyProgress)

      // Trigger flush (will be async)
      const flushPromise = flushProgressUpdates()

      // Should show syncing while in progress
      const stateWhileSyncing = $progressQueueState.get()
      expect(stateWhileSyncing.status).toBe('syncing')
      expect($isSyncInProgress.get()).toBe(true)

      await flushPromise

      // Should be idle after completion
      expect($isSyncInProgress.get()).toBe(false)
    })
  })

  describe('Reset and Destroy', () => {
    it('should reset state and clear queues', () => {
      queueCompetencyProgressUpdate(testCompetencyProgress)
      queueSkillProgressUpdate(testSkillProgress)

      resetProgressPersistence()

      const state = $progressQueueState.get()
      expect(state.status).toBe('idle')
      expect(state.pendingCount).toBe(0)

      const competencyCache = $competencyProgressCache.get()
      const skillCache = $skillProgressCache.get()
      expect(competencyCache.size).toBe(0)
      expect(skillCache.size).toBe(0)
    })

    it('should flush pending updates on destroy', async () => {
      queueCompetencyProgressUpdate(testCompetencyProgress)

      // Spy on flush function
      const module = await import('./progress-persistence')
      const flushSpy = vi.spyOn(module, 'flushProgressUpdates')

      destroyProgressPersistence()

      // Should have attempted to flush
      expect(flushSpy).toHaveBeenCalled()
    })
  })

  describe('Error Cases', () => {
    it('should return error if not initialized', () => {
      destroyProgressPersistence()

      const result = queueCompetencyProgressUpdate(testCompetencyProgress)

      expect(result.status).toBe('error')
      if (result.status === 'error') {
        expect(result.message).toContain('not initialized')
      }
    })

    it('should handle empty flush gracefully', async () => {
      // Flush with no pending updates
      const result = await flushProgressUpdates()

      expect(result.status).toBe('success')

      const state = $progressQueueState.get()
      expect(state.status).toBe('idle')
      expect(state.pendingCount).toBe(0)
    })
  })
})
