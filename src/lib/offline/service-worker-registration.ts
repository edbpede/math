/**
 * Service Worker Registration
 *
 * Handles registration, updates, and lifecycle management of the service worker.
 * Provides reactive state through Nanostores for UI integration.
 */

import { atom } from 'nanostores'
import type { ServiceWorkerStatus } from './types'

/**
 * Service worker registration status store
 *
 * Reactive store that components can subscribe to for UI updates.
 */
export const $swStatus = atom<ServiceWorkerStatus>({
  registered: false,
  installing: false,
  waiting: false,
  active: false,
})

/**
 * Service worker registration instance
 *
 * Set after successful registration, used for lifecycle management.
 */
let registration: ServiceWorkerRegistration | null = null

/**
 * Register the service worker
 *
 * Call this once on app initialization (typically in main layout).
 * Skips registration in development mode to avoid caching issues.
 *
 * @returns Promise that resolves to registration or null if not supported/skipped
 */
export async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  // Check if service workers are supported
  if (!('serviceWorker' in navigator)) {
    console.log('[SW Registration] Service workers not supported')
    $swStatus.set({
      registered: false,
      installing: false,
      waiting: false,
      active: false,
      error: 'Service workers not supported in this browser',
    })
    return null
  }

  // Skip registration in development mode
  if (import.meta.env.DEV) {
    console.log('[SW Registration] Skipped in development mode')
    return null
  }

  try {
    // Wait for page load to avoid competing with other resources
    if (document.readyState === 'loading') {
      await new Promise<void>((resolve) => {
        window.addEventListener('load', () => resolve(), { once: true })
      })
    }

    // Register service worker
    console.log('[SW Registration] Registering service worker...')
    registration = await navigator.serviceWorker.register('/sw.js', {
      scope: '/',
    })

    console.log('[SW Registration] Service worker registered successfully')

    // Update status
    updateStatus(registration)

    // Listen for updates
    registration.addEventListener('updatefound', () => {
      console.log('[SW Registration] Update found, installing new version...')
      handleUpdateFound(registration!)
    })

    // Listen for controller changes (new SW activated)
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      console.log('[SW Registration] Controller changed, reloading page...')
      // New service worker activated, reload to get fresh content
      window.location.reload()
    })

    // Check for updates periodically (every hour)
    setInterval(() => {
      if (registration) {
        registration.update().catch((error) => {
          console.error('[SW Registration] Update check failed:', error)
        })
      }
    }, 60 * 60 * 1000) // 1 hour

    return registration
  } catch (error) {
    console.error('[SW Registration] Registration failed:', error)
    $swStatus.set({
      registered: false,
      installing: false,
      waiting: false,
      active: false,
      error: error instanceof Error ? error.message : 'Registration failed',
    })
    return null
  }
}

/**
 * Unregister the service worker
 *
 * Useful for development/debugging. Removes service worker and clears all caches.
 */
export async function unregisterServiceWorker(): Promise<void> {
  if (!('serviceWorker' in navigator)) {
    return
  }

  try {
    const registrations = await navigator.serviceWorker.getRegistrations()
    await Promise.all(registrations.map((reg) => reg.unregister()))

    // Clear all caches
    const cacheNames = await caches.keys()
    await Promise.all(cacheNames.map((name) => caches.delete(name)))

    console.log('[SW Registration] Service worker unregistered and caches cleared')

    // Reset status
    $swStatus.set({
      registered: false,
      installing: false,
      waiting: false,
      active: false,
    })
  } catch (error) {
    console.error('[SW Registration] Unregistration failed:', error)
  }
}

/**
 * Update service worker registration status
 */
function updateStatus(reg: ServiceWorkerRegistration): void {
  $swStatus.set({
    registered: true,
    installing: !!reg.installing,
    waiting: !!reg.waiting,
    active: !!reg.active,
  })
}

/**
 * Handle service worker update found
 */
function handleUpdateFound(reg: ServiceWorkerRegistration): void {
  const newWorker = reg.installing
  if (!newWorker) return

  updateStatus(reg)

  newWorker.addEventListener('statechange', () => {
    console.log('[SW Registration] State changed:', newWorker.state)

    if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
      // New version installed and waiting to activate
      console.log('[SW Registration] New version available, waiting to activate')
      updateStatus(reg)

      // Notify user that an update is available
      notifyUpdateAvailable()
    }

    if (newWorker.state === 'activated') {
      console.log('[SW Registration] New version activated')
      updateStatus(reg)
    }
  })
}

/**
 * Notify user that an update is available
 *
 * In a production app, this would show a toast/banner prompting user to refresh.
 * For now, we just log it.
 */
function notifyUpdateAvailable(): void {
  console.log('[SW Registration] New version ready - refresh to update')

  // Dispatch custom event that UI components can listen to
  window.dispatchEvent(
    new CustomEvent('sw-update-available', {
      detail: { message: 'A new version is available. Refresh to update.' },
    })
  )
}

/**
 * Skip waiting and activate new service worker immediately
 *
 * Call this when user confirms they want to update.
 */
export function skipWaitingAndUpdate(): void {
  if (registration?.waiting) {
    registration.waiting.postMessage({ type: 'SKIP_WAITING' })
  }
}

/**
 * Check if service worker is supported
 */
export function isServiceWorkerSupported(): boolean {
  return 'serviceWorker' in navigator
}

/**
 * Get current service worker registration
 */
export function getRegistration(): ServiceWorkerRegistration | null {
  return registration
}

