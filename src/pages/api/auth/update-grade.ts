/**
 * POST /api/auth/update-grade
 *
 * Updates the user's grade range during onboarding.
 *
 * Request body:
 * {
 *   gradeRange: '0-3' | '4-6' | '7-9'
 * }
 *
 * Response (success):
 * {
 *   success: true
 * }
 *
 * Requires authentication (session cookie).
 *
 * @see Requirements 14.3
 */

import type { APIRoute } from "astro";
import {
  getSessionFromCookie,
  validateSessionToken,
} from "../../../lib/auth/session";
import {
  updateUserGradeRange,
  getUserByUUID,
} from "../../../lib/auth/service";
import { createSecurityHeaders } from "../../../lib/security";
import type { GradeRange } from "../../../lib/curriculum/types";

// Validation schema for grade range
const VALID_GRADE_RANGES: GradeRange[] = ["0-3", "4-6", "7-9"];

function isValidGradeRange(value: unknown): value is GradeRange {
  return (
    typeof value === "string" &&
    VALID_GRADE_RANGES.includes(value as GradeRange)
  );
}

// IMPORTANT: This API route requires server-side rendering
// Add `export const prerender = false` when deploying with an adapter
export const POST: APIRoute = async ({ request }) => {
  // Determine if in development mode
  const isDevelopment = import.meta.env.DEV;

  try {
    // Parse request body
    const body = await request.json();
    const { gradeRange } = body;

    // Validate grade range
    if (!isValidGradeRange(gradeRange)) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Invalid grade range. Must be '0-3', '4-6', or '7-9'.",
        }),
        {
          status: 400,
          headers: {
            "Content-Type": "application/json",
            ...createSecurityHeaders(isDevelopment),
          },
        }
      );
    }

    // Get cookie header
    const cookieHeader = request.headers.get("cookie");

    // Extract session token from cookie
    const token = getSessionFromCookie(cookieHeader);

    if (!token) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Not authenticated. Please sign in first.",
        }),
        {
          status: 401,
          headers: {
            "Content-Type": "application/json",
            ...createSecurityHeaders(isDevelopment),
          },
        }
      );
    }

    // Validate session token
    const session = validateSessionToken(token);

    if (!session) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Invalid session. Please sign in again.",
        }),
        {
          status: 401,
          headers: {
            "Content-Type": "application/json",
            ...createSecurityHeaders(isDevelopment),
          },
        }
      );
    }

    // Get user data to verify they exist
    const userResult = await getUserByUUID(session.userId);

    if (!userResult.success || !userResult.data) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "User not found.",
        }),
        {
          status: 404,
          headers: {
            "Content-Type": "application/json",
            ...createSecurityHeaders(isDevelopment),
          },
        }
      );
    }

    // Update user's grade range in database
    const result = await updateUserGradeRange(session.userId, gradeRange);

    if (!result.success) {
      return new Response(
        JSON.stringify({
          success: false,
          error: result.error || "Failed to update grade range",
        }),
        {
          status: 500,
          headers: {
            "Content-Type": "application/json",
            ...createSecurityHeaders(isDevelopment),
          },
        }
      );
    }

    // Success response
    return new Response(
      JSON.stringify({
        success: true,
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          ...createSecurityHeaders(isDevelopment),
        },
      }
    );
  } catch (error) {
    console.error("Update grade error:", error);

    return new Response(
      JSON.stringify({
        success: false,
        error: "An unexpected error occurred while updating grade range.",
      }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
          ...createSecurityHeaders(isDevelopment),
        },
      }
    );
  }
};
