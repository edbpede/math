/**
 * Security Module
 *
 * Provides security utilities for the application:
 * - HTTP security headers (CSP, HSTS, etc.)
 * - Cookie security configuration
 * - HTTPS enforcement
 *
 * @see Requirements 1.5, 7.3, 12.2
 */

export {
  SECURITY_HEADERS,
  getContentSecurityPolicy,
  getSecurityHeaders,
  withSecurityHeaders,
  createSecurityHeaders,
} from './headers'
