/**
 * Answer Validation System
 *
 * Provides comprehensive answer validation with support for:
 * - Numeric answers with tolerance
 * - Fraction/decimal equivalence (0.5 = 1/2 = 2/4)
 * - Multiple correct answer formats
 * - Locale-aware number parsing
 * - Mathematical equivalence checking
 *
 * Requirements:
 * - 3.6: Validate answers against correct solutions including mathematical equivalences
 * - 8.1: Validation must complete within 1 second (target <10ms)
 */

import type { Answer, ValidationResult } from './types';
import type { Locale } from '../i18n/types';
import { parseNumber, parseNumberAuto } from '../i18n/utils';

/**
 * Options for answer validation
 */
export interface ValidationOptions {
  /** Locale for number parsing (defaults to auto-detect) */
  locale?: Locale;
  /** Custom tolerance override (defaults to Answer.tolerance or 0.01) */
  tolerance?: number;
  /** Whether to enable strict mode (exact matches only) */
  strict?: boolean;
}

/**
 * Default tolerance for numeric comparisons
 */
const DEFAULT_TOLERANCE = 0.01;

/**
 * Maximum denominator for decimal-to-fraction conversion
 */
const MAX_FRACTION_DENOMINATOR = 1000;

/**
 * Validate a user's answer against the correct answer
 *
 * Supports multiple formats:
 * - Integers: "42"
 * - Decimals: "3.14" (English), "3,14" (Danish)
 * - Fractions: "1/2", "3/4", "2/4"
 * - Mixed numbers: "1 1/2" (converted to improper fraction)
 * - Percentages: "50%" → 0.5
 *
 * @param userAnswer - The user's answer as a string
 * @param correctAnswer - The correct answer with optional equivalents
 * @param options - Validation options
 * @returns ValidationResult with correct flag and normalized value
 */
export function validateAnswer(
  userAnswer: string,
  correctAnswer: Answer,
  options: ValidationOptions = {}
): ValidationResult {
  const trimmed = userAnswer.trim();
  
  if (trimmed === '') {
    return { correct: false, normalized: '' };
  }

  // Extract tolerance
  const tolerance = options.strict
    ? 0
    : options.tolerance ?? correctAnswer.tolerance ?? DEFAULT_TOLERANCE;

  // Parse the correct answer to a comparable format
  const correctValue = parseAnswerValue(correctAnswer.value);
  
  if (correctValue === null) {
    console.warn('Failed to parse correct answer:', correctAnswer.value);
    return { correct: false, normalized: trimmed };
  }

  // Parse the user's answer
  const userValue = parseUserAnswer(trimmed, options.locale);
  
  if (userValue === null) {
    return { correct: false, normalized: trimmed };
  }

  // Check if user answer matches correct answer
  if (compareValues(userValue, correctValue, tolerance)) {
    return { correct: true, normalized: String(userValue) };
  }

  // Check against equivalents if provided
  if (correctAnswer.equivalents && correctAnswer.equivalents.length > 0) {
    for (const equivalent of correctAnswer.equivalents) {
      const equivalentValue = parseAnswerValue(equivalent);
      if (equivalentValue !== null && compareValues(userValue, equivalentValue, tolerance)) {
        return { correct: true, normalized: String(userValue) };
      }
    }
  }

  return { correct: false, normalized: String(userValue) };
}

/**
 * Parse an answer value (from Answer type) to a number
 *
 * @param value - The answer value (string or number)
 * @returns Parsed number or null if invalid
 */
function parseAnswerValue(value: string | number): number | null {
  if (typeof value === 'number') {
    return isNaN(value) ? null : value;
  }

  // Try parsing as fraction first
  const fractionValue = parseFraction(value);
  if (fractionValue !== null) {
    return fractionValue;
  }

  // Try parsing as percentage
  const percentValue = parsePercentage(value);
  if (percentValue !== null) {
    return percentValue;
  }

  // Try parsing as number
  const numValue = parseFloat(value);
  return isNaN(numValue) ? null : numValue;
}

/**
 * Parse a user's answer to a number
 *
 * Handles multiple formats and locale-specific number formats
 *
 * @param answer - The user's answer string
 * @param locale - Optional locale for number parsing
 * @returns Parsed number or null if invalid
 */
function parseUserAnswer(answer: string, locale?: Locale): number | null {
  const trimmed = answer.trim();

  // Check if it looks like a fraction or mixed number
  const hasFractionSlash = trimmed.includes('/');
  
  // Try parsing as mixed number first (e.g., "1 1/2")
  const mixedValue = parseMixedNumber(trimmed);
  if (mixedValue !== null && isFinite(mixedValue)) {
    return mixedValue;
  }

  // Try parsing as fraction
  const fractionValue = parseFraction(trimmed);
  if (fractionValue !== null && isFinite(fractionValue)) {
    return fractionValue;
  }

  // If it looks like a fraction but parsing failed, reject it
  // (prevents "1/0" from being parsed as "1" by other parsers)
  if (hasFractionSlash) {
    return null;
  }

  // Try parsing as percentage
  const percentValue = parsePercentage(trimmed);
  if (percentValue !== null && isFinite(percentValue)) {
    return percentValue;
  }

  // Check if it's a locale-formatted number (contains comma as potential decimal separator)
  // Only try parseFloat if it doesn't look like a locale-formatted number
  const hasComma = trimmed.includes(',');
  const hasMultipleSeparators = (trimmed.match(/[.,]/g) || []).length > 1;
  
  if (!hasComma || hasMultipleSeparators) {
    // Try parsing as plain number (handles English format and simple numbers)
    const plainValue = parseFloat(trimmed);
    if (!isNaN(plainValue) && isFinite(plainValue)) {
      // Verify that parseFloat consumed the entire string (or just trailing whitespace)
      // This prevents partial parsing
      const stringified = plainValue.toString();
      const trimmedInput = trimmed.replace(/\s+/g, '');
      if (trimmedInput === stringified || trimmedInput === '-' + stringified) {
        return plainValue;
      }
    }
  }

  // Try parsing as locale-specific number (for formatted numbers)
  try {
    const numValue = locale ? parseNumber(trimmed, locale) : parseNumberAuto(trimmed, locale);
    return isNaN(numValue) || !isFinite(numValue) ? null : numValue;
  } catch {
    return null;
  }
}

/**
 * Compare two numeric values with tolerance
 *
 * @param value1 - First value
 * @param value2 - Second value
 * @param tolerance - Tolerance for comparison
 * @returns True if values are equal within tolerance
 */
function compareValues(value1: number, value2: number, tolerance: number): boolean {
  // Check for exact equality first (handles 0 and very small numbers)
  if (value1 === value2) {
    return true;
  }

  // Compare with tolerance
  return Math.abs(value1 - value2) <= tolerance;
}

/**
 * Calculate the greatest common divisor (GCD) of two numbers
 *
 * Uses Euclidean algorithm for efficiency
 *
 * @param a - First number
 * @param b - Second number
 * @returns GCD of a and b
 */
export function gcd(a: number, b: number): number {
  a = Math.abs(Math.floor(a));
  b = Math.abs(Math.floor(b));
  
  while (b !== 0) {
    const temp = b;
    b = a % b;
    a = temp;
  }
  
  return a;
}

/**
 * Simplify a fraction to its lowest terms
 *
 * @param numerator - The numerator
 * @param denominator - The denominator
 * @returns Simplified fraction as [numerator, denominator]
 */
export function simplifyFraction(numerator: number, denominator: number): [number, number] {
  if (denominator === 0) {
    throw new Error('Denominator cannot be zero');
  }

  // Handle negative fractions (keep sign in numerator)
  if (denominator < 0) {
    numerator = -numerator;
    denominator = -denominator;
  }

  const divisor = gcd(numerator, denominator);
  return [numerator / divisor, denominator / divisor];
}

/**
 * Parse a fraction string to a decimal number
 *
 * Supports formats:
 * - "1/2" → 0.5
 * - "3/4" → 0.75
 * - "-1/2" → -0.5
 *
 * @param input - The fraction string
 * @returns Decimal value or null if invalid
 */
export function parseFraction(input: string): number | null {
  const trimmed = input.trim();
  
  // Match fraction pattern: optional sign, digits, slash, digits
  const fractionPattern = /^(-?\d+)\s*\/\s*(\d+)$/;
  const match = trimmed.match(fractionPattern);
  
  if (!match) {
    return null;
  }

  const numerator = parseInt(match[1], 10);
  const denominator = parseInt(match[2], 10);

  // Check for division by zero
  if (denominator === 0) {
    return null;
  }

  return numerator / denominator;
}

/**
 * Parse a mixed number to a decimal
 *
 * Supports formats:
 * - "1 1/2" → 1.5
 * - "2 3/4" → 2.75
 * - "-1 1/2" → -1.5
 *
 * @param input - The mixed number string
 * @returns Decimal value or null if invalid
 */
export function parseMixedNumber(input: string): number | null {
  const trimmed = input.trim();
  
  // Match mixed number pattern: optional sign, digits, space, digits/digits
  const mixedPattern = /^(-?)(\d+)\s+(\d+)\s*\/\s*(\d+)$/;
  const match = trimmed.match(mixedPattern);
  
  if (!match) {
    return null;
  }

  const sign = match[1] === '-' ? -1 : 1;
  const whole = parseInt(match[2], 10);
  const numerator = parseInt(match[3], 10);
  const denominator = parseInt(match[4], 10);

  // Check for division by zero
  if (denominator === 0) {
    return null;
  }

  // Convert to improper fraction then to decimal
  const fraction = numerator / denominator;
  return sign * (whole + fraction);
}

/**
 * Parse a percentage string to a decimal
 *
 * Supports formats:
 * - "50%" → 0.5
 * - "100%" → 1.0
 * - "33.33%" → 0.3333
 *
 * @param input - The percentage string
 * @returns Decimal value or null if invalid
 */
export function parsePercentage(input: string): number | null {
  const trimmed = input.trim();
  
  if (!trimmed.endsWith('%')) {
    return null;
  }

  const numPart = trimmed.slice(0, -1).trim();
  const value = parseFloat(numPart);
  
  if (isNaN(value)) {
    return null;
  }

  return value / 100;
}

/**
 * Convert a decimal to a fraction
 *
 * Attempts to find the simplest fraction representation
 * within a reasonable denominator limit.
 *
 * @param decimal - The decimal number
 * @param maxDenominator - Maximum allowed denominator (default: 1000)
 * @returns Fraction as [numerator, denominator] or null if not representable
 */
export function toFraction(
  decimal: number,
  maxDenominator: number = MAX_FRACTION_DENOMINATOR
): [number, number] | null {
  if (!isFinite(decimal)) {
    return null;
  }

  // Handle whole numbers
  if (Number.isInteger(decimal)) {
    return [decimal, 1];
  }

  // Handle negative numbers
  const sign = decimal < 0 ? -1 : 1;
  const absDecimal = Math.abs(decimal);

  // Use continued fractions algorithm for best approximation
  // Initialize with convergents h_{-1}/k_{-1} = 1/0 and h_0/k_0 = a_0/1
  let prevNum = 0;
  let prevDen = 1;
  let currNum = 1;
  let currDen = 0;
  let x = absDecimal;

  for (let i = 0; i < 100; i++) {
    const a = Math.floor(x);
    
    // Calculate next convergent
    const nextNum = a * currNum + prevNum;
    const nextDen = a * currDen + prevDen;

    // Check if we've exceeded max denominator
    if (nextDen > maxDenominator) {
      // Use current convergent (before exceeding limit)
      break;
    }

    // Update convergents
    prevNum = currNum;
    prevDen = currDen;
    currNum = nextNum;
    currDen = nextDen;

    // Check if we've found a good enough approximation
    if (currDen > 0 && Math.abs(currNum / currDen - absDecimal) < 1e-10) {
      break;
    }

    // Calculate next term
    const fractional = x - a;
    if (fractional < 1e-10) {
      break;
    }
    x = 1 / fractional;
    
    if (!isFinite(x)) {
      break;
    }
  }

  // Apply sign to numerator
  const numerator = sign * currNum;
  const denominator = currDen;

  // Handle edge case where we ended with 0 denominator
  if (denominator === 0) {
    return [sign, 1];
  }

  // Simplify the fraction
  const simplified = simplifyFraction(numerator, denominator);
  
  return simplified;
}

/**
 * Check if two fractions are equivalent
 *
 * @param f1 - First fraction as [numerator, denominator]
 * @param f2 - Second fraction as [numerator, denominator]
 * @returns True if fractions are equivalent
 */
export function areFractionsEquivalent(
  f1: [number, number],
  f2: [number, number]
): boolean {
  // Simplify both fractions
  const [n1, d1] = simplifyFraction(f1[0], f1[1]);
  const [n2, d2] = simplifyFraction(f2[0], f2[1]);

  // Compare simplified forms
  return n1 === n2 && d1 === d2;
}

/**
 * Check if a decimal is equivalent to a fraction
 *
 * @param decimal - The decimal number
 * @param fraction - The fraction as [numerator, denominator]
 * @param tolerance - Tolerance for comparison (default: 1e-10)
 * @returns True if decimal and fraction are equivalent within tolerance
 */
export function isDecimalEquivalentToFraction(
  decimal: number,
  fraction: [number, number],
  tolerance: number = 1e-10
): boolean {
  const [numerator, denominator] = fraction;
  
  if (denominator === 0) {
    return false;
  }

  const fractionValue = numerator / denominator;
  return Math.abs(decimal - fractionValue) <= tolerance;
}

/**
 * Format a number as a fraction string
 *
 * @param numerator - The numerator
 * @param denominator - The denominator
 * @returns Formatted fraction string (e.g., "1/2", "3/4")
 */
export function formatFraction(numerator: number, denominator: number): string {
  const [n, d] = simplifyFraction(numerator, denominator);
  
  if (d === 1) {
    return String(n);
  }
  
  return `${n}/${d}`;
}

/**
 * Format a decimal as a fraction string if it has a simple fraction representation
 *
 * @param decimal - The decimal number
 * @param maxDenominator - Maximum allowed denominator (default: 100)
 * @returns Fraction string or null if no simple representation exists
 */
export function decimalToFractionString(
  decimal: number,
  maxDenominator: number = 100
): string | null {
  const fraction = toFraction(decimal, maxDenominator);
  
  if (fraction === null) {
    return null;
  }

  return formatFraction(fraction[0], fraction[1]);
}

