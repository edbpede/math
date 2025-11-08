/**
 * Offline Status Indicator
 *
 * Displays a banner when the user is offline, informing them that
 * their work is being saved locally and will sync when online.
 *
 * Uses browser online/offline events and reactive state through Nanostores.
 */

import { createSignal, onMount, onCleanup, Show } from 'solid-js'
import { useStore } from '@nanostores/solid'
import { $t } from '@/lib/i18n'

/**
 * Offline indicator component
 *
 * Shows a banner at the top of the page when offline.
 * Banner is dismissible but reappears if user goes offline again.
 */
export default function OfflineIndicator() {
  const [isOnline, setIsOnline] = createSignal(navigator.onLine)
  const [isDismissed, setIsDismissed] = createSignal(false)
  const t = useStore($t)

  // Handle online/offline events
  onMount(() => {
    const handleOnline = () => {
      setIsOnline(true)
      setIsDismissed(false) // Reset dismissal when coming back online
    }

    const handleOffline = () => {
      setIsOnline(false)
      setIsDismissed(false) // Show banner immediately when going offline
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    // Cleanup
    onCleanup(() => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    })
  })

  // Determine if banner should be shown
  const shouldShow = () => !isOnline() && !isDismissed()

  // Dismiss banner
  const dismiss = () => {
    setIsDismissed(true)
  }

  return (
    <Show when={shouldShow()}>
      <div
        class="fixed top-0 left-0 right-0 z-50 bg-yellow-50 border-b border-yellow-200 px-4 py-3 shadow-md"
        role="alert"
        aria-live="polite"
      >
        <div class="max-w-7xl mx-auto flex items-center justify-between gap-4">
          {/* Icon */}
          <div class="flex items-center gap-3 flex-1">
            <svg
              class="w-5 h-5 text-yellow-600 flex-shrink-0"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              aria-hidden="true"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>

            {/* Message */}
            <div class="flex-1">
              <p class="text-sm font-medium text-yellow-800">
                {t()('common.offline.message')}
              </p>
              <p class="text-xs text-yellow-700 mt-1">
                {t()('common.offline.description')}
              </p>
            </div>
          </div>

          {/* Dismiss button */}
          <button
            type="button"
            onClick={dismiss}
            class="flex-shrink-0 text-yellow-600 hover:text-yellow-800 focus:outline-none focus:ring-2 focus:ring-yellow-500 rounded p-1"
            aria-label={t()('common.offline.dismiss')}
          >
            <svg
              class="w-5 h-5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              aria-hidden="true"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>
      </div>
    </Show>
  )
}

