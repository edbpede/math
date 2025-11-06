/**
 * Tests for Worked Solution Generator
 *
 * Verifies that solution generation produces correct step-by-step solutions
 * for various arithmetic operations.
 */

import { describe, it, expect } from 'vitest';
import {
  createWorkedSolution,
  createStep,
  createNumberLine,
  createPlaceValueDiagram,
  createFractionDiagram,
  generateAdditionSolution,
  generateSubtractionSolution,
  generateMultiplicationSolution,
  generateDivisionSolution,
} from './solution-generator';

describe('Solution Generator - Utility Functions', () => {
  describe('createWorkedSolution', () => {
    it('should create a worked solution with steps and final answer', () => {
      const steps = [
        createStep('First step', '1 + 1'),
        createStep('Second step', '= 2'),
      ];
      const solution = createWorkedSolution(steps, 'The answer is 2');

      expect(solution.steps).toHaveLength(2);
      expect(solution.finalAnswer).toBe('The answer is 2');
      expect(solution.visualAid).toBeUndefined();
    });

    it('should include visual aid when provided', () => {
      const visualAid = createNumberLine(0, 5, [2, 3]);
      const solution = createWorkedSolution([], 'Answer', visualAid);

      expect(solution.visualAid).toBeDefined();
      expect(solution.visualAid?.type).toBe('number-line');
    });
  });

  describe('createStep', () => {
    it('should create a solution step with explanation and expression', () => {
      const step = createStep('Add the numbers', '5 + 3 = 8');

      expect(step.explanation).toBe('Add the numbers');
      expect(step.expression).toBe('5 + 3 = 8');
      expect(step.visualAid).toBeUndefined();
    });

    it('should include visual aid when provided', () => {
      const visualAid = createNumberLine(5, 8, [3]);
      const step = createStep('Count forward', '5 + 3', visualAid);

      expect(step.visualAid).toBeDefined();
    });
  });

  describe('createNumberLine', () => {
    it('should create a number line visual aid', () => {
      const numberLine = createNumberLine(5, 10, [3, 2]);

      expect(numberLine.type).toBe('number-line');
      expect(numberLine.data).toMatchObject({
        start: 5,
        end: 10,
        hops: [3, 2],
      });
    });

    it('should calculate appropriate range', () => {
      const numberLine = createNumberLine(5, 10, [5]);
      const data = numberLine.data as { range: [number, number] };

      expect(data.range[0]).toBe(3); // min(5, 10) - 2
      expect(data.range[1]).toBe(12); // max(5, 10) + 2
    });
  });

  describe('createPlaceValueDiagram', () => {
    it('should create a place value diagram', () => {
      const diagram = createPlaceValueDiagram(235, {
        hundreds: 2,
        tens: 3,
        ones: 5,
      });

      expect(diagram.type).toBe('diagram');
      expect(diagram.data).toMatchObject({
        diagramType: 'place-value',
        number: 235,
        breakdown: {
          hundreds: 2,
          tens: 3,
          ones: 5,
        },
      });
    });
  });

  describe('createFractionDiagram', () => {
    it('should create a fraction diagram with default shape', () => {
      const diagram = createFractionDiagram(3, 4);

      expect(diagram.type).toBe('diagram');
      expect(diagram.data).toMatchObject({
        diagramType: 'fraction',
        numerator: 3,
        denominator: 4,
        shapeType: 'rectangle',
      });
    });

    it('should accept custom shape type', () => {
      const diagram = createFractionDiagram(1, 2, 'circle');
      const data = diagram.data as { shapeType: string };

      expect(data.shapeType).toBe('circle');
    });
  });
});

describe('Solution Generator - Addition', () => {
  describe('generateAdditionSolution (Danish)', () => {
    it('should generate solution for simple single-digit addition', () => {
      const solution = generateAdditionSolution(5, 3, 'da-DK');

      expect(solution.steps.length).toBeGreaterThan(0);
      expect(solution.finalAnswer).toContain('8');
      expect(solution.steps[0].explanation).toContain('5');
    });

    it('should generate solution for double-digit addition without regrouping', () => {
      const solution = generateAdditionSolution(12, 15, 'da-DK');

      expect(solution.steps.length).toBeGreaterThan(2);
      expect(solution.finalAnswer).toContain('27');
      expect(solution.steps.some(step => step.explanation.includes('tiere'))).toBe(true);
    });

    it('should generate solution for addition with regrouping', () => {
      const solution = generateAdditionSolution(15, 8, 'da-DK');

      expect(solution.steps.length).toBeGreaterThan(3);
      expect(solution.finalAnswer).toContain('23');
      expect(solution.steps.some(step => step.explanation.includes('ekstra tier'))).toBe(true);
    });
  });

  describe('generateAdditionSolution (English)', () => {
    it('should generate solution for simple single-digit addition', () => {
      const solution = generateAdditionSolution(7, 2, 'en-US');

      expect(solution.steps.length).toBeGreaterThan(0);
      expect(solution.finalAnswer).toContain('9');
      expect(solution.steps[0].explanation).toContain('7');
    });

    it('should generate solution for double-digit addition', () => {
      const solution = generateAdditionSolution(23, 16, 'en-US');

      expect(solution.steps.length).toBeGreaterThan(2);
      expect(solution.finalAnswer).toContain('39');
      expect(solution.steps.some(step => step.explanation.includes('tens'))).toBe(true);
    });

    it('should include number line for simple addition', () => {
      const solution = generateAdditionSolution(5, 3, 'en-US');
      const hasNumberLine = solution.steps.some(step => step.visualAid?.type === 'number-line');

      expect(hasNumberLine).toBe(true);
    });
  });
});

describe('Solution Generator - Subtraction', () => {
  describe('generateSubtractionSolution (Danish)', () => {
    it('should generate solution for simple subtraction', () => {
      const solution = generateSubtractionSolution(8, 3, 'da-DK');

      expect(solution.steps.length).toBeGreaterThan(0);
      expect(solution.finalAnswer).toContain('5');
    });

    it('should generate solution for subtraction with regrouping', () => {
      const solution = generateSubtractionSolution(23, 15, 'da-DK');

      expect(solution.steps.length).toBeGreaterThan(2);
      expect(solution.finalAnswer).toContain('8');
      expect(solution.steps.some(step => step.explanation.includes('låner'))).toBe(true);
    });

    it('should generate solution for double-digit without regrouping', () => {
      const solution = generateSubtractionSolution(37, 12, 'da-DK');

      expect(solution.steps.length).toBeGreaterThan(2);
      expect(solution.finalAnswer).toContain('25');
    });
  });

  describe('generateSubtractionSolution (English)', () => {
    it('should generate solution for simple subtraction', () => {
      const solution = generateSubtractionSolution(9, 4, 'en-US');

      expect(solution.steps.length).toBeGreaterThan(0);
      expect(solution.finalAnswer).toContain('5');
    });

    it('should include number line for simple subtraction', () => {
      const solution = generateSubtractionSolution(8, 3, 'en-US');
      const hasNumberLine = solution.steps.some(step => step.visualAid?.type === 'number-line');

      expect(hasNumberLine).toBe(true);
    });
  });
});

describe('Solution Generator - Multiplication', () => {
  describe('generateMultiplicationSolution (Danish)', () => {
    it('should generate solution for simple multiplication', () => {
      const solution = generateMultiplicationSolution(5, 3, 'da-DK');

      expect(solution.steps.length).toBeGreaterThan(0);
      expect(solution.finalAnswer).toContain('15');
      expect(solution.steps[0].explanation).toContain('ganget');
    });

    it('should show repeated addition for small numbers', () => {
      const solution = generateMultiplicationSolution(3, 4, 'da-DK');

      expect(solution.steps.some(step => step.expression.includes('+'))).toBe(true);
    });

    it('should handle larger numbers without repeated addition', () => {
      const solution = generateMultiplicationSolution(12, 8, 'da-DK');

      expect(solution.steps.length).toBeGreaterThan(0);
      expect(solution.finalAnswer).toContain('96');
    });
  });

  describe('generateMultiplicationSolution (English)', () => {
    it('should generate solution for simple multiplication', () => {
      const solution = generateMultiplicationSolution(6, 4, 'en-US');

      expect(solution.steps.length).toBeGreaterThan(0);
      expect(solution.finalAnswer).toContain('24');
    });

    it('should explain repeated addition concept', () => {
      const solution = generateMultiplicationSolution(2, 5, 'en-US');

      expect(solution.steps[0].explanation).toContain('repeated');
    });
  });
});

describe('Solution Generator - Division', () => {
  describe('generateDivisionSolution (Danish)', () => {
    it('should generate solution for simple division', () => {
      const solution = generateDivisionSolution(15, 3, 'da-DK');

      expect(solution.steps.length).toBeGreaterThan(0);
      expect(solution.finalAnswer).toContain('5');
      expect(solution.steps[0].explanation).toContain('divideret');
    });

    it('should handle division with remainder', () => {
      const solution = generateDivisionSolution(17, 5, 'da-DK');

      expect(solution.steps.length).toBeGreaterThan(0);
      expect(solution.finalAnswer).toContain('3');
      expect(solution.finalAnswer).toContain('rest 2');
    });

    it('should show multiplication relationship', () => {
      const solution = generateDivisionSolution(20, 4, 'da-DK');

      expect(solution.steps.some(step => step.expression.includes('×'))).toBe(true);
    });
  });

  describe('generateDivisionSolution (English)', () => {
    it('should generate solution for simple division', () => {
      const solution = generateDivisionSolution(24, 6, 'en-US');

      expect(solution.steps.length).toBeGreaterThan(0);
      expect(solution.finalAnswer).toContain('4');
    });

    it('should handle division with remainder', () => {
      const solution = generateDivisionSolution(23, 7, 'en-US');

      expect(solution.finalAnswer).toContain('remainder 2');
    });

    it('should explain division concept', () => {
      const solution = generateDivisionSolution(12, 3, 'en-US');

      expect(solution.steps[0].explanation).toContain('how many times');
    });
  });
});
