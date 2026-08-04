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
  createSecurityHeaders,
  getContentSecurityPolicy,
  getSecurityHeaders,
  SECURITY_HEADERS,
  withSecurityHeaders,
} from "./headers";
