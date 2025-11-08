/**
 * Preferences Module
 *
 * Central export for all preference-related functionality.
 * Provides a unified interface for managing user preferences.
 *
 * @example
 * ```typescript
 * // Import everything you need from one place
 * import {
 *   $preferences,
 *   updatePreferences,
 *   initializePreferencesSystem,
 *   applyPreferencesToDOM,
 * } from '@/lib/preferences'
 * ```
 */

// Re-export from store
export {
  $preferences,
  updatePreferences,
  resetPreferences,
  initializePreferences,
  subscribeToPreferences,
  getPreferences,
} from './store'

// Re-export from manager
export {
  applyPreferencesToDOM,
  loadPreferencesFromLocalStorage,
  savePreferencesToLocalStorage,
  clearPreferencesFromLocalStorage,
  syncPreferencesWithSupabase,
  loadPreferencesFromSupabase,
  listenForSystemThemeChanges,
} from './manager'

// Re-export from init
export {
  initializePreferencesSystem,
  inlinePreferencesScript,
} from './init'

// Re-export types
export type { UserPreferences, Theme, FontSize } from '@/lib/types/preferences'
export { DEFAULT_PREFERENCES, mergeWithDefaults } from '@/lib/types/preferences'
