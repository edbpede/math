/**
 * I18n State Management with Nanostores
 *
 * Provides reactive locale state that works across Astro pages and SolidJS islands.
 * Uses Nanostores for framework-agnostic state management.
 *
 * Requirements:
 * - 2.3: Language selector accessible from all pages with immediate switching
 * - 2.4: Store language preference and synchronize across devices
 */

import { atom, computed } from 'nanostores';
import { persistentAtom } from '@nanostores/persistent';
import type { Locale, Translations, TranslationFunction } from './types';
import {
  loadTranslations,
  getNestedValue,
  interpolate,
  detectBrowserLocale,
} from './loader';

/**
 * Current locale atom with persistence to localStorage
 * Defaults to browser-detected locale
 */
export const $locale = persistentAtom<Locale>(
  'app:locale',
  detectBrowserLocale(),
  {
    encode: JSON.stringify,
    decode: JSON.parse,
  }
);

/**
 * Translations atom
 * Automatically reloads when locale changes
 */
export const $translations = atom<Translations | null>(null);

/**
 * Loading state
 */
export const $isLoadingTranslations = atom<boolean>(false);

/**
 * Initialize i18n system
 * Should be called once on app startup
 */
export async function initI18n(): Promise<void> {
  const currentLocale = $locale.get();

  $isLoadingTranslations.set(true);

  try {
    const translations = await loadTranslations(currentLocale);
    $translations.set(translations);
  } catch (error) {
    console.error('Failed to initialize i18n:', error);
  } finally {
    $isLoadingTranslations.set(false);
  }
}

/**
 * Change the current locale
 * Reloads translations and updates the store
 *
 * @param newLocale - The locale to switch to
 */
export async function changeLocale(newLocale: Locale): Promise<void> {
  if ($locale.get() === newLocale) {
    return; // No change needed
  }

  $isLoadingTranslations.set(true);

  try {
    const translations = await loadTranslations(newLocale);
    $locale.set(newLocale);
    $translations.set(translations);
  } catch (error) {
    console.error(`Failed to change locale to ${newLocale}:`, error);
  } finally {
    $isLoadingTranslations.set(false);
  }
}

/**
 * Translation function factory
 * Returns a function that translates keys for the current locale
 */
export const $t = computed(
  [$translations, $locale],
  (translations, locale): TranslationFunction => {
    return (key: string, params?: Record<string, string | number>): string => {
      if (!translations) {
        console.warn(`Translations not loaded, returning key: ${key}`);
        return key;
      }

      // Split the key into category and path
      // e.g., "common.actions.start" -> category: "common", path: "actions.start"
      const parts = key.split('.');
      const category = parts[0] as keyof Translations;
      const path = parts.slice(1).join('.');

      if (!(category in translations)) {
        console.warn(
          `Translation category "${category}" not found for key: ${key}`
        );
        return key;
      }

      const value = getNestedValue(translations[category], path);

      if (typeof value !== 'string') {
        console.warn(
          `Translation not found or not a string for key: ${key} (locale: ${locale})`
        );
        return key;
      }

      // Interpolate parameters if provided
      return interpolate(value, params);
    };
  }
);

/**
 * Get the current locale
 */
export function getCurrentLocale(): Locale {
  return $locale.get();
}

/**
 * Check if translations are loaded
 */
export function isTranslationsLoaded(): boolean {
  return $translations.get() !== null;
}
