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

// UUID utilities
export {
  generateUUID,
  formatUUID,
  validateUUID,
  parseUUID,
  normalizeUUID,
  maskUUID,
} from './uuid'

// Auth service
export {
  createUser,
  signInWithUUID,
  getUserByUUID,
  updateUser,
  deleteUser,
} from './service'

export type { Session, User, AuthResult } from './service'

// Session management
export {
  createSessionToken,
  validateSessionToken,
  createSessionCookie,
  clearSessionCookie,
  getSessionFromCookie,
  shouldRefreshSession,
  getSessionConfig,
} from './session'
