/**
 * I18n Utility Functions
 *
 * Provides locale-aware formatting and context pool retrieval.
 *
 * Requirements:
 * - 2.6: Select culturally appropriate contexts from locale-specific pools
 * - 2.7: Format numbers according to language conventions
 */

import type {
  Locale,
  NumberFormatOptions,
  DateFormatOptions,
  ContextPool,
  LocaleConfig,
} from './types';
import { SUPPORTED_LOCALES } from './types';
import { $locale } from './store';

/**
 * Get locale configuration
 */
export function getLocaleConfig(locale: Locale): LocaleConfig {
  const config = SUPPORTED_LOCALES.find((l) => l.locale === locale);
  if (!config) {
    console.warn(`Locale config not found for ${locale}, using da-DK`);
    return SUPPORTED_LOCALES[0]; // Default to Danish
  }
  return config;
}

/**
 * Format a number according to locale conventions
 *
 * Danish: 1.234,56
 * English: 1,234.56
 *
 * @param value - The number to format
 * @param options - Formatting options
 * @returns Formatted number string
 */
export function formatNumber(
  value: number,
  options?: Partial<NumberFormatOptions>
): string {
  const locale = options?.locale || $locale.get();
  const decimals = options?.decimals ?? 2;
  const useGrouping = options?.useGrouping ?? true;

  const config = getLocaleConfig(locale);

  // Format the number with the specified decimal places
  const parts = value.toFixed(decimals).split('.');
  let integerPart = parts[0];
  const decimalPart = parts[1];

  // Add thousands separators if grouping is enabled
  if (useGrouping && integerPart.length > 3) {
    integerPart = integerPart.replace(
      /\B(?=(\d{3})+(?!\d))/g,
      config.numberFormat.thousandsSeparator
    );
  }

  // Combine parts with locale-specific decimal separator
  if (decimals > 0 && decimalPart) {
    return `${integerPart}${config.numberFormat.decimalSeparator}${decimalPart}`;
  }

  return integerPart;
}

/**
 * Format a date according to locale conventions
 *
 * @param date - The date to format
 * @param options - Formatting options
 * @returns Formatted date string
 */
export function formatDate(
  date: Date,
  options?: Partial<DateFormatOptions>
): string {
  const locale = options?.locale || $locale.get();
  const dateStyle = options?.dateStyle || 'medium';
  const timeStyle = options?.timeStyle;

  try {
    const formatOptions: Intl.DateTimeFormatOptions = {};

    if (dateStyle) {
      formatOptions.dateStyle = dateStyle;
    }

    if (timeStyle) {
      formatOptions.timeStyle = timeStyle;
    }

    return new Intl.DateTimeFormat(locale, formatOptions).format(date);
  } catch (error) {
    console.error('Failed to format date:', error);
    return date.toISOString();
  }
}

/**
 * Parse a locale-formatted number string to a number
 *
 * @param value - The formatted number string
 * @param locale - The locale to parse from
 * @returns Parsed number
 */
export function parseNumber(value: string, locale?: Locale): number {
  const currentLocale = locale || $locale.get();
  const config = getLocaleConfig(currentLocale);

  // Remove thousands separators and replace decimal separator with '.'
  const normalized = value
    .replace(new RegExp(`\\${config.numberFormat.thousandsSeparator}`, 'g'), '')
    .replace(config.numberFormat.decimalSeparator, '.');

  return parseFloat(normalized);
}

/**
 * Get context pool for the current locale
 *
 * @param locale - Optional locale override
 * @returns Context pool for the locale
 */
export async function getContextPool(locale?: Locale): Promise<ContextPool> {
  const currentLocale = locale || $locale.get();

  try {
    const contextData = await import(
      `../../locales/${currentLocale}/contexts.json`
    );
    const data = contextData.default || contextData;

    return {
      locale: currentLocale,
      names: data.names?.male
        .concat(data.names?.female || [])
        .concat(data.names?.neutral || []) || [],
      places: data.places?.cities
        .concat(data.places?.locations || []) || [],
      currency: data.currency || { symbol: 'kr', name: 'kroner' },
      items: data.items || {},
    };
  } catch (error) {
    console.error(`Failed to load context pool for locale ${currentLocale}:`, error);

    // Return minimal fallback
    return {
      locale: currentLocale,
      names: [],
      places: [],
      currency: { symbol: 'kr', name: 'kroner' },
      items: {},
    };
  }
}

/**
 * Get a random item from a context category
 *
 * @param category - Category name (e.g., 'food', 'school', 'toys')
 * @param locale - Optional locale override
 * @returns Random item from the category
 */
export async function getRandomContext(
  category: 'names' | 'places' | keyof ContextPool['items'],
  locale?: Locale
): Promise<string> {
  const pool = await getContextPool(locale);

  let items: string[] = [];

  if (category === 'names') {
    items = pool.names;
  } else if (category === 'places') {
    items = pool.places;
  } else if (category in pool.items) {
    items = pool.items[category] || [];
  }

  if (items.length === 0) {
    console.warn(`No items found in context category: ${category}`);
    return '';
  }

  return items[Math.floor(Math.random() * items.length)];
}

/**
 * Get multiple random items from a context category (without duplicates)
 *
 * @param category - Category name
 * @param count - Number of items to retrieve
 * @param locale - Optional locale override
 * @returns Array of random items
 */
export async function getRandomContexts(
  category: 'names' | 'places' | keyof ContextPool['items'],
  count: number,
  locale?: Locale
): Promise<string[]> {
  const pool = await getContextPool(locale);

  let items: string[] = [];

  if (category === 'names') {
    items = pool.names;
  } else if (category === 'places') {
    items = pool.places;
  } else if (category in pool.items) {
    items = pool.items[category] || [];
  }

  if (items.length === 0) {
    console.warn(`No items found in context category: ${category}`);
    return [];
  }

  // Shuffle and take first 'count' items
  const shuffled = [...items].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, Math.min(count, shuffled.length));
}
