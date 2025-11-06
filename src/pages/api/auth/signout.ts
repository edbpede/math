/**
 * POST /api/auth/signout
 *
 * Signs out the current user by clearing their session cookie.
 *
 * No request body required.
 *
 * Response:
 * {
 *   success: true
 * }
 *
 * Clears httpOnly session cookie.
 *
 * @see Requirements 1.5
 */

import type { APIRoute } from 'astro'
import { clearSessionCookie } from '../../../lib/auth/session'

// IMPORTANT: This API route requires server-side rendering
// Add `export const prerender = false` when deploying with an adapter
export const POST: APIRoute = async () => {
  try {
    // Clear session cookie
    const cookieHeader = clearSessionCookie()

    // Return success
    return new Response(
      JSON.stringify({
        success: true,
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Set-Cookie': cookieHeader,
        },
      }
    )
  } catch (error) {
    console.error('Error in /api/auth/signout:', error)
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
