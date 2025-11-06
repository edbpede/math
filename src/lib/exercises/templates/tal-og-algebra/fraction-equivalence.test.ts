/**
 * Fraction Equivalence Template Tests
 * 
 * Comprehensive tests for fraction equivalence exercise templates
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  fractionEquivalenceA,
  fractionEquivalenceB,
  fractionEquivalenceC,
} from './fraction-equivalence';
import { TemplateRegistry } from '../../template-registry';
import { ParameterGenerator } from '../../parameter-generator';

describe('Fraction Equivalence Templates', () => {
  let registry: TemplateRegistry;

  beforeEach(() => {
    registry = new TemplateRegistry();
  });

  describe('fractionEquivalenceA (Difficulty A)', () => {
    it('should have correct metadata', () => {
      expect(fractionEquivalenceA.id).toBe('tal-algebra-fraction-equivalence-4-6-A');
      expect(fractionEquivalenceA.metadata.competencyAreaId).toBe('tal-og-algebra');
      expect(fractionEquivalenceA.metadata.skillsAreaId).toBe('broker-og-procent');
      expect(fractionEquivalenceA.metadata.gradeRange).toBe('4-6');
      expect(fractionEquivalenceA.metadata.difficulty).toBe('A');
      expect(fractionEquivalenceA.metadata.isBinding).toBe(true);
      expect(fractionEquivalenceA.metadata.tags).toContain('equivalence');
    });

    it('should register successfully', () => {
      expect(() => registry.register(fractionEquivalenceA)).not.toThrow();
      expect(registry.has(fractionEquivalenceA.id)).toBe(true);
    });

    it('should generate valid parameters', () => {
      const generator = new ParameterGenerator({ seed: 42 });
      for (let i = 0; i < 20; i++) {
        const params = generator.generate(fractionEquivalenceA.parameters);
        const numerator = params.originalNumerator as number;
        const denominator = params.originalDenominator as number;
        const multiplier = params.multiplier as number;
        
        expect(numerator).toBeGreaterThanOrEqual(1);
        expect(numerator).toBeLessThanOrEqual(4);
        expect(denominator).toBeGreaterThanOrEqual(2);
        expect(denominator).toBeLessThanOrEqual(5);
        expect(multiplier).toBeGreaterThanOrEqual(2);
        expect(multiplier).toBeLessThanOrEqual(4);
        expect(numerator).toBeLessThan(denominator); // Proper fraction
      }
    });

    it('should generate correct equivalent fractions', () => {
      const params = { originalNumerator: 1, originalDenominator: 2, multiplier: 3 };
      const result = fractionEquivalenceA.generate(params, 'da-DK');
      
      expect(result.correctAnswer.value).toBe('3/6');
      expect(result.correctAnswer.equivalents).toContain(0.5);
      expect(result.correctAnswer.equivalents).toContain('1/2');
    });

    it('should validate equivalent fractions', () => {
      const correctAnswer = { value: '2/4', equivalents: [0.5, '1/2'] };
      
      expect(fractionEquivalenceA.validate('2/4', correctAnswer).correct).toBe(true);
      expect(fractionEquivalenceA.validate('1/2', correctAnswer).correct).toBe(true);
      expect(fractionEquivalenceA.validate('4/8', correctAnswer).correct).toBe(true);
      expect(fractionEquivalenceA.validate('0.5', correctAnswer).correct).toBe(true);
      expect(fractionEquivalenceA.validate('3/4', correctAnswer).correct).toBe(false);
    });

    it('should provide 4 hint levels', () => {
      expect(fractionEquivalenceA.hints).toHaveLength(4);
      
      const params = { originalNumerator: 2, originalDenominator: 3, multiplier: 2 };
      const hint1 = fractionEquivalenceA.hints[0](params, 'da-DK');
      const hint2 = fractionEquivalenceA.hints[1](params, 'da-DK');
      const hint3 = fractionEquivalenceA.hints[2](params, 'da-DK');
      const hint4 = fractionEquivalenceA.hints[3](params, 'da-DK');
      
      expect(hint1).toBeTruthy();
      expect(hint2).toBeTruthy();
      expect(hint3).toBeTruthy();
      expect(hint4).toBeTruthy();
      expect(hint4).toContain('4/6');
    });

    it('should generate hints in both Danish and English', () => {
      const params = { originalNumerator: 1, originalDenominator: 3, multiplier: 2 };
      const hintDA = fractionEquivalenceA.hints[0](params, 'da-DK');
      const hintEN = fractionEquivalenceA.hints[0](params, 'en-US');
      
      expect(hintDA).not.toBe(hintEN);
      expect(hintDA.length).toBeGreaterThan(0);
      expect(hintEN.length).toBeGreaterThan(0);
    });
  });

  describe('fractionEquivalenceB (Difficulty B)', () => {
    it('should have correct metadata', () => {
      expect(fractionEquivalenceB.id).toBe('tal-algebra-fraction-equivalence-4-6-B');
      expect(fractionEquivalenceB.metadata.difficulty).toBe('B');
      expect(fractionEquivalenceB.metadata.tags).toContain('proportional-reasoning');
    });

    it('should register successfully', () => {
      expect(() => registry.register(fractionEquivalenceB)).not.toThrow();
      expect(registry.has(fractionEquivalenceB.id)).toBe(true);
    });

    it('should generate valid parameters', () => {
      const generator = new ParameterGenerator({ seed: 123 });
      for (let i = 0; i < 20; i++) {
        const params = generator.generate(fractionEquivalenceB.parameters);
        const numerator = params.baseNumerator as number;
        const denominator = params.baseDenominator as number;
        const multiplier = params.multiplier as number;
        const findNumerator = params.findNumerator as number;
        
        expect(numerator).toBeGreaterThanOrEqual(1);
        expect(numerator).toBeLessThanOrEqual(5);
        expect(denominator).toBeGreaterThanOrEqual(2);
        expect(denominator).toBeLessThanOrEqual(6);
        expect(multiplier).toBeGreaterThanOrEqual(2);
        expect(multiplier).toBeLessThanOrEqual(5);
        expect(findNumerator).toBeGreaterThanOrEqual(0);
        expect(findNumerator).toBeLessThanOrEqual(1);
        expect(numerator).toBeLessThan(denominator);
      }
    });

    it('should generate correct missing numerator problems', () => {
      const params = { baseNumerator: 2, baseDenominator: 3, multiplier: 4, findNumerator: 1 };
      const result = fractionEquivalenceB.generate(params, 'da-DK');
      
      expect(result.correctAnswer.value).toBe(8); // 2 * 4
      expect(result.questionText).toContain('2/3');
      expect(result.questionText).toContain('12'); // 3 * 4
    });

    it('should generate correct missing denominator problems', () => {
      const params = { baseNumerator: 2, baseDenominator: 3, multiplier: 4, findNumerator: 0 };
      const result = fractionEquivalenceB.generate(params, 'da-DK');
      
      expect(result.correctAnswer.value).toBe(12); // 3 * 4
      expect(result.questionText).toContain('2/3');
      expect(result.questionText).toContain('8'); // 2 * 4
    });

    it('should validate correct answers', () => {
      const correctAnswer = { value: 8 };
      
      expect(fractionEquivalenceB.validate('8', correctAnswer).correct).toBe(true);
      expect(fractionEquivalenceB.validate('7', correctAnswer).correct).toBe(false);
    });

    it('should provide 4 hint levels', () => {
      expect(fractionEquivalenceB.hints).toHaveLength(4);
    });
  });

  describe('fractionEquivalenceC (Difficulty C)', () => {
    it('should have correct metadata', () => {
      expect(fractionEquivalenceC.id).toBe('tal-algebra-fraction-equivalence-4-6-C');
      expect(fractionEquivalenceC.metadata.difficulty).toBe('C');
      expect(fractionEquivalenceC.metadata.tags).toContain('simplification');
    });

    it('should register successfully', () => {
      expect(() => registry.register(fractionEquivalenceC)).not.toThrow();
      expect(registry.has(fractionEquivalenceC.id)).toBe(true);
    });

    it('should generate valid parameters', () => {
      const generator = new ParameterGenerator({ seed: 456 });
      for (let i = 0; i < 20; i++) {
        const params = generator.generate(fractionEquivalenceC.parameters);
        const numerator = params.simplifiedNumerator as number;
        const denominator = params.simplifiedDenominator as number;
        const commonFactor = params.commonFactor as number;
        
        expect(numerator).toBeGreaterThanOrEqual(1);
        expect(numerator).toBeLessThanOrEqual(7);
        expect(denominator).toBeGreaterThanOrEqual(2);
        expect(denominator).toBeLessThanOrEqual(8);
        expect(commonFactor).toBeGreaterThanOrEqual(2);
        expect(commonFactor).toBeLessThanOrEqual(6);
        expect(numerator).toBeLessThan(denominator);
      }
    });

    it('should generate correct simplification problems', () => {
      const params = { simplifiedNumerator: 1, simplifiedDenominator: 2, commonFactor: 3 };
      const result = fractionEquivalenceC.generate(params, 'da-DK');
      
      expect(result.questionText).toContain('3/6');
      expect(result.correctAnswer.value).toBe('1/2');
      expect(result.correctAnswer.equivalents).toContain(0.5);
      expect(result.correctAnswer.equivalents).toContain('3/6');
    });

    it('should validate simplified fractions', () => {
      const correctAnswer = { value: '1/2', equivalents: [0.5, '2/4'] };
      
      expect(fractionEquivalenceC.validate('1/2', correctAnswer).correct).toBe(true);
      expect(fractionEquivalenceC.validate('2/4', correctAnswer).correct).toBe(true);
      expect(fractionEquivalenceC.validate('3/6', correctAnswer).correct).toBe(true);
      expect(fractionEquivalenceC.validate('0.5', correctAnswer).correct).toBe(true);
      expect(fractionEquivalenceC.validate('1/3', correctAnswer).correct).toBe(false);
    });

    it('should provide 4 hint levels', () => {
      expect(fractionEquivalenceC.hints).toHaveLength(4);
      
      const params = { simplifiedNumerator: 2, simplifiedDenominator: 3, commonFactor: 2 };
      const hint4 = fractionEquivalenceC.hints[3](params, 'da-DK');
      expect(hint4).toContain('2/3');
    });

    it('should handle various common factors', () => {
      const params1 = { simplifiedNumerator: 1, simplifiedDenominator: 3, commonFactor: 4 };
      const result1 = fractionEquivalenceC.generate(params1, 'da-DK');
      expect(result1.questionText).toContain('4/12');

      const params2 = { simplifiedNumerator: 3, simplifiedDenominator: 5, commonFactor: 3 };
      const result2 = fractionEquivalenceC.generate(params2, 'da-DK');
      expect(result2.questionText).toContain('9/15');
    });
  });

  describe('Template Determinism', () => {
    it('should generate same result with same seed', () => {
      const generator1 = new ParameterGenerator({ seed: 999 });
      const params1 = generator1.generate(fractionEquivalenceA.parameters);
      const result1 = fractionEquivalenceA.generate(params1, 'da-DK');

      const generator2 = new ParameterGenerator({ seed: 999 });
      const params2 = generator2.generate(fractionEquivalenceA.parameters);
      const result2 = fractionEquivalenceA.generate(params2, 'da-DK');

      expect(params1).toEqual(params2);
      expect(result1.correctAnswer.value).toBe(result2.correctAnswer.value);
    });
  });
});

