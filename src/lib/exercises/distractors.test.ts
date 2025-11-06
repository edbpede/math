/**
 * Distractor Generation Tests
 */

import { describe, it, expect } from 'vitest';
import {
  generateDistractors,
  generateNumericDistractors,
  generateFractionDistractors,
  generateStringDistractors,
} from './distractors';
import type { Answer } from './types';

describe('Distractor Generation', () => {
  describe('generateNumericDistractors', () => {
    it('should generate specified number of distractors', () => {
      const correctAnswer: Answer = {
        value: 42,
      };

      const distractors = generateNumericDistractors(correctAnswer, {
        count: 3,
        seed: 12345,
      });

      expect(distractors).toHaveLength(3);
    });

    it('should not include the correct answer', () => {
      const correctAnswer: Answer = {
        value: 42,
      };

      const distractors = generateNumericDistractors(correctAnswer, {
        count: 5,
        seed: 12345,
      });

      expect(distractors).not.toContain('42');
    });

    it('should not include equivalent answers', () => {
      const correctAnswer: Answer = {
        value: 10,
        equivalents: [10.0, 10.00],
      };

      const distractors = generateNumericDistractors(correctAnswer, {
        count: 5,
        seed: 12345,
      });

      expect(distractors).not.toContain('10');
      expect(distractors).not.toContain('10.0');
      expect(distractors).not.toContain('10.00');
    });

    it('should exclude specified values', () => {
      const correctAnswer: Answer = {
        value: 42,
      };

      const distractors = generateNumericDistractors(correctAnswer, {
        count: 5,
        seed: 12345,
        excludeValues: [41, 43],
      });

      expect(distractors).not.toContain('41');
      expect(distractors).not.toContain('43');
    });

    it('should generate unique distractors', () => {
      const correctAnswer: Answer = {
        value: 100,
      };

      const distractors = generateNumericDistractors(correctAnswer, {
        count: 4,
        seed: 12345,
      });

      const uniqueDistractors = new Set(distractors);
      expect(uniqueDistractors.size).toBe(distractors.length);
    });

    it('should be deterministic with same seed', () => {
      const correctAnswer: Answer = {
        value: 42,
      };

      const distractors1 = generateNumericDistractors(correctAnswer, {
        count: 3,
        seed: 12345,
      });

      const distractors2 = generateNumericDistractors(correctAnswer, {
        count: 3,
        seed: 12345,
      });

      expect(distractors1).toEqual(distractors2);
    });

    it('should generate different distractors with different seeds', () => {
      const correctAnswer: Answer = {
        value: 42,
      };

      const distractors1 = generateNumericDistractors(correctAnswer, {
        count: 3,
        seed: 12345,
      });

      const distractors2 = generateNumericDistractors(correctAnswer, {
        count: 3,
        seed: 54321,
      });

      expect(distractors1).not.toEqual(distractors2);
    });

    it('should use specified strategies', () => {
      const correctAnswer: Answer = {
        value: 10,
      };

      const distractors = generateNumericDistractors(correctAnswer, {
        count: 2,
        seed: 12345,
        strategies: ['off-by-one'],
      });

      // With off-by-one strategy, expect values near 10
      expect(distractors.length).toBeGreaterThan(0);
      distractors.forEach(d => {
        const value = parseFloat(d);
        expect(Math.abs(value - 10)).toBeLessThanOrEqual(10);
      });
    });
  });

  describe('generateFractionDistractors', () => {
    it('should generate distractors for fractions', () => {
      const correctAnswer: Answer = {
        value: '3/4',
      };

      const distractors = generateFractionDistractors(correctAnswer, {
        count: 3,
        seed: 12345,
      });

      expect(distractors.length).toBeGreaterThan(0);
      expect(distractors.length).toBeLessThanOrEqual(3);
    });

    it('should generate valid fraction format', () => {
      const correctAnswer: Answer = {
        value: '1/2',
      };

      const distractors = generateFractionDistractors(correctAnswer, {
        count: 3,
        seed: 12345,
      });

      distractors.forEach(d => {
        expect(d).toMatch(/^\d+\/\d+$/);
      });
    });

    it('should not include the correct fraction', () => {
      const correctAnswer: Answer = {
        value: '3/4',
      };

      const distractors = generateFractionDistractors(correctAnswer, {
        count: 3,
        seed: 12345,
      });

      expect(distractors).not.toContain('3/4');
    });

    it('should generate unique fraction distractors', () => {
      const correctAnswer: Answer = {
        value: '2/5',
      };

      const distractors = generateFractionDistractors(correctAnswer, {
        count: 4,
        seed: 12345,
      });

      const uniqueDistractors = new Set(distractors);
      expect(uniqueDistractors.size).toBe(distractors.length);
    });

    it('should be deterministic with same seed', () => {
      const correctAnswer: Answer = {
        value: '5/8',
      };

      const distractors1 = generateFractionDistractors(correctAnswer, {
        count: 3,
        seed: 12345,
      });

      const distractors2 = generateFractionDistractors(correctAnswer, {
        count: 3,
        seed: 12345,
      });

      expect(distractors1).toEqual(distractors2);
    });
  });

  describe('generateStringDistractors', () => {
    it('should generate distractors from alternatives', () => {
      const correctAnswer: Answer = {
        value: 'blue',
      };

      const alternatives = ['red', 'green', 'yellow', 'purple'];
      const distractors = generateStringDistractors(correctAnswer, {
        count: 3,
        seed: 12345,
        alternatives,
      });

      expect(distractors.length).toBeLessThanOrEqual(3);
      distractors.forEach(d => {
        expect(alternatives).toContain(d);
      });
    });

    it('should not include the correct answer', () => {
      const correctAnswer: Answer = {
        value: 'correct',
      };

      const alternatives = ['wrong1', 'wrong2', 'wrong3', 'correct'];
      const distractors = generateStringDistractors(correctAnswer, {
        count: 3,
        seed: 12345,
        alternatives,
      });

      expect(distractors).not.toContain('correct');
    });

    it('should handle empty alternatives', () => {
      const correctAnswer: Answer = {
        value: 'answer',
      };

      const distractors = generateStringDistractors(correctAnswer, {
        count: 3,
        seed: 12345,
        alternatives: [],
      });

      expect(distractors).toHaveLength(0);
    });
  });

  describe('generateDistractors (automatic)', () => {
    it('should detect numeric answers and use numeric strategy', () => {
      const correctAnswer: Answer = {
        value: 42,
      };

      const distractors = generateDistractors(correctAnswer, {
        count: 3,
        seed: 12345,
      });

      expect(distractors.length).toBeGreaterThan(0);
      distractors.forEach(d => {
        expect(typeof d).toBe('string');
        expect(isNaN(Number(d))).toBe(false);
      });
    });

    it('should detect fraction answers and use fraction strategy', () => {
      const correctAnswer: Answer = {
        value: '1/2',
      };

      const distractors = generateDistractors(correctAnswer, {
        count: 3,
        seed: 12345,
      });

      expect(distractors.length).toBeGreaterThan(0);
      distractors.forEach(d => {
        expect(d).toMatch(/^\d+\/\d+$/);
      });
    });

    it('should handle string answers', () => {
      const correctAnswer: Answer = {
        value: 'triangle',
      };

      const distractors = generateDistractors(correctAnswer, {
        count: 3,
        seed: 12345,
        alternatives: ['square', 'circle', 'rectangle', 'pentagon'],
      });

      expect(distractors.length).toBeGreaterThan(0);
      expect(distractors).not.toContain('triangle');
    });
  });

  describe('Distractor quality', () => {
    it('should generate plausible off-by-one errors', () => {
      const correctAnswer: Answer = {
        value: 50,
      };

      const distractors = generateNumericDistractors(correctAnswer, {
        count: 5,
        seed: 12345,
        strategies: ['off-by-one'],
      });

      // All distractors should be close to correct answer
      distractors.forEach(d => {
        const value = parseFloat(d);
        expect(Math.abs(value - 50)).toBeLessThanOrEqual(10);
      });
    });

    it('should generate plausible sign errors', () => {
      const correctAnswer: Answer = {
        value: 10,
      };

      const distractors = generateNumericDistractors(correctAnswer, {
        count: 5,
        seed: 12345,
        strategies: ['sign-error'],
      });

      // Should include negative value
      const hasNegative = distractors.some(d => parseFloat(d) < 0);
      expect(hasNegative).toBe(true);
    });
  });
});

