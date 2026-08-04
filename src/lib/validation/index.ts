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

// Export all sanitization functions
export {
  detectMaliciousInput,
  escapeHtml,
  isSafeInput,
  limitLength,
  sanitizeAnswer,
  sanitizeFilePath,
  sanitizeInput,
  sanitizeJSON,
  sanitizeText,
  sanitizeUUID,
  stripNonNumeric,
} from "./sanitizer";
// Export all schemas
export {
  type AnswerInput,
  type AnswerWithUnit,
  // Answer validation
  answerInputSchema,
  answerWithUnitSchema,
  assertValidInput,
  type GenerateUUIDPayload,
  type GradeRange,
  generateUUIDPayloadSchema,
  // Grade and locale validation
  gradeRangeSchema,
  type Locale,
  localeSchema,
  type NumericAnswer,
  numericAnswerSchema,
  type PartialPreferences,
  type Preferences,
  partialPreferencesSchema,
  // Preferences validation
  preferencesSchema,
  type SessionData,
  type SignInPayload,
  type SubmitAnswerPayload,
  // Session validation
  sessionDataSchema,
  // API payload validation
  signInPayloadSchema,
  submitAnswerPayloadSchema,
  type UpdatePreferencesPayload,
  type UUID,
  updatePreferencesPayloadSchema,
  // UUID validation
  uuidSchema,
  // Helper functions
  validateInput,
} from "./schemas";
