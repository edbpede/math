/**
 * Tests for Parameter Generation System
 *
 * Tests the constraint satisfaction engine, deterministic RNG,
 * parameter validation, and dependency handling.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  SeededRandom,
  ParameterGenerator,
  createParameterGenerator,
  generateParameters,
  ParameterGenerationError,
  ConstraintViolationError,
} from './parameter-generator';
import type { ParameterConstraints } from './types';

describe('SeededRandom', () => {
  describe('determinism', () => {
    it('should generate same sequence with same seed', () => {
      const rng1 = new SeededRandom(12345);
      const rng2 = new SeededRandom(12345);

      const sequence1 = Array.from({ length: 10 }, () => rng1.next());
      const sequence2 = Array.from({ length: 10 }, () => rng2.next());

      expect(sequence1).toEqual(sequence2);
    });

    it('should generate different sequences with different seeds', () => {
      const rng1 = new SeededRandom(12345);
      const rng2 = new SeededRandom(54321);

      const sequence1 = Array.from({ length: 10 }, () => rng1.next());
      const sequence2 = Array.from({ length: 10 }, () => rng2.next());

      expect(sequence1).not.toEqual(sequence2);
    });
  });

  describe('next()', () => {
    it('should generate numbers in range [0, 1)', () => {
      const rng = new SeededRandom(42);

      for (let i = 0; i < 1000; i++) {
        const value = rng.next();
        expect(value).toBeGreaterThanOrEqual(0);
        expect(value).toBeLessThan(1);
      }
    });

    it('should handle seed of 0', () => {
      const rng = new SeededRandom(0);
      const value = rng.next();

      expect(value).toBeGreaterThanOrEqual(0);
      expect(value).toBeLessThan(1);
    });
  });

  describe('nextInt()', () => {
    it('should generate integers in specified range (inclusive)', () => {
      const rng = new SeededRandom(42);
      const min = 5;
      const max = 10;

      for (let i = 0; i < 100; i++) {
        const value = rng.nextInt(min, max);
        expect(Number.isInteger(value)).toBe(true);
        expect(value).toBeGreaterThanOrEqual(min);
        expect(value).toBeLessThanOrEqual(max);
      }
    });

    it('should handle single-value range', () => {
      const rng = new SeededRandom(42);
      const value = rng.nextInt(5, 5);
      expect(value).toBe(5);
    });

    it('should throw on non-integer bounds', () => {
      const rng = new SeededRandom(42);
      expect(() => rng.nextInt(1.5, 5)).toThrow('nextInt requires integer bounds');
    });

    it('should throw when min > max', () => {
      const rng = new SeededRandom(42);
      expect(() => rng.nextInt(10, 5)).toThrow('min must be less than or equal to max');
    });
  });

  describe('nextFloat()', () => {
    it('should generate floats in specified range', () => {
      const rng = new SeededRandom(42);
      const min = 1.5;
      const max = 7.8;

      for (let i = 0; i < 100; i++) {
        const value = rng.nextFloat(min, max);
        expect(value).toBeGreaterThanOrEqual(min);
        expect(value).toBeLessThan(max);
      }
    });

    it('should throw when min >= max', () => {
      const rng = new SeededRandom(42);
      expect(() => rng.nextFloat(5, 5)).toThrow('min must be less than max');
      expect(() => rng.nextFloat(10, 5)).toThrow('min must be less than max');
    });
  });

  describe('choice()', () => {
    it('should select element from array', () => {
      const rng = new SeededRandom(42);
      const array = ['a', 'b', 'c', 'd', 'e'];

      for (let i = 0; i < 50; i++) {
        const value = rng.choice(array);
        expect(array).toContain(value);
      }
    });

    it('should be deterministic with same seed', () => {
      const array = ['a', 'b', 'c', 'd', 'e'];

      const rng1 = new SeededRandom(12345);
      const choices1 = Array.from({ length: 10 }, () => rng1.choice(array));

      const rng2 = new SeededRandom(12345);
      const choices2 = Array.from({ length: 10 }, () => rng2.choice(array));

      expect(choices1).toEqual(choices2);
    });

    it('should throw on empty array', () => {
      const rng = new SeededRandom(42);
      expect(() => rng.choice([])).toThrow('Cannot select from empty array');
    });
  });

  describe('shuffle()', () => {
    it('should shuffle array deterministically', () => {
      const array = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

      const rng1 = new SeededRandom(12345);
      const shuffled1 = rng1.shuffle(array);

      const rng2 = new SeededRandom(12345);
      const shuffled2 = rng2.shuffle(array);

      expect(shuffled1).toEqual(shuffled2);
    });

    it('should contain all original elements', () => {
      const rng = new SeededRandom(42);
      const array = [1, 2, 3, 4, 5];
      const shuffled = rng.shuffle(array);

      expect(shuffled).toHaveLength(array.length);
      expect(shuffled.sort()).toEqual(array.sort());
    });

    it('should not modify original array', () => {
      const rng = new SeededRandom(42);
      const array = [1, 2, 3, 4, 5];
      const original = [...array];

      rng.shuffle(array);

      expect(array).toEqual(original);
    });
  });
});

describe('ParameterGenerator', () => {
  let generator: ParameterGenerator;

  beforeEach(() => {
    generator = new ParameterGenerator({ seed: 12345 });
  });

  describe('integer generation', () => {
    it('should generate integers within range', () => {
      const constraints: ParameterConstraints = {
        a: { type: 'integer', min: 1, max: 10 },
      };

      for (let i = 0; i < 50; i++) {
        const params = generator.generate(constraints);
        expect(params.a).toBeGreaterThanOrEqual(1);
        expect(params.a).toBeLessThanOrEqual(10);
        expect(Number.isInteger(params.a)).toBe(true);
      }
    });

    it('should respect step constraint', () => {
      const constraints: ParameterConstraints = {
        a: { type: 'integer', min: 0, max: 100, step: 5 },
      };

      for (let i = 0; i < 50; i++) {
        const params = generator.generate(constraints);
        const value = params.a as number;
        expect(value % 5).toBe(0);
        expect(value).toBeGreaterThanOrEqual(0);
        expect(value).toBeLessThanOrEqual(100);
      }
    });

    it('should use default min and max when not specified', () => {
      const constraints: ParameterConstraints = {
        a: { type: 'integer' },
      };

      const params = generator.generate(constraints);
      expect(Number.isInteger(params.a)).toBe(true);
      expect(params.a).toBeGreaterThanOrEqual(0);
      expect(params.a).toBeLessThanOrEqual(100);
    });
  });

  describe('decimal generation', () => {
    it('should generate decimals within range', () => {
      const constraints: ParameterConstraints = {
        a: { type: 'decimal', min: 0.0, max: 10.0 },
      };

      for (let i = 0; i < 50; i++) {
        const params = generator.generate(constraints);
        expect(params.a).toBeGreaterThanOrEqual(0.0);
        expect(params.a).toBeLessThan(10.0);
        expect(typeof params.a).toBe('number');
      }
    });

    it('should respect step constraint for decimals', () => {
      const constraints: ParameterConstraints = {
        a: { type: 'decimal', min: 0, max: 1, step: 0.1 },
      };

      for (let i = 0; i < 50; i++) {
        const params = generator.generate(constraints);
        const value = params.a as number;
        // Check if value is approximately a multiple of 0.1 from min
        const steps = Math.round((value - 0) / 0.1);
        expect(Math.abs(value - steps * 0.1)).toBeLessThan(0.0001);
      }
    });
  });

  describe('fraction generation', () => {
    it('should generate valid fractions', () => {
      const constraints: ParameterConstraints = {
        a: { type: 'fraction', min: 1, max: 10 },
      };

      for (let i = 0; i < 50; i++) {
        const params = generator.generate(constraints);
        expect(typeof params.a).toBe('string');
        expect(params.a).toMatch(/^\d+\/\d+$/);

        const [num, den] = (params.a as string).split('/').map(Number);
        expect(num).toBeGreaterThanOrEqual(1);
        expect(num).toBeLessThanOrEqual(10);
        expect(den).toBeGreaterThanOrEqual(1);
        expect(den).toBeLessThanOrEqual(10);
      }
    });

    it('should not generate zero denominator', () => {
      const constraints: ParameterConstraints = {
        a: { type: 'fraction', min: 0, max: 3 },
      };

      for (let i = 0; i < 50; i++) {
        const params = generator.generate(constraints);
        const [, den] = (params.a as string).split('/').map(Number);
        expect(den).not.toBe(0);
      }
    });
  });

  describe('string generation', () => {
    it('should select from options', () => {
      const options = ['red', 'blue', 'green', 'yellow'];
      const constraints: ParameterConstraints = {
        a: { type: 'string', options },
      };

      for (let i = 0; i < 50; i++) {
        const params = generator.generate(constraints);
        expect(options).toContain(params.a);
      }
    });

    it('should throw without options', () => {
      const constraints: ParameterConstraints = {
        a: { type: 'string' },
      };

      expect(() => generator.generate(constraints)).toThrow(
        ParameterGenerationError,
      );
    });
  });

  describe('options-based generation', () => {
    it('should select from options for any type', () => {
      const constraints: ParameterConstraints = {
        a: { type: 'integer', options: [2, 4, 8, 16, 32] },
      };

      for (let i = 0; i < 50; i++) {
        const params = generator.generate(constraints);
        expect([2, 4, 8, 16, 32]).toContain(params.a);
      }
    });
  });

  describe('custom constraints', () => {
    it('should satisfy custom constraint function', () => {
      const constraints: ParameterConstraints = {
        a: {
          type: 'integer',
          min: 1,
          max: 100,
          constraint: (params) => (params.a as number) % 2 === 0,
        },
      };

      for (let i = 0; i < 20; i++) {
        const params = generator.generate(constraints);
        expect((params.a as number) % 2).toBe(0);
      }
    });

    it('should retry on constraint violation', () => {
      let attempts = 0;
      const constraints: ParameterConstraints = {
        a: {
          type: 'integer',
          min: 1,
          max: 10,
          constraint: (params) => {
            attempts++;
            // Only accept value 5 (will require retries)
            return params.a === 5;
          },
        },
      };

      const params = generator.generate(constraints);
      expect(params.a).toBe(5);
      expect(attempts).toBeGreaterThan(1);
    });

    it('should throw after max attempts with unsatisfiable constraint', () => {
      const constraints: ParameterConstraints = {
        a: {
          type: 'integer',
          min: 1,
          max: 10,
          constraint: () => false, // Always fails
        },
      };

      const gen = new ParameterGenerator({ seed: 12345, maxAttempts: 5 });
      expect(() => gen.generate(constraints)).toThrow(ParameterGenerationError);
    });
  });

  describe('dependent parameters', () => {
    it('should generate dependencies before dependents', () => {
      const constraints: ParameterConstraints = {
        min: { type: 'integer', min: 1, max: 10 },
        max: {
          type: 'integer',
          min: 1,
          max: 100,
          dependsOn: ['min'],
          constraint: (params) => (params.max as number) > (params.min as number),
        },
      };

      for (let i = 0; i < 20; i++) {
        const params = generator.generate(constraints);
        expect(params.max).toBeGreaterThan(params.min as number);
      }
    });

    it('should handle multiple dependencies', () => {
      const constraints: ParameterConstraints = {
        a: { type: 'integer', min: 1, max: 5 },
        b: { type: 'integer', min: 1, max: 5 },
        sum: {
          type: 'integer',
          min: 2,
          max: 15,
          dependsOn: ['a', 'b'],
          constraint: (params) =>
            (params.sum as number) === (params.a as number) + (params.b as number),
        },
      };

      const params = generator.generate(constraints);
      expect(params.sum).toBe((params.a as number) + (params.b as number));
    });

    it('should throw on circular dependency', () => {
      const constraints: ParameterConstraints = {
        a: { type: 'integer', dependsOn: ['b'] },
        b: { type: 'integer', dependsOn: ['a'] },
      };

      expect(() => generator.generate(constraints)).toThrow(
        'Circular dependency detected',
      );
    });

    it('should throw on missing dependency', () => {
      const constraints: ParameterConstraints = {
        a: { type: 'integer', dependsOn: ['nonexistent'] },
      };

      expect(() => generator.generate(constraints)).toThrow(
        'Depends on undefined parameter',
      );
    });

    it('should handle transitive dependencies', () => {
      const constraints: ParameterConstraints = {
        a: { type: 'integer', min: 1, max: 3 },
        b: {
          type: 'integer',
          min: 1,
          max: 10,
          dependsOn: ['a'],
          constraint: (params) => (params.b as number) > (params.a as number),
        },
        c: {
          type: 'integer',
          min: 1,
          max: 20,
          dependsOn: ['b'],
          constraint: (params) => (params.c as number) > (params.b as number),
        },
      };

      const params = generator.generate(constraints);
      expect(params.c).toBeGreaterThan(params.b as number);
      expect(params.b).toBeGreaterThan(params.a as number);
    });
  });

  describe('validation', () => {
    it('should validate integer type', () => {
      const constraint = { type: 'integer' as const, min: 1, max: 10 };

      expect(() => generator.validate('a', 5, constraint)).not.toThrow();
      expect(() => generator.validate('a', 5.5, constraint)).toThrow(
        ConstraintViolationError,
      );
      expect(() => generator.validate('a', '5', constraint)).toThrow(
        ConstraintViolationError,
      );
    });

    it('should validate decimal type', () => {
      const constraint = { type: 'decimal' as const, min: 1, max: 10 };

      expect(() => generator.validate('a', 5.5, constraint)).not.toThrow();
      expect(() => generator.validate('a', 5, constraint)).not.toThrow();
      expect(() => generator.validate('a', '5.5', constraint)).toThrow(
        ConstraintViolationError,
      );
    });

    it('should validate fraction type', () => {
      const constraint = { type: 'fraction' as const };

      expect(() => generator.validate('a', '3/4', constraint)).not.toThrow();
      expect(() => generator.validate('a', '10/7', constraint)).not.toThrow();
      expect(() => generator.validate('a', 'abc', constraint)).toThrow(
        ConstraintViolationError,
      );
      expect(() => generator.validate('a', '3/', constraint)).toThrow(
        ConstraintViolationError,
      );
    });

    it('should validate string type', () => {
      const constraint = { type: 'string' as const };

      expect(() => generator.validate('a', 'hello', constraint)).not.toThrow();
      expect(() => generator.validate('a', '', constraint)).not.toThrow();
      expect(() => generator.validate('a', 123, constraint)).toThrow(
        ConstraintViolationError,
      );
    });

    it('should validate min constraint', () => {
      const constraint = { type: 'integer' as const, min: 5, max: 10 };

      expect(() => generator.validate('a', 5, constraint)).not.toThrow();
      expect(() => generator.validate('a', 4, constraint)).toThrow(
        'less than minimum',
      );
    });

    it('should validate max constraint', () => {
      const constraint = { type: 'integer' as const, min: 5, max: 10 };

      expect(() => generator.validate('a', 10, constraint)).not.toThrow();
      expect(() => generator.validate('a', 11, constraint)).toThrow(
        'greater than maximum',
      );
    });

    it('should validate step constraint', () => {
      const constraint = { type: 'integer' as const, min: 0, max: 20, step: 5 };

      expect(() => generator.validate('a', 0, constraint)).not.toThrow();
      expect(() => generator.validate('a', 5, constraint)).not.toThrow();
      expect(() => generator.validate('a', 10, constraint)).not.toThrow();
      expect(() => generator.validate('a', 3, constraint)).toThrow(
        'does not match step',
      );
    });

    it('should validate options constraint', () => {
      const constraint = {
        type: 'integer' as const,
        options: [2, 4, 8, 16],
      };

      expect(() => generator.validate('a', 4, constraint)).not.toThrow();
      expect(() => generator.validate('a', 5, constraint)).toThrow(
        'not in allowed options',
      );
    });
  });

  describe('determinism', () => {
    it('should generate same parameters with same seed', () => {
      const constraints: ParameterConstraints = {
        a: { type: 'integer', min: 1, max: 100 },
        b: { type: 'decimal', min: 0, max: 10 },
        c: { type: 'string', options: ['red', 'blue', 'green'] },
      };

      const gen1 = new ParameterGenerator({ seed: 42 });
      const params1 = gen1.generate(constraints);

      const gen2 = new ParameterGenerator({ seed: 42 });
      const params2 = gen2.generate(constraints);

      expect(params1).toEqual(params2);
    });

    it('should generate different parameters with different seeds', () => {
      const constraints: ParameterConstraints = {
        a: { type: 'integer', min: 1, max: 100 },
        b: { type: 'decimal', min: 0, max: 10 },
      };

      const gen1 = new ParameterGenerator({ seed: 42 });
      const params1 = gen1.generate(constraints);

      const gen2 = new ParameterGenerator({ seed: 999 });
      const params2 = gen2.generate(constraints);

      // Very unlikely to be the same (but theoretically possible)
      expect(params1).not.toEqual(params2);
    });

    it('should allow resetting seed', () => {
      const constraints: ParameterConstraints = {
        a: { type: 'integer', min: 1, max: 100 },
      };

      const gen = new ParameterGenerator({ seed: 42 });
      const params1 = gen.generate(constraints);

      gen.resetSeed(42);
      const params2 = gen.generate(constraints);

      expect(params1).toEqual(params2);
    });
  });

  describe('complex scenarios', () => {
    it('should generate parameters for addition exercise', () => {
      const constraints: ParameterConstraints = {
        a: { type: 'integer', min: 1, max: 10 },
        b: { type: 'integer', min: 1, max: 10 },
        answer: {
          type: 'integer',
          min: 2,
          max: 20,
          dependsOn: ['a', 'b'],
          constraint: (params) =>
            (params.answer as number) === (params.a as number) + (params.b as number),
        },
      };

      for (let i = 0; i < 20; i++) {
        const params = generator.generate(constraints);
        expect(params.answer).toBe((params.a as number) + (params.b as number));
      }
    });

    it('should generate parameters for subtraction with non-negative result', () => {
      const constraints: ParameterConstraints = {
        minuend: { type: 'integer', min: 10, max: 50 },
        subtrahend: {
          type: 'integer',
          min: 1,
          max: 50,
          dependsOn: ['minuend'],
          constraint: (params) =>
            (params.subtrahend as number) <= (params.minuend as number),
        },
      };

      for (let i = 0; i < 20; i++) {
        const params = generator.generate(constraints);
        expect(params.subtrahend).toBeLessThanOrEqual(params.minuend as number);
      }
    });

    it('should generate parameters for division with no remainder', () => {
      // For this test, we need to generate divisor and quotient first,
      // then calculate dividend, not generate it randomly
      const constraints: ParameterConstraints = {
        divisor: { type: 'integer', min: 2, max: 10 },
        quotient: { type: 'integer', min: 2, max: 10 },
      };

      for (let i = 0; i < 20; i++) {
        const params = generator.generate(constraints);
        const divisor = params.divisor as number;
        const quotient = params.quotient as number;
        const dividend = divisor * quotient;

        expect(dividend).toBe(divisor * quotient);
        expect(dividend % divisor).toBe(0);
      }
    });
  });
});

describe('convenience functions', () => {
  it('createParameterGenerator should create generator with seed', () => {
    const gen = createParameterGenerator(42);
    expect(gen).toBeInstanceOf(ParameterGenerator);

    const constraints: ParameterConstraints = {
      a: { type: 'integer', min: 1, max: 10 },
    };

    const params = gen.generate(constraints);
    expect(params.a).toBeDefined();
  });

  it('generateParameters should generate with seed', () => {
    const constraints: ParameterConstraints = {
      a: { type: 'integer', min: 1, max: 10 },
      b: { type: 'decimal', min: 0, max: 5 },
    };

    const params = generateParameters(constraints, 42);

    expect(params.a).toBeGreaterThanOrEqual(1);
    expect(params.a).toBeLessThanOrEqual(10);
    expect(params.b).toBeGreaterThanOrEqual(0);
    expect(params.b).toBeLessThan(5);
  });

  it('generateParameters should be deterministic', () => {
    const constraints: ParameterConstraints = {
      a: { type: 'integer', min: 1, max: 100 },
      b: { type: 'string', options: ['a', 'b', 'c', 'd'] },
    };

    const params1 = generateParameters(constraints, 12345);
    const params2 = generateParameters(constraints, 12345);

    expect(params1).toEqual(params2);
  });
});
