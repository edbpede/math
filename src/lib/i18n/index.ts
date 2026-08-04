/**
 * I18n Module Entry Point
 *
 * Provides a complete internationalization system with:
 * - Translation loading with caching
 * - Interpolation support for dynamic values
 * - Fallback logic (requested language → Danish)
 * - Reactive state management with Nanostores
 * - Cross-island state synchronization
 *
 * Requirements:
 * - 2.1: Support Danish (da-DK) and English (en-US)
 * - 2.2: Browser language detection with fallback
 * - 2.3: Language selector with immediate switching
 * - 2.5: Load translations from structured JSON files
 */

// Re-export context selector
export { ContextSelector, createContextSelector } from "./context-selector";
// Re-export loader functions
export {
  clearTranslationCache,
  detectBrowserLocale,
  getNestedValue,
  interpolate,
  loadTranslations,
  preloadTranslations,
} from "./loader";
// Re-export store and state management
export {
  $isLoadingTranslations,
  $locale,
  $t,
  $translations,
  changeLocale,
  getCurrentLocale,
  initI18n,
  isTranslationsLoaded,
} from "./store";
// Re-export types
export type {
  ContextPool,
  DateFormatOptions,
  I18nContext,
  Locale,
  LocaleConfig,
  NumberFormatOptions,
  TranslationCategory,
  TranslationFunction,
  TranslationKey,
  Translations,
} from "./types";
export { SUPPORTED_LOCALES } from "./types";
// Re-export utilities
export {
  compareAnswers,
  detectNumberFormat,
  formatDate,
  formatNumber,
  getContextPool,
  getLocaleConfig,
  getRandomContext,
  getRandomContexts,
  normalizeAnswer,
  parseNumber,
  parseNumberAuto,
} from "./utils";
