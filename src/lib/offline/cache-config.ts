/**
 * Cache Configuration and Version Management
 *
 * Defines cache version and configuration for service worker.
 * Increment CACHE_VERSION to invalidate all caches on deployment.
 */

import type { CacheConfig } from './types'

/**
 * Cache version - increment this number to invalidate all caches
 *
 * When to increment:
 * - Major code changes requiring cache refresh
 * - Breaking changes to cached data structures
 * - Security updates requiring cache invalidation
 *
 * The version is embedded in cache names, so old caches are automatically
 * cleaned up when the version changes.
 */
export const CACHE_VERSION = 1

/**
 * Cache configuration for service worker
 *
 * Defines named cache buckets and their purposes:
 * - static: Static assets (HTML, CSS, JS, fonts) - long-lived
 * - templates: Exercise templates - medium-lived, stale-while-revalidate
 * - runtime: Dynamic content - short-lived, LRU eviction
 */
export const CACHE_CONFIG: CacheConfig = {
  version: CACHE_VERSION,
  caches: {
    static: `math-v${CACHE_VERSION}-static`,
    templates: `math-v${CACHE_VERSION}-templates`,
    runtime: `math-v${CACHE_VERSION}-runtime`,
  },
  precacheAssets: [
    // Core HTML pages
    '/',
    '/dashboard',
    '/settings',
    
    // Note: Specific asset paths will be added by build-time manifest generation
    // This is a minimal fallback list for critical pages
  ],
}

/**
 * Runtime cache configuration
 */
export const RUNTIME_CACHE_CONFIG = {
  /** Maximum number of entries in runtime cache */
  maxEntries: 50,
  /** Maximum age of runtime cache entries (in seconds) */
  maxAgeSeconds: 60 * 60 * 24, // 24 hours
}

/**
 * URL patterns for cache strategy routing
 */
export const CACHE_PATTERNS = {
  /** Static assets (JS, CSS, fonts, images) */
  static: /\.(js|css|woff2?|ttf|otf|eot|svg|png|jpg|jpeg|gif|webp|avif|ico)$/,
  
  /** API endpoints (Supabase) */
  api: /\/api\//,
  
  /** Exercise template files/modules */
  templates: /\/templates\//,
  
  /** HTML pages */
  html: /\.html$|\/[^.]*$/,
}

/**
 * Get all cache names for this version
 */
export function getCacheNames(): string[] {
  return Object.values(CACHE_CONFIG.caches)
}

/**
 * Check if a cache name belongs to the current version
 */
export function isCurrentCache(cacheName: string): boolean {
  return getCacheNames().includes(cacheName)
}

/**
 * Get cache version identifier
 */
export function getCacheVersion(): number {
  return CACHE_VERSION
}

/**
 * Get cache name for a specific cache type
 */
export function getCacheName(type: keyof CacheConfig['caches']): string {
  return CACHE_CONFIG.caches[type]
}

