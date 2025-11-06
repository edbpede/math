/**
 * Fraction Representation Template Tests
 * 
 * Comprehensive tests for fraction representation exercise templates
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  fractionRepresentationA,
  fractionRepresentationB,
  fractionRepresentationC,
} from './fraction-representation';
import { TemplateRegistry } from '../../template-registry';
import { ParameterGenerator } from '../../parameter-generator';

describe('Fraction Representation Templates', () => {
  let registry: TemplateRegistry;

  beforeEach(() => {
    registry = new TemplateRegistry();
  });

  describe('fractionRepresentationA (Difficulty A)', () => {
    it('should have correct metadata', () => {
      expect(fractionRepresentationA.id).toBe('tal-algebra-fraction-representation-4-6-A');
      expect(fractionRepresentationA.metadata.competencyAreaId).toBe('tal-og-algebra');
      expect(fractionRepresentationA.metadata.skillsAreaId).toBe('broker-og-procent');
      expect(fractionRepresentationA.metadata.gradeRange).toBe('4-6');
      expect(fractionRepresentationA.metadata.difficulty).toBe('A');
      expect(fractionRepresentationA.metadata.isBinding).toBe(true);
      expect(fractionRepresentationA.metadata.tags).toContain('fractions');
    });

    it('should register successfully', () => {
      expect(() => registry.register(fractionRepresentationA)).not.toThrow();
      expect(registry.has(fractionRepresentationA.id)).toBe(true);
    });

    it('should generate valid parameters for unit fractions', () => {
      const generator = new ParameterGenerator({ seed: 42 });
      for (let i = 0; i < 20; i++) {
        const params = generator.generate(fractionRepresentationA.parameters);
        const denominator = params.denominator as number;
        
        expect(denominator).toBeGreaterThanOrEqual(2);
        expect(denominator).toBeLessThanOrEqual(5);
      }
    });

    it('should generate correct unit fraction answers', () => {
      const params = { denominator: 3 };
      const result = fractionRepresentationA.generate(params, 'da-DK');
      
      expect(result.correctAnswer.value).toBe('1/3');
      expect(result.correctAnswer.equivalents).toContain(1/3);
      expect(result.questionText).toContain('3');
    });

    it('should validate correct answers including decimals', () => {
      const correctAnswer = { value: '1/2', equivalents: [0.5] };
      
      expect(fractionRepresentationA.validate('1/2', correctAnswer).correct).toBe(true);
      expect(fractionRepresentationA.validate('0.5', correctAnswer).correct).toBe(true);
      expect(fractionRepresentationA.validate('0,5', correctAnswer).correct).toBe(true);
      expect(fractionRepresentationA.validate('2/3', correctAnswer).correct).toBe(false);
    });

    it('should provide 4 hint levels', () => {
      expect(fractionRepresentationA.hints).toHaveLength(4);
      
      const params = { denominator: 4 };
      const hint1 = fractionRepresentationA.hints[0](params, 'da-DK');
      const hint2 = fractionRepresentationA.hints[1](params, 'da-DK');
      const hint3 = fractionRepresentationA.hints[2](params, 'da-DK');
      const hint4 = fractionRepresentationA.hints[3](params, 'da-DK');
      
      expect(hint1).toBeTruthy();
      expect(hint2).toBeTruthy();
      expect(hint3).toBeTruthy();
      expect(hint4).toBeTruthy();
      expect(hint4).toContain('1/4');
    });

    it('should generate hints in both Danish and English', () => {
      const params = { denominator: 2 };
      const hintDA = fractionRepresentationA.hints[0](params, 'da-DK');
      const hintEN = fractionRepresentationA.hints[0](params, 'en-US');
      
      expect(hintDA).not.toBe(hintEN);
      expect(hintDA.length).toBeGreaterThan(0);
      expect(hintEN.length).toBeGreaterThan(0);
    });
  });

  describe('fractionRepresentationB (Difficulty B)', () => {
    it('should have correct metadata', () => {
      expect(fractionRepresentationB.id).toBe('tal-algebra-fraction-representation-4-6-B');
      expect(fractionRepresentationB.metadata.difficulty).toBe('B');
      expect(fractionRepresentationB.metadata.tags).toContain('proper-fractions');
    });

    it('should register successfully', () => {
      expect(() => registry.register(fractionRepresentationB)).not.toThrow();
      expect(registry.has(fractionRepresentationB.id)).toBe(true);
    });

    it('should generate valid parameters for proper fractions', () => {
      const generator = new ParameterGenerator({ seed: 123 });
      for (let i = 0; i < 20; i++) {
        const params = generator.generate(fractionRepresentationB.parameters);
        const numerator = params.numerator as number;
        const denominator = params.denominator as number;
        
        expect(denominator).toBeGreaterThanOrEqual(3);
        expect(denominator).toBeLessThanOrEqual(8);
        expect(numerator).toBeGreaterThanOrEqual(2);
        expect(numerator).toBeLessThanOrEqual(7);
        expect(numerator).toBeLessThan(denominator); // Proper fraction
      }
    });

    it('should generate correct common fraction answers', () => {
      const params = { numerator: 2, denominator: 3 };
      const result = fractionRepresentationB.generate(params, 'da-DK');
      
      expect(result.correctAnswer.value).toBe('2/3');
      expect(result.correctAnswer.equivalents).toContain(2/3);
    });

    it('should validate equivalent fractions', () => {
      const correctAnswer = { value: '2/4', equivalents: [0.5] };
      
      expect(fractionRepresentationB.validate('2/4', correctAnswer).correct).toBe(true);
      expect(fractionRepresentationB.validate('1/2', correctAnswer).correct).toBe(true);
      expect(fractionRepresentationB.validate('0.5', correctAnswer).correct).toBe(true);
    });

    it('should provide 4 hint levels', () => {
      expect(fractionRepresentationB.hints).toHaveLength(4);
    });
  });

  describe('fractionRepresentationC (Difficulty C)', () => {
    it('should have correct metadata', () => {
      expect(fractionRepresentationC.id).toBe('tal-algebra-fraction-representation-4-6-C');
      expect(fractionRepresentationC.metadata.difficulty).toBe('C');
      expect(fractionRepresentationC.metadata.tags).toContain('improper-fractions');
    });

    it('should register successfully', () => {
      expect(() => registry.register(fractionRepresentationC)).not.toThrow();
      expect(registry.has(fractionRepresentationC.id)).toBe(true);
    });

    it('should generate valid parameters for improper fractions', () => {
      const generator = new ParameterGenerator({ seed: 456 });
      for (let i = 0; i < 20; i++) {
        const params = generator.generate(fractionRepresentationC.parameters);
        const denominator = params.denominator as number;
        const wholeNumber = params.wholeNumber as number;
        const extraNumerator = params.extraNumerator as number;
        
        expect(denominator).toBeGreaterThanOrEqual(2);
        expect(denominator).toBeLessThanOrEqual(6);
        expect(wholeNumber).toBeGreaterThanOrEqual(1);
        expect(wholeNumber).toBeLessThanOrEqual(3);
        expect(extraNumerator).toBeGreaterThanOrEqual(1);
        expect(extraNumerator).toBeLessThan(denominator);
      }
    });

    it('should generate correct improper fraction answers', () => {
      const params = { wholeNumber: 1, denominator: 4, extraNumerator: 3 };
      const result = fractionRepresentationC.generate(params, 'da-DK');
      
      // 1 whole + 3/4 = 7/4
      expect(result.correctAnswer.value).toBe('7/4');
      expect(result.correctAnswer.equivalents).toContain(7/4);
      expect(result.correctAnswer.equivalents).toContain('1 3/4'); // Mixed number
    });

    it('should validate mixed number format', () => {
      const correctAnswer = { value: '7/4', equivalents: [1.75, '1 3/4'] };
      
      expect(fractionRepresentationC.validate('7/4', correctAnswer).correct).toBe(true);
      expect(fractionRepresentationC.validate('1 3/4', correctAnswer).correct).toBe(true);
      expect(fractionRepresentationC.validate('1.75', correctAnswer).correct).toBe(true);
    });

    it('should provide 4 hint levels', () => {
      expect(fractionRepresentationC.hints).toHaveLength(4);
      
      const params = { wholeNumber: 2, denominator: 3, extraNumerator: 1 };
      const hint4 = fractionRepresentationC.hints[3](params, 'da-DK');
      expect(hint4).toContain('7/3'); // 2 * 3 + 1 = 7
    });

    it('should handle edge cases', () => {
      const params1 = { wholeNumber: 1, denominator: 2, extraNumerator: 1 };
      const result1 = fractionRepresentationC.generate(params1, 'da-DK');
      expect(result1.correctAnswer.value).toBe('3/2');

      const params2 = { wholeNumber: 3, denominator: 5, extraNumerator: 4 };
      const result2 = fractionRepresentationC.generate(params2, 'da-DK');
      expect(result2.correctAnswer.value).toBe('19/5'); // 3 * 5 + 4 = 19
    });
  });

  describe('Template Determinism', () => {
    it('should generate same result with same seed', () => {
      const generator1 = new ParameterGenerator({ seed: 999 });
      const params1 = generator1.generate(fractionRepresentationA.parameters);
      const result1 = fractionRepresentationA.generate(params1, 'da-DK');

      const generator2 = new ParameterGenerator({ seed: 999 });
      const params2 = generator2.generate(fractionRepresentationA.parameters);
      const result2 = fractionRepresentationA.generate(params2, 'da-DK');

      expect(params1).toEqual(params2);
      expect(result1.correctAnswer.value).toBe(result2.correctAnswer.value);
    });
  });
});

