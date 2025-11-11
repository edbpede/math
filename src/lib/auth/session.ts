/**
 * Session Management
 *
 * Provides secure session token generation and validation using httpOnly cookies.
 * Sessions use JWT-like structure but with simplified implementation for this use case.
 *
 * Security Features:
 * - HttpOnly cookies (prevents XSS attacks)
 * - Secure flag (HTTPS-only transmission)
 * - SameSite: Strict (prevents CSRF attacks)
 * - 24-hour expiration with automatic rotation
 * - Cryptographically secure token generation
 *
 * @see Requirements 1.5, 7.3
 */

import type { Session } from "./service";

/**
 * Session token payload
 */
interface SessionPayload {
  userId: string;
  uuid: string;
  createdAt: number; // Unix timestamp
  expiresAt: number; // Unix timestamp
}

/**
 * Session configuration
 */
const SESSION_CONFIG = {
  // Cookie name for session storage
  cookieName: "math-session",

  // Session duration: 24 hours
  durationMs: 24 * 60 * 60 * 1000,

  // Cookie options
  cookie: {
    httpOnly: true,
    secure: true, // HTTPS only (will be set based on environment)
    sameSite: "strict" as const,
    path: "/",
    maxAge: 24 * 60 * 60, // 24 hours in seconds
  },
};

/**
 * Generates a cryptographically secure random token
 *
 * Uses Web Crypto API for secure random generation.
 * Returns a base64url-encoded string.
 *
 * @param bytes - Number of random bytes to generate (default: 32)
 * @returns Base64url-encoded random string
 */
function generateSecureToken(bytes: number = 32): string {
  if (typeof crypto !== "undefined" && crypto.getRandomValues) {
    const buffer = new Uint8Array(bytes);
    crypto.getRandomValues(buffer);
    return btoa(String.fromCharCode(...buffer))
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=/g, "");
  }

  // Fallback for environments without crypto.getRandomValues
  // This should rarely be used in practice
  throw new Error("crypto.getRandomValues is not available");
}

/**
 * Creates a new session token
 *
 * Generates a cryptographically secure token containing:
 * - User ID (normalized UUID)
 * - User's formatted UUID (for display)
 * - Creation timestamp
 * - Expiration timestamp
 *
 * The token is encoded as base64url for safe transmission in cookies.
 *
 * @param userId - User's normalized UUID
 * @param uuid - User's formatted UUID
 * @returns Session token string
 */
export function createSessionToken(userId: string, uuid: string): string {
  const now = Date.now();
  const expiresAt = now + SESSION_CONFIG.durationMs;

  const payload: SessionPayload = {
    userId,
    uuid,
    createdAt: now,
    expiresAt,
  };

  // Create token: random_id.base64url(payload)
  const randomId = generateSecureToken(16);
  const payloadJson = JSON.stringify(payload);
  const payloadB64 = btoa(payloadJson)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=/g, "");

  return `${randomId}.${payloadB64}`;
}

/**
 * Validates and parses a session token
 *
 * Checks:
 * - Token format is valid
 * - Token hasn't expired
 * - Payload can be parsed
 *
 * @param token - Session token string
 * @returns Session data or null if invalid
 */
export function validateSessionToken(token: string): Session | null {
  try {
    if (!token || typeof token !== "string") {
      return null;
    }

    // Split token into parts
    const parts = token.split(".");
    if (parts.length !== 2) {
      return null;
    }

    const [, payloadB64] = parts;

    // Decode payload
    const payloadJson = atob(payloadB64.replace(/-/g, "+").replace(/_/g, "/"));
    const payload = JSON.parse(payloadJson) as SessionPayload;

    // Validate payload structure
    if (
      !payload.userId ||
      !payload.uuid ||
      !payload.createdAt ||
      !payload.expiresAt
    ) {
      return null;
    }

    // Check expiration
    const now = Date.now();
    if (now > payload.expiresAt) {
      return null;
    }

    // Return session data
    return {
      userId: payload.userId,
      uuid: payload.uuid,
      createdAt: new Date(payload.createdAt),
      expiresAt: new Date(payload.expiresAt),
    };
  } catch (error) {
    console.error("Error validating session token:", error);
    return null;
  }
}

/**
 * Creates a Set-Cookie header value for a session
 *
 * Includes all security attributes:
 * - HttpOnly (prevents JavaScript access)
 * - Secure (HTTPS only in production)
 * - SameSite=Strict (prevents CSRF)
 * - Max-Age (24 hours)
 * - Path (/)
 *
 * @param token - Session token string
 * @param isDevelopment - Whether running in development mode
 * @returns Set-Cookie header value
 */
export function createSessionCookie(
  token: string,
  isDevelopment: boolean = false,
): string {
  const parts = [
    `${SESSION_CONFIG.cookieName}=${token}`,
    `Max-Age=${SESSION_CONFIG.cookie.maxAge}`,
    `Path=${SESSION_CONFIG.cookie.path}`,
    `SameSite=${SESSION_CONFIG.cookie.sameSite}`,
    "HttpOnly",
  ];

  // Only set Secure flag in production (HTTPS)
  // In development, allow HTTP for localhost testing
  if (!isDevelopment) {
    parts.push("Secure");
  }

  return parts.join("; ");
}

/**
 * Creates a Set-Cookie header to clear the session
 *
 * Sets Max-Age=0 to immediately expire the cookie.
 *
 * @returns Set-Cookie header value for clearing session
 */
export function clearSessionCookie(): string {
  return `${SESSION_CONFIG.cookieName}=; Max-Age=0; Path=${SESSION_CONFIG.cookie.path}; HttpOnly; Secure; SameSite=${SESSION_CONFIG.cookie.sameSite}`;
}

/**
 * Extracts session token from Cookie header
 *
 * Parses the Cookie header and finds the session cookie.
 *
 * @param cookieHeader - Cookie header value
 * @returns Session token or null if not found
 */
export function getSessionFromCookie(
  cookieHeader: string | null,
): string | null {
  if (!cookieHeader) {
    return null;
  }

  const cookies = cookieHeader.split(";").map((c) => c.trim());
  const sessionCookie = cookies.find((c) =>
    c.startsWith(`${SESSION_CONFIG.cookieName}=`),
  );

  if (!sessionCookie) {
    return null;
  }

  return sessionCookie.substring(SESSION_CONFIG.cookieName.length + 1);
}

/**
 * Checks if a session needs to be refreshed
 *
 * Sessions should be refreshed if they're more than 12 hours old
 * (halfway through their 24-hour lifetime).
 *
 * @param session - Session to check
 * @returns true if session should be refreshed
 */
export function shouldRefreshSession(session: Session): boolean {
  const now = Date.now();
  const age = now - session.createdAt.getTime();
  const halfLife = SESSION_CONFIG.durationMs / 2;

  return age > halfLife;
}

/**
 * Gets session configuration
 *
 * Useful for testing and debugging.
 *
 * @returns Session configuration object
 */
export function getSessionConfig() {
  return SESSION_CONFIG;
}
