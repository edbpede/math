/**
 * Preferences Manager
 *
 * Manages preference application to the DOM, localStorage, and Supabase synchronization.
 * Provides utilities for loading, saving, and applying user preferences.
 *
 * Requirements:
 * - 9.2: Visual accessibility options persistence and application
 *
 * Storage Strategy:
 * 1. Primary: Supabase (users.preferences JSONB) - authoritative source
 * 2. Cache: localStorage ('math-preferences') - fast initial load, offline support
 * 3. Runtime: Nanostore ($preferences) - reactive state during session
 */

import type { UserPreferences, Theme } from '@/lib/types/preferences'
import { mergeWithDefaults } from '@/lib/types/preferences'

/**
 * LocalStorage key for cached preferences
 */
const STORAGE_KEY = 'math-preferences'

/**
 * CSS class mapping for preferences
 */
const THEME_CLASSES = {
  light: 'light-theme',
  dark: 'dark-theme',
  system: 'system-theme',
} as const

const FONT_SIZE_CLASSES = {
  small: 'font-small',
  medium: 'font-medium',
  large: 'font-large',
} as const

const DYSLEXIA_FONT_CLASS = 'dyslexia-font'
const HIGH_CONTRAST_CLASS = 'high-contrast'

/**
 * Apply preferences to the DOM
 * Updates HTML element classes based on user preferences
 *
 * @param preferences - User preferences to apply
 *
 * @example
 * ```typescript
 * const prefs = getPreferences()
 * applyPreferencesToDOM(prefs)
 * ```
 */
export function applyPreferencesToDOM(
  preferences: Required<UserPreferences>
): void {
  const html = document.documentElement

  // Apply theme
  applyTheme(preferences.theme)

  // Apply font size
  applyFontSize(preferences.fontSize)

  // Apply dyslexia font
  if (preferences.dyslexiaFont) {
    html.classList.add(DYSLEXIA_FONT_CLASS)
  } else {
    html.classList.remove(DYSLEXIA_FONT_CLASS)
  }

  // Apply high contrast
  if (preferences.highContrast) {
    html.classList.add(HIGH_CONTRAST_CLASS)
  } else {
    html.classList.remove(HIGH_CONTRAST_CLASS)
  }
}

/**
 * Apply theme to DOM
 * Handles 'system' theme by detecting OS preference
 *
 * @param theme - Theme to apply
 */
function applyTheme(theme: Theme): void {
  const html = document.documentElement

  // Remove all theme classes first
  Object.values(THEME_CLASSES).forEach((cls) => html.classList.remove(cls))

  let effectiveTheme: 'light' | 'dark' = 'light'

  if (theme === 'system') {
    // Detect system preference
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
    effectiveTheme = prefersDark ? 'dark' : 'light'
    html.classList.add(THEME_CLASSES.system)
  } else {
    effectiveTheme = theme
  }

  // Apply the effective theme class
  html.classList.add(THEME_CLASSES[effectiveTheme])

  // Update meta theme-color for mobile browsers
  updateThemeColor(effectiveTheme)
}

/**
 * Apply font size to DOM
 *
 * @param fontSize - Font size to apply
 */
function applyFontSize(fontSize: 'small' | 'medium' | 'large'): void {
  const html = document.documentElement

  // Remove all font size classes first
  Object.values(FONT_SIZE_CLASSES).forEach((cls) => html.classList.remove(cls))

  // Apply selected font size
  html.classList.add(FONT_SIZE_CLASSES[fontSize])
}

/**
 * Update theme-color meta tag for mobile browsers
 *
 * @param theme - Theme for color selection
 */
function updateThemeColor(theme: 'light' | 'dark'): void {
  const metaThemeColor = document.querySelector('meta[name="theme-color"]')
  if (metaThemeColor) {
    // Light theme: blue (#3b82f6), Dark theme: dark gray (#1e293b)
    const color = theme === 'dark' ? '#1e293b' : '#3b82f6'
    metaThemeColor.setAttribute('content', color)
  }
}

/**
 * Load preferences from localStorage
 * Returns merged preferences with defaults, or defaults if not found/invalid
 *
 * @returns Preferences from localStorage with defaults applied
 *
 * @example
 * ```typescript
 * const prefs = loadPreferencesFromLocalStorage()
 * initializePreferences(prefs)
 * ```
 */
export function loadPreferencesFromLocalStorage(): Required<UserPreferences> {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (!stored) {
      return mergeWithDefaults({})
    }

    const parsed = JSON.parse(stored) as UserPreferences
    return mergeWithDefaults(parsed)
  } catch (error) {
    console.error('[Preferences] Failed to load from localStorage:', error)
    return mergeWithDefaults({})
  }
}

/**
 * Save preferences to localStorage
 *
 * @param preferences - Preferences to save
 *
 * @example
 * ```typescript
 * savePreferencesToLocalStorage(getPreferences())
 * ```
 */
export function savePreferencesToLocalStorage(
  preferences: UserPreferences
): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(preferences))
  } catch (error) {
    console.error('[Preferences] Failed to save to localStorage:', error)
  }
}

/**
 * Clear preferences from localStorage
 * Useful for testing or reset functionality
 *
 * @example
 * ```typescript
 * clearPreferencesFromLocalStorage()
 * ```
 */
export function clearPreferencesFromLocalStorage(): void {
  try {
    localStorage.removeItem(STORAGE_KEY)
  } catch (error) {
    console.error('[Preferences] Failed to clear from localStorage:', error)
  }
}

/**
 * Sync preferences with Supabase
 * Saves current preferences to the users.preferences JSONB field
 *
 * @param userId - User ID
 * @param preferences - Preferences to sync
 * @returns Promise that resolves when sync is complete
 *
 * @example
 * ```typescript
 * await syncPreferencesWithSupabase(userId, getPreferences())
 * ```
 */
export async function syncPreferencesWithSupabase(
  userId: string,
  preferences: UserPreferences
): Promise<void> {
  try {
    const response = await fetch('/api/preferences/update', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ userId, preferences }),
    })

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }

    console.log('[Preferences] Synced with Supabase successfully')
  } catch (error) {
    console.error('[Preferences] Failed to sync with Supabase:', error)
    // Don't throw - we want to continue even if Supabase sync fails
    // Preferences are still saved in localStorage
  }
}

/**
 * Load preferences from Supabase
 * Fetches user preferences from the server
 *
 * @param userId - User ID
 * @returns Promise that resolves with preferences
 *
 * @example
 * ```typescript
 * const prefs = await loadPreferencesFromSupabase(userId)
 * initializePreferences(prefs)
 * ```
 */
export async function loadPreferencesFromSupabase(
  userId: string
): Promise<Required<UserPreferences>> {
  try {
    const response = await fetch(`/api/preferences/get?userId=${userId}`)

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }

    const data = await response.json()
    return mergeWithDefaults(data.preferences || {})
  } catch (error) {
    console.error('[Preferences] Failed to load from Supabase:', error)
    // Fallback to localStorage
    return loadPreferencesFromLocalStorage()
  }
}

/**
 * Listen for system theme changes
 * Updates theme when user changes OS dark mode preference
 * Only active when theme is set to 'system'
 *
 * @param callback - Function to call when system theme changes
 * @returns Cleanup function to remove listener
 *
 * @example
 * ```typescript
 * const cleanup = listenForSystemThemeChanges((isDark) => {
 *   console.log('System theme changed to:', isDark ? 'dark' : 'light')
 *   // Re-apply theme
 *   applyTheme('system')
 * })
 *
 * // Later, cleanup
 * cleanup()
 * ```
 */
export function listenForSystemThemeChanges(
  callback: (isDark: boolean) => void
): () => void {
  const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')

  const handler = (e: MediaQueryListEvent) => {
    callback(e.matches)
  }

  // Modern browsers
  if (mediaQuery.addEventListener) {
    mediaQuery.addEventListener('change', handler)
    return () => mediaQuery.removeEventListener('change', handler)
  }

  // Fallback for older browsers
  mediaQuery.addListener(handler)
  return () => mediaQuery.removeListener(handler)
}
