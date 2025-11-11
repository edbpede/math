/**
 * Addition Exercise Templates
 *
 * Templates for addition exercises aligned with Danish Fælles Mål curriculum
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
import { generateAdditionSolution } from "../../solution-generator";

/**
 * Addition Template - Difficulty A (Introductory)
 *
 * Single digit + single digit, result ≤ 10
 * For early learners just beginning to understand addition
 */
export const additionA: ExerciseTemplate = {
  id: "tal-algebra-addition-0-3-A",
  name: "Single Digit Addition (Basic)",
  metadata: {
    competencyAreaId: "tal-og-algebra",
    skillsAreaId: "regning",
    gradeRange: "0-3",
    difficulty: "A",
    isBinding: true,
    tags: ["addition", "single-digit", "basic-arithmetic", "no-regrouping"],
  },
  parameters: {
    a: {
      type: "integer",
      min: 0,
      max: 9,
    },
    b: {
      type: "integer",
      min: 0,
      max: 9,
      constraint: (params) => {
        // Ensure sum is ≤ 10 for difficulty A
        const a = params.a as number;
        const b = params.b as number;
        return a + b <= 10;
      },
    },
  },
  generate: (params, _locale) => {
    const a = params.a as number;
    const b = params.b as number;
    const answer = a + b;

    return {
      questionText: `{{a}} + {{b}} = ?`,
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
        return "Tænk på at tælle fremad. Du kan bruge dine fingre til at hjælpe.";
      }
      return "Think about counting forward. You can use your fingers to help.";
    },
    // Level 2: Specific technique
    (_params, locale) => {
      const a = params.a as number;
      const b = params.b as number;
      if (locale === "da-DK") {
        return `Start med ${a} og tæl ${b} mere.`;
      }
      return `Start with ${a} and count ${b} more.`;
    },
    // Level 3: Partial solution with intermediate steps
    (_params, locale) => {
      const a = params.a as number;
      const b = params.b as number;
      if (locale === "da-DK") {
        return `Hvis du tæller: ${a}, ${Array.from({ length: b }, (_, i) => a + i + 1).join(", ")}`;
      }
      return `If you count: ${a}, ${Array.from({ length: b }, (_, i) => a + i + 1).join(", ")}`;
    },
    // Level 4: Complete worked solution
    (_params, locale) => {
      const a = params.a as number;
      const b = params.b as number;
      const workedSolution = generateAdditionSolution(
        a,
        b,
        locale as "da-DK" | "en-US",
      );

      if (locale === "da-DK") {
        return {
          text: "Her er den komplette løsning trin for trin:",
          workedSolution,
        };
      }
      return {
        text: "Here is the complete step-by-step solution:",
        workedSolution,
      };
    },
  ],
  contextType: "abstract",
};

/**
 * Addition Template - Difficulty B (Developing)
 *
 * Single digit + single digit (result may be > 10) or double digit + single digit
 * Introduces regrouping/carrying over 10
 */
export const additionB: ExerciseTemplate = {
  id: "tal-algebra-addition-0-3-B",
  name: "Addition with Regrouping",
  metadata: {
    competencyAreaId: "tal-og-algebra",
    skillsAreaId: "regning",
    gradeRange: "0-3",
    difficulty: "B",
    isBinding: true,
    tags: ["addition", "regrouping", "tens", "double-digit"],
  },
  parameters: {
    a: {
      type: "integer",
      min: 5,
      max: 19,
    },
    b: {
      type: "integer",
      min: 1,
      max: 9,
      constraint: (params) => {
        // Ensure result is reasonable for grade level (≤ 20)
        const a = params.a as number;
        const b = params.b as number;
        return a + b <= 20;
      },
    },
  },
  generate: (params, _locale) => {
    const a = params.a as number;
    const b = params.b as number;
    const answer = a + b;

    return {
      questionText: `{{a}} + {{b}} = ?`,
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
      if (locale === "da-DK") {
        if (a >= 10) {
          return "Tænk på ental og tital. Du lægger sammen en del ad gangen.";
        }
        return "Når summen bliver større end 10, tænk på at lave en tier.";
      }
      if (a >= 10) {
        return "Think about ones and tens. You add one part at a time.";
      }
      return "When the sum is larger than 10, think about making a ten.";
    },
    // Level 2: Specific technique
    (_params, locale) => {
      const a = params.a as number;
      const b = params.b as number;
      if (locale === "da-DK") {
        if (a >= 10) {
          const tens = Math.floor(a / 10) * 10;
          const ones = a % 10;
          return `${a} er ${tens} + ${ones}. Læg ${b} til ${ones} først.`;
        }
        const toTen = 10 - a;
        const remaining = b - toTen;
        if (remaining > 0) {
          return `Du kan lave 10 ved at bruge ${toTen} af de ${b}. Der er ${remaining} tilbage.`;
        }
        return `Tænk på hvordan ${a} og ${b} passer sammen.`;
      }
      if (a >= 10) {
        const tens = Math.floor(a / 10) * 10;
        const ones = a % 10;
        return `${a} is ${tens} + ${ones}. Add ${b} to ${ones} first.`;
      }
      const toTen = 10 - a;
      const remaining = b - toTen;
      if (remaining > 0) {
        return `You can make 10 by using ${toTen} of the ${b}. There are ${remaining} left.`;
      }
      return `Think about how ${a} and ${b} fit together.`;
    },
    // Level 3: Partial solution with intermediate steps
    (_params, locale) => {
      const a = params.a as number;
      const b = params.b as number;
      const answer = a + b;
      if (locale === "da-DK") {
        if (a >= 10) {
          const tens = Math.floor(a / 10) * 10;
          const ones = a % 10;
          const newOnes = ones + b;
          if (newOnes >= 10) {
            return `${a} + ${b} = ${tens} + (${ones} + ${b}) = ${tens} + ${newOnes} = ${tens + 10} + ${newOnes - 10} = ${answer}`;
          }
          return `${a} + ${b} = ${tens} + (${ones} + ${b}) = ${tens} + ${newOnes} = ${answer}`;
        }
        const toTen = 10 - a;
        const remaining = b - toTen;
        if (remaining > 0) {
          return `${a} + ${b} = ${a} + ${toTen} + ${remaining} = 10 + ${remaining} = ${answer}`;
        }
        return `${a} + ${b} = ...`;
      }
      if (a >= 10) {
        const tens = Math.floor(a / 10) * 10;
        const ones = a % 10;
        const newOnes = ones + b;
        if (newOnes >= 10) {
          return `${a} + ${b} = ${tens} + (${ones} + ${b}) = ${tens} + ${newOnes} = ${tens + 10} + ${newOnes - 10} = ${answer}`;
        }
        return `${a} + ${b} = ${tens} + (${ones} + ${b}) = ${tens} + ${newOnes} = ${answer}`;
      }
      const toTen = 10 - a;
      const remaining = b - toTen;
      if (remaining > 0) {
        return `${a} + ${b} = ${a} + ${toTen} + ${remaining} = 10 + ${remaining} = ${answer}`;
      }
      return `${a} + ${b} = ...`;
    },
    // Level 4: Complete worked solution
    (_params, locale) => {
      const a = params.a as number;
      const b = params.b as number;
      const workedSolution = generateAdditionSolution(
        a,
        b,
        locale as "da-DK" | "en-US",
      );

      if (locale === "da-DK") {
        return {
          text: "Her er den komplette løsning trin for trin:",
          workedSolution,
        };
      }
      return {
        text: "Here is the complete step-by-step solution:",
        workedSolution,
      };
    },
  ],
  contextType: "abstract",
};

/**
 * Addition Template - Difficulty C (Advanced)
 *
 * Double digit + double digit with regrouping
 * For students ready to work with larger numbers
 */
export const additionC: ExerciseTemplate = {
  id: "tal-algebra-addition-0-3-C",
  name: "Double Digit Addition",
  metadata: {
    competencyAreaId: "tal-og-algebra",
    skillsAreaId: "regning",
    gradeRange: "0-3",
    difficulty: "C",
    isBinding: true,
    tags: ["addition", "double-digit", "regrouping", "advanced"],
  },
  parameters: {
    a: {
      type: "integer",
      min: 10,
      max: 49,
    },
    b: {
      type: "integer",
      min: 10,
      max: 49,
      constraint: (params) => {
        // Ensure result is appropriate for grade level (≤ 99)
        const a = params.a as number;
        const b = params.b as number;
        return a + b <= 99;
      },
    },
  },
  generate: (params, _locale) => {
    const a = params.a as number;
    const b = params.b as number;
    const answer = a + b;

    return {
      questionText: `{{a}} + {{b}} = ?`,
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
        return "Læg ental og tital sammen hver for sig. Husk at samle dem til sidst.";
      }
      return "Add the ones and tens separately. Remember to combine them at the end.";
    },
    // Level 2: Specific technique
    (_params, locale) => {
      const a = params.a as number;
      const b = params.b as number;
      const aTens = Math.floor(a / 10);
      const aOnes = a % 10;
      const bTens = Math.floor(b / 10);
      const bOnes = b % 10;
      if (locale === "da-DK") {
        return `${a} = ${aTens} tiere + ${aOnes} enere. ${b} = ${bTens} tiere + ${bOnes} enere. Læg tiere sammen, så enere sammen.`;
      }
      return `${a} = ${aTens} tens + ${aOnes} ones. ${b} = ${bTens} tens + ${bOnes} ones. Add tens together, then ones together.`;
    },
    // Level 3: Partial solution with intermediate steps
    (_params, locale) => {
      const a = params.a as number;
      const b = params.b as number;
      const aTens = Math.floor(a / 10);
      const aOnes = a % 10;
      const bTens = Math.floor(b / 10);
      const bOnes = b % 10;
      const totalOnes = aOnes + bOnes;
      const totalTens = aTens + bTens;

      if (locale === "da-DK") {
        if (totalOnes >= 10) {
          const carryTens = Math.floor(totalOnes / 10);
          const remainingOnes = totalOnes % 10;
          return `Ental: ${aOnes} + ${bOnes} = ${totalOnes} = ${carryTens} tier + ${remainingOnes} enere\nTital: ${aTens} + ${bTens} + ${carryTens} = ${totalTens + carryTens} tiere\nSvar: ${totalTens + carryTens} tiere + ${remainingOnes} enere`;
        }
        return `Ental: ${aOnes} + ${bOnes} = ${totalOnes}\nTital: ${aTens} + ${bTens} = ${totalTens}\nSvar: ${totalTens} tiere + ${totalOnes} enere`;
      }
      if (totalOnes >= 10) {
        const carryTens = Math.floor(totalOnes / 10);
        const remainingOnes = totalOnes % 10;
        return `Ones: ${aOnes} + ${bOnes} = ${totalOnes} = ${carryTens} ten + ${remainingOnes} ones\nTens: ${aTens} + ${bTens} + ${carryTens} = ${totalTens + carryTens} tens\nAnswer: ${totalTens + carryTens} tens + ${remainingOnes} ones`;
      }
      return `Ones: ${aOnes} + ${bOnes} = ${totalOnes}\nTens: ${aTens} + ${bTens} = ${totalTens}\nAnswer: ${totalTens} tens + ${totalOnes} ones`;
    },
    // Level 4: Complete worked solution
    (_params, locale) => {
      const a = params.a as number;
      const b = params.b as number;
      const workedSolution = generateAdditionSolution(
        a,
        b,
        locale as "da-DK" | "en-US",
      );

      if (locale === "da-DK") {
        return {
          text: "Her er den komplette løsning trin for trin:",
          workedSolution,
        };
      }
      return {
        text: "Here is the complete step-by-step solution:",
        workedSolution,
      };
    },
  ],
  contextType: "abstract",
};

// Export all addition templates
export const additionTemplates = [additionA, additionB, additionC];
