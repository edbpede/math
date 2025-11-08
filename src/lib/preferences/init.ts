/**
 * Preferences Initialization
 *
 * Initializes the preferences system on page load:
 * 1. Loads preferences from localStorage (immediate, no flash)
 * 2. Applies preferences to DOM
 * 3. Syncs with Supabase in background (if authenticated)
 * 4. Subscribes to preference changes for reactive updates
 *
 * This module should be imported and called in MainLayout.astro
 *
 * Requirements:
 * - 9.2: Visual accessibility options with cross-page persistence
 */

import {
  $preferences,
  initializePreferences,
  subscribeToPreferences,
} from './store'
import {
  applyPreferencesToDOM,
  loadPreferencesFromLocalStorage,
  savePreferencesToLocalStorage,
  loadPreferencesFromSupabase,
  syncPreferencesWithSupabase,
  listenForSystemThemeChanges,
} from './manager'

/**
 * Debounce utility for saving preferences
 * Prevents excessive saves when multiple preferences change quickly
 */
let saveTimeout: ReturnType<typeof setTimeout> | null = null
const SAVE_DEBOUNCE_MS = 500

/**
 * Initialize the preferences system
 * Call this function once on page load
 *
 * @param userId - Optional user ID for Supabase sync. If not provided, only localStorage is used
 *
 * @example
 * ```typescript
 * // In MainLayout.astro frontmatter
 * import { initializePreferencesSystem } from '@/lib/preferences/init'
 *
 * const user = Astro.locals.user
 * if (typeof window !== 'undefined') {
 *   initializePreferencesSystem(user?.id)
 * }
 * ```
 */
export async function initializePreferencesSystem(
  userId?: string
): Promise<void> {
  // Step 1: Load from localStorage immediately (fast, prevents flash)
  const cachedPreferences = loadPreferencesFromLocalStorage()
  initializePreferences(cachedPreferences)
  applyPreferencesToDOM(cachedPreferences)

  // Step 2: If authenticated, sync with Supabase in background
  if (userId) {
    try {
      const serverPreferences = await loadPreferencesFromSupabase(userId)

      // Update store and DOM if server preferences differ from cache
      const currentPrefs = $preferences.get()
      if (JSON.stringify(serverPreferences) !== JSON.stringify(currentPrefs)) {
        initializePreferences(serverPreferences)
        applyPreferencesToDOM(serverPreferences)
        savePreferencesToLocalStorage(serverPreferences)
      }
    } catch (error) {
      console.error('[Preferences] Failed to sync with Supabase on init:', error)
      // Continue with cached preferences
    }
  }

  // Step 3: Subscribe to preference changes for reactive updates
  subscribeToPreferences((preferences) => {
    // Apply to DOM immediately
    applyPreferencesToDOM(preferences)

    // Save to localStorage (debounced)
    if (saveTimeout) {
      clearTimeout(saveTimeout)
    }
    saveTimeout = setTimeout(() => {
      savePreferencesToLocalStorage(preferences)

      // Sync with Supabase if authenticated
      if (userId) {
        syncPreferencesWithSupabase(userId, preferences)
      }
    }, SAVE_DEBOUNCE_MS)
  })

  // Step 4: Listen for system theme changes (when theme is 'system')
  listenForSystemThemeChanges((isDark) => {
    const currentPrefs = $preferences.get()
    if (currentPrefs.theme === 'system') {
      // Re-apply theme to update for system change
      applyPreferencesToDOM(currentPrefs)
      console.log('[Preferences] System theme changed to:', isDark ? 'dark' : 'light')
    }
  })

  console.log('[Preferences] System initialized successfully')
}

/**
 * Apply preferences immediately from inline script
 * This function is designed to be called from an inline <script> in <head>
 * to prevent flash of unstyled content (FOUC)
 *
 * Usage:
 * ```html
 * <script>
 *   (function() {
 *     try {
 *       const stored = localStorage.getItem('math-preferences')
 *       if (!stored) return
 *
 *       const prefs = JSON.parse(stored)
 *       const html = document.documentElement
 *
 *       // Apply theme
 *       if (prefs.theme === 'dark') {
 *         html.classList.add('dark-theme')
 *       } else if (prefs.theme === 'system') {
 *         const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
 *         if (prefersDark) html.classList.add('dark-theme')
 *       }
 *
 *       // Apply font size
 *       if (prefs.fontSize) {
 *         html.classList.add('font-' + prefs.fontSize)
 *       }
 *
 *       // Apply dyslexia font
 *       if (prefs.dyslexiaFont) {
 *         html.classList.add('dyslexia-font')
 *       }
 *
 *       // Apply high contrast
 *       if (prefs.highContrast) {
 *         html.classList.add('high-contrast')
 *       }
 *     } catch (e) {
 *       // Silently fail - preferences will load normally
 *     }
 *   })()
 * </script>
 * ```
 */
export const inlinePreferencesScript = `
(function() {
  try {
    const stored = localStorage.getItem('math-preferences')
    if (!stored) return

    const prefs = JSON.parse(stored)
    const html = document.documentElement

    // Apply theme
    if (prefs.theme === 'dark') {
      html.classList.add('dark-theme')
    } else if (prefs.theme === 'system') {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
      if (prefersDark) html.classList.add('dark-theme')
    }

    // Apply font size
    if (prefs.fontSize) {
      html.classList.add('font-' + prefs.fontSize)
    }

    // Apply dyslexia font
    if (prefs.dyslexiaFont) {
      html.classList.add('dyslexia-font')
    }

    // Apply high contrast
    if (prefs.highContrast) {
      html.classList.add('high-contrast')
    }
  } catch (e) {
    // Silently fail - preferences will load normally
  }
})()
`.trim()
