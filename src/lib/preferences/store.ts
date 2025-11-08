/**
 * Preferences Store
 *
 * Reactive Nanostore for managing user preferences across the application.
 * Following .claude/astro-solid-stack.md guidelines for cross-island state management.
 *
 * Requirements:
 * - 9.2: Visual accessibility options (theme, font size, dyslexia font, high contrast)
 *
 * Usage in SolidJS components:
 * ```typescript
 * import { useStore } from '@nanostores/solid'
 * import { $preferences } from '@/lib/preferences/store'
 *
 * const preferences = useStore($preferences)
 * const theme = () => preferences().theme
 * ```
 *
 * Usage in Astro pages:
 * ```typescript
 * import { $preferences } from '@/lib/preferences/store'
 *
 * const preferences = $preferences.get()
 * const theme = preferences.theme
 * ```
 */

import { atom } from 'nanostores'
import type { UserPreferences } from '@/lib/types/preferences'
import { DEFAULT_PREFERENCES, mergeWithDefaults } from '@/lib/types/preferences'

/**
 * Global preferences store
 * Contains the current user preferences with defaults applied
 */
export const $preferences = atom<Required<UserPreferences>>(DEFAULT_PREFERENCES)

/**
 * Update preferences (partial or complete)
 * Merges provided preferences with current state
 *
 * @param newPreferences - Partial preferences to update
 *
 * @example
 * ```typescript
 * // Update theme only
 * updatePreferences({ theme: 'dark' })
 *
 * // Update multiple preferences
 * updatePreferences({ theme: 'dark', fontSize: 'large' })
 * ```
 */
export function updatePreferences(newPreferences: Partial<UserPreferences>): void {
  const current = $preferences.get()
  const updated = mergeWithDefaults({
    ...current,
    ...newPreferences,
  })
  $preferences.set(updated)
}

/**
 * Reset preferences to defaults
 *
 * @example
 * ```typescript
 * resetPreferences()
 * ```
 */
export function resetPreferences(): void {
  $preferences.set(DEFAULT_PREFERENCES)
}

/**
 * Initialize preferences from a saved state
 * Useful when loading preferences from localStorage or Supabase
 *
 * @param savedPreferences - Saved preferences object
 *
 * @example
 * ```typescript
 * // Load from localStorage
 * const saved = JSON.parse(localStorage.getItem('math-preferences') || '{}')
 * initializePreferences(saved)
 *
 * // Load from Supabase
 * const { data } = await supabase.from('users').select('preferences').single()
 * initializePreferences(data?.preferences || {})
 * ```
 */
export function initializePreferences(
  savedPreferences: UserPreferences | Record<string, unknown>
): void {
  const initialized = mergeWithDefaults(savedPreferences)
  $preferences.set(initialized)
}

/**
 * Subscribe to preference changes
 * Returns an unsubscribe function
 *
 * @param callback - Function to call when preferences change
 * @returns Unsubscribe function
 *
 * @example
 * ```typescript
 * const unsubscribe = subscribeToPreferences((prefs) => {
 *   console.log('Preferences changed:', prefs)
 *   // Apply preferences to DOM, save to storage, etc.
 * })
 *
 * // Later, unsubscribe
 * unsubscribe()
 * ```
 */
export function subscribeToPreferences(
  callback: (preferences: Required<UserPreferences>) => void
): () => void {
  return $preferences.subscribe(callback)
}

/**
 * Get current preferences (non-reactive)
 * For one-time access without subscribing
 *
 * @returns Current preferences
 *
 * @example
 * ```typescript
 * const currentTheme = getPreferences().theme
 * ```
 */
export function getPreferences(): Required<UserPreferences> {
  return $preferences.get()
}
