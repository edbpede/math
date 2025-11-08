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
import { createSecurityHeaders } from '@/lib/security'
import { partialPreferencesSchema } from '@/lib/validation'

export const POST: APIRoute = async ({ request }) => {
  // Determine if in development mode (for security header configuration)
  const isDevelopment = import.meta.env.DEV

  try {
    // Parse request body
    const body = await request.json()
    const { userId, preferences } = body

    // Validate userId
    if (!userId || typeof userId !== 'string') {
      const headers = createSecurityHeaders(isDevelopment, {
        'Content-Type': 'application/json',
      })

      return new Response(
        JSON.stringify({
          success: false,
          error: 'Missing or invalid userId',
          code: 'INVALID_USER_ID',
        }),
        {
          status: 400,
          headers,
        }
      )
    }

    // Validate preferences with Zod schema
    const validationResult = partialPreferencesSchema.safeParse(preferences)

    if (!validationResult.success) {
      const headers = createSecurityHeaders(isDevelopment, {
        'Content-Type': 'application/json',
      })

      // Format Zod errors into readable message
      const errorMessage = validationResult.error.errors
        .map((err) => `${err.path.join('.')}: ${err.message}`)
        .join(', ')

      return new Response(
        JSON.stringify({
          success: false,
          error: errorMessage || 'Invalid preferences format',
          code: 'INVALID_PREFERENCES',
        }),
        {
          status: 400,
          headers,
        }
      )
    }

    // Extract validated preferences
    const validatedPreferences = validationResult.data

    // Update user preferences in Supabase with validated data
    const result = await updateUser(userId, {
      preferences: validatedPreferences,
    })

    if (!result.success) {
      const headers = createSecurityHeaders(isDevelopment, {
        'Content-Type': 'application/json',
      })

      return new Response(
        JSON.stringify({
          success: false,
          error: result.error || 'Failed to update preferences',
          code: result.code || 'UPDATE_FAILED',
        }),
        {
          status: 500,
          headers,
        }
      )
    }

    // Return updated preferences
    const headers = createSecurityHeaders(isDevelopment, {
      'Content-Type': 'application/json',
    })

    return new Response(
      JSON.stringify({
        success: true,
        preferences: result.data?.user.preferences || {},
      }),
      {
        status: 200,
        headers,
      }
    )
  } catch (error) {
    console.error('Error in /api/preferences/update:', error)
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
