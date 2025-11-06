/**
 * Supabase Integration Module
 *
 * Central export point for all Supabase-related functionality
 *
 * @example
 * ```ts
 * import { supabase } from '@/lib/supabase'
 *
 * // Query with type safety
 * const { data, error } = await supabase
 *   .from('users')
 *   .select('*')
 *   .eq('id', userId)
 * ```
 */

export {
  supabase,
  isSupabaseConfigured,
  getCurrentSession,
  getCurrentUser,
  isAuthenticated,
} from './client'

export type { Database } from './types'

// Progress tracking data access layer
export {
  ProgressError,
  // Fetch operations
  fetchCompetencyProgress,
  fetchCompetencyProgressByArea,
  fetchSkillsProgress,
  fetchSkillProgressBySkill,
  fetchSkillsDueForReview,
  fetchExerciseHistory,
  fetchExerciseHistoryBySkill,
  // Update operations
  updateCompetencyProgress,
  updateSkillProgress,
  batchUpdateCompetencyProgress,
  batchUpdateSkillProgress,
  // Exercise history operations
  logExerciseAttempt,
  batchLogExerciseAttempts,
  // Session management operations
  startSession,
  updateSession,
  endSession,
  fetchSession,
  fetchRecentSessions,
  fetchActiveSession,
} from './progress'
