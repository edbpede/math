/**
 * Rounding Exercise Templates
 * 
 * Templates for rounding exercises aligned with Danish Fælles Mål curriculum
 * for grades 0-3 (klassetrin 0-3).
 * 
 * Competency Area: Tal og Algebra (Numbers and Algebra)
 * Skills Area: Tal (Numbers)
 * 
 * Requirements:
 * - 3.1: Organize content according to Tal og Algebra competency area
 * - 3.2: Map templates to specific curriculum elements
 * - 3.5: Three difficulty levels (A, B, C)
 */

import type { ExerciseTemplate } from '../../types';
import { validateAnswer } from '../../validator';

/**
 * Rounding Template - Difficulty A (Introductory)
 * 
 * Round numbers 10-99 to the nearest 10
 * For early learners beginning to understand rounding
 */
export const roundingA: ExerciseTemplate = {
  id: 'tal-algebra-rounding-0-3-A',
  name: 'Rounding to Nearest 10 (Basic)',
  metadata: {
    competencyAreaId: 'tal-og-algebra',
    skillsAreaId: 'tal',
    gradeRange: '0-3',
    difficulty: 'A',
    isBinding: true,
    tags: ['rounding', 'number-sense', 'estimation', 'tens'],
  },
  parameters: {
    number: {
      type: 'integer',
      min: 10,
      max: 99,
    },
  },
  generate: (params, locale) => {
    const number = params.number as number;
    
    // Round to nearest 10
    const answer = Math.round(number / 10) * 10;

    const questionText = locale === 'da-DK'
      ? `Afrund {{number}} til nærmeste 10-tal`
      : `Round {{number}} to the nearest 10`;

    return {
      questionText,
      correctAnswer: {
        value: answer,
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
        return 'Tænk på hvilke to 10-taller tallet er mellem. Hvilket er det tættest på?';
      }
      return 'Think about which two tens the number is between. Which is it closest to?';
    },
    // Level 2: Specific technique
    (params, locale) => {
      const number = params.number as number;
      const onesDigit = number % 10;
      const lower = Math.floor(number / 10) * 10;
      const upper = lower + 10;
      
      if (locale === 'da-DK') {
        return `${number} er mellem ${lower} og ${upper}. Se på enertallet: ${onesDigit}. Hvis det er 5 eller mere, afrund op. Hvis det er mindre end 5, afrund ned.`;
      }
      return `${number} is between ${lower} and ${upper}. Look at the ones digit: ${onesDigit}. If it's 5 or more, round up. If it's less than 5, round down.`;
    },
    // Level 3: Partial solution with intermediate steps
    (params, locale) => {
      const number = params.number as number;
      const onesDigit = number % 10;
      const lower = Math.floor(number / 10) * 10;
      const upper = lower + 10;
      const answer = Math.round(number / 10) * 10;
      
      if (locale === 'da-DK') {
        if (onesDigit < 5) {
          return `${number} er mellem ${lower} og ${upper}\nEnertallet er ${onesDigit}, som er mindre end 5\nAfrund ned til ${answer}`;
        } else if (onesDigit === 5) {
          return `${number} er mellem ${lower} og ${upper}\nEnertallet er ${onesDigit}, som er lig med 5\nAfrund op til ${answer}`;
        } else {
          return `${number} er mellem ${lower} og ${upper}\nEnertallet er ${onesDigit}, som er mere end 5\nAfrund op til ${answer}`;
        }
      }
      if (onesDigit < 5) {
        return `${number} is between ${lower} and ${upper}\nThe ones digit is ${onesDigit}, which is less than 5\nRound down to ${answer}`;
      } else if (onesDigit === 5) {
        return `${number} is between ${lower} and ${upper}\nThe ones digit is ${onesDigit}, which equals 5\nRound up to ${answer}`;
      } else {
        return `${number} is between ${lower} and ${upper}\nThe ones digit is ${onesDigit}, which is more than 5\nRound up to ${answer}`;
      }
    },
    // Level 4: Complete solution
    (params, locale) => {
      const number = params.number as number;
      const answer = Math.round(number / 10) * 10;
      return `${answer}`;
    },
  ],
  contextType: 'abstract',
};

/**
 * Rounding Template - Difficulty B (Developing)
 * 
 * Round numbers 10-199 to the nearest 10 or 100
 * For students developing understanding of rounding
 */
export const roundingB: ExerciseTemplate = {
  id: 'tal-algebra-rounding-0-3-B',
  name: 'Rounding to Nearest 10 or 100 (Developing)',
  metadata: {
    competencyAreaId: 'tal-og-algebra',
    skillsAreaId: 'tal',
    gradeRange: '0-3',
    difficulty: 'B',
    isBinding: true,
    tags: ['rounding', 'number-sense', 'estimation', 'tens', 'hundreds'],
  },
  parameters: {
    number: {
      type: 'integer',
      min: 10,
      max: 199,
    },
    roundTo: {
      type: 'string',
      options: ['10', '100'],
    },
  },
  generate: (params, locale) => {
    const number = params.number as number;
    const roundTo = params.roundTo as string;
    
    let answer: number;
    let roundToText: string;
    
    if (roundTo === '10') {
      answer = Math.round(number / 10) * 10;
      roundToText = locale === 'da-DK' ? 'nærmeste 10-tal' : 'nearest 10';
    } else {
      answer = Math.round(number / 100) * 100;
      roundToText = locale === 'da-DK' ? 'nærmeste 100-tal' : 'nearest 100';
    }

    const questionText = locale === 'da-DK'
      ? `Afrund {{number}} til ${roundToText}`
      : `Round {{number}} to the ${roundToText}`;

    return {
      questionText,
      correctAnswer: {
        value: answer,
      },
    };
  },
  validate: (userAnswer, correctAnswer) => {
    return validateAnswer(userAnswer, correctAnswer);
  },
  hints: [
    // Level 1: General strategy
    (params, locale) => {
      const roundTo = params.roundTo as string;
      if (locale === 'da-DK') {
        if (roundTo === '10') {
          return 'Se på enertallet. Hvis det er 5 eller mere, afrund op. Hvis det er mindre end 5, afrund ned.';
        } else {
          return 'Se på tiertallet. Hvis det er 5 eller mere, afrund op. Hvis det er mindre end 5, afrund ned.';
        }
      }
      if (roundTo === '10') {
        return 'Look at the ones digit. If it\'s 5 or more, round up. If it\'s less than 5, round down.';
      } else {
        return 'Look at the tens digit. If it\'s 5 or more, round up. If it\'s less than 5, round down.';
      }
    },
    // Level 2: Specific technique
    (params, locale) => {
      const number = params.number as number;
      const roundTo = params.roundTo as string;
      
      if (roundTo === '10') {
        const onesDigit = number % 10;
        const lower = Math.floor(number / 10) * 10;
        const upper = lower + 10;
        
        if (locale === 'da-DK') {
          return `${number} er mellem ${lower} og ${upper}. Enertallet er ${onesDigit}.`;
        }
        return `${number} is between ${lower} and ${upper}. The ones digit is ${onesDigit}.`;
      } else {
        const tensDigit = Math.floor((number % 100) / 10);
        const lower = Math.floor(number / 100) * 100;
        const upper = lower + 100;
        
        if (locale === 'da-DK') {
          return `${number} er mellem ${lower} og ${upper}. Tiertallet er ${tensDigit}.`;
        }
        return `${number} is between ${lower} and ${upper}. The tens digit is ${tensDigit}.`;
      }
    },
    // Level 3: Partial solution with intermediate steps
    (params, locale) => {
      const number = params.number as number;
      const roundTo = params.roundTo as string;
      
      if (roundTo === '10') {
        const onesDigit = number % 10;
        const lower = Math.floor(number / 10) * 10;
        const upper = lower + 10;
        const answer = Math.round(number / 10) * 10;
        
        if (locale === 'da-DK') {
          if (onesDigit < 5) {
            return `${number} er mellem ${lower} og ${upper}\nEnertallet ${onesDigit} < 5\nAfrund ned til ${answer}`;
          } else {
            return `${number} er mellem ${lower} og ${upper}\nEnertallet ${onesDigit} ≥ 5\nAfrund op til ${answer}`;
          }
        }
        if (onesDigit < 5) {
          return `${number} is between ${lower} and ${upper}\nOnes digit ${onesDigit} < 5\nRound down to ${answer}`;
        } else {
          return `${number} is between ${lower} and ${upper}\nOnes digit ${onesDigit} ≥ 5\nRound up to ${answer}`;
        }
      } else {
        const tensDigit = Math.floor((number % 100) / 10);
        const lower = Math.floor(number / 100) * 100;
        const upper = lower + 100;
        const answer = Math.round(number / 100) * 100;
        
        if (locale === 'da-DK') {
          if (tensDigit < 5) {
            return `${number} er mellem ${lower} og ${upper}\nTiertallet ${tensDigit} < 5\nAfrund ned til ${answer}`;
          } else {
            return `${number} er mellem ${lower} og ${upper}\nTiertallet ${tensDigit} ≥ 5\nAfrund op til ${answer}`;
          }
        }
        if (tensDigit < 5) {
          return `${number} is between ${lower} and ${upper}\nTens digit ${tensDigit} < 5\nRound down to ${answer}`;
        } else {
          return `${number} is between ${lower} and ${upper}\nTens digit ${tensDigit} ≥ 5\nRound up to ${answer}`;
        }
      }
    },
    // Level 4: Complete solution
    (params, locale) => {
      const number = params.number as number;
      const roundTo = params.roundTo as string;
      
      const answer = roundTo === '10'
        ? Math.round(number / 10) * 10
        : Math.round(number / 100) * 100;
      
      return `${answer}`;
    },
  ],
  contextType: 'abstract',
};

/**
 * Rounding Template - Difficulty C (Advanced)
 * 
 * Round numbers 100-999 to the nearest 100
 * For students ready to work with three-digit numbers
 */
export const roundingC: ExerciseTemplate = {
  id: 'tal-algebra-rounding-0-3-C',
  name: 'Rounding to Nearest 100 (Advanced)',
  metadata: {
    competencyAreaId: 'tal-og-algebra',
    skillsAreaId: 'tal',
    gradeRange: '0-3',
    difficulty: 'C',
    isBinding: true,
    tags: ['rounding', 'number-sense', 'estimation', 'hundreds', 'three-digit'],
  },
  parameters: {
    number: {
      type: 'integer',
      min: 100,
      max: 999,
    },
  },
  generate: (params, locale) => {
    const number = params.number as number;
    
    // Round to nearest 100
    const answer = Math.round(number / 100) * 100;

    const questionText = locale === 'da-DK'
      ? `Afrund {{number}} til nærmeste 100-tal`
      : `Round {{number}} to the nearest 100`;

    return {
      questionText,
      correctAnswer: {
        value: answer,
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
        return 'Tænk på hvilke to 100-taller tallet er mellem. Se på tiertallet for at bestemme om du skal afrunde op eller ned.';
      }
      return 'Think about which two hundreds the number is between. Look at the tens digit to determine whether to round up or down.';
    },
    // Level 2: Specific technique
    (params, locale) => {
      const number = params.number as number;
      const tensDigit = Math.floor((number % 100) / 10);
      const lower = Math.floor(number / 100) * 100;
      const upper = lower + 100;
      
      if (locale === 'da-DK') {
        return `${number} er mellem ${lower} og ${upper}. Tiertallet er ${tensDigit}. Hvis tiertallet er 5 eller mere, afrund op. Ellers afrund ned.`;
      }
      return `${number} is between ${lower} and ${upper}. The tens digit is ${tensDigit}. If the tens digit is 5 or more, round up. Otherwise round down.`;
    },
    // Level 3: Partial solution with intermediate steps
    (params, locale) => {
      const number = params.number as number;
      const tensDigit = Math.floor((number % 100) / 10);
      const lower = Math.floor(number / 100) * 100;
      const upper = lower + 100;
      const answer = Math.round(number / 100) * 100;
      
      if (locale === 'da-DK') {
        if (tensDigit < 5) {
          return `${number} er mellem ${lower} og ${upper}\nTiertallet er ${tensDigit}, som er mindre end 5\nAfrund ned til ${answer}`;
        } else if (tensDigit === 5) {
          return `${number} er mellem ${lower} og ${upper}\nTiertallet er ${tensDigit}, som er lig med 5\nAfrund op til ${answer}`;
        } else {
          return `${number} er mellem ${lower} og ${upper}\nTiertallet er ${tensDigit}, som er mere end 5\nAfrund op til ${answer}`;
        }
      }
      if (tensDigit < 5) {
        return `${number} is between ${lower} and ${upper}\nThe tens digit is ${tensDigit}, which is less than 5\nRound down to ${answer}`;
      } else if (tensDigit === 5) {
        return `${number} is between ${lower} and ${upper}\nThe tens digit is ${tensDigit}, which equals 5\nRound up to ${answer}`;
      } else {
        return `${number} is between ${lower} and ${upper}\nThe tens digit is ${tensDigit}, which is more than 5\nRound up to ${answer}`;
      }
    },
    // Level 4: Complete solution
    (params, locale) => {
      const number = params.number as number;
      const answer = Math.round(number / 100) * 100;
      return `${answer}`;
    },
  ],
  contextType: 'abstract',
};

// Export all rounding templates
export const roundingTemplates = [roundingA, roundingB, roundingC];

