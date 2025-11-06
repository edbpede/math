/**
 * Decimal Place Value Template Tests
 * 
 * Comprehensive tests for decimal place value exercise templates
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  decimalPlaceValueA,
  decimalPlaceValueB,
  decimalPlaceValueC,
} from './decimal-place-value';
import { TemplateRegistry } from '../../template-registry';
import { ParameterGenerator } from '../../parameter-generator';

describe('Decimal Place Value Templates', () => {
  let registry: TemplateRegistry;

  beforeEach(() => {
    registry = new TemplateRegistry();
  });

  describe('decimalPlaceValueA (Difficulty A)', () => {
    it('should have correct metadata', () => {
      expect(decimalPlaceValueA.id).toBe('tal-algebra-decimal-place-value-4-6-A');
      expect(decimalPlaceValueA.metadata.competencyAreaId).toBe('tal-og-algebra');
      expect(decimalPlaceValueA.metadata.skillsAreaId).toBe('broker-og-procent');
      expect(decimalPlaceValueA.metadata.gradeRange).toBe('4-6');
      expect(decimalPlaceValueA.metadata.difficulty).toBe('A');
      expect(decimalPlaceValueA.metadata.isBinding).toBe(true);
      expect(decimalPlaceValueA.metadata.tags).toContain('tenths');
    });

    it('should register successfully', () => {
      expect(() => registry.register(decimalPlaceValueA)).not.toThrow();
      expect(registry.has(decimalPlaceValueA.id)).toBe(true);
    });

    it('should generate valid parameters for tenths', () => {
      const generator = new ParameterGenerator({ seed: 42 });
      for (let i = 0; i < 20; i++) {
        const params = generator.generate(decimalPlaceValueA.parameters);
        const tenths = params.tenths as number;
        
        expect(tenths).toBeGreaterThanOrEqual(1);
        expect(tenths).toBeLessThanOrEqual(9);
      }
    });

    it('should generate correct answers for Danish locale', () => {
      const params = { tenths: 3 };
      const result = decimalPlaceValueA.generate(params, 'da-DK');
      
      expect(result.correctAnswer.value).toBe('3/10');
      expect(result.correctAnswer.equivalents).toContain(0.3);
      expect(result.correctAnswer.equivalents).toContain('0,3');
      expect(result.questionText).toContain('0,3');
    });

    it('should generate correct answers for English locale', () => {
      const params = { tenths: 7 };
      const result = decimalPlaceValueA.generate(params, 'en-US');
      
      expect(result.correctAnswer.value).toBe('7/10');
      expect(result.correctAnswer.equivalents).toContain(0.7);
      expect(result.correctAnswer.equivalents).toContain('0.7');
      expect(result.questionText).toContain('0.7');
    });

    it('should validate answers in multiple formats', () => {
      const correctAnswer = { value: '3/10', equivalents: [0.3, '0,3'] };
      
      expect(decimalPlaceValueA.validate('3/10', correctAnswer).correct).toBe(true);
      expect(decimalPlaceValueA.validate('0.3', correctAnswer).correct).toBe(true);
      expect(decimalPlaceValueA.validate('0,3', correctAnswer).correct).toBe(true);
      expect(decimalPlaceValueA.validate('6/20', correctAnswer).correct).toBe(true); // Equivalent
      expect(decimalPlaceValueA.validate('0.4', correctAnswer).correct).toBe(false);
    });

    it('should provide 4 hint levels', () => {
      expect(decimalPlaceValueA.hints).toHaveLength(4);
      
      const params = { tenths: 5 };
      const hint1 = decimalPlaceValueA.hints[0](params, 'da-DK');
      const hint2 = decimalPlaceValueA.hints[1](params, 'da-DK');
      const hint3 = decimalPlaceValueA.hints[2](params, 'da-DK');
      const hint4 = decimalPlaceValueA.hints[3](params, 'da-DK');
      
      expect(hint1).toBeTruthy();
      expect(hint2).toBeTruthy();
      expect(hint3).toBeTruthy();
      expect(hint4).toBeTruthy();
      expect(hint4).toContain('5/10');
    });

    it('should generate hints in both Danish and English', () => {
      const params = { tenths: 4 };
      const hintDA = decimalPlaceValueA.hints[0](params, 'da-DK');
      const hintEN = decimalPlaceValueA.hints[0](params, 'en-US');
      
      expect(hintDA).not.toBe(hintEN);
      expect(hintDA).toContain('tiendedele');
      expect(hintEN).toContain('tenths');
    });
  });

  describe('decimalPlaceValueB (Difficulty B)', () => {
    it('should have correct metadata', () => {
      expect(decimalPlaceValueB.id).toBe('tal-algebra-decimal-place-value-4-6-B');
      expect(decimalPlaceValueB.metadata.difficulty).toBe('B');
      expect(decimalPlaceValueB.metadata.tags).toContain('hundredths');
    });

    it('should register successfully', () => {
      expect(() => registry.register(decimalPlaceValueB)).not.toThrow();
      expect(registry.has(decimalPlaceValueB.id)).toBe(true);
    });

    it('should generate valid parameters', () => {
      const generator = new ParameterGenerator({ seed: 123 });
      for (let i = 0; i < 20; i++) {
        const params = generator.generate(decimalPlaceValueB.parameters);
        const tenths = params.tenths as number;
        const hundredths = params.hundredths as number;
        
        expect(tenths).toBeGreaterThanOrEqual(0);
        expect(tenths).toBeLessThanOrEqual(9);
        expect(hundredths).toBeGreaterThanOrEqual(1);
        expect(hundredths).toBeLessThanOrEqual(9);
      }
    });

    it('should generate correct answers for Danish locale', () => {
      const params = { tenths: 3, hundredths: 7 };
      const result = decimalPlaceValueB.generate(params, 'da-DK');
      
      expect(result.correctAnswer.value).toBe('0,37');
      expect(result.correctAnswer.equivalents).toContain(0.37);
      expect(result.correctAnswer.equivalents).toContain('37/100');
    });

    it('should generate correct answers for English locale', () => {
      const params = { tenths: 5, hundredths: 2 };
      const result = decimalPlaceValueB.generate(params, 'en-US');
      
      expect(result.correctAnswer.value).toBe('0.52');
      expect(result.correctAnswer.equivalents).toContain(0.52);
      expect(result.correctAnswer.equivalents).toContain('52/100');
    });

    it('should handle zero tenths correctly', () => {
      const params = { tenths: 0, hundredths: 5 };
      const result = decimalPlaceValueB.generate(params, 'da-DK');
      
      expect(result.correctAnswer.value).toBe('0,05');
      expect(result.correctAnswer.equivalents).toContain(0.05);
    });

    it('should validate answers correctly', () => {
      const correctAnswer = { value: '0,37', equivalents: [0.37, '37/100'] };
      
      expect(decimalPlaceValueB.validate('0.37', correctAnswer).correct).toBe(true);
      expect(decimalPlaceValueB.validate('0,37', correctAnswer).correct).toBe(true);
      expect(decimalPlaceValueB.validate('37/100', correctAnswer).correct).toBe(true);
      expect(decimalPlaceValueB.validate('0.36', correctAnswer).correct).toBe(false);
    });

    it('should provide 4 hint levels', () => {
      expect(decimalPlaceValueB.hints).toHaveLength(4);
    });
  });

  describe('decimalPlaceValueC (Difficulty C)', () => {
    it('should have correct metadata', () => {
      expect(decimalPlaceValueC.id).toBe('tal-algebra-decimal-place-value-4-6-C');
      expect(decimalPlaceValueC.metadata.difficulty).toBe('C');
      expect(decimalPlaceValueC.metadata.tags).toContain('comparison');
    });

    it('should register successfully', () => {
      expect(() => registry.register(decimalPlaceValueC)).not.toThrow();
      expect(registry.has(decimalPlaceValueC.id)).toBe(true);
    });

    it('should generate valid parameters', () => {
      const generator = new ParameterGenerator({ seed: 456 });
      for (let i = 0; i < 20; i++) {
        const params = generator.generate(decimalPlaceValueC.parameters);
        const d1t = params.decimal1Tenths as number;
        const d1h = params.decimal1Hundredths as number;
        const d2t = params.decimal2Tenths as number;
        const d2h = params.decimal2Hundredths as number;
        
        expect(d1t).toBeGreaterThanOrEqual(1);
        expect(d1t).toBeLessThanOrEqual(8);
        expect(d1h).toBeGreaterThanOrEqual(0);
        expect(d1h).toBeLessThanOrEqual(9);
        expect(d2t).toBeGreaterThanOrEqual(1);
        expect(d2t).toBeLessThanOrEqual(8);
        expect(d2h).toBeGreaterThanOrEqual(0);
        expect(d2h).toBeLessThanOrEqual(9);
        
        // Ensure decimals are different
        expect(d1t * 10 + d1h).not.toBe(d2t * 10 + d2h);
      }
    });

    it('should generate correct comparison for greater than', () => {
      const params = { decimal1Tenths: 7, decimal1Hundredths: 5, decimal2Tenths: 3, decimal2Hundredths: 2 };
      const result = decimalPlaceValueC.generate(params, 'da-DK');
      
      expect(result.correctAnswer.value).toBe('>');
      expect(result.questionText).toContain('0,75');
      expect(result.questionText).toContain('0,32');
    });

    it('should generate correct comparison for less than', () => {
      const params = { decimal1Tenths: 2, decimal1Hundredths: 3, decimal2Tenths: 5, decimal2Hundredths: 1 };
      const result = decimalPlaceValueC.generate(params, 'da-DK');
      
      expect(result.correctAnswer.value).toBe('<');
    });

    it('should validate comparison symbols', () => {
      const correctAnswerGreater = { value: '>', equivalents: ['større end', 'greater than', '>'] };
      
      expect(decimalPlaceValueC.validate('>', correctAnswerGreater).correct).toBe(true);
      expect(decimalPlaceValueC.validate('større end', correctAnswerGreater).correct).toBe(true);
      expect(decimalPlaceValueC.validate('<', correctAnswerGreater).correct).toBe(false);
    });

    it('should handle trailing zeros correctly', () => {
      const params = { decimal1Tenths: 5, decimal1Hundredths: 0, decimal2Tenths: 4, decimal2Hundredths: 9 };
      const result = decimalPlaceValueC.generate(params, 'da-DK');
      
      expect(result.correctAnswer.value).toBe('>');
      expect(result.questionText).toContain('0,5'); // Should not show trailing zero
    });

    it('should provide 4 hint levels', () => {
      expect(decimalPlaceValueC.hints).toHaveLength(4);
      
      const params = { decimal1Tenths: 6, decimal1Hundredths: 3, decimal2Tenths: 6, decimal2Hundredths: 7 };
      const hint3 = decimalPlaceValueC.hints[2](params, 'da-DK');
      expect(hint3).toBeTruthy();
    });

    it('should provide appropriate hints for same tenths', () => {
      const params = { decimal1Tenths: 4, decimal1Hundredths: 2, decimal2Tenths: 4, decimal2Hundredths: 8 };
      const hint2 = decimalPlaceValueC.hints[1](params, 'da-DK');
      
      expect(hint2).toContain('4'); // Should mention tenths are same
    });
  });

  describe('Template Determinism', () => {
    it('should generate same result with same seed', () => {
      const generator1 = new ParameterGenerator({ seed: 999 });
      const params1 = generator1.generate(decimalPlaceValueA.parameters);
      const result1 = decimalPlaceValueA.generate(params1, 'da-DK');

      const generator2 = new ParameterGenerator({ seed: 999 });
      const params2 = generator2.generate(decimalPlaceValueA.parameters);
      const result2 = decimalPlaceValueA.generate(params2, 'da-DK');

      expect(params1).toEqual(params2);
      expect(result1.correctAnswer.value).toBe(result2.correctAnswer.value);
    });
  });
});

