/**
 * Unit tests for RateLimiter
 *
 * Tests the server-side rate limiting implementation for UUID authentication.
 * Verifies that rate limits are enforced correctly, expired entries are cleaned up,
 * and the rate limiter behaves correctly under various scenarios.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { RateLimiter } from './rate-limiter'

describe('RateLimiter', () => {
  let rateLimiter: RateLimiter
  const testIp = '192.168.1.1'

  beforeEach(() => {
    // Create a new rate limiter for each test
    rateLimiter = new RateLimiter()
  })

  afterEach(() => {
    // Clean up the rate limiter
    rateLimiter.destroy()
  })

  describe('check()', () => {
    it('should allow first request from new IP', () => {
      const result = rateLimiter.check(testIp)

      expect(result.allowed).toBe(true)
      expect(result.remaining).toBe(5)
      expect(result.retryAfter).toBe(0)
      expect(result.resetAt).toBeGreaterThan(Date.now())
    })

    it('should allow requests up to the limit', () => {
      // Record 4 failed attempts
      for (let i = 0; i < 4; i++) {
        rateLimiter.record(testIp)
      }

      const result = rateLimiter.check(testIp)

      expect(result.allowed).toBe(true)
      expect(result.remaining).toBe(1)
    })

    it('should block requests at the limit', () => {
      // Record 5 failed attempts
      for (let i = 0; i < 5; i++) {
        rateLimiter.record(testIp)
      }

      const result = rateLimiter.check(testIp)

      expect(result.allowed).toBe(false)
      expect(result.remaining).toBe(0)
      expect(result.retryAfter).toBeGreaterThan(0)
    })

    it('should block requests beyond the limit', () => {
      // Record 6 failed attempts
      for (let i = 0; i < 6; i++) {
        rateLimiter.record(testIp)
      }

      const result = rateLimiter.check(testIp)

      expect(result.allowed).toBe(false)
      expect(result.remaining).toBe(0)
    })

    it('should track different IPs independently', () => {
      const ip1 = '192.168.1.1'
      const ip2 = '192.168.1.2'

      // Max out ip1
      for (let i = 0; i < 5; i++) {
        rateLimiter.record(ip1)
      }

      // Check both IPs
      const result1 = rateLimiter.check(ip1)
      const result2 = rateLimiter.check(ip2)

      expect(result1.allowed).toBe(false)
      expect(result2.allowed).toBe(true)
      expect(result2.remaining).toBe(5)
    })

    it('should be idempotent - multiple checks do not increment counter', () => {
      rateLimiter.record(testIp)

      const result1 = rateLimiter.check(testIp)
      const result2 = rateLimiter.check(testIp)

      expect(result1.remaining).toBe(4)
      expect(result2.remaining).toBe(4)
    })
  })

  describe('record()', () => {
    it('should increment attempt counter', () => {
      rateLimiter.record(testIp)
      const result = rateLimiter.check(testIp)

      expect(result.remaining).toBe(4)
    })

    it('should create new entry for first attempt', () => {
      rateLimiter.record(testIp)
      const result = rateLimiter.check(testIp)

      expect(result.resetAt).toBeGreaterThan(Date.now())
    })

    it('should increment existing entry for subsequent attempts', () => {
      rateLimiter.record(testIp)
      const result1 = rateLimiter.check(testIp)

      rateLimiter.record(testIp)
      const result2 = rateLimiter.check(testIp)

      expect(result2.remaining).toBe(result1.remaining - 1)
    })

    it('should enforce the maximum limit of 5 attempts', () => {
      for (let i = 0; i < 5; i++) {
        rateLimiter.record(testIp)
      }

      const result = rateLimiter.check(testIp)
      expect(result.allowed).toBe(false)
      expect(result.remaining).toBe(0)
    })
  })

  describe('reset()', () => {
    it('should reset rate limit for specific IP', () => {
      // Max out the rate limit
      for (let i = 0; i < 5; i++) {
        rateLimiter.record(testIp)
      }

      expect(rateLimiter.check(testIp).allowed).toBe(false)

      // Reset the IP
      rateLimiter.reset(testIp)

      const result = rateLimiter.check(testIp)
      expect(result.allowed).toBe(true)
      expect(result.remaining).toBe(5)
    })

    it('should only reset the specified IP', () => {
      const ip1 = '192.168.1.1'
      const ip2 = '192.168.1.2'

      // Record attempts for both IPs
      rateLimiter.record(ip1)
      rateLimiter.record(ip2)

      // Reset only ip1
      rateLimiter.reset(ip1)

      expect(rateLimiter.check(ip1).remaining).toBe(5)
      expect(rateLimiter.check(ip2).remaining).toBe(4)
    })
  })

  describe('cleanup()', () => {
    it('should remove expired entries', async () => {
      // Create a rate limiter with very short window for testing
      const shortLimiter = new RateLimiter({ windowMs: 100 })

      try {
        shortLimiter.record(testIp)
        expect(shortLimiter.getStats().activeIps).toBe(1)

        // Wait for entry to expire
        await new Promise((resolve) => setTimeout(resolve, 150))

        // Run cleanup
        shortLimiter.cleanup()

        expect(shortLimiter.getStats().activeIps).toBe(0)
      } finally {
        shortLimiter.destroy()
      }
    })

    it('should not remove non-expired entries', () => {
      rateLimiter.record(testIp)
      expect(rateLimiter.getStats().activeIps).toBe(1)

      rateLimiter.cleanup()

      expect(rateLimiter.getStats().activeIps).toBe(1)
    })

    it('should handle cleanup with no entries', () => {
      expect(() => rateLimiter.cleanup()).not.toThrow()
      expect(rateLimiter.getStats().activeIps).toBe(0)
    })
  })

  describe('time window behavior', () => {
    it('should reset counter after time window expires', async () => {
      // Create a rate limiter with very short window for testing
      const shortLimiter = new RateLimiter({ windowMs: 100 })

      try {
        // Max out the rate limit
        for (let i = 0; i < 5; i++) {
          shortLimiter.record(testIp)
        }

        expect(shortLimiter.check(testIp).allowed).toBe(false)

        // Wait for window to expire
        await new Promise((resolve) => setTimeout(resolve, 150))

        // Should be allowed again
        const result = shortLimiter.check(testIp)
        expect(result.allowed).toBe(true)
        expect(result.remaining).toBe(5)
      } finally {
        shortLimiter.destroy()
      }
    })

    it('should use correct retry-after time', () => {
      // Max out the rate limit
      for (let i = 0; i < 5; i++) {
        rateLimiter.record(testIp)
      }

      const result = rateLimiter.check(testIp)

      // Should be around 60 seconds (allow for some variance due to execution time)
      expect(result.retryAfter).toBeGreaterThan(55)
      expect(result.retryAfter).toBeLessThanOrEqual(60)
    })
  })

  describe('getStats()', () => {
    it('should return correct number of active IPs', () => {
      expect(rateLimiter.getStats().activeIps).toBe(0)

      rateLimiter.record('192.168.1.1')
      expect(rateLimiter.getStats().activeIps).toBe(1)

      rateLimiter.record('192.168.1.2')
      expect(rateLimiter.getStats().activeIps).toBe(2)

      rateLimiter.record('192.168.1.1') // Same IP
      expect(rateLimiter.getStats().activeIps).toBe(2)
    })
  })

  describe('destroy()', () => {
    it('should clear all entries', () => {
      rateLimiter.record('192.168.1.1')
      rateLimiter.record('192.168.1.2')

      expect(rateLimiter.getStats().activeIps).toBe(2)

      rateLimiter.destroy()

      expect(rateLimiter.getStats().activeIps).toBe(0)
    })

    it('should allow reuse after destroy', () => {
      rateLimiter.record(testIp)
      rateLimiter.destroy()

      const result = rateLimiter.check(testIp)
      expect(result.allowed).toBe(true)
      expect(result.remaining).toBe(5)
    })
  })

  describe('custom configuration', () => {
    it('should respect custom maxAttempts', () => {
      const customLimiter = new RateLimiter({ maxAttempts: 3 })

      try {
        for (let i = 0; i < 3; i++) {
          customLimiter.record(testIp)
        }

        const result = customLimiter.check(testIp)
        expect(result.allowed).toBe(false)
        expect(result.remaining).toBe(0)
      } finally {
        customLimiter.destroy()
      }
    })

    it('should respect custom windowMs', async () => {
      const customLimiter = new RateLimiter({ windowMs: 50 })

      try {
        customLimiter.record(testIp)
        expect(customLimiter.check(testIp).remaining).toBe(4)

        // Wait for window to expire
        await new Promise((resolve) => setTimeout(resolve, 100))

        expect(customLimiter.check(testIp).remaining).toBe(5)
      } finally {
        customLimiter.destroy()
      }
    })
  })

  describe('edge cases', () => {
    it('should handle empty IP string', () => {
      const result = rateLimiter.check('')
      expect(result.allowed).toBe(true)
    })

    it('should handle "unknown" IP', () => {
      const result = rateLimiter.check('unknown')
      expect(result.allowed).toBe(true)

      rateLimiter.record('unknown')
      expect(rateLimiter.check('unknown').remaining).toBe(4)
    })

    it('should handle IPv6 addresses', () => {
      const ipv6 = '2001:0db8:85a3:0000:0000:8a2e:0370:7334'
      rateLimiter.record(ipv6)

      const result = rateLimiter.check(ipv6)
      expect(result.remaining).toBe(4)
    })

    it('should handle x-forwarded-for format (comma-separated IPs)', () => {
      const forwardedIp = '203.0.113.1'
      rateLimiter.record(forwardedIp)

      const result = rateLimiter.check(forwardedIp)
      expect(result.remaining).toBe(4)
    })
  })
})
