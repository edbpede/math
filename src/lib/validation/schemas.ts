/**
 * Zod validation schemas for all user inputs
 *
 * Security: All user input MUST be validated with these schemas before processing
 * to prevent injection attacks and type coercion vulnerabilities.
 *
 * @see docs/SECURITY.md for validation patterns and security considerations
 */

import { z } from 'zod'

// ============================================================================
// UUID VALIDATION
// ============================================================================

/**
 * UUID format validation
 * Format: xxxx-xxxx-xxxx-xxxx (4 groups of 4 hex characters)
 *
 * Security: Prevents injection attacks by strictly validating format
 */
export const uuidSchema = z
  .string()
  .min(1, 'UUID is required')
  .trim()
  .regex(
    /^[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}$/i,
    'UUID must be in format xxxx-xxxx-xxxx-xxxx'
  )
  .transform((val) => val.toLowerCase())

/**
 * Validates and normalizes UUID input
 *
 * @example
 * const result = uuidSchema.safeParse('7B3F-4C2A-8D1E-9F6B')
 * if (result.success) {
 *   console.log(result.data) // '7b3f-4c2a-8d1e-9f6b'
 * }
 */
export type UUID = z.infer<typeof uuidSchema>

// ============================================================================
// PREFERENCES VALIDATION
// ============================================================================

/**
 * User preferences schema with strict validation
 *
 * Security: Prevents invalid values that could cause XSS or unexpected behavior
 * Aligned with existing UserPreferences interface in src/lib/types/preferences.ts
 */
export const preferencesSchema = z.object({
  theme: z.enum(['light', 'dark', 'system']).optional(),
  fontSize: z.enum(['small', 'medium', 'large']).optional(),
  dyslexiaFont: z.boolean().optional(),
  highContrast: z.boolean().optional(),
})

/**
 * Partial preferences for updates (all fields optional by nature)
 * Since preferencesSchema already has all fields optional, this is the same
 */
export const partialPreferencesSchema = preferencesSchema

export type Preferences = z.infer<typeof preferencesSchema>
export type PartialPreferences = z.infer<typeof partialPreferencesSchema>

// ============================================================================
// ANSWER VALIDATION
// ============================================================================

/**
 * Exercise answer input validation
 *
 * Security: Sanitizes answer input to prevent XSS and code injection
 * Allows: numbers, decimal points, commas, fractions, percentages, basic math symbols
 * Blocks: HTML tags, script tags, SQL keywords, etc.
 */
export const answerInputSchema = z
  .string()
  .min(1, 'Answer is required')
  .trim()
  .max(200, 'Answer must be less than 200 characters')
  .regex(
    /^[0-9.,\-+\/%\s()]+$/,
    'Answer can only contain numbers and basic math symbols'
  )
  .refine(
    (val) => !/<script|<iframe|javascript:|on\w+=/i.test(val),
    'Invalid characters detected in answer'
  )

/**
 * Validates numeric answer (for number line, multiple choice, etc.)
 */
export const numericAnswerSchema = z
  .number()
  .finite('Answer must be a valid number')
  .safe('Answer is too large or too small')

/**
 * Answer with unit validation (e.g., "5 kg", "3.5 m")
 */
export const answerWithUnitSchema = z.object({
  value: numericAnswerSchema,
  unit: z.string().max(20).regex(/^[a-zA-ZæøåÆØÅ\s]*$/).nullable(),
})

export type AnswerInput = z.infer<typeof answerInputSchema>
export type NumericAnswer = z.infer<typeof numericAnswerSchema>
export type AnswerWithUnit = z.infer<typeof answerWithUnitSchema>

// ============================================================================
// API PAYLOAD VALIDATION
// ============================================================================

/**
 * Authentication request payloads
 */
export const signInPayloadSchema = z.object({
  uuid: uuidSchema,
})

export const generateUUIDPayloadSchema = z.object({
  gradeRange: z.enum(['0-3', '4-6', '7-9']),
  locale: z.enum(['da-DK', 'en-US']).default('da-DK'),
})

/**
 * Preferences update payload
 */
export const updatePreferencesPayloadSchema = z.object({
  preferences: partialPreferencesSchema,
})

/**
 * Exercise submission payload
 */
export const submitAnswerPayloadSchema = z.object({
  sessionId: z.string().uuid('Invalid session ID'),
  exerciseId: z.string().min(1).max(100),
  answer: answerInputSchema,
  responseTimeSeconds: z.number().int().min(0).max(3600),
  hintsUsed: z.number().int().min(0).max(4),
})

export type SignInPayload = z.infer<typeof signInPayloadSchema>
export type GenerateUUIDPayload = z.infer<typeof generateUUIDPayloadSchema>
export type UpdatePreferencesPayload = z.infer<typeof updatePreferencesPayloadSchema>
export type SubmitAnswerPayload = z.infer<typeof submitAnswerPayloadSchema>

// ============================================================================
// SESSION VALIDATION
// ============================================================================

/**
 * Session data validation
 *
 * Security: Ensures session tokens contain only expected data
 */
export const sessionDataSchema = z.object({
  userId: z.string().uuid(),
  uuid: uuidSchema,
  issuedAt: z.number().int().positive(),
  expiresAt: z.number().int().positive(),
})

export type SessionData = z.infer<typeof sessionDataSchema>

// ============================================================================
// GRADE RANGE VALIDATION
// ============================================================================

/**
 * Danish grade range validation
 */
export const gradeRangeSchema = z.enum(['0-3', '4-6', '7-9'])

export type GradeRange = z.infer<typeof gradeRangeSchema>

// ============================================================================
// LOCALE VALIDATION
// ============================================================================

/**
 * Supported locale validation
 */
export const localeSchema = z.enum(['da-DK', 'en-US'])

export type Locale = z.infer<typeof localeSchema>

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Validates and parses input with detailed error messages
 *
 * @param schema Zod schema to validate against
 * @param data Input data to validate
 * @returns Result with success/error status
 *
 * @example
 * const result = validateInput(uuidSchema, userInput)
 * if (!result.success) {
 *   console.error(result.error)
 *   return
 * }
 * const validUUID = result.data
 */
export function validateInput<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): { success: true; data: T } | { success: false; error: string } {
  const result = schema.safeParse(data)

  if (result.success) {
    return { success: true, data: result.data }
  }

  // Format Zod errors into readable message
  // Note: Bun's Zod uses .issues instead of .errors
  const issues = result.error.issues || (result.error as any).errors || []

  if (issues.length > 0) {
    const errorMessage = issues
      .map((err: any) => {
        const path = err.path && err.path.length > 0 ? `${err.path.join('.')}: ` : ''
        return `${path}${err.message}`
      })
      .join(', ')
    return { success: false, error: errorMessage }
  }

  return { success: false, error: 'Validation failed' }
}

/**
 * Type guard that asserts validation success
 *
 * @example
 * const result = validateInput(uuidSchema, input)
 * assertValidInput(result) // Throws if invalid
 * const validUUID = result.data // TypeScript knows this is valid
 */
export function assertValidInput<T>(
  result: { success: boolean; data?: T; error?: string }
): asserts result is { success: true; data: T } {
  if (!result.success) {
    throw new Error(`Validation failed: ${result.error}`)
  }
}
