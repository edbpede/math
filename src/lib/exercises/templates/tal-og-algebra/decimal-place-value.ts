/**
 * Decimal Place Value Exercise Templates
 * 
 * Templates for understanding decimal notation and place value,
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
import { formatNumber } from '../../../i18n/utils';

/**
 * Decimal Place Value Template - Difficulty A (Introductory)
 * 
 * Identifying place value positions in simple decimals (tenths: 0.1-0.9)
 * For students beginning to understand decimal notation
 */
export const decimalPlaceValueA: ExerciseTemplate = {
  id: 'tal-algebra-decimal-place-value-4-6-A',
  name: 'Decimal Tenths Recognition',
  metadata: {
    competencyAreaId: 'tal-og-algebra',
    skillsAreaId: 'broker-og-procent',
    gradeRange: '4-6',
    difficulty: 'A',
    isBinding: true,
    tags: ['decimals', 'place-value', 'tenths', 'basic'],
  },
  parameters: {
    tenths: {
      type: 'integer',
      min: 1,
      max: 9,
    },
  },
  generate: (params, locale) => {
    const tenths = params.tenths as number;
    const decimal = tenths / 10;

    // Format the decimal according to locale
    const formattedDecimal = locale === 'da-DK' 
      ? `0,${tenths}` 
      : `0.${tenths}`;

    const question = locale === 'da-DK'
      ? `Hvad er værdien af tallet ${formattedDecimal}?\n\nSkriv svaret som en brøk med 10 i nævneren.`
      : `What is the value of the number ${formattedDecimal}?\n\nWrite the answer as a fraction with 10 in the denominator.`;

    return {
      questionText: question,
      correctAnswer: {
        value: `${tenths}/10`,
        equivalents: [decimal, formattedDecimal],
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
        return 'Det første ciffer efter decimaltegnet (kommaet) kaldes "tiendedele". Det viser hvor mange tiendedele (dele af 10) der er.';
      }
      return 'The first digit after the decimal point is called "tenths". It shows how many tenths (parts of 10) there are.';
    },
    // Level 2: Specific technique
    (params, locale) => {
      const tenths = params.tenths as number;
      const separator = locale === 'da-DK' ? ',' : '.';
      
      if (locale === 'da-DK') {
        return `I tallet 0${separator}${tenths} er der ${tenths} tiendedele.`;
      }
      return `In the number 0${separator}${tenths}, there are ${tenths} tenths.`;
    },
    // Level 3: Partial solution
    (params, locale) => {
      const tenths = params.tenths as number;
      if (locale === 'da-DK') {
        return `${tenths} tiendedele skrives som brøken ${tenths}/10`;
      }
      return `${tenths} tenths is written as the fraction ${tenths}/10`;
    },
    // Level 4: Complete solution
    (params, locale) => {
      const tenths = params.tenths as number;
      if (locale === 'da-DK') {
        return `Svaret er ${tenths}/10`;
      }
      return `The answer is ${tenths}/10`;
    },
  ],
  contextType: 'abstract',
};

/**
 * Decimal Place Value Template - Difficulty B (Developing)
 * 
 * Writing decimals from place value descriptions (tenths and hundredths)
 * For students developing decimal number sense
 */
export const decimalPlaceValueB: ExerciseTemplate = {
  id: 'tal-algebra-decimal-place-value-4-6-B',
  name: 'Writing Decimals from Place Value',
  metadata: {
    competencyAreaId: 'tal-og-algebra',
    skillsAreaId: 'broker-og-procent',
    gradeRange: '4-6',
    difficulty: 'B',
    isBinding: true,
    tags: ['decimals', 'place-value', 'hundredths', 'composition'],
  },
  parameters: {
    tenths: {
      type: 'integer',
      min: 0,
      max: 9,
    },
    hundredths: {
      type: 'integer',
      min: 1,
      max: 9,
    },
  },
  generate: (params, locale) => {
    const tenths = params.tenths as number;
    const hundredths = params.hundredths as number;
    const decimal = tenths / 10 + hundredths / 100;

    // Format with leading zeros
    const tenthsStr = String(tenths);
    const hundredthsStr = String(hundredths);
    const formattedDecimal = locale === 'da-DK'
      ? `0,${tenthsStr}${hundredthsStr}`
      : `0.${tenthsStr}${hundredthsStr}`;

    const question = locale === 'da-DK'
      ? `Skriv tallet:\n\n${tenths} tiendedele og ${hundredths} hundredredele\n\nSkriv svaret som et decimaltal.`
      : `Write the number:\n\n${tenths} tenths and ${hundredths} hundredths\n\nWrite the answer as a decimal.`;

    return {
      questionText: question,
      correctAnswer: {
        value: formattedDecimal,
        equivalents: [decimal, `${tenths * 10 + hundredths}/100`],
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
        return 'Tiendedele er det første ciffer efter kommaet. Hundredredele er det andet ciffer efter kommaet.';
      }
      return 'Tenths are the first digit after the decimal point. Hundredths are the second digit after the decimal point.';
    },
    // Level 2: Specific technique
    (params, locale) => {
      const tenths = params.tenths as number;
      const hundredths = params.hundredths as number;
      const separator = locale === 'da-DK' ? ',' : '.';
      
      if (locale === 'da-DK') {
        return `Skriv 0${separator} efterfulgt af tiendedele (${tenths}), derefter hundredredele (${hundredths}).`;
      }
      return `Write 0${separator} followed by tenths (${tenths}), then hundredths (${hundredths}).`;
    },
    // Level 3: Partial solution
    (params, locale) => {
      const tenths = params.tenths as number;
      const hundredths = params.hundredths as number;
      const separator = locale === 'da-DK' ? ',' : '.';
      
      if (locale === 'da-DK') {
        return `Tiendedele: ${tenths}\nHundredredele: ${hundredths}\nDecimaltal: 0${separator}${tenths}${hundredths}`;
      }
      return `Tenths: ${tenths}\nHundredths: ${hundredths}\nDecimal: 0${separator}${tenths}${hundredths}`;
    },
    // Level 4: Complete solution
    (params, locale) => {
      const tenths = params.tenths as number;
      const hundredths = params.hundredths as number;
      const separator = locale === 'da-DK' ? ',' : '.';
      
      if (locale === 'da-DK') {
        return `Svaret er 0${separator}${tenths}${hundredths}`;
      }
      return `The answer is 0${separator}${tenths}${hundredths}`;
    },
  ],
  contextType: 'abstract',
};

/**
 * Decimal Place Value Template - Difficulty C (Advanced)
 * 
 * Comparing and ordering decimals with different place values
 * For students ready to reason about decimal magnitude
 */
export const decimalPlaceValueC: ExerciseTemplate = {
  id: 'tal-algebra-decimal-place-value-4-6-C',
  name: 'Comparing Decimals',
  metadata: {
    competencyAreaId: 'tal-og-algebra',
    skillsAreaId: 'broker-og-procent',
    gradeRange: '4-6',
    difficulty: 'C',
    isBinding: true,
    tags: ['decimals', 'place-value', 'comparison', 'ordering', 'advanced'],
  },
  parameters: {
    decimal1Tenths: {
      type: 'integer',
      min: 1,
      max: 8,
    },
    decimal1Hundredths: {
      type: 'integer',
      min: 0,
      max: 9,
    },
    decimal2Tenths: {
      type: 'integer',
      min: 1,
      max: 8,
    },
    decimal2Hundredths: {
      type: 'integer',
      min: 0,
      max: 9,
      constraint: (params) => {
        const d1t = params.decimal1Tenths as number;
        const d1h = params.decimal1Hundredths as number;
        const d2t = params.decimal2Tenths as number;
        const d2h = params.decimal2Hundredths as number;
        
        const val1 = d1t * 10 + d1h;
        const val2 = d2t * 10 + d2h;
        
        // Ensure decimals are different
        return val1 !== val2;
      },
    },
  },
  generate: (params, locale) => {
    const d1t = params.decimal1Tenths as number;
    const d1h = params.decimal1Hundredths as number;
    const d2t = params.decimal2Tenths as number;
    const d2h = params.decimal2Hundredths as number;

    const decimal1 = d1t / 10 + d1h / 100;
    const decimal2 = d2t / 10 + d2h / 100;

    const separator = locale === 'da-DK' ? ',' : '.';
    const formatted1 = `0${separator}${d1t}${d1h === 0 ? '' : d1h}`;
    const formatted2 = `0${separator}${d2t}${d2h === 0 ? '' : d2h}`;

    let comparison: string;
    if (decimal1 > decimal2) {
      comparison = '>';
    } else {
      comparison = '<';
    }

    const question = locale === 'da-DK'
      ? `Hvilket symbol skal indsættes mellem de to tal?\n\n${formatted1} __ ${formatted2}\n\nSkriv < (mindre end) eller > (større end)`
      : `Which symbol should be placed between the two numbers?\n\n${formatted1} __ ${formatted2}\n\nWrite < (less than) or > (greater than)`;

    return {
      questionText: question,
      correctAnswer: {
        value: comparison,
        equivalents: [
          comparison === '>' ? 'større end' : 'mindre end',
          comparison === '>' ? 'greater than' : 'less than',
        ],
      },
    };
  },
  validate: (userAnswer, correctAnswer) => {
    // Custom validation for comparison symbols
    const trimmed = userAnswer.trim().toLowerCase();
    const value = String(correctAnswer.value).toLowerCase();
    
    // Check if matches the value
    if (trimmed === value) {
      return { correct: true, normalized: userAnswer.trim() };
    }
    
    // Check if matches any equivalent
    if (correctAnswer.equivalents) {
      for (const equiv of correctAnswer.equivalents) {
        if (trimmed === String(equiv).toLowerCase()) {
          return { correct: true, normalized: userAnswer.trim() };
        }
      }
    }
    
    return { correct: false, normalized: userAnswer.trim() };
  },
  hints: [
    // Level 1: General strategy
    (params, locale) => {
      if (locale === 'da-DK') {
        return 'Sammenlign decimaltal ved at se på cifre fra venstre mod højre. Start med tiendedele, derefter hundredredele.';
      }
      return 'Compare decimals by looking at digits from left to right. Start with tenths, then hundredths.';
    },
    // Level 2: Specific technique
    (params, locale) => {
      const d1t = params.decimal1Tenths as number;
      const d2t = params.decimal2Tenths as number;
      
      if (locale === 'da-DK') {
        if (d1t !== d2t) {
          return `Sammenlign tiendedele først: ${d1t} og ${d2t}. Hvilket er størst?`;
        }
        return `Tiendedele er ens (${d1t}). Sammenlign hundredredele.`;
      }
      if (d1t !== d2t) {
        return `Compare tenths first: ${d1t} and ${d2t}. Which is greater?`;
      }
      return `Tenths are the same (${d1t}). Compare hundredths.`;
    },
    // Level 3: Partial solution
    (params, locale) => {
      const d1t = params.decimal1Tenths as number;
      const d1h = params.decimal1Hundredths as number;
      const d2t = params.decimal2Tenths as number;
      const d2h = params.decimal2Hundredths as number;
      const separator = locale === 'da-DK' ? ',' : '.';
      
      if (locale === 'da-DK') {
        if (d1t !== d2t) {
          return `Tiendedele: ${d1t} ${d1t > d2t ? '>' : '<'} ${d2t}\nDerfor: 0${separator}${d1t}${d1h || ''} ${d1t > d2t ? '>' : '<'} 0${separator}${d2t}${d2h || ''}`;
        }
        return `Tiendedele ens: ${d1t} = ${d2t}\nHundredredele: ${d1h} ${d1h > d2h ? '>' : '<'} ${d2h}\nDerfor: 0${separator}${d1t}${d1h} ${d1h > d2h ? '>' : '<'} 0${separator}${d2t}${d2h}`;
      }
      if (d1t !== d2t) {
        return `Tenths: ${d1t} ${d1t > d2t ? '>' : '<'} ${d2t}\nTherefore: 0${separator}${d1t}${d1h || ''} ${d1t > d2t ? '>' : '<'} 0${separator}${d2t}${d2h || ''}`;
      }
      return `Tenths equal: ${d1t} = ${d2t}\nHundredths: ${d1h} ${d1h > d2h ? '>' : '<'} ${d2h}\nTherefore: 0${separator}${d1t}${d1h} ${d1h > d2h ? '>' : '<'} 0${separator}${d2t}${d2h}`;
    },
    // Level 4: Complete solution
    (params, locale) => {
      const d1t = params.decimal1Tenths as number;
      const d1h = params.decimal1Hundredths as number;
      const d2t = params.decimal2Tenths as number;
      const d2h = params.decimal2Hundredths as number;
      const decimal1 = d1t / 10 + d1h / 100;
      const decimal2 = d2t / 10 + d2h / 100;
      
      if (locale === 'da-DK') {
        return `Svaret er ${decimal1 > decimal2 ? '>' : '<'}`;
      }
      return `The answer is ${decimal1 > decimal2 ? '>' : '<'}`;
    },
  ],
  contextType: 'abstract',
};

// Export all decimal place value templates
export const decimalPlaceValueTemplates = [
  decimalPlaceValueA,
  decimalPlaceValueB,
  decimalPlaceValueC,
];

