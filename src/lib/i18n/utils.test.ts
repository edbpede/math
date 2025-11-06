/**
 * I18n Utilities Tests
 *
 * Tests for locale-aware number and date formatting, and answer normalization.
 *
 * Requirements:
 * - 2.7: Format numbers according to language conventions
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  formatNumber,
  formatDate,
  parseNumber,
  getLocaleConfig,
  normalizeAnswer,
  compareAnswers,
  detectNumberFormat,
  parseNumberAuto,
} from './utils';
import { $locale } from './store';
import type { Locale } from './types';

describe('formatNumber', () => {
  describe('Danish locale (da-DK)', () => {
    beforeEach(() => {
      $locale.set('da-DK');
    });

    it('should format integers without decimals', () => {
      const result = formatNumber(1234, { decimals: 0 });
      expect(result).toBe('1.234');
    });

    it('should format numbers with default 2 decimal places', () => {
      const result = formatNumber(1234.56);
      expect(result).toBe('1.234,56');
    });

    it('should format numbers with custom decimal places', () => {
      const result = formatNumber(1234.5678, { decimals: 3 });
      expect(result).toBe('1.234,568');
    });

    it('should format numbers without grouping when disabled', () => {
      const result = formatNumber(1234.56, { useGrouping: false });
      expect(result).toBe('1234,56');
    });

    it('should format small numbers correctly', () => {
      const result = formatNumber(12.34);
      expect(result).toBe('12,34');
    });

    it('should format negative numbers correctly', () => {
      const result = formatNumber(-1234.56);
      expect(result).toBe('-1.234,56');
    });

    it('should format zero correctly', () => {
      const result = formatNumber(0);
      expect(result).toBe('0,00');
    });

    it('should format large numbers correctly', () => {
      const result = formatNumber(1234567.89);
      expect(result).toBe('1.234.567,89');
    });

    it('should round numbers to specified decimals', () => {
      const result = formatNumber(1234.567, { decimals: 2 });
      expect(result).toBe('1.234,57');
    });

    it('should handle very small decimals', () => {
      const result = formatNumber(0.0056, { decimals: 4 });
      expect(result).toBe('0,0056');
    });
  });

  describe('English locale (en-US)', () => {
    beforeEach(() => {
      $locale.set('en-US');
    });

    it('should format integers without decimals', () => {
      const result = formatNumber(1234, { decimals: 0 });
      expect(result).toBe('1,234');
    });

    it('should format numbers with default 2 decimal places', () => {
      const result = formatNumber(1234.56);
      expect(result).toBe('1,234.56');
    });

    it('should format numbers with custom decimal places', () => {
      const result = formatNumber(1234.5678, { decimals: 3 });
      expect(result).toBe('1,234.568');
    });

    it('should format numbers without grouping when disabled', () => {
      const result = formatNumber(1234.56, { useGrouping: false });
      expect(result).toBe('1234.56');
    });

    it('should format small numbers correctly', () => {
      const result = formatNumber(12.34);
      expect(result).toBe('12.34');
    });

    it('should format negative numbers correctly', () => {
      const result = formatNumber(-1234.56);
      expect(result).toBe('-1,234.56');
    });

    it('should format zero correctly', () => {
      const result = formatNumber(0);
      expect(result).toBe('0.00');
    });

    it('should format large numbers correctly', () => {
      const result = formatNumber(1234567.89);
      expect(result).toBe('1,234,567.89');
    });
  });

  describe('Explicit locale override', () => {
    it('should use explicit Danish locale', () => {
      const result = formatNumber(1234.56, { locale: 'da-DK' });
      expect(result).toBe('1.234,56');
    });

    it('should use explicit English locale', () => {
      const result = formatNumber(1234.56, { locale: 'en-US' });
      expect(result).toBe('1,234.56');
    });
  });

  describe('Edge cases', () => {
    it('should handle very large numbers', () => {
      const result = formatNumber(999999999.99, { locale: 'da-DK' });
      expect(result).toBe('999.999.999,99');
    });

    it('should handle numbers less than 1000 (no thousands separator)', () => {
      const result = formatNumber(999.99, { locale: 'da-DK' });
      expect(result).toBe('999,99');
    });

    it('should handle fractional numbers', () => {
      const result = formatNumber(0.5, { locale: 'da-DK' });
      expect(result).toBe('0,50');
    });
  });
});

describe('parseNumber', () => {
  describe('Danish locale (da-DK)', () => {
    it('should parse Danish-formatted integers', () => {
      const result = parseNumber('1.234', 'da-DK');
      expect(result).toBe(1234);
    });

    it('should parse Danish-formatted decimals', () => {
      const result = parseNumber('1.234,56', 'da-DK');
      expect(result).toBe(1234.56);
    });

    it('should parse numbers without thousands separator', () => {
      const result = parseNumber('1234,56', 'da-DK');
      expect(result).toBe(1234.56);
    });

    it('should parse small numbers', () => {
      const result = parseNumber('12,34', 'da-DK');
      expect(result).toBe(12.34);
    });

    it('should parse negative numbers', () => {
      const result = parseNumber('-1.234,56', 'da-DK');
      expect(result).toBe(-1234.56);
    });

    it('should parse zero', () => {
      const result = parseNumber('0', 'da-DK');
      expect(result).toBe(0);
    });

    it('should parse fractional numbers', () => {
      const result = parseNumber('0,5', 'da-DK');
      expect(result).toBe(0.5);
    });
  });

  describe('English locale (en-US)', () => {
    it('should parse English-formatted integers', () => {
      const result = parseNumber('1,234', 'en-US');
      expect(result).toBe(1234);
    });

    it('should parse English-formatted decimals', () => {
      const result = parseNumber('1,234.56', 'en-US');
      expect(result).toBe(1234.56);
    });

    it('should parse numbers without thousands separator', () => {
      const result = parseNumber('1234.56', 'en-US');
      expect(result).toBe(1234.56);
    });

    it('should parse small numbers', () => {
      const result = parseNumber('12.34', 'en-US');
      expect(result).toBe(12.34);
    });

    it('should parse negative numbers', () => {
      const result = parseNumber('-1,234.56', 'en-US');
      expect(result).toBe(-1234.56);
    });
  });

  describe('Auto-detection from store', () => {
    beforeEach(() => {
      $locale.set('da-DK');
    });

    it('should use current locale from store when not specified', () => {
      const result = parseNumber('1.234,56');
      expect(result).toBe(1234.56);
    });
  });

  describe('Edge cases', () => {
    it('should handle numbers with multiple thousands separators', () => {
      const result = parseNumber('1.234.567,89', 'da-DK');
      expect(result).toBe(1234567.89);
    });

    it('should handle plain numbers without formatting', () => {
      const result = parseNumber('1234.56', 'en-US');
      expect(result).toBe(1234.56);
    });

    it('should return NaN for invalid input', () => {
      const result = parseNumber('invalid', 'en-US');
      expect(result).toBeNaN();
    });
  });
});

describe('formatDate', () => {
  const testDate = new Date('2025-11-06T14:30:00Z');

  describe('Danish locale (da-DK)', () => {
    it('should format date with short style', () => {
      const result = formatDate(testDate, {
        locale: 'da-DK',
        dateStyle: 'short',
      });
      // Danish short date format (uses period separator)
      expect(result).toMatch(/\d{1,2}\.\d{1,2}\.\d{4}/);
    });

    it('should format date with medium style', () => {
      const result = formatDate(testDate, {
        locale: 'da-DK',
        dateStyle: 'medium',
      });
      // Should contain month name or abbreviation
      expect(result).toBeTruthy();
      expect(result.length).toBeGreaterThan(5);
    });

    it('should format date with long style', () => {
      const result = formatDate(testDate, {
        locale: 'da-DK',
        dateStyle: 'long',
      });
      // Should be longer format
      expect(result).toBeTruthy();
      expect(result.length).toBeGreaterThan(10);
    });

    it('should format date with time', () => {
      const result = formatDate(testDate, {
        locale: 'da-DK',
        dateStyle: 'medium',
        timeStyle: 'short',
      });
      // Should contain time
      expect(result).toBeTruthy();
      expect(result).toMatch(/\d{1,2}[:.]\d{2}/);
    });
  });

  describe('English locale (en-US)', () => {
    it('should format date with short style', () => {
      const result = formatDate(testDate, {
        locale: 'en-US',
        dateStyle: 'short',
      });
      // US short date format
      expect(result).toMatch(/\d{1,2}\/\d{1,2}\/\d{2,4}/);
    });

    it('should format date with medium style', () => {
      const result = formatDate(testDate, {
        locale: 'en-US',
        dateStyle: 'medium',
      });
      expect(result).toBeTruthy();
      expect(result.length).toBeGreaterThan(5);
    });

    it('should format date with time', () => {
      const result = formatDate(testDate, {
        locale: 'en-US',
        dateStyle: 'medium',
        timeStyle: 'short',
      });
      expect(result).toBeTruthy();
      expect(result).toMatch(/\d{1,2}:\d{2}/);
    });
  });

  describe('Auto-detection from store', () => {
    beforeEach(() => {
      $locale.set('da-DK');
    });

    it('should use current locale from store when not specified', () => {
      const result = formatDate(testDate, { dateStyle: 'medium' });
      expect(result).toBeTruthy();
    });
  });

  describe('Edge cases', () => {
    it('should handle dates far in the past', () => {
      const oldDate = new Date('1900-01-01');
      const result = formatDate(oldDate, {
        locale: 'en-US',
        dateStyle: 'medium',
      });
      expect(result).toBeTruthy();
    });

    it('should handle dates far in the future', () => {
      const futureDate = new Date('2099-12-31');
      const result = formatDate(futureDate, {
        locale: 'en-US',
        dateStyle: 'medium',
      });
      expect(result).toBeTruthy();
    });

    it('should fallback to error message on invalid date', () => {
      const invalidDate = new Date('invalid');
      const result = formatDate(invalidDate, { locale: 'en-US' });
      // Should return 'Invalid Date' for invalid dates
      expect(result).toBe('Invalid Date');
    });
  });
});

describe('getLocaleConfig', () => {
  it('should return Danish locale config', () => {
    const config = getLocaleConfig('da-DK');
    expect(config.locale).toBe('da-DK');
    expect(config.numberFormat.decimalSeparator).toBe(',');
    expect(config.numberFormat.thousandsSeparator).toBe('.');
  });

  it('should return English locale config', () => {
    const config = getLocaleConfig('en-US');
    expect(config.locale).toBe('en-US');
    expect(config.numberFormat.decimalSeparator).toBe('.');
    expect(config.numberFormat.thousandsSeparator).toBe(',');
  });

  it('should fallback to Danish for unknown locale', () => {
    const config = getLocaleConfig('unknown' as Locale);
    expect(config.locale).toBe('da-DK');
  });
});

describe('Round-trip formatting and parsing', () => {
  const testCases = [
    { value: 1234.56, label: 'standard number' },
    { value: 0.5, label: 'fractional number' },
    { value: 999999.99, label: 'large number' },
    { value: 12.34, label: 'small number' },
    { value: -1234.56, label: 'negative number' },
  ];

  describe('Danish locale', () => {
    testCases.forEach(({ value, label }) => {
      it(`should round-trip ${label}`, () => {
        const formatted = formatNumber(value, { locale: 'da-DK' });
        const parsed = parseNumber(formatted, 'da-DK');
        expect(parsed).toBeCloseTo(value, 2);
      });
    });
  });

  describe('English locale', () => {
    testCases.forEach(({ value, label }) => {
      it(`should round-trip ${label}`, () => {
        const formatted = formatNumber(value, { locale: 'en-US' });
        const parsed = parseNumber(formatted, 'en-US');
        expect(parsed).toBeCloseTo(value, 2);
      });
    });
  });
});

describe('normalizeAnswer', () => {
  describe('Danish locale', () => {
    beforeEach(() => {
      $locale.set('da-DK');
    });

    it('should normalize Danish-formatted numbers', () => {
      const result = normalizeAnswer('1.234,56', 'da-DK');
      expect(result).toBe(1234.56);
    });

    it('should normalize numbers with extra whitespace', () => {
      const result = normalizeAnswer('  1.234,56  ', 'da-DK');
      expect(result).toBe(1234.56);
    });

    it('should normalize text answers to lowercase', () => {
      const result = normalizeAnswer('Copenhagen', 'da-DK');
      expect(result).toBe('copenhagen');
    });

    it('should trim and lowercase text answers', () => {
      const result = normalizeAnswer('  Hello World  ', 'da-DK');
      expect(result).toBe('hello world');
    });

    it('should handle invalid number strings as text', () => {
      const result = normalizeAnswer('abc123', 'da-DK');
      expect(result).toBe('abc123');
    });
  });

  describe('English locale', () => {
    beforeEach(() => {
      $locale.set('en-US');
    });

    it('should normalize English-formatted numbers', () => {
      const result = normalizeAnswer('1,234.56', 'en-US');
      expect(result).toBe(1234.56);
    });

    it('should normalize numbers with extra whitespace', () => {
      const result = normalizeAnswer('  1,234.56  ', 'en-US');
      expect(result).toBe(1234.56);
    });
  });
});

describe('compareAnswers', () => {
  describe('Numeric comparisons', () => {
    it('should match identical numbers', () => {
      const result = compareAnswers('1234.56', '1234.56', 'en-US');
      expect(result).toBe(true);
    });

    it('should match numbers with different formats (Danish)', () => {
      const result = compareAnswers('1.234,56', 1234.56, 'da-DK');
      expect(result).toBe(true);
    });

    it('should match numbers with different formats (English)', () => {
      const result = compareAnswers('1,234.56', 1234.56, 'en-US');
      expect(result).toBe(true);
    });

    it('should match numbers within tolerance', () => {
      const result = compareAnswers('1234.56', 1234.57, 'en-US', 0.02);
      expect(result).toBe(true);
    });

    it('should not match numbers outside tolerance', () => {
      const result = compareAnswers('1234.56', 1234.60, 'en-US', 0.02);
      expect(result).toBe(false);
    });

    it('should use default tolerance of 0.01', () => {
      const result1 = compareAnswers('1234.56', 1234.565, 'en-US');
      expect(result1).toBe(true);

      const result2 = compareAnswers('1234.56', 1234.58, 'en-US');
      expect(result2).toBe(false);
    });

    it('should handle whitespace in user answers', () => {
      const result = compareAnswers('  1234.56  ', 1234.56, 'en-US');
      expect(result).toBe(true);
    });
  });

  describe('Text comparisons', () => {
    it('should match identical text answers', () => {
      const result = compareAnswers('Copenhagen', 'copenhagen', 'da-DK');
      expect(result).toBe(true);
    });

    it('should be case-insensitive for text answers', () => {
      const result = compareAnswers('HELLO', 'hello', 'en-US');
      expect(result).toBe(true);
    });

    it('should not match different text answers', () => {
      const result = compareAnswers('Copenhagen', 'Aarhus', 'da-DK');
      expect(result).toBe(false);
    });

    it('should handle whitespace in text answers', () => {
      const result = compareAnswers('  hello world  ', 'hello world', 'en-US');
      expect(result).toBe(true);
    });
  });

  describe('Mixed type comparisons', () => {
    it('should not match number with text', () => {
      const result = compareAnswers('1234', 'text', 'en-US');
      expect(result).toBe(false);
    });

    it('should not match text with number', () => {
      const result = compareAnswers('text', 1234, 'en-US');
      expect(result).toBe(false);
    });
  });

  describe('Cross-locale comparisons', () => {
    it('should match Danish format with numeric answer', () => {
      const result = compareAnswers('1.234,56', 1234.56, 'da-DK');
      expect(result).toBe(true);
    });

    it('should match English format with numeric answer', () => {
      const result = compareAnswers('1,234.56', 1234.56, 'en-US');
      expect(result).toBe(true);
    });
  });
});

describe('detectNumberFormat', () => {
  it('should detect Danish format (period thousands, comma decimal)', () => {
    expect(detectNumberFormat('1.234,56')).toBe('da-DK');
    expect(detectNumberFormat('12.345,67')).toBe('da-DK');
  });

  it('should detect English format (comma thousands, period decimal)', () => {
    expect(detectNumberFormat('1,234.56')).toBe('en-US');
    expect(detectNumberFormat('12,345.67')).toBe('en-US');
  });

  it('should detect Danish decimal (comma with 1-2 digits)', () => {
    expect(detectNumberFormat('12,5')).toBe('da-DK');
    expect(detectNumberFormat('12,56')).toBe('da-DK');
  });

  it('should detect English decimal (period with 1-2 digits)', () => {
    expect(detectNumberFormat('12.5')).toBe('en-US');
    expect(detectNumberFormat('12.56')).toBe('en-US');
  });

  it('should detect English thousands (comma with 3 digits)', () => {
    expect(detectNumberFormat('1,234')).toBe('en-US');
  });

  it('should detect Danish thousands (period with 3 digits)', () => {
    expect(detectNumberFormat('1.234')).toBe('da-DK');
  });

  it('should return null for ambiguous formats', () => {
    expect(detectNumberFormat('1234')).toBeNull();
    expect(detectNumberFormat('12')).toBeNull();
  });

  it('should handle complex numbers', () => {
    expect(detectNumberFormat('1.234.567,89')).toBe('da-DK');
    expect(detectNumberFormat('1,234,567.89')).toBe('en-US');
  });
});

describe('parseNumberAuto', () => {
  it('should auto-detect and parse Danish format', () => {
    const result = parseNumberAuto('1.234,56');
    expect(result).toBe(1234.56);
  });

  it('should auto-detect and parse English format', () => {
    const result = parseNumberAuto('1,234.56');
    expect(result).toBe(1234.56);
  });

  it('should use preferred locale for ambiguous input', () => {
    const result = parseNumberAuto('1234', 'da-DK');
    expect(result).toBe(1234);
  });

  it('should fall back to current locale from store', () => {
    $locale.set('da-DK');
    const result = parseNumberAuto('1234');
    expect(result).toBe(1234);
  });

  it('should handle complex Danish numbers', () => {
    const result = parseNumberAuto('1.234.567,89');
    expect(result).toBe(1234567.89);
  });

  it('should handle complex English numbers', () => {
    const result = parseNumberAuto('1,234,567.89');
    expect(result).toBe(1234567.89);
  });
});

describe('Answer normalization integration', () => {
  describe('Exercise answer validation scenarios', () => {
    it('should accept Danish-formatted answer for correct solution', () => {
      // User answers in Danish format, correct answer is number
      const isCorrect = compareAnswers('1.234,56', 1234.56, 'da-DK');
      expect(isCorrect).toBe(true);
    });

    it('should accept English-formatted answer for correct solution', () => {
      // User answers in English format, correct answer is number
      const isCorrect = compareAnswers('1,234.56', 1234.56, 'en-US');
      expect(isCorrect).toBe(true);
    });

    it('should accept text answer with different casing', () => {
      // User answers with different casing
      const isCorrect = compareAnswers('København', 'københavn', 'da-DK');
      expect(isCorrect).toBe(true);
    });

    it('should reject incorrect numeric answer', () => {
      // User answer is wrong
      const isCorrect = compareAnswers('1.234,56', 5678.90, 'da-DK');
      expect(isCorrect).toBe(false);
    });

    it('should handle sloppy user input (extra spaces)', () => {
      // User input has extra spaces
      const isCorrect = compareAnswers('  1234.56  ', 1234.56, 'en-US');
      expect(isCorrect).toBe(true);
    });

    it('should accept answer within tolerance for rounding', () => {
      // User rounds slightly differently
      const isCorrect = compareAnswers('12.35', 12.346, 'en-US', 0.01);
      expect(isCorrect).toBe(true);
    });
  });

  describe('Real-world exercise examples', () => {
    it('should handle price calculation (Danish)', () => {
      // Exercise: 3 items at 12.50 kr each = 37.50 kr
      const userAnswer = '37,50';
      const correctAnswer = 37.5;
      const isCorrect = compareAnswers(userAnswer, correctAnswer, 'da-DK');
      expect(isCorrect).toBe(true);
    });

    it('should handle distance calculation (English)', () => {
      // Exercise: Total distance = 123.45 miles
      const userAnswer = '123.45';
      const correctAnswer = 123.45;
      const isCorrect = compareAnswers(userAnswer, correctAnswer, 'en-US');
      expect(isCorrect).toBe(true);
    });

    it('should handle place name answer', () => {
      // Exercise: What city? Answer: Copenhagen
      const userAnswer = 'copenhagen';
      const correctAnswer = 'copenhagen';
      const isCorrect = compareAnswers(userAnswer, correctAnswer, 'da-DK');
      expect(isCorrect).toBe(true);
    });
  });
});
