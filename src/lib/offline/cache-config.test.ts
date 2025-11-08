/**
 * Tests for cache configuration
 */

import { describe, it, expect } from 'vitest'
import {
  CACHE_VERSION,
  CACHE_CONFIG,
  getCacheNames,
  isCurrentCache,
  getCacheVersion,
  getCacheName,
} from './cache-config'

describe('cache-config', () => {
  describe('CACHE_VERSION', () => {
    it('should be a positive number', () => {
      expect(CACHE_VERSION).toBeGreaterThan(0)
      expect(typeof CACHE_VERSION).toBe('number')
    })
  })

  describe('CACHE_CONFIG', () => {
    it('should have version property', () => {
      expect(CACHE_CONFIG.version).toBe(CACHE_VERSION)
    })

    it('should have caches object with required keys', () => {
      expect(CACHE_CONFIG.caches).toBeDefined()
      expect(CACHE_CONFIG.caches.static).toBeDefined()
      expect(CACHE_CONFIG.caches.templates).toBeDefined()
      expect(CACHE_CONFIG.caches.runtime).toBeDefined()
    })

    it('should have cache names that include version', () => {
      expect(CACHE_CONFIG.caches.static).toContain(`v${CACHE_VERSION}`)
      expect(CACHE_CONFIG.caches.templates).toContain(`v${CACHE_VERSION}`)
      expect(CACHE_CONFIG.caches.runtime).toContain(`v${CACHE_VERSION}`)
    })

    it('should have cache names with math- prefix', () => {
      expect(CACHE_CONFIG.caches.static).toMatch(/^math-/)
      expect(CACHE_CONFIG.caches.templates).toMatch(/^math-/)
      expect(CACHE_CONFIG.caches.runtime).toMatch(/^math-/)
    })

    it('should have precacheAssets array', () => {
      expect(Array.isArray(CACHE_CONFIG.precacheAssets)).toBe(true)
      expect(CACHE_CONFIG.precacheAssets.length).toBeGreaterThan(0)
    })

    it('should include critical pages in precacheAssets', () => {
      expect(CACHE_CONFIG.precacheAssets).toContain('/')
      expect(CACHE_CONFIG.precacheAssets).toContain('/dashboard')
      expect(CACHE_CONFIG.precacheAssets).toContain('/settings')
    })
  })

  describe('getCacheNames', () => {
    it('should return array of all cache names', () => {
      const names = getCacheNames()
      expect(Array.isArray(names)).toBe(true)
      expect(names.length).toBe(3)
    })

    it('should return current version cache names', () => {
      const names = getCacheNames()
      expect(names).toContain(CACHE_CONFIG.caches.static)
      expect(names).toContain(CACHE_CONFIG.caches.templates)
      expect(names).toContain(CACHE_CONFIG.caches.runtime)
    })
  })

  describe('isCurrentCache', () => {
    it('should return true for current version caches', () => {
      expect(isCurrentCache(CACHE_CONFIG.caches.static)).toBe(true)
      expect(isCurrentCache(CACHE_CONFIG.caches.templates)).toBe(true)
      expect(isCurrentCache(CACHE_CONFIG.caches.runtime)).toBe(true)
    })

    it('should return false for old version caches', () => {
      expect(isCurrentCache('math-v0-static')).toBe(false)
      expect(isCurrentCache('math-v999-templates')).toBe(false)
      expect(isCurrentCache('some-other-cache')).toBe(false)
    })
  })

  describe('getCacheVersion', () => {
    it('should return current cache version', () => {
      expect(getCacheVersion()).toBe(CACHE_VERSION)
    })
  })

  describe('getCacheName', () => {
    it('should return correct cache name for each type', () => {
      expect(getCacheName('static')).toBe(CACHE_CONFIG.caches.static)
      expect(getCacheName('templates')).toBe(CACHE_CONFIG.caches.templates)
      expect(getCacheName('runtime')).toBe(CACHE_CONFIG.caches.runtime)
    })
  })
})

