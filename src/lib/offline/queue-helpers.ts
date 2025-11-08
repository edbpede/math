/**
 * Queue Helper Functions
 *
 * Convenience functions to integrate sync queue into the exercise flow.
 * Automatically queues operations when offline and syncs when online.
 *
 * Requirements:
 * - 6.3: Queue operations when offline
 * - 6.4: Automatic sync when online
 */

import { syncManager } from './sync-manager'
import {
  logExerciseAttempt,
  endSession,
} from '../supabase/progress'
import { syncProgressUpdateWithConflictResolution } from './sync-operations'
import type { ExerciseAttempt, CompetencyProgress, SkillProgress } from '../mastery/types'

/**
 * Queue or directly sync an exercise completion
 *
 * If online: Directly log to Supabase
 * If offline: Add to sync queue
 *
 * @param attempt - Exercise attempt data (without id and createdAt)
 * @throws Error if queueing fails
 */
export async function queueExerciseComplete(
  attempt: Omit<ExerciseAttempt, 'id' | 'createdAt'>
): Promise<void> {
  const isOnline = syncManager.getOnlineStatus()

  if (isOnline) {
    try {
      // Directly log to Supabase
      await logExerciseAttempt(attempt)
      console.log('[QueueHelper] Exercise completion synced directly (online)')
    } catch (error) {
      console.warn('[QueueHelper] Failed to sync directly, queueing for later:', error)
      // Queue for later sync
      await queueExerciseCompleteOffline(attempt)
    }
  } else {
    // Queue for later sync
    await queueExerciseCompleteOffline(attempt)
  }
}

/**
 * Queue exercise completion for offline sync
 */
async function queueExerciseCompleteOffline(
  attempt: Omit<ExerciseAttempt, 'id' | 'createdAt'>
): Promise<void> {
  // Add id and createdAt for the queue item
  const queueItem = {
    ...attempt,
    id: crypto.randomUUID(),
    createdAt: new Date(),
  }

  await syncManager.addToQueue({
    type: 'exercise_complete',
    data: queueItem,
    timestamp: new Date(),
    retries: 0,
  })

  console.log('[QueueHelper] Exercise completion queued (offline)')
}

/**
 * Queue or directly sync progress updates
 *
 * If online: Directly update to Supabase with conflict resolution
 * If offline: Add to sync queue
 *
 * @param userId - User UUID
 * @param competency - Competency progress updates (optional)
 * @param skills - Skills progress updates (optional)
 * @throws Error if sync/queueing fails
 */
export async function queueProgressUpdate(
  userId: string,
  competency?: CompetencyProgress[],
  skills?: SkillProgress[]
): Promise<void> {
  const isOnline = syncManager.getOnlineStatus()

  if (isOnline) {
    try {
      // Directly sync with conflict resolution
      await syncProgressUpdateWithConflictResolution(userId, competency, skills)
      console.log('[QueueHelper] Progress update synced directly (online)')
    } catch (error) {
      console.warn('[QueueHelper] Failed to sync directly, queueing for later:', error)
      // Queue for later sync
      await queueProgressUpdateOffline(userId, competency, skills)
    }
  } else {
    // Queue for later sync
    await queueProgressUpdateOffline(userId, competency, skills)
  }
}

/**
 * Queue progress update for offline sync
 */
async function queueProgressUpdateOffline(
  userId: string,
  competency?: CompetencyProgress[],
  skills?: SkillProgress[]
): Promise<void> {
  await syncManager.addToQueue({
    type: 'progress_update',
    data: {
      userId,
      competencyProgress: competency,
      skillsProgress: skills,
    },
    timestamp: new Date(),
    retries: 0,
  })

  console.log('[QueueHelper] Progress update queued (offline)')
}

/**
 * Queue or directly sync session end
 *
 * If online: Directly end session on Supabase
 * If offline: Add to sync queue
 *
 * @param sessionId - Session UUID
 * @param totalExercises - Total exercises completed
 * @param correctCount - Number of correct answers
 * @param avgTimePerExerciseSeconds - Average time per exercise
 * @throws Error if sync/queueing fails
 */
export async function queueSessionEnd(
  sessionId: string,
  totalExercises: number,
  correctCount: number,
  avgTimePerExerciseSeconds: number
): Promise<void> {
  const isOnline = syncManager.getOnlineStatus()

  if (isOnline) {
    try {
      // Directly end session on Supabase
      await endSession(sessionId, totalExercises, correctCount, avgTimePerExerciseSeconds)
      console.log('[QueueHelper] Session end synced directly (online)')
    } catch (error) {
      console.warn('[QueueHelper] Failed to sync directly, queueing for later:', error)
      // Queue for later sync
      await queueSessionEndOffline(sessionId, totalExercises, correctCount, avgTimePerExerciseSeconds)
    }
  } else {
    // Queue for later sync
    await queueSessionEndOffline(sessionId, totalExercises, correctCount, avgTimePerExerciseSeconds)
  }
}

/**
 * Queue session end for offline sync
 */
async function queueSessionEndOffline(
  sessionId: string,
  totalExercises: number,
  correctCount: number,
  avgTimePerExerciseSeconds: number
): Promise<void> {
  await syncManager.addToQueue({
    type: 'session_end',
    data: {
      sessionId,
      endedAt: new Date(),
      totalExercises,
      correctCount,
      avgTimePerExerciseSeconds,
    },
    timestamp: new Date(),
    retries: 0,
  })

  console.log('[QueueHelper] Session end queued (offline)')
}

/**
 * Get current queue statistics
 *
 * Useful for displaying sync status in UI
 */
export async function getQueueStats(): Promise<{
  queueCount: number
  isOnline: boolean
  isSyncing: boolean
}> {
  return {
    queueCount: await syncManager.getQueueCount(),
    isOnline: syncManager.getOnlineStatus(),
    isSyncing: syncManager.getSyncingStatus(),
  }
}

/**
 * Clear the entire sync queue
 *
 * Use with caution - this will delete all pending sync operations.
 * Typically only used in settings or for debugging.
 */
export async function clearSyncQueue(): Promise<void> {
  await syncManager.clearQueue()
  console.log('[QueueHelper] Sync queue cleared')
}

