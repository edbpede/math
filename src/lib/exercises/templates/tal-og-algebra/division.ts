/**
 * Division Exercise Templates
 *
 * Templates for division exercises aligned with Danish Fælles Mål curriculum
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
 * Division Template - Difficulty A (Introductory)
 *
 * Simple division by 1, 2, 5, 10 with whole number results
 * For early learners beginning to understand division
 */
export const divisionA: ExerciseTemplate = {
    id: "tal-algebra-division-0-3-A",
    name: "Simple Division",
    metadata: {
        competencyAreaId: "tal-og-algebra",
        skillsAreaId: "regning",
        gradeRange: "0-3",
        difficulty: "A",
        isBinding: true,
        tags: ["division", "basic-division", "whole-numbers"],
    },
    parameters: {
        divisor: {
            type: "integer",
            min: 1,
            max: 10,
            options: [1, 2, 5, 10], // Focus on simple divisors
        },
        quotient: {
            type: "integer",
            min: 1,
            max: 10,
        },
    },
    generate: (params, _locale) => {
        return {
            questionText: `{{dividend}} ÷ {{divisor}} = ?`,
            correctAnswer: {
                value: params.quotient as number,
            },
        };
    },
    validate: (userAnswer, correctAnswer) => {
        return validateAnswer(userAnswer, correctAnswer);
    },
    hints: [
        // Level 1: General strategy
        (params, locale) => {
            const divisor = params.divisor as number;
            const dividend = params.dividend as number;

            if (locale === "da-DK") {
                if (divisor === 1) {
                    return "Når du deler med 1, får du det samme tal tilbage.";
                }
                return `Division spørger: "${divisor} gange hvad er lig ${dividend}?"`;
            }
            if (divisor === 1) {
                return "When you divide by 1, you get the same number back.";
            }
            return `Division asks: "${divisor} times what equals ${dividend}?"`;
        },
        // Level 2: Specific technique
        (params, locale) => {
            const divisor = params.divisor as number;
            const dividend = params.dividend as number;

            if (locale === "da-DK") {
                if (divisor === 2) {
                    return `Tænk på det som halvering: Hvad er halvdelen af ${dividend}?`;
                }
                if (divisor === 10) {
                    return `Deling med 10 fjerner et 0 fra tallet (hvis det er der).`;
                }
                return `Tæl hvor mange ${divisor}'ere der er i ${dividend}.`;
            }
            if (divisor === 2) {
                return `Think of it as halving: What is half of ${dividend}?`;
            }
            if (divisor === 10) {
                return `Dividing by 10 removes a 0 from the number (if there is one).`;
            }
            return `Count how many ${divisor}s are in ${dividend}.`;
        },
        // Level 3: Partial solution with intermediate steps
        (params, locale) => {
            const divisor = params.divisor as number;
            const quotient = params.quotient as number;
            const dividend = params.dividend as number;

            if (locale === "da-DK") {
                if (divisor === 2) {
                    return `${dividend} ÷ 2 = ${dividend / 2} (halvdelen af ${dividend})`;
                }
                // Show counting/grouping
                const groups = Array.from(
                    { length: quotient },
                    (_, i) => divisor * (i + 1),
                );
                return `Tæl i ${divisor}'ere: ${groups.join(", ")}\nDer er ${quotient} grupper af ${divisor} i ${dividend}`;
            }
            if (divisor === 2) {
                return `${dividend} ÷ 2 = ${dividend / 2} (half of ${dividend})`;
            }
            // Show counting/grouping
            const groups = Array.from(
                { length: quotient },
                (_, i) => divisor * (i + 1),
            );
            return `Count by ${divisor}s: ${groups.join(", ")}\nThere are ${quotient} groups of ${divisor} in ${dividend}`;
        },
        // Level 4: Complete solution
        (params, locale) => {
            const divisor = params.divisor as number;
            const quotient = params.quotient as number;
            const dividend = params.dividend as number;

            if (locale === "da-DK") {
                return `${dividend} ÷ ${divisor} = ${quotient}`;
            }
            return `${dividend} ÷ ${divisor} = ${quotient}`;
        },
    ],
    contextType: "abstract",
};

/**
 * Division Template - Difficulty B (Developing)
 *
 * Division with results up to 10, divisors 1-5
 * Builds confidence with division facts
 */
export const divisionB: ExerciseTemplate = {
    id: "tal-algebra-division-0-3-B",
    name: "Division Facts",
    metadata: {
        competencyAreaId: "tal-og-algebra",
        skillsAreaId: "regning",
        gradeRange: "0-3",
        difficulty: "B",
        isBinding: true,
        tags: ["division", "division-facts", "whole-numbers"],
    },
    parameters: {
        divisor: {
            type: "integer",
            min: 2,
            max: 5,
        },
        quotient: {
            type: "integer",
            min: 2,
            max: 10,
        },
    },
    generate: (params, _locale) => {
        const quotient = params.quotient as number;

        return {
            questionText: `{{dividend}} ÷ {{divisor}} = ?`,
            correctAnswer: {
                value: quotient,
            },
        };
    },
    validate: (userAnswer, correctAnswer) => {
        return validateAnswer(userAnswer, correctAnswer);
    },
    hints: [
        // Level 1: General strategy
        (params, locale) => {
            const divisor = params.divisor as number;
            const dividend = params.dividend as number;

            if (locale === "da-DK") {
                return `Tænk på ${divisor}-tabellen bagvendt. ${divisor} gange hvad er lig ${dividend}?`;
            }
            return `Think of the ${divisor} times table backward. ${divisor} times what equals ${dividend}?`;
        },
        // Level 2: Specific technique
        (params, locale) => {
            const divisor = params.divisor as number;
            const dividend = params.dividend as number;

            if (locale === "da-DK") {
                return `Brug gange-fakta: Hvis ${divisor} × ? = ${dividend}, så ${dividend} ÷ ${divisor} = ?`;
            }
            return `Use multiplication facts: If ${divisor} × ? = ${dividend}, then ${dividend} ÷ ${divisor} = ?`;
        },
        // Level 3: Partial solution with intermediate steps
        (params, locale) => {
            const divisor = params.divisor as number;
            const quotient = params.quotient as number;
            const dividend = params.dividend as number;

            if (locale === "da-DK") {
                // Show the multiplication fact
                const steps = [];
                for (let i = 1; i <= quotient; i++) {
                    const product = divisor * i;
                    steps.push(`${divisor} × ${i} = ${product}`);
                    if (product === dividend) {
                        steps.push(`Derfor: ${dividend} ÷ ${divisor} = ${i}`);
                        break;
                    }
                }
                return steps.join("\n");
            }
            // Show the multiplication fact
            const steps = [];
            for (let i = 1; i <= quotient; i++) {
                const product = divisor * i;
                steps.push(`${divisor} × ${i} = ${product}`);
                if (product === dividend) {
                    steps.push(`Therefore: ${dividend} ÷ ${divisor} = ${i}`);
                    break;
                }
            }
            return steps.join("\n");
        },
        // Level 4: Complete solution
        (params, locale) => {
            const divisor = params.divisor as number;
            const quotient = params.quotient as number;
            const dividend = params.dividend as number;

            if (locale === "da-DK") {
                return `${dividend} ÷ ${divisor} = ${quotient}\nFordi ${divisor} × ${quotient} = ${dividend}`;
            }
            return `${dividend} ÷ ${divisor} = ${quotient}\nBecause ${divisor} × ${quotient} = ${dividend}`;
        },
    ],
    contextType: "abstract",
};

/**
 * Division Template - Difficulty C (Advanced)
 *
 * Division with results up to 20, divisors 1-10
 * For students mastering division
 */
export const divisionC: ExerciseTemplate = {
    id: "tal-algebra-division-0-3-C",
    name: "Advanced Division",
    metadata: {
        competencyAreaId: "tal-og-algebra",
        skillsAreaId: "regning",
        gradeRange: "0-3",
        difficulty: "C",
        isBinding: true,
        tags: [
            "division",
            "advanced-division",
            "whole-numbers",
            "times-tables",
        ],
    },
    parameters: {
        divisor: {
            type: "integer",
            min: 2,
            max: 10,
        },
        quotient: {
            type: "integer",
            min: 2,
            max: 12,
        },
    },
    generate: (params, _locale) => {
        return {
            questionText: `{{dividend}} ÷ {{divisor}} = ?`,
            correctAnswer: {
                value: params.quotient as number,
            },
        };
    },
    validate: (userAnswer, correctAnswer) => {
        return validateAnswer(userAnswer, correctAnswer);
    },
    hints: [
        // Level 1: General strategy
        (params, locale) => {
            const divisor = params.divisor as number;
            const dividend = params.dividend as number;

            if (locale === "da-DK") {
                return `Brug din viden om ${divisor}-tabellen. Hvilket tal ganget med ${divisor} giver ${dividend}?`;
            }
            return `Use your knowledge of the ${divisor} times table. What number times ${divisor} gives ${dividend}?`;
        },
        // Level 2: Specific technique
        (params, locale) => {
            const divisor = params.divisor as number;
            const quotient = params.quotient as number;
            const dividend = params.dividend as number;

            if (locale === "da-DK") {
                // Suggest estimation
                const estimate = Math.floor(dividend / divisor / 5) * 5;
                if (estimate > 0 && estimate !== quotient) {
                    return `Estimér først: Er det tættere på ${estimate} eller ${estimate + 5}? Derefter kan du justere.`;
                }
                return `Tænk på multiplikation: ${divisor} × ? = ${dividend}`;
            }
            // Suggest estimation
            const estimate = Math.floor(dividend / divisor / 5) * 5;
            if (estimate > 0 && estimate !== quotient) {
                return `Estimate first: Is it closer to ${estimate} or ${estimate + 5}? Then you can adjust.`;
            }
            return `Think about multiplication: ${divisor} × ? = ${dividend}`;
        },
        // Level 3: Partial solution with intermediate steps
        (params, locale) => {
            const divisor = params.divisor as number;
            const quotient = params.quotient as number;
            const dividend = params.dividend as number;

            if (locale === "da-DK") {
                // Show relevant multiplication facts
                const steps = [];
                const start = Math.max(1, quotient - 2);
                const end = Math.min(12, quotient + 2);

                for (let i = start; i <= end; i++) {
                    const product = divisor * i;
                    if (product === dividend) {
                        steps.push(
                            `${divisor} × ${i} = ${product} ← Dette matcher!`,
                        );
                    } else {
                        steps.push(`${divisor} × ${i} = ${product}`);
                    }
                }
                steps.push(`\nDerfor: ${dividend} ÷ ${divisor} = ${quotient}`);
                return steps.join("\n");
            }
            // Show relevant multiplication facts
            const steps = [];
            const start = Math.max(1, quotient - 2);
            const end = Math.min(12, quotient + 2);

            for (let i = start; i <= end; i++) {
                const product = divisor * i;
                if (product === dividend) {
                    steps.push(
                        `${divisor} × ${i} = ${product} ← This matches!`,
                    );
                } else {
                    steps.push(`${divisor} × ${i} = ${product}`);
                }
            }
            steps.push(`\nTherefore: ${dividend} ÷ ${divisor} = ${quotient}`);
            return steps.join("\n");
        },
        // Level 4: Complete solution
        (params, locale) => {
            const divisor = params.divisor as number;
            const quotient = params.quotient as number;
            const dividend = params.dividend as number;

            if (locale === "da-DK") {
                return `${dividend} ÷ ${divisor} = ${quotient}\n\nTjek: ${divisor} × ${quotient} = ${dividend} ✓`;
            }
            return `${dividend} ÷ ${divisor} = ${quotient}\n\nCheck: ${divisor} × ${quotient} = ${dividend} ✓`;
        },
    ],
    contextType: "abstract",
};

// Export all division templates
export const divisionTemplates = [divisionA, divisionB, divisionC];
