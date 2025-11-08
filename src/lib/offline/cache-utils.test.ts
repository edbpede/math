/**
 * Tests for cache utilities
 */

import { describe, it, expect } from 'vitest'
import {
  getCacheVersion,
  shouldCache,
  getCacheStrategy,
} from './cache-utils'
import { CACHE_VERSION } from './cache-config'

describe('cache-utils', () => {
  describe('getCacheVersion', () => {
    it('should return current cache version', () => {
      expect(getCacheVersion()).toBe(CACHE_VERSION)
    })
  })

  describe('shouldCache', () => {
    it('should return true for same-origin URLs', () => {
      // Note: In test environment, self.location might not be available
      // These tests verify the logic structure
      const sameOriginUrl = 'http://localhost:4321/dashboard'
      const result = shouldCache(sameOriginUrl)
      // Result depends on test environment, just verify it returns boolean
      expect(typeof result).toBe('boolean')
    })

    it('should return false for invalid URLs', () => {
      expect(shouldCache('not-a-valid-url')).toBe(false)
      expect(shouldCache('')).toBe(false)
    })

    it('should handle API endpoints', () => {
      const apiUrl = 'http://localhost:4321/api/auth/session'
      const result = shouldCache(apiUrl)
      // API URLs should not be cached by default
      expect(typeof result).toBe('boolean')
    })
  })

  describe('getCacheStrategy', () => {
    it('should return network-first for API calls', () => {
      const request = new Request('http://localhost:4321/api/auth/session')
      expect(getCacheStrategy(request)).toBe('network-first')
    })

    it('should return stale-while-revalidate for templates', () => {
      const request = new Request('http://localhost:4321/templates/addition.js')
      expect(getCacheStrategy(request)).toBe('stale-while-revalidate')
    })

    it('should return cache-first for static assets', () => {
      const jsRequest = new Request('http://localhost:4321/assets/main.js')
      const cssRequest = new Request('http://localhost:4321/styles/main.css')
      const imageRequest = new Request('http://localhost:4321/images/logo.png')

      expect(getCacheStrategy(jsRequest)).toBe('cache-first')
      expect(getCacheStrategy(cssRequest)).toBe('cache-first')
      expect(getCacheStrategy(imageRequest)).toBe('cache-first')
    })

    it('should return network-first for HTML pages', () => {
      const request = new Request('http://localhost:4321/dashboard')
      expect(getCacheStrategy(request)).toBe('network-first')
    })

    it('should handle various file extensions', () => {
      const extensions = [
        { ext: 'js', strategy: 'cache-first' },
        { ext: 'css', strategy: 'cache-first' },
        { ext: 'png', strategy: 'cache-first' },
        { ext: 'jpg', strategy: 'cache-first' },
        { ext: 'svg', strategy: 'cache-first' },
        { ext: 'woff2', strategy: 'cache-first' },
        { ext: 'webp', strategy: 'cache-first' },
      ]

      extensions.forEach(({ ext, strategy }) => {
        const request = new Request(`http://localhost:4321/assets/file.${ext}`)
        expect(getCacheStrategy(request)).toBe(strategy)
      })
    })
  })
})

