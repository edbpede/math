/**
 * Screen Reader Announcer Utility
 *
 * Provides a service for making screen reader announcements using ARIA live regions.
 * Manages a queue of announcements with priority and timing controls.
 *
 * Requirements:
 * - 9.1: Screen reader support with ARIA labels and live regions
 *
 * @example
 * ```tsx
 * import { createAnnouncer } from '@/lib/accessibility/announcer'
 *
 * const MyComponent = () => {
 *   const announcer = createAnnouncer()
 *
 *   const handleSuccess = () => {
 *     announcer.announce('Exercise completed successfully!', { priority: 'assertive' })
 *   }
 *
 *   onCleanup(() => announcer.destroy())
 * }
 * ```
 */

import { onCleanup } from 'solid-js'
import type { Announcer, AnnouncementOptions } from './types'

/**
 * Announcement queue item
 */
interface QueuedAnnouncement {
  message: string
  priority: 'polite' | 'assertive'
  timestamp: number
}

/**
 * Create a screen reader announcer
 *
 * Creates two live regions (polite and assertive) for announcements.
 * Announcements are queued and processed with appropriate timing.
 *
 * @returns Announcer object
 */
export function createAnnouncer(): Announcer {
  if (typeof document === 'undefined') {
    // SSR fallback - return no-op announcer
    return {
      announce: () => {},
      clear: () => {},
      destroy: () => {},
    }
  }

  let politeRegion: HTMLDivElement | null = null
  let assertiveRegion: HTMLDivElement | null = null
  const queue: QueuedAnnouncement[] = []
  let isProcessing = false
  let timeoutId: number | null = null

  /**
   * Create ARIA live regions and append to document
   */
  const createLiveRegions = () => {
    // Create polite region
    politeRegion = document.createElement('div')
    politeRegion.setAttribute('role', 'status')
    politeRegion.setAttribute('aria-live', 'polite')
    politeRegion.setAttribute('aria-atomic', 'true')
    politeRegion.className = 'sr-only'
    politeRegion.id = 'announcer-polite'
    document.body.appendChild(politeRegion)

    // Create assertive region
    assertiveRegion = document.createElement('div')
    assertiveRegion.setAttribute('role', 'alert')
    assertiveRegion.setAttribute('aria-live', 'assertive')
    assertiveRegion.setAttribute('aria-atomic', 'true')
    assertiveRegion.className = 'sr-only'
    assertiveRegion.id = 'announcer-assertive'
    document.body.appendChild(assertiveRegion)
  }

  /**
   * Process announcement queue
   */
  const processQueue = () => {
    if (queue.length === 0) {
      isProcessing = false
      return
    }

    isProcessing = true
    const announcement = queue.shift()!

    const region = announcement.priority === 'assertive' ? assertiveRegion : politeRegion

    if (region) {
      // Clear previous message
      region.textContent = ''

      // Small delay to ensure screen readers notice the change
      setTimeout(() => {
        region.textContent = announcement.message

        // Clear after message is read (estimated 3 seconds)
        setTimeout(() => {
          region.textContent = ''
          processQueue()
        }, 3000)
      }, 100)
    } else {
      processQueue()
    }
  }

  /**
   * Announce a message to screen readers
   *
   * @param message - Message to announce
   * @param options - Announcement options
   */
  const announce = (message: string, options: AnnouncementOptions = {}) => {
    if (!message.trim()) return

    const { priority = 'polite', delay = 0, clearQueue = false } = options

    // Clear queue if requested
    if (clearQueue) {
      queue.length = 0
    }

    // Add to queue
    queue.push({
      message,
      priority,
      timestamp: Date.now(),
    })

    // Start processing if not already
    if (!isProcessing) {
      if (delay > 0) {
        timeoutId = window.setTimeout(() => {
          processQueue()
        }, delay)
      } else {
        processQueue()
      }
    }
  }

  /**
   * Clear all pending announcements
   */
  const clear = () => {
    queue.length = 0
    if (timeoutId !== null) {
      clearTimeout(timeoutId)
      timeoutId = null
    }
    if (politeRegion) politeRegion.textContent = ''
    if (assertiveRegion) assertiveRegion.textContent = ''
    isProcessing = false
  }

  /**
   * Destroy the announcer and remove live regions from DOM
   */
  const destroy = () => {
    clear()
    if (politeRegion && politeRegion.parentNode) {
      politeRegion.parentNode.removeChild(politeRegion)
    }
    if (assertiveRegion && assertiveRegion.parentNode) {
      assertiveRegion.parentNode.removeChild(assertiveRegion)
    }
    politeRegion = null
    assertiveRegion = null
  }

  // Initialize
  createLiveRegions()

  // Cleanup on component unmount
  onCleanup(() => {
    destroy()
  })

  return {
    announce,
    clear,
    destroy,
  }
}

/**
 * Global announcer instance
 * Singleton for use across multiple components
 */
let globalAnnouncer: Announcer | null = null

/**
 * Get or create the global announcer instance
 *
 * @returns Global announcer
 */
export function getGlobalAnnouncer(): Announcer {
  if (!globalAnnouncer) {
    globalAnnouncer = createAnnouncer()
  }
  return globalAnnouncer
}

/**
 * Announce using the global announcer
 * Convenience function for quick announcements
 *
 * @param message - Message to announce
 * @param options - Announcement options
 */
export function announce(message: string, options?: AnnouncementOptions) {
  getGlobalAnnouncer().announce(message, options)
}
