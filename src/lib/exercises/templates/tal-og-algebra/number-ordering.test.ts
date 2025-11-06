/**
 * Number Ordering Template Tests
 * 
 * Comprehensive tests for number ordering exercise templates
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { numberOrderingA, numberOrderingB, numberOrderingC } from './number-ordering';
import { TemplateRegistry } from '../../template-registry';
import { ParameterGenerator } from '../../parameter-generator';

describe('Number Ordering Templates', () => {
  let registry: TemplateRegistry;

  beforeEach(() => {
    registry = new TemplateRegistry();
  });

  describe('numberOrderingA (Difficulty A)', () => {
    it('should have correct metadata', () => {
      expect(numberOrderingA.id).toBe('tal-algebra-ordering-0-3-A');
      expect(numberOrderingA.metadata.competencyAreaId).toBe('tal-og-algebra');
      expect(numberOrderingA.metadata.skillsAreaId).toBe('tal');
      expect(numberOrderingA.metadata.gradeRange).toBe('0-3');
      expect(numberOrderingA.metadata.difficulty).toBe('A');
      expect(numberOrderingA.metadata.isBinding).toBe(true);
      expect(numberOrderingA.metadata.tags).toContain('ordering');
    });

    it('should register successfully', () => {
      expect(() => registry.register(numberOrderingA)).not.toThrow();
      expect(registry.has(numberOrderingA.id)).toBe(true);
    });

    it('should generate valid parameters in range 0-20', () => {
      const generator = new ParameterGenerator({ seed: 42 });
      for (let i = 0; i < 20; i++) {
        const params = generator.generate(numberOrderingA.parameters);
        const num1 = params.num1 as number;
        const num2 = params.num2 as number;
        const num3 = params.num3 as number;
        const direction = params.direction as string;
        
        expect(num1).toBeGreaterThanOrEqual(0);
        expect(num1).toBeLessThanOrEqual(20);
        expect(num2).toBeGreaterThanOrEqual(0);
        expect(num2).toBeLessThanOrEqual(20);
        expect(num3).toBeGreaterThanOrEqual(0);
        expect(num3).toBeLessThanOrEqual(20);
        
        // Ensure all numbers are different
        expect(num1).not.toBe(num2);
        expect(num1).not.toBe(num3);
        expect(num2).not.toBe(num3);
        
        expect(['ascending', 'descending']).toContain(direction);
      }
    });

    it('should generate correct ascending order', () => {
      const params = { num1: 15, num2: 3, num3: 9, direction: 'ascending' };
      const result = numberOrderingA.generate(params, 'da-DK');
      
      expect(result.correctAnswer.value).toBe('3, 9, 15');
    });

    it('should generate correct descending order', () => {
      const params = { num1: 15, num2: 3, num3: 9, direction: 'descending' };
      const result = numberOrderingA.generate(params, 'da-DK');
      
      expect(result.correctAnswer.value).toBe('15, 9, 3');
    });

    it('should validate correct answers with commas and spaces', () => {
      const params = { num1: 15, num2: 3, num3: 9, direction: 'ascending' };
      const result = numberOrderingA.generate(params, 'da-DK');
      
      expect(numberOrderingA.validate('3, 9, 15', result.correctAnswer).correct).toBe(true);
      expect(numberOrderingA.validate('3,9,15', result.correctAnswer).correct).toBe(true);
      expect(numberOrderingA.validate('3 9 15', result.correctAnswer).correct).toBe(true);
    });

    it('should reject incorrect ordering', () => {
      const params = { num1: 15, num2: 3, num3: 9, direction: 'ascending' };
      const result = numberOrderingA.generate(params, 'da-DK');
      
      expect(numberOrderingA.validate('15, 9, 3', result.correctAnswer).correct).toBe(false);
      expect(numberOrderingA.validate('3, 15, 9', result.correctAnswer).correct).toBe(false);
    });

    it('should reject answers with wrong number of elements', () => {
      const params = { num1: 15, num2: 3, num3: 9, direction: 'ascending' };
      const result = numberOrderingA.generate(params, 'da-DK');
      
      expect(numberOrderingA.validate('3, 9', result.correctAnswer).correct).toBe(false);
      expect(numberOrderingA.validate('3, 9, 15, 20', result.correctAnswer).correct).toBe(false);
    });

    it('should provide 4 hint levels', () => {
      expect(numberOrderingA.hints).toHaveLength(4);
      
      const params = { num1: 15, num2: 3, num3: 9, direction: 'ascending' };
      const hint1 = numberOrderingA.hints[0](params, 'da-DK');
      const hint2 = numberOrderingA.hints[1](params, 'da-DK');
      const hint3 = numberOrderingA.hints[2](params, 'da-DK');
      const hint4 = numberOrderingA.hints[3](params, 'da-DK');
      
      expect(hint1).toBeTruthy();
      expect(hint2).toBeTruthy();
      expect(hint3).toBeTruthy();
      expect(hint4).toBeTruthy();
      expect(hint4).toContain('3'); // Final hint should contain answer
    });

    it('should generate hints in both Danish and English', () => {
      const params = { num1: 15, num2: 3, num3: 9, direction: 'ascending' };
      const hintDA = numberOrderingA.hints[0](params, 'da-DK');
      const hintEN = numberOrderingA.hints[0](params, 'en-US');
      
      expect(hintDA).not.toBe(hintEN);
      expect(hintDA.length).toBeGreaterThan(0);
      expect(hintEN.length).toBeGreaterThan(0);
    });

    it('should provide different hints for ascending vs descending', () => {
      const paramsAsc = { num1: 15, num2: 3, num3: 9, direction: 'ascending' };
      const paramsDesc = { num1: 15, num2: 3, num3: 9, direction: 'descending' };
      
      const hintAsc = numberOrderingA.hints[0](paramsAsc, 'da-DK');
      const hintDesc = numberOrderingA.hints[0](paramsDesc, 'da-DK');
      
      expect(hintAsc).not.toBe(hintDesc);
    });
  });

  describe('numberOrderingB (Difficulty B)', () => {
    it('should have correct metadata', () => {
      expect(numberOrderingB.id).toBe('tal-algebra-ordering-0-3-B');
      expect(numberOrderingB.metadata.difficulty).toBe('B');
      expect(numberOrderingB.metadata.tags).toContain('two-digit');
    });

    it('should register successfully', () => {
      expect(() => registry.register(numberOrderingB)).not.toThrow();
      expect(registry.has(numberOrderingB.id)).toBe(true);
    });

    it('should generate valid parameters in range 0-100 with 4 unique numbers', () => {
      const generator = new ParameterGenerator({ seed: 42 });
      for (let i = 0; i < 20; i++) {
        const params = generator.generate(numberOrderingB.parameters);
        const num1 = params.num1 as number;
        const num2 = params.num2 as number;
        const num3 = params.num3 as number;
        const num4 = params.num4 as number;
        
        expect(num1).toBeGreaterThanOrEqual(0);
        expect(num1).toBeLessThanOrEqual(100);
        expect(num2).toBeGreaterThanOrEqual(0);
        expect(num2).toBeLessThanOrEqual(100);
        expect(num3).toBeGreaterThanOrEqual(0);
        expect(num3).toBeLessThanOrEqual(100);
        expect(num4).toBeGreaterThanOrEqual(0);
        expect(num4).toBeLessThanOrEqual(100);
        
        // Ensure all numbers are different
        const numbers = [num1, num2, num3, num4];
        const uniqueNumbers = new Set(numbers);
        expect(uniqueNumbers.size).toBe(4);
      }
    });

    it('should generate correct ascending order with 4 numbers', () => {
      const params = { num1: 73, num2: 15, num3: 99, num4: 42, direction: 'ascending' };
      const result = numberOrderingB.generate(params, 'da-DK');
      
      expect(result.correctAnswer.value).toBe('15, 42, 73, 99');
    });

    it('should generate correct descending order with 4 numbers', () => {
      const params = { num1: 73, num2: 15, num3: 99, num4: 42, direction: 'descending' };
      const result = numberOrderingB.generate(params, 'da-DK');
      
      expect(result.correctAnswer.value).toBe('99, 73, 42, 15');
    });

    it('should validate correct answers', () => {
      const params = { num1: 73, num2: 15, num3: 99, num4: 42, direction: 'ascending' };
      const result = numberOrderingB.generate(params, 'da-DK');
      
      expect(numberOrderingB.validate('15, 42, 73, 99', result.correctAnswer).correct).toBe(true);
      expect(numberOrderingB.validate('15,42,73,99', result.correctAnswer).correct).toBe(true);
    });

    it('should provide 4 hint levels', () => {
      expect(numberOrderingB.hints).toHaveLength(4);
    });
  });

  describe('numberOrderingC (Difficulty C)', () => {
    it('should have correct metadata', () => {
      expect(numberOrderingC.id).toBe('tal-algebra-ordering-0-3-C');
      expect(numberOrderingC.metadata.difficulty).toBe('C');
      expect(numberOrderingC.metadata.tags).toContain('three-digit');
    });

    it('should register successfully', () => {
      expect(() => registry.register(numberOrderingC)).not.toThrow();
      expect(registry.has(numberOrderingC.id)).toBe(true);
    });

    it('should generate valid parameters in range 0-1000 with 5 unique numbers', () => {
      const generator = new ParameterGenerator({ seed: 42 });
      for (let i = 0; i < 20; i++) {
        const params = generator.generate(numberOrderingC.parameters);
        const num1 = params.num1 as number;
        const num2 = params.num2 as number;
        const num3 = params.num3 as number;
        const num4 = params.num4 as number;
        const num5 = params.num5 as number;
        
        expect(num1).toBeGreaterThanOrEqual(0);
        expect(num1).toBeLessThanOrEqual(1000);
        expect(num2).toBeGreaterThanOrEqual(0);
        expect(num2).toBeLessThanOrEqual(1000);
        expect(num3).toBeGreaterThanOrEqual(0);
        expect(num3).toBeLessThanOrEqual(1000);
        expect(num4).toBeGreaterThanOrEqual(0);
        expect(num4).toBeLessThanOrEqual(1000);
        expect(num5).toBeGreaterThanOrEqual(0);
        expect(num5).toBeLessThanOrEqual(1000);
        
        // Ensure all numbers are different
        const numbers = [num1, num2, num3, num4, num5];
        const uniqueNumbers = new Set(numbers);
        expect(uniqueNumbers.size).toBe(5);
      }
    });

    it('should generate correct ascending order with 5 numbers', () => {
      const params = { num1: 526, num2: 89, num3: 742, num4: 15, num5: 340, direction: 'ascending' };
      const result = numberOrderingC.generate(params, 'da-DK');
      
      expect(result.correctAnswer.value).toBe('15, 89, 340, 526, 742');
    });

    it('should generate correct descending order with 5 numbers', () => {
      const params = { num1: 526, num2: 89, num3: 742, num4: 15, num5: 340, direction: 'descending' };
      const result = numberOrderingC.generate(params, 'da-DK');
      
      expect(result.correctAnswer.value).toBe('742, 526, 340, 89, 15');
    });

    it('should validate correct answers', () => {
      const params = { num1: 526, num2: 89, num3: 742, num4: 15, num5: 340, direction: 'ascending' };
      const result = numberOrderingC.generate(params, 'da-DK');
      
      expect(numberOrderingC.validate('15, 89, 340, 526, 742', result.correctAnswer).correct).toBe(true);
      expect(numberOrderingC.validate('15,89,340,526,742', result.correctAnswer).correct).toBe(true);
    });

    it('should reject incorrect ordering', () => {
      const params = { num1: 526, num2: 89, num3: 742, num4: 15, num5: 340, direction: 'ascending' };
      const result = numberOrderingC.generate(params, 'da-DK');
      
      expect(numberOrderingC.validate('742, 526, 340, 89, 15', result.correctAnswer).correct).toBe(false);
    });

    it('should provide 4 hint levels', () => {
      expect(numberOrderingC.hints).toHaveLength(4);
    });

    it('should provide hints mentioning hundreds, tens, and ones', () => {
      const params = { num1: 526, num2: 89, num3: 742, num4: 15, num5: 340, direction: 'ascending' };
      const hint1 = numberOrderingC.hints[0](params, 'da-DK');
      
      // Should mention place value concepts
      expect(hint1.toLowerCase()).toMatch(/hundred|tier|ener/);
    });
  });

  describe('Cross-template compatibility', () => {
    it('should not have duplicate template IDs', () => {
      const ids = [
        numberOrderingA.id,
        numberOrderingB.id,
        numberOrderingC.id,
      ];
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(ids.length);
    });

    it('should all have the same competency and skills area', () => {
      const templates = [numberOrderingA, numberOrderingB, numberOrderingC];
      templates.forEach(template => {
        expect(template.metadata.competencyAreaId).toBe('tal-og-algebra');
        expect(template.metadata.skillsAreaId).toBe('tal');
        expect(template.metadata.gradeRange).toBe('0-3');
      });
    });

    it('should all be binding content', () => {
      const templates = [numberOrderingA, numberOrderingB, numberOrderingC];
      templates.forEach(template => {
        expect(template.metadata.isBinding).toBe(true);
      });
    });
  });
});

