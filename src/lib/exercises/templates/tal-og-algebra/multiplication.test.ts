/**
 * Multiplication Template Tests
 * 
 * Comprehensive tests for multiplication exercise templates
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { multiplicationA, multiplicationB, multiplicationC } from './multiplication';
import { TemplateRegistry } from '../../template-registry';
import { ParameterGenerator } from '../../parameter-generator';

describe('Multiplication Templates', () => {
  let registry: TemplateRegistry;

  beforeEach(() => {
    registry = new TemplateRegistry();
  });

  describe('multiplicationA (Difficulty A)', () => {
    it('should have correct metadata', () => {
      expect(multiplicationA.id).toBe('tal-algebra-multiplication-0-3-A');
      expect(multiplicationA.metadata.competencyAreaId).toBe('tal-og-algebra');
      expect(multiplicationA.metadata.skillsAreaId).toBe('regning');
      expect(multiplicationA.metadata.gradeRange).toBe('0-3');
      expect(multiplicationA.metadata.difficulty).toBe('A');
      expect(multiplicationA.metadata.isBinding).toBe(true);
      expect(multiplicationA.metadata.tags).toContain('multiplication');
    });

    it('should register successfully', () => {
      expect(() => registry.register(multiplicationA)).not.toThrow();
      expect(registry.has(multiplicationA.id)).toBe(true);
    });

    it('should generate valid parameters (0-5 × 0-5)', () => {
      const generator = new ParameterGenerator({ seed: 42 });
      for (let i = 0; i < 20; i++) {
        const params = generator.generate(multiplicationA.parameters);
        const a = params.a as number;
        const b = params.b as number;
        
        expect(a).toBeGreaterThanOrEqual(0);
        expect(a).toBeLessThanOrEqual(5);
        expect(b).toBeGreaterThanOrEqual(0);
        expect(b).toBeLessThanOrEqual(5);
      }
    });

    it('should generate correct answers', () => {
      const params = { a: 3, b: 4 };
      const result = multiplicationA.generate(params, 'da-DK');
      
      expect(result.correctAnswer.value).toBe(12);
    });

    it('should validate correct answers', () => {
      const correctAnswer = { value: 12 };
      
      expect(multiplicationA.validate('12', correctAnswer).correct).toBe(true);
      expect(multiplicationA.validate('11', correctAnswer).correct).toBe(false);
    });

    it('should handle multiplication by zero', () => {
      const params1 = { a: 0, b: 5 };
      const result1 = multiplicationA.generate(params1, 'da-DK');
      expect(result1.correctAnswer.value).toBe(0);

      const params2 = { a: 5, b: 0 };
      const result2 = multiplicationA.generate(params2, 'da-DK');
      expect(result2.correctAnswer.value).toBe(0);
    });

    it('should handle multiplication by one', () => {
      const params = { a: 1, b: 5 };
      const result = multiplicationA.generate(params, 'da-DK');
      expect(result.correctAnswer.value).toBe(5);
    });

    it('should provide 4 hint levels', () => {
      expect(multiplicationA.hints).toHaveLength(4);
      
      const params = { a: 3, b: 4 };
      const hint4 = multiplicationA.hints[3](params, 'da-DK');
      expect(hint4).toContain('12');
    });
  });

  describe('multiplicationB (Difficulty B)', () => {
    it('should have correct metadata', () => {
      expect(multiplicationB.id).toBe('tal-algebra-multiplication-0-3-B');
      expect(multiplicationB.metadata.difficulty).toBe('B');
      expect(multiplicationB.metadata.tags).toContain('times-tables');
    });

    it('should register successfully', () => {
      expect(() => registry.register(multiplicationB)).not.toThrow();
      expect(registry.has(multiplicationB.id)).toBe(true);
    });

    it('should focus on 2, 5, 10 times tables', () => {
      const generator = new ParameterGenerator({ seed: 123 });
      for (let i = 0; i < 20; i++) {
        const params = generator.generate(multiplicationB.parameters);
        const a = params.a as number;
        const b = params.b as number;
        
        expect([2, 5, 10]).toContain(a);
        expect(b).toBeGreaterThanOrEqual(0);
        expect(b).toBeLessThanOrEqual(10);
      }
    });

    it('should handle 2 times table', () => {
      const params = { a: 2, b: 7 };
      const result = multiplicationB.generate(params, 'da-DK');
      expect(result.correctAnswer.value).toBe(14);
    });

    it('should handle 5 times table', () => {
      const params = { a: 5, b: 6 };
      const result = multiplicationB.generate(params, 'da-DK');
      expect(result.correctAnswer.value).toBe(30);
    });

    it('should handle 10 times table', () => {
      const params = { a: 10, b: 8 };
      const result = multiplicationB.generate(params, 'da-DK');
      expect(result.correctAnswer.value).toBe(80);
    });

    it('should provide 4 hint levels', () => {
      expect(multiplicationB.hints).toHaveLength(4);
    });
  });

  describe('multiplicationC (Difficulty C)', () => {
    it('should have correct metadata', () => {
      expect(multiplicationC.id).toBe('tal-algebra-multiplication-0-3-C');
      expect(multiplicationC.metadata.difficulty).toBe('C');
      expect(multiplicationC.metadata.tags).toContain('advanced');
    });

    it('should register successfully', () => {
      expect(() => registry.register(multiplicationC)).not.toThrow();
      expect(registry.has(multiplicationC.id)).toBe(true);
    });

    it('should generate parameters (2-10 × 2-10)', () => {
      const generator = new ParameterGenerator({ seed: 456 });
      for (let i = 0; i < 20; i++) {
        const params = generator.generate(multiplicationC.parameters);
        const a = params.a as number;
        const b = params.b as number;
        
        expect(a).toBeGreaterThanOrEqual(2);
        expect(a).toBeLessThanOrEqual(10);
        expect(b).toBeGreaterThanOrEqual(2);
        expect(b).toBeLessThanOrEqual(10);
      }
    });

    it('should handle all multiplication facts to 10×10', () => {
      const params = { a: 7, b: 8 };
      const result = multiplicationC.generate(params, 'da-DK');
      expect(result.correctAnswer.value).toBe(56);
    });

    it('should handle squared numbers', () => {
      const params = { a: 9, b: 9 };
      const result = multiplicationC.generate(params, 'da-DK');
      expect(result.correctAnswer.value).toBe(81);
    });

    it('should provide 4 hint levels with strategies', () => {
      expect(multiplicationC.hints).toHaveLength(4);
      
      const params = { a: 7, b: 8 };
      const hint4 = multiplicationC.hints[3](params, 'da-DK');
      expect(hint4).toContain('56');
    });

    it('should handle commutative property', () => {
      const params1 = { a: 3, b: 7 };
      const result1 = multiplicationC.generate(params1, 'da-DK');
      
      const params2 = { a: 7, b: 3 };
      const result2 = multiplicationC.generate(params2, 'da-DK');
      
      expect(result1.correctAnswer.value).toBe(result2.correctAnswer.value);
    });
  });

  describe('Template Determinism', () => {
    it('should generate same result with same seed', () => {
      const generator1 = new ParameterGenerator({ seed: 999 });
      const params1 = generator1.generate(multiplicationA.parameters);
      const result1 = multiplicationA.generate(params1, 'da-DK');

      const generator2 = new ParameterGenerator({ seed: 999 });
      const params2 = generator2.generate(multiplicationA.parameters);
      const result2 = multiplicationA.generate(params2, 'da-DK');

      expect(params1).toEqual(params2);
      expect(result1.correctAnswer.value).toBe(result2.correctAnswer.value);
    });
  });
});

