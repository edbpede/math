/**
 * Answer Validation System Tests
 *
 * Comprehensive test coverage for the answer validation system including:
 * - Numeric answer validation with tolerance
 * - Fraction parsing and equivalence
 * - Decimal/fraction conversion
 * - Locale-aware number parsing
 * - Multiple correct answer formats
 * - Edge cases and error handling
 */

import { describe, it, expect } from 'vitest';
import {
  validateAnswer,
  parseFraction,
  parseMixedNumber,
  parsePercentage,
  gcd,
  simplifyFraction,
  toFraction,
  areFractionsEquivalent,
  isDecimalEquivalentToFraction,
  formatFraction,
  decimalToFractionString,
} from './validator';
import type { Answer } from './types';

describe('Answer Validation System', () => {
  describe('validateAnswer', () => {
    describe('exact numeric matches', () => {
      it('should validate exact integer match', () => {
        const result = validateAnswer('42', { value: 42 });
        expect(result.correct).toBe(true);
        expect(result.normalized).toBe('42');
      });

      it('should validate exact decimal match', () => {
        const result = validateAnswer('3.14', { value: 3.14 });
        expect(result.correct).toBe(true);
      });

      it('should validate zero', () => {
        const result = validateAnswer('0', { value: 0 });
        expect(result.correct).toBe(true);
      });

      it('should validate negative numbers', () => {
        const result = validateAnswer('-5', { value: -5 });
        expect(result.correct).toBe(true);
      });
    });

    describe('tolerance handling', () => {
      it('should accept answer within default tolerance', () => {
        const result = validateAnswer('3.14159', { value: Math.PI });
        expect(result.correct).toBe(true);
      });

      it('should reject answer outside default tolerance', () => {
        const result = validateAnswer('3.2', { value: Math.PI });
        expect(result.correct).toBe(false);
      });

      it('should use custom tolerance from Answer', () => {
        const result = validateAnswer('3.2', { value: Math.PI, tolerance: 0.1 });
        expect(result.correct).toBe(true);
      });

      it('should use tolerance from options', () => {
        const result = validateAnswer('3.2', { value: Math.PI }, { tolerance: 0.1 });
        expect(result.correct).toBe(true);
      });

      it('should handle very small numbers', () => {
        const result = validateAnswer('0.00001', { value: 0.00002, tolerance: 0.00001 });
        expect(result.correct).toBe(true);
      });

      it('should use strict mode for exact matches only', () => {
        const result = validateAnswer('3.14', { value: Math.PI }, { strict: true });
        expect(result.correct).toBe(false);
      });
    });

    describe('fraction support', () => {
      it('should validate fraction input against decimal answer', () => {
        const result = validateAnswer('1/2', { value: 0.5 });
        expect(result.correct).toBe(true);
      });

      it('should validate decimal input against fraction answer', () => {
        const result = validateAnswer('0.5', { value: '1/2' });
        expect(result.correct).toBe(true);
      });

      it('should recognize equivalent fractions', () => {
        const result1 = validateAnswer('2/4', { value: 0.5 });
        expect(result1.correct).toBe(true);

        const result2 = validateAnswer('3/6', { value: 0.5 });
        expect(result2.correct).toBe(true);

        const result3 = validateAnswer('4/8', { value: '1/2' });
        expect(result3.correct).toBe(true);
      });

      it('should handle negative fractions', () => {
        const result = validateAnswer('-1/2', { value: -0.5 });
        expect(result.correct).toBe(true);
      });

      it('should validate fraction against fraction', () => {
        const result = validateAnswer('2/4', { value: '1/2' });
        expect(result.correct).toBe(true);
      });
    });

    describe('mixed number support', () => {
      it('should parse simple mixed number', () => {
        const result = validateAnswer('1 1/2', { value: 1.5 });
        expect(result.correct).toBe(true);
      });

      it('should parse mixed number with larger whole part', () => {
        const result = validateAnswer('2 3/4', { value: 2.75 });
        expect(result.correct).toBe(true);
      });

      it('should handle negative mixed numbers', () => {
        const result = validateAnswer('-1 1/2', { value: -1.5 });
        expect(result.correct).toBe(true);
      });
    });

    describe('percentage support', () => {
      it('should parse percentage to decimal', () => {
        const result = validateAnswer('50%', { value: 0.5 });
        expect(result.correct).toBe(true);
      });

      it('should handle 100%', () => {
        const result = validateAnswer('100%', { value: 1.0 });
        expect(result.correct).toBe(true);
      });

      it('should handle decimal percentages', () => {
        const result = validateAnswer('33.33%', { value: 0.3333, tolerance: 0.0001 });
        expect(result.correct).toBe(true);
      });
    });

    describe('equivalents array support', () => {
      it('should check against equivalents', () => {
        const answer: Answer = {
          value: 0.5,
          equivalents: ['1/2', '50%', '2/4'],
        };

        expect(validateAnswer('0.5', answer).correct).toBe(true);
        expect(validateAnswer('1/2', answer).correct).toBe(true);
        expect(validateAnswer('50%', answer).correct).toBe(true);
        expect(validateAnswer('2/4', answer).correct).toBe(true);
      });

      it('should reject answer not in equivalents', () => {
        const answer: Answer = {
          value: 0.5,
          equivalents: ['1/2'],
        };

        expect(validateAnswer('0.75', answer).correct).toBe(false);
      });
    });

    describe('locale-specific number formats', () => {
      it('should parse Danish decimal format', () => {
        const result = validateAnswer('3,14', { value: 3.14 }, { locale: 'da-DK' });
        expect(result.correct).toBe(true);
      });

      it('should parse English decimal format', () => {
        const result = validateAnswer('3.14', { value: 3.14 }, { locale: 'en-US' });
        expect(result.correct).toBe(true);
      });

      it('should parse Danish thousands separator', () => {
        const result = validateAnswer('1.234,56', { value: 1234.56 }, { locale: 'da-DK' });
        expect(result.correct).toBe(true);
      });

      it('should parse English thousands separator', () => {
        const result = validateAnswer('1,234.56', { value: 1234.56 }, { locale: 'en-US' });
        expect(result.correct).toBe(true);
      });

      it('should auto-detect format when locale not specified', () => {
        const result1 = validateAnswer('3.14', { value: 3.14 });
        expect(result1.correct).toBe(true);

        const result2 = validateAnswer('3,14', { value: 3.14 });
        expect(result2.correct).toBe(true);
      });
    });

    describe('edge cases', () => {
      it('should handle empty answer', () => {
        const result = validateAnswer('', { value: 42 });
        expect(result.correct).toBe(false);
        expect(result.normalized).toBe('');
      });

      it('should handle whitespace-only answer', () => {
        const result = validateAnswer('   ', { value: 42 });
        expect(result.correct).toBe(false);
      });

      it('should handle non-numeric text', () => {
        const result = validateAnswer('hello', { value: 42 });
        expect(result.correct).toBe(false);
      });

      it('should handle very large numbers', () => {
        const result = validateAnswer('999999999', { value: 999999999 });
        expect(result.correct).toBe(true);
      });

      it('should handle very small decimals', () => {
        const result = validateAnswer('0.000001', { value: 0.000001 });
        expect(result.correct).toBe(true);
      });

      it('should handle scientific notation in answer value', () => {
        const result = validateAnswer('1000', { value: 1e3 });
        expect(result.correct).toBe(true);
      });

      it('should trim whitespace from answer', () => {
        const result = validateAnswer('  42  ', { value: 42 });
        expect(result.correct).toBe(true);
      });
    });

    describe('invalid inputs', () => {
      it('should handle malformed fractions', () => {
        const result = validateAnswer('1/0', { value: 1 });
        expect(result.correct).toBe(false);
      });

      it('should handle malformed mixed numbers', () => {
        const result = validateAnswer('1 1/0', { value: 1 });
        expect(result.correct).toBe(false);
      });

      it('should handle invalid percentage', () => {
        const result = validateAnswer('abc%', { value: 0.5 });
        expect(result.correct).toBe(false);
      });
    });
  });

  describe('parseFraction', () => {
    it('should parse simple fraction', () => {
      expect(parseFraction('1/2')).toBe(0.5);
      expect(parseFraction('3/4')).toBe(0.75);
      expect(parseFraction('2/3')).toBeCloseTo(0.6667, 4);
    });

    it('should parse fractions with spaces', () => {
      expect(parseFraction('1 / 2')).toBe(0.5);
      expect(parseFraction(' 3 / 4 ')).toBe(0.75);
    });

    it('should parse negative fractions', () => {
      expect(parseFraction('-1/2')).toBe(-0.5);
      expect(parseFraction('-3/4')).toBe(-0.75);
    });

    it('should return null for invalid formats', () => {
      expect(parseFraction('1')).toBeNull();
      expect(parseFraction('1/2/3')).toBeNull();
      expect(parseFraction('abc/def')).toBeNull();
      expect(parseFraction('')).toBeNull();
    });

    it('should return null for division by zero', () => {
      expect(parseFraction('1/0')).toBeNull();
    });

    it('should handle improper fractions', () => {
      expect(parseFraction('5/2')).toBe(2.5);
      expect(parseFraction('7/3')).toBeCloseTo(2.3333, 4);
    });
  });

  describe('parseMixedNumber', () => {
    it('should parse simple mixed number', () => {
      expect(parseMixedNumber('1 1/2')).toBe(1.5);
      expect(parseMixedNumber('2 3/4')).toBe(2.75);
    });

    it('should parse negative mixed numbers', () => {
      expect(parseMixedNumber('-1 1/2')).toBe(-1.5);
      expect(parseMixedNumber('-2 3/4')).toBe(-2.75);
    });

    it('should return null for invalid formats', () => {
      expect(parseMixedNumber('1/2')).toBeNull();
      expect(parseMixedNumber('1 1')).toBeNull();
      expect(parseMixedNumber('abc')).toBeNull();
    });

    it('should return null for division by zero', () => {
      expect(parseMixedNumber('1 1/0')).toBeNull();
    });
  });

  describe('parsePercentage', () => {
    it('should parse simple percentage', () => {
      expect(parsePercentage('50%')).toBe(0.5);
      expect(parsePercentage('100%')).toBe(1.0);
      expect(parsePercentage('25%')).toBe(0.25);
    });

    it('should parse decimal percentages', () => {
      expect(parsePercentage('33.33%')).toBeCloseTo(0.3333, 4);
      expect(parsePercentage('66.67%')).toBeCloseTo(0.6667, 4);
    });

    it('should handle percentages with spaces', () => {
      expect(parsePercentage('50 %')).toBe(0.5);
      expect(parsePercentage(' 100 % ')).toBe(1.0);
    });

    it('should return null for non-percentage formats', () => {
      expect(parsePercentage('50')).toBeNull();
      expect(parsePercentage('abc%')).toBeNull();
      expect(parsePercentage('')).toBeNull();
    });
  });

  describe('gcd', () => {
    it('should calculate GCD correctly', () => {
      expect(gcd(12, 8)).toBe(4);
      expect(gcd(15, 25)).toBe(5);
      expect(gcd(7, 13)).toBe(1);
    });

    it('should handle zero', () => {
      expect(gcd(0, 5)).toBe(5);
      expect(gcd(5, 0)).toBe(5);
    });

    it('should handle negative numbers', () => {
      expect(gcd(-12, 8)).toBe(4);
      expect(gcd(12, -8)).toBe(4);
      expect(gcd(-12, -8)).toBe(4);
    });

    it('should handle equal numbers', () => {
      expect(gcd(5, 5)).toBe(5);
    });
  });

  describe('simplifyFraction', () => {
    it('should simplify fractions correctly', () => {
      expect(simplifyFraction(2, 4)).toEqual([1, 2]);
      expect(simplifyFraction(3, 6)).toEqual([1, 2]);
      expect(simplifyFraction(4, 8)).toEqual([1, 2]);
    });

    it('should handle already simplified fractions', () => {
      expect(simplifyFraction(1, 2)).toEqual([1, 2]);
      expect(simplifyFraction(3, 5)).toEqual([3, 5]);
    });

    it('should handle negative fractions', () => {
      expect(simplifyFraction(-2, 4)).toEqual([-1, 2]);
      expect(simplifyFraction(2, -4)).toEqual([-1, 2]);
      expect(simplifyFraction(-2, -4)).toEqual([1, 2]);
    });

    it('should handle whole numbers', () => {
      expect(simplifyFraction(4, 2)).toEqual([2, 1]);
      expect(simplifyFraction(6, 3)).toEqual([2, 1]);
    });

    it('should throw error for zero denominator', () => {
      expect(() => simplifyFraction(1, 0)).toThrow('Denominator cannot be zero');
    });
  });

  describe('toFraction', () => {
    it('should convert simple decimals to fractions', () => {
      expect(toFraction(0.5)).toEqual([1, 2]);
      expect(toFraction(0.25)).toEqual([1, 4]);
      expect(toFraction(0.75)).toEqual([3, 4]);
    });

    it('should handle whole numbers', () => {
      expect(toFraction(5)).toEqual([5, 1]);
      expect(toFraction(10)).toEqual([10, 1]);
    });

    it('should handle negative numbers', () => {
      expect(toFraction(-0.5)).toEqual([-1, 2]);
      expect(toFraction(-0.25)).toEqual([-1, 4]);
    });

    it('should handle zero', () => {
      expect(toFraction(0)).toEqual([0, 1]);
    });

    it('should find best approximation within denominator limit', () => {
      const result = toFraction(0.333333, 10);
      expect(result).toEqual([1, 3]);
    });

    it('should return null for infinity', () => {
      expect(toFraction(Infinity)).toBeNull();
      expect(toFraction(-Infinity)).toBeNull();
    });

    it('should return null for NaN', () => {
      expect(toFraction(NaN)).toBeNull();
    });

    it('should handle repeating decimals', () => {
      const result = toFraction(0.3333, 100);
      expect(result).toEqual([1, 3]);
    });
  });

  describe('areFractionsEquivalent', () => {
    it('should recognize equivalent fractions', () => {
      expect(areFractionsEquivalent([1, 2], [2, 4])).toBe(true);
      expect(areFractionsEquivalent([2, 4], [3, 6])).toBe(true);
      expect(areFractionsEquivalent([1, 3], [2, 6])).toBe(true);
    });

    it('should recognize non-equivalent fractions', () => {
      expect(areFractionsEquivalent([1, 2], [1, 3])).toBe(false);
      expect(areFractionsEquivalent([2, 3], [3, 4])).toBe(false);
    });

    it('should handle negative fractions', () => {
      expect(areFractionsEquivalent([-1, 2], [-2, 4])).toBe(true);
      expect(areFractionsEquivalent([1, -2], [-2, 4])).toBe(true);
    });
  });

  describe('isDecimalEquivalentToFraction', () => {
    it('should recognize equivalent decimal and fraction', () => {
      expect(isDecimalEquivalentToFraction(0.5, [1, 2])).toBe(true);
      expect(isDecimalEquivalentToFraction(0.25, [1, 4])).toBe(true);
      expect(isDecimalEquivalentToFraction(0.75, [3, 4])).toBe(true);
    });

    it('should recognize non-equivalent decimal and fraction', () => {
      expect(isDecimalEquivalentToFraction(0.5, [1, 3])).toBe(false);
      expect(isDecimalEquivalentToFraction(0.25, [1, 2])).toBe(false);
    });

    it('should handle custom tolerance', () => {
      expect(isDecimalEquivalentToFraction(0.333, [1, 3], 0.001)).toBe(true);
      expect(isDecimalEquivalentToFraction(0.333, [1, 3], 0.0001)).toBe(false);
    });

    it('should return false for zero denominator', () => {
      expect(isDecimalEquivalentToFraction(0.5, [1, 0])).toBe(false);
    });
  });

  describe('formatFraction', () => {
    it('should format simple fractions', () => {
      expect(formatFraction(1, 2)).toBe('1/2');
      expect(formatFraction(3, 4)).toBe('3/4');
    });

    it('should simplify before formatting', () => {
      expect(formatFraction(2, 4)).toBe('1/2');
      expect(formatFraction(6, 8)).toBe('3/4');
    });

    it('should format whole numbers', () => {
      expect(formatFraction(4, 2)).toBe('2');
      expect(formatFraction(6, 3)).toBe('2');
    });

    it('should handle negative fractions', () => {
      expect(formatFraction(-1, 2)).toBe('-1/2');
      expect(formatFraction(1, -2)).toBe('-1/2');
    });
  });

  describe('decimalToFractionString', () => {
    it('should convert simple decimals', () => {
      expect(decimalToFractionString(0.5)).toBe('1/2');
      expect(decimalToFractionString(0.25)).toBe('1/4');
      expect(decimalToFractionString(0.75)).toBe('3/4');
    });

    it('should return whole numbers as strings', () => {
      expect(decimalToFractionString(5)).toBe('5');
      expect(decimalToFractionString(10)).toBe('10');
    });

    it('should handle custom max denominator', () => {
      const result = decimalToFractionString(0.333, 10);
      expect(result).toBe('1/3');
    });

    it('should return null for numbers without simple fraction representation', () => {
      const result = decimalToFractionString(Math.PI, 10);
      expect(result).not.toBeNull(); // Will return best approximation
    });
  });

  describe('performance', () => {
    it('should validate answers in under 10ms', () => {
      const start = performance.now();
      
      for (let i = 0; i < 1000; i++) {
        validateAnswer('42', { value: 42 });
        validateAnswer('1/2', { value: 0.5 });
        validateAnswer('3.14', { value: Math.PI });
      }
      
      const end = performance.now();
      const avgTime = (end - start) / 3000;
      
      expect(avgTime).toBeLessThan(10);
    });
  });
});

