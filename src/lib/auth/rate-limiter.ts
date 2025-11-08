/**
 * Rate Limiter for UUID Authentication
 *
 * Implements server-side rate limiting to prevent brute force attacks.
 * Tracks failed login attempts by IP address and enforces a configurable
 * limit within a time window.
 *
 * Features:
 * - IP-based tracking (privacy-preserving)
 * - Configurable attempt limit and time window
 * - Automatic cleanup of expired entries
 * - Detailed rate limit information for client feedback
 *
 * @see Requirement 7.4 - 5 attempts per minute per IP
 */

/**
 * Rate limit entry for a single IP address
 */
interface RateLimitEntry {
  /** Number of failed attempts in current window */
  count: number
  /** Timestamp when the rate limit window resets (ms since epoch) */
  resetAt: number
}

/**
 * Rate limit check result
 */
export interface RateLimitResult {
  /** Whether the request is allowed */
  allowed: boolean
  /** Number of attempts remaining before rate limit */
  remaining: number
  /** Timestamp when the rate limit resets (ms since epoch) */
  resetAt: number
  /** Seconds until rate limit resets (for Retry-After header) */
  retryAfter: number
}

/**
 * Configuration for rate limiter
 */
export interface RateLimiterConfig {
  /** Maximum number of failed attempts allowed */
  maxAttempts: number
  /** Time window in milliseconds */
  windowMs: number
  /** Cleanup interval in milliseconds */
  cleanupIntervalMs: number
}

/**
 * Default configuration per Requirement 7.4
 */
const DEFAULT_CONFIG: RateLimiterConfig = {
  maxAttempts: 5,
  windowMs: 60000, // 1 minute
  cleanupIntervalMs: 5 * 60000, // 5 minutes
}

/**
 * Server-side rate limiter for UUID authentication
 *
 * Tracks failed login attempts by IP address and enforces limits
 * to prevent brute force attacks. Uses in-memory storage suitable
 * for single-instance deployments.
 *
 * For multi-instance/serverless deployments, consider using:
 * - Redis (via @upstash/redis)
 * - Cloudflare KV (for edge workers)
 * - Database-backed rate limiting
 *
 * @example
 * const rateLimiter = new RateLimiter()
 *
 * // Check if request is allowed
 * const result = rateLimiter.check('192.168.1.1')
 * if (!result.allowed) {
 *   return Response.json({ error: 'Rate limit exceeded' }, {
 *     status: 429,
 *     headers: { 'Retry-After': result.retryAfter.toString() }
 *   })
 * }
 *
 * // Record failed attempt
 * if (authFailed) {
 *   rateLimiter.record('192.168.1.1')
 * }
 */
export class RateLimiter {
  private attempts = new Map<string, RateLimitEntry>()
  private cleanupTimer: NodeJS.Timeout | null = null
  private readonly config: RateLimiterConfig

  /**
   * Creates a new rate limiter instance
   *
   * @param config - Optional configuration overrides
   */
  constructor(config: Partial<RateLimiterConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config }

    // Start automatic cleanup
    this.startCleanup()
  }

  /**
   * Checks if a request from the given IP is allowed
   *
   * This method is idempotent - it only reads state and doesn't
   * modify the rate limit counter. Call record() to increment.
   *
   * @param ip - Client IP address
   * @returns Rate limit result with allowed status and metadata
   *
   * @example
   * const result = rateLimiter.check('192.168.1.1')
   * console.log(`Allowed: ${result.allowed}, Remaining: ${result.remaining}`)
   */
  check(ip: string): RateLimitResult {
    const now = Date.now()
    const entry = this.attempts.get(ip)

    // Clean up expired entry
    if (entry && now > entry.resetAt) {
      this.attempts.delete(ip)
    }

    // Get current entry (may be undefined after cleanup)
    const current = this.attempts.get(ip)

    if (!current) {
      // No attempts yet - allow request
      const resetAt = now + this.config.windowMs
      return {
        allowed: true,
        remaining: this.config.maxAttempts,
        resetAt,
        retryAfter: 0,
      }
    }

    // Calculate remaining attempts
    const remaining = Math.max(0, this.config.maxAttempts - current.count)
    const retryAfter = Math.ceil((current.resetAt - now) / 1000)

    return {
      allowed: current.count < this.config.maxAttempts,
      remaining,
      resetAt: current.resetAt,
      retryAfter: Math.max(0, retryAfter),
    }
  }

  /**
   * Records a failed authentication attempt for the given IP
   *
   * Only call this for FAILED attempts. Successful authentications
   * should not be counted to avoid penalizing legitimate users.
   *
   * @param ip - Client IP address
   *
   * @example
   * const authResult = await authenticate(uuid)
   * if (!authResult.success) {
   *   rateLimiter.record(clientIp)
   * }
   */
  record(ip: string): void {
    const now = Date.now()
    const entry = this.attempts.get(ip)

    // Check if entry exists and is still valid
    if (!entry || now > entry.resetAt) {
      // Create new entry
      this.attempts.set(ip, {
        count: 1,
        resetAt: now + this.config.windowMs,
      })
    } else {
      // Increment existing entry
      entry.count++
    }
  }

  /**
   * Manually resets rate limit for a specific IP
   *
   * Useful for testing or administrative purposes.
   * Not typically needed in production code.
   *
   * @param ip - Client IP address to reset
   */
  reset(ip: string): void {
    this.attempts.delete(ip)
  }

  /**
   * Cleans up expired rate limit entries
   *
   * Automatically called on interval, but can be called manually
   * for testing or to force cleanup.
   */
  cleanup(): void {
    const now = Date.now()
    for (const [ip, entry] of this.attempts.entries()) {
      if (now > entry.resetAt) {
        this.attempts.delete(ip)
      }
    }
  }

  /**
   * Gets current statistics (for monitoring/debugging)
   *
   * @returns Object with active IPs count
   */
  getStats(): { activeIps: number } {
    return {
      activeIps: this.attempts.size,
    }
  }

  /**
   * Starts automatic cleanup timer
   */
  private startCleanup(): void {
    // Clear existing timer if any
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer)
    }

    // Set up new cleanup interval
    this.cleanupTimer = setInterval(() => {
      this.cleanup()
    }, this.config.cleanupIntervalMs)

    // Ensure timer doesn't prevent Node.js from exiting
    if (this.cleanupTimer.unref) {
      this.cleanupTimer.unref()
    }
  }

  /**
   * Stops automatic cleanup timer
   *
   * Call this when shutting down the server to prevent memory leaks.
   */
  destroy(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer)
      this.cleanupTimer = null
    }
    this.attempts.clear()
  }
}

/**
 * Singleton instance for use across the application
 *
 * Use this default instance for standard rate limiting.
 * Create a new RateLimiter() instance only if you need
 * custom configuration.
 */
export const rateLimiter = new RateLimiter()
