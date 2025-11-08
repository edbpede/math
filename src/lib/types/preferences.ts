/**
 * User Preferences Type Definitions
 *
 * Type definitions for the user preferences stored in the preferences JSONB
 * field of the users table in Supabase.
 *
 * Requirements:
 * - 9.1: WCAG 2.1 AA accessibility options
 * - 9.2: Visual accessibility preferences (theme, font size, dyslexia font, high contrast)
 */

/**
 * Theme preference for the application
 * - light: Light color scheme
 * - dark: Dark color scheme
 * - system: Use system preference (automatic)
 */
export type Theme = 'light' | 'dark' | 'system'

/**
 * Font size preference for the application
 * - small: Smaller text size
 * - medium: Default text size
 * - large: Larger text size for better readability
 */
export type FontSize = 'small' | 'medium' | 'large'

/**
 * User preferences stored in the preferences JSONB field
 * All fields are optional with sensible defaults
 */
export interface UserPreferences {
  /**
   * Color theme preference
   * @default 'light'
   */
  theme?: Theme

  /**
   * Font size preference
   * @default 'medium'
   */
  fontSize?: FontSize

  /**
   * Enable OpenDyslexic font for better readability for users with dyslexia
   * @default false
   */
  dyslexiaFont?: boolean

  /**
   * Enable high contrast mode for better visibility
   * @default false
   */
  highContrast?: boolean
}

/**
 * Default user preferences
 */
export const DEFAULT_PREFERENCES: Required<UserPreferences> = {
  theme: 'light',
  fontSize: 'medium',
  dyslexiaFont: false,
  highContrast: false,
}

/**
 * Merges partial preferences with defaults
 * @param preferences - Partial user preferences
 * @returns Complete preferences object with defaults applied
 */
export function mergeWithDefaults(
  preferences: UserPreferences | Record<string, unknown> = {}
): Required<UserPreferences> {
  return {
    theme: (preferences.theme as Theme) || DEFAULT_PREFERENCES.theme,
    fontSize: (preferences.fontSize as FontSize) || DEFAULT_PREFERENCES.fontSize,
    dyslexiaFont:
      preferences.dyslexiaFont !== undefined
        ? Boolean(preferences.dyslexiaFont)
        : DEFAULT_PREFERENCES.dyslexiaFont,
    highContrast:
      preferences.highContrast !== undefined
        ? Boolean(preferences.highContrast)
        : DEFAULT_PREFERENCES.highContrast,
  }
}

/**
 * Validates that a theme value is valid
 * @param value - Value to check
 * @returns True if valid theme
 */
export function isValidTheme(value: unknown): value is Theme {
  return value === 'light' || value === 'dark' || value === 'system'
}

/**
 * Validates that a font size value is valid
 * @param value - Value to check
 * @returns True if valid font size
 */
export function isValidFontSize(value: unknown): value is FontSize {
  return value === 'small' || value === 'medium' || value === 'large'
}

/**
 * Validates user preferences object
 * @param preferences - Preferences to validate
 * @returns True if all preferences are valid
 */
export function validatePreferences(
  preferences: Partial<UserPreferences>
): boolean {
  if (preferences.theme !== undefined && !isValidTheme(preferences.theme)) {
    return false
  }
  if (
    preferences.fontSize !== undefined &&
    !isValidFontSize(preferences.fontSize)
  ) {
    return false
  }
  if (
    preferences.dyslexiaFont !== undefined &&
    typeof preferences.dyslexiaFont !== 'boolean'
  ) {
    return false
  }
  if (
    preferences.highContrast !== undefined &&
    typeof preferences.highContrast !== 'boolean'
  ) {
    return false
  }
  return true
}

