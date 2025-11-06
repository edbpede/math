/**
 * Supabase Client Singleton
 *
 * Creates and exports a configured Supabase client instance with:
 * - Type-safe database operations using generated types
 * - Auth persistence in localStorage for "Remember this device" functionality
 * - Realtime subscriptions enabled for cross-device sync
 * - Proper error handling and configuration validation
 *
 * Environment Variables Required:
 * - PUBLIC_SUPABASE_URL: Your Supabase project URL
 * - PUBLIC_SUPABASE_ANON_KEY: Your Supabase anonymous/public API key
 *
 * @see https://supabase.com/docs/reference/javascript/initializing
 */

import { createClient } from '@supabase/supabase-js'
import type { Database } from './types'

/**
 * Get environment variable with validation
 * Throws error if required variable is missing
 */
function getEnvVar(key: string): string {
  const value = import.meta.env[key]
  if (!value) {
    throw new Error(
      `Missing required environment variable: ${key}. ` +
      `Please add it to your .env file. See .env.example for reference.`
    )
  }
  return value
}

// Validate and get environment variables
const supabaseUrl = getEnvVar('PUBLIC_SUPABASE_URL')
const supabaseAnonKey = getEnvVar('PUBLIC_SUPABASE_ANON_KEY')

/**
 * Supabase client singleton instance
 *
 * Configured with:
 * - Database type for end-to-end type safety
 * - localStorage auth persistence (survives page reloads)
 * - Automatic session refresh
 * - Realtime enabled for cross-device sync
 * - Custom storage key for namespacing
 */
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    // Store auth session in localStorage
    // This enables "Remember this device" functionality
    storage: typeof window !== 'undefined' ? window.localStorage : undefined,

    // Automatically refresh the session before it expires
    autoRefreshToken: true,

    // Persist the session across page reloads
    persistSession: true,

    // Detect when the session has been deleted elsewhere
    detectSessionInUrl: true,

    // Use a custom storage key to avoid conflicts
    storageKey: 'math-edbpede-auth',
  },

  realtime: {
    // Enable Realtime for cross-device synchronization
    // This allows progress updates to broadcast to all active user devices
    params: {
      eventsPerSecond: 10,
    },
  },

  global: {
    headers: {
      // Identify the client application
      'X-Client-Info': 'math-edbpede-web',
    },
  },
})

/**
 * Helper function to check if Supabase client is properly configured
 * Useful for debugging and health checks
 */
export function isSupabaseConfigured(): boolean {
  try {
    return !!(
      import.meta.env.PUBLIC_SUPABASE_URL &&
      import.meta.env.PUBLIC_SUPABASE_ANON_KEY
    )
  } catch {
    return false
  }
}

/**
 * Get the current session from Supabase
 * Returns null if no active session
 */
export async function getCurrentSession() {
  const { data: { session }, error } = await supabase.auth.getSession()

  if (error) {
    console.error('Error getting session:', error)
    return null
  }

  return session
}

/**
 * Get the current user from Supabase
 * Returns null if no authenticated user
 */
export async function getCurrentUser() {
  const { data: { user }, error } = await supabase.auth.getUser()

  if (error) {
    console.error('Error getting user:', error)
    return null
  }

  return user
}

/**
 * Check if there is an active authenticated session
 */
export async function isAuthenticated(): Promise<boolean> {
  const session = await getCurrentSession()
  return session !== null
}
