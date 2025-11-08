/**
 * Install Prompt Component
 *
 * Handles PWA installation prompting with a user-friendly interface.
 * Listens for beforeinstallprompt event and provides a custom install UI.
 *
 * Features:
 * - Custom install banner/button
 * - Respects user dismissal (stored in localStorage)
 * - Detects if app is already installed
 * - Multilingual support via i18n
 * - Keyboard accessible
 *
 * Requirements:
 * - 6.6: Implement install prompt handling
 * - 2.1: Multi-language support
 * - 9.1: Keyboard accessible
 * - 14.1: Clear, welcoming install experience
 */

import { Show, createSignal, createEffect, onMount, onCleanup } from 'solid-js'
import { useStore } from '@nanostores/solid'
import { $t } from '../../lib/i18n'
import { createFocusTrap } from '@/lib/accessibility'

// Types
interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

// LocalStorage key for dismissal
const INSTALL_DISMISSED_KEY = 'math-install-prompt-dismissed'
const DISMISS_DURATION_DAYS = 30

export default function InstallPrompt() {
  const t = useStore($t)

  // State
  const [deferredPrompt, setDeferredPrompt] = createSignal<BeforeInstallPromptEvent | null>(null)
  const [showPrompt, setShowPrompt] = createSignal(false)
  const [isInstalled, setIsInstalled] = createSignal(false)
  const [isInstalling, setIsInstalling] = createSignal(false)

  // Prompt container ref and focus trap
  let promptRef: HTMLDivElement | undefined
  const focusTrap = createFocusTrap(
    () => promptRef,
    {
      preventScroll: true,
      allowEscape: true,
      onDeactivate: () => handleDismiss(),
    }
  )

  // Activate/deactivate focus trap based on prompt visibility
  createEffect(() => {
    if (showPrompt() && !isInstalled()) {
      focusTrap.activate()
    } else {
      focusTrap.deactivate()
    }
  })

  // Check if user previously dismissed the prompt
  const isDismissed = (): boolean => {
    if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
      return false
    }
    
    try {
      const dismissed = localStorage.getItem(INSTALL_DISMISSED_KEY)
      if (!dismissed) return false
      
      const dismissedTime = parseInt(dismissed, 10)
      const now = Date.now()
      const daysSinceDismissal = (now - dismissedTime) / (1000 * 60 * 60 * 24)
      
      // Show again after DISMISS_DURATION_DAYS
      return daysSinceDismissal < DISMISS_DURATION_DAYS
    } catch {
      return false
    }
  }

  // Check if app is already installed
  const checkInstallStatus = () => {
    if (typeof window === 'undefined') {
      return
    }
    
    // Check if running in standalone mode (installed)
    const isStandalone = 
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true

    setIsInstalled(isStandalone)
  }

  // Handle beforeinstallprompt event
  const handleBeforeInstallPrompt = (e: Event) => {
    // Prevent the mini-infobar from appearing on mobile
    e.preventDefault()
    
    const promptEvent = e as BeforeInstallPromptEvent
    
    // Store the event so it can be triggered later
    setDeferredPrompt(promptEvent)
    
    // Check if user previously dismissed
    if (!isDismissed()) {
      setShowPrompt(true)
    }
    
    console.log('[InstallPrompt] Install prompt available')
  }

  // Handle app installed event
  const handleAppInstalled = () => {
    console.log('[InstallPrompt] App installed successfully')
    setIsInstalled(true)
    setShowPrompt(false)
    setDeferredPrompt(null)
  }

  // Handle install button click
  const handleInstall = async () => {
    const prompt = deferredPrompt()
    if (!prompt) return

    setIsInstalling(true)

    try {
      // Show the install prompt
      await prompt.prompt()
      
      // Wait for the user to respond to the prompt
      const { outcome } = await prompt.userChoice
      
      console.log(`[InstallPrompt] User response: ${outcome}`)
      
      if (outcome === 'accepted') {
        console.log('[InstallPrompt] User accepted the install prompt')
      } else {
        console.log('[InstallPrompt] User dismissed the install prompt')
      }
      
      // Clear the deferred prompt
      setDeferredPrompt(null)
      setShowPrompt(false)
    } catch (error) {
      console.error('[InstallPrompt] Install failed:', error)
    } finally {
      setIsInstalling(false)
    }
  }

  // Handle dismiss button click
  const handleDismiss = () => {
    if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
      try {
        // Store dismissal time in localStorage
        localStorage.setItem(INSTALL_DISMISSED_KEY, Date.now().toString())
      } catch (error) {
        console.error('[InstallPrompt] Failed to save dismissal:', error)
      }
    }
    
    setShowPrompt(false)
    console.log('[InstallPrompt] User dismissed install prompt')
  }

  // Setup event listeners
  onMount(() => {
    if (typeof window === 'undefined') {
      return
    }
    
    checkInstallStatus()
    
    // Listen for beforeinstallprompt event
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    
    // Listen for appinstalled event
    window.addEventListener('appinstalled', handleAppInstalled)
    
    console.log('[InstallPrompt] Component mounted')
  })

  // Cleanup
  onCleanup(() => {
    if (typeof window !== 'undefined') {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
      window.removeEventListener('appinstalled', handleAppInstalled)
    }
  })

  return (
    <Show when={showPrompt() && !isInstalled()}>
      <div
        ref={promptRef}
        class="fixed bottom-0 left-0 right-0 z-50 bg-white border-t-2 border-blue-500 shadow-lg md:bottom-4 md:left-4 md:right-auto md:max-w-md md:rounded-lg md:border-2"
        role="dialog"
        aria-labelledby="install-prompt-title"
        aria-describedby="install-prompt-description"
      >
        <div class="p-4">
          {/* Header */}
          <div class="flex items-start gap-3 mb-3">
            {/* App icon */}
            <div class="flex-shrink-0 w-12 h-12 bg-blue-500 rounded-lg flex items-center justify-center">
              <svg
                class="w-8 h-8 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                />
              </svg>
            </div>

            {/* Text content */}
            <div class="flex-1 min-w-0">
              <h3
                id="install-prompt-title"
                class="text-lg font-semibold text-gray-900 mb-1"
              >
                {t()('pwa.install.title')}
              </h3>
              <p
                id="install-prompt-description"
                class="text-sm text-gray-600"
              >
                {t()('pwa.install.description')}
              </p>
            </div>

            {/* Close button */}
            <button
              type="button"
              onClick={handleDismiss}
              class="flex-shrink-0 p-2 text-gray-400 hover:text-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 touch-target"
              aria-label={t()('common.actions.close')}
            >
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          {/* Features list */}
          <ul class="space-y-2 mb-4 text-sm text-gray-600">
            <li class="flex items-center gap-2">
              <svg class="w-4 h-4 text-green-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fill-rule="evenodd"
                  d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                  clip-rule="evenodd"
                />
              </svg>
              <span>{t()('pwa.install.feature.offline')}</span>
            </li>
            <li class="flex items-center gap-2">
              <svg class="w-4 h-4 text-green-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fill-rule="evenodd"
                  d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                  clip-rule="evenodd"
                />
              </svg>
              <span>{t()('pwa.install.feature.faster')}</span>
            </li>
            <li class="flex items-center gap-2">
              <svg class="w-4 h-4 text-green-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fill-rule="evenodd"
                  d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                  clip-rule="evenodd"
                />
              </svg>
              <span>{t()('pwa.install.feature.homescreen')}</span>
            </li>
          </ul>

          {/* Action buttons */}
          <div class="flex gap-2">
            <button
              type="button"
              onClick={handleInstall}
              disabled={isInstalling()}
              class="flex-1 bg-blue-500 hover:bg-blue-600 text-white font-medium py-2 px-4 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed touch-target"
            >
              <Show
                when={!isInstalling()}
                fallback={
                  <span class="flex items-center justify-center gap-2">
                    <svg class="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                      <circle
                        class="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        stroke-width="4"
                      />
                      <path
                        class="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      />
                    </svg>
                    <span>{t()('common.status.loading')}</span>
                  </span>
                }
              >
                {t()('pwa.install.button')}
              </Show>
            </button>
            
            <button
              type="button"
              onClick={handleDismiss}
              class="px-4 py-2 text-gray-600 hover:text-gray-800 font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 touch-target"
            >
              {t()('pwa.install.dismiss')}
            </button>
          </div>
        </div>
      </div>

      {/* Backdrop for mobile */}
      <div
        class="fixed inset-0 bg-black bg-opacity-25 z-40 md:hidden"
        onClick={handleDismiss}
        aria-hidden="true"
      />
    </Show>
  )
}

