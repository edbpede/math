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

import type { APIRoute } from "astro";
import { signInWithUUID } from "../../../lib/auth/service";
import {
    createSessionToken,
    createSessionCookie,
} from "../../../lib/auth/session";
import { rateLimiter } from "../../../lib/auth/rate-limiter";
import { createSecurityHeaders } from "../../../lib/security";
import { signInPayloadSchema, sanitizeUUID } from "../../../lib/validation";

// IMPORTANT: This API route requires server-side rendering
// Add `export const prerender = false` when deploying with an adapter
export const POST: APIRoute = async ({ request, clientAddress }) => {
    // Determine if in development mode (for security header configuration)
    const isDevelopment = import.meta.env.DEV;

    try {
        // Extract client IP address for rate limiting
        // Priority: clientAddress (Astro native) > x-forwarded-for (proxy) > unknown
        const ip =
            clientAddress ||
            request.headers.get("x-forwarded-for")?.split(",")[0].trim() ||
            "unknown";

        // Check rate limit before processing request (Requirement 7.4)
        const rateLimit = rateLimiter.check(ip);
        if (!rateLimit.allowed) {
            const headers = createSecurityHeaders(isDevelopment, {
                "Content-Type": "application/json",
                "Retry-After": rateLimit.retryAfter.toString(),
            });

            return new Response(
                JSON.stringify({
                    success: false,
                    error: "Too many login attempts. Please try again later.",
                    code: "RATE_LIMIT_EXCEEDED",
                    retryAfter: rateLimit.retryAfter,
                    resetAt: rateLimit.resetAt,
                }),
                {
                    status: 429,
                    headers,
                },
            );
        }

        // Parse request body
        const body = await request.json();

        // Validate and sanitize input with Zod schema
        const validationResult = signInPayloadSchema.safeParse(body);

        if (!validationResult.success) {
            const headers = createSecurityHeaders(isDevelopment, {
                "Content-Type": "application/json",
            });

            // Format Zod errors into readable message
            const errorMessage = validationResult.error.issues
                .map((err) => `${err.path.join(".")}: ${err.message}`)
                .join(", ");

            return new Response(
                JSON.stringify({
                    success: false,
                    error: errorMessage || "Invalid input",
                    code: "VALIDATION_ERROR",
                }),
                {
                    status: 400,
                    headers,
                },
            );
        }

        // Extract validated and sanitized UUID
        const { uuid } = validationResult.data;

        // Additional sanitization layer (defense-in-depth)
        const sanitizedUUID = sanitizeUUID(uuid);

        // Sign in with UUID
        const result = await signInWithUUID(sanitizedUUID);

        if (!result.success) {
            // Record failed attempt for rate limiting (Requirement 7.4)
            rateLimiter.record(ip);

            // Return appropriate status codes
            const statusCode = result.code === "UUID_NOT_FOUND" ? 404 : 400;
            const headers = createSecurityHeaders(isDevelopment, {
                "Content-Type": "application/json",
            });

            return new Response(JSON.stringify(result), {
                status: statusCode,
                headers,
            });
        }

        // Create session token
        const token = createSessionToken(
            result.data.user.id,
            result.data.formattedUUID,
        );

        // Create session cookie
        const cookieHeader = createSessionCookie(token, isDevelopment);

        // Create response headers with security headers
        const headers = createSecurityHeaders(isDevelopment, {
            "Content-Type": "application/json",
            "Set-Cookie": cookieHeader,
        });

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
                headers,
            },
        );
    } catch (error) {
        console.error("Error in /api/auth/signin:", error);
        const headers = createSecurityHeaders(isDevelopment, {
            "Content-Type": "application/json",
        });

        return new Response(
            JSON.stringify({
                success: false,
                error: "An unexpected error occurred",
                code: "UNEXPECTED_ERROR",
            }),
            {
                status: 500,
                headers,
            },
        );
    }
};
