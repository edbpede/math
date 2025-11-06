/**
 * Multiplication Exercise Templates
 * 
 * Templates for multiplication exercises aligned with Danish Fælles Mål curriculum
 * for grades 0-3 (klassetrin 0-3).
 * 
 * Competency Area: Tal og Algebra (Numbers and Algebra)
 * Skills Area: Regning (Calculation and number patterns)
 * 
 * Requirements:
 * - 3.1: Organize content according to Tal og Algebra competency area
 * - 3.2: Map templates to specific curriculum elements
 * - 3.5: Three difficulty levels (A, B, C)
 */

import type { ExerciseTemplate } from '../../types';
import { validateAnswer } from '../../validator';

/**
 * Multiplication Template - Difficulty A (Introductory)
 * 
 * Simple facts (0-5 × 0-5)
 * For early learners beginning to understand multiplication
 */
export const multiplicationA: ExerciseTemplate = {
  id: 'tal-algebra-multiplication-0-3-A',
  name: 'Simple Multiplication Facts',
  metadata: {
    competencyAreaId: 'tal-og-algebra',
    skillsAreaId: 'regning',
    gradeRange: '0-3',
    difficulty: 'A',
    isBinding: true,
    tags: ['multiplication', 'basic-facts', 'times-tables'],
  },
  parameters: {
    a: {
      type: 'integer',
      min: 0,
      max: 5,
    },
    b: {
      type: 'integer',
      min: 0,
      max: 5,
    },
  },
  generate: (params, locale) => {
    const a = params.a as number;
    const b = params.b as number;
    const answer = a * b;

    return {
      questionText: `{{a}} × {{b}} = ?`,
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
      const a = params.a as number;
      const b = params.b as number;
      if (locale === 'da-DK') {
        if (a === 0 || b === 0) {
          return 'Når du ganger med 0, er resultatet altid 0.';
        }
        if (a === 1) {
          return `1 gange noget er det samme tal. 1 × ${b} = ${b}`;
        }
        if (b === 1) {
          return `Noget gange 1 er det samme tal. ${a} × 1 = ${a}`;
        }
        return `Tænk på ${a} × ${b} som ${a} grupper af ${b}, eller ${b} grupper af ${a}.`;
      }
      if (a === 0 || b === 0) {
        return 'When you multiply by 0, the result is always 0.';
      }
      if (a === 1) {
        return `1 times anything is that same number. 1 × ${b} = ${b}`;
      }
      if (b === 1) {
        return `Anything times 1 is that same number. ${a} × 1 = ${a}`;
      }
      return `Think of ${a} × ${b} as ${a} groups of ${b}, or ${b} groups of ${a}.`;
    },
    // Level 2: Specific technique
    (params, locale) => {
      const a = params.a as number;
      const b = params.b as number;
      if (a === 0 || b === 0) {
        if (locale === 'da-DK') {
          return `${a} × ${b} = 0`;
        }
        return `${a} × ${b} = 0`;
      }
      if (locale === 'da-DK') {
        return `Du kan tælle: ${Array.from({ length: a }, () => b).join(' + ')} = ?`;
      }
      return `You can count: ${Array.from({ length: a }, () => b).join(' + ')} = ?`;
    },
    // Level 3: Partial solution with intermediate steps
    (params, locale) => {
      const a = params.a as number;
      const b = params.b as number;
      if (a === 0 || b === 0) {
        if (locale === 'da-DK') {
          return `${a} × ${b} = 0 (nul gange noget er altid 0)`;
        }
        return `${a} × ${b} = 0 (zero times anything is always 0)`;
      }
      const steps: string[] = [];
      let sum = 0;
      for (let i = 1; i <= a; i++) {
        sum += b;
        steps.push(`${b} × ${i} = ${sum}`);
      }
      if (locale === 'da-DK') {
        return `Tæl i ${b}'ere:\n${steps.join('\n')}`;
      }
      return `Count by ${b}s:\n${steps.join('\n')}`;
    },
    // Level 4: Complete solution
    (params, locale) => {
      const a = params.a as number;
      const b = params.b as number;
      const answer = a * b;
      if (locale === 'da-DK') {
        return `${a} × ${b} = ${answer}`;
      }
      return `${a} × ${b} = ${answer}`;
    },
  ],
  contextType: 'abstract',
};

/**
 * Multiplication Template - Difficulty B (Developing)
 * 
 * Facts up to 10×10, focusing on 2, 5, 10 times tables
 * Builds confidence with common multiplication patterns
 */
export const multiplicationB: ExerciseTemplate = {
  id: 'tal-algebra-multiplication-0-3-B',
  name: 'Multiplication Tables (2, 5, 10)',
  metadata: {
    competencyAreaId: 'tal-og-algebra',
    skillsAreaId: 'regning',
    gradeRange: '0-3',
    difficulty: 'B',
    isBinding: true,
    tags: ['multiplication', 'times-tables', 'patterns'],
  },
  parameters: {
    a: {
      type: 'integer',
      min: 0,
      max: 10,
      options: [2, 5, 10], // Focus on these multiplication tables
    },
    b: {
      type: 'integer',
      min: 0,
      max: 10,
    },
  },
  generate: (params, locale) => {
    const a = params.a as number;
    const b = params.b as number;
    const answer = a * b;

    return {
      questionText: `{{a}} × {{b}} = ?`,
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
      const a = params.a as number;
      const b = params.b as number;
      if (locale === 'da-DK') {
        if (a === 2) {
          return 'Gange med 2 er det samme som at fordoble tallet eller lægge det sammen med sig selv.';
        }
        if (a === 5) {
          return 'Gange med 5 giver tal der ender på 0 eller 5. Tænk på møntværdier!';
        }
        if (a === 10) {
          return 'Gange med 10 tilføjer et 0 til tallet.';
        }
        return `Tænk på ${a}-tabellen. Hvad ved du om at gange med ${a}?`;
      }
      if (a === 2) {
        return 'Multiplying by 2 is the same as doubling or adding the number to itself.';
      }
      if (a === 5) {
        return 'Multiplying by 5 gives numbers ending in 0 or 5. Think about coin values!';
      }
      if (a === 10) {
        return 'Multiplying by 10 adds a 0 to the number.';
      }
      return `Think about the ${a} times table. What do you know about multiplying by ${a}?`;
    },
    // Level 2: Specific technique
    (params, locale) => {
      const a = params.a as number;
      const b = params.b as number;
      if (locale === 'da-DK') {
        if (a === 2) {
          return `${b} + ${b} = ?`;
        }
        if (a === 5) {
          return `Tæl i 5'ere: 5, 10, 15, 20... Hvilket tal kommer efter ${(b - 1) * 5}?`;
        }
        if (a === 10) {
          return `${b} × 10 = ${b}0`;
        }
        return `Tæl i ${a}'ere: ${a}, ${a * 2}, ${a * 3}...`;
      }
      if (a === 2) {
        return `${b} + ${b} = ?`;
      }
      if (a === 5) {
        return `Count by 5s: 5, 10, 15, 20... What number comes after ${(b - 1) * 5}?`;
      }
      if (a === 10) {
        return `${b} × 10 = ${b}0`;
      }
      return `Count by ${a}s: ${a}, ${a * 2}, ${a * 3}...`;
    },
    // Level 3: Partial solution with intermediate steps
    (params, locale) => {
      const a = params.a as number;
      const b = params.b as number;
      const answer = a * b;
      if (locale === 'da-DK') {
        if (a === 2) {
          return `${a} × ${b} = ${b} + ${b} = ${answer}`;
        }
        if (a === 10) {
          return `${a} × ${b} = ${b}0 = ${answer}`;
        }
        // Show counting pattern
        const sequence = Array.from({ length: b }, (_, i) => a * (i + 1));
        return `Tæl i ${a}'ere: ${sequence.join(', ')}`;
      }
      if (a === 2) {
        return `${a} × ${b} = ${b} + ${b} = ${answer}`;
      }
      if (a === 10) {
        return `${a} × ${b} = ${b}0 = ${answer}`;
      }
      // Show counting pattern
      const sequence = Array.from({ length: b }, (_, i) => a * (i + 1));
      return `Count by ${a}s: ${sequence.join(', ')}`;
    },
    // Level 4: Complete solution
    (params, locale) => {
      const a = params.a as number;
      const b = params.b as number;
      const answer = a * b;
      if (locale === 'da-DK') {
        return `${a} × ${b} = ${answer}`;
      }
      return `${a} × ${b} = ${answer}`;
    },
  ],
  contextType: 'abstract',
};

/**
 * Multiplication Template - Difficulty C (Advanced)
 * 
 * All facts to 10×10, including double digit × single digit
 * For students mastering multiplication
 */
export const multiplicationC: ExerciseTemplate = {
  id: 'tal-algebra-multiplication-0-3-C',
  name: 'Advanced Multiplication',
  metadata: {
    competencyAreaId: 'tal-og-algebra',
    skillsAreaId: 'regning',
    gradeRange: '0-3',
    difficulty: 'C',
    isBinding: true,
    tags: ['multiplication', 'times-tables', 'advanced', 'double-digit'],
  },
  parameters: {
    a: {
      type: 'integer',
      min: 2,
      max: 10,
    },
    b: {
      type: 'integer',
      min: 2,
      max: 10,
    },
  },
  generate: (params, locale) => {
    const a = params.a as number;
    const b = params.b as number;
    const answer = a * b;

    return {
      questionText: `{{a}} × {{b}} = ?`,
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
      const a = params.a as number;
      const b = params.b as number;
      if (locale === 'da-DK') {
        // Check for commutative property opportunity
        if (b < a) {
          return `Husk: ${a} × ${b} = ${b} × ${a}. Vælg den nemmeste måde at tænke på det.`;
        }
        // Check for special patterns
        if (a === b) {
          return `Dette er ${a} kvadreret: ${a} × ${a}`;
        }
        return `Tænk på ${a}-tabellen. Kan du bruge nogen mønstre du kender?`;
      }
      // Check for commutative property opportunity
      if (b < a) {
        return `Remember: ${a} × ${b} = ${b} × ${a}. Choose the easier way to think about it.`;
      }
      // Check for special patterns
      if (a === b) {
        return `This is ${a} squared: ${a} × ${a}`;
      }
      return `Think about the ${a} times table. Can you use any patterns you know?`;
    },
    // Level 2: Specific technique
    (params, locale) => {
      const a = params.a as number;
      const b = params.b as number;
      
      if (locale === 'da-DK') {
        // Try to decompose into easier multiplications
        if (b === 4) {
          return `${a} × 4 kan deles op: (${a} × 2) × 2`;
        }
        if (b === 6) {
          return `${a} × 6 kan deles op: (${a} × 5) + ${a}`;
        }
        if (b === 8) {
          return `${a} × 8 kan deles op: (${a} × 4) × 2`;
        }
        if (b === 9) {
          return `${a} × 9 kan deles op: (${a} × 10) - ${a}`;
        }
        return `Prøv at bryde det ned i mindre dele, eller tæl i ${a}'ere.`;
      }
      
      // Try to decompose into easier multiplications
      if (b === 4) {
        return `${a} × 4 can be broken down: (${a} × 2) × 2`;
      }
      if (b === 6) {
        return `${a} × 6 can be broken down: (${a} × 5) + ${a}`;
      }
      if (b === 8) {
        return `${a} × 8 can be broken down: (${a} × 4) × 2`;
      }
      if (b === 9) {
        return `${a} × 9 can be broken down: (${a} × 10) - ${a}`;
      }
      return `Try breaking it down into smaller parts, or count by ${a}s.`;
    },
    // Level 3: Partial solution with intermediate steps
    (params, locale) => {
      const a = params.a as number;
      const b = params.b as number;
      
      if (locale === 'da-DK') {
        // Show decomposition strategy
        if (b === 4) {
          const step1 = a * 2;
          const step2 = step1 * 2;
          return `${a} × 4 = (${a} × 2) × 2 = ${step1} × 2 = ${step2}`;
        }
        if (b === 6) {
          const step1 = a * 5;
          const step2 = step1 + a;
          return `${a} × 6 = (${a} × 5) + ${a} = ${step1} + ${a} = ${step2}`;
        }
        if (b === 9) {
          const step1 = a * 10;
          const step2 = step1 - a;
          return `${a} × 9 = (${a} × 10) - ${a} = ${step1} - ${a} = ${step2}`;
        }
        // Default: show repeated addition
        const steps = Array.from({ length: Math.min(b, 5) }, (_, i) => a * (i + 1));
        return `Tæl i ${a}'ere: ${steps.join(', ')}${b > 5 ? '...' : ''}`;
      }
      
      // Show decomposition strategy
      if (b === 4) {
        const step1 = a * 2;
        const step2 = step1 * 2;
        return `${a} × 4 = (${a} × 2) × 2 = ${step1} × 2 = ${step2}`;
      }
      if (b === 6) {
        const step1 = a * 5;
        const step2 = step1 + a;
        return `${a} × 6 = (${a} × 5) + ${a} = ${step1} + ${a} = ${step2}`;
      }
      if (b === 9) {
        const step1 = a * 10;
        const step2 = step1 - a;
        return `${a} × 9 = (${a} × 10) - ${a} = ${step1} - ${a} = ${step2}`;
      }
      // Default: show repeated addition
      const steps = Array.from({ length: Math.min(b, 5) }, (_, i) => a * (i + 1));
      return `Count by ${a}s: ${steps.join(', ')}${b > 5 ? '...' : ''}`;
    },
    // Level 4: Complete solution
    (params, locale) => {
      const a = params.a as number;
      const b = params.b as number;
      const answer = a * b;
      if (locale === 'da-DK') {
        return `${a} × ${b} = ${answer}`;
      }
      return `${a} × ${b} = ${answer}`;
    },
  ],
  contextType: 'abstract',
};

// Export all multiplication templates
export const multiplicationTemplates = [multiplicationA, multiplicationB, multiplicationC];

