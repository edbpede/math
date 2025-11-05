/**
 * Internationalization (i18n) Type Definitions
 * 
 * Type definitions for the translation system, context pools,
 * and language-specific content.
 * 
 * Requirements:
 * - 11.2: Template-based content extensibility with i18n support
 */

export type Locale = 'da-DK' | 'en-US';

export interface TranslationKey {
  key: string;
  params?: Record<string, string | number>;
}

export interface TranslationCategory {
  [key: string]: string | TranslationCategory;
}

export interface Translations {
  common: TranslationCategory;
  auth: TranslationCategory;
  navigation: TranslationCategory;
  competencies: TranslationCategory;
  exercises: TranslationCategory;
  feedback: TranslationCategory;
  hints: TranslationCategory;
  contexts: TranslationCategory;
  errors: TranslationCategory;
}

export interface ContextPool {
  locale: Locale;
  names: string[];
  places: string[];
  currency: {
    symbol: string;
    name: string;
  };
  items: Record<string, string[]>;
}

export interface NumberFormatOptions {
  locale: Locale;
  decimals?: number;
  useGrouping?: boolean;
}

export interface DateFormatOptions {
  locale: Locale;
  dateStyle?: 'short' | 'medium' | 'long' | 'full';
  timeStyle?: 'short' | 'medium' | 'long' | 'full';
}

export interface LocaleConfig {
  locale: Locale;
  name: string;
  nativeName: string;
  direction: 'ltr' | 'rtl';
  numberFormat: {
    decimalSeparator: string;
    thousandsSeparator: string;
  };
  dateFormat: {
    short: string;
    medium: string;
    long: string;
  };
}

export const SUPPORTED_LOCALES: LocaleConfig[] = [
  {
    locale: 'da-DK',
    name: 'Danish',
    nativeName: 'Dansk',
    direction: 'ltr',
    numberFormat: {
      decimalSeparator: ',',
      thousandsSeparator: '.',
    },
    dateFormat: {
      short: 'dd/MM/yyyy',
      medium: 'd. MMM yyyy',
      long: 'd. MMMM yyyy',
    },
  },
  {
    locale: 'en-US',
    name: 'English',
    nativeName: 'English',
    direction: 'ltr',
    numberFormat: {
      decimalSeparator: '.',
      thousandsSeparator: ',',
    },
    dateFormat: {
      short: 'MM/dd/yyyy',
      medium: 'MMM d, yyyy',
      long: 'MMMM d, yyyy',
    },
  },
];

export type TranslationFunction = (
  key: string,
  params?: Record<string, string | number>
) => string;

export interface I18nContext {
  locale: Locale;
  t: TranslationFunction;
  changeLocale: (locale: Locale) => void;
  formatNumber: (value: number, options?: NumberFormatOptions) => string;
  formatDate: (date: Date, options?: DateFormatOptions) => string;
}
