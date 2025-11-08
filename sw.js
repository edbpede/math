/**
 * Service Worker for Arithmetic Practice Portal
 *
 * Implements offline functionality through intelligent caching strategies:
 * - Cache-first for static assets (HTML, CSS, JS, fonts)
 * - Network-first for API calls (ensures fresh data when online)
 * - Stale-while-revalidate for exercise templates (balance speed and freshness)
 *
 * Cache versioning ensures clean updates when new versions are deployed.
 */

// Cache version - must match src/lib/offline/cache-config.ts
const CACHE_VERSION = 1

// Cache names
const CACHE_STATIC = `math-v${CACHE_VERSION}-static`
const CACHE_TEMPLATES = `math-v${CACHE_VERSION}-templates`
const CACHE_RUNTIME = `math-v${CACHE_VERSION}-runtime`

// Runtime cache limits
const RUNTIME_CACHE_MAX_ENTRIES = 50

// Critical assets to pre-cache on install
const PRECACHE_ASSETS = [
  '/',
  '/dashboard',
  '/settings',
  '/favicon.svg',
]

/**
 * Install Event
 *
 * Pre-caches critical assets for offline availability.
 * The service worker won't activate until all assets are cached.
 */
self.addEventListener('install', (event) => {
  console.log('[SW] Installing service worker...')
  
  event.waitUntil(
    (async () => {
      try {
        // Open static cache
        const cache = await caches.open(CACHE_STATIC)
        
        // Add critical assets
        await cache.addAll(PRECACHE_ASSETS)
        
        console.log('[SW] Pre-cached critical assets:', PRECACHE_ASSETS.length)
        
        // Skip waiting to activate immediately
        await self.skipWaiting()
      } catch (error) {
        console.error('[SW] Pre-caching failed:', error)
        throw error
      }
    })()
  )
})

/**
 * Activate Event
 *
 * Cleans up old caches from previous versions.
 * Takes control of all clients immediately.
 */
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating service worker...')
  
  event.waitUntil(
    (async () => {
      try {
        // Get all cache names
        const cacheNames = await caches.keys()
        
        // Current version caches
        const currentCaches = [CACHE_STATIC, CACHE_TEMPLATES, CACHE_RUNTIME]
        
        // Delete old caches
        const cachesToDelete = cacheNames.filter(
          (name) => name.startsWith('math-') && !currentCaches.includes(name)
        )
        
        await Promise.all(cachesToDelete.map((name) => caches.delete(name)))
        
        if (cachesToDelete.length > 0) {
          console.log('[SW] Deleted old caches:', cachesToDelete)
        }
        
        // Take control of all clients immediately
        await self.clients.claim()
        
        console.log('[SW] Service worker activated')
      } catch (error) {
        console.error('[SW] Activation failed:', error)
      }
    })()
  )
})

/**
 * Fetch Event
 *
 * Intercepts network requests and applies appropriate caching strategy
 * based on the request URL and type.
 */
self.addEventListener('fetch', (event) => {
  const { request } = event
  const url = new URL(request.url)
  
  // Only handle same-origin requests
  if (url.origin !== self.location.origin) {
    return
  }
  
  // Determine caching strategy based on URL
  event.respondWith(handleFetch(request))
})

/**
 * Handle fetch request with appropriate caching strategy
 */
async function handleFetch(request) {
  const url = new URL(request.url)
  
  try {
    // API calls: network-first (fresh data preferred)
    if (url.pathname.startsWith('/api/')) {
      return await networkFirst(request, CACHE_RUNTIME)
    }
    
    // Exercise templates: stale-while-revalidate
    if (url.pathname.includes('/templates/')) {
      return await staleWhileRevalidate(request, CACHE_TEMPLATES)
    }
    
    // Static assets: cache-first
    if (isStaticAsset(url.pathname)) {
      return await cacheFirst(request, CACHE_STATIC)
    }
    
    // HTML pages: network-first with cache fallback
    if (request.mode === 'navigate' || isHtmlRequest(request)) {
      return await networkFirst(request, CACHE_RUNTIME)
    }
    
    // Default: network-first
    return await networkFirst(request, CACHE_RUNTIME)
  } catch (error) {
    console.error('[SW] Fetch failed:', url.pathname, error)
    
    // Try to return cached response as last resort
    const cached = await caches.match(request)
    if (cached) {
      return cached
    }
    
    // Return offline page or error response
    return new Response('Offline - content not cached', {
      status: 503,
      statusText: 'Service Unavailable',
    })
  }
}

/**
 * Cache-first strategy
 *
 * Returns cached response if available, otherwise fetches from network.
 */
async function cacheFirst(request, cacheName) {
  const cached = await caches.match(request)
  if (cached) {
    return cached
  }
  
  const response = await fetch(request)
  await addToCache(cacheName, request, response)
  return response
}

/**
 * Network-first strategy
 *
 * Attempts network request first, falls back to cache on failure.
 */
async function networkFirst(request, cacheName) {
  try {
    const response = await fetch(request)
    
    // Only cache successful responses
    if (response && response.status === 200) {
      await addToCache(cacheName, request, response)
    }
    
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
 * Stale-while-revalidate strategy
 *
 * Returns cached response immediately, fetches fresh data in background.
 */
async function staleWhileRevalidate(request, cacheName) {
  const cached = await caches.match(request)
  
  // Fetch fresh response in background (don't await)
  const fetchPromise = fetch(request).then(async (response) => {
    if (response && response.status === 200) {
      await addToCache(cacheName, request, response)
    }
    return response
  }).catch((error) => {
    console.warn('[SW] Background fetch failed:', request.url, error)
  })
  
  // Return cached response immediately if available
  return cached || fetchPromise
}

/**
 * Add response to cache
 *
 * Only caches successful responses.
 */
async function addToCache(cacheName, request, response) {
  // Don't cache error responses
  if (!response || response.status !== 200 || response.type === 'error') {
    return
  }
  
  const cache = await caches.open(cacheName)
  await cache.put(request, response.clone())
  
  // Clean up runtime cache if needed
  if (cacheName === CACHE_RUNTIME) {
    await cleanupRuntimeCache()
  }
}

/**
 * Clean up runtime cache to maintain size limits
 */
async function cleanupRuntimeCache() {
  try {
    const cache = await caches.open(CACHE_RUNTIME)
    const requests = await cache.keys()
    
    if (requests.length > RUNTIME_CACHE_MAX_ENTRIES) {
      const deleteCount = requests.length - RUNTIME_CACHE_MAX_ENTRIES
      // Delete oldest entries
      for (let i = 0; i < deleteCount; i++) {
        await cache.delete(requests[i])
      }
    }
  } catch (error) {
    console.error('[SW] Cache cleanup failed:', error)
  }
}

/**
 * Check if URL is a static asset
 */
function isStaticAsset(pathname) {
  return /\.(js|css|woff2?|ttf|otf|eot|svg|png|jpg|jpeg|gif|webp|avif|ico)$/.test(pathname)
}

/**
 * Check if request is for HTML content
 */
function isHtmlRequest(request) {
  const accept = request.headers.get('Accept') || ''
  return accept.includes('text/html')
}

/**
 * Message handler for communication with the app
 */
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting()
  }
})

console.log('[SW] Service worker loaded, version:', CACHE_VERSION)

