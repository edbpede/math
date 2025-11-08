/**
 * Security Headers Tests
 *
 * Tests for security header configuration and generation.
 *
 * @see Requirements 1.5, 7.3, 12.2
 */

import { describe, test, expect } from 'vitest'
import {
  SECURITY_HEADERS,
  getContentSecurityPolicy,
  getSecurityHeaders,
  withSecurityHeaders,
  createSecurityHeaders,
} from './headers'

describe('SECURITY_HEADERS constants', () => {
  test('should export all required header names', () => {
    expect(SECURITY_HEADERS.CSP).toBe('Content-Security-Policy')
    expect(SECURITY_HEADERS.XCTO).toBe('X-Content-Type-Options')
    expect(SECURITY_HEADERS.XFO).toBe('X-Frame-Options')
    expect(SECURITY_HEADERS.XXP).toBe('X-XSS-Protection')
    expect(SECURITY_HEADERS.RP).toBe('Referrer-Policy')
    expect(SECURITY_HEADERS.PP).toBe('Permissions-Policy')
    expect(SECURITY_HEADERS.HSTS).toBe('Strict-Transport-Security')
  })
})

describe('getContentSecurityPolicy', () => {
  test('should generate CSP for production', () => {
    const csp = getContentSecurityPolicy(false)

    // Check that all required directives are present
    expect(csp).toContain("default-src 'self'")
    expect(csp).toContain("script-src 'self'")
    expect(csp).toContain("style-src 'self' 'unsafe-inline'")
    expect(csp).toContain("img-src 'self' data: https:")
    expect(csp).toContain("font-src 'self'")
    expect(csp).toContain("object-src 'none'")
    expect(csp).toContain("frame-src 'none'")
    expect(csp).toContain("frame-ancestors 'none'")
    expect(csp).toContain("base-uri 'self'")
    expect(csp).toContain('upgrade-insecure-requests')

    // Should not allow unsafe-eval in production
    expect(csp).not.toContain("'unsafe-eval'")
  })

  test('should generate CSP for development with relaxed rules', () => {
    const csp = getContentSecurityPolicy(true)

    // Development should allow unsafe-inline and unsafe-eval for HMR
    expect(csp).toContain("script-src 'self' 'unsafe-inline' 'unsafe-eval'")

    // Should not upgrade insecure requests in development
    expect(csp).not.toContain('upgrade-insecure-requests')
  })

  test('should include Supabase in connect-src', () => {
    const csp = getContentSecurityPolicy(false)

    // Should allow connections to Supabase
    expect(csp).toContain('connect-src')
    expect(csp).toMatch(/supabase\.co/)
  })

  test('should block all plugins and embeds', () => {
    const csp = getContentSecurityPolicy(false)

    // Should block dangerous content types
    expect(csp).toContain("object-src 'none'")
    expect(csp).toContain("frame-src 'none'")
    expect(csp).toContain("frame-ancestors 'none'")
  })
})

describe('getSecurityHeaders', () => {
  test('should generate all security headers for production', () => {
    const headers = getSecurityHeaders(false)

    // Check that all headers are present
    expect(headers[SECURITY_HEADERS.CSP]).toBeDefined()
    expect(headers[SECURITY_HEADERS.XCTO]).toBe('nosniff')
    expect(headers[SECURITY_HEADERS.XFO]).toBe('DENY')
    expect(headers[SECURITY_HEADERS.XXP]).toBe('1; mode=block')
    expect(headers[SECURITY_HEADERS.RP]).toBe(
      'strict-origin-when-cross-origin'
    )
    expect(headers[SECURITY_HEADERS.PP]).toBeDefined()
    expect(headers[SECURITY_HEADERS.HSTS]).toBeDefined()
  })

  test('should include HSTS header in production', () => {
    const headers = getSecurityHeaders(false)

    expect(headers[SECURITY_HEADERS.HSTS]).toBe(
      'max-age=63072000; includeSubDomains; preload'
    )
  })

  test('should not include HSTS header in development', () => {
    const headers = getSecurityHeaders(true)

    expect(headers[SECURITY_HEADERS.HSTS]).toBeUndefined()
  })

  test('should disable dangerous browser features in Permissions-Policy', () => {
    const headers = getSecurityHeaders(false)
    const pp = headers[SECURITY_HEADERS.PP]

    // Should disable potentially dangerous features
    expect(pp).toContain('camera=()')
    expect(pp).toContain('microphone=()')
    expect(pp).toContain('geolocation=()')
    expect(pp).toContain('payment=()')
    expect(pp).toContain('usb=()')
  })

  test('should set X-Frame-Options to DENY', () => {
    const headers = getSecurityHeaders(false)

    // Should prevent all iframe embedding
    expect(headers[SECURITY_HEADERS.XFO]).toBe('DENY')
  })

  test('should set X-Content-Type-Options to nosniff', () => {
    const headers = getSecurityHeaders(false)

    // Should prevent MIME type sniffing
    expect(headers[SECURITY_HEADERS.XCTO]).toBe('nosniff')
  })
})

describe('withSecurityHeaders', () => {
  test('should add security headers to a Response', () => {
    const originalResponse = new Response('test body', {
      status: 200,
      headers: {
        'Content-Type': 'text/plain',
      },
    })

    const securedResponse = withSecurityHeaders(originalResponse, false)

    // Original header should be preserved
    expect(securedResponse.headers.get('Content-Type')).toBe('text/plain')

    // Security headers should be added
    expect(securedResponse.headers.get(SECURITY_HEADERS.CSP)).toBeDefined()
    expect(securedResponse.headers.get(SECURITY_HEADERS.XCTO)).toBe('nosniff')
    expect(securedResponse.headers.get(SECURITY_HEADERS.XFO)).toBe('DENY')
  })

  test('should preserve response body and status', () => {
    const originalResponse = new Response('test body', {
      status: 201,
    })

    const securedResponse = withSecurityHeaders(originalResponse, false)

    // Status and body should be preserved
    expect(securedResponse.status).toBe(201)
  })

  test('should work with different development modes', async () => {
    const response = new Response('test')

    const prodResponse = withSecurityHeaders(response, false)
    const devResponse = withSecurityHeaders(response, true)

    // Production should have HSTS
    expect(prodResponse.headers.get(SECURITY_HEADERS.HSTS)).toBeDefined()

    // Development should not have HSTS
    expect(devResponse.headers.get(SECURITY_HEADERS.HSTS)).toBeNull()
  })
})

describe('createSecurityHeaders', () => {
  test('should create Headers object with security headers', () => {
    const headers = createSecurityHeaders(false)

    expect(headers).toBeInstanceOf(Headers)
    expect(headers.get(SECURITY_HEADERS.CSP)).toBeDefined()
    expect(headers.get(SECURITY_HEADERS.XCTO)).toBe('nosniff')
  })

  test('should merge with existing headers', () => {
    const existingHeaders = {
      'Content-Type': 'application/json',
      'X-Custom-Header': 'custom-value',
    }

    const headers = createSecurityHeaders(false, existingHeaders)

    // Existing headers should be preserved
    expect(headers.get('Content-Type')).toBe('application/json')
    expect(headers.get('X-Custom-Header')).toBe('custom-value')

    // Security headers should be added
    expect(headers.get(SECURITY_HEADERS.CSP)).toBeDefined()
    expect(headers.get(SECURITY_HEADERS.XCTO)).toBe('nosniff')
  })

  test('should work with Headers object as input', () => {
    const existingHeaders = new Headers({
      'Content-Type': 'application/json',
    })

    const headers = createSecurityHeaders(false, existingHeaders)

    // Should preserve existing headers
    expect(headers.get('Content-Type')).toBe('application/json')

    // Should add security headers
    expect(headers.get(SECURITY_HEADERS.CSP)).toBeDefined()
  })

  test('should work with empty existing headers', () => {
    const headers = createSecurityHeaders(false, {})

    // Should still create all security headers
    expect(headers.get(SECURITY_HEADERS.CSP)).toBeDefined()
    expect(headers.get(SECURITY_HEADERS.XCTO)).toBe('nosniff')
  })

  test('should work without existing headers', () => {
    const headers = createSecurityHeaders(false)

    // Should create all security headers
    expect(headers.get(SECURITY_HEADERS.CSP)).toBeDefined()
    expect(headers.get(SECURITY_HEADERS.XCTO)).toBe('nosniff')
  })
})

describe('Security header compliance', () => {
  test('should meet OWASP security header recommendations', () => {
    const headers = getSecurityHeaders(false)

    // OWASP recommended headers should all be present
    expect(headers[SECURITY_HEADERS.CSP]).toBeDefined()
    expect(headers[SECURITY_HEADERS.XCTO]).toBeDefined()
    expect(headers[SECURITY_HEADERS.XFO]).toBeDefined()
    expect(headers[SECURITY_HEADERS.RP]).toBeDefined()
    expect(headers[SECURITY_HEADERS.HSTS]).toBeDefined()
  })

  test('should provide defense in depth with multiple headers', () => {
    const headers = getSecurityHeaders(false)

    // Multiple layers of XSS protection
    expect(headers[SECURITY_HEADERS.CSP]).toBeDefined() // Modern browsers
    expect(headers[SECURITY_HEADERS.XXP]).toBeDefined() // Legacy browsers

    // Multiple layers of clickjacking protection
    expect(headers[SECURITY_HEADERS.XFO]).toBe('DENY')
    expect(headers[SECURITY_HEADERS.CSP]).toContain("frame-ancestors 'none'")
  })
})
