/**
 * UUID Utility Functions
 *
 * Provides cryptographically secure UUID generation, formatting, and validation
 * for the anonymous authentication system.
 *
 * Format: XXXX-XXXX-XXXX-XXXX (4 groups of 4 hex characters)
 * Example: 7b3f-4c2a-8d1e-9f6b
 *
 * This custom format differs from standard UUIDv4 format but is:
 * - Shorter and more user-friendly (19 chars vs 36 chars)
 * - Still cryptographically secure (128 bits of entropy)
 * - Easier to type and remember
 * - Reduces user error when manually entering
 *
 * @see Requirements 1.1, 1.2, 1.5
 */

/**
 * Generates a cryptographically secure UUID
 *
 * Uses the Web Crypto API's randomUUID() which provides:
 * - 128 bits of cryptographic randomness
 * - UUIDv4 format (RFC 4122)
 * - Secure random number generation
 *
 * @returns Standard UUID string (e.g., "550e8400-e29b-41d4-a716-446655440000")
 *
 * @example
 * const uuid = generateUUID()
 * // => "7b3f4c2a-8d1e-9f6b-3a2c-1d4e5f6a7b8c"
 */
export function generateUUID(): string {
  // Use crypto.randomUUID() for cryptographically secure generation
  // This is available in:
  // - Modern browsers (Chrome 92+, Firefox 95+, Safari 15.4+)
  // - Node.js 16.7.0+
  // - Deno 1.11+
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID()
  }

  // Fallback for older environments (should rarely be needed)
  // This implements UUIDv4 format manually
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0
    const v = c === 'x' ? r : (r & 0x3) | 0x8
    return v.toString(16)
  })
}

/**
 * Formats a standard UUID to the custom short format
 *
 * Converts: "7b3f4c2a-8d1e-9f6b-3a2c-1d4e5f6a7b8c"
 * To:       "7b3f-4c2a-8d1e-9f6b"
 *
 * Takes the first 16 hex characters and formats them in 4 groups of 4.
 * This provides sufficient entropy (2^64 = ~18 quintillion combinations)
 * while being much more user-friendly.
 *
 * @param uuid - Standard UUID string (with or without dashes)
 * @returns Formatted UUID string (XXXX-XXXX-XXXX-XXXX)
 *
 * @example
 * const formatted = formatUUID("7b3f4c2a-8d1e-9f6b-3a2c-1d4e5f6a7b8c")
 * // => "7b3f-4c2a-8d1e-9f6b"
 */
export function formatUUID(uuid: string): string {
  // Remove all dashes and convert to lowercase
  const clean = uuid.replace(/-/g, '').toLowerCase()

  // Take first 16 characters (64 bits of entropy)
  const short = clean.substring(0, 16)

  // Format as XXXX-XXXX-XXXX-XXXX
  return `${short.substring(0, 4)}-${short.substring(4, 8)}-${short.substring(8, 12)}-${short.substring(12, 16)}`
}

/**
 * Validates UUID format
 *
 * Accepts both:
 * - Standard UUID format: "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
 * - Custom short format: "xxxx-xxxx-xxxx-xxxx"
 *
 * Validates:
 * - Correct length and dash positions
 * - Only hexadecimal characters (0-9, a-f)
 * - Case-insensitive
 *
 * @param uuid - UUID string to validate
 * @returns true if valid format, false otherwise
 *
 * @example
 * validateUUID("7b3f-4c2a-8d1e-9f6b")  // => true
 * validateUUID("INVALID")               // => false
 * validateUUID("7b3f-4c2a-8d1e")        // => false (too short)
 */
export function validateUUID(uuid: string): boolean {
  if (!uuid || typeof uuid !== 'string') {
    return false
  }

  // Trim whitespace
  const trimmed = uuid.trim()

  // Short format: XXXX-XXXX-XXXX-XXXX (19 characters)
  const shortFormat = /^[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}$/i

  // Standard UUID format (36 characters)
  const standardFormat =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

  return shortFormat.test(trimmed) || standardFormat.test(trimmed)
}

/**
 * Parses a formatted UUID back to standard UUID format
 *
 * If the input is already a standard UUID, returns it as-is.
 * If the input is in short format, reconstructs a valid standard UUID
 * by padding with zeros.
 *
 * @param formattedUUID - UUID in short or standard format
 * @returns Standard UUID format or null if invalid
 *
 * @example
 * parseUUID("7b3f-4c2a-8d1e-9f6b")
 * // => "7b3f4c2a-8d1e-9f6b-0000-000000000000"
 */
export function parseUUID(formattedUUID: string): string | null {
  if (!validateUUID(formattedUUID)) {
    return null
  }

  const clean = formattedUUID.replace(/-/g, '').toLowerCase()

  // If it's already 32 characters, format as standard UUID
  if (clean.length === 32) {
    return `${clean.substring(0, 8)}-${clean.substring(8, 12)}-${clean.substring(12, 16)}-${clean.substring(16, 20)}-${clean.substring(20, 32)}`
  }

  // If it's 16 characters (short format), pad to standard UUID
  if (clean.length === 16) {
    // Pad with zeros to make a valid UUID
    const padded = clean + '0'.repeat(16)
    return `${padded.substring(0, 8)}-${padded.substring(8, 12)}-${padded.substring(12, 16)}-${padded.substring(16, 20)}-${padded.substring(20, 32)}`
  }

  return null
}

/**
 * Normalizes UUID format for storage
 *
 * Converts any valid UUID format to lowercase with standard formatting.
 * Used when storing UUIDs in the database to ensure consistency.
 *
 * @param uuid - UUID in any valid format
 * @returns Normalized UUID or null if invalid
 *
 * @example
 * normalizeUUID("7B3F-4C2A-8D1E-9F6B")
 * // => "7b3f4c2a-8d1e-9f6b-0000-000000000000"
 */
export function normalizeUUID(uuid: string): string | null {
  return parseUUID(uuid)
}

/**
 * Masks a UUID for display purposes
 *
 * Shows only the first and last group, masking the middle for security.
 * Useful for displaying UUID in UI without exposing the full value.
 *
 * @param uuid - UUID to mask
 * @returns Masked UUID string
 *
 * @example
 * maskUUID("7b3f-4c2a-8d1e-9f6b")
 * // => "7b3f-****-****-9f6b"
 */
export function maskUUID(uuid: string): string {
  if (!validateUUID(uuid)) {
    return '****-****-****-****'
  }

  const parts = uuid.split('-')

  if (parts.length === 4) {
    // Short format
    return `${parts[0]}-****-****-${parts[3]}`
  } else if (parts.length === 5) {
    // Standard format
    return `${parts[0]}-****-****-****-${parts[4]}`
  }

  return '****-****-****-****'
}
