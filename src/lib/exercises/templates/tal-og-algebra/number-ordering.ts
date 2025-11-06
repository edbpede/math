/**
 * Number Ordering Exercise Templates
 * 
 * Templates for number ordering exercises aligned with Danish Fælles Mål curriculum
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
 * Number Ordering Template - Difficulty A (Introductory)
 * 
 * Order 3 numbers in range 0-20 from smallest to largest or largest to smallest
 * For early learners beginning to understand number order
 */
export const numberOrderingA: ExerciseTemplate = {
  id: 'tal-algebra-ordering-0-3-A',
  name: 'Number Ordering (Basic)',
  metadata: {
    competencyAreaId: 'tal-og-algebra',
    skillsAreaId: 'tal',
    gradeRange: '0-3',
    difficulty: 'A',
    isBinding: true,
    tags: ['ordering', 'number-sense', 'sequence', 'basic'],
  },
  parameters: {
    num1: {
      type: 'integer',
      min: 0,
      max: 20,
    },
    num2: {
      type: 'integer',
      min: 0,
      max: 20,
      constraint: (params) => {
        // Ensure numbers are different
        const num1 = params.num1 as number;
        const num2 = params.num2 as number;
        return num1 !== num2;
      },
    },
    num3: {
      type: 'integer',
      min: 0,
      max: 20,
      constraint: (params) => {
        // Ensure all numbers are different
        const num1 = params.num1 as number;
        const num2 = params.num2 as number;
        const num3 = params.num3 as number;
        return num3 !== num1 && num3 !== num2;
      },
    },
    direction: {
      type: 'string',
      options: ['ascending', 'descending'],
    },
  },
  generate: (params, locale) => {
    const num1 = params.num1 as number;
    const num2 = params.num2 as number;
    const num3 = params.num3 as number;
    const direction = params.direction as string;
    
    const numbers = [num1, num2, num3];
    const sortedNumbers = direction === 'ascending' 
      ? [...numbers].sort((a, b) => a - b)
      : [...numbers].sort((a, b) => b - a);

    const directionText = locale === 'da-DK'
      ? direction === 'ascending' ? 'fra mindste til største' : 'fra største til mindste'
      : direction === 'ascending' ? 'from smallest to largest' : 'from largest to smallest';

    const questionText = locale === 'da-DK'
      ? `Sorter disse tal ${directionText}:\n\n{{num1}}, {{num2}}, {{num3}}\n\nSkriv tallene adskilt med komma (f.eks. 1, 2, 3)`
      : `Sort these numbers ${directionText}:\n\n{{num1}}, {{num2}}, {{num3}}\n\nWrite the numbers separated by commas (e.g. 1, 2, 3)`;

    return {
      questionText,
      correctAnswer: {
        value: sortedNumbers.join(', '),
        equivalents: [
          sortedNumbers.join(','),
          sortedNumbers.join(', '),
          sortedNumbers.join(' '),
        ],
      },
    };
  },
  validate: (userAnswer, correctAnswer) => {
    // Normalize the user's answer by removing extra spaces and handling different separators
    const normalized = userAnswer.trim().replace(/\s+/g, ' ').replace(/[,;]/g, ',');
    const userNumbers = normalized.split(/[,\s]+/).map(n => n.trim()).filter(n => n.length > 0);
    
    const correctValue = correctAnswer.value as string;
    const correctNumbers = correctValue.split(/[,\s]+/).map(n => n.trim()).filter(n => n.length > 0);
    
    if (userNumbers.length !== correctNumbers.length) {
      return { correct: false };
    }
    
    const matches = userNumbers.every((num, idx) => num === correctNumbers[idx]);
    return { correct: matches, normalized: userNumbers.join(', ') };
  },
  hints: [
    // Level 1: General strategy
    (params, locale) => {
      const direction = params.direction as string;
      if (locale === 'da-DK') {
        if (direction === 'ascending') {
          return 'Tænk på at tælle. Hvilket tal kommer først når du tæller? Hvilket kommer sidst?';
        } else {
          return 'Tænk på at tælle baglæns. Hvilket tal er størst? Hvilket er mindst?';
        }
      }
      if (direction === 'ascending') {
        return 'Think about counting. Which number comes first when you count? Which comes last?';
      } else {
        return 'Think about counting backwards. Which number is biggest? Which is smallest?';
      }
    },
    // Level 2: Specific technique
    (params, locale) => {
      const num1 = params.num1 as number;
      const num2 = params.num2 as number;
      const num3 = params.num3 as number;
      const direction = params.direction as string;
      const numbers = [num1, num2, num3];
      const min = Math.min(...numbers);
      const max = Math.max(...numbers);
      
      if (locale === 'da-DK') {
        if (direction === 'ascending') {
          return `Find det mindste tal (${min}) først, derefter det næste, og til sidst det største (${max}).`;
        } else {
          return `Find det største tal (${max}) først, derefter det næste, og til sidst det mindste (${min}).`;
        }
      }
      if (direction === 'ascending') {
        return `Find the smallest number (${min}) first, then the next, and finally the largest (${max}).`;
      } else {
        return `Find the largest number (${max}) first, then the next, and finally the smallest (${min}).`;
      }
    },
    // Level 3: Partial solution with intermediate steps
    (params, locale) => {
      const num1 = params.num1 as number;
      const num2 = params.num2 as number;
      const num3 = params.num3 as number;
      const direction = params.direction as string;
      const numbers = [num1, num2, num3];
      const sorted = direction === 'ascending' 
        ? [...numbers].sort((a, b) => a - b)
        : [...numbers].sort((a, b) => b - a);
      
      if (locale === 'da-DK') {
        const step1 = direction === 'ascending' 
          ? `Mindste: ${sorted[0]}`
          : `Største: ${sorted[0]}`;
        const step2 = direction === 'ascending'
          ? `Mellem: ${sorted[1]}`
          : `Mellem: ${sorted[1]}`;
        const step3 = direction === 'ascending'
          ? `Største: ${sorted[2]}`
          : `Mindste: ${sorted[2]}`;
        return `${step1}\n${step2}\n${step3}`;
      }
      const step1 = direction === 'ascending' 
        ? `Smallest: ${sorted[0]}`
        : `Largest: ${sorted[0]}`;
      const step2 = direction === 'ascending'
        ? `Middle: ${sorted[1]}`
        : `Middle: ${sorted[1]}`;
      const step3 = direction === 'ascending'
        ? `Largest: ${sorted[2]}`
        : `Smallest: ${sorted[2]}`;
      return `${step1}\n${step2}\n${step3}`;
    },
    // Level 4: Complete solution
    (params, locale) => {
      const num1 = params.num1 as number;
      const num2 = params.num2 as number;
      const num3 = params.num3 as number;
      const direction = params.direction as string;
      const numbers = [num1, num2, num3];
      const sorted = direction === 'ascending' 
        ? [...numbers].sort((a, b) => a - b)
        : [...numbers].sort((a, b) => b - a);
      
      return sorted.join(', ');
    },
  ],
  contextType: 'abstract',
};

/**
 * Number Ordering Template - Difficulty B (Developing)
 * 
 * Order 4 numbers in range 0-100 from smallest to largest or largest to smallest
 * For students developing understanding of larger numbers
 */
export const numberOrderingB: ExerciseTemplate = {
  id: 'tal-algebra-ordering-0-3-B',
  name: 'Number Ordering (Developing)',
  metadata: {
    competencyAreaId: 'tal-og-algebra',
    skillsAreaId: 'tal',
    gradeRange: '0-3',
    difficulty: 'B',
    isBinding: true,
    tags: ['ordering', 'number-sense', 'sequence', 'two-digit'],
  },
  parameters: {
    num1: {
      type: 'integer',
      min: 0,
      max: 100,
    },
    num2: {
      type: 'integer',
      min: 0,
      max: 100,
      constraint: (params) => {
        const num1 = params.num1 as number;
        const num2 = params.num2 as number;
        return num1 !== num2;
      },
    },
    num3: {
      type: 'integer',
      min: 0,
      max: 100,
      constraint: (params) => {
        const num1 = params.num1 as number;
        const num2 = params.num2 as number;
        const num3 = params.num3 as number;
        return num3 !== num1 && num3 !== num2;
      },
    },
    num4: {
      type: 'integer',
      min: 0,
      max: 100,
      constraint: (params) => {
        const num1 = params.num1 as number;
        const num2 = params.num2 as number;
        const num3 = params.num3 as number;
        const num4 = params.num4 as number;
        return num4 !== num1 && num4 !== num2 && num4 !== num3;
      },
    },
    direction: {
      type: 'string',
      options: ['ascending', 'descending'],
    },
  },
  generate: (params, locale) => {
    const num1 = params.num1 as number;
    const num2 = params.num2 as number;
    const num3 = params.num3 as number;
    const num4 = params.num4 as number;
    const direction = params.direction as string;
    
    const numbers = [num1, num2, num3, num4];
    const sortedNumbers = direction === 'ascending' 
      ? [...numbers].sort((a, b) => a - b)
      : [...numbers].sort((a, b) => b - a);

    const directionText = locale === 'da-DK'
      ? direction === 'ascending' ? 'fra mindste til største' : 'fra største til mindste'
      : direction === 'ascending' ? 'from smallest to largest' : 'from largest to smallest';

    const questionText = locale === 'da-DK'
      ? `Sorter disse tal ${directionText}:\n\n{{num1}}, {{num2}}, {{num3}}, {{num4}}\n\nSkriv tallene adskilt med komma`
      : `Sort these numbers ${directionText}:\n\n{{num1}}, {{num2}}, {{num3}}, {{num4}}\n\nWrite the numbers separated by commas`;

    return {
      questionText,
      correctAnswer: {
        value: sortedNumbers.join(', '),
        equivalents: [
          sortedNumbers.join(','),
          sortedNumbers.join(', '),
          sortedNumbers.join(' '),
        ],
      },
    };
  },
  validate: (userAnswer, correctAnswer) => {
    const normalized = userAnswer.trim().replace(/\s+/g, ' ').replace(/[,;]/g, ',');
    const userNumbers = normalized.split(/[,\s]+/).map(n => n.trim()).filter(n => n.length > 0);
    
    const correctValue = correctAnswer.value as string;
    const correctNumbers = correctValue.split(/[,\s]+/).map(n => n.trim()).filter(n => n.length > 0);
    
    if (userNumbers.length !== correctNumbers.length) {
      return { correct: false };
    }
    
    const matches = userNumbers.every((num, idx) => num === correctNumbers[idx]);
    return { correct: matches, normalized: userNumbers.join(', ') };
  },
  hints: [
    // Level 1: General strategy
    (params, locale) => {
      const direction = params.direction as string;
      if (locale === 'da-DK') {
        return 'Sammenlign tallene to af gangen. Se på tierne først, derefter enerne.';
      }
      return 'Compare the numbers two at a time. Look at the tens first, then the ones.';
    },
    // Level 2: Specific technique
    (params, locale) => {
      const num1 = params.num1 as number;
      const num2 = params.num2 as number;
      const num3 = params.num3 as number;
      const num4 = params.num4 as number;
      const direction = params.direction as string;
      const numbers = [num1, num2, num3, num4];
      const min = Math.min(...numbers);
      const max = Math.max(...numbers);
      
      if (locale === 'da-DK') {
        if (direction === 'ascending') {
          return `Find først det mindste tal (${min}), så det næste mindste, osv. Det største tal er ${max}.`;
        } else {
          return `Find først det største tal (${max}), så det næste største, osv. Det mindste tal er ${min}.`;
        }
      }
      if (direction === 'ascending') {
        return `First find the smallest number (${min}), then the next smallest, etc. The largest is ${max}.`;
      } else {
        return `First find the largest number (${max}), then the next largest, etc. The smallest is ${min}.`;
      }
    },
    // Level 3: Partial solution with intermediate steps
    (params, locale) => {
      const num1 = params.num1 as number;
      const num2 = params.num2 as number;
      const num3 = params.num3 as number;
      const num4 = params.num4 as number;
      const direction = params.direction as string;
      const numbers = [num1, num2, num3, num4];
      const sorted = direction === 'ascending' 
        ? [...numbers].sort((a, b) => a - b)
        : [...numbers].sort((a, b) => b - a);
      
      if (locale === 'da-DK') {
        return `1. ${sorted[0]}\n2. ${sorted[1]}\n3. ${sorted[2]}\n4. ${sorted[3]}`;
      }
      return `1. ${sorted[0]}\n2. ${sorted[1]}\n3. ${sorted[2]}\n4. ${sorted[3]}`;
    },
    // Level 4: Complete solution
    (params, locale) => {
      const num1 = params.num1 as number;
      const num2 = params.num2 as number;
      const num3 = params.num3 as number;
      const num4 = params.num4 as number;
      const direction = params.direction as string;
      const numbers = [num1, num2, num3, num4];
      const sorted = direction === 'ascending' 
        ? [...numbers].sort((a, b) => a - b)
        : [...numbers].sort((a, b) => b - a);
      
      return sorted.join(', ');
    },
  ],
  contextType: 'abstract',
};

/**
 * Number Ordering Template - Difficulty C (Advanced)
 * 
 * Order 5 numbers in range 0-1000 from smallest to largest or largest to smallest
 * For students ready to work with three-digit numbers
 */
export const numberOrderingC: ExerciseTemplate = {
  id: 'tal-algebra-ordering-0-3-C',
  name: 'Number Ordering (Advanced)',
  metadata: {
    competencyAreaId: 'tal-og-algebra',
    skillsAreaId: 'tal',
    gradeRange: '0-3',
    difficulty: 'C',
    isBinding: true,
    tags: ['ordering', 'number-sense', 'sequence', 'three-digit'],
  },
  parameters: {
    num1: {
      type: 'integer',
      min: 0,
      max: 1000,
    },
    num2: {
      type: 'integer',
      min: 0,
      max: 1000,
      constraint: (params) => {
        const num1 = params.num1 as number;
        const num2 = params.num2 as number;
        return num1 !== num2;
      },
    },
    num3: {
      type: 'integer',
      min: 0,
      max: 1000,
      constraint: (params) => {
        const num1 = params.num1 as number;
        const num2 = params.num2 as number;
        const num3 = params.num3 as number;
        return num3 !== num1 && num3 !== num2;
      },
    },
    num4: {
      type: 'integer',
      min: 0,
      max: 1000,
      constraint: (params) => {
        const num1 = params.num1 as number;
        const num2 = params.num2 as number;
        const num3 = params.num3 as number;
        const num4 = params.num4 as number;
        return num4 !== num1 && num4 !== num2 && num4 !== num3;
      },
    },
    num5: {
      type: 'integer',
      min: 0,
      max: 1000,
      constraint: (params) => {
        const num1 = params.num1 as number;
        const num2 = params.num2 as number;
        const num3 = params.num3 as number;
        const num4 = params.num4 as number;
        const num5 = params.num5 as number;
        return num5 !== num1 && num5 !== num2 && num5 !== num3 && num5 !== num4;
      },
    },
    direction: {
      type: 'string',
      options: ['ascending', 'descending'],
    },
  },
  generate: (params, locale) => {
    const num1 = params.num1 as number;
    const num2 = params.num2 as number;
    const num3 = params.num3 as number;
    const num4 = params.num4 as number;
    const num5 = params.num5 as number;
    const direction = params.direction as string;
    
    const numbers = [num1, num2, num3, num4, num5];
    const sortedNumbers = direction === 'ascending' 
      ? [...numbers].sort((a, b) => a - b)
      : [...numbers].sort((a, b) => b - a);

    const directionText = locale === 'da-DK'
      ? direction === 'ascending' ? 'fra mindste til største' : 'fra største til mindste'
      : direction === 'ascending' ? 'from smallest to largest' : 'from largest to smallest';

    const questionText = locale === 'da-DK'
      ? `Sorter disse tal ${directionText}:\n\n{{num1}}, {{num2}}, {{num3}}, {{num4}}, {{num5}}\n\nSkriv tallene adskilt med komma`
      : `Sort these numbers ${directionText}:\n\n{{num1}}, {{num2}}, {{num3}}, {{num4}}, {{num5}}\n\nWrite the numbers separated by commas`;

    return {
      questionText,
      correctAnswer: {
        value: sortedNumbers.join(', '),
        equivalents: [
          sortedNumbers.join(','),
          sortedNumbers.join(', '),
          sortedNumbers.join(' '),
        ],
      },
    };
  },
  validate: (userAnswer, correctAnswer) => {
    const normalized = userAnswer.trim().replace(/\s+/g, ' ').replace(/[,;]/g, ',');
    const userNumbers = normalized.split(/[,\s]+/).map(n => n.trim()).filter(n => n.length > 0);
    
    const correctValue = correctAnswer.value as string;
    const correctNumbers = correctValue.split(/[,\s]+/).map(n => n.trim()).filter(n => n.length > 0);
    
    if (userNumbers.length !== correctNumbers.length) {
      return { correct: false };
    }
    
    const matches = userNumbers.every((num, idx) => num === correctNumbers[idx]);
    return { correct: matches, normalized: userNumbers.join(', ') };
  },
  hints: [
    // Level 1: General strategy
    (params, locale) => {
      if (locale === 'da-DK') {
        return 'Sammenlign hundrederne først, derefter tierne, og til sidst enerne.';
      }
      return 'Compare the hundreds first, then the tens, and finally the ones.';
    },
    // Level 2: Specific technique
    (params, locale) => {
      const num1 = params.num1 as number;
      const num2 = params.num2 as number;
      const num3 = params.num3 as number;
      const num4 = params.num4 as number;
      const num5 = params.num5 as number;
      const direction = params.direction as string;
      const numbers = [num1, num2, num3, num4, num5];
      const min = Math.min(...numbers);
      const max = Math.max(...numbers);
      
      if (locale === 'da-DK') {
        if (direction === 'ascending') {
          return `Start med det mindste tal (${min}) og byg opad til det største (${max}).`;
        } else {
          return `Start med det største tal (${max}) og byg nedad til det mindste (${min}).`;
        }
      }
      if (direction === 'ascending') {
        return `Start with the smallest number (${min}) and build up to the largest (${max}).`;
      } else {
        return `Start with the largest number (${max}) and build down to the smallest (${min}).`;
      }
    },
    // Level 3: Partial solution with intermediate steps
    (params, locale) => {
      const num1 = params.num1 as number;
      const num2 = params.num2 as number;
      const num3 = params.num3 as number;
      const num4 = params.num4 as number;
      const num5 = params.num5 as number;
      const direction = params.direction as string;
      const numbers = [num1, num2, num3, num4, num5];
      const sorted = direction === 'ascending' 
        ? [...numbers].sort((a, b) => a - b)
        : [...numbers].sort((a, b) => b - a);
      
      if (locale === 'da-DK') {
        return `1. ${sorted[0]}\n2. ${sorted[1]}\n3. ${sorted[2]}\n4. ${sorted[3]}\n5. ${sorted[4]}`;
      }
      return `1. ${sorted[0]}\n2. ${sorted[1]}\n3. ${sorted[2]}\n4. ${sorted[3]}\n5. ${sorted[4]}`;
    },
    // Level 4: Complete solution
    (params, locale) => {
      const num1 = params.num1 as number;
      const num2 = params.num2 as number;
      const num3 = params.num3 as number;
      const num4 = params.num4 as number;
      const num5 = params.num5 as number;
      const direction = params.direction as string;
      const numbers = [num1, num2, num3, num4, num5];
      const sorted = direction === 'ascending' 
        ? [...numbers].sort((a, b) => a - b)
        : [...numbers].sort((a, b) => b - a);
      
      return sorted.join(', ');
    },
  ],
  contextType: 'abstract',
};

// Export all number ordering templates
export const numberOrderingTemplates = [
  numberOrderingA,
  numberOrderingB,
  numberOrderingC,
];

