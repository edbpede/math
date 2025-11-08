/**
 * POST /api/auth/generate
 *
 * Generates a new UUID and creates a user account.
 *
 * Request body:
 * {
 *   gradeRange: '0-3' | '4-6' | '7-9'
 *   locale?: 'da-DK' | 'en-US'
 * }
 *
 * Response (success):
 * {
 *   success: true
 *   uuid: string (formatted, e.g., "7b3f-4c2a-8d1e-9f6b")
 *   user: User
 * }
 *
 * Sets httpOnly session cookie on success.
 *
 * @see Requirements 1.1, 1.2, 1.5
 */

import type { APIRoute } from 'astro'
import { createUser } from '../../../lib/auth/service'
import {
  createSessionToken,
  createSessionCookie,
} from '../../../lib/auth/session'
import { createSecurityHeaders } from '../../../lib/security'

// IMPORTANT: This API route requires server-side rendering
// Add `export const prerender = false` when deploying with an adapter
export const POST: APIRoute = async ({ request }) => {
  // Determine if in development mode (for security header configuration)
  const isDevelopment = import.meta.env.DEV

  try {
    // Parse request body
    const body = await request.json()
    const { gradeRange, locale = 'da-DK' } = body

    // Validate gradeRange
    if (!gradeRange || !['0-3', '4-6', '7-9'].includes(gradeRange)) {
      const headers = createSecurityHeaders(isDevelopment, {
        'Content-Type': 'application/json',
      })

      return new Response(
        JSON.stringify({
          success: false,
          error: 'Invalid grade range. Must be 0-3, 4-6, or 7-9',
          code: 'INVALID_GRADE_RANGE',
        }),
        {
          status: 400,
          headers,
        }
      )
    }

    // Validate locale
    if (locale && !['da-DK', 'en-US'].includes(locale)) {
      const headers = createSecurityHeaders(isDevelopment, {
        'Content-Type': 'application/json',
      })

      return new Response(
        JSON.stringify({
          success: false,
          error: 'Invalid locale. Must be da-DK or en-US',
          code: 'INVALID_LOCALE',
        }),
        {
          status: 400,
          headers,
        }
      )
    }

    // Create user
    const result = await createUser(gradeRange, locale)

    if (!result.success) {
      const headers = createSecurityHeaders(isDevelopment, {
        'Content-Type': 'application/json',
      })

      return new Response(JSON.stringify(result), {
        status: 500,
        headers,
      })
    }

    // Create session token
    const token = createSessionToken(result.data.user.id, result.data.formattedUUID)

    // Create session cookie
    const cookieHeader = createSessionCookie(token, isDevelopment)

    // Create response headers with security headers
    const headers = createSecurityHeaders(isDevelopment, {
      'Content-Type': 'application/json',
      'Set-Cookie': cookieHeader,
    })

    // Return success with user data and UUID
    return new Response(
      JSON.stringify({
        success: true,
        uuid: result.data.formattedUUID,
        user: {
          id: result.data.user.id,
          gradeRange: result.data.user.gradeRange,
          locale: result.data.user.locale,
          createdAt: result.data.user.createdAt.toISOString(),
          lastActiveAt: result.data.user.lastActiveAt.toISOString(),
        },
      }),
      {
        status: 201,
        headers,
      }
    )
  } catch (error) {
    console.error('Error in /api/auth/generate:', error)
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
