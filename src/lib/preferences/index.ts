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

// Re-export types
export type { FontSize, Theme, UserPreferences } from "@/lib/types/preferences";
export { DEFAULT_PREFERENCES, mergeWithDefaults } from "@/lib/types/preferences";

// Re-export from init
export {
  initializePreferencesSystem,
  inlinePreferencesScript,
} from "./init";
// Re-export from manager
export {
  applyPreferencesToDOM,
  clearPreferencesFromLocalStorage,
  listenForSystemThemeChanges,
  loadPreferencesFromLocalStorage,
  loadPreferencesFromSupabase,
  savePreferencesToLocalStorage,
  syncPreferencesWithSupabase,
} from "./manager";
// Re-export from store
export {
  $preferences,
  getPreferences,
  initializePreferences,
  resetPreferences,
  subscribeToPreferences,
  updatePreferences,
} from "./store";
