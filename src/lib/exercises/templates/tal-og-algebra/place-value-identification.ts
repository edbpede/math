/**
 * Place Value Identification Exercise Templates
 * 
 * Templates for place value identification exercises aligned with Danish Fælles Mål curriculum
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
 * Place Value Identification Template - Difficulty A (Introductory)
 * 
 * Identify the value of a specific digit in numbers 10-20
 * For early learners beginning to understand place value
 */
export const placeValueIdentificationA: ExerciseTemplate = {
  id: 'tal-algebra-place-value-0-3-A',
  name: 'Place Value Identification (Basic)',
  metadata: {
    competencyAreaId: 'tal-og-algebra',
    skillsAreaId: 'tal',
    gradeRange: '0-3',
    difficulty: 'A',
    isBinding: true,
    tags: ['place-value', 'number-sense', 'digit-value', 'basic'],
  },
  parameters: {
    number: {
      type: 'integer',
      min: 10,
      max: 20,
    },
    position: {
      type: 'string',
      options: ['ones', 'tens'],
    },
  },
  generate: (params, locale) => {
    const number = params.number as number;
    const position = params.position as string;
    
    const digits = number.toString().split('').map(Number);
    const onesDigit = digits[digits.length - 1];
    const tensDigit = digits.length >= 2 ? digits[digits.length - 2] : 0;
    
    let targetDigit: number;
    let positionName: string;
    let answer: number;
    
    if (position === 'ones') {
      targetDigit = onesDigit;
      positionName = locale === 'da-DK' ? 'enerpladsen' : 'ones place';
      answer = onesDigit;
    } else {
      targetDigit = tensDigit;
      positionName = locale === 'da-DK' ? 'tierpladsen' : 'tens place';
      answer = tensDigit * 10;
    }

    const questionText = locale === 'da-DK'
      ? `Hvad er værdien af ${targetDigit} i tallet {{number}}?`
      : `What is the value of ${targetDigit} in the number {{number}}?`;

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
      const position = params.position as string;
      if (locale === 'da-DK') {
        if (position === 'ones') {
          return 'Tænk på hvilken plads cifret er på. Enere er helt til højre.';
        } else {
          return 'Tænk på hvilken plads cifret er på. Tiere er til venstre for enerne.';
        }
      }
      if (position === 'ones') {
        return 'Think about which place the digit is in. Ones are on the far right.';
      } else {
        return 'Think about which place the digit is in. Tens are to the left of ones.';
      }
    },
    // Level 2: Specific technique
    (params, locale) => {
      const number = params.number as number;
      const position = params.position as string;
      const digits = number.toString().split('').map(Number);
      const onesDigit = digits[digits.length - 1];
      const tensDigit = digits.length >= 2 ? digits[digits.length - 2] : 0;
      
      if (locale === 'da-DK') {
        if (position === 'ones') {
          return `I tallet ${number}, er ${onesDigit} på enerpladsen. Enere repræsenterer deres egen værdi.`;
        } else {
          return `I tallet ${number}, er ${tensDigit} på tierpladsen. Hver tier er værd 10.`;
        }
      }
      if (position === 'ones') {
        return `In the number ${number}, ${onesDigit} is in the ones place. Ones represent their own value.`;
      } else {
        return `In the number ${number}, ${tensDigit} is in the tens place. Each ten is worth 10.`;
      }
    },
    // Level 3: Partial solution with intermediate steps
    (params, locale) => {
      const number = params.number as number;
      const position = params.position as string;
      const digits = number.toString().split('').map(Number);
      const onesDigit = digits[digits.length - 1];
      const tensDigit = digits.length >= 2 ? digits[digits.length - 2] : 0;
      
      if (locale === 'da-DK') {
        if (position === 'ones') {
          return `${number} = ${tensDigit} tiere + ${onesDigit} enere\nVærdien af ${onesDigit} på enerpladsen er ${onesDigit}`;
        } else {
          return `${number} = ${tensDigit} tiere + ${onesDigit} enere\n${tensDigit} tiere = ${tensDigit} × 10 = ${tensDigit * 10}`;
        }
      }
      if (position === 'ones') {
        return `${number} = ${tensDigit} tens + ${onesDigit} ones\nThe value of ${onesDigit} in the ones place is ${onesDigit}`;
      } else {
        return `${number} = ${tensDigit} tens + ${onesDigit} ones\n${tensDigit} tens = ${tensDigit} × 10 = ${tensDigit * 10}`;
      }
    },
    // Level 4: Complete solution
    (params, locale) => {
      const number = params.number as number;
      const position = params.position as string;
      const digits = number.toString().split('').map(Number);
      const onesDigit = digits[digits.length - 1];
      const tensDigit = digits.length >= 2 ? digits[digits.length - 2] : 0;
      
      if (position === 'ones') {
        return `${onesDigit}`;
      } else {
        return `${tensDigit * 10}`;
      }
    },
  ],
  contextType: 'abstract',
};

/**
 * Place Value Identification Template - Difficulty B (Developing)
 * 
 * Identify the value of a specific digit in numbers 10-99
 * For students developing understanding of two-digit numbers
 */
export const placeValueIdentificationB: ExerciseTemplate = {
  id: 'tal-algebra-place-value-0-3-B',
  name: 'Place Value Identification (Developing)',
  metadata: {
    competencyAreaId: 'tal-og-algebra',
    skillsAreaId: 'tal',
    gradeRange: '0-3',
    difficulty: 'B',
    isBinding: true,
    tags: ['place-value', 'number-sense', 'digit-value', 'two-digit'],
  },
  parameters: {
    number: {
      type: 'integer',
      min: 10,
      max: 99,
    },
    position: {
      type: 'string',
      options: ['ones', 'tens'],
    },
  },
  generate: (params, locale) => {
    const number = params.number as number;
    const position = params.position as string;
    
    const digits = number.toString().split('').map(Number);
    const onesDigit = digits[digits.length - 1];
    const tensDigit = digits.length >= 2 ? digits[digits.length - 2] : 0;
    
    let targetDigit: number;
    let positionName: string;
    let answer: number;
    
    if (position === 'ones') {
      targetDigit = onesDigit;
      positionName = locale === 'da-DK' ? 'enerpladsen' : 'ones place';
      answer = onesDigit;
    } else {
      targetDigit = tensDigit;
      positionName = locale === 'da-DK' ? 'tierpladsen' : 'tens place';
      answer = tensDigit * 10;
    }

    const questionText = locale === 'da-DK'
      ? `Hvad er værdien af ${targetDigit} i tallet {{number}}?`
      : `What is the value of ${targetDigit} in the number {{number}}?`;

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
        return 'Husk at et ciffer har forskellige værdier afhængigt af dets plads i tallet.';
      }
      return 'Remember that a digit has different values depending on its place in the number.';
    },
    // Level 2: Specific technique
    (params, locale) => {
      const number = params.number as number;
      const position = params.position as string;
      const digits = number.toString().split('').map(Number);
      const onesDigit = digits[digits.length - 1];
      const tensDigit = digits.length >= 2 ? digits[digits.length - 2] : 0;
      
      if (locale === 'da-DK') {
        if (position === 'ones') {
          return `I ${number}: ${onesDigit} er på enerpladsen. Enerpladsen giver den værdi som tallet viser.`;
        } else {
          return `I ${number}: ${tensDigit} er på tierpladsen. Tierpladsen betyder "gange 10".`;
        }
      }
      if (position === 'ones') {
        return `In ${number}: ${onesDigit} is in the ones place. The ones place gives the value shown.`;
      } else {
        return `In ${number}: ${tensDigit} is in the tens place. The tens place means "times 10".`;
      }
    },
    // Level 3: Partial solution with intermediate steps
    (params, locale) => {
      const number = params.number as number;
      const position = params.position as string;
      const digits = number.toString().split('').map(Number);
      const onesDigit = digits[digits.length - 1];
      const tensDigit = digits.length >= 2 ? digits[digits.length - 2] : 0;
      
      if (locale === 'da-DK') {
        if (position === 'ones') {
          return `${number} = ${tensDigit}0 + ${onesDigit}\nEnerpladsen: ${onesDigit}\nSvar: ${onesDigit}`;
        } else {
          return `${number} = ${tensDigit}0 + ${onesDigit}\nTierpladsen: ${tensDigit}\n${tensDigit} tiere = ${tensDigit} × 10 = ${tensDigit * 10}`;
        }
      }
      if (position === 'ones') {
        return `${number} = ${tensDigit}0 + ${onesDigit}\nOnes place: ${onesDigit}\nAnswer: ${onesDigit}`;
      } else {
        return `${number} = ${tensDigit}0 + ${onesDigit}\nTens place: ${tensDigit}\n${tensDigit} tens = ${tensDigit} × 10 = ${tensDigit * 10}`;
      }
    },
    // Level 4: Complete solution
    (params, locale) => {
      const number = params.number as number;
      const position = params.position as string;
      const digits = number.toString().split('').map(Number);
      const onesDigit = digits[digits.length - 1];
      const tensDigit = digits.length >= 2 ? digits[digits.length - 2] : 0;
      
      if (position === 'ones') {
        return `${onesDigit}`;
      } else {
        return `${tensDigit * 10}`;
      }
    },
  ],
  contextType: 'abstract',
};

/**
 * Place Value Identification Template - Difficulty C (Advanced)
 * 
 * Identify the value of a specific digit in numbers 100-999
 * For students ready to work with three-digit numbers
 */
export const placeValueIdentificationC: ExerciseTemplate = {
  id: 'tal-algebra-place-value-0-3-C',
  name: 'Place Value Identification (Advanced)',
  metadata: {
    competencyAreaId: 'tal-og-algebra',
    skillsAreaId: 'tal',
    gradeRange: '0-3',
    difficulty: 'C',
    isBinding: true,
    tags: ['place-value', 'number-sense', 'digit-value', 'three-digit'],
  },
  parameters: {
    number: {
      type: 'integer',
      min: 100,
      max: 999,
    },
    position: {
      type: 'string',
      options: ['ones', 'tens', 'hundreds'],
    },
  },
  generate: (params, locale) => {
    const number = params.number as number;
    const position = params.position as string;
    
    const digits = number.toString().split('').map(Number);
    const onesDigit = digits[digits.length - 1];
    const tensDigit = digits.length >= 2 ? digits[digits.length - 2] : 0;
    const hundredsDigit = digits.length >= 3 ? digits[digits.length - 3] : 0;
    
    let targetDigit: number;
    let positionName: string;
    let answer: number;
    
    if (position === 'ones') {
      targetDigit = onesDigit;
      positionName = locale === 'da-DK' ? 'enerpladsen' : 'ones place';
      answer = onesDigit;
    } else if (position === 'tens') {
      targetDigit = tensDigit;
      positionName = locale === 'da-DK' ? 'tierpladsen' : 'tens place';
      answer = tensDigit * 10;
    } else {
      targetDigit = hundredsDigit;
      positionName = locale === 'da-DK' ? 'hundredepladsen' : 'hundreds place';
      answer = hundredsDigit * 100;
    }

    const questionText = locale === 'da-DK'
      ? `Hvad er værdien af ${targetDigit} i tallet {{number}}?`
      : `What is the value of ${targetDigit} in the number {{number}}?`;

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
        return 'Tænk på pladsen: enere (helt til højre), tiere (i midten), hundreder (helt til venstre).';
      }
      return 'Think about the place: ones (far right), tens (middle), hundreds (far left).';
    },
    // Level 2: Specific technique
    (params, locale) => {
      const number = params.number as number;
      const position = params.position as string;
      const digits = number.toString().split('').map(Number);
      const onesDigit = digits[digits.length - 1];
      const tensDigit = digits.length >= 2 ? digits[digits.length - 2] : 0;
      const hundredsDigit = digits.length >= 3 ? digits[digits.length - 3] : 0;
      
      if (locale === 'da-DK') {
        if (position === 'ones') {
          return `I ${number}: ${onesDigit} er på enerpladsen. Værdien er ${onesDigit}.`;
        } else if (position === 'tens') {
          return `I ${number}: ${tensDigit} er på tierpladsen. Hver tier er 10, så ${tensDigit} tiere = ${tensDigit} × 10.`;
        } else {
          return `I ${number}: ${hundredsDigit} er på hundredepladsen. Hver hundrede er 100, så ${hundredsDigit} hundreder = ${hundredsDigit} × 100.`;
        }
      }
      if (position === 'ones') {
        return `In ${number}: ${onesDigit} is in the ones place. The value is ${onesDigit}.`;
      } else if (position === 'tens') {
        return `In ${number}: ${tensDigit} is in the tens place. Each ten is 10, so ${tensDigit} tens = ${tensDigit} × 10.`;
      } else {
        return `In ${number}: ${hundredsDigit} is in the hundreds place. Each hundred is 100, so ${hundredsDigit} hundreds = ${hundredsDigit} × 100.`;
      }
    },
    // Level 3: Partial solution with intermediate steps
    (params, locale) => {
      const number = params.number as number;
      const position = params.position as string;
      const digits = number.toString().split('').map(Number);
      const onesDigit = digits[digits.length - 1];
      const tensDigit = digits.length >= 2 ? digits[digits.length - 2] : 0;
      const hundredsDigit = digits.length >= 3 ? digits[digits.length - 3] : 0;
      
      if (locale === 'da-DK') {
        const breakdown = `${number} = ${hundredsDigit}00 + ${tensDigit}0 + ${onesDigit}`;
        if (position === 'ones') {
          return `${breakdown}\nEnerpladsen: ${onesDigit}\nSvar: ${onesDigit}`;
        } else if (position === 'tens') {
          return `${breakdown}\nTierpladsen: ${tensDigit}\n${tensDigit} × 10 = ${tensDigit * 10}`;
        } else {
          return `${breakdown}\nHundredepladsen: ${hundredsDigit}\n${hundredsDigit} × 100 = ${hundredsDigit * 100}`;
        }
      }
      const breakdown = `${number} = ${hundredsDigit}00 + ${tensDigit}0 + ${onesDigit}`;
      if (position === 'ones') {
        return `${breakdown}\nOnes place: ${onesDigit}\nAnswer: ${onesDigit}`;
      } else if (position === 'tens') {
        return `${breakdown}\nTens place: ${tensDigit}\n${tensDigit} × 10 = ${tensDigit * 10}`;
      } else {
        return `${breakdown}\nHundreds place: ${hundredsDigit}\n${hundredsDigit} × 100 = ${hundredsDigit * 100}`;
      }
    },
    // Level 4: Complete solution
    (params, locale) => {
      const number = params.number as number;
      const position = params.position as string;
      const digits = number.toString().split('').map(Number);
      const onesDigit = digits[digits.length - 1];
      const tensDigit = digits.length >= 2 ? digits[digits.length - 2] : 0;
      const hundredsDigit = digits.length >= 3 ? digits[digits.length - 3] : 0;
      
      if (position === 'ones') {
        return `${onesDigit}`;
      } else if (position === 'tens') {
        return `${tensDigit * 10}`;
      } else {
        return `${hundredsDigit * 100}`;
      }
    },
  ],
  contextType: 'abstract',
};

// Export all place value identification templates
export const placeValueIdentificationTemplates = [
  placeValueIdentificationA,
  placeValueIdentificationB,
  placeValueIdentificationC,
];

