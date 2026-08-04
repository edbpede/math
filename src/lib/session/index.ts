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

// State management
export {
  $currentExerciseTimeFormatted,
  $isSessionActive,
  $sessionProgress,
  $sessionState,
  $sessionSummary,
  $sessionTimeFormatted,
  clearSessionError,
  destroySessionState,
  type ExerciseState,
  incrementHintsUsed,
  markSessionPaused,
  markSessionResumed,
  resetSessionState,
  type SessionLifecycleState,
  type SessionState,
  type SessionStatistics,
  setCurrentExercise,
  setLifecycleState,
  setSessionError,
  setSessionPlan,
  setSessionRecord,
  submitExercise,
} from "../stores/session-state";
// Session composition
export {
  type ComposeSessionOptions,
  composeSession,
} from "./composer";
// Lifecycle management
export {
  clearSession,
  endPracticeSession,
  pausePracticeSession,
  recoverSession,
  resumePracticeSession,
  SessionLifecycleError,
  type SessionOperationResult,
  type StartSessionOptions,
  startPracticeSession,
} from "./lifecycle";
// Progress persistence
export {
  $competencyProgressCache,
  $hasPendingUpdates,
  $isSyncInProgress,
  $progressQueueState,
  $skillProgressCache,
  $timeUntilNextSync,
  destroyProgressPersistence,
  flushProgressUpdates,
  getCachedCompetencyProgress,
  getCachedSkillProgress,
  initializeProgressPersistence,
  type ProgressPersistenceConfig,
  type ProgressQueueState,
  type ProgressUpdateResult,
  type ProgressUpdateStatus,
  populateProgressCache,
  queueCompetencyProgressUpdate,
  queueExerciseAttempt,
  queueSkillProgressUpdate,
  resetProgressPersistence,
} from "./progress-persistence";
// Session types
export {
  type CategoryAllocation,
  type ContentCategory,
  DEFAULT_SESSION_CONFIG,
  type PlannedExercise,
  type SessionCompositionConfig,
  type SessionCompositionResult,
  type SessionPlan,
} from "./types";
