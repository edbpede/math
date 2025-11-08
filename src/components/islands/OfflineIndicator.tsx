/**
 * Offline Indicator Component
 *
 * A simple banner that appears when the user goes offline.
 * Shows at the top of the page to clearly indicate offline mode.
 *
 * Requirements:
 * - 6.3: Display clear offline status indication
 */

import { Show, onMount } from 'solid-js'
import { useStore } from '@nanostores/solid'
import { $networkStatus, initializeStatusStores } from '../../lib/stores/network-status'
import { $t } from '../../lib/i18n'

export default function OfflineIndicator() {
  const t = useStore($t)
  const networkStatus = useStore($networkStatus)

  // Initialize status stores on mount
  onMount(async () => {
    try {
      await initializeStatusStores()
    } catch (err) {
      console.error('[OfflineIndicator] Failed to initialize:', err)
    }
  })

  return (
    <Show when={!networkStatus().online}>
      <div class="bg-yellow-500 text-white px-4 py-2 text-center text-sm font-medium shadow-md">
        <div class="flex items-center justify-center gap-2">
          {/* Offline icon */}
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M18.364 5.636a9 9 0 010 12.728m0 0l-2.829-2.829m2.829 2.829L21 21M15.536 8.464a5 5 0 010 7.072m0 0l-2.829-2.829m-4.243 2.829a4.978 4.978 0 01-1.414-2.83m-1.414 5.658a9 9 0 01-2.167-9.238m7.824 2.167a1 1 0 111.414 1.414m-1.414-1.414L3 3m8.293 8.293l1.414 1.414"
            />
          </svg>

          {/* Message */}
          <span>{t()('sync.messages.connectionLost')}</span>
        </div>
      </div>
    </Show>
  )
}
