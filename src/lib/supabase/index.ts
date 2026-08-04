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
  getCurrentSession,
  getCurrentUser,
  isAuthenticated,
  isSupabaseConfigured,
  supabase,
} from "./client";
// Progress tracking data access layer
export {
  batchLogExerciseAttempts,
  batchUpdateCompetencyProgress,
  batchUpdateSkillProgress,
  endSession,
  fetchActiveSession,
  // Fetch operations
  fetchCompetencyProgress,
  fetchCompetencyProgressByArea,
  fetchExerciseHistory,
  fetchExerciseHistoryBySkill,
  fetchRecentSessions,
  fetchSession,
  fetchSkillProgressBySkill,
  fetchSkillsDueForReview,
  fetchSkillsProgress,
  // Exercise history operations
  logExerciseAttempt,
  ProgressError,
  // Session management operations
  startSession,
  // Update operations
  updateCompetencyProgress,
  updateSession,
  updateSkillProgress,
} from "./progress";
export type { Database } from "./types";
