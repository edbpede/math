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
