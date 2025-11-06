/**
 * Fraction Representation Exercise Templates
 * 
 * Templates for understanding and recognizing fractions visually and numerically,
 * aligned with Danish Fælles Mål curriculum for grades 4-6 (klassetrin 4-6).
 * 
 * Competency Area: Tal og Algebra (Numbers and Algebra)
 * Skills Area: Brøker og procent (Fractions and percentages)
 * 
 * Requirements:
 * - 3.1: Organize content according to Tal og Algebra competency area
 * - 3.2: Map templates to specific curriculum elements
 * - 3.5: Three difficulty levels (A, B, C)
 */

import type { ExerciseTemplate } from '../../types';
import { validateAnswer } from '../../validator';

/**
 * Fraction Representation Template - Difficulty A (Introductory)
 * 
 * Simple unit fractions (1/2, 1/3, 1/4, 1/5) with visual descriptions
 * For students beginning to understand fraction concepts
 */
export const fractionRepresentationA: ExerciseTemplate = {
  id: 'tal-algebra-fraction-representation-4-6-A',
  name: 'Unit Fraction Recognition',
  metadata: {
    competencyAreaId: 'tal-og-algebra',
    skillsAreaId: 'broker-og-procent',
    gradeRange: '4-6',
    difficulty: 'A',
    isBinding: true,
    tags: ['fractions', 'unit-fractions', 'visual-representation', 'basic'],
  },
  parameters: {
    denominator: {
      type: 'integer',
      min: 2,
      max: 5,
    },
  },
  generate: (params, locale) => {
    const denominator = params.denominator as number;
    const numerator = 1;

    const descriptions = locale === 'da-DK' ? {
      2: 'En cirkel delt i 2 lige store dele. 1 del er farvet.',
      3: 'En cirkel delt i 3 lige store dele. 1 del er farvet.',
      4: 'En cirkel delt i 4 lige store dele. 1 del er farvet.',
      5: 'En cirkel delt i 5 lige store dele. 1 del er farvet.',
    } : {
      2: 'A circle divided into 2 equal parts. 1 part is colored.',
      3: 'A circle divided into 3 equal parts. 1 part is colored.',
      4: 'A circle divided into 4 equal parts. 1 part is colored.',
      5: 'A circle divided into 5 equal parts. 1 part is colored.',
    };

    const question = locale === 'da-DK'
      ? `${descriptions[denominator as keyof typeof descriptions]}\n\nHvilken brøk er vist?`
      : `${descriptions[denominator as keyof typeof descriptions]}\n\nWhich fraction is shown?`;

    return {
      questionText: question,
      correctAnswer: {
        value: `${numerator}/${denominator}`,
        equivalents: [numerator / denominator],
      },
    };
  },
  validate: (userAnswer, correctAnswer) => {
    return validateAnswer(userAnswer, correctAnswer);
  },
  hints: [
    // Level 1: General strategy
    (params, locale) => {
      if (locale === 'da-DK') {
        return 'En brøk viser en del af en helhed. Tælleren (øverst) viser hvor mange dele der er farvet. Nævneren (nederst) viser hvor mange dele i alt.';
      }
      return 'A fraction shows a part of a whole. The numerator (top) shows how many parts are colored. The denominator (bottom) shows how many parts in total.';
    },
    // Level 2: Specific technique
    (params, locale) => {
      const denominator = params.denominator as number;
      if (locale === 'da-DK') {
        return `Cirklen er delt i ${denominator} lige store dele. Hvor mange dele er farvet?`;
      }
      return `The circle is divided into ${denominator} equal parts. How many parts are colored?`;
    },
    // Level 3: Partial solution
    (params, locale) => {
      const denominator = params.denominator as number;
      if (locale === 'da-DK') {
        return `Der er 1 del farvet ud af ${denominator} dele i alt. Så tælleren er 1 og nævneren er ${denominator}.`;
      }
      return `There is 1 part colored out of ${denominator} parts total. So the numerator is 1 and the denominator is ${denominator}.`;
    },
    // Level 4: Complete solution
    (params, locale) => {
      const denominator = params.denominator as number;
      if (locale === 'da-DK') {
        return `Svaret er 1/${denominator} (en ${['', '', 'halv', 'tredjedel', 'fjerdedel', 'femtedel'][denominator]})`;
      }
      return `The answer is 1/${denominator} (one ${['', '', 'half', 'third', 'quarter', 'fifth'][denominator]})`;
    },
  ],
  contextType: 'abstract',
};

/**
 * Fraction Representation Template - Difficulty B (Developing)
 * 
 * Common fractions (2/3, 3/4, 2/5, 3/8) with mixed representations
 * Building on understanding of numerators greater than 1
 */
export const fractionRepresentationB: ExerciseTemplate = {
  id: 'tal-algebra-fraction-representation-4-6-B',
  name: 'Common Fraction Recognition',
  metadata: {
    competencyAreaId: 'tal-og-algebra',
    skillsAreaId: 'broker-og-procent',
    gradeRange: '4-6',
    difficulty: 'B',
    isBinding: true,
    tags: ['fractions', 'proper-fractions', 'visual-representation', 'numeracy'],
  },
  parameters: {
    denominator: {
      type: 'integer',
      min: 3,
      max: 8,
    },
    numerator: {
      type: 'integer',
      min: 2,
      max: 7,
      constraint: (params) => {
        const num = params.numerator as number;
        const den = params.denominator as number;
        // Ensure proper fraction (numerator < denominator)
        return num < den;
      },
    },
  },
  generate: (params, locale) => {
    const denominator = params.denominator as number;
    const numerator = params.numerator as number;

    const question = locale === 'da-DK'
      ? `En rektangel er delt i ${denominator} lige store dele. ${numerator} dele er farvet.\n\nHvilken brøk er vist?`
      : `A rectangle is divided into ${denominator} equal parts. ${numerator} parts are colored.\n\nWhich fraction is shown?`;

    return {
      questionText: question,
      correctAnswer: {
        value: `${numerator}/${denominator}`,
        equivalents: [numerator / denominator],
      },
    };
  },
  validate: (userAnswer, correctAnswer) => {
    return validateAnswer(userAnswer, correctAnswer);
  },
  hints: [
    // Level 1: General strategy
    (params, locale) => {
      if (locale === 'da-DK') {
        return 'Tæl antallet af farvede dele (tælleren) og antallet af dele i alt (nævneren).';
      }
      return 'Count the number of colored parts (numerator) and the number of total parts (denominator).';
    },
    // Level 2: Specific technique
    (params, locale) => {
      const numerator = params.numerator as number;
      const denominator = params.denominator as number;
      if (locale === 'da-DK') {
        return `Der er ${numerator} farvede dele. Rektanglen har ${denominator} dele i alt.`;
      }
      return `There are ${numerator} colored parts. The rectangle has ${denominator} parts in total.`;
    },
    // Level 3: Partial solution
    (params, locale) => {
      const numerator = params.numerator as number;
      const denominator = params.denominator as number;
      if (locale === 'da-DK') {
        return `Tælleren (øverst) = ${numerator}\nNævneren (nederst) = ${denominator}\nBrøken skrives som: ${numerator}/${denominator}`;
      }
      return `Numerator (top) = ${numerator}\nDenominator (bottom) = ${denominator}\nThe fraction is written as: ${numerator}/${denominator}`;
    },
    // Level 4: Complete solution
    (params, locale) => {
      const numerator = params.numerator as number;
      const denominator = params.denominator as number;
      if (locale === 'da-DK') {
        return `Svaret er ${numerator}/${denominator}`;
      }
      return `The answer is ${numerator}/${denominator}`;
    },
  ],
  contextType: 'abstract',
};

/**
 * Fraction Representation Template - Difficulty C (Advanced)
 * 
 * Improper fractions and mixed numbers (7/4, 5/3, converting to 1 3/4, 1 2/3)
 * For students ready to work with fractions greater than 1
 */
export const fractionRepresentationC: ExerciseTemplate = {
  id: 'tal-algebra-fraction-representation-4-6-C',
  name: 'Improper Fractions and Mixed Numbers',
  metadata: {
    competencyAreaId: 'tal-og-algebra',
    skillsAreaId: 'broker-og-procent',
    gradeRange: '4-6',
    difficulty: 'C',
    isBinding: true,
    tags: ['fractions', 'improper-fractions', 'mixed-numbers', 'advanced'],
  },
  parameters: {
    denominator: {
      type: 'integer',
      min: 2,
      max: 6,
    },
    wholeNumber: {
      type: 'integer',
      min: 1,
      max: 3,
    },
    extraNumerator: {
      type: 'integer',
      min: 1,
      max: 5,
      constraint: (params) => {
        const extra = params.extraNumerator as number;
        const den = params.denominator as number;
        // Ensure extra numerator is less than denominator
        return extra < den;
      },
    },
  },
  generate: (params, locale) => {
    const denominator = params.denominator as number;
    const wholeNumber = params.wholeNumber as number;
    const extraNumerator = params.extraNumerator as number;
    
    // Calculate improper fraction
    const improperNumerator = wholeNumber * denominator + extraNumerator;

    const question = locale === 'da-DK'
      ? `Du har ${wholeNumber} hele cirkler og ${extraNumerator}/${denominator} af en cirkel til.\n\nSkriv dette som en uægte brøk (tælleren er større end nævneren).`
      : `You have ${wholeNumber} whole circles and ${extraNumerator}/${denominator} of another circle.\n\nWrite this as an improper fraction (numerator is greater than denominator).`;

    return {
      questionText: question,
      correctAnswer: {
        value: `${improperNumerator}/${denominator}`,
        equivalents: [
          improperNumerator / denominator,
          `${wholeNumber} ${extraNumerator}/${denominator}`, // Mixed number format
        ],
      },
    };
  },
  validate: (userAnswer, correctAnswer) => {
    return validateAnswer(userAnswer, correctAnswer);
  },
  hints: [
    // Level 1: General strategy
    (params, locale) => {
      if (locale === 'da-DK') {
        return 'For at lave en blandet tal til en uægte brøk: gang hele tal med nævneren, læg tælleren til, og behold nævneren.';
      }
      return 'To convert a mixed number to an improper fraction: multiply the whole number by the denominator, add the numerator, and keep the denominator.';
    },
    // Level 2: Specific technique
    (params, locale) => {
      const denominator = params.denominator as number;
      const wholeNumber = params.wholeNumber as number;
      const extraNumerator = params.extraNumerator as number;
      if (locale === 'da-DK') {
        return `Hver hel cirkel er ${denominator}/${denominator}. Du har ${wholeNumber} hele cirkler plus ${extraNumerator}/${denominator}.`;
      }
      return `Each whole circle is ${denominator}/${denominator}. You have ${wholeNumber} whole circles plus ${extraNumerator}/${denominator}.`;
    },
    // Level 3: Partial solution
    (params, locale) => {
      const denominator = params.denominator as number;
      const wholeNumber = params.wholeNumber as number;
      const extraNumerator = params.extraNumerator as number;
      const improperNumerator = wholeNumber * denominator + extraNumerator;
      
      if (locale === 'da-DK') {
        return `Trin 1: ${wholeNumber} hele = ${wholeNumber} × ${denominator} = ${wholeNumber * denominator} ${denominator}-dele\nTrin 2: Læg ${extraNumerator} ${denominator}-dele til: ${wholeNumber * denominator} + ${extraNumerator} = ${improperNumerator}\nTrin 3: Nævneren forbliver ${denominator}`;
      }
      return `Step 1: ${wholeNumber} whole = ${wholeNumber} × ${denominator} = ${wholeNumber * denominator} ${denominator}-parts\nStep 2: Add ${extraNumerator} ${denominator}-parts: ${wholeNumber * denominator} + ${extraNumerator} = ${improperNumerator}\nStep 3: The denominator stays ${denominator}`;
    },
    // Level 4: Complete solution
    (params, locale) => {
      const denominator = params.denominator as number;
      const wholeNumber = params.wholeNumber as number;
      const extraNumerator = params.extraNumerator as number;
      const improperNumerator = wholeNumber * denominator + extraNumerator;
      
      if (locale === 'da-DK') {
        return `Svaret er ${improperNumerator}/${denominator}`;
      }
      return `The answer is ${improperNumerator}/${denominator}`;
    },
  ],
  contextType: 'abstract',
};

// Export all fraction representation templates
export const fractionRepresentationTemplates = [
  fractionRepresentationA,
  fractionRepresentationB,
  fractionRepresentationC,
];

