/**
 * Subtraction Exercise Templates
 *
 * Templates for subtraction exercises aligned with Danish Fælles Mål curriculum
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

import type { ExerciseTemplate } from "../../types";
import { validateAnswer } from "../../validator";

/**
 * Subtraction Template - Difficulty A (Introductory)
 *
 * Single digit - single digit, result ≥ 0
 * For early learners just beginning to understand subtraction
 */
export const subtractionA: ExerciseTemplate = {
  id: "tal-algebra-subtraction-0-3-A",
  name: "Single Digit Subtraction (Basic)",
  metadata: {
    competencyAreaId: "tal-og-algebra",
    skillsAreaId: "regning",
    gradeRange: "0-3",
    difficulty: "A",
    isBinding: true,
    tags: ["subtraction", "single-digit", "basic-arithmetic"],
  },
  parameters: {
    a: {
      type: "integer",
      min: 0,
      max: 10,
    },
    b: {
      type: "integer",
      min: 0,
      max: 10,
      constraint: (params) => {
        // Ensure result is non-negative (a - b ≥ 0)
        const a = params.a as number;
        const b = params.b as number;
        return b <= a;
      },
    },
  },
  generate: (params, _locale) => {
    const a = params.a as number;
    const b = params.b as number;
    const answer = a - b;

    return {
      questionText: `{{a}} - {{b}} = ?`,
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
    (_params, locale) => {
      if (locale === "da-DK") {
        return "Tænk på at tælle baglæns. Du kan bruge dine fingre til at hjælpe.";
      }
      return "Think about counting backward. You can use your fingers to help.";
    },
    // Level 2: Specific technique
    (_params, locale) => {
      const a = params.a as number;
      const b = params.b as number;
      if (locale === "da-DK") {
        return `Start med ${a} og tæl ${b} tilbage.`;
      }
      return `Start with ${a} and count ${b} back.`;
    },
    // Level 3: Partial solution with intermediate steps
    (_params, locale) => {
      const a = params.a as number;
      const b = params.b as number;
      if (b > 0) {
        const steps = Array.from({ length: b }, (_, i) => a - i - 1);
        if (locale === "da-DK") {
          return `Hvis du tæller baglæns: ${a}, ${steps.join(", ")}`;
        }
        return `If you count backward: ${a}, ${steps.join(", ")}`;
      }
      if (locale === "da-DK") {
        return `${a} - 0 betyder at du ikke tager nogen væk.`;
      }
      return `${a} - 0 means you don't take any away.`;
    },
    // Level 4: Complete solution
    (_params, locale) => {
      const a = params.a as number;
      const b = params.b as number;
      const answer = a - b;
      if (locale === "da-DK") {
        return `${a} - ${b} = ${answer}`;
      }
      return `${a} - ${b} = ${answer}`;
    },
  ],
  contextType: "abstract",
};

/**
 * Subtraction Template - Difficulty B (Developing)
 *
 * Double digit - single digit, no borrowing needed
 * Introduces working with tens and ones
 */
export const subtractionB: ExerciseTemplate = {
  id: "tal-algebra-subtraction-0-3-B",
  name: "Subtraction Without Borrowing",
  metadata: {
    competencyAreaId: "tal-og-algebra",
    skillsAreaId: "regning",
    gradeRange: "0-3",
    difficulty: "B",
    isBinding: true,
    tags: ["subtraction", "double-digit", "no-borrowing", "tens-and-ones"],
  },
  parameters: {
    a: {
      type: "integer",
      min: 10,
      max: 20,
    },
    b: {
      type: "integer",
      min: 1,
      max: 9,
      constraint: (params) => {
        // No borrowing: ensure ones digit of a >= b
        const a = params.a as number;
        const b = params.b as number;
        const aOnes = a % 10;
        return aOnes >= b;
      },
    },
  },
  generate: (params, _locale) => {
    const a = params.a as number;
    const b = params.b as number;
    const answer = a - b;

    return {
      questionText: `{{a}} - {{b}} = ?`,
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
    (_params, locale) => {
      if (locale === "da-DK") {
        return "Tænk på ental og tital. Du kan trække fra entalene først.";
      }
      return "Think about ones and tens. You can subtract from the ones first.";
    },
    // Level 2: Specific technique
    (_params, locale) => {
      const a = params.a as number;
      const b = params.b as number;
      const aTens = Math.floor(a / 10);
      const aOnes = a % 10;
      if (locale === "da-DK") {
        return `${a} er ${aTens} tiere + ${aOnes} enere. Træk ${b} fra entalene.`;
      }
      return `${a} is ${aTens} tens + ${aOnes} ones. Subtract ${b} from the ones.`;
    },
    // Level 3: Partial solution with intermediate steps
    (_params, locale) => {
      const a = params.a as number;
      const b = params.b as number;
      const aTens = Math.floor(a / 10);
      const aOnes = a % 10;
      const newOnes = aOnes - b;
      if (locale === "da-DK") {
        return `${a} - ${b} = ${aTens} tiere + (${aOnes} - ${b}) enere = ${aTens} tiere + ${newOnes} enere`;
      }
      return `${a} - ${b} = ${aTens} tens + (${aOnes} - ${b}) ones = ${aTens} tens + ${newOnes} ones`;
    },
    // Level 4: Complete solution
    (_params, locale) => {
      const a = params.a as number;
      const b = params.b as number;
      const answer = a - b;
      if (locale === "da-DK") {
        return `${a} - ${b} = ${answer}`;
      }
      return `${a} - ${b} = ${answer}`;
    },
  ],
  contextType: "abstract",
};

/**
 * Subtraction Template - Difficulty C (Advanced)
 *
 * Double digit - double digit with borrowing
 * For students ready to work with regrouping
 */
export const subtractionC: ExerciseTemplate = {
  id: "tal-algebra-subtraction-0-3-C",
  name: "Subtraction with Borrowing",
  metadata: {
    competencyAreaId: "tal-og-algebra",
    skillsAreaId: "regning",
    gradeRange: "0-3",
    difficulty: "C",
    isBinding: true,
    tags: [
      "subtraction",
      "double-digit",
      "borrowing",
      "regrouping",
      "advanced",
    ],
  },
  parameters: {
    a: {
      type: "integer",
      min: 20,
      max: 50,
    },
    b: {
      type: "integer",
      min: 10,
      max: 30,
      constraint: (params) => {
        // Ensure b < a (positive result)
        const a = params.a as number;
        const b = params.b as number;
        return b < a;
      },
    },
  },
  generate: (params, _locale) => {
    const a = params.a as number;
    const b = params.b as number;
    const answer = a - b;

    return {
      questionText: `{{a}} - {{b}} = ?`,
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
    (_params, locale) => {
      const a = params.a as number;
      const b = params.b as number;
      const aOnes = a % 10;
      const bOnes = b % 10;
      const needsBorrowing = aOnes < bOnes;

      if (locale === "da-DK") {
        if (needsBorrowing) {
          return "Du skal låne en tier for at trække entalene fra. Husk at reducere tierne med 1.";
        }
        return "Træk entalene fra først, så titalene.";
      }
      if (needsBorrowing) {
        return "You need to borrow a ten to subtract the ones. Remember to reduce the tens by 1.";
      }
      return "Subtract the ones first, then the tens.";
    },
    // Level 2: Specific technique
    (_params, locale) => {
      const a = params.a as number;
      const b = params.b as number;
      const aTens = Math.floor(a / 10);
      const aOnes = a % 10;
      const bTens = Math.floor(b / 10);
      const bOnes = b % 10;
      const needsBorrowing = aOnes < bOnes;

      if (locale === "da-DK") {
        if (needsBorrowing) {
          return `${a} = ${aTens} tiere + ${aOnes} enere. Lån 1 tier: ${aTens - 1} tiere + ${aOnes + 10} enere. Nu træk ${b} fra.`;
        }
        return `Ental: ${aOnes} - ${bOnes}. Tital: ${aTens} - ${bTens}.`;
      }
      if (needsBorrowing) {
        return `${a} = ${aTens} tens + ${aOnes} ones. Borrow 1 ten: ${aTens - 1} tens + ${aOnes + 10} ones. Now subtract ${b}.`;
      }
      return `Ones: ${aOnes} - ${bOnes}. Tens: ${aTens} - ${bTens}.`;
    },
    // Level 3: Partial solution with intermediate steps
    (_params, locale) => {
      const a = params.a as number;
      const b = params.b as number;
      const aTens = Math.floor(a / 10);
      const aOnes = a % 10;
      const bTens = Math.floor(b / 10);
      const bOnes = b % 10;
      const needsBorrowing = aOnes < bOnes;

      if (locale === "da-DK") {
        if (needsBorrowing) {
          const newTens = aTens - 1;
          const newOnes = aOnes + 10;
          const resultOnes = newOnes - bOnes;
          const resultTens = newTens - bTens;
          return `Lån 1 tier: ${a} = ${newTens} tiere + ${newOnes} enere\nEntal: ${newOnes} - ${bOnes} = ${resultOnes}\nTital: ${newTens} - ${bTens} = ${resultTens}\nSvar: ${resultTens} tiere + ${resultOnes} enere`;
        }
        const resultOnes = aOnes - bOnes;
        const resultTens = aTens - bTens;
        return `Ental: ${aOnes} - ${bOnes} = ${resultOnes}\nTital: ${aTens} - ${bTens} = ${resultTens}\nSvar: ${resultTens} tiere + ${resultOnes} enere`;
      }
      if (needsBorrowing) {
        const newTens = aTens - 1;
        const newOnes = aOnes + 10;
        const resultOnes = newOnes - bOnes;
        const resultTens = newTens - bTens;
        return `Borrow 1 ten: ${a} = ${newTens} tens + ${newOnes} ones\nOnes: ${newOnes} - ${bOnes} = ${resultOnes}\nTens: ${newTens} - ${bTens} = ${resultTens}\nAnswer: ${resultTens} tens + ${resultOnes} ones`;
      }
      const resultOnes = aOnes - bOnes;
      const resultTens = aTens - bTens;
      return `Ones: ${aOnes} - ${bOnes} = ${resultOnes}\nTens: ${aTens} - ${bTens} = ${resultTens}\nAnswer: ${resultTens} tens + ${resultOnes} ones`;
    },
    // Level 4: Complete solution
    (_params, locale) => {
      const a = params.a as number;
      const b = params.b as number;
      const answer = a - b;
      if (locale === "da-DK") {
        return `${a} - ${b} = ${answer}`;
      }
      return `${a} - ${b} = ${answer}`;
    },
  ],
  contextType: "abstract",
};

// Export all subtraction templates
export const subtractionTemplates = [subtractionA, subtractionB, subtractionC];
