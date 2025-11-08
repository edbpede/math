/**
 * Security-focused tests for Zod validation schemas
 *
 * Tests cover:
 * - XSS prevention
 * - Injection attack prevention
 * - Type coercion vulnerabilities
 * - Malicious input detection
 * - Edge cases and boundary conditions
 */

import { describe, it, expect } from 'vitest'
import {
  uuidSchema,
  preferencesSchema,
  answerInputSchema,
  signInPayloadSchema,
  generateUUIDPayloadSchema,
  updatePreferencesPayloadSchema,
  validateInput,
} from './schemas'

describe('UUID Schema Security', () => {
  it('should accept valid UUID format', () => {
    const valid = uuidSchema.safeParse('7b3f-4c2a-8d1e-9f6b')
    expect(valid.success).toBe(true)
    if (valid.success) {
      expect(valid.data).toBe('7b3f-4c2a-8d1e-9f6b')
    }
  })

  it('should normalize UUID to lowercase', () => {
    const result = uuidSchema.safeParse('7B3F-4C2A-8D1E-9F6B')
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data).toBe('7b3f-4c2a-8d1e-9f6b')
    }
  })

  it('should trim whitespace', () => {
    const result = uuidSchema.safeParse('  7b3f-4c2a-8d1e-9f6b  ')
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data).toBe('7b3f-4c2a-8d1e-9f6b')
    }
  })

  it('should reject XSS attempts in UUID', () => {
    const malicious = [
      '<script>alert("XSS")</script>',
      '7b3f-4c2a-8d1e-9f6b<script>alert("XSS")</script>',
      'javascript:alert("XSS")',
      '<img src=x onerror=alert("XSS")>',
    ]

    malicious.forEach((input) => {
      const result = uuidSchema.safeParse(input)
      expect(result.success).toBe(false)
    })
  })

  it('should reject SQL injection attempts', () => {
    const sqlInjection = [
      "'; DROP TABLE users; --",
      "1' OR '1'='1",
      "admin'--",
      "' UNION SELECT * FROM users--",
    ]

    sqlInjection.forEach((input) => {
      const result = uuidSchema.safeParse(input)
      expect(result.success).toBe(false)
    })
  })

  it('should reject invalid UUID formats', () => {
    const invalid = [
      'not-a-uuid',
      '7b3f-4c2a-8d1e',
      '7b3f4c2a8d1e9f6b',
      '7b3f-4c2a-8d1e-9f6b-extra',
      '',
      '    ',
    ]

    invalid.forEach((input) => {
      const result = uuidSchema.safeParse(input)
      expect(result.success).toBe(false)
    })
  })
})

describe('Preferences Schema Security', () => {
  it('should accept valid preferences', () => {
    const valid = {
      theme: 'light' as const,
      fontSize: 'medium' as const,
      dyslexiaFont: true,
      highContrast: false,
    }

    const result = preferencesSchema.safeParse(valid)
    expect(result.success).toBe(true)
  })

  it('should reject invalid theme values', () => {
    const invalid = [
      { theme: 'invalid-theme' },
      { theme: '<script>alert("XSS")</script>' },
      { theme: 'javascript:alert("XSS")' },
      { theme: 123 },
      { theme: null },
    ]

    invalid.forEach((input) => {
      const result = preferencesSchema.safeParse(input)
      expect(result.success).toBe(false)
    })
  })

  it('should reject invalid fontSize values', () => {
    const invalid = [
      { fontSize: 'huge' },
      { fontSize: '<b>large</b>' },
      { fontSize: 999 },
      { fontSize: 'eval(alert("XSS"))' },
    ]

    invalid.forEach((input) => {
      const result = preferencesSchema.safeParse(input)
      expect(result.success).toBe(false)
    })
  })

  it('should reject non-boolean values for boolean fields', () => {
    const invalid = [
      { dyslexiaFont: 'true' },
      { dyslexiaFont: 1 },
      { dyslexiaFont: 'yes' },
      { highContrast: 'false' },
      { highContrast: 0 },
    ]

    invalid.forEach((input) => {
      const result = preferencesSchema.safeParse(input)
      expect(result.success).toBe(false)
    })
  })

  it('should allow partial preferences (all fields optional)', () => {
    const partial = { theme: 'dark' as const }
    const result = preferencesSchema.safeParse(partial)
    expect(result.success).toBe(true)
  })
})

describe('Answer Input Schema Security', () => {
  it('should accept valid numeric answers', () => {
    const valid = ['42', '3.14', '1/2', '50%', '-7', '0.5']

    valid.forEach((input) => {
      const result = answerInputSchema.safeParse(input)
      expect(result.success).toBe(true)
    })
  })

  it('should trim whitespace', () => {
    const result = answerInputSchema.safeParse('  42  ')
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data).toBe('42')
    }
  })

  it('should reject XSS attempts', () => {
    const xssAttempts = [
      '<script>alert("XSS")</script>',
      '<img src=x onerror=alert("XSS")>',
      'javascript:alert("XSS")',
      '<iframe src="evil.com"></iframe>',
      'onerror=alert("XSS")',
      '<svg/onload=alert("XSS")>',
    ]

    xssAttempts.forEach((input) => {
      const result = answerInputSchema.safeParse(input)
      expect(result.success).toBe(false)
    })
  })

  it('should reject HTML tags', () => {
    const htmlInputs = [
      '<b>42</b>',
      '<div>answer</div>',
      '<p>3.14</p>',
      '42<br/>',
    ]

    htmlInputs.forEach((input) => {
      const result = answerInputSchema.safeParse(input)
      expect(result.success).toBe(false)
    })
  })

  it('should reject code execution attempts', () => {
    const codeExecution = [
      'eval(alert("XSS"))',
      'function(){alert("XSS")}',
      '${alert("XSS")}',
      '`alert("XSS")`',
      'alert("XSS")',
    ]

    codeExecution.forEach((input) => {
      const result = answerInputSchema.safeParse(input)
      expect(result.success).toBe(false)
    })
  })

  it('should reject excessively long inputs (DoS prevention)', () => {
    const longInput = 'a'.repeat(201)
    const result = answerInputSchema.safeParse(longInput)
    expect(result.success).toBe(false)
  })

  it('should reject special characters outside math symbols', () => {
    const invalid = [
      'answer&nbsp;42',
      '42;DROP TABLE users;',
      "42'OR'1'='1",
      '42|ls -la',
      '42 && rm -rf /',
    ]

    invalid.forEach((input) => {
      const result = answerInputSchema.safeParse(input)
      expect(result.success).toBe(false)
    })
  })
})

describe('Sign In Payload Schema Security', () => {
  it('should accept valid sign in payload', () => {
    const valid = { uuid: '7b3f-4c2a-8d1e-9f6b' }
    const result = signInPayloadSchema.safeParse(valid)
    expect(result.success).toBe(true)
  })

  it('should reject payload without UUID', () => {
    const result = signInPayloadSchema.safeParse({})
    expect(result.success).toBe(false)
  })

  it('should reject malicious UUID in payload', () => {
    const malicious = [
      { uuid: '<script>alert("XSS")</script>' },
      { uuid: "'; DROP TABLE users; --" },
      { uuid: 'javascript:alert("XSS")' },
    ]

    malicious.forEach((input) => {
      const result = signInPayloadSchema.safeParse(input)
      expect(result.success).toBe(false)
    })
  })
})

describe('Generate UUID Payload Schema Security', () => {
  it('should accept valid payload', () => {
    const valid = {
      gradeRange: '4-6' as const,
      locale: 'da-DK' as const,
    }
    const result = generateUUIDPayloadSchema.safeParse(valid)
    expect(result.success).toBe(true)
  })

  it('should apply default locale', () => {
    const payload = { gradeRange: '0-3' as const }
    const result = generateUUIDPayloadSchema.safeParse(payload)
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.locale).toBe('da-DK')
    }
  })

  it('should reject invalid grade ranges', () => {
    const invalid = [
      { gradeRange: '0-10' },
      { gradeRange: 'all' },
      { gradeRange: '<script>alert("XSS")</script>' },
      { gradeRange: 123 },
    ]

    invalid.forEach((input) => {
      const result = generateUUIDPayloadSchema.safeParse(input)
      expect(result.success).toBe(false)
    })
  })

  it('should reject invalid locales', () => {
    const invalid = [
      { gradeRange: '0-3', locale: 'en' },
      { gradeRange: '0-3', locale: 'fr-FR' },
      { gradeRange: '0-3', locale: 'javascript:alert("XSS")' },
    ]

    invalid.forEach((input) => {
      const result = generateUUIDPayloadSchema.safeParse(input)
      expect(result.success).toBe(false)
    })
  })

  it('should require gradeRange', () => {
    const result = generateUUIDPayloadSchema.safeParse({})
    expect(result.success).toBe(false)
  })
})

describe('validateInput Helper Function', () => {
  it('should return success result for valid input', () => {
    const result = validateInput(uuidSchema, '7b3f-4c2a-8d1e-9f6b')
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data).toBe('7b3f-4c2a-8d1e-9f6b')
    }
  })

  it('should return error result for invalid input', () => {
    const result = validateInput(uuidSchema, 'invalid-uuid')
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error).toContain('UUID must be in format')
    }
  })

  it('should format multiple errors', () => {
    const complexSchema = preferencesSchema
    const invalid = {
      theme: 'invalid',
      fontSize: 'huge',
      dyslexiaFont: 'not-a-boolean',
    }

    const result = validateInput(complexSchema, invalid)
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error).toBeTruthy()
      expect(result.error.length).toBeGreaterThan(0)
    }
  })
})

describe('Type Coercion Vulnerabilities', () => {
  it('should not coerce types for UUID', () => {
    const inputs = [
      123456789012,
      true,
      false,
      null,
      undefined,
      {},
      [],
    ]

    inputs.forEach((input) => {
      const result = uuidSchema.safeParse(input)
      expect(result.success).toBe(false)
    })
  })

  it('should not coerce types for preferences', () => {
    const invalidPrefs = [
      { theme: 1 },
      { fontSize: true },
      { dyslexiaFont: 'true' },
      { highContrast: 1 },
    ]

    invalidPrefs.forEach((input) => {
      const result = preferencesSchema.safeParse(input)
      expect(result.success).toBe(false)
    })
  })
})

describe('Edge Cases and Boundary Conditions', () => {
  it('should handle empty strings', () => {
    const schemas = [uuidSchema, answerInputSchema]

    schemas.forEach((schema) => {
      const result = schema.safeParse('')
      expect(result.success).toBe(false)
    })
  })

  it('should handle whitespace-only strings', () => {
    const result = uuidSchema.safeParse('    ')
    expect(result.success).toBe(false)
  })

  it('should handle maximum length answers', () => {
    const maxLength = 'a'.repeat(200)
    const result = answerInputSchema.safeParse(maxLength)
    // Should fail because it only allows numbers and math symbols
    expect(result.success).toBe(false)
  })

  it('should handle unicode characters in UUID', () => {
    const result = uuidSchema.safeParse('7b3f-4c2a-8d1é-9f6b')
    expect(result.success).toBe(false)
  })

  it('should handle null and undefined', () => {
    const schemas = [uuidSchema, preferencesSchema, answerInputSchema]

    schemas.forEach((schema) => {
      expect(schema.safeParse(null).success).toBe(false)
      expect(schema.safeParse(undefined).success).toBe(false)
    })
  })
})
