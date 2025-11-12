/**
 * Session Management Module
 *
 * Provides complete session management functionality including:
 * - Session lifecycle (start, pause, resume, end)
 * - Session state management (Nanostores)
 * - Session composition and planning
 * - Progress persistence (debounced batch writes)
 * - Offline persistence and recovery
 */

// Lifecycle management
export {
  startPracticeSession,
  pausePracticeSession,
  resumePracticeSession,
  endPracticeSession,
  recoverSession,
  clearSession,
  SessionLifecycleError,
  type StartSessionOptions,
  type SessionOperationResult,
} from './lifecycle'

// State management
export {
  $sessionState,
  $isSessionActive,
  $sessionProgress,
  $sessionTimeFormatted,
  $currentExerciseTimeFormatted,
  $sessionSummary,
  resetSessionState,
  setLifecycleState,
  setSessionRecord,
  setSessionPlan,
  setCurrentExercise,
  incrementHintsUsed,
  submitExercise,
  setSessionError,
  clearSessionError,
  markSessionPaused,
  markSessionResumed,
  destroySessionState,
  type SessionState,
  type SessionLifecycleState,
  type ExerciseState,
  type SessionStatistics,
} from '../stores/session-state'

// Session composition
export {
  composeSession,
  type ComposeSessionOptions,
} from './composer'

// Session types
export {
  type SessionPlan,
  type PlannedExercise,
  type SessionCompositionConfig,
  type SessionCompositionResult,
  type ContentCategory,
  type CategoryAllocation,
  DEFAULT_SESSION_CONFIG,
} from './types'

// Progress persistence
export {
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
  $isSyncInProgress,
  $hasPendingUpdates,
  $timeUntilNextSync,
  type ProgressPersistenceConfig,
  type ProgressUpdateStatus,
  type ProgressQueueState,
  type ProgressUpdateResult,
} from './progress-persistence'
