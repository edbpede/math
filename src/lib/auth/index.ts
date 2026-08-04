/**
 * Authentication Module
 *
 * Central export point for all authentication-related functionality.
 *
 * @example
 * ```ts
 * import { generateUUID, formatUUID, createUser, signInWithUUID } from '@/lib/auth'
 *
 * // Generate a new UUID
 * const uuid = generateUUID()
 * const formatted = formatUUID(uuid)
 *
 * // Create a new user
 * const result = await createUser('4-6', 'da-DK')
 *
 * // Sign in with UUID
 * const signInResult = await signInWithUUID('7b3f-4c2a-8d1e-9f6b')
 * ```
 */

export type { AuthResult, Session, User } from "./service";

// Auth service
export {
  createUser,
  deleteUser,
  getCurrentUser,
  getUserByUUID,
  signInWithUUID,
  updateUser,
} from "./service";
// Session management
export {
  clearSessionCookie,
  createSessionCookie,
  createSessionToken,
  getSessionConfig,
  getSessionFromCookie,
  shouldRefreshSession,
  validateSessionToken,
} from "./session";
// UUID utilities
export {
  formatUUID,
  generateUUID,
  maskUUID,
  normalizeUUID,
  parseUUID,
  validateUUID,
} from "./uuid";
