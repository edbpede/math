/**
 * Input sanitization utilities
 *
 * Defense-in-depth approach: Even though Astro and SolidJS auto-escape output,
 * we sanitize inputs to prevent injection attacks at multiple layers.
 *
 * Security Note: These functions are NOT a replacement for proper output escaping.
 * Always rely on framework auto-escaping as the primary defense.
 *
 * @see docs/SECURITY.md for sanitization patterns
 */

/**
 * HTML entities that must be escaped to prevent XSS
 */
const HTML_ENTITIES: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#x27;',
  '/': '&#x2F;',
}

/**
 * Escapes HTML entities in user input
 *
 * Security: Prevents XSS by escaping dangerous characters
 * Use case: Defense-in-depth for user-generated content
 *
 * @param input User input string
 * @returns Escaped string safe for HTML contexts
 *
 * @example
 * escapeHtml('<script>alert("XSS")</script>')
 * // Returns: '&lt;script&gt;alert(&quot;XSS&quot;)&lt;&#x2F;script&gt;'
 */
export function escapeHtml(input: string): string {
  return input.replace(/[&<>"'/]/g, (char) => HTML_ENTITIES[char] || char)
}

/**
 * Sanitizes user answer input
 *
 * Security: Removes potentially dangerous characters while preserving valid math input
 * Allows: Numbers, decimal separators, basic math symbols, fractions, percentages
 * Removes: HTML tags, script tags, SQL keywords, special characters
 *
 * @param answer Raw user answer input
 * @returns Sanitized answer string
 *
 * @example
 * sanitizeAnswer('5 + 3<script>alert("XSS")</script>')
 * // Returns: '5 + 3'
 */
export function sanitizeAnswer(answer: string): string {
  // Trim whitespace
  let sanitized = answer.trim()

  // Remove all HTML tags (including script tags), but preserve content
  // This removes <script>, </script>, <div>, etc., but keeps what's between them
  sanitized = sanitized.replace(/<[^>]*>/g, '')

  // Remove javascript: protocol and everything after it until semicolon or space
  sanitized = sanitized.replace(/javascript:[^\s;]*/gi, '')

  // Remove event handlers with their values (onclick=, onerror=, etc.)
  sanitized = sanitized.replace(/on\w+\s*=[^\s;]*/gi, '')

  // Remove data: URLs
  sanitized = sanitized.replace(/data:[^,\s]*,[^\s;]*/gi, '')

  // Remove any alphabetic words that might be function names or SQL keywords
  // Keep only math-related patterns
  sanitized = sanitized.replace(/[a-zA-Z]+/g, '')

  // Only allow safe characters for math answers
  // Allows: digits, spaces, decimal point, comma, minus, plus, divide, percent, parentheses
  sanitized = sanitized.replace(/[^0-9.,\-+\/%\s()]/g, '')

  // Remove standalone operators/parentheses that have no digits
  if (!/\d/.test(sanitized)) {
    // No digits found, clear everything
    sanitized = ''
  } else {
    // Remove leading spaces, but preserve leading minus for negative numbers
    sanitized = sanitized.replace(/^[\s.,+\/()]+/, '')

    // Remove trailing spaces and operators (but not % which is valid after a digit)
    sanitized = sanitized.replace(/[\s.,\-+\/()]+$/, '')
  }

  // Normalize multiple spaces to single space
  sanitized = sanitized.replace(/\s+/g, ' ')

  return sanitized.trim()
}

/**
 * Sanitizes UUID input
 *
 * Security: Ensures UUID only contains hex characters and hyphens
 *
 * @param uuid Raw UUID input
 * @returns Sanitized UUID string
 *
 * @example
 * sanitizeUUID('7b3f-4c2a-8d1e-9f6b<script>')
 * // Returns: '7b3f-4c2a-8d1e-9f6b'
 */
export function sanitizeUUID(uuid: string): string {
  // Trim and lowercase
  let sanitized = uuid.trim().toLowerCase()

  // Remove HTML tags first (to avoid keeping hex chars from tag names like 'c' from <script>)
  sanitized = sanitized.replace(/<[^>]*>/g, '')

  // Only allow hex characters and hyphens
  sanitized = sanitized.replace(/[^0-9a-f-]/g, '')

  // Ensure correct format (4-4-4-4)
  const parts = sanitized.split('-').filter((part) => part.length > 0)
  if (parts.length === 4 && parts.every((part) => part.length === 4)) {
    return parts.join('-')
  }

  // Return sanitized but potentially invalid format (validation will catch it)
  return sanitized
}

/**
 * Sanitizes text input for preferences and settings
 *
 * Security: Removes dangerous characters while preserving readable text
 *
 * @param text Raw text input
 * @returns Sanitized text string
 *
 * @example
 * sanitizeText('User Name<script>alert("XSS")</script>')
 * // Returns: 'User Name'
 */
export function sanitizeText(text: string): string {
  // Trim whitespace
  let sanitized = text.trim()

  // Remove script content first (before removing tags)
  sanitized = sanitized.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')

  // Remove HTML tags
  sanitized = sanitized.replace(/<[^>]*>/g, '')

  // Remove javascript: protocol and everything after it
  sanitized = sanitized.replace(/javascript:[^\s;]*/gi, '')

  // Remove event handlers with their values
  sanitized = sanitized.replace(/on\w+\s*=[^\s;]*/gi, '')

  // Escape remaining HTML entities
  sanitized = escapeHtml(sanitized)

  return sanitized.trim()
}

/**
 * Strips all non-numeric characters from input
 *
 * Security: Ensures numeric-only input for calculations
 *
 * @param input Raw input string
 * @returns String containing only digits
 *
 * @example
 * stripNonNumeric('123abc456')
 * // Returns: '123456'
 */
export function stripNonNumeric(input: string): string {
  return input.replace(/[^0-9]/g, '')
}

/**
 * Sanitizes file path to prevent directory traversal attacks
 *
 * Security: Prevents ../ and absolute path exploits
 * Note: Currently not used (no file uploads), but prepared for future features
 *
 * @param path Raw file path input
 * @returns Sanitized path safe for file operations
 *
 * @example
 * sanitizeFilePath('../../etc/passwd')
 * // Returns: 'etcpasswd'
 */
export function sanitizeFilePath(path: string): string {
  // Remove directory traversal attempts (.. and ./)
  let sanitized = path.replace(/\.\.+/g, '')
  sanitized = sanitized.replace(/\.\//g, '')

  // Remove leading slashes (prevent absolute paths)
  sanitized = sanitized.replace(/^\/+/, '')

  // Remove multiple consecutive slashes but keep single slashes for now
  sanitized = sanitized.replace(/\/+/g, '/')

  // After removing .., if there are leading slashes from traversal, remove them
  sanitized = sanitized.replace(/^\/+/, '')

  // Only allow alphanumeric, dash, underscore, dot, slash
  sanitized = sanitized.replace(/[^a-zA-Z0-9\-_./]/g, '')

  // Remove any remaining dots at the beginning
  sanitized = sanitized.replace(/^\.+/, '')

  return sanitized.trim()
}

/**
 * Validates and sanitizes JSON input
 *
 * Security: Prevents JSON injection and ensures valid JSON structure
 *
 * @param input Raw JSON string
 * @returns Parsed and re-serialized JSON or null if invalid
 *
 * @example
 * sanitizeJSON('{"valid": true}')
 * // Returns: '{"valid":true}'
 *
 * sanitizeJSON('{"invalid": undefined}')
 * // Returns: null
 */
export function sanitizeJSON(input: string): string | null {
  try {
    // Parse and re-serialize to ensure valid JSON
    const parsed = JSON.parse(input)

    // Re-serialize with no whitespace
    return JSON.stringify(parsed)
  } catch {
    // Invalid JSON
    return null
  }
}

/**
 * Limits string length to prevent DoS attacks
 *
 * Security: Prevents excessive memory usage from overly long inputs
 *
 * @param input Input string
 * @param maxLength Maximum allowed length
 * @returns Truncated string
 *
 * @example
 * limitLength('Very long string...', 10)
 * // Returns: 'Very long '
 */
export function limitLength(input: string, maxLength: number): string {
  if (input.length <= maxLength) {
    return input
  }

  return input.substring(0, maxLength)
}

/**
 * Comprehensive sanitization for user input
 *
 * Combines multiple sanitization strategies:
 * 1. Trim whitespace
 * 2. Limit length
 * 3. Remove HTML tags
 * 4. Escape HTML entities
 *
 * @param input Raw user input
 * @param maxLength Maximum allowed length (default: 1000)
 * @returns Fully sanitized string
 *
 * @example
 * sanitizeInput('<b>Hello</b> World!', 20)
 * // Returns: 'Hello World!'
 */
export function sanitizeInput(input: string, maxLength: number = 1000): string {
  let sanitized = input.trim()
  sanitized = limitLength(sanitized, maxLength)
  sanitized = sanitized.replace(/<[^>]*>/g, '')
  sanitized = escapeHtml(sanitized)
  return sanitized
}

/**
 * Detects potentially malicious input patterns
 *
 * Security: Identifies common attack vectors (XSS, SQL injection, etc.)
 *
 * @param input User input to check
 * @returns true if suspicious patterns detected
 *
 * @example
 * detectMaliciousInput('<script>alert("XSS")</script>')
 * // Returns: true
 */
export function detectMaliciousInput(input: string): boolean {
  const maliciousPatterns = [
    /<script[\s\S]*?>[\s\S]*?<\/script>/gi, // Script tags
    /<iframe[\s\S]*?>/gi, // Iframe tags
    /javascript:/gi, // JavaScript protocol
    /on\w+\s*=/gi, // Event handlers
    /eval\s*\(/gi, // eval() calls
    /expression\s*\(/gi, // CSS expressions
    /import\s+/gi, // ES6 imports
    /document\./gi, // DOM access
    /window\./gi, // Window object access
    /<object[\s\S]*?>/gi, // Object tags
    /<embed[\s\S]*?>/gi, // Embed tags
    /vbscript:/gi, // VBScript protocol
    /data:text\/html/gi, // Data URLs with HTML
  ]

  return maliciousPatterns.some((pattern) => pattern.test(input))
}

/**
 * Type guard to ensure sanitized input
 *
 * @param input Input to validate
 * @returns true if input is safe
 *
 * @example
 * if (isSafeInput(userInput)) {
 *   processInput(userInput)
 * }
 */
export function isSafeInput(input: string): boolean {
  return !detectMaliciousInput(input) && input.length <= 10000
}
