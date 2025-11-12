/**
 * Session State Management Stores
 *
 * Nanostores for managing practice session state throughout the application.
 * Provides reactive state for session lifecycle, progress, and statistics.
 *
 * Requirements:
 * - 12.1: Create session record when user begins practice
 * - 12.5: Update session with end timestamp and summary statistics
 * - 14.1: Session lifecycle management (start, pause, resume, end)
 */

import { atom, computed } from 'nanostores'
import type { PracticeSession } from '../mastery/types'
import type { CompetencyAreaId, GradeRange } from '../curriculum/types'
import type { ExerciseInstance } from '../exercises/types'
import type { SessionPlan } from '../session/types'

/**
 * Session lifecycle states
 */
export type SessionLifecycleState =
  | 'idle'       // No active session
  | 'starting'   // Session is being created
  | 'active'     // Session is in progress
  | 'paused'     // Session is paused
  | 'ending'     // Session is being ended
  | 'completed'  // Session has ended

/**
 * Exercise state within a session
 */
export interface ExerciseState {
  /** Current exercise instance */
  instance: ExerciseInstance | null
  /** Exercise number in session (1-indexed) */
  exerciseNumber: number
  /** Total exercises in session */
  totalExercises: number
  /** Timestamp when current exercise started */
  startTime: Date | null
  /** Number of hints used on current exercise */
  hintsUsed: number
  /** Whether answer has been submitted */
  submitted: boolean
  /** Whether the submitted answer was correct */
  correct: boolean | null
}

/**
 * Session statistics
 */
export interface SessionStatistics {
  /** Total exercises completed */
  completed: number
  /** Number of correct answers */
  correct: number
  /** Total time spent (milliseconds) */
  totalTimeMs: number
  /** Time spent on current exercise (milliseconds) */
  currentExerciseTimeMs: number
  /** Success rate (0-100) */
  successRate: number
  /** Average time per exercise (seconds) */
  avgTimePerExercise: number
}

/**
 * Session state
 */
export interface SessionState {
  /** Lifecycle state */
  lifecycle: SessionLifecycleState
  /** Session record from Supabase (null if no session) */
  session: PracticeSession | null
  /** Session plan (exercises to complete) */
  plan: SessionPlan | null
  /** Current exercise state */
  exercise: ExerciseState
  /** Session statistics */
  statistics: SessionStatistics
  /** Timestamp when session was paused (null if not paused) */
  pausedAt: Date | null
  /** Error message if any */
  error: string | null
}

/**
 * Initial exercise state
 */
const INITIAL_EXERCISE_STATE: ExerciseState = {
  instance: null,
  exerciseNumber: 0,
  totalExercises: 0,
  startTime: null,
  hintsUsed: 0,
  submitted: false,
  correct: null,
}

/**
 * Initial session statistics
 */
const INITIAL_STATISTICS: SessionStatistics = {
  completed: 0,
  correct: 0,
  totalTimeMs: 0,
  currentExerciseTimeMs: 0,
  successRate: 0,
  avgTimePerExercise: 0,
}

/**
 * Initial session state
 */
const INITIAL_SESSION_STATE: SessionState = {
  lifecycle: 'idle',
  session: null,
  plan: null,
  exercise: INITIAL_EXERCISE_STATE,
  statistics: INITIAL_STATISTICS,
  pausedAt: null,
  error: null,
}

/**
 * Session state atom
 */
export const $sessionState = atom<SessionState>(INITIAL_SESSION_STATE)

/**
 * Computed: Is session active (active or paused)
 */
export const $isSessionActive = computed($sessionState, (state) => {
  return state.lifecycle === 'active' || state.lifecycle === 'paused'
})

/**
 * Computed: Progress percentage (0-100)
 */
export const $sessionProgress = computed($sessionState, (state) => {
  if (state.exercise.totalExercises === 0) return 0
  return Math.round((state.statistics.completed / state.exercise.totalExercises) * 100)
})

/**
 * Computed: Time spent in session (formatted string)
 */
export const $sessionTimeFormatted = computed($sessionState, (state) => {
  const totalSeconds = Math.floor(state.statistics.totalTimeMs / 1000)
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60

  if (minutes === 0) {
    return `${seconds}s`
  }
  return `${minutes}m ${seconds}s`
})

/**
 * Computed: Current exercise time (formatted string)
 */
export const $currentExerciseTimeFormatted = computed($sessionState, (state) => {
  const seconds = Math.floor(state.statistics.currentExerciseTimeMs / 1000)
  return `${seconds}s`
})

/**
 * Computed: Session summary for end screen
 */
export const $sessionSummary = computed($sessionState, (state) => {
  return {
    completed: state.statistics.completed,
    correct: state.statistics.correct,
    incorrect: state.statistics.completed - state.statistics.correct,
    successRate: state.statistics.successRate,
    avgTimePerExercise: state.statistics.avgTimePerExercise,
    totalTimeFormatted: $sessionTimeFormatted.get(),
    gradeRange: state.session?.gradeRange ?? '4-6' as GradeRange,
    competencyAreaId: state.session?.competencyAreaId,
  }
})

/**
 * Timer state for tracking exercise time
 */
let exerciseTimerInterval: ReturnType<typeof setInterval> | null = null
let sessionTimerInterval: ReturnType<typeof setInterval> | null = null

/**
 * Start session timers
 */
function startTimers(): void {
  // Update current exercise time every 100ms
  exerciseTimerInterval = setInterval(() => {
    const state = $sessionState.get()
    if (state.lifecycle === 'active' && state.exercise.startTime) {
      const now = Date.now()
      const startTime = state.exercise.startTime.getTime()
      const currentExerciseTimeMs = now - startTime

      $sessionState.set({
        ...state,
        statistics: {
          ...state.statistics,
          currentExerciseTimeMs,
        },
      })
    }
  }, 100)

  // Update total session time every 1s
  sessionTimerInterval = setInterval(() => {
    const state = $sessionState.get()
    if (state.lifecycle === 'active' && state.session) {
      const now = Date.now()
      const startTime = new Date(state.session.startedAt).getTime()
      let totalTimeMs = now - startTime

      // Subtract paused time if session was paused
      if (state.pausedAt) {
        const pausedDuration = now - state.pausedAt.getTime()
        totalTimeMs -= pausedDuration
      }

      $sessionState.set({
        ...state,
        statistics: {
          ...state.statistics,
          totalTimeMs,
        },
      })
    }
  }, 1000)
}

/**
 * Stop session timers
 */
function stopTimers(): void {
  if (exerciseTimerInterval) {
    clearInterval(exerciseTimerInterval)
    exerciseTimerInterval = null
  }

  if (sessionTimerInterval) {
    clearInterval(sessionTimerInterval)
    sessionTimerInterval = null
  }
}

/**
 * Pause session timers
 */
function pauseTimers(): void {
  stopTimers()
}

/**
 * Resume session timers
 */
function resumeTimers(): void {
  startTimers()
}

/**
 * Reset session state to initial state
 */
export function resetSessionState(): void {
  stopTimers()
  $sessionState.set(INITIAL_SESSION_STATE)
}

/**
 * Set session lifecycle state
 */
export function setLifecycleState(lifecycle: SessionLifecycleState): void {
  const state = $sessionState.get()
  $sessionState.set({ ...state, lifecycle })

  // Manage timers based on lifecycle
  if (lifecycle === 'active') {
    startTimers()
  } else if (lifecycle === 'paused') {
    pauseTimers()
  } else if (lifecycle === 'completed' || lifecycle === 'idle') {
    stopTimers()
  }
}

/**
 * Set session record
 */
export function setSessionRecord(session: PracticeSession): void {
  const state = $sessionState.get()
  $sessionState.set({ ...state, session })
}

/**
 * Set session plan
 */
export function setSessionPlan(plan: SessionPlan): void {
  const state = $sessionState.get()
  $sessionState.set({
    ...state,
    plan,
    exercise: {
      ...state.exercise,
      totalExercises: plan.exercises.length,
    },
  })
}

/**
 * Set current exercise instance
 */
export function setCurrentExercise(instance: ExerciseInstance, exerciseNumber: number): void {
  const state = $sessionState.get()
  $sessionState.set({
    ...state,
    exercise: {
      instance,
      exerciseNumber,
      totalExercises: state.exercise.totalExercises,
      startTime: new Date(),
      hintsUsed: 0,
      submitted: false,
      correct: null,
    },
    statistics: {
      ...state.statistics,
      currentExerciseTimeMs: 0,
    },
  })
}

/**
 * Increment hints used on current exercise
 */
export function incrementHintsUsed(): void {
  const state = $sessionState.get()
  $sessionState.set({
    ...state,
    exercise: {
      ...state.exercise,
      hintsUsed: state.exercise.hintsUsed + 1,
    },
  })
}

/**
 * Mark exercise as submitted with result
 */
export function submitExercise(correct: boolean, timeSpentMs: number): void {
  const state = $sessionState.get()

  const newCompleted = state.statistics.completed + 1
  const newCorrect = state.statistics.correct + (correct ? 1 : 0)
  const newSuccessRate = Math.round((newCorrect / newCompleted) * 100)
  const newTotalTimeMs = state.statistics.totalTimeMs + timeSpentMs
  const newAvgTimePerExercise = Math.round(newTotalTimeMs / newCompleted / 1000)

  $sessionState.set({
    ...state,
    exercise: {
      ...state.exercise,
      submitted: true,
      correct,
    },
    statistics: {
      ...state.statistics,
      completed: newCompleted,
      correct: newCorrect,
      successRate: newSuccessRate,
      totalTimeMs: newTotalTimeMs,
      avgTimePerExercise: newAvgTimePerExercise,
    },
  })
}

/**
 * Set session error
 */
export function setSessionError(error: string): void {
  const state = $sessionState.get()
  $sessionState.set({ ...state, error })
}

/**
 * Clear session error
 */
export function clearSessionError(): void {
  const state = $sessionState.get()
  $sessionState.set({ ...state, error: null })
}

/**
 * Mark session as paused
 */
export function markSessionPaused(): void {
  const state = $sessionState.get()
  $sessionState.set({
    ...state,
    lifecycle: 'paused',
    pausedAt: new Date(),
  })
  pauseTimers()
}

/**
 * Mark session as resumed
 */
export function markSessionResumed(): void {
  const state = $sessionState.get()
  $sessionState.set({
    ...state,
    lifecycle: 'active',
    pausedAt: null,
  })
  resumeTimers()
}

/**
 * Cleanup session state (call on app unmount)
 */
export function destroySessionState(): void {
  stopTimers()
  console.log('[SessionState] Session state destroyed')
}
