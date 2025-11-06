/**
 * Addition Template Tests
 * 
 * Comprehensive tests for addition exercise templates
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { additionA, additionB, additionC } from './addition';
import { TemplateRegistry } from '../../template-registry';
import { ParameterGenerator } from '../../parameter-generator';

describe('Addition Templates', () => {
  let registry: TemplateRegistry;

  beforeEach(() => {
    registry = new TemplateRegistry();
  });

  describe('additionA (Difficulty A)', () => {
    it('should have correct metadata', () => {
      expect(additionA.id).toBe('tal-algebra-addition-0-3-A');
      expect(additionA.metadata.competencyAreaId).toBe('tal-og-algebra');
      expect(additionA.metadata.skillsAreaId).toBe('regning');
      expect(additionA.metadata.gradeRange).toBe('0-3');
      expect(additionA.metadata.difficulty).toBe('A');
      expect(additionA.metadata.isBinding).toBe(true);
      expect(additionA.metadata.tags).toContain('addition');
    });

    it('should register successfully', () => {
      expect(() => registry.register(additionA)).not.toThrow();
      expect(registry.has(additionA.id)).toBe(true);
    });

    it('should generate valid parameters with sum ≤ 10', () => {
      const generator = new ParameterGenerator({ seed: 42 });
      for (let i = 0; i < 20; i++) {
        const params = generator.generate(additionA.parameters);
        const a = params.a as number;
        const b = params.b as number;
        
        expect(a).toBeGreaterThanOrEqual(0);
        expect(a).toBeLessThanOrEqual(9);
        expect(b).toBeGreaterThanOrEqual(0);
        expect(b).toBeLessThanOrEqual(9);
        expect(a + b).toBeLessThanOrEqual(10);
      }
    });

    it('should generate correct answers', () => {
      const params = { a: 3, b: 5 };
      const result = additionA.generate(params, 'da-DK');
      
      expect(result.correctAnswer.value).toBe(8);
      expect(result.questionText).toContain('{{a}}');
      expect(result.questionText).toContain('{{b}}');
    });

    it('should validate correct answers', () => {
      const correctAnswer = { value: 8 };
      
      expect(additionA.validate('8', correctAnswer).correct).toBe(true);
      expect(additionA.validate('7', correctAnswer).correct).toBe(false);
    });

    it('should provide 4 hint levels', () => {
      expect(additionA.hints).toHaveLength(4);
      
      const params = { a: 3, b: 5 };
      const hint1 = additionA.hints[0](params, 'da-DK');
      const hint2 = additionA.hints[1](params, 'da-DK');
      const hint3 = additionA.hints[2](params, 'da-DK');
      const hint4 = additionA.hints[3](params, 'da-DK');
      
      expect(hint1).toBeTruthy();
      expect(hint2).toBeTruthy();
      expect(hint3).toBeTruthy();
      expect(hint4).toBeTruthy();
      expect(hint4).toContain('8'); // Final hint should contain answer
    });

    it('should generate hints in both Danish and English', () => {
      const params = { a: 3, b: 5 };
      const hintDA = additionA.hints[0](params, 'da-DK');
      const hintEN = additionA.hints[0](params, 'en-US');
      
      expect(hintDA).not.toBe(hintEN);
      expect(hintDA.length).toBeGreaterThan(0);
      expect(hintEN.length).toBeGreaterThan(0);
    });
  });

  describe('additionB (Difficulty B)', () => {
    it('should have correct metadata', () => {
      expect(additionB.id).toBe('tal-algebra-addition-0-3-B');
      expect(additionB.metadata.difficulty).toBe('B');
      expect(additionB.metadata.tags).toContain('regrouping');
    });

    it('should register successfully', () => {
      expect(() => registry.register(additionB)).not.toThrow();
      expect(registry.has(additionB.id)).toBe(true);
    });

    it('should generate valid parameters with sum ≤ 20', () => {
      const generator = new ParameterGenerator({ seed: 123 });
      for (let i = 0; i < 20; i++) {
        const params = generator.generate(additionB.parameters);
        const a = params.a as number;
        const b = params.b as number;
        
        expect(a).toBeGreaterThanOrEqual(5);
        expect(a).toBeLessThanOrEqual(19);
        expect(b).toBeGreaterThanOrEqual(1);
        expect(b).toBeLessThanOrEqual(9);
        expect(a + b).toBeLessThanOrEqual(20);
      }
    });

    it('should handle regrouping correctly', () => {
      const params = { a: 9, b: 7 };
      const result = additionB.generate(params, 'da-DK');
      
      expect(result.correctAnswer.value).toBe(16);
    });

    it('should provide 4 hint levels', () => {
      expect(additionB.hints).toHaveLength(4);
    });
  });

  describe('additionC (Difficulty C)', () => {
    it('should have correct metadata', () => {
      expect(additionC.id).toBe('tal-algebra-addition-0-3-C');
      expect(additionC.metadata.difficulty).toBe('C');
      expect(additionC.metadata.tags).toContain('double-digit');
    });

    it('should register successfully', () => {
      expect(() => registry.register(additionC)).not.toThrow();
      expect(registry.has(additionC.id)).toBe(true);
    });

    it('should generate double-digit parameters', () => {
      const generator = new ParameterGenerator({ seed: 456 });
      for (let i = 0; i < 20; i++) {
        const params = generator.generate(additionC.parameters);
        const a = params.a as number;
        const b = params.b as number;
        
        expect(a).toBeGreaterThanOrEqual(10);
        expect(a).toBeLessThanOrEqual(49);
        expect(b).toBeGreaterThanOrEqual(10);
        expect(b).toBeLessThanOrEqual(49);
        expect(a + b).toBeLessThanOrEqual(99);
      }
    });

    it('should handle double-digit addition with regrouping', () => {
      const params = { a: 37, b: 28 };
      const result = additionC.generate(params, 'da-DK');
      
      expect(result.correctAnswer.value).toBe(65);
    });

    it('should provide 4 hint levels', () => {
      expect(additionC.hints).toHaveLength(4);
      
      const params = { a: 37, b: 28 };
      const hint4 = additionC.hints[3](params, 'da-DK');
      expect(hint4).toContain('65');
    });

    it('should handle edge cases', () => {
      const params1 = { a: 10, b: 10 };
      const result1 = additionC.generate(params1, 'da-DK');
      expect(result1.correctAnswer.value).toBe(20);

      const params2 = { a: 49, b: 50 };
      const result2 = additionC.generate(params2, 'da-DK');
      expect(result2.correctAnswer.value).toBe(99);
    });
  });

  describe('Template Determinism', () => {
    it('should generate same result with same seed', () => {
      const generator1 = new ParameterGenerator({ seed: 999 });
      const params1 = generator1.generate(additionA.parameters);
      const result1 = additionA.generate(params1, 'da-DK');

      const generator2 = new ParameterGenerator({ seed: 999 });
      const params2 = generator2.generate(additionA.parameters);
      const result2 = additionA.generate(params2, 'da-DK');

      expect(params1).toEqual(params2);
      expect(result1.correctAnswer.value).toBe(result2.correctAnswer.value);
    });
  });
});

