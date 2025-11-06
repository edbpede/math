/**
 * Subtraction Template Tests
 * 
 * Comprehensive tests for subtraction exercise templates
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { subtractionA, subtractionB, subtractionC } from './subtraction';
import { TemplateRegistry } from '../../template-registry';
import { ParameterGenerator } from '../../parameter-generator';

describe('Subtraction Templates', () => {
  let registry: TemplateRegistry;

  beforeEach(() => {
    registry = new TemplateRegistry();
  });

  describe('subtractionA (Difficulty A)', () => {
    it('should have correct metadata', () => {
      expect(subtractionA.id).toBe('tal-algebra-subtraction-0-3-A');
      expect(subtractionA.metadata.competencyAreaId).toBe('tal-og-algebra');
      expect(subtractionA.metadata.skillsAreaId).toBe('regning');
      expect(subtractionA.metadata.gradeRange).toBe('0-3');
      expect(subtractionA.metadata.difficulty).toBe('A');
      expect(subtractionA.metadata.isBinding).toBe(true);
      expect(subtractionA.metadata.tags).toContain('subtraction');
    });

    it('should register successfully', () => {
      expect(() => registry.register(subtractionA)).not.toThrow();
      expect(registry.has(subtractionA.id)).toBe(true);
    });

    it('should generate valid parameters with non-negative results', () => {
      const generator = new ParameterGenerator({ seed: 42 });
      for (let i = 0; i < 20; i++) {
        const params = generator.generate(subtractionA.parameters);
        const a = params.a as number;
        const b = params.b as number;
        
        expect(a).toBeGreaterThanOrEqual(0);
        expect(a).toBeLessThanOrEqual(10);
        expect(b).toBeGreaterThanOrEqual(0);
        expect(b).toBeLessThanOrEqual(10);
        expect(b).toBeLessThanOrEqual(a); // b <= a ensures non-negative result
        expect(a - b).toBeGreaterThanOrEqual(0);
      }
    });

    it('should generate correct answers', () => {
      const params = { a: 8, b: 3 };
      const result = subtractionA.generate(params, 'da-DK');
      
      expect(result.correctAnswer.value).toBe(5);
    });

    it('should validate correct answers', () => {
      const correctAnswer = { value: 5 };
      
      expect(subtractionA.validate('5', correctAnswer).correct).toBe(true);
      expect(subtractionA.validate('4', correctAnswer).correct).toBe(false);
    });

    it('should provide 4 hint levels', () => {
      expect(subtractionA.hints).toHaveLength(4);
      
      const params = { a: 8, b: 3 };
      const hint4 = subtractionA.hints[3](params, 'da-DK');
      expect(hint4).toContain('5');
    });

    it('should handle zero subtraction', () => {
      const params = { a: 7, b: 0 };
      const result = subtractionA.generate(params, 'da-DK');
      expect(result.correctAnswer.value).toBe(7);
    });
  });

  describe('subtractionB (Difficulty B)', () => {
    it('should have correct metadata', () => {
      expect(subtractionB.id).toBe('tal-algebra-subtraction-0-3-B');
      expect(subtractionB.metadata.difficulty).toBe('B');
      expect(subtractionB.metadata.tags).toContain('no-borrowing');
    });

    it('should register successfully', () => {
      expect(() => registry.register(subtractionB)).not.toThrow();
      expect(registry.has(subtractionB.id)).toBe(true);
    });

    it('should generate parameters without borrowing', () => {
      const generator = new ParameterGenerator({ seed: 123 });
      for (let i = 0; i < 20; i++) {
        const params = generator.generate(subtractionB.parameters);
        const a = params.a as number;
        const b = params.b as number;
        const aOnes = a % 10;
        
        expect(a).toBeGreaterThanOrEqual(10);
        expect(a).toBeLessThanOrEqual(20);
        expect(b).toBeGreaterThanOrEqual(1);
        expect(b).toBeLessThanOrEqual(9);
        expect(aOnes).toBeGreaterThanOrEqual(b); // No borrowing needed
      }
    });

    it('should handle subtraction without borrowing', () => {
      const params = { a: 18, b: 5 };
      const result = subtractionB.generate(params, 'da-DK');
      
      expect(result.correctAnswer.value).toBe(13);
    });

    it('should provide 4 hint levels', () => {
      expect(subtractionB.hints).toHaveLength(4);
    });
  });

  describe('subtractionC (Difficulty C)', () => {
    it('should have correct metadata', () => {
      expect(subtractionC.id).toBe('tal-algebra-subtraction-0-3-C');
      expect(subtractionC.metadata.difficulty).toBe('C');
      expect(subtractionC.metadata.tags).toContain('borrowing');
    });

    it('should register successfully', () => {
      expect(() => registry.register(subtractionC)).not.toThrow();
      expect(registry.has(subtractionC.id)).toBe(true);
    });

    it('should generate double-digit parameters', () => {
      const generator = new ParameterGenerator({ seed: 456 });
      for (let i = 0; i < 20; i++) {
        const params = generator.generate(subtractionC.parameters);
        const a = params.a as number;
        const b = params.b as number;
        
        expect(a).toBeGreaterThanOrEqual(20);
        expect(a).toBeLessThanOrEqual(50);
        expect(b).toBeGreaterThanOrEqual(10);
        expect(b).toBeLessThanOrEqual(30);
        expect(b).toBeLessThan(a);
      }
    });

    it('should handle subtraction with borrowing', () => {
      const params = { a: 42, b: 28 };
      const result = subtractionC.generate(params, 'da-DK');
      
      expect(result.correctAnswer.value).toBe(14);
    });

    it('should provide 4 hint levels with borrowing explanation', () => {
      expect(subtractionC.hints).toHaveLength(4);
      
      const params = { a: 42, b: 28 };
      const hint4 = subtractionC.hints[3](params, 'da-DK');
      expect(hint4).toContain('14');
    });

    it('should handle edge cases', () => {
      const params1 = { a: 20, b: 11 };
      const result1 = subtractionC.generate(params1, 'da-DK');
      expect(result1.correctAnswer.value).toBe(9);

      const params2 = { a: 50, b: 29 };
      const result2 = subtractionC.generate(params2, 'da-DK');
      expect(result2.correctAnswer.value).toBe(21);
    });
  });

  describe('Template Determinism', () => {
    it('should generate same result with same seed', () => {
      const generator1 = new ParameterGenerator({ seed: 999 });
      const params1 = generator1.generate(subtractionA.parameters);
      const result1 = subtractionA.generate(params1, 'da-DK');

      const generator2 = new ParameterGenerator({ seed: 999 });
      const params2 = generator2.generate(subtractionA.parameters);
      const result2 = subtractionA.generate(params2, 'da-DK');

      expect(params1).toEqual(params2);
      expect(result1.correctAnswer.value).toBe(result2.correctAnswer.value);
    });
  });
});

