/**
 * Distractor Generation Utilities
 *
 * Provides common distractor patterns for multiple choice exercises.
 * Distractors are incorrect but plausible answers that test specific
 * misconceptions and understanding levels.
 *
 * Requirements:
 * - 3.4: Generate plausible distractors for multiple choice exercises
 */

import type { Answer } from './types';
import { SeededRandom } from './parameter-generator';

/**
 * Distractor generation strategy
 */
export type DistractorStrategy =
  | 'off-by-one'
  | 'wrong-operation'
  | 'sign-error'
  | 'place-value'
  | 'factor-multiple'
  | 'common-mistake';

/**
 * Options for distractor generation
 */
export interface DistractorOptions {
  count?: number; // Number of distractors to generate (default: 3)
  strategies?: DistractorStrategy[]; // Specific strategies to use
  seed?: number; // Random seed for deterministic generation
  excludeValues?: Array<string | number>; // Values to exclude (e.g., correct answer)
}

/**
 * Generate distractors for a numeric answer
 *
 * @param correctAnswer - The correct answer
 * @param options - Distractor generation options
 * @returns Array of distractor values as strings
 */
export function generateNumericDistractors(
  correctAnswer: Answer,
  options: DistractorOptions = {}
): string[] {
  const {
    count = 3,
    strategies,
    seed = Date.now(),
    excludeValues = [],
  } = options;

  const rng = new SeededRandom(seed);
  const distractors = new Set<string>();
  const correctValue = typeof correctAnswer.value === 'number'
    ? correctAnswer.value
    : parseFloat(correctAnswer.value.toString());

  // Add correct answer and equivalents to exclusion set
  const excluded = new Set<string>([
    correctAnswer.value.toString(),
    ...excludeValues.map(v => v.toString()),
  ]);

  if (correctAnswer.equivalents) {
    correctAnswer.equivalents.forEach(eq => excluded.add(eq.toString()));
  }

  // Available strategies
  const allStrategies: DistractorStrategy[] = strategies || [
    'off-by-one',
    'wrong-operation',
    'sign-error',
    'place-value',
    'factor-multiple',
  ];

  // Generate distractors using various strategies
  let attempts = 0;
  const maxAttempts = count * 10;

  while (distractors.size < count && attempts < maxAttempts) {
    attempts++;

    // Select a random strategy
    const strategy = rng.choice(allStrategies);
    const distractor = generateDistractorByStrategy(
      correctValue,
      strategy,
      rng
    );

    const distractorStr = distractor.toString();

    // Skip if excluded or already generated
    if (excluded.has(distractorStr) || distractors.has(distractorStr)) {
      continue;
    }

    distractors.add(distractorStr);
  }

  // If we still need more distractors, generate random nearby values
  while (distractors.size < count && attempts < maxAttempts) {
    attempts++;

    const offset = rng.nextInt(-10, 10);
    if (offset === 0) continue;

    const distractor = correctValue + offset;
    const distractorStr = distractor.toString();

    if (!excluded.has(distractorStr) && !distractors.has(distractorStr)) {
      distractors.add(distractorStr);
    }
  }

  return Array.from(distractors);
}

/**
 * Generate a distractor using a specific strategy
 *
 * @param correctValue - The correct numeric value
 * @param strategy - The strategy to use
 * @param rng - Random number generator
 * @returns Distractor value
 */
function generateDistractorByStrategy(
  correctValue: number,
  strategy: DistractorStrategy,
  rng: SeededRandom
): number {
  switch (strategy) {
    case 'off-by-one':
      return offByOneDistractor(correctValue, rng);

    case 'wrong-operation':
      return wrongOperationDistractor(correctValue, rng);

    case 'sign-error':
      return signErrorDistractor(correctValue);

    case 'place-value':
      return placeValueDistractor(correctValue, rng);

    case 'factor-multiple':
      return factorMultipleDistractor(correctValue, rng);

    case 'common-mistake':
      return commonMistakeDistractor(correctValue, rng);

    default:
      return correctValue + rng.nextInt(-5, 5);
  }
}

/**
 * Off-by-one error distractor
 *
 * Common mistake when counting or performing operations.
 *
 * @param value - Correct value
 * @param rng - Random number generator
 * @returns Distractor value
 */
function offByOneDistractor(value: number, rng: SeededRandom): number {
  return value + (rng.next() < 0.5 ? 1 : -1);
}

/**
 * Wrong operation distractor
 *
 * Result if student used wrong operation (e.g., added instead of multiplied).
 *
 * @param value - Correct value
 * @param rng - Random number generator
 * @returns Distractor value
 */
function wrongOperationDistractor(value: number, rng: SeededRandom): number {
  // For common operations, simulate wrong operation
  // This is a placeholder - actual implementation would need context
  // about what operation was performed
  const factor = rng.nextInt(2, 5);
  return rng.next() < 0.5 ? value * factor : Math.floor(value / factor);
}

/**
 * Sign error distractor
 *
 * Mistake in sign (positive/negative).
 *
 * @param value - Correct value
 * @returns Distractor value
 */
function signErrorDistractor(value: number): number {
  return -value;
}

/**
 * Place value error distractor
 *
 * Mistake in place value (off by factor of 10).
 *
 * @param value - Correct value
 * @param rng - Random number generator
 * @returns Distractor value
 */
function placeValueDistractor(value: number, rng: SeededRandom): number {
  const factor = rng.next() < 0.5 ? 10 : 0.1;
  return value * factor;
}

/**
 * Factor/multiple error distractor
 *
 * Using a factor or multiple of the correct answer.
 *
 * @param value - Correct value
 * @param rng - Random number generator
 * @returns Distractor value
 */
function factorMultipleDistractor(value: number, rng: SeededRandom): number {
  if (value <= 1) {
    return value * 2;
  }

  // Find a simple factor or multiple
  const factors = [2, 3, 4, 5];
  const factor = rng.choice(factors);

  return rng.next() < 0.5 ? value * factor : Math.floor(value / factor);
}

/**
 * Common mistake distractor
 *
 * Generic common calculation mistakes.
 *
 * @param value - Correct value
 * @param rng - Random number generator
 * @returns Distractor value
 */
function commonMistakeDistractor(value: number, rng: SeededRandom): number {
  // Round to wrong place value, drop a digit, etc.
  const mistakes = [
    () => Math.floor(value / 10) * 10, // Round to tens
    () => Math.floor(value / 100) * 100, // Round to hundreds
    () => value + Math.floor(value * 0.1), // Add 10%
    () => value - Math.floor(value * 0.1), // Subtract 10%
  ];

  return rng.choice(mistakes)();
}

/**
 * Generate distractors for a fraction answer
 *
 * @param correctAnswer - The correct answer
 * @param options - Distractor generation options
 * @returns Array of distractor values as strings
 */
export function generateFractionDistractors(
  correctAnswer: Answer,
  options: DistractorOptions = {}
): string[] {
  const {
    count = 3,
    seed = Date.now(),
    excludeValues = [],
  } = options;

  const rng = new SeededRandom(seed);
  const distractors = new Set<string>();

  // Parse the correct fraction
  const fractionStr = correctAnswer.value.toString();
  const match = fractionStr.match(/^(\d+)\/(\d+)$/);

  if (!match) {
    // Not a fraction format, return empty
    return [];
  }

  const [, numeratorStr, denominatorStr] = match;
  const numerator = parseInt(numeratorStr, 10);
  const denominator = parseInt(denominatorStr, 10);

  // Add correct answer and equivalents to exclusion set
  const excluded = new Set<string>([
    correctAnswer.value.toString(),
    ...excludeValues.map(v => v.toString()),
  ]);

  if (correctAnswer.equivalents) {
    correctAnswer.equivalents.forEach(eq => excluded.add(eq.toString()));
  }

  // Common fraction mistakes
  const strategies = [
    // Swap numerator and denominator
    () => `${denominator}/${numerator}`,
    
    // Off by one in numerator
    () => `${numerator + 1}/${denominator}`,
    () => `${numerator - 1}/${denominator}`,
    
    // Off by one in denominator
    () => `${numerator}/${denominator + 1}`,
    () => `${numerator}/${denominator - 1}`,
    
    // Multiply both by same factor (non-simplified)
    () => {
      const factor = rng.nextInt(2, 4);
      return `${numerator * factor}/${denominator * factor + 1}`; // Intentionally wrong
    },
    
    // Wrong simplification
    () => {
      const factor = rng.nextInt(2, 3);
      return `${Math.floor(numerator / factor)}/${Math.floor(denominator / factor)}`;
    },
  ];

  let attempts = 0;
  const maxAttempts = count * 10;

  while (distractors.size < count && attempts < maxAttempts) {
    attempts++;

    const strategy = rng.choice(strategies);
    const distractor = strategy();

    // Validate fraction format and ensure not excluded
    if (
      distractor.match(/^\d+\/\d+$/) &&
      !excluded.has(distractor) &&
      !distractors.has(distractor)
    ) {
      distractors.add(distractor);
    }
  }

  return Array.from(distractors);
}

/**
 * Generate distractors for a string answer
 *
 * @param correctAnswer - The correct answer
 * @param options - Distractor generation options with possible alternatives
 * @returns Array of distractor values as strings
 */
export function generateStringDistractors(
  correctAnswer: Answer,
  options: DistractorOptions & { alternatives?: string[] } = {}
): string[] {
  const {
    count = 3,
    seed = Date.now(),
    excludeValues = [],
    alternatives = [],
  } = options;

  const rng = new SeededRandom(seed);
  const distractors = new Set<string>();

  // Add correct answer and equivalents to exclusion set
  const excluded = new Set<string>([
    correctAnswer.value.toString(),
    ...excludeValues.map(v => v.toString()),
  ]);

  if (correctAnswer.equivalents) {
    correctAnswer.equivalents.forEach(eq => excluded.add(eq.toString()));
  }

  // Use provided alternatives if available
  if (alternatives.length > 0) {
    const shuffled = rng.shuffle(alternatives);
    for (const alt of shuffled) {
      if (distractors.size >= count) break;
      if (!excluded.has(alt)) {
        distractors.add(alt);
      }
    }
  }

  return Array.from(distractors);
}

/**
 * Automatically generate distractors based on answer type
 *
 * @param correctAnswer - The correct answer
 * @param options - Distractor generation options
 * @returns Array of distractor values as strings
 */
export function generateDistractors(
  correctAnswer: Answer,
  options: DistractorOptions & { alternatives?: string[] } = {}
): string[] {
  const value = correctAnswer.value;

  // Determine answer type and use appropriate strategy
  if (typeof value === 'number') {
    return generateNumericDistractors(correctAnswer, options);
  }

  if (typeof value === 'string') {
    // Check if it's a fraction
    if (value.match(/^\d+\/\d+$/)) {
      return generateFractionDistractors(correctAnswer, options);
    }

    // Otherwise treat as string answer
    return generateStringDistractors(correctAnswer, options);
  }

  // Default: return empty array
  return [];
}

