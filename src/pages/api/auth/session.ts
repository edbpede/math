/**
 * GET /api/auth/session
 *
 * Gets the current session and user data.
 *
 * No request body required.
 *
 * Response (authenticated):
 * {
 *   success: true
 *   authenticated: true
 *   user: User
 * }
 *
 * Response (not authenticated):
 * {
 *   success: true
 *   authenticated: false
 * }
 *
 * @see Requirements 1.4, 1.5
 */

import type { APIRoute } from 'astro'
import {
  getSessionFromCookie,
  validateSessionToken,
  shouldRefreshSession,
  createSessionToken,
  createSessionCookie,
} from '../../../lib/auth/session'
import { getUserByUUID } from '../../../lib/auth/service'
import { createSecurityHeaders } from '../../../lib/security'

// IMPORTANT: This API route requires server-side rendering
// Add `export const prerender = false` when deploying with an adapter
export const GET: APIRoute = async ({ request }) => {
  // Determine if in development mode (for security header configuration)
  const isDevelopment = import.meta.env.DEV

  try {
    // Get cookie header
    const cookieHeader = request.headers.get('cookie')

    // Extract session token from cookie
    const token = getSessionFromCookie(cookieHeader)

    if (!token) {
      const headers = createSecurityHeaders(isDevelopment, {
        'Content-Type': 'application/json',
      })

      return new Response(
        JSON.stringify({
          success: true,
          authenticated: false,
        }),
        {
          status: 200,
          headers,
        }
      )
    }

    // Validate session token
    const session = validateSessionToken(token)

    if (!session) {
      const headers = createSecurityHeaders(isDevelopment, {
        'Content-Type': 'application/json',
      })

      return new Response(
        JSON.stringify({
          success: true,
          authenticated: false,
        }),
        {
          status: 200,
          headers,
        }
      )
    }

    // Get user data
    const result = await getUserByUUID(session.userId)

    if (!result.success || !result.data) {
      const headers = createSecurityHeaders(isDevelopment, {
        'Content-Type': 'application/json',
      })

      return new Response(
        JSON.stringify({
          success: true,
          authenticated: false,
        }),
        {
          status: 200,
          headers,
        }
      )
    }

    // Check if session should be refreshed
    const baseHeaders: Record<string, string> = {
      'Content-Type': 'application/json',
    }

    if (shouldRefreshSession(session)) {
      // Create new session token
      const newToken = createSessionToken(session.userId, session.uuid)
      baseHeaders['Set-Cookie'] = createSessionCookie(newToken, isDevelopment)
    }

    // Add security headers
    const headers = createSecurityHeaders(isDevelopment, baseHeaders)

    // Return authenticated response with user data
    return new Response(
      JSON.stringify({
        success: true,
        authenticated: true,
        user: {
          id: result.data.user.id,
          gradeRange: result.data.user.gradeRange,
          locale: result.data.user.locale,
          createdAt: result.data.user.createdAt.toISOString(),
          lastActiveAt: result.data.user.lastActiveAt.toISOString(),
        },
      }),
      {
        status: 200,
        headers,
      }
    )
  } catch (error) {
    console.error('Error in /api/auth/session:', error)
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
