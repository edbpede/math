/**
 * Cache Utility Functions
 *
 * Helper functions for service worker cache operations including
 * versioning, pre-caching, and cache cleanup.
 */

import { CACHE_CONFIG, isCurrentCache, RUNTIME_CACHE_CONFIG } from './cache-config'
import type { CacheStrategy } from './types'

/**
 * Get the current cache version
 */
export function getCacheVersion(): number {
  return CACHE_CONFIG.version
}

/**
 * Clear all caches that don't match the current version
 *
 * Called during service worker activation to clean up old caches.
 * Removes stale caches from previous versions.
 */
export async function clearOldCaches(): Promise<string[]> {
  const cacheNames = await caches.keys()
  const cachesToDelete = cacheNames.filter((name) => {
    // Keep caches that match current version
    if (isCurrentCache(name)) {
      return false
    }
    // Delete caches with "math-" prefix from old versions
    return name.startsWith('math-')
  })

  await Promise.all(cachesToDelete.map((name) => caches.delete(name)))
  return cachesToDelete
}

/**
 * Pre-cache a list of assets
 *
 * Opens the static cache and adds all provided URLs.
 * Fails fast if any asset cannot be cached.
 */
export async function precacheAssets(assetList: string[]): Promise<void> {
  const cache = await caches.open(CACHE_CONFIG.caches.static)
  await cache.addAll(assetList)
}

/**
 * Add a request/response pair to a specific cache
 *
 * Used for runtime caching of dynamic content.
 */
export async function addToCache(
  cacheName: string,
  request: Request | string,
  response: Response
): Promise<void> {
  // Only cache successful responses
  if (!response || response.status !== 200 || response.type === 'error') {
    return
  }

  const cache = await caches.open(cacheName)
  await cache.put(request, response.clone())
}

/**
 * Get a cached response for a request
 *
 * Searches all caches for a matching request.
 */
export async function getCachedResponse(
  request: Request | string
): Promise<Response | undefined> {
  return await caches.match(request)
}

/**
 * Implement cache-first strategy
 *
 * Returns cached response if available, otherwise fetches from network.
 * Network response is cached for future use.
 */
export async function cacheFirst(
  request: Request,
  cacheName: string
): Promise<Response> {
  const cached = await caches.match(request)
  if (cached) {
    return cached
  }

  const response = await fetch(request)
  await addToCache(cacheName, request, response)
  return response
}

/**
 * Implement network-first strategy
 *
 * Attempts network request first, falls back to cache on failure.
 * Successful network responses update the cache.
 */
export async function networkFirst(
  request: Request,
  cacheName: string
): Promise<Response> {
  try {
    const response = await fetch(request)
    await addToCache(cacheName, request, response)
    return response
  } catch (error) {
    const cached = await caches.match(request)
    if (cached) {
      return cached
    }
    throw error
  }
}

/**
 * Implement stale-while-revalidate strategy
 *
 * Returns cached response immediately, then fetches fresh data in background
 * to update cache for next request.
 */
export async function staleWhileRevalidate(
  request: Request,
  cacheName: string
): Promise<Response> {
  const cached = await caches.match(request)

  // Fetch fresh response in parallel
  const fetchPromise = fetch(request).then(async (response) => {
    await addToCache(cacheName, request, response)
    return response
  })

  // Return cached response immediately if available
  return cached || fetchPromise
}

/**
 * Clean up runtime cache to maintain size limits
 *
 * Implements LRU (Least Recently Used) eviction by removing
 * oldest entries when cache exceeds maxEntries.
 */
export async function cleanupRuntimeCache(): Promise<void> {
  const cache = await caches.open(CACHE_CONFIG.caches.runtime)
  const requests = await cache.keys()

  if (requests.length > RUNTIME_CACHE_CONFIG.maxEntries) {
    const deleteCount = requests.length - RUNTIME_CACHE_CONFIG.maxEntries
    // Delete oldest entries (first N items)
    for (let i = 0; i < deleteCount; i++) {
      await cache.delete(requests[i])
    }
  }
}

/**
 * Check if a URL should be cached based on its pattern
 */
export function shouldCache(url: string): boolean {
  try {
    const urlObj = new URL(url)
    
    // Don't cache external resources
    if (urlObj.origin !== self.location.origin) {
      return false
    }

    // Don't cache API calls (handled separately)
    if (urlObj.pathname.startsWith('/api/')) {
      return false
    }

    return true
  } catch {
    return false
  }
}

/**
 * Determine appropriate cache strategy for a request
 */
export function getCacheStrategy(request: Request): CacheStrategy {
  const url = new URL(request.url)

  // API calls: network-first (fresh data preferred)
  if (url.pathname.startsWith('/api/')) {
    return 'network-first'
  }

  // Exercise templates: stale-while-revalidate (balance speed and freshness)
  if (url.pathname.includes('/templates/')) {
    return 'stale-while-revalidate'
  }

  // Static assets: cache-first (immutable content)
  if (/\.(js|css|woff2?|ttf|otf|eot|svg|png|jpg|jpeg|gif|webp|avif|ico)$/.test(url.pathname)) {
    return 'cache-first'
  }

  // HTML pages: network-first (ensure fresh content)
  return 'network-first'
}

