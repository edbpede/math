/**
 * Fraction Equivalence Exercise Templates
 *
 * Templates for identifying and creating equivalent fractions,
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

import type { ExerciseTemplate } from "../../types";
import { validateAnswer } from "../../validator";

/**
 * Fraction Equivalence Template - Difficulty A (Introductory)
 *
 * Simple equivalent fractions (1/2 = 2/4, 2/3 = 4/6, 1/3 = 2/6)
 * For students beginning to understand fraction equivalence
 */
export const fractionEquivalenceA: ExerciseTemplate = {
    id: "tal-algebra-fraction-equivalence-4-6-A",
    name: "Simple Equivalent Fractions",
    metadata: {
        competencyAreaId: "tal-og-algebra",
        skillsAreaId: "broker-og-procent",
        gradeRange: "4-6",
        difficulty: "A",
        isBinding: true,
        tags: ["fractions", "equivalence", "multiplication", "basic"],
    },
    parameters: {
        originalDenominator: {
            type: "integer",
            min: 2,
            max: 5,
        },
        originalNumerator: {
            type: "integer",
            min: 1,
            max: 4,
            constraint: (params) => {
                const num = params.originalNumerator as number;
                const den = params.originalDenominator as number;
                // Ensure proper fraction
                return num < den;
            },
        },
        multiplier: {
            type: "integer",
            min: 2,
            max: 4,
        },
    },
    generate: (params, _locale) => {
        const originalNumerator = params.originalNumerator as number;
        const originalDenominator = params.originalDenominator as number;
        const multiplier = params.multiplier as number;

        const newNumerator = originalNumerator * multiplier;
        const newDenominator = originalDenominator * multiplier;

        const question =
            _locale === "da-DK"
                ? `Hvilken brøk er ækvivalent med ${originalNumerator}/${originalDenominator}?\n\nGang både tæller og nævner med ${multiplier}.`
                : `Which fraction is equivalent to ${originalNumerator}/${originalDenominator}?\n\nMultiply both numerator and denominator by ${multiplier}.`;

        return {
            questionText: question,
            correctAnswer: {
                value: `${newNumerator}/${newDenominator}`,
                equivalents: [
                    newNumerator / newDenominator,
                    `${originalNumerator}/${originalDenominator}`,
                ],
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
                return "Ækvivalente brøker har samme værdi, men forskellige tæller og nævner. Gang både tæller og nævner med samme tal.";
            }
            return "Equivalent fractions have the same value but different numerators and denominators. Multiply both numerator and denominator by the same number.";
        },
        // Level 2: Specific technique
        (params, locale) => {
            const originalNumerator = params.originalNumerator as number;
            const originalDenominator = params.originalDenominator as number;
            const multiplier = params.multiplier as number;
            if (locale === "da-DK") {
                return `Gang tælleren: ${originalNumerator} × ${multiplier}\nGang nævneren: ${originalDenominator} × ${multiplier}`;
            }
            return `Multiply the numerator: ${originalNumerator} × ${multiplier}\nMultiply the denominator: ${originalDenominator} × ${multiplier}`;
        },
        // Level 3: Partial solution
        (params, locale) => {
            const originalNumerator = params.originalNumerator as number;
            const originalDenominator = params.originalDenominator as number;
            const multiplier = params.multiplier as number;
            const newNumerator = originalNumerator * multiplier;
            const newDenominator = originalDenominator * multiplier;

            if (locale === "da-DK") {
                return `Ny tæller: ${originalNumerator} × ${multiplier} = ${newNumerator}\nNy nævner: ${originalDenominator} × ${multiplier} = ${newDenominator}\nSå ${originalNumerator}/${originalDenominator} = ${newNumerator}/${newDenominator}`;
            }
            return `New numerator: ${originalNumerator} × ${multiplier} = ${newNumerator}\nNew denominator: ${originalDenominator} × ${multiplier} = ${newDenominator}\nSo ${originalNumerator}/${originalDenominator} = ${newNumerator}/${newDenominator}`;
        },
        // Level 4: Complete solution
        (params, locale) => {
            const originalNumerator = params.originalNumerator as number;
            const originalDenominator = params.originalDenominator as number;
            const multiplier = params.multiplier as number;
            const newNumerator = originalNumerator * multiplier;
            const newDenominator = originalDenominator * multiplier;

            if (locale === "da-DK") {
                return `Svaret er ${newNumerator}/${newDenominator}`;
            }
            return `The answer is ${newNumerator}/${newDenominator}`;
        },
    ],
    contextType: "abstract",
};

/**
 * Fraction Equivalence Template - Difficulty B (Developing)
 *
 * Finding missing numerator or denominator in equivalent fractions
 * For students developing proportional reasoning
 */
export const fractionEquivalenceB: ExerciseTemplate = {
    id: "tal-algebra-fraction-equivalence-4-6-B",
    name: "Finding Missing Values in Equivalent Fractions",
    metadata: {
        competencyAreaId: "tal-og-algebra",
        skillsAreaId: "broker-og-procent",
        gradeRange: "4-6",
        difficulty: "B",
        isBinding: true,
        tags: [
            "fractions",
            "equivalence",
            "proportional-reasoning",
            "problem-solving",
        ],
    },
    parameters: {
        baseDenominator: {
            type: "integer",
            min: 2,
            max: 6,
        },
        baseNumerator: {
            type: "integer",
            min: 1,
            max: 5,
            constraint: (params) => {
                const num = params.baseNumerator as number;
                const den = params.baseDenominator as number;
                return num < den;
            },
        },
        multiplier: {
            type: "integer",
            min: 2,
            max: 5,
        },
        findNumerator: {
            type: "integer",
            options: [0, 1], // 0 = find denominator, 1 = find numerator
        },
    },
    generate: (params, _locale) => {
        const baseNumerator = params.baseNumerator as number;
        const baseDenominator = params.baseDenominator as number;
        const multiplier = params.multiplier as number;
        const findNumerator = params.findNumerator as number;

        const targetNumerator = baseNumerator * multiplier;
        const targetDenominator = baseDenominator * multiplier;

        let question: string;
        let answer: number;

        if (findNumerator === 1) {
            // Find numerator
            question =
                _locale === "da-DK"
                    ? `${baseNumerator}/${baseDenominator} = ?/${targetDenominator}\n\nFind den manglende tæller.`
                    : `${baseNumerator}/${baseDenominator} = ?/${targetDenominator}\n\nFind the missing numerator.`;
            answer = targetNumerator;
        } else {
            // Find denominator
            question =
                _locale === "da-DK"
                    ? `${baseNumerator}/${baseDenominator} = ${targetNumerator}/?̊\n\nFind den manglende nævner.`
                    : `${baseNumerator}/${baseDenominator} = ${targetNumerator}/?\n\nFind the missing denominator.`;
            answer = targetDenominator;
        }

        return {
            questionText: question,
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
            const findNumerator = params.findNumerator as number;
            if (locale === "da-DK") {
                if (findNumerator === 1) {
                    return "Find ud af hvilket tal nævneren er ganget med, og gang derefter tælleren med samme tal.";
                }
                return "Find ud af hvilket tal tælleren er ganget med, og gang derefter nævneren med samme tal.";
            }
            if (findNumerator === 1) {
                return "Figure out what number the denominator was multiplied by, then multiply the numerator by the same number.";
            }
            return "Figure out what number the numerator was multiplied by, then multiply the denominator by the same number.";
        },
        // Level 2: Specific technique
        (params, locale) => {
            const baseNumerator = params.baseNumerator as number;
            const baseDenominator = params.baseDenominator as number;
            const multiplier = params.multiplier as number;
            const findNumerator = params.findNumerator as number;
            const targetNumerator = baseNumerator * multiplier;
            const targetDenominator = baseDenominator * multiplier;

            if (locale === "da-DK") {
                if (findNumerator === 1) {
                    return `Nævneren ændrede sig fra ${baseDenominator} til ${targetDenominator}. Hvilket tal blev den ganget med?`;
                }
                return `Tælleren ændrede sig fra ${baseNumerator} til ${targetNumerator}. Hvilket tal blev den ganget med?`;
            }
            if (findNumerator === 1) {
                return `The denominator changed from ${baseDenominator} to ${targetDenominator}. What number was it multiplied by?`;
            }
            return `The numerator changed from ${baseNumerator} to ${targetNumerator}. What number was it multiplied by?`;
        },
        // Level 3: Partial solution
        (params, locale) => {
            const baseNumerator = params.baseNumerator as number;
            const baseDenominator = params.baseDenominator as number;
            const multiplier = params.multiplier as number;
            const findNumerator = params.findNumerator as number;
            const targetNumerator = baseNumerator * multiplier;
            const targetDenominator = baseDenominator * multiplier;

            if (locale === "da-DK") {
                if (findNumerator === 1) {
                    return `${baseDenominator} × ${multiplier} = ${targetDenominator}\nSå tælleren skal også ganges med ${multiplier}:\n${baseNumerator} × ${multiplier} = ?`;
                }
                return `${baseNumerator} × ${multiplier} = ${targetNumerator}\nSå nævneren skal også ganges med ${multiplier}:\n${baseDenominator} × ${multiplier} = ?`;
            }
            if (findNumerator === 1) {
                return `${baseDenominator} × ${multiplier} = ${targetDenominator}\nSo the numerator must also be multiplied by ${multiplier}:\n${baseNumerator} × ${multiplier} = ?`;
            }
            return `${baseNumerator} × ${multiplier} = ${targetNumerator}\nSo the denominator must also be multiplied by ${multiplier}:\n${baseDenominator} × ${multiplier} = ?`;
        },
        // Level 4: Complete solution
        (params, locale) => {
            const baseNumerator = params.baseNumerator as number;
            const multiplier = params.multiplier as number;
            const findNumerator = params.findNumerator as number;
            const targetNumerator = baseNumerator * multiplier;
            const baseDenominator = params.baseDenominator as number;
            const targetDenominator = baseDenominator * multiplier;

            if (locale === "da-DK") {
                return `Svaret er ${findNumerator === 1 ? targetNumerator : targetDenominator}`;
            }
            return `The answer is ${findNumerator === 1 ? targetNumerator : targetDenominator}`;
        },
    ],
    contextType: "abstract",
};

/**
 * Fraction Equivalence Template - Difficulty C (Advanced)
 *
 * Simplifying fractions to lowest terms
 * For students ready to apply GCD concepts
 */
export const fractionEquivalenceC: ExerciseTemplate = {
    id: "tal-algebra-fraction-equivalence-4-6-C",
    name: "Simplifying Fractions to Lowest Terms",
    metadata: {
        competencyAreaId: "tal-og-algebra",
        skillsAreaId: "broker-og-procent",
        gradeRange: "4-6",
        difficulty: "C",
        isBinding: true,
        tags: [
            "fractions",
            "simplification",
            "greatest-common-divisor",
            "advanced",
        ],
    },
    parameters: {
        simplifiedDenominator: {
            type: "integer",
            min: 2,
            max: 8,
        },
        simplifiedNumerator: {
            type: "integer",
            min: 1,
            max: 7,
            constraint: (params) => {
                const num = params.simplifiedNumerator as number;
                const den = params.simplifiedDenominator as number;
                return num < den;
            },
        },
        commonFactor: {
            type: "integer",
            min: 2,
            max: 6,
        },
    },
    generate: (params, _locale) => {
        const simplifiedNumerator = params.simplifiedNumerator as number;
        const simplifiedDenominator = params.simplifiedDenominator as number;
        const commonFactor = params.commonFactor as number;

        const unsimplifiedNumerator = simplifiedNumerator * commonFactor;
        const unsimplifiedDenominator = simplifiedDenominator * commonFactor;

        const question =
            _locale === "da-DK"
                ? `Forkort brøken ${unsimplifiedNumerator}/${unsimplifiedDenominator} så meget som muligt.\n\n(Skriv brøken i laveste termer)`
                : `Simplify the fraction ${unsimplifiedNumerator}/${unsimplifiedDenominator} as much as possible.\n\n(Write the fraction in lowest terms)`;

        return {
            questionText: question,
            correctAnswer: {
                value: `${simplifiedNumerator}/${simplifiedDenominator}`,
                equivalents: [
                    simplifiedNumerator / simplifiedDenominator,
                    `${unsimplifiedNumerator}/${unsimplifiedDenominator}`,
                ],
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
                return "For at forkorte en brøk skal du finde det største tal, der kan dele både tæller og nævner. Divider derefter begge med dette tal.";
            }
            return "To simplify a fraction, find the greatest number that can divide both the numerator and denominator. Then divide both by this number.";
        },
        // Level 2: Specific technique
        (params, locale) => {
            const simplifiedNumerator = params.simplifiedNumerator as number;
            const simplifiedDenominator =
                params.simplifiedDenominator as number;
            const commonFactor = params.commonFactor as number;
            const unsimplifiedNumerator = simplifiedNumerator * commonFactor;
            const unsimplifiedDenominator =
                simplifiedDenominator * commonFactor;

            if (locale === "da-DK") {
                return `Find fælles faktorer for ${unsimplifiedNumerator} og ${unsimplifiedDenominator}. Prøv med små tal som 2, 3, 4, 5, 6...`;
            }
            return `Find common factors of ${unsimplifiedNumerator} and ${unsimplifiedDenominator}. Try small numbers like 2, 3, 4, 5, 6...`;
        },
        // Level 3: Partial solution
        (params, locale) => {
            const simplifiedNumerator = params.simplifiedNumerator as number;
            const simplifiedDenominator =
                params.simplifiedDenominator as number;
            const commonFactor = params.commonFactor as number;
            const unsimplifiedNumerator = simplifiedNumerator * commonFactor;
            const unsimplifiedDenominator =
                simplifiedDenominator * commonFactor;

            if (locale === "da-DK") {
                return `Både ${unsimplifiedNumerator} og ${unsimplifiedDenominator} kan deles med ${commonFactor}:\n${unsimplifiedNumerator} ÷ ${commonFactor} = ${simplifiedNumerator}\n${unsimplifiedDenominator} ÷ ${commonFactor} = ${simplifiedDenominator}`;
            }
            return `Both ${unsimplifiedNumerator} and ${unsimplifiedDenominator} can be divided by ${commonFactor}:\n${unsimplifiedNumerator} ÷ ${commonFactor} = ${simplifiedNumerator}\n${unsimplifiedDenominator} ÷ ${commonFactor} = ${simplifiedDenominator}`;
        },
        // Level 4: Complete solution
        (params, locale) => {
            const simplifiedNumerator = params.simplifiedNumerator as number;
            const simplifiedDenominator =
                params.simplifiedDenominator as number;

            if (locale === "da-DK") {
                return `Svaret er ${simplifiedNumerator}/${simplifiedDenominator}`;
            }
            return `The answer is ${simplifiedNumerator}/${simplifiedDenominator}`;
        },
    ],
    contextType: "abstract",
};

// Export all fraction equivalence templates
export const fractionEquivalenceTemplates = [
    fractionEquivalenceA,
    fractionEquivalenceB,
    fractionEquivalenceC,
];
