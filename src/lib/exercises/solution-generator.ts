/**
 * Worked Solution Generator
 *
 * Utilities for creating step-by-step worked solutions for exercises.
 * Provides helper functions to build structured solutions with intermediate steps.
 *
 * Requirements:
 * - 4.3: Display complete worked solution with intermediate steps
 * - 8.4: Provide worked solution at any time during or after exercise
 */

import type { WorkedSolution, SolutionStep, VisualAid } from './types';

/**
 * Create a worked solution from an array of steps
 *
 * @param steps - Array of solution steps
 * @param finalAnswer - Final answer statement
 * @param visualAid - Optional visual aid for the entire solution
 * @returns Complete WorkedSolution object
 *
 * @example
 * ```typescript
 * const solution = createWorkedSolution(
 *   [
 *     { explanation: 'Start with the first number', expression: '5' },
 *     { explanation: 'Add the second number', expression: '5 + 3 = 8' }
 *   ],
 *   'The answer is 8'
 * );
 * ```
 */
export function createWorkedSolution(
  steps: SolutionStep[],
  finalAnswer: string,
  visualAid?: VisualAid
): WorkedSolution {
  return {
    steps,
    finalAnswer,
    visualAid,
  };
}

/**
 * Create a solution step
 *
 * @param explanation - Description of what's happening in this step
 * @param expression - Mathematical expression or calculation
 * @param visualAid - Optional visual aid for this step
 * @returns SolutionStep object
 *
 * @example
 * ```typescript
 * const step = createStep(
 *   'Break down into tens and ones',
 *   '15 = 10 + 5'
 * );
 * ```
 */
export function createStep(
  explanation: string,
  expression: string,
  visualAid?: VisualAid
): SolutionStep {
  return {
    explanation,
    expression,
    visualAid,
  };
}

/**
 * Create a number line visual aid for addition/subtraction
 *
 * @param start - Starting number on the number line
 * @param end - Ending number on the number line
 * @param hops - Array of hop values (e.g., [+3, +2] for adding 3 then 2)
 * @returns VisualAid object for a number line
 *
 * @example
 * ```typescript
 * const numberLine = createNumberLine(5, 10, [3, 2]);
 * // Creates a number line from 5 to 10 showing hops of +3 and +2
 * ```
 */
export function createNumberLine(
  start: number,
  end: number,
  hops: number[]
): VisualAid {
  return {
    type: 'number-line',
    data: {
      start,
      end,
      hops,
      range: [Math.min(start, end) - 2, Math.max(start, end) + 2],
    },
  };
}

/**
 * Create a place value diagram visual aid
 *
 * @param number - The number to visualize
 * @param breakdown - Object with place values (e.g., { hundreds: 2, tens: 3, ones: 5 })
 * @returns VisualAid object for a place value diagram
 *
 * @example
 * ```typescript
 * const diagram = createPlaceValueDiagram(235, {
 *   hundreds: 2,
 *   tens: 3,
 *   ones: 5
 * });
 * ```
 */
export function createPlaceValueDiagram(
  number: number,
  breakdown: Record<string, number>
): VisualAid {
  return {
    type: 'diagram',
    data: {
      diagramType: 'place-value',
      number,
      breakdown,
    },
  };
}

/**
 * Create a fraction visualization diagram
 *
 * @param numerator - Numerator of the fraction
 * @param denominator - Denominator of the fraction
 * @param shapeType - Type of shape to use (circle, rectangle, etc.)
 * @returns VisualAid object for a fraction diagram
 *
 * @example
 * ```typescript
 * const fractionDiagram = createFractionDiagram(3, 4, 'circle');
 * // Shows 3/4 as a circle divided into 4 parts with 3 shaded
 * ```
 */
export function createFractionDiagram(
  numerator: number,
  denominator: number,
  shapeType: 'circle' | 'rectangle' = 'rectangle'
): VisualAid {
  return {
    type: 'diagram',
    data: {
      diagramType: 'fraction',
      numerator,
      denominator,
      shapeType,
    },
  };
}

/**
 * Generate a worked solution for basic addition
 *
 * @param a - First addend
 * @param b - Second addend
 * @param locale - Language locale
 * @returns WorkedSolution with step-by-step addition process
 *
 * @example
 * ```typescript
 * const solution = generateAdditionSolution(15, 8, 'da-DK');
 * // Generates steps showing how to add 15 + 8
 * ```
 */
export function generateAdditionSolution(
  a: number,
  b: number,
  locale: 'da-DK' | 'en-US'
): WorkedSolution {
  const answer = a + b;
  const steps: SolutionStep[] = [];

  // For double-digit addition, break down by place value
  if (a >= 10 || b >= 10) {
    const aTens = Math.floor(a / 10);
    const aOnes = a % 10;
    const bTens = Math.floor(b / 10);
    const bOnes = b % 10;

    if (locale === 'da-DK') {
      if (a >= 10) {
        steps.push(createStep(
          'Opdel det første tal i tiere og enere',
          `${a} = ${aTens * 10} + ${aOnes}`
        ));
      }
      if (b >= 10) {
        steps.push(createStep(
          'Opdel det andet tal i tiere og enere',
          `${b} = ${bTens * 10} + ${bOnes}`
        ));
      }

      const totalOnes = aOnes + bOnes;
      steps.push(createStep(
        'Læg enerne sammen',
        `${aOnes} + ${bOnes} = ${totalOnes}`
      ));

      if (totalOnes >= 10) {
        const carryTens = Math.floor(totalOnes / 10);
        const remainingOnes = totalOnes % 10;
        steps.push(createStep(
          'Enerne giver en ekstra tier',
          `${totalOnes} = ${carryTens * 10} + ${remainingOnes}`
        ));
        steps.push(createStep(
          'Læg tierne sammen (inklusive den ekstra)',
          `${aTens} + ${bTens} + ${carryTens} = ${aTens + bTens + carryTens} tiere`
        ));
        steps.push(createStep(
          'Kombiner tiere og enere',
          `${(aTens + bTens + carryTens) * 10} + ${remainingOnes} = ${answer}`
        ));
      } else {
        steps.push(createStep(
          'Læg tierne sammen',
          `${aTens} + ${bTens} = ${aTens + bTens} tiere`
        ));
        steps.push(createStep(
          'Kombiner tiere og enere',
          `${(aTens + bTens) * 10} + ${totalOnes} = ${answer}`
        ));
      }
    } else {
      if (a >= 10) {
        steps.push(createStep(
          'Break down the first number into tens and ones',
          `${a} = ${aTens * 10} + ${aOnes}`
        ));
      }
      if (b >= 10) {
        steps.push(createStep(
          'Break down the second number into tens and ones',
          `${b} = ${bTens * 10} + ${bOnes}`
        ));
      }

      const totalOnes = aOnes + bOnes;
      steps.push(createStep(
        'Add the ones together',
        `${aOnes} + ${bOnes} = ${totalOnes}`
      ));

      if (totalOnes >= 10) {
        const carryTens = Math.floor(totalOnes / 10);
        const remainingOnes = totalOnes % 10;
        steps.push(createStep(
          'The ones give us an extra ten',
          `${totalOnes} = ${carryTens * 10} + ${remainingOnes}`
        ));
        steps.push(createStep(
          'Add the tens together (including the extra)',
          `${aTens} + ${bTens} + ${carryTens} = ${aTens + bTens + carryTens} tens`
        ));
        steps.push(createStep(
          'Combine tens and ones',
          `${(aTens + bTens + carryTens) * 10} + ${remainingOnes} = ${answer}`
        ));
      } else {
        steps.push(createStep(
          'Add the tens together',
          `${aTens} + ${bTens} = ${aTens + bTens} tens`
        ));
        steps.push(createStep(
          'Combine tens and ones',
          `${(aTens + bTens) * 10} + ${totalOnes} = ${answer}`
        ));
      }
    }
  } else {
    // Simple single-digit addition
    if (locale === 'da-DK') {
      steps.push(createStep(
        `Start med ${a}`,
        `${a}`
      ));
      steps.push(createStep(
        `Læg ${b} til`,
        `${a} + ${b} = ${answer}`,
        createNumberLine(a, answer, [b])
      ));
    } else {
      steps.push(createStep(
        `Start with ${a}`,
        `${a}`
      ));
      steps.push(createStep(
        `Add ${b}`,
        `${a} + ${b} = ${answer}`,
        createNumberLine(a, answer, [b])
      ));
    }
  }

  const finalAnswer = locale === 'da-DK'
    ? `Svaret er ${answer}`
    : `The answer is ${answer}`;

  return createWorkedSolution(steps, finalAnswer);
}

/**
 * Generate a worked solution for basic subtraction
 *
 * @param a - Minuend (number to subtract from)
 * @param b - Subtrahend (number to subtract)
 * @param locale - Language locale
 * @returns WorkedSolution with step-by-step subtraction process
 */
export function generateSubtractionSolution(
  a: number,
  b: number,
  locale: 'da-DK' | 'en-US'
): WorkedSolution {
  const answer = a - b;
  const steps: SolutionStep[] = [];

  // For double-digit subtraction with regrouping
  if (a >= 10 && (a % 10 < b % 10)) {
    const aTens = Math.floor(a / 10);
    const aOnes = a % 10;
    const bOnes = b % 10;

    if (locale === 'da-DK') {
      steps.push(createStep(
        'Opdel tallet i tiere og enere',
        `${a} = ${aTens * 10} + ${aOnes}`
      ));
      steps.push(createStep(
        'Vi kan ikke trække enerne, så vi låner en tier',
        `${a} = ${(aTens - 1) * 10} + ${aOnes + 10}`
      ));
      steps.push(createStep(
        'Træk enerne fra',
        `${aOnes + 10} - ${bOnes} = ${aOnes + 10 - bOnes}`
      ));
      steps.push(createStep(
        'Træk tierne fra',
        `${(aTens - 1) * 10} - ${Math.floor(b / 10) * 10} = ${(aTens - 1 - Math.floor(b / 10)) * 10}`
      ));
      steps.push(createStep(
        'Kombiner resultatet',
        `${(aTens - 1 - Math.floor(b / 10)) * 10} + ${aOnes + 10 - bOnes} = ${answer}`
      ));
    } else {
      steps.push(createStep(
        'Break down the number into tens and ones',
        `${a} = ${aTens * 10} + ${aOnes}`
      ));
      steps.push(createStep(
        'We cannot subtract the ones, so we borrow a ten',
        `${a} = ${(aTens - 1) * 10} + ${aOnes + 10}`
      ));
      steps.push(createStep(
        'Subtract the ones',
        `${aOnes + 10} - ${bOnes} = ${aOnes + 10 - bOnes}`
      ));
      steps.push(createStep(
        'Subtract the tens',
        `${(aTens - 1) * 10} - ${Math.floor(b / 10) * 10} = ${(aTens - 1 - Math.floor(b / 10)) * 10}`
      ));
      steps.push(createStep(
        'Combine the result',
        `${(aTens - 1 - Math.floor(b / 10)) * 10} + ${aOnes + 10 - bOnes} = ${answer}`
      ));
    }
  } else if (a >= 10) {
    // No regrouping needed
    const aTens = Math.floor(a / 10);
    const aOnes = a % 10;
    const bTens = Math.floor(b / 10);
    const bOnes = b % 10;

    if (locale === 'da-DK') {
      steps.push(createStep(
        'Opdel tallene i tiere og enere',
        `${a} = ${aTens * 10} + ${aOnes}, ${b} = ${bTens * 10} + ${bOnes}`
      ));
      steps.push(createStep(
        'Træk enerne fra',
        `${aOnes} - ${bOnes} = ${aOnes - bOnes}`
      ));
      steps.push(createStep(
        'Træk tierne fra',
        `${aTens * 10} - ${bTens * 10} = ${(aTens - bTens) * 10}`
      ));
      steps.push(createStep(
        'Kombiner resultatet',
        `${(aTens - bTens) * 10} + ${aOnes - bOnes} = ${answer}`
      ));
    } else {
      steps.push(createStep(
        'Break down the numbers into tens and ones',
        `${a} = ${aTens * 10} + ${aOnes}, ${b} = ${bTens * 10} + ${bOnes}`
      ));
      steps.push(createStep(
        'Subtract the ones',
        `${aOnes} - ${bOnes} = ${aOnes - bOnes}`
      ));
      steps.push(createStep(
        'Subtract the tens',
        `${aTens * 10} - ${bTens * 10} = ${(aTens - bTens) * 10}`
      ));
      steps.push(createStep(
        'Combine the result',
        `${(aTens - bTens) * 10} + ${aOnes - bOnes} = ${answer}`
      ));
    }
  } else {
    // Simple single-digit subtraction
    if (locale === 'da-DK') {
      steps.push(createStep(
        `Start med ${a}`,
        `${a}`
      ));
      steps.push(createStep(
        `Træk ${b} fra`,
        `${a} - ${b} = ${answer}`,
        createNumberLine(answer, a, [-b])
      ));
    } else {
      steps.push(createStep(
        `Start with ${a}`,
        `${a}`
      ));
      steps.push(createStep(
        `Subtract ${b}`,
        `${a} - ${b} = ${answer}`,
        createNumberLine(answer, a, [-b])
      ));
    }
  }

  const finalAnswer = locale === 'da-DK'
    ? `Svaret er ${answer}`
    : `The answer is ${answer}`;

  return createWorkedSolution(steps, finalAnswer);
}

/**
 * Generate a worked solution for basic multiplication
 *
 * @param a - First factor
 * @param b - Second factor
 * @param locale - Language locale
 * @returns WorkedSolution with step-by-step multiplication process
 */
export function generateMultiplicationSolution(
  a: number,
  b: number,
  locale: 'da-DK' | 'en-US'
): WorkedSolution {
  const answer = a * b;
  const steps: SolutionStep[] = [];

  if (locale === 'da-DK') {
    steps.push(createStep(
      `${a} ganget med ${b} betyder ${a} gentaget ${b} gange`,
      `${a} × ${b}`
    ));

    if (b <= 5 && a <= 10) {
      // Show repeated addition for small numbers
      const additions = Array(b).fill(a).join(' + ');
      steps.push(createStep(
        'Vi kan skrive det som gentagen addition',
        `${additions} = ${answer}`
      ));
    } else {
      steps.push(createStep(
        'Beregn produktet',
        `${a} × ${b} = ${answer}`
      ));
    }
  } else {
    steps.push(createStep(
      `${a} times ${b} means ${a} repeated ${b} times`,
      `${a} × ${b}`
    ));

    if (b <= 5 && a <= 10) {
      // Show repeated addition for small numbers
      const additions = Array(b).fill(a).join(' + ');
      steps.push(createStep(
        'We can write it as repeated addition',
        `${additions} = ${answer}`
      ));
    } else {
      steps.push(createStep(
        'Calculate the product',
        `${a} × ${b} = ${answer}`
      ));
    }
  }

  const finalAnswer = locale === 'da-DK'
    ? `Svaret er ${answer}`
    : `The answer is ${answer}`;

  return createWorkedSolution(steps, finalAnswer);
}

/**
 * Generate a worked solution for basic division
 *
 * @param dividend - Number to be divided
 * @param divisor - Number to divide by
 * @param locale - Language locale
 * @returns WorkedSolution with step-by-step division process
 */
export function generateDivisionSolution(
  dividend: number,
  divisor: number,
  locale: 'da-DK' | 'en-US'
): WorkedSolution {
  const answer = Math.floor(dividend / divisor);
  const remainder = dividend % divisor;
  const steps: SolutionStep[] = [];

  if (locale === 'da-DK') {
    steps.push(createStep(
      `${dividend} divideret med ${divisor} betyder: hvor mange gange går ${divisor} op i ${dividend}?`,
      `${dividend} ÷ ${divisor}`
    ));

    if (divisor <= 10 && answer <= 10) {
      // Show repeated subtraction for small numbers
      steps.push(createStep(
        `Vi kan tælle: ${divisor} × 1 = ${divisor}, ${divisor} × 2 = ${divisor * 2}, ...`,
        `${divisor} × ${answer} = ${divisor * answer}`
      ));
    }

    if (remainder === 0) {
      steps.push(createStep(
        `${divisor} går op i ${dividend} præcis ${answer} gange`,
        `${dividend} ÷ ${divisor} = ${answer}`
      ));
    } else {
      steps.push(createStep(
        `${divisor} går op i ${dividend} ${answer} gange med rest ${remainder}`,
        `${dividend} = ${divisor} × ${answer} + ${remainder}`
      ));
    }
  } else {
    steps.push(createStep(
      `${dividend} divided by ${divisor} means: how many times does ${divisor} go into ${dividend}?`,
      `${dividend} ÷ ${divisor}`
    ));

    if (divisor <= 10 && answer <= 10) {
      // Show repeated subtraction for small numbers
      steps.push(createStep(
        `We can count: ${divisor} × 1 = ${divisor}, ${divisor} × 2 = ${divisor * 2}, ...`,
        `${divisor} × ${answer} = ${divisor * answer}`
      ));
    }

    if (remainder === 0) {
      steps.push(createStep(
        `${divisor} goes into ${dividend} exactly ${answer} times`,
        `${dividend} ÷ ${divisor} = ${answer}`
      ));
    } else {
      steps.push(createStep(
        `${divisor} goes into ${dividend} ${answer} times with remainder ${remainder}`,
        `${dividend} = ${divisor} × ${answer} + ${remainder}`
      ));
    }
  }

  const finalAnswer = locale === 'da-DK'
    ? remainder === 0 ? `Svaret er ${answer}` : `Svaret er ${answer} med rest ${remainder}`
    : remainder === 0 ? `The answer is ${answer}` : `The answer is ${answer} with remainder ${remainder}`;

  return createWorkedSolution(steps, finalAnswer);
}
