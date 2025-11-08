/**
 * Authentication Service
 *
 * Provides UUID-based anonymous authentication with session management.
 * Uses Supabase for user storage and implements secure session handling
 * with httpOnly cookies.
 *
 * Key Features:
 * - Cryptographically secure UUID generation
 * - No personal data collection (privacy-first)
 * - HttpOnly cookie sessions (XSS protection)
 * - Rate limiting support
 * - Automatic session refresh
 *
 * @see Requirements 1.1, 1.2, 1.5
 */

import { supabase } from '../supabase/client'
import { generateUUID, formatUUID, parseUUID, validateUUID } from './uuid'
import type { Database } from '../supabase/types'

/**
 * Session data structure
 */
export interface Session {
  userId: string
  uuid: string // The user's formatted UUID
  createdAt: Date
  expiresAt: Date
  gradeRange?: '0-3' | '4-6' | '7-9'
  locale?: 'da-DK' | 'en-US'
}

/**
 * User data structure
 */
export interface User {
  id: string
  createdAt: Date
  lastActiveAt: Date
  gradeRange: '0-3' | '4-6' | '7-9'
  locale: 'da-DK' | 'en-US'
  preferences: Record<string, unknown>
}

/**
 * Result type for auth operations
 */
export type AuthResult<T> =
  | { success: true; data: T }
  | { success: false; error: string; code?: string }

/**
 * Creates a new user with a generated UUID
 *
 * Workflow:
 * 1. Generate cryptographically secure UUID
 * 2. Format to user-friendly format (XXXX-XXXX-XXXX-XXXX)
 * 3. Create user record in Supabase
 * 4. Return user data and formatted UUID
 *
 * @param gradeRange - User's grade level
 * @param locale - User's preferred language
 * @returns Result with user data and UUID
 *
 * @example
 * const result = await createUser('4-6', 'da-DK')
 * if (result.success) {
 *   console.log('UUID:', result.data.uuid)
 * }
 */
export async function createUser(
  gradeRange: '0-3' | '4-6' | '7-9',
  locale: 'da-DK' | 'en-US' = 'da-DK'
): Promise<AuthResult<{ user: User; uuid: string; formattedUUID: string }>> {
  try {
    // Generate a new UUID
    const uuid = generateUUID()
    const formattedUUID = formatUUID(uuid)
    const normalizedUUID = parseUUID(uuid)

    if (!normalizedUUID) {
      return {
        success: false,
        error: 'Failed to generate valid UUID',
        code: 'UUID_GENERATION_FAILED',
      }
    }

    // Create user in database
    const { data, error } = await supabase
      .from('users')
      .insert({
        id: normalizedUUID,
        grade_range: gradeRange,
        locale: locale,
        preferences: {},
        created_at: new Date().toISOString(),
        last_active_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating user:', error)
      return {
        success: false,
        error: 'Failed to create user account',
        code: 'USER_CREATION_FAILED',
      }
    }

    if (!data) {
      return {
        success: false,
        error: 'No data returned from user creation',
        code: 'NO_DATA',
      }
    }

    // Convert database row to User type
    const user: User = {
      id: data.id,
      createdAt: new Date(data.created_at),
      lastActiveAt: new Date(data.last_active_at),
      gradeRange: data.grade_range,
      locale: data.locale,
      preferences: (data.preferences as Record<string, unknown>) || {},
    }

    return {
      success: true,
      data: {
        user,
        uuid: normalizedUUID,
        formattedUUID,
      },
    }
  } catch (error) {
    console.error('Unexpected error creating user:', error)
    return {
      success: false,
      error: 'An unexpected error occurred',
      code: 'UNEXPECTED_ERROR',
    }
  }
}

/**
 * Signs in a user with their UUID
 *
 * Workflow:
 * 1. Validate UUID format
 * 2. Normalize UUID to standard format
 * 3. Look up user in database
 * 4. Update last_active_at timestamp
 * 5. Return user data
 *
 * @param uuid - User's UUID (formatted or standard)
 * @returns Result with user data
 *
 * @example
 * const result = await signInWithUUID('7b3f-4c2a-8d1e-9f6b')
 * if (result.success) {
 *   console.log('Welcome back!', result.data.user.locale)
 * }
 */
export async function signInWithUUID(
  uuid: string
): Promise<AuthResult<{ user: User; formattedUUID: string }>> {
  try {
    // Validate UUID format
    if (!validateUUID(uuid)) {
      return {
        success: false,
        error: 'Invalid UUID format',
        code: 'INVALID_UUID_FORMAT',
      }
    }

    // Normalize UUID
    const normalizedUUID = parseUUID(uuid)
    if (!normalizedUUID) {
      return {
        success: false,
        error: 'Invalid UUID',
        code: 'INVALID_UUID',
      }
    }

    // Look up user in database
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', normalizedUUID)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        // No rows returned - user not found
        return {
          success: false,
          error: 'UUID not found',
          code: 'UUID_NOT_FOUND',
        }
      }

      console.error('Error looking up user:', error)
      return {
        success: false,
        error: 'Failed to look up user',
        code: 'LOOKUP_FAILED',
      }
    }

    if (!data) {
      return {
        success: false,
        error: 'User not found',
        code: 'USER_NOT_FOUND',
      }
    }

    // Update last active timestamp
    await supabase
      .from('users')
      .update({ last_active_at: new Date().toISOString() })
      .eq('id', normalizedUUID)

    // Convert database row to User type
    const user: User = {
      id: data.id,
      createdAt: new Date(data.created_at),
      lastActiveAt: new Date(data.last_active_at),
      gradeRange: data.grade_range,
      locale: data.locale,
      preferences: (data.preferences as Record<string, unknown>) || {},
    }

    return {
      success: true,
      data: {
        user,
        formattedUUID: formatUUID(data.id),
      },
    }
  } catch (error) {
    console.error('Unexpected error signing in:', error)
    return {
      success: false,
      error: 'An unexpected error occurred',
      code: 'UNEXPECTED_ERROR',
    }
  }
}

/**
 * Gets a user by their UUID
 *
 * Similar to signInWithUUID but doesn't update last_active_at.
 * Used for session validation and user data retrieval.
 *
 * @param uuid - User's UUID (formatted or standard)
 * @returns Result with user data or null if not found
 */
export async function getUserByUUID(
  uuid: string
): Promise<AuthResult<{ user: User } | null>> {
  try {
    if (!validateUUID(uuid)) {
      return {
        success: false,
        error: 'Invalid UUID format',
        code: 'INVALID_UUID_FORMAT',
      }
    }

    const normalizedUUID = parseUUID(uuid)
    if (!normalizedUUID) {
      return {
        success: false,
        error: 'Invalid UUID',
        code: 'INVALID_UUID',
      }
    }

    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', normalizedUUID)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return { success: true, data: null }
      }

      console.error('Error getting user:', error)
      return {
        success: false,
        error: 'Failed to get user',
        code: 'GET_USER_FAILED',
      }
    }

    if (!data) {
      return { success: true, data: null }
    }

    const user: User = {
      id: data.id,
      createdAt: new Date(data.created_at),
      lastActiveAt: new Date(data.last_active_at),
      gradeRange: data.grade_range,
      locale: data.locale,
      preferences: (data.preferences as Record<string, unknown>) || {},
    }

    return {
      success: true,
      data: { user },
    }
  } catch (error) {
    console.error('Unexpected error getting user:', error)
    return {
      success: false,
      error: 'An unexpected error occurred',
      code: 'UNEXPECTED_ERROR',
    }
  }
}

/**
 * Updates user preferences
 *
 * @param userId - User's UUID
 * @param updates - Partial user data to update
 * @returns Result with updated user data
 */
export async function updateUser(
  userId: string,
  updates: {
    gradeRange?: '0-3' | '4-6' | '7-9'
    locale?: 'da-DK' | 'en-US'
    preferences?: Record<string, unknown>
  }
): Promise<AuthResult<{ user: User }>> {
  try {
    const { data, error } = await supabase
      .from('users')
      .update({
        ...(updates.gradeRange && { grade_range: updates.gradeRange }),
        ...(updates.locale && { locale: updates.locale }),
        ...(updates.preferences && { preferences: updates.preferences }),
        last_active_at: new Date().toISOString(),
      })
      .eq('id', userId)
      .select()
      .single()

    if (error) {
      console.error('Error updating user:', error)
      return {
        success: false,
        error: 'Failed to update user',
        code: 'UPDATE_FAILED',
      }
    }

    if (!data) {
      return {
        success: false,
        error: 'User not found',
        code: 'USER_NOT_FOUND',
      }
    }

    const user: User = {
      id: data.id,
      createdAt: new Date(data.created_at),
      lastActiveAt: new Date(data.last_active_at),
      gradeRange: data.grade_range,
      locale: data.locale,
      preferences: (data.preferences as Record<string, unknown>) || {},
    }

    return {
      success: true,
      data: { user },
    }
  } catch (error) {
    console.error('Unexpected error updating user:', error)
    return {
      success: false,
      error: 'An unexpected error occurred',
      code: 'UNEXPECTED_ERROR',
    }
  }
}

/**
 * Deletes a user account and all associated data
 *
 * Due to CASCADE constraints, this will also delete:
 * - competency_progress
 * - skills_progress
 * - exercise_history
 * - sessions
 *
 * @param userId - User's UUID
 * @returns Result indicating success or failure
 */
export async function deleteUser(
  userId: string
): Promise<AuthResult<{ deleted: boolean }>> {
  try {
    const { error } = await supabase.from('users').delete().eq('id', userId)

    if (error) {
      console.error('Error deleting user:', error)
      return {
        success: false,
        error: 'Failed to delete user',
        code: 'DELETE_FAILED',
      }
    }

    return {
      success: true,
      data: { deleted: true },
    }
  } catch (error) {
    console.error('Unexpected error deleting user:', error)
    return {
      success: false,
      error: 'An unexpected error occurred',
      code: 'UNEXPECTED_ERROR',
    }
  }
}

/**
 * Gets the current authenticated user from the session
 *
 * This is a client-side function that calls the /api/auth/session endpoint.
 * Use this in SolidJS components or other client-side code.
 *
 * @returns Promise with the current user or null if not authenticated
 *
 * @example
 * const user = await getCurrentUser()
 * if (user) {
 *   console.log('User ID:', user.id)
 * }
 */
export async function getCurrentUser(): Promise<User | null> {
  try {
    const response = await fetch('/api/auth/session', {
      method: 'GET',
      credentials: 'include', // Include cookies
      headers: {
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      console.error('Failed to fetch current user:', response.statusText)
      return null
    }

    const data = await response.json()

    if (!data.success || !data.authenticated || !data.user) {
      return null
    }

    // Convert ISO date strings back to Date objects
    return {
      id: data.user.id,
      gradeRange: data.user.gradeRange,
      locale: data.user.locale,
      createdAt: new Date(data.user.createdAt),
      lastActiveAt: new Date(data.user.lastActiveAt),
      preferences: data.user.preferences || {},
    }
  } catch (error) {
    console.error('Error getting current user:', error)
    return null
  }
}
