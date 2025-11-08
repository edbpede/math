/**
 * Security-focused tests for sanitization functions
 *
 * Tests cover:
 * - XSS prevention through HTML escaping
 * - Script tag removal
 * - Event handler removal
 * - Malicious pattern detection
 * - Input length limiting (DoS prevention)
 */

import { describe, it, expect } from 'vitest'
import {
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

describe('escapeHtml', () => {
  it('should escape HTML entities', () => {
    expect(escapeHtml('<div>Test</div>')).toBe('&lt;div&gt;Test&lt;&#x2F;div&gt;')
    expect(escapeHtml('<script>alert("XSS")</script>')).toBe(
      '&lt;script&gt;alert(&quot;XSS&quot;)&lt;&#x2F;script&gt;'
    )
  })

  it('should escape all dangerous characters', () => {
    expect(escapeHtml('&')).toBe('&amp;')
    expect(escapeHtml('<')).toBe('&lt;')
    expect(escapeHtml('>')).toBe('&gt;')
    expect(escapeHtml('"')).toBe('&quot;')
    expect(escapeHtml("'")).toBe('&#x27;')
    expect(escapeHtml('/')).toBe('&#x2F;')
  })

  it('should preserve safe characters', () => {
    expect(escapeHtml('Hello World')).toBe('Hello World')
    expect(escapeHtml('123')).toBe('123')
    expect(escapeHtml('foo-bar_baz')).toBe('foo-bar_baz')
  })

  it('should handle empty string', () => {
    expect(escapeHtml('')).toBe('')
  })
})

describe('sanitizeAnswer', () => {
  it('should preserve valid numeric answers', () => {
    expect(sanitizeAnswer('42')).toBe('42')
    expect(sanitizeAnswer('3.14')).toBe('3.14')
    expect(sanitizeAnswer('1/2')).toBe('1/2')
    expect(sanitizeAnswer('50%')).toBe('50%')
    expect(sanitizeAnswer('-7')).toBe('-7')
  })

  it('should remove HTML tags', () => {
    expect(sanitizeAnswer('<script>42</script>')).toBe('42')
    expect(sanitizeAnswer('<b>3.14</b>')).toBe('3.14')
    expect(sanitizeAnswer('5<br/>2')).toBe('52')
  })

  it('should remove XSS attempts', () => {
    expect(sanitizeAnswer('<script>alert("XSS")</script>42')).toBe('42')
    expect(sanitizeAnswer('javascript:alert("XSS")')).toBe('')
    expect(sanitizeAnswer('onerror=alert("XSS")')).toBe('')
  })

  it('should remove event handlers', () => {
    expect(sanitizeAnswer('42 onclick=alert("XSS")')).toBe('42')
    expect(sanitizeAnswer('3.14 onload=steal()')).toBe('3.14')
  })

  it('should remove data URLs', () => {
    expect(sanitizeAnswer('data:text/html,<script>alert("XSS")</script>')).toBe(
      ''
    )
  })

  it('should only allow safe math characters', () => {
    expect(sanitizeAnswer('42abc')).toBe('42')
    expect(sanitizeAnswer('3.14;DROP TABLE')).toBe('3.14')
    expect(sanitizeAnswer('1/2|ls -la')).toBe('1/2')
  })

  it('should normalize whitespace', () => {
    expect(sanitizeAnswer('  42  ')).toBe('42')
    expect(sanitizeAnswer('3   +   5')).toBe('3 + 5')
    expect(sanitizeAnswer('1\n/\n2')).toBe('1 / 2')
  })

  it('should handle empty input', () => {
    expect(sanitizeAnswer('')).toBe('')
    expect(sanitizeAnswer('   ')).toBe('')
  })
})

describe('sanitizeUUID', () => {
  it('should preserve valid UUIDs', () => {
    expect(sanitizeUUID('7b3f-4c2a-8d1e-9f6b')).toBe('7b3f-4c2a-8d1e-9f6b')
  })

  it('should normalize to lowercase', () => {
    expect(sanitizeUUID('7B3F-4C2A-8D1E-9F6B')).toBe('7b3f-4c2a-8d1e-9f6b')
  })

  it('should trim whitespace', () => {
    expect(sanitizeUUID('  7b3f-4c2a-8d1e-9f6b  ')).toBe('7b3f-4c2a-8d1e-9f6b')
  })

  it('should remove non-hex characters', () => {
    expect(sanitizeUUID('7b3f-4c2a-8d1e-9f6b<script>')).toBe('7b3f-4c2a-8d1e-9f6b')
    expect(sanitizeUUID('7b3f-4c2a-8d1e-9f6b!@#$')).toBe('7b3f-4c2a-8d1e-9f6b')
  })

  it('should handle malformed UUIDs', () => {
    // Returns sanitized but invalid format (validation will catch it)
    const result = sanitizeUUID('not-a-uuid')
    expect(result).not.toContain('<')
    expect(result).not.toContain('>')
  })
})

describe('sanitizeText', () => {
  it('should preserve normal text', () => {
    expect(sanitizeText('Hello World')).toBe('Hello World')
  })

  it('should remove HTML tags', () => {
    expect(sanitizeText('<b>Bold</b>')).toBe('Bold')
    expect(sanitizeText('<div>Content</div>')).toBe('Content')
  })

  it('should remove script tags and content', () => {
    expect(sanitizeText('<script>alert("XSS")</script>')).toBe('')
    expect(sanitizeText('Text<script>evil()</script>More')).toBe('TextMore')
  })

  it('should remove javascript: protocol', () => {
    expect(sanitizeText('javascript:alert("XSS")')).toBe('')
  })

  it('should remove event handlers', () => {
    expect(sanitizeText('Text onclick=alert("XSS")')).toBe('Text')
  })

  it('should escape remaining HTML entities', () => {
    const result = sanitizeText('A & B')
    expect(result).toContain('&amp;')
  })

  it('should trim whitespace', () => {
    expect(sanitizeText('  Text  ')).toBe('Text')
  })
})

describe('stripNonNumeric', () => {
  it('should keep only digits', () => {
    expect(stripNonNumeric('123')).toBe('123')
    expect(stripNonNumeric('abc123def')).toBe('123')
    expect(stripNonNumeric('4-5-6')).toBe('456')
  })

  it('should remove all non-numeric characters', () => {
    expect(stripNonNumeric('1.23')).toBe('123')
    expect(stripNonNumeric('$42.00')).toBe('4200')
    expect(stripNonNumeric('(555) 123-4567')).toBe('5551234567')
  })

  it('should handle empty input', () => {
    expect(stripNonNumeric('')).toBe('')
    expect(stripNonNumeric('abc')).toBe('')
  })
})

describe('sanitizeFilePath', () => {
  it('should preserve safe file paths', () => {
    expect(sanitizeFilePath('folder/file.txt')).toBe('folder/file.txt')
    expect(sanitizeFilePath('images/photo-2023.jpg')).toBe('images/photo-2023.jpg')
  })

  it('should prevent directory traversal', () => {
    expect(sanitizeFilePath('../../../etc/passwd')).toBe('etc/passwd')
    expect(sanitizeFilePath('../../secret')).toBe('secret')
    expect(sanitizeFilePath('./././file')).toBe('file')
  })

  it('should remove leading slashes (prevent absolute paths)', () => {
    expect(sanitizeFilePath('/etc/passwd')).toBe('etc/passwd')
    expect(sanitizeFilePath('///root')).toBe('root')
  })

  it('should normalize multiple slashes', () => {
    expect(sanitizeFilePath('folder//file')).toBe('folder/file')
    expect(sanitizeFilePath('a///b///c')).toBe('a/b/c')
  })

  it('should remove dangerous characters', () => {
    expect(sanitizeFilePath('file<script>.txt')).toBe('filescript.txt')
    expect(sanitizeFilePath('file&name.txt')).toBe('filename.txt')
  })
})

describe('sanitizeJSON', () => {
  it('should accept valid JSON', () => {
    expect(sanitizeJSON('{"key": "value"}')).toBe('{"key":"value"}')
    expect(sanitizeJSON('{"number": 42}')).toBe('{"number":42}')
    expect(sanitizeJSON('[]')).toBe('[]')
  })

  it('should reject invalid JSON', () => {
    expect(sanitizeJSON('not json')).toBe(null)
    expect(sanitizeJSON('{"invalid": undefined}')).toBe(null)
    expect(sanitizeJSON('{key: "value"}')).toBe(null)
  })

  it('should normalize JSON (remove extra whitespace)', () => {
    const input = '{\n  "key": "value"\n}'
    const result = sanitizeJSON(input)
    expect(result).toBe('{"key":"value"}')
  })

  it('should handle malicious JSON attempts', () => {
    expect(sanitizeJSON('{"<script>": "alert()"}')).toBe('{"<script>":"alert()"}')
    // Escaping happens during output, not during JSON parsing
  })
})

describe('limitLength', () => {
  it('should preserve strings within limit', () => {
    expect(limitLength('Hello', 10)).toBe('Hello')
  })

  it('should truncate strings exceeding limit', () => {
    expect(limitLength('Hello World', 5)).toBe('Hello')
    expect(limitLength('1234567890', 5)).toBe('12345')
  })

  it('should handle exact length', () => {
    expect(limitLength('12345', 5)).toBe('12345')
  })

  it('should handle empty strings', () => {
    expect(limitLength('', 10)).toBe('')
  })
})

describe('sanitizeInput (comprehensive)', () => {
  it('should apply all sanitization steps', () => {
    const input = '  <b>Text</b>  '
    const result = sanitizeInput(input)
    expect(result).toBe('Text')
  })

  it('should limit length', () => {
    const longInput = 'a'.repeat(2000)
    const result = sanitizeInput(longInput, 100)
    expect(result.length).toBeLessThanOrEqual(100)
  })

  it('should escape HTML entities', () => {
    const result = sanitizeInput('A & B')
    expect(result).toContain('&amp;')
  })

  it('should handle XSS attempts', () => {
    const xss = '<script>alert("XSS")</script>Test'
    const result = sanitizeInput(xss)
    expect(result).not.toContain('<script>')
    expect(result).toContain('Test')
  })
})

describe('detectMaliciousInput', () => {
  it('should detect script tags', () => {
    expect(detectMaliciousInput('<script>alert("XSS")</script>')).toBe(true)
    expect(detectMaliciousInput('<SCRIPT>evil()</SCRIPT>')).toBe(true)
  })

  it('should detect iframe tags', () => {
    expect(detectMaliciousInput('<iframe src="evil.com"></iframe>')).toBe(true)
  })

  it('should detect javascript: protocol', () => {
    expect(detectMaliciousInput('javascript:alert("XSS")')).toBe(true)
    expect(detectMaliciousInput('JAVASCRIPT:evil()')).toBe(true)
  })

  it('should detect event handlers', () => {
    expect(detectMaliciousInput('onerror=alert("XSS")')).toBe(true)
    expect(detectMaliciousInput('onclick=steal()')).toBe(true)
    expect(detectMaliciousInput('onload=malicious()')).toBe(true)
  })

  it('should detect eval attempts', () => {
    expect(detectMaliciousInput('eval(alert("XSS"))')).toBe(true)
  })

  it('should detect CSS expressions', () => {
    expect(detectMaliciousInput('expression(alert("XSS"))')).toBe(true)
  })

  it('should detect ES6 imports', () => {
    expect(detectMaliciousInput('import { malicious } from "evil"')).toBe(true)
  })

  it('should detect DOM/window access', () => {
    expect(detectMaliciousInput('document.cookie')).toBe(true)
    expect(detectMaliciousInput('window.location')).toBe(true)
  })

  it('should detect object/embed tags', () => {
    expect(detectMaliciousInput('<object data="evil"></object>')).toBe(true)
    expect(detectMaliciousInput('<embed src="malicious">')).toBe(true)
  })

  it('should detect vbscript protocol', () => {
    expect(detectMaliciousInput('vbscript:msgbox("XSS")')).toBe(true)
  })

  it('should detect data URLs with HTML', () => {
    expect(detectMaliciousInput('data:text/html,<script>alert()</script>')).toBe(
      true
    )
  })

  it('should not flag safe inputs', () => {
    expect(detectMaliciousInput('Hello World')).toBe(false)
    expect(detectMaliciousInput('42')).toBe(false)
    expect(detectMaliciousInput('3.14')).toBe(false)
    expect(detectMaliciousInput('user@example.com')).toBe(false)
  })
})

describe('isSafeInput', () => {
  it('should return true for safe inputs', () => {
    expect(isSafeInput('Hello World')).toBe(true)
    expect(isSafeInput('42')).toBe(true)
    expect(isSafeInput('user@example.com')).toBe(true)
  })

  it('should return false for malicious inputs', () => {
    expect(isSafeInput('<script>alert("XSS")</script>')).toBe(false)
    expect(isSafeInput('javascript:alert("XSS")')).toBe(false)
  })

  it('should return false for excessively long inputs (DoS prevention)', () => {
    const tooLong = 'a'.repeat(10001)
    expect(isSafeInput(tooLong)).toBe(false)
  })

  it('should return true for inputs at length limit', () => {
    const atLimit = 'a'.repeat(10000)
    expect(isSafeInput(atLimit)).toBe(true)
  })
})

describe('Integration: Answer Sanitization', () => {
  it('should sanitize malicious answer inputs', () => {
    const maliciousAnswers = [
      '42<script>alert("XSS")</script>',
      '3.14<img src=x onerror=alert("XSS")>',
      '1/2<iframe src="evil.com"></iframe>',
    ]

    maliciousAnswers.forEach((input) => {
      const sanitized = sanitizeAnswer(input)
      expect(detectMaliciousInput(sanitized)).toBe(false)
    })
  })

  it('should preserve valid math expressions after sanitization', () => {
    const validAnswers = ['42', '3.14', '1/2', '50%', '-7', '(3+5)/2']

    validAnswers.forEach((input) => {
      const sanitized = sanitizeAnswer(input)
      expect(sanitized).toBeTruthy()
      expect(detectMaliciousInput(sanitized)).toBe(false)
    })
  })
})
