/**
 * Session Lifecycle Management Tests
 *
 * Tests for session start, pause, resume, end, and recovery functionality.
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import {
  startPracticeSession,
  pausePracticeSession,
  resumePracticeSession,
  endPracticeSession,
  recoverSession,
  clearSession,
} from './lifecycle'
import { $sessionState, resetSessionState } from '../stores/session-state'
import { offlineStorage } from '../offline/storage'
import * as progressModule from '../supabase/progress'
import * as composerModule from './composer'
import * as generatorModule from '../exercises/generator'
import type { SkillProgress } from '../mastery/types'
import type { ExerciseTemplate } from '../exercises/types'

// Mock dependencies
vi.mock('../supabase/progress')
vi.mock('../exercises/generator')
vi.mock('../offline/sync-manager', () => {
  const mockQueue = vi.fn().mockResolvedValue(undefined)
  return {
    syncManager: {
      queue: mockQueue,
      initialize: vi.fn().mockResolvedValue(undefined),
      destroy: vi.fn(),
    },
  }
})

describe('Session Lifecycle Management', () => {
  const mockUserId = 'test-user-123'
  const mockGradeRange = '4-6' as const
  const mockCompetencyAreaId = 'tal-og-algebra' as const

  const mockSkillsProgress: SkillProgress[] = [
    {
      skillId: 'addition-within-100',
      masteryLevel: 50,
      attempts: 10,
      successes: 7,
      avgResponseTime: 3000,
      srsParams: { easeFactor: 2.5, interval: 3, repetitionCount: 2 },
      lastPracticed: new Date(),
      nextReview: new Date(),
    },
  ]

  const mockSession = {
    id: 'session-123',
    userId: mockUserId,
    gradeRange: mockGradeRange,
    competencyAreaId: mockCompetencyAreaId,
    startedAt: new Date(),
    endedAt: undefined,
    totalExercises: 0,
    correctCount: 0,
    avgTimePerExerciseSeconds: undefined,
  }

  const mockExerciseInstance = {
    id: 'exercise-1',
    templateId: 'add-within-100',
    questionText: 'What is 5 + 3?',
    correctAnswer: { value: 8, type: 'number' as const },
    distractors: ['6', '7', '9'],
    hints: ['Start from 5', 'Add 3 more', 'Count: 5, 6, 7, 8', 'The answer is 8'],
    metadata: {
      competencyAreaId: 'tal-og-algebra' as const,
      skillsAreaId: 'addition-within-100',
      gradeRange: '4-6' as const,
      difficulty: 'A' as const,
      isBinding: true,
      tags: ['addition', 'basic'],
    },
    contextType: 'abstract' as const,
  }

  beforeEach(async () => {
    // Reset session state before each test
    resetSessionState()

    // Initialize offline storage
    await offlineStorage.init()

    // Clear all stored data
    await offlineStorage.clearAll()

    // Setup default mocks
    vi.spyOn(progressModule, 'startSession').mockResolvedValue(mockSession)
    vi.spyOn(progressModule, 'endSession').mockResolvedValue({
      ...mockSession,
      endedAt: new Date(),
      totalExercises: 5,
      correctCount: 4,
      avgTimePerExerciseSeconds: 30,
    })
    vi.spyOn(progressModule, 'fetchActiveSession').mockResolvedValue(null)

    vi.spyOn(composerModule, 'composeSession').mockReturnValue({
      status: 'success',
      sessionPlan: {
        userId: mockUserId,
        gradeRange: mockGradeRange,
        competencyAreaId: mockCompetencyAreaId,
        config: {
          newContentPercent: 20,
          reviewContentPercent: 50,
          weakAreaPercent: 20,
          randomPercent: 10,
          totalExercises: 25,
        },
        allocation: {
          new: 5,
          review: 12,
          weakArea: 5,
          random: 3,
          total: 25,
        },
        exercises: [
          {
            templateId: 'add-within-100',
            category: 'review',
            skillId: 'addition-within-100',
            position: 0,
          },
        ],
        composedAt: new Date(),
      },
    })

    vi.spyOn(generatorModule, 'generateInstance').mockReturnValue({
      status: 'success',
      instance: mockExerciseInstance,
    })
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('startPracticeSession', () => {
    it('should start a new session successfully', async () => {
      const result = await startPracticeSession({
        userId: mockUserId,
        gradeRange: mockGradeRange,
        competencyAreaId: mockCompetencyAreaId,
        skillsProgress: mockSkillsProgress,
      })

      expect(result.status).toBe('success')
      expect(result.data).toBeDefined()
      expect(result.data?.session).toEqual(mockSession)

      // Check state was updated
      const state = $sessionState.get()
      expect(state.lifecycle).toBe('active')
      expect(state.session).toEqual(mockSession)
      expect(state.plan).toBeDefined()
      expect(state.exercise.instance).toEqual(mockExerciseInstance)
      expect(state.exercise.exerciseNumber).toBe(1)
    })

    it('should handle composition failure', async () => {
      vi.spyOn(composerModule, 'composeSession').mockReturnValue({
        status: 'insufficient-data',
        message: 'Not enough content',
        availableExercises: 2,
        requestedExercises: 25,
      })

      const result = await startPracticeSession({
        userId: mockUserId,
        gradeRange: mockGradeRange,
        skillsProgress: mockSkillsProgress,
      })

      expect(result.status).toBe('error')
      expect(result.message).toContain('Not enough content')

      const state = $sessionState.get()
      expect(state.lifecycle).toBe('idle')
      expect(state.error).toBeDefined()
    })

    // Note: Offline mode with sync queue is tested separately in integration tests
    // Mocking syncManager.queue in Vitest is complex due to Vite's module system

    it('should persist session state to IndexedDB', async () => {
      await startPracticeSession({
        userId: mockUserId,
        gradeRange: mockGradeRange,
        skillsProgress: mockSkillsProgress,
      })

      const persistedData = await offlineStorage.getPreference('active-session')
      expect(persistedData).toBeDefined()
    })
  })

  describe('pausePracticeSession', () => {
    beforeEach(async () => {
      // Start a session first
      await startPracticeSession({
        userId: mockUserId,
        gradeRange: mockGradeRange,
        skillsProgress: mockSkillsProgress,
      })
    })

    it('should pause an active session', async () => {
      const result = await pausePracticeSession()

      expect(result.status).toBe('success')

      const state = $sessionState.get()
      expect(state.lifecycle).toBe('paused')
      expect(state.pausedAt).toBeDefined()
    })

    it('should not pause if no active session', async () => {
      resetSessionState()

      const result = await pausePracticeSession()

      expect(result.status).toBe('error')
      expect(result.message).toContain('no active session')
    })

    it('should persist paused state to IndexedDB', async () => {
      await pausePracticeSession()

      const persistedData = await offlineStorage.getPreference('active-session')
      expect(persistedData).toBeDefined()

      const parsed = JSON.parse(persistedData as string)
      expect(parsed.paused).toBe(true)
    })
  })

  describe('resumePracticeSession', () => {
    beforeEach(async () => {
      // Start and pause a session
      await startPracticeSession({
        userId: mockUserId,
        gradeRange: mockGradeRange,
        skillsProgress: mockSkillsProgress,
      })
      await pausePracticeSession()
    })

    it('should resume a paused session', async () => {
      const result = await resumePracticeSession()

      expect(result.status).toBe('success')

      const state = $sessionState.get()
      expect(state.lifecycle).toBe('active')
      expect(state.pausedAt).toBeNull()
    })

    it('should not resume if session is not paused', async () => {
      await resumePracticeSession() // Resume once

      const result = await resumePracticeSession() // Try to resume again

      expect(result.status).toBe('error')
      expect(result.message).toContain('not paused')
    })

    it('should persist resumed state to IndexedDB', async () => {
      await resumePracticeSession()

      const persistedData = await offlineStorage.getPreference('active-session')
      expect(persistedData).toBeDefined()

      const parsed = JSON.parse(persistedData as string)
      expect(parsed.paused).toBe(false)
    })
  })

  describe('endPracticeSession', () => {
    beforeEach(async () => {
      // Start a session
      await startPracticeSession({
        userId: mockUserId,
        gradeRange: mockGradeRange,
        skillsProgress: mockSkillsProgress,
      })
    })

    it('should end an active session', async () => {
      const result = await endPracticeSession()

      expect(result.status).toBe('success')
      expect(result.data).toBeDefined()
      expect(result.data?.sessionId).toBe(mockSession.id)

      const state = $sessionState.get()
      expect(state.lifecycle).toBe('completed')
    })

    it('should call endSession in database with correct statistics', async () => {
      const endSessionSpy = vi.spyOn(progressModule, 'endSession')

      await endPracticeSession()

      expect(endSessionSpy).toHaveBeenCalledWith(
        mockSession.id,
        expect.any(Number), // completed
        expect.any(Number), // correct
        expect.any(Number) // avgTimePerExercise
      )
    })

    // Note: Offline mode with sync queue is tested separately in integration tests
    // Mocking syncManager.queue in Vitest is complex due to Vite's module system

    it('should clear persisted session state', async () => {
      await endPracticeSession()

      const persistedData = await offlineStorage.getPreference('active-session')
      expect(persistedData).toBeUndefined()
    })

    it('should not end if no active session', async () => {
      resetSessionState()

      const result = await endPracticeSession()

      expect(result.status).toBe('error')
      expect(result.message).toContain('no active session')
    })
  })

  describe('recoverSession', () => {
    it('should recover session from IndexedDB', async () => {
      // Start a session to persist it
      await startPracticeSession({
        userId: mockUserId,
        gradeRange: mockGradeRange,
        skillsProgress: mockSkillsProgress,
      })

      // Reset state to simulate page reload
      resetSessionState()

      // Recover session
      const result = await recoverSession(mockUserId)

      expect(result.status).toBe('success')
      expect(result.data).toBeDefined()
      expect(result.data?.session).toBeDefined()
      expect(result.data?.plan).toBeDefined()

      const state = $sessionState.get()
      expect(state.lifecycle).toBe('active')
      expect(state.session).toBeDefined()
    })

    it('should return null if no session to recover', async () => {
      const result = await recoverSession(mockUserId)

      expect(result.status).toBe('success')
      expect(result.data).toBeNull()
    })

    it('should ignore stale persisted sessions (> 24 hours)', async () => {
      // Create old persisted session
      const oldSession = {
        session: mockSession,
        plan: {
          userId: mockUserId,
          gradeRange: mockGradeRange,
          config: {},
          allocation: {},
          exercises: [],
          composedAt: new Date(),
        },
        paused: false,
        savedAt: new Date(Date.now() - 25 * 60 * 60 * 1000), // 25 hours ago
      }

      await offlineStorage.setPreference('active-session', JSON.stringify(oldSession))

      const result = await recoverSession(mockUserId)

      expect(result.status).toBe('success')
      expect(result.data).toBeNull() // Should ignore old session
    })
  })

  describe('clearSession', () => {
    beforeEach(async () => {
      // Start a session
      await startPracticeSession({
        userId: mockUserId,
        gradeRange: mockGradeRange,
        skillsProgress: mockSkillsProgress,
      })
    })

    it('should clear session and reset state', async () => {
      const result = await clearSession()

      expect(result.status).toBe('success')

      const state = $sessionState.get()
      expect(state.lifecycle).toBe('idle')
      expect(state.session).toBeNull()
      expect(state.plan).toBeNull()
    })

    it('should clear persisted session state', async () => {
      await clearSession()

      const persistedData = await offlineStorage.getPreference('active-session')
      expect(persistedData).toBeUndefined()
    })
  })
})
