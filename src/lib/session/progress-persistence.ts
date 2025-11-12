/**
 * Progress Persistence Layer
 *
 * Provides debounced progress updates with batch writes to Supabase.
 * Collects progress updates during a practice session and writes them
 * every 30 seconds for optimal performance and user experience.
 *
 * Features:
 * - Debounced updates (30 second intervals)
 * - Batch write operations for efficiency
 * - Optimistic UI updates via Nanostores
 * - Error handling with retry logic
 * - Offline support via sync queue
 *
 * Requirements:
 * - 12.3: Update mastery levels after each exercise completion
 * - 12.4: Write progress updates every 30 seconds using debounced batch writes
 */

import { atom, computed } from 'nanostores'
import {
  batchUpdateCompetencyProgress,
  batchUpdateSkillProgress,
  logExerciseAttempt,
  type ProgressError,
} from '../supabase/progress'
import type {
  CompetencyProgress,
  SkillProgress,
  ExerciseAttempt,
} from '../mastery/types'
import { syncManager } from '../offline/sync-manager'
import type { CompetencyAreaId } from '../curriculum/types'

// ============================================================================
// CONFIGURATION
// ============================================================================

/**
 * Configuration for progress persistence
 */
export interface ProgressPersistenceConfig {
  /** Debounce interval in milliseconds (default: 30000 = 30 seconds) */
  debounceMs: number
  /** Enable automatic persistence (default: true) */
  autoSync: boolean
  /** Maximum queue size before forcing flush (default: 50) */
  maxQueueSize: number
}

const DEFAULT_CONFIG: ProgressPersistenceConfig = {
  debounceMs: 30000, // 30 seconds as per Requirement 12.4
  autoSync: true,
  maxQueueSize: 50,
}

// ============================================================================
// TYPES
// ============================================================================

/**
 * Progress update status
 */
export type ProgressUpdateStatus =
  | 'idle' // No pending updates
  | 'pending' // Updates queued, waiting for debounce
  | 'syncing' // Currently writing to database
  | 'error' // Last sync failed

/**
 * Progress update queue state
 */
export interface ProgressQueueState {
  /** Current status */
  status: ProgressUpdateStatus
  /** Number of pending updates */
  pendingCount: number
  /** Last successful sync timestamp */
  lastSyncTime: Date | null
  /** Error message if status is 'error' */
  error: string | null
  /** Next scheduled sync time */
  nextSyncTime: Date | null
}

/**
 * Progress update result
 */
export type ProgressUpdateResult =
  | { status: 'success'; timestamp: Date }
  | { status: 'error'; message: string; error?: Error }
  | { status: 'queued'; queueSize: number }

// ============================================================================
// STATE MANAGEMENT (Nanostores)
// ============================================================================

/**
 * Progress queue state atom
 */
export const $progressQueueState = atom<ProgressQueueState>({
  status: 'idle',
  pendingCount: 0,
  lastSyncTime: null,
  error: null,
  nextSyncTime: null,
})

/**
 * Competency progress cache (optimistic updates)
 */
export const $competencyProgressCache = atom<Map<string, CompetencyProgress>>(
  new Map()
)

/**
 * Skill progress cache (optimistic updates)
 */
export const $skillProgressCache = atom<Map<string, SkillProgress>>(new Map())

/**
 * Computed: Is sync in progress
 */
export const $isSyncInProgress = computed($progressQueueState, (state) => {
  return state.status === 'syncing'
})

/**
 * Computed: Has pending updates
 */
export const $hasPendingUpdates = computed($progressQueueState, (state) => {
  return state.pendingCount > 0
})

/**
 * Computed: Time until next sync (formatted string)
 */
export const $timeUntilNextSync = computed($progressQueueState, (state) => {
  if (!state.nextSyncTime || state.status !== 'pending') {
    return null
  }

  const now = Date.now()
  const nextSync = state.nextSyncTime.getTime()
  const secondsRemaining = Math.ceil((nextSync - now) / 1000)

  if (secondsRemaining <= 0) {
    return 'Syncing soon...'
  }

  return `${secondsRemaining}s`
})

// ============================================================================
// INTERNAL STATE
// ============================================================================

/**
 * Pending competency progress updates (keyed by competencyAreaId-gradeRange)
 */
const pendingCompetencyUpdates = new Map<string, CompetencyProgress>()

/**
 * Pending skill progress updates (keyed by skillId)
 */
const pendingSkillUpdates = new Map<string, SkillProgress>()

/**
 * Pending exercise attempts (to be logged)
 */
const pendingExerciseAttempts: Array<Omit<ExerciseAttempt, 'id' | 'createdAt'>> =
  []

/**
 * Debounce timer for batch writes
 */
let debounceTimer: ReturnType<typeof setTimeout> | null = null

/**
 * Configuration
 */
let config: ProgressPersistenceConfig = DEFAULT_CONFIG

/**
 * User ID for current session
 */
let currentUserId: string | null = null

// ============================================================================
// INITIALIZATION
// ============================================================================

/**
 * Initialize progress persistence layer
 *
 * @param userId - User UUID for current session
 * @param userConfig - Optional configuration overrides
 */
export function initializeProgressPersistence(
  userId: string,
  userConfig: Partial<ProgressPersistenceConfig> = {}
): void {
  console.log('[ProgressPersistence] Initializing for user:', userId)

  // Set user ID
  currentUserId = userId

  // Merge configuration
  config = { ...DEFAULT_CONFIG, ...userConfig }

  // Reset state
  resetProgressPersistence()

  console.log('[ProgressPersistence] Initialized with config:', config)
}

/**
 * Reset progress persistence state
 */
export function resetProgressPersistence(): void {
  console.log('[ProgressPersistence] Resetting state')

  // Clear pending updates
  pendingCompetencyUpdates.clear()
  pendingSkillUpdates.clear()
  pendingExerciseAttempts.length = 0

  // Clear debounce timer
  if (debounceTimer) {
    clearTimeout(debounceTimer)
    debounceTimer = null
  }

  // Reset state
  $progressQueueState.set({
    status: 'idle',
    pendingCount: 0,
    lastSyncTime: null,
    error: null,
    nextSyncTime: null,
  })

  // Clear caches
  $competencyProgressCache.set(new Map())
  $skillProgressCache.set(new Map())
}

/**
 * Destroy progress persistence (cleanup)
 */
export function destroyProgressPersistence(): void {
  console.log('[ProgressPersistence] Destroying')

  // Flush any pending updates
  if ($hasPendingUpdates.get()) {
    console.warn('[ProgressPersistence] Flushing pending updates before destroy')
    void flushProgressUpdates()
  }

  resetProgressPersistence()
  currentUserId = null
}

// ============================================================================
// PUBLIC API - UPDATE OPERATIONS
// ============================================================================

/**
 * Queue a competency progress update
 *
 * Updates are applied optimistically to the cache and debounced for batch writing.
 *
 * @param progress - Competency progress to update
 * @returns Update result
 */
export function queueCompetencyProgressUpdate(
  progress: CompetencyProgress
): ProgressUpdateResult {
  if (!currentUserId) {
    return {
      status: 'error',
      message: 'Progress persistence not initialized',
    }
  }

  console.log(
    '[ProgressPersistence] Queuing competency update:',
    progress.competencyAreaId,
    progress.gradeRange
  )

  // Create unique key for this competency-grade combination
  const key = `${progress.competencyAreaId}-${progress.gradeRange}`

  // Add to pending updates (will overwrite if already exists)
  pendingCompetencyUpdates.set(key, progress)

  // Update optimistic cache
  const cache = $competencyProgressCache.get()
  cache.set(key, progress)
  $competencyProgressCache.set(new Map(cache))

  // Update queue state
  updateQueueState()

  // Schedule debounced flush
  scheduleDebouncedFlush()

  return {
    status: 'queued',
    queueSize: getTotalQueueSize(),
  }
}

/**
 * Queue a skill progress update
 *
 * Updates are applied optimistically to the cache and debounced for batch writing.
 *
 * @param progress - Skill progress to update
 * @returns Update result
 */
export function queueSkillProgressUpdate(
  progress: SkillProgress
): ProgressUpdateResult {
  if (!currentUserId) {
    return {
      status: 'error',
      message: 'Progress persistence not initialized',
    }
  }

  console.log('[ProgressPersistence] Queuing skill update:', progress.skillId)

  // Add to pending updates (will overwrite if already exists)
  pendingSkillUpdates.set(progress.skillId, progress)

  // Update optimistic cache
  const cache = $skillProgressCache.get()
  cache.set(progress.skillId, progress)
  $skillProgressCache.set(new Map(cache))

  // Update queue state
  updateQueueState()

  // Schedule debounced flush
  scheduleDebouncedFlush()

  return {
    status: 'queued',
    queueSize: getTotalQueueSize(),
  }
}

/**
 * Queue an exercise attempt to be logged
 *
 * Exercise attempts are logged immediately (not debounced) to ensure
 * accurate history tracking.
 *
 * @param attempt - Exercise attempt to log
 * @returns Update result
 */
export async function queueExerciseAttempt(
  attempt: Omit<ExerciseAttempt, 'id' | 'createdAt'>
): Promise<ProgressUpdateResult> {
  if (!currentUserId) {
    return {
      status: 'error',
      message: 'Progress persistence not initialized',
    }
  }

  console.log('[ProgressPersistence] Logging exercise attempt:', attempt.templateId)

  // Exercise attempts are logged immediately, not debounced
  // This ensures we don't lose exercise history if user closes browser
  try {
    await logExerciseAttempt(attempt)
    return {
      status: 'success',
      timestamp: new Date(),
    }
  } catch (error) {
    console.warn(
      '[ProgressPersistence] Failed to log exercise attempt, queuing for offline sync:',
      error
    )

    // Queue for offline sync
    await syncManager.queue({
      type: 'exercise-attempt',
      data: attempt,
      timestamp: new Date(),
    })

    return {
      status: 'queued',
      queueSize: 1,
    }
  }
}

/**
 * Manually trigger progress flush
 *
 * Forces immediate write of all pending progress updates.
 * Useful when ending a session or user explicitly requests sync.
 *
 * @returns Update result
 */
export async function flushProgressUpdates(): Promise<ProgressUpdateResult> {
  if (!currentUserId) {
    return {
      status: 'error',
      message: 'Progress persistence not initialized',
    }
  }

  // Cancel pending debounce
  if (debounceTimer) {
    clearTimeout(debounceTimer)
    debounceTimer = null
  }

  return performBatchWrite()
}

// ============================================================================
// INTERNAL - DEBOUNCE & FLUSH LOGIC
// ============================================================================

/**
 * Schedule a debounced flush
 */
function scheduleDebouncedFlush(): void {
  if (!config.autoSync) {
    console.log('[ProgressPersistence] Auto-sync disabled, skipping schedule')
    return
  }

  // Clear existing timer
  if (debounceTimer) {
    clearTimeout(debounceTimer)
  }

  // Calculate next sync time
  const nextSyncTime = new Date(Date.now() + config.debounceMs)

  // Update queue state with next sync time
  const state = $progressQueueState.get()
  $progressQueueState.set({
    ...state,
    nextSyncTime,
  })

  // Check if we should force flush due to queue size
  const queueSize = getTotalQueueSize()
  if (queueSize >= config.maxQueueSize) {
    console.log(
      '[ProgressPersistence] Queue size limit reached, forcing immediate flush'
    )
    void performBatchWrite()
    return
  }

  // Schedule debounced flush
  debounceTimer = setTimeout(() => {
    console.log('[ProgressPersistence] Debounce timer fired, flushing updates')
    void performBatchWrite()
  }, config.debounceMs)

  console.log(
    `[ProgressPersistence] Scheduled flush in ${config.debounceMs}ms (queue size: ${queueSize})`
  )
}

/**
 * Perform batch write of all pending updates
 */
async function performBatchWrite(): Promise<ProgressUpdateResult> {
  if (!currentUserId) {
    return {
      status: 'error',
      message: 'Progress persistence not initialized',
    }
  }

  const queueSize = getTotalQueueSize()

  if (queueSize === 0) {
    console.log('[ProgressPersistence] No pending updates, skipping flush')
    return {
      status: 'success',
      timestamp: new Date(),
    }
  }

  console.log(`[ProgressPersistence] Starting batch write (${queueSize} updates)`)

  // Update state to syncing
  $progressQueueState.set({
    ...$progressQueueState.get(),
    status: 'syncing',
  })

  try {
    // Batch write competency progress
    if (pendingCompetencyUpdates.size > 0) {
      const competencyList = Array.from(pendingCompetencyUpdates.values())
      console.log(
        `[ProgressPersistence] Writing ${competencyList.length} competency updates`
      )

      try {
        await batchUpdateCompetencyProgress(currentUserId, competencyList)
        pendingCompetencyUpdates.clear()
      } catch (error) {
        console.warn(
          '[ProgressPersistence] Failed to write competency progress, queuing for offline sync:',
          error
        )

        // Queue for offline sync
        await syncManager.queue({
          type: 'competency-progress-batch',
          data: {
            userId: currentUserId,
            progressList: competencyList,
          },
          timestamp: new Date(),
        })

        // Clear pending updates since they're queued
        pendingCompetencyUpdates.clear()
      }
    }

    // Batch write skill progress
    if (pendingSkillUpdates.size > 0) {
      const skillList = Array.from(pendingSkillUpdates.values())
      console.log(`[ProgressPersistence] Writing ${skillList.length} skill updates`)

      try {
        await batchUpdateSkillProgress(currentUserId, skillList)
        pendingSkillUpdates.clear()
      } catch (error) {
        console.warn(
          '[ProgressPersistence] Failed to write skill progress, queuing for offline sync:',
          error
        )

        // Queue for offline sync
        await syncManager.queue({
          type: 'skill-progress-batch',
          data: {
            userId: currentUserId,
            progressList: skillList,
          },
          timestamp: new Date(),
        })

        // Clear pending updates since they're queued
        pendingSkillUpdates.clear()
      }
    }

    // Update state to idle
    $progressQueueState.set({
      status: 'idle',
      pendingCount: 0,
      lastSyncTime: new Date(),
      error: null,
      nextSyncTime: null,
    })

    console.log('[ProgressPersistence] Batch write completed successfully')

    return {
      status: 'success',
      timestamp: new Date(),
    }
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown error'
    console.error('[ProgressPersistence] Batch write failed:', error)

    // Update state to error
    $progressQueueState.set({
      ...$progressQueueState.get(),
      status: 'error',
      error: errorMsg,
    })

    return {
      status: 'error',
      message: errorMsg,
      error: error instanceof Error ? error : undefined,
    }
  }
}

/**
 * Update queue state with current pending counts
 */
function updateQueueState(): void {
  const state = $progressQueueState.get()
  const pendingCount = getTotalQueueSize()

  $progressQueueState.set({
    ...state,
    status: pendingCount > 0 ? 'pending' : 'idle',
    pendingCount,
  })
}

/**
 * Get total queue size
 */
function getTotalQueueSize(): number {
  return (
    pendingCompetencyUpdates.size +
    pendingSkillUpdates.size +
    pendingExerciseAttempts.length
  )
}

// ============================================================================
// PUBLIC API - CACHE ACCESS
// ============================================================================

/**
 * Get competency progress from cache
 *
 * @param competencyAreaId - Competency area ID
 * @param gradeRange - Grade range
 * @returns Cached competency progress or null
 */
export function getCachedCompetencyProgress(
  competencyAreaId: CompetencyAreaId,
  gradeRange: string
): CompetencyProgress | null {
  const key = `${competencyAreaId}-${gradeRange}`
  const cache = $competencyProgressCache.get()
  return cache.get(key) ?? null
}

/**
 * Get skill progress from cache
 *
 * @param skillId - Skill ID
 * @returns Cached skill progress or null
 */
export function getCachedSkillProgress(skillId: string): SkillProgress | null {
  const cache = $skillProgressCache.get()
  return cache.get(skillId) ?? null
}

/**
 * Populate cache from fetched progress data
 *
 * @param competencyProgress - Array of competency progress records
 * @param skillProgress - Array of skill progress records
 */
export function populateProgressCache(
  competencyProgress: CompetencyProgress[],
  skillProgress: SkillProgress[]
): void {
  console.log('[ProgressPersistence] Populating progress cache')

  // Populate competency cache
  const competencyCache = new Map<string, CompetencyProgress>()
  for (const progress of competencyProgress) {
    const key = `${progress.competencyAreaId}-${progress.gradeRange}`
    competencyCache.set(key, progress)
  }
  $competencyProgressCache.set(competencyCache)

  // Populate skill cache
  const skillCache = new Map<string, SkillProgress>()
  for (const progress of skillProgress) {
    skillCache.set(progress.skillId, progress)
  }
  $skillProgressCache.set(skillCache)

  console.log(
    `[ProgressPersistence] Cache populated: ${competencyCache.size} competencies, ${skillCache.size} skills`
  )
}
