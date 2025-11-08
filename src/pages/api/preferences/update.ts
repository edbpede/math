/**
 * POST /api/preferences/update
 *
 * Updates the user's preferences in Supabase.
 *
 * Request body:
 * {
 *   userId: string,
 *   preferences: UserPreferences
 * }
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
import { updateUser } from '@/lib/auth/service'
import { validatePreferences } from '@/lib/types/preferences'

export const POST: APIRoute = async ({ request }) => {
  try {
    // Parse request body
    const body = await request.json()
    const { userId, preferences } = body

    // Validate required fields
    if (!userId) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Missing userId',
          code: 'MISSING_USER_ID',
        }),
        {
          status: 400,
          headers: {
            'Content-Type': 'application/json',
          },
        }
      )
    }

    if (!preferences) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Missing preferences',
          code: 'MISSING_PREFERENCES',
        }),
        {
          status: 400,
          headers: {
            'Content-Type': 'application/json',
          },
        }
      )
    }

    // Validate preferences structure
    if (!validatePreferences(preferences)) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Invalid preferences format',
          code: 'INVALID_PREFERENCES',
        }),
        {
          status: 400,
          headers: {
            'Content-Type': 'application/json',
          },
        }
      )
    }

    // Update user preferences in Supabase
    const result = await updateUser(userId, {
      preferences,
    })

    if (!result.success) {
      return new Response(
        JSON.stringify({
          success: false,
          error: result.error || 'Failed to update preferences',
          code: result.code || 'UPDATE_FAILED',
        }),
        {
          status: 500,
          headers: {
            'Content-Type': 'application/json',
          },
        }
      )
    }

    // Return updated preferences
    return new Response(
      JSON.stringify({
        success: true,
        preferences: result.data?.user.preferences || {},
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
        },
      }
    )
  } catch (error) {
    console.error('Error in /api/preferences/update:', error)
    return new Response(
      JSON.stringify({
        success: false,
        error: 'An unexpected error occurred',
        code: 'UNEXPECTED_ERROR',
      }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
        },
      }
    )
  }
}
