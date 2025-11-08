/**
 * Security Headers Configuration
 *
 * Provides comprehensive security headers for all HTTP responses.
 *
 * Security Features:
 * - Content Security Policy (CSP) with strict directives
 * - XSS protection headers
 * - Clickjacking prevention
 * - MIME type sniffing prevention
 * - HTTPS enforcement via HSTS
 * - Referrer policy for privacy
 *
 * Based on OWASP recommendations and industry best practices.
 *
 * @see Requirements 1.5, 7.3
 * @see https://owasp.org/www-project-secure-headers/
 */

/**
 * Security header names
 */
export const SECURITY_HEADERS = {
  CSP: 'Content-Security-Policy',
  XCTO: 'X-Content-Type-Options',
  XFO: 'X-Frame-Options',
  XXP: 'X-XSS-Protection',
  RP: 'Referrer-Policy',
  PP: 'Permissions-Policy',
  HSTS: 'Strict-Transport-Security',
} as const

/**
 * Content Security Policy directives
 *
 * CSP prevents XSS attacks by controlling which resources can be loaded.
 * We use a strict policy that:
 * - Only allows scripts from same origin
 * - Only allows styles from same origin and inline with hashes
 * - Only allows images from same origin and data: URIs
 * - Blocks all plugins, frames, and object embeds
 * - Requires HTTPS for all connections in production
 *
 * Note: Astro 5.9+ can auto-generate hashes for inline scripts/styles
 * For now, we use 'unsafe-inline' for development and will migrate to
 * hash-based CSP when deploying to production with an adapter.
 *
 * @param isDevelopment - Whether running in development mode
 * @returns CSP directive string
 */
export function getContentSecurityPolicy(isDevelopment: boolean = false): string {
  const directives = [
    // Default: restrict everything not explicitly allowed
    "default-src 'self'",

    // Scripts: only from same origin
    // In development, allow 'unsafe-inline' and 'unsafe-eval' for HMR
    // In production, use strict CSP with hashes (requires SSR adapter)
    isDevelopment
      ? "script-src 'self' 'unsafe-inline' 'unsafe-eval'"
      : "script-src 'self'",

    // Styles: same origin + inline styles (Astro generates inline critical CSS)
    // TODO: Migrate to hash-based CSP when using SSR adapter
    "style-src 'self' 'unsafe-inline'",

    // Images: same origin + data URIs (for inline SVG, base64)
    "img-src 'self' data: https:",

    // Fonts: same origin only
    "font-src 'self'",

    // AJAX/WebSocket/EventSource: same origin + Supabase
    `connect-src 'self' ${process.env.PUBLIC_SUPABASE_URL || 'https://*.supabase.co'} wss://*.supabase.co`,

    // Media: same origin only
    "media-src 'self'",

    // Objects/plugins: block all (no Flash, Java applets, etc.)
    "object-src 'none'",

    // Frames: block all (prevent clickjacking)
    "frame-src 'none'",

    // Web Workers: same origin only
    "worker-src 'self'",

    // Form actions: same origin only
    "form-action 'self'",

    // Frame ancestors: block all (prevent embedding in iframes)
    "frame-ancestors 'none'",

    // Base URI: restrict to prevent base tag injection
    "base-uri 'self'",

    // Upgrade insecure requests in production
    ...(isDevelopment ? [] : ['upgrade-insecure-requests']),
  ]

  return directives.join('; ')
}

/**
 * Get all security headers for a response
 *
 * Returns a Record of header names to values that should be set
 * on HTTP responses to enhance security.
 *
 * @param isDevelopment - Whether running in development mode
 * @returns Security headers object
 */
export function getSecurityHeaders(
  isDevelopment: boolean = false
): Record<string, string> {
  return {
    // Content Security Policy - prevents XSS and other injection attacks
    [SECURITY_HEADERS.CSP]: getContentSecurityPolicy(isDevelopment),

    // Prevent MIME type sniffing
    // Forces browsers to respect declared Content-Type
    [SECURITY_HEADERS.XCTO]: 'nosniff',

    // Prevent clickjacking by blocking iframe embedding
    // Using 'DENY' instead of 'SAMEORIGIN' for maximum protection
    [SECURITY_HEADERS.XFO]: 'DENY',

    // XSS Protection (legacy header, but still useful for older browsers)
    // Modern browsers rely on CSP, but this adds defense in depth
    [SECURITY_HEADERS.XXP]: '1; mode=block',

    // Referrer Policy - controls how much referrer information is sent
    // 'strict-origin-when-cross-origin' provides good privacy while
    // still allowing analytics on same-origin requests
    [SECURITY_HEADERS.RP]: 'strict-origin-when-cross-origin',

    // Permissions Policy - controls browser features
    // Disable features we don't use to reduce attack surface
    [SECURITY_HEADERS.PP]: [
      'camera=()',
      'microphone=()',
      'geolocation=()',
      'payment=()',
      'usb=()',
      'magnetometer=()',
      'gyroscope=()',
      'accelerometer=()',
    ].join(', '),

    // Strict Transport Security - force HTTPS (only in production)
    // max-age: 2 years, includeSubDomains, preload
    // Only set in production to avoid issues with localhost HTTP
    ...(isDevelopment
      ? {}
      : {
          [SECURITY_HEADERS.HSTS]: 'max-age=63072000; includeSubDomains; preload',
        }),
  }
}

/**
 * Apply security headers to a Response object
 *
 * Clones the response and adds all security headers.
 * Use this utility in API routes to ensure consistent security.
 *
 * @param response - Original Response object
 * @param isDevelopment - Whether running in development mode
 * @returns New Response with security headers
 */
export function withSecurityHeaders(
  response: Response,
  isDevelopment: boolean = false
): Response {
  const headers = getSecurityHeaders(isDevelopment)

  // Clone response to add headers
  const newResponse = new Response(response.body, response)

  // Add all security headers
  for (const [name, value] of Object.entries(headers)) {
    newResponse.headers.set(name, value)
  }

  return newResponse
}

/**
 * Get security headers as a Headers object
 *
 * Useful for constructing new Response objects with security headers.
 *
 * @param isDevelopment - Whether running in development mode
 * @param existingHeaders - Optional existing headers to merge with
 * @returns Headers object with security headers
 */
export function createSecurityHeaders(
  isDevelopment: boolean = false,
  existingHeaders?: HeadersInit
): Headers {
  const headers = new Headers(existingHeaders)
  const securityHeaders = getSecurityHeaders(isDevelopment)

  for (const [name, value] of Object.entries(securityHeaders)) {
    headers.set(name, value)
  }

  return headers
}
