/**
 * Fraction/Decimal Conversion Exercise Templates
 * 
 * Templates for converting between fraction and decimal representations,
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
 * Fraction/Decimal Conversion Template - Difficulty A (Introductory)
 * 
 * Simple conversions (1/2 = 0.5, 1/4 = 0.25, 3/4 = 0.75, 1/5 = 0.2)
 * For students beginning to connect fractions and decimals
 */
export const fractionDecimalConversionA: ExerciseTemplate = {
  id: 'tal-algebra-fraction-decimal-conversion-4-6-A',
  name: 'Simple Fraction to Decimal Conversion',
  metadata: {
    competencyAreaId: 'tal-og-algebra',
    skillsAreaId: 'broker-og-procent',
    gradeRange: '4-6',
    difficulty: 'A',
    isBinding: true,
    tags: ['fractions', 'decimals', 'conversion', 'basic'],
  },
  parameters: {
    fractionChoice: {
      type: 'integer',
      options: [0, 1, 2, 3, 4, 5, 6], // Indices for common fractions
    },
  },
  generate: (params, locale) => {
    const choice = params.fractionChoice as number;
    
    // Common fractions with simple decimal equivalents
    const fractions = [
      { num: 1, den: 2, dec: 0.5 },   // 1/2
      { num: 1, den: 4, dec: 0.25 },  // 1/4
      { num: 3, den: 4, dec: 0.75 },  // 3/4
      { num: 1, den: 5, dec: 0.2 },   // 1/5
      { num: 2, den: 5, dec: 0.4 },   // 2/5
      { num: 3, den: 5, dec: 0.6 },   // 3/5
      { num: 4, den: 5, dec: 0.8 },   // 4/5
    ];

    const fraction = fractions[choice];
    const separator = locale === 'da-DK' ? ',' : '.';
    const decimalStr = String(fraction.dec).replace('.', separator);

    const question = locale === 'da-DK'
      ? `Konverter brøken ${fraction.num}/${fraction.den} til et decimaltal.`
      : `Convert the fraction ${fraction.num}/${fraction.den} to a decimal.`;

    return {
      questionText: question,
      correctAnswer: {
        value: fraction.dec,
        equivalents: [
          decimalStr,
          `${fraction.num}/${fraction.den}`,
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
        return 'For at konvertere en brøk til et decimaltal skal du dividere tælleren med nævneren.';
      }
      return 'To convert a fraction to a decimal, divide the numerator by the denominator.';
    },
    // Level 2: Specific technique
    (params, locale) => {
      const choice = params.fractionChoice as number;
      const fractions = [
        { num: 1, den: 2, dec: 0.5 },
        { num: 1, den: 4, dec: 0.25 },
        { num: 3, den: 4, dec: 0.75 },
        { num: 1, den: 5, dec: 0.2 },
        { num: 2, den: 5, dec: 0.4 },
        { num: 3, den: 5, dec: 0.6 },
        { num: 4, den: 5, dec: 0.8 },
      ];
      const fraction = fractions[choice];
      
      if (locale === 'da-DK') {
        return `Divider ${fraction.num} med ${fraction.den}: ${fraction.num} ÷ ${fraction.den} = ?`;
      }
      return `Divide ${fraction.num} by ${fraction.den}: ${fraction.num} ÷ ${fraction.den} = ?`;
    },
    // Level 3: Partial solution
    (params, locale) => {
      const choice = params.fractionChoice as number;
      const fractions = [
        { num: 1, den: 2, dec: 0.5 },
        { num: 1, den: 4, dec: 0.25 },
        { num: 3, den: 4, dec: 0.75 },
        { num: 1, den: 5, dec: 0.2 },
        { num: 2, den: 5, dec: 0.4 },
        { num: 3, den: 5, dec: 0.6 },
        { num: 4, den: 5, dec: 0.8 },
      ];
      const fraction = fractions[choice];
      const separator = locale === 'da-DK' ? ',' : '.';
      
      if (locale === 'da-DK') {
        return `${fraction.num} ÷ ${fraction.den} = ${String(fraction.dec).replace('.', separator)}\n\nDette er en god brøk at huske!`;
      }
      return `${fraction.num} ÷ ${fraction.den} = ${fraction.dec}\n\nThis is a good fraction to memorize!`;
    },
    // Level 4: Complete solution
    (params, locale) => {
      const choice = params.fractionChoice as number;
      const fractions = [
        { num: 1, den: 2, dec: 0.5 },
        { num: 1, den: 4, dec: 0.25 },
        { num: 3, den: 4, dec: 0.75 },
        { num: 1, den: 5, dec: 0.2 },
        { num: 2, den: 5, dec: 0.4 },
        { num: 3, den: 5, dec: 0.6 },
        { num: 4, den: 5, dec: 0.8 },
      ];
      const fraction = fractions[choice];
      const separator = locale === 'da-DK' ? ',' : '.';
      
      if (locale === 'da-DK') {
        return `Svaret er ${String(fraction.dec).replace('.', separator)}`;
      }
      return `The answer is ${fraction.dec}`;
    },
  ],
  contextType: 'abstract',
};

/**
 * Fraction/Decimal Conversion Template - Difficulty B (Developing)
 * 
 * Tenths and hundredths conversions (3/10 = 0.3, 7/100 = 0.07, both directions)
 * For students developing conversion skills
 */
export const fractionDecimalConversionB: ExerciseTemplate = {
  id: 'tal-algebra-fraction-decimal-conversion-4-6-B',
  name: 'Tenths and Hundredths Conversion',
  metadata: {
    competencyAreaId: 'tal-og-algebra',
    skillsAreaId: 'broker-og-procent',
    gradeRange: '4-6',
    difficulty: 'B',
    isBinding: true,
    tags: ['fractions', 'decimals', 'conversion', 'tenths', 'hundredths'],
  },
  parameters: {
    conversionType: {
      type: 'integer',
      options: [0, 1], // 0 = tenths, 1 = hundredths
    },
    numerator: {
      type: 'integer',
      min: 1,
      max: 99,
      constraint: (params) => {
        const type = params.conversionType as number;
        const num = params.numerator as number;
        if (type === 0) {
          // Tenths: numerator 1-9
          return num >= 1 && num <= 9;
        } else {
          // Hundredths: numerator 1-99, but not multiples of 10
          return num >= 1 && num <= 99 && num % 10 !== 0;
        }
      },
    },
    direction: {
      type: 'integer',
      options: [0, 1], // 0 = fraction to decimal, 1 = decimal to fraction
    },
  },
  generate: (params, locale) => {
    const conversionType = params.conversionType as number;
    const numerator = params.numerator as number;
    const direction = params.direction as number;
    
    const denominator = conversionType === 0 ? 10 : 100;
    const decimal = numerator / denominator;
    const separator = locale === 'da-DK' ? ',' : '.';
    
    // Format decimal with proper leading zeros
    let decimalStr: string;
    if (conversionType === 0) {
      decimalStr = `0${separator}${numerator}`;
    } else {
      const padded = String(numerator).padStart(2, '0');
      decimalStr = `0${separator}${padded}`;
    }

    let question: string;
    if (direction === 0) {
      // Fraction to decimal
      question = locale === 'da-DK'
        ? `Konverter brøken ${numerator}/${denominator} til et decimaltal.`
        : `Convert the fraction ${numerator}/${denominator} to a decimal.`;
    } else {
      // Decimal to fraction
      question = locale === 'da-DK'
        ? `Konverter decimaltallet ${decimalStr} til en brøk.`
        : `Convert the decimal ${decimalStr} to a fraction.`;
    }

    return {
      questionText: question,
      correctAnswer: {
        value: direction === 0 ? decimalStr : `${numerator}/${denominator}`,
        equivalents: [
          decimal,
          `${numerator}/${denominator}`,
          decimalStr,
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
      const direction = params.direction as number;
      if (locale === 'da-DK') {
        if (direction === 0) {
          return 'Divider tælleren med nævneren. Tiendedele giver ét ciffer efter kommaet, hundredredele giver to cifre.';
        }
        return 'Antallet af cifre efter kommaet bestemmer nævneren: 1 ciffer = tiendedele (10), 2 cifre = hundredredele (100).';
      }
      if (direction === 0) {
        return 'Divide the numerator by the denominator. Tenths give one digit after the decimal point, hundredths give two digits.';
      }
      return 'The number of digits after the decimal point determines the denominator: 1 digit = tenths (10), 2 digits = hundredths (100).';
    },
    // Level 2: Specific technique
    (params, locale) => {
      const conversionType = params.conversionType as number;
      const numerator = params.numerator as number;
      const direction = params.direction as number;
      const denominator = conversionType === 0 ? 10 : 100;
      const separator = locale === 'da-DK' ? ',' : '.';
      
      if (locale === 'da-DK') {
        if (direction === 0) {
          return `${numerator}/${denominator} betyder ${numerator} ${conversionType === 0 ? 'tiendedele' : 'hundredredele'}.`;
        }
        return `Tæl cifrene efter kommaet for at finde nævneren.`;
      }
      if (direction === 0) {
        return `${numerator}/${denominator} means ${numerator} ${conversionType === 0 ? 'tenths' : 'hundredths'}.`;
      }
      return `Count the digits after the decimal point to find the denominator.`;
    },
    // Level 3: Partial solution
    (params, locale) => {
      const conversionType = params.conversionType as number;
      const numerator = params.numerator as number;
      const direction = params.direction as number;
      const denominator = conversionType === 0 ? 10 : 100;
      const separator = locale === 'da-DK' ? ',' : '.';
      
      if (direction === 0) {
        const decimalStr = conversionType === 0 
          ? `0${separator}${numerator}` 
          : `0${separator}${String(numerator).padStart(2, '0')}`;
        if (locale === 'da-DK') {
          return `${numerator} ÷ ${denominator} = ${decimalStr}`;
        }
        return `${numerator} ÷ ${denominator} = ${decimalStr}`;
      } else {
        if (locale === 'da-DK') {
          return `Tælleren er ${numerator}\nNævneren er ${denominator}`;
        }
        return `The numerator is ${numerator}\nThe denominator is ${denominator}`;
      }
    },
    // Level 4: Complete solution
    (params, locale) => {
      const conversionType = params.conversionType as number;
      const numerator = params.numerator as number;
      const direction = params.direction as number;
      const denominator = conversionType === 0 ? 10 : 100;
      const separator = locale === 'da-DK' ? ',' : '.';
      
      if (direction === 0) {
        const decimalStr = conversionType === 0 
          ? `0${separator}${numerator}` 
          : `0${separator}${String(numerator).padStart(2, '0')}`;
        if (locale === 'da-DK') {
          return `Svaret er ${decimalStr}`;
        }
        return `The answer is ${decimalStr}`;
      } else {
        if (locale === 'da-DK') {
          return `Svaret er ${numerator}/${denominator}`;
        }
        return `The answer is ${numerator}/${denominator}`;
      }
    },
  ],
  contextType: 'abstract',
};

/**
 * Fraction/Decimal Conversion Template - Difficulty C (Advanced)
 * 
 * Converting complex fractions including simplification
 * For students ready for more challenging conversions
 */
export const fractionDecimalConversionC: ExerciseTemplate = {
  id: 'tal-algebra-fraction-decimal-conversion-4-6-C',
  name: 'Complex Fraction/Decimal Conversion',
  metadata: {
    competencyAreaId: 'tal-og-algebra',
    skillsAreaId: 'broker-og-procent',
    gradeRange: '4-6',
    difficulty: 'C',
    isBinding: true,
    tags: ['fractions', 'decimals', 'conversion', 'simplification', 'advanced'],
  },
  parameters: {
    baseDenominator: {
      type: 'integer',
      options: [4, 5, 8, 20, 25], // Denominators that produce terminating decimals
    },
    numerator: {
      type: 'integer',
      min: 1,
      max: 24,
      constraint: (params) => {
        const num = params.numerator as number;
        const den = params.baseDenominator as number;
        // Ensure proper fraction
        return num < den;
      },
    },
  },
  generate: (params, locale) => {
    const denominator = params.baseDenominator as number;
    const numerator = params.numerator as number;
    const decimal = numerator / denominator;
    const separator = locale === 'da-DK' ? ',' : '.';
    
    // Format decimal string
    const decimalStr = String(decimal).replace('.', separator);

    const question = locale === 'da-DK'
      ? `Konverter brøken ${numerator}/${denominator} til et decimaltal.\n\n(Du kan forenkle brøken først, hvis det hjælper)`
      : `Convert the fraction ${numerator}/${denominator} to a decimal.\n\n(You can simplify the fraction first if it helps)`;

    return {
      questionText: question,
      correctAnswer: {
        value: decimal,
        equivalents: [
          decimalStr,
          `${numerator}/${denominator}`,
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
        return 'Hvis nævneren ikke er 10 eller 100, kan du enten dividere direkte, eller først omskrive brøken til en ækvivalent brøk med nævner 10, 100, osv.';
      }
      return 'If the denominator is not 10 or 100, you can either divide directly, or first rewrite the fraction as an equivalent fraction with denominator 10, 100, etc.';
    },
    // Level 2: Specific technique
    (params, locale) => {
      const denominator = params.baseDenominator as number;
      const numerator = params.numerator as number;
      
      if (locale === 'da-DK') {
        if (denominator === 4) {
          return `${denominator} kan omskrives til 100 ved at gange med 25. Gang også tælleren med 25.`;
        } else if (denominator === 5) {
          return `${denominator} kan omskrives til 10 ved at gange med 2. Gang også tælleren med 2.`;
        } else if (denominator === 8) {
          return `${denominator} kan omskrives til 1000 ved at gange med 125. Gang også tælleren med 125.`;
        } else if (denominator === 20) {
          return `${denominator} kan omskrives til 100 ved at gange med 5. Gang også tælleren med 5.`;
        } else if (denominator === 25) {
          return `${denominator} kan omskrives til 100 ved at gange med 4. Gang også tælleren med 4.`;
        }
        return `Du kan dividere ${numerator} med ${denominator}.`;
      }
      if (denominator === 4) {
        return `${denominator} can be rewritten as 100 by multiplying by 25. Also multiply the numerator by 25.`;
      } else if (denominator === 5) {
        return `${denominator} can be rewritten as 10 by multiplying by 2. Also multiply the numerator by 2.`;
      } else if (denominator === 8) {
        return `${denominator} can be rewritten as 1000 by multiplying by 125. Also multiply the numerator by 125.`;
      } else if (denominator === 20) {
        return `${denominator} can be rewritten as 100 by multiplying by 5. Also multiply the numerator by 5.`;
      } else if (denominator === 25) {
        return `${denominator} can be rewritten as 100 by multiplying by 4. Also multiply the numerator by 4.`;
      }
      return `You can divide ${numerator} by ${denominator}.`;
    },
    // Level 3: Partial solution
    (params, locale) => {
      const denominator = params.baseDenominator as number;
      const numerator = params.numerator as number;
      const decimal = numerator / denominator;
      const separator = locale === 'da-DK' ? ',' : '.';
      
      if (locale === 'da-DK') {
        return `${numerator} ÷ ${denominator} = ${String(decimal).replace('.', separator)}`;
      }
      return `${numerator} ÷ ${denominator} = ${decimal}`;
    },
    // Level 4: Complete solution
    (params, locale) => {
      const denominator = params.baseDenominator as number;
      const numerator = params.numerator as number;
      const decimal = numerator / denominator;
      const separator = locale === 'da-DK' ? ',' : '.';
      
      if (locale === 'da-DK') {
        return `Svaret er ${String(decimal).replace('.', separator)}`;
      }
      return `The answer is ${decimal}`;
    },
  ],
  contextType: 'abstract',
};

// Export all fraction/decimal conversion templates
export const fractionDecimalConversionTemplates = [
  fractionDecimalConversionA,
  fractionDecimalConversionB,
  fractionDecimalConversionC,
];

