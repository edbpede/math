/**
 * Uninstall Service Worker
 *
 * Client-side utility function to programmatically unregister service workers
 * and clear all caches. Useful for development, debugging, or providing users
 * with a "clear data" option.
 */

/**
 * Unregister all service workers and clear all caches
 *
 * This is a destructive operation that removes all offline capabilities
 * and cached data. Use with caution.
 *
 * @returns Promise that resolves when cleanup is complete
 */
export async function uninstallServiceWorker(): Promise<void> {
  if (!('serviceWorker' in navigator)) {
    console.log('[Uninstall SW] Service workers not supported')
    return
  }

  try {
    console.log('[Uninstall SW] Starting cleanup...')

    // Get all registrations
    const registrations = await navigator.serviceWorker.getRegistrations()
    console.log(`[Uninstall SW] Found ${registrations.length} registration(s)`)

    // Unregister each service worker
    await Promise.all(
      registrations.map(async (registration) => {
        const success = await registration.unregister()
        console.log(
          `[Uninstall SW] ${success ? 'Unregistered' : 'Failed to unregister'} service worker`
        )
        return success
      })
    )

    // Clear all caches
    const cacheNames = await caches.keys()
    console.log(`[Uninstall SW] Found ${cacheNames.length} cache(s)`)

    await Promise.all(
      cacheNames.map(async (name) => {
        const success = await caches.delete(name)
        console.log(`[Uninstall SW] ${success ? 'Deleted' : 'Failed to delete'} cache: ${name}`)
        return success
      })
    )

    console.log('[Uninstall SW] Cleanup complete')
    console.log('[Uninstall SW] Reload the page to complete the process')
  } catch (error) {
    console.error('[Uninstall SW] Cleanup failed:', error)
    throw error
  }
}

/**
 * Check if any service workers are registered
 */
export async function hasServiceWorker(): Promise<boolean> {
  if (!('serviceWorker' in navigator)) {
    return false
  }

  const registrations = await navigator.serviceWorker.getRegistrations()
  return registrations.length > 0
}

/**
 * Get information about registered service workers
 */
export async function getServiceWorkerInfo(): Promise<
  Array<{
    scope: string
    state: string
    scriptURL: string
  }>
> {
  if (!('serviceWorker' in navigator)) {
    return []
  }

  const registrations = await navigator.serviceWorker.getRegistrations()
  return registrations.map((reg) => ({
    scope: reg.scope,
    state: reg.active?.state || reg.installing?.state || reg.waiting?.state || 'unknown',
    scriptURL: reg.active?.scriptURL || reg.installing?.scriptURL || reg.waiting?.scriptURL || '',
  }))
}

/**
 * Get list of all cache names
 */
export async function getCacheNames(): Promise<string[]> {
  return await caches.keys()
}

/**
 * Get total size of all caches (approximate)
 *
 * Note: This is an estimate based on the Cache Storage API.
 * Actual storage usage may vary.
 */
export async function getCacheSizeEstimate(): Promise<number> {
  if (!('storage' in navigator && 'estimate' in navigator.storage)) {
    return 0
  }

  const estimate = await navigator.storage.estimate()
  return estimate.usage || 0
}

