/**
 * Translation Loader
 *
 * Loads translation files from the locales directory with caching support.
 * Implements fallback logic (requested language → Danish).
 *
 * Requirements:
 * - 2.1: Support Danish (da-DK) and English (en-US)
 * - 2.2: Browser language detection with fallback to Danish
 * - 2.5: Load translations from structured JSON files
 */

import type { Locale, Translations, TranslationCategory } from './types';

// Cache for loaded translations
const translationCache = new Map<Locale, Translations>();

/**
 * Load translation files for a specific locale
 */
export async function loadTranslations(locale: Locale): Promise<Translations> {
  // Check cache first
  if (translationCache.has(locale)) {
    return translationCache.get(locale)!;
  }

  try {
    // Dynamically import all translation files for the locale
    const [
      common,
      auth,
      navigation,
      competencies,
      exercises,
      feedback,
      hints,
      contexts,
      errors,
    ] = await Promise.all([
      import(`../../locales/${locale}/common.json`),
      import(`../../locales/${locale}/auth.json`),
      import(`../../locales/${locale}/navigation.json`),
      import(`../../locales/${locale}/competencies.json`),
      import(`../../locales/${locale}/exercises.json`),
      import(`../../locales/${locale}/feedback.json`),
      import(`../../locales/${locale}/hints.json`),
      import(`../../locales/${locale}/contexts.json`),
      import(`../../locales/${locale}/errors.json`),
    ]);

    const translations: Translations = {
      common: common.default || common,
      auth: auth.default || auth,
      navigation: navigation.default || navigation,
      competencies: competencies.default || competencies,
      exercises: exercises.default || exercises,
      feedback: feedback.default || feedback,
      hints: hints.default || hints,
      contexts: contexts.default || contexts,
      errors: errors.default || errors,
    };

    // Cache the loaded translations
    translationCache.set(locale, translations);

    return translations;
  } catch (error) {
    console.error(`Failed to load translations for locale ${locale}:`, error);

    // Fallback to Danish if loading failed and not already Danish
    if (locale !== 'da-DK') {
      console.warn(`Falling back to Danish (da-DK) translations`);
      return loadTranslations('da-DK');
    }

    // If Danish also fails, throw error
    throw new Error(`Failed to load Danish fallback translations: ${error}`);
  }
}

/**
 * Get a nested value from an object using dot notation
 * e.g., "auth.login.title" -> translations.auth.login.title
 */
export function getNestedValue(
  obj: TranslationCategory,
  path: string
): string | TranslationCategory | undefined {
  const keys = path.split('.');
  let current: any = obj;

  for (const key of keys) {
    if (current && typeof current === 'object' && key in current) {
      current = current[key];
    } else {
      return undefined;
    }
  }

  return current;
}

/**
 * Interpolate variables into a translation string
 * Supports {{variable}} syntax
 *
 * @param template - The translation string with {{placeholders}}
 * @param params - Object containing values to interpolate
 * @returns Interpolated string
 */
export function interpolate(
  template: string,
  params?: Record<string, string | number>
): string {
  if (!params) {
    return template;
  }

  return template.replace(/\{\{(\w+)\}\}/g, (match, key) => {
    if (key in params) {
      return String(params[key]);
    }
    // Return the original placeholder if key not found
    return match;
  });
}

/**
 * Clear the translation cache
 * Useful for testing or when switching languages
 */
export function clearTranslationCache(): void {
  translationCache.clear();
}

/**
 * Preload translations for a locale
 * Useful for optimizing language switching
 */
export async function preloadTranslations(locale: Locale): Promise<void> {
  await loadTranslations(locale);
}

/**
 * Detect browser language and return supported locale
 * Falls back to Danish if browser language is not supported
 */
export function detectBrowserLocale(): Locale {
  if (typeof window === 'undefined') {
    return 'da-DK'; // Default to Danish on server
  }

  const browserLang = navigator.language || (navigator as any).userLanguage;

  // Check for exact match
  if (browserLang === 'da-DK' || browserLang === 'en-US') {
    return browserLang as Locale;
  }

  // Check for language prefix match
  if (browserLang.startsWith('da')) {
    return 'da-DK';
  }
  if (browserLang.startsWith('en')) {
    return 'en-US';
  }

  // Default to Danish
  return 'da-DK';
}
