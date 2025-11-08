/**
 * POST /api/auth/signin
 *
 * Signs in a user with their UUID.
 *
 * Request body:
 * {
 *   uuid: string (formatted or standard UUID)
 * }
 *
 * Response (success):
 * {
 *   success: true
 *   user: User
 * }
 *
 * Sets httpOnly session cookie on success.
 *
 * Rate limiting: 5 failed attempts per minute per IP address (server-side).
 * Returns 429 (Too Many Requests) when limit is exceeded.
 *
 * @see Requirements 1.4, 1.5, 7.4
 */

import type { APIRoute } from 'astro'
import { signInWithUUID } from '../../../lib/auth/service'
import {
  createSessionToken,
  createSessionCookie,
} from '../../../lib/auth/session'
import { rateLimiter } from '../../../lib/auth/rate-limiter'

// IMPORTANT: This API route requires server-side rendering
// Add `export const prerender = false` when deploying with an adapter
export const POST: APIRoute = async ({ request, clientAddress }) => {
  try {
    // Extract client IP address for rate limiting
    // Priority: clientAddress (Astro native) > x-forwarded-for (proxy) > unknown
    const ip =
      clientAddress ||
      request.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
      'unknown'

    // Check rate limit before processing request (Requirement 7.4)
    const rateLimit = rateLimiter.check(ip)
    if (!rateLimit.allowed) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Too many login attempts. Please try again later.',
          code: 'RATE_LIMIT_EXCEEDED',
          retryAfter: rateLimit.retryAfter,
          resetAt: rateLimit.resetAt,
        }),
        {
          status: 429,
          headers: {
            'Content-Type': 'application/json',
            'Retry-After': rateLimit.retryAfter.toString(),
          },
        }
      )
    }

    // Parse request body
    const body = await request.json()
    const { uuid } = body

    // Validate UUID is provided
    if (!uuid || typeof uuid !== 'string') {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'UUID is required',
          code: 'UUID_REQUIRED',
        }),
        {
          status: 400,
          headers: {
            'Content-Type': 'application/json',
          },
        }
      )
    }

    // Trim whitespace
    const trimmedUUID = uuid.trim()

    // Sign in with UUID
    const result = await signInWithUUID(trimmedUUID)

    if (!result.success) {
      // Record failed attempt for rate limiting (Requirement 7.4)
      rateLimiter.record(ip)

      // Return appropriate status codes
      const statusCode = result.code === 'UUID_NOT_FOUND' ? 404 : 400

      return new Response(JSON.stringify(result), {
        status: statusCode,
        headers: {
          'Content-Type': 'application/json',
        },
      })
    }

    // Create session token
    const token = createSessionToken(
      result.data.user.id,
      result.data.formattedUUID
    )

    // Determine if in development mode
    const isDevelopment = import.meta.env.DEV

    // Create session cookie
    const cookieHeader = createSessionCookie(token, isDevelopment)

    // Return success with user data
    return new Response(
      JSON.stringify({
        success: true,
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
        headers: {
          'Content-Type': 'application/json',
          'Set-Cookie': cookieHeader,
        },
      }
    )
  } catch (error) {
    console.error('Error in /api/auth/signin:', error)
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
