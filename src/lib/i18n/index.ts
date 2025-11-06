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

// Re-export types
export type {
  Locale,
  TranslationKey,
  TranslationCategory,
  Translations,
  ContextPool,
  NumberFormatOptions,
  DateFormatOptions,
  LocaleConfig,
  TranslationFunction,
  I18nContext,
} from './types';

export { SUPPORTED_LOCALES } from './types';

// Re-export loader functions
export {
  loadTranslations,
  getNestedValue,
  interpolate,
  clearTranslationCache,
  preloadTranslations,
  detectBrowserLocale,
} from './loader';

// Re-export store and state management
export {
  $locale,
  $translations,
  $isLoadingTranslations,
  $t,
  initI18n,
  changeLocale,
  getCurrentLocale,
  isTranslationsLoaded,
} from './store';

// Re-export utilities
export {
  formatNumber,
  formatDate,
  getContextPool,
  getRandomContext,
  getRandomContexts,
  parseNumber,
  normalizeAnswer,
  compareAnswers,
  detectNumberFormat,
  parseNumberAuto,
  getLocaleConfig,
} from './utils';

// Re-export context selector
export { ContextSelector, createContextSelector } from './context-selector';
