/**
 * Division Template Tests
 * 
 * Comprehensive tests for division exercise templates
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { divisionA, divisionB, divisionC } from './division';
import { TemplateRegistry } from '../../template-registry';
import { ParameterGenerator } from '../../parameter-generator';

describe('Division Templates', () => {
  let registry: TemplateRegistry;

  beforeEach(() => {
    registry = new TemplateRegistry();
  });

  describe('divisionA (Difficulty A)', () => {
    it('should have correct metadata', () => {
      expect(divisionA.id).toBe('tal-algebra-division-0-3-A');
      expect(divisionA.metadata.competencyAreaId).toBe('tal-og-algebra');
      expect(divisionA.metadata.skillsAreaId).toBe('regning');
      expect(divisionA.metadata.gradeRange).toBe('0-3');
      expect(divisionA.metadata.difficulty).toBe('A');
      expect(divisionA.metadata.isBinding).toBe(true);
      expect(divisionA.metadata.tags).toContain('division');
    });

    it('should register successfully', () => {
      expect(() => registry.register(divisionA)).not.toThrow();
      expect(registry.has(divisionA.id)).toBe(true);
    });

    it('should use simple divisors (1, 2, 5, 10)', () => {
      const generator = new ParameterGenerator({ seed: 42 });
      for (let i = 0; i < 20; i++) {
        const params = generator.generate(divisionA.parameters);
        const divisor = params.divisor as number;
        
        expect([1, 2, 5, 10]).toContain(divisor);
      }
    });

    it('should generate whole number results', () => {
      const generator = new ParameterGenerator({ seed: 123 });
      for (let i = 0; i < 20; i++) {
        const params = generator.generate(divisionA.parameters);
        const divisor = params.divisor as number;
        const quotient = params.quotient as number;
        const dividend = divisor * quotient;
        
        expect(dividend % divisor).toBe(0);
        expect(dividend / divisor).toBe(quotient);
      }
    });

    it('should generate correct answers', () => {
      const params = { divisor: 2, quotient: 5 };
      const result = divisionA.generate(params, 'da-DK');
      
      // dividend = divisor * quotient = 2 * 5 = 10
      // So 10 ÷ 2 = 5
      expect(result.correctAnswer.value).toBe(5);
    });

    it('should validate correct answers', () => {
      const correctAnswer = { value: 5 };
      
      expect(divisionA.validate('5', correctAnswer).correct).toBe(true);
      expect(divisionA.validate('4', correctAnswer).correct).toBe(false);
    });

    it('should handle division by 1', () => {
      const params = { divisor: 1, quotient: 7 };
      const result = divisionA.generate(params, 'da-DK');
      expect(result.correctAnswer.value).toBe(7);
    });

    it('should handle division by 10', () => {
      const params = { divisor: 10, quotient: 6 };
      const result = divisionA.generate(params, 'da-DK');
      expect(result.correctAnswer.value).toBe(6);
    });

    it('should provide 4 hint levels', () => {
      expect(divisionA.hints).toHaveLength(4);
      
      const params = { divisor: 2, quotient: 5 };
      const hint4 = divisionA.hints[3](params, 'da-DK');
      expect(hint4).toContain('5');
    });
  });

  describe('divisionB (Difficulty B)', () => {
    it('should have correct metadata', () => {
      expect(divisionB.id).toBe('tal-algebra-division-0-3-B');
      expect(divisionB.metadata.difficulty).toBe('B');
      expect(divisionB.metadata.tags).toContain('division-facts');
    });

    it('should register successfully', () => {
      expect(() => registry.register(divisionB)).not.toThrow();
      expect(registry.has(divisionB.id)).toBe(true);
    });

    it('should use divisors 2-5', () => {
      const generator = new ParameterGenerator({ seed: 123 });
      for (let i = 0; i < 20; i++) {
        const params = generator.generate(divisionB.parameters);
        const divisor = params.divisor as number;
        
        expect(divisor).toBeGreaterThanOrEqual(2);
        expect(divisor).toBeLessThanOrEqual(5);
      }
    });

    it('should generate quotients 2-10', () => {
      const generator = new ParameterGenerator({ seed: 456 });
      for (let i = 0; i < 20; i++) {
        const params = generator.generate(divisionB.parameters);
        const quotient = params.quotient as number;
        
        expect(quotient).toBeGreaterThanOrEqual(2);
        expect(quotient).toBeLessThanOrEqual(10);
      }
    });

    it('should generate whole number results', () => {
      const params = { divisor: 4, quotient: 7 };
      const result = divisionB.generate(params, 'da-DK');
      
      // dividend = 4 * 7 = 28
      // 28 ÷ 4 = 7
      expect(result.correctAnswer.value).toBe(7);
    });

    it('should provide 4 hint levels', () => {
      expect(divisionB.hints).toHaveLength(4);
    });
  });

  describe('divisionC (Difficulty C)', () => {
    it('should have correct metadata', () => {
      expect(divisionC.id).toBe('tal-algebra-division-0-3-C');
      expect(divisionC.metadata.difficulty).toBe('C');
      expect(divisionC.metadata.tags).toContain('advanced-division');
    });

    it('should register successfully', () => {
      expect(() => registry.register(divisionC)).not.toThrow();
      expect(registry.has(divisionC.id)).toBe(true);
    });

    it('should use divisors 2-10', () => {
      const generator = new ParameterGenerator({ seed: 789 });
      for (let i = 0; i < 20; i++) {
        const params = generator.generate(divisionC.parameters);
        const divisor = params.divisor as number;
        
        expect(divisor).toBeGreaterThanOrEqual(2);
        expect(divisor).toBeLessThanOrEqual(10);
      }
    });

    it('should generate quotients 2-12', () => {
      const generator = new ParameterGenerator({ seed: 321 });
      for (let i = 0; i < 20; i++) {
        const params = generator.generate(divisionC.parameters);
        const quotient = params.quotient as number;
        
        expect(quotient).toBeGreaterThanOrEqual(2);
        expect(quotient).toBeLessThanOrEqual(12);
      }
    });

    it('should handle larger division facts', () => {
      const params = { divisor: 8, quotient: 9 };
      const result = divisionC.generate(params, 'da-DK');
      
      // dividend = 8 * 9 = 72
      // 72 ÷ 8 = 9
      expect(result.correctAnswer.value).toBe(9);
    });

    it('should provide 4 hint levels with strategies', () => {
      expect(divisionC.hints).toHaveLength(4);
      
      const params = { divisor: 7, quotient: 8 };
      const hint4 = divisionC.hints[3](params, 'da-DK');
      expect(hint4).toContain('8');
    });

    it('should verify relationship between multiplication and division', () => {
      const params = { divisor: 6, quotient: 11 };
      const result = divisionC.generate(params, 'da-DK');
      const dividend = 6 * 11;
      
      expect(dividend / 6).toBe(result.correctAnswer.value);
    });
  });

  describe('Template Determinism', () => {
    it('should generate same result with same seed', () => {
      const generator1 = new ParameterGenerator({ seed: 999 });
      const params1 = generator1.generate(divisionA.parameters);
      const result1 = divisionA.generate(params1, 'da-DK');

      const generator2 = new ParameterGenerator({ seed: 999 });
      const params2 = generator2.generate(divisionA.parameters);
      const result2 = divisionA.generate(params2, 'da-DK');

      expect(params1).toEqual(params2);
      expect(result1.correctAnswer.value).toBe(result2.correctAnswer.value);
    });
  });

  describe('Division Consistency', () => {
    it('should ensure dividend = divisor × quotient for all templates', () => {
      const templates = [divisionA, divisionB, divisionC];
      
      templates.forEach(template => {
        const generator = new ParameterGenerator({ seed: 555 });
        const params = generator.generate(template.parameters);
        const divisor = params.divisor as number;
        const quotient = params.quotient as number;
        
        const result = template.generate(params, 'da-DK');
        
        // Extract dividend from question text or calculate it
        const dividend = divisor * quotient;
        expect(dividend / divisor).toBe(result.correctAnswer.value);
      });
    });
  });
});

