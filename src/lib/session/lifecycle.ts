/**
 * Session Lifecycle Management
 *
 * Orchestrates practice session lifecycle including starting, pausing,
 * resuming, and ending sessions. Integrates with Supabase for persistence
 * and Nanostores for reactive state management.
 *
 * Requirements:
 * - 12.1: Create session record in Supabase when user begins practice
 * - 12.5: Update session with end timestamp and summary statistics
 * - 14.1: Session lifecycle management (start, pause, resume, end)
 */

import {
  startSession as startSessionInDB,
  endSession as endSessionInDB,
  fetchActiveSession,
} from '../supabase/progress'
import type { PracticeSession } from '../mastery/types'
import type { CompetencyAreaId, GradeRange } from '../curriculum/types'
import { offlineStorage } from '../offline/storage'
import { syncManager } from '../offline/sync-manager'
import {
  $sessionState,
  setLifecycleState,
  setSessionRecord,
  setSessionPlan,
  setCurrentExercise,
  resetSessionState,
  markSessionPaused,
  markSessionResumed,
  setSessionError,
  clearSessionError,
} from '../stores/session-state'
import { composeSession, type ComposeSessionOptions } from './composer'
import type { SessionPlan } from './types'
import { generateInstance } from '../exercises/generator'

/**
 * Session lifecycle error
 */
export class SessionLifecycleError extends Error {
  constructor(
    message: string,
    public readonly operation: string,
    public readonly cause?: unknown
  ) {
    super(message)
    this.name = 'SessionLifecycleError'
  }
}

/**
 * Result type for session operations
 */
export type SessionOperationResult<T> =
  | { status: 'success'; data: T }
  | { status: 'error'; message: string; error?: Error }

/**
 * Options for starting a session
 */
export interface StartSessionOptions {
  /** User UUID */
  userId: string
  /** Grade range for session */
  gradeRange: GradeRange
  /** Optional competency area filter */
  competencyAreaId?: CompetencyAreaId
  /** Skills progress for session composition */
  skillsProgress: ComposeSessionOptions['skillsProgress']
  /** Optional session composition config */
  config?: ComposeSessionOptions['config']
}

/**
 * Start a new practice session
 *
 * Creates a session record in Supabase, composes exercises, and initializes
 * session state stores. Handles offline mode by queueing operations.
 *
 * Requirements:
 * - 12.1: Create session record with UUID, timestamps, grade level
 *
 * @param options - Session start options
 * @returns Session operation result with session and plan data
 */
export async function startPracticeSession(
  options: StartSessionOptions
): Promise<SessionOperationResult<{ session: PracticeSession; plan: SessionPlan }>> {
  try {
    console.log('[SessionLifecycle] Starting new practice session...', options)

    // Set lifecycle to starting
    setLifecycleState('starting')
    clearSessionError()

    // Step 1: Compose session plan
    const compositionResult = composeSession({
      userId: options.userId,
      gradeRange: options.gradeRange,
      competencyAreaId: options.competencyAreaId,
      skillsProgress: options.skillsProgress,
      config: options.config,
    })

    if (compositionResult.status !== 'success') {
      const errorMsg =
        compositionResult.status === 'insufficient-data'
          ? compositionResult.message
          : 'Failed to compose session'

      setSessionError(errorMsg)
      setLifecycleState('idle')

      return {
        status: 'error',
        message: errorMsg,
      }
    }

    const plan = compositionResult.sessionPlan

    // Step 2: Create session record in Supabase
    let session: PracticeSession
    try {
      session = await startSessionInDB(
        options.userId,
        options.gradeRange,
        options.competencyAreaId
      )
      console.log('[SessionLifecycle] Session record created:', session.id)
    } catch (error) {
      console.warn('[SessionLifecycle] Failed to create session record, queuing for offline sync:', error)

      // If offline, create a temporary session record and queue for sync
      const tempSessionId = crypto.randomUUID()
      session = {
        id: tempSessionId,
        userId: options.userId,
        gradeRange: options.gradeRange,
        competencyAreaId: options.competencyAreaId,
        startedAt: new Date(),
        endedAt: undefined,
        totalExercises: 0,
        correctCount: 0,
        avgTimePerExerciseSeconds: undefined,
      }

      // Queue session start for sync (using progress_update type)
      await syncManager.addToQueue({
        type: 'progress_update',
        data: {
          userId: options.userId,
          // Session start doesn't need progress data, just user tracking
        },
        timestamp: new Date(),
        retries: 0,
      })
    }

    // Step 3: Initialize session state
    setSessionRecord(session)
    setSessionPlan(plan)

    // Step 4: Persist session state to IndexedDB for recovery
    await persistSessionState({
      session,
      plan,
    })

    // Step 5: Generate first exercise
    const firstPlannedExercise = plan.exercises[0]
    if (!firstPlannedExercise) {
      setSessionError('No exercises in session plan')
      setLifecycleState('idle')
      return {
        status: 'error',
        message: 'No exercises in session plan',
      }
    }

    const seed = Date.now()
    try {
      const firstInstance = await generateInstance(
        firstPlannedExercise.templateId,
        seed,
        { locale: 'da-DK' } // TODO: Get from user preferences
      )

      setCurrentExercise(firstInstance, 1)
    } catch (error) {
      setSessionError('Failed to generate first exercise')
      setLifecycleState('idle')
      return {
        status: 'error',
        message: 'Failed to generate first exercise',
        error: error instanceof Error ? error : new Error(String(error)),
      }
    }

    // Step 6: Set lifecycle to active
    setLifecycleState('active')

    console.log('[SessionLifecycle] Session started successfully')

    return {
      status: 'success',
      data: { session, plan },
    }
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown error'
    setSessionError(errorMsg)
    setLifecycleState('idle')

    console.error('[SessionLifecycle] Error starting session:', error)

    return {
      status: 'error',
      message: errorMsg,
      error: error instanceof Error ? error : undefined,
    }
  }
}

/**
 * Pause the current session
 *
 * Pauses timers and updates session state. Does not persist to Supabase
 * immediately (will be updated when session ends).
 *
 * @returns Session operation result
 */
export async function pausePracticeSession(): Promise<SessionOperationResult<void>> {
  try {
    console.log('[SessionLifecycle] Pausing session...')

    const state = $sessionState.get()

    if (state.lifecycle !== 'active') {
      return {
        status: 'error',
        message: 'Cannot pause session - no active session',
      }
    }

    // Update state
    markSessionPaused()

    // Persist state to IndexedDB
    await persistSessionState({
      session: state.session!,
      plan: state.plan!,
      paused: true,
    })

    console.log('[SessionLifecycle] Session paused')

    return {
      status: 'success',
      data: undefined,
    }
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown error'
    console.error('[SessionLifecycle] Error pausing session:', error)

    return {
      status: 'error',
      message: errorMsg,
      error: error instanceof Error ? error : undefined,
    }
  }
}

/**
 * Resume a paused session
 *
 * Resumes timers and updates session state.
 *
 * @returns Session operation result
 */
export async function resumePracticeSession(): Promise<SessionOperationResult<void>> {
  try {
    console.log('[SessionLifecycle] Resuming session...')

    const state = $sessionState.get()

    if (state.lifecycle !== 'paused') {
      return {
        status: 'error',
        message: 'Cannot resume session - session is not paused',
      }
    }

    // Update state
    markSessionResumed()

    // Persist state to IndexedDB
    await persistSessionState({
      session: state.session!,
      plan: state.plan!,
      paused: false,
    })

    console.log('[SessionLifecycle] Session resumed')

    return {
      status: 'success',
      data: undefined,
    }
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown error'
    console.error('[SessionLifecycle] Error resuming session:', error)

    return {
      status: 'error',
      message: errorMsg,
      error: error instanceof Error ? error : undefined,
    }
  }
}

/**
 * End the current session
 *
 * Updates session record in Supabase with final statistics and cleans up state.
 *
 * Requirements:
 * - 12.5: Update session with end timestamp, total exercises, correct count, avg time
 *
 * @returns Session operation result with session summary
 */
export async function endPracticeSession(): Promise<
  SessionOperationResult<{
    sessionId: string
    completed: number
    correct: number
    successRate: number
    avgTimePerExercise: number
  }>
> {
  try {
    console.log('[SessionLifecycle] Ending session...')

    const state = $sessionState.get()

    if (!state.session) {
      return {
        status: 'error',
        message: 'Cannot end session - no active session',
      }
    }

    setLifecycleState('ending')

    // Get final statistics
    const { completed, correct, avgTimePerExercise, successRate } = state.statistics

    // Update session record in Supabase
    try {
      await endSessionInDB(
        state.session.id,
        completed,
        correct,
        avgTimePerExercise
      )
      console.log('[SessionLifecycle] Session record updated in database')
    } catch (error) {
      console.warn('[SessionLifecycle] Failed to update session record, queuing for offline sync:', error)

      // Queue session end for sync
      await syncManager.addToQueue({
        type: 'session_end',
        data: {
          sessionId: state.session.id,
          endedAt: new Date(),
          totalExercises: completed,
          correctCount: correct,
          avgTimePerExerciseSeconds: avgTimePerExercise,
        },
        timestamp: new Date(),
        retries: 0,
      })
    }

    // Clear persisted session state
    await clearPersistedSessionState()

    // Mark as completed
    setLifecycleState('completed')

    console.log('[SessionLifecycle] Session ended successfully')

    return {
      status: 'success',
      data: {
        sessionId: state.session.id,
        completed,
        correct,
        successRate,
        avgTimePerExercise,
      },
    }
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown error'
    setSessionError(errorMsg)

    console.error('[SessionLifecycle] Error ending session:', error)

    return {
      status: 'error',
      message: errorMsg,
      error: error instanceof Error ? error : undefined,
    }
  }
}

/**
 * Recover session from previous page load
 *
 * Checks for persisted session state and restores it if found.
 * Also checks Supabase for active sessions.
 *
 * @param userId - User UUID
 * @returns Session operation result with recovered session data
 */
export async function recoverSession(
  userId: string
): Promise<SessionOperationResult<{ session: PracticeSession; plan: SessionPlan } | null>> {
  try {
    console.log('[SessionLifecycle] Checking for recoverable session...')

    // First check IndexedDB for persisted state
    const persistedState = await loadPersistedSessionState()

    if (persistedState) {
      console.log('[SessionLifecycle] Found persisted session state')

      // Restore state
      setSessionRecord(persistedState.session)
      setSessionPlan(persistedState.plan)

      if (persistedState.paused) {
        setLifecycleState('paused')
      } else {
        setLifecycleState('active')
      }

      return {
        status: 'success',
        data: {
          session: persistedState.session,
          plan: persistedState.plan,
        },
      }
    }

    // Check Supabase for active session
    try {
      const activeSession = await fetchActiveSession(userId)

      if (activeSession) {
        console.log('[SessionLifecycle] Found active session in database:', activeSession.id)

        // We have an active session but no persisted plan
        // Mark as needing recovery
        return {
          status: 'success',
          data: null, // Indicate session exists but needs full recovery
        }
      }
    } catch (error) {
      console.warn('[SessionLifecycle] Failed to fetch active session from database:', error)
    }

    console.log('[SessionLifecycle] No recoverable session found')

    return {
      status: 'success',
      data: null,
    }
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown error'
    console.error('[SessionLifecycle] Error recovering session:', error)

    return {
      status: 'error',
      message: errorMsg,
      error: error instanceof Error ? error : undefined,
    }
  }
}

/**
 * Clear current session and reset state
 *
 * @returns Session operation result
 */
export async function clearSession(): Promise<SessionOperationResult<void>> {
  try {
    console.log('[SessionLifecycle] Clearing session...')

    // Clear persisted state
    await clearPersistedSessionState()

    // Reset state
    resetSessionState()

    console.log('[SessionLifecycle] Session cleared')

    return {
      status: 'success',
      data: undefined,
    }
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown error'
    console.error('[SessionLifecycle] Error clearing session:', error)

    return {
      status: 'error',
      message: errorMsg,
      error: error instanceof Error ? error : undefined,
    }
  }
}

// ============================================================================
// SESSION STATE PERSISTENCE (IndexedDB)
// ============================================================================

/**
 * Persisted session state structure
 */
interface PersistedSessionState {
  session: PracticeSession
  plan: SessionPlan
  paused: boolean
  savedAt: Date
}

const PERSISTED_SESSION_KEY = 'active-session'

/**
 * Persist session state to IndexedDB
 */
async function persistSessionState(state: {
  session: PracticeSession
  plan: SessionPlan
  paused?: boolean
}): Promise<void> {
  try {
    const persistedState: PersistedSessionState = {
      session: state.session,
      plan: state.plan,
      paused: state.paused ?? false,
      savedAt: new Date(),
    }

    await offlineStorage.setPreference(PERSISTED_SESSION_KEY, JSON.stringify(persistedState))
    console.log('[SessionLifecycle] Session state persisted to IndexedDB')
  } catch (error) {
    console.warn('[SessionLifecycle] Failed to persist session state:', error)
  }
}

/**
 * Load persisted session state from IndexedDB
 */
async function loadPersistedSessionState(): Promise<PersistedSessionState | null> {
  try {
    const data = await offlineStorage.getPreference(PERSISTED_SESSION_KEY)

    if (!data || typeof data !== 'string') {
      return null
    }

    const parsed = JSON.parse(data) as PersistedSessionState

    // Convert date strings back to Date objects
    parsed.session.startedAt = new Date(parsed.session.startedAt)
    if (parsed.session.endedAt) {
      parsed.session.endedAt = new Date(parsed.session.endedAt)
    }
    parsed.plan.composedAt = new Date(parsed.plan.composedAt)
    parsed.savedAt = new Date(parsed.savedAt)

    // Check if state is too old (more than 24 hours)
    const ageHours = (Date.now() - parsed.savedAt.getTime()) / (1000 * 60 * 60)
    if (ageHours > 24) {
      console.log('[SessionLifecycle] Persisted session state is too old, ignoring')
      await clearPersistedSessionState()
      return null
    }

    return parsed
  } catch (error) {
    console.warn('[SessionLifecycle] Failed to load persisted session state:', error)
    return null
  }
}

/**
 * Clear persisted session state from IndexedDB
 */
async function clearPersistedSessionState(): Promise<void> {
  try {
    await offlineStorage.removePreference(PERSISTED_SESSION_KEY)
    console.log('[SessionLifecycle] Persisted session state cleared')
  } catch (error) {
    console.warn('[SessionLifecycle] Failed to clear persisted session state:', error)
  }
}
