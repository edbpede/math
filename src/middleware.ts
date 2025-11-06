/**
 * Astro Middleware
 *
 * Handles authentication and session management for all requests.
 *
 * Responsibilities:
 * - Validates session cookies on each request
 * - Attaches user data to locals for use in pages/components
 * - Refreshes sessions when needed (halfway through lifetime)
 * - Provides consistent authentication state across the application
 *
 * The middleware runs on every request before the page is rendered,
 * making authenticated user data available via `Astro.locals.user`.
 *
 * @see https://docs.astro.build/en/guides/middleware/
 */

import { defineMiddleware } from 'astro:middleware'
import {
  getSessionFromCookie,
  validateSessionToken,
  shouldRefreshSession,
  createSessionToken,
  createSessionCookie,
} from './lib/auth/session'
import { getUserByUUID } from './lib/auth/service'
import type { User } from './lib/auth/service'

/**
 * Extend Astro's locals type to include user data
 *
 * This makes user data available in all Astro components via:
 * `const user = Astro.locals.user`
 */
declare global {
  namespace App {
    interface Locals {
      user: User | null
      session: {
        userId: string
        uuid: string
        authenticated: boolean
      } | null
    }
  }
}

/**
 * Authentication middleware
 *
 * Runs on every request to validate sessions and provide auth state.
 */
export const onRequest = defineMiddleware(async (context, next) => {
  // Initialize locals with no user/session
  context.locals.user = null
  context.locals.session = null

  try {
    // Get cookie header from request
    const cookieHeader = context.request.headers.get('cookie')

    // Extract session token from cookies
    const token = getSessionFromCookie(cookieHeader)

    if (token) {
      // Validate session token
      const session = validateSessionToken(token)

      if (session) {
        // Get user data from database
        const result = await getUserByUUID(session.userId)

        if (result.success && result.data) {
          // Attach user to locals
          context.locals.user = result.data.user
          context.locals.session = {
            userId: session.userId,
            uuid: session.uuid,
            authenticated: true,
          }

          // Check if session should be refreshed
          if (shouldRefreshSession(session)) {
            // Create new session token
            const newToken = createSessionToken(session.userId, session.uuid)
            const isDevelopment = import.meta.env.DEV

            // Add Set-Cookie header to response
            const response = await next()

            // Clone response to add headers
            const newResponse = new Response(response.body, response)
            newResponse.headers.append(
              'Set-Cookie',
              createSessionCookie(newToken, isDevelopment)
            )

            return newResponse
          }
        }
      }
    }

    // Continue to next middleware or page
    return next()
  } catch (error) {
    console.error('Error in middleware:', error)

    // Continue even if middleware fails
    // This prevents auth errors from breaking the entire site
    return next()
  }
})
