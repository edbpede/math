/**
 * GET /api/preferences/get?userId=<uuid>
 *
 * Gets the user's preferences from Supabase.
 *
 * Query params:
 * - userId: User's UUID
 *
 * Response (success):
 * {
 *   success: true,
 *   preferences: UserPreferences
 * }
 *
 * Response (error):
 * {
 *   success: false,
 *   error: string,
 *   code: string
 * }
 *
 * @see Requirements 9.2
 */

import type { APIRoute } from 'astro'
import { getUserByUUID } from '@/lib/auth/service'
import { createSecurityHeaders } from '@/lib/security'

export const GET: APIRoute = async ({ url }) => {
  // Determine if in development mode (for security header configuration)
  const isDevelopment = import.meta.env.DEV

  try {
    // Get userId from query params
    const userId = url.searchParams.get('userId')

    if (!userId) {
      const headers = createSecurityHeaders(isDevelopment, {
        'Content-Type': 'application/json',
      })

      return new Response(
        JSON.stringify({
          success: false,
          error: 'Missing userId parameter',
          code: 'MISSING_USER_ID',
        }),
        {
          status: 400,
          headers,
        }
      )
    }

    // Get user data including preferences
    const result = await getUserByUUID(userId)

    if (!result.success || !result.data) {
      const headers = createSecurityHeaders(isDevelopment, {
        'Content-Type': 'application/json',
      })

      return new Response(
        JSON.stringify({
          success: false,
          error: 'User not found',
          code: 'USER_NOT_FOUND',
        }),
        {
          status: 404,
          headers,
        }
      )
    }

    // Return preferences
    const headers = createSecurityHeaders(isDevelopment, {
      'Content-Type': 'application/json',
    })

    return new Response(
      JSON.stringify({
        success: true,
        preferences: result.data.user.preferences || {},
      }),
      {
        status: 200,
        headers,
      }
    )
  } catch (error) {
    console.error('Error in /api/preferences/get:', error)
    const headers = createSecurityHeaders(isDevelopment, {
      'Content-Type': 'application/json',
    })

    return new Response(
      JSON.stringify({
        success: false,
        error: 'An unexpected error occurred',
        code: 'UNEXPECTED_ERROR',
      }),
      {
        status: 500,
        headers,
      }
    )
  }
}
