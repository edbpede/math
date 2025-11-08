/**
 * Input Validation and Sanitization Module
 *
 * This module provides comprehensive input validation and sanitization
 * to prevent injection attacks and ensure data integrity.
 *
 * Security Architecture:
 * 1. Zod Schemas - Runtime type validation with compile-time types
 * 2. Sanitization - Defense-in-depth input cleaning
 * 3. Framework Auto-Escaping - Astro/SolidJS escape output by default
 * 4. CSP Headers - Content Security Policy blocks inline scripts
 *
 * @see docs/SECURITY.md for complete security documentation
 */

// Export all schemas
export {
  // UUID validation
  uuidSchema,
  type UUID,

  // Preferences validation
  preferencesSchema,
  partialPreferencesSchema,
  type Preferences,
  type PartialPreferences,

  // Answer validation
  answerInputSchema,
  numericAnswerSchema,
  answerWithUnitSchema,
  type AnswerInput,
  type NumericAnswer,
  type AnswerWithUnit,

  // API payload validation
  signInPayloadSchema,
  generateUUIDPayloadSchema,
  updatePreferencesPayloadSchema,
  submitAnswerPayloadSchema,
  type SignInPayload,
  type GenerateUUIDPayload,
  type UpdatePreferencesPayload,
  type SubmitAnswerPayload,

  // Session validation
  sessionDataSchema,
  type SessionData,

  // Grade and locale validation
  gradeRangeSchema,
  localeSchema,
  type GradeRange,
  type Locale,

  // Helper functions
  validateInput,
  assertValidInput,
} from './schemas'

// Export all sanitization functions
export {
  escapeHtml,
  sanitizeAnswer,
  sanitizeUUID,
  sanitizeText,
  stripNonNumeric,
  sanitizeFilePath,
  sanitizeJSON,
  limitLength,
  sanitizeInput,
  detectMaliciousInput,
  isSafeInput,
} from './sanitizer'
