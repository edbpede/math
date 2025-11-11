/**
 * Number Comparison Exercise Templates
 *
 * Templates for number comparison exercises aligned with Danish Fælles Mål curriculum
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

import type { ExerciseTemplate, ValidationResult, Answer } from "../../types";

/**
 * Custom validation for comparison operators
 * Handles string comparison operators and their word equivalents
 */
function validateComparisonAnswer(
    userAnswer: string,
    correctAnswer: Answer,
): ValidationResult {
    const normalized = userAnswer.trim().toLowerCase();
    const correctValue = String(correctAnswer.value).trim();

    // Check direct match
    if (
        normalized === correctValue ||
        normalized === correctValue.toLowerCase()
    ) {
        return { correct: true, normalized };
    }

    // Check equivalents
    if (correctAnswer.equivalents) {
        for (const equivalent of correctAnswer.equivalents) {
            const eq = String(equivalent).toLowerCase();
            if (normalized === eq) {
                return { correct: true, normalized };
            }
        }
    }

    return { correct: false, normalized };
}

/**
 * Number Comparison Template - Difficulty A (Introductory)
 *
 * Compare two numbers in range 0-20 using >, <, or =
 * For early learners beginning to understand number magnitude
 */
export const numberComparisonA: ExerciseTemplate = {
    id: "tal-algebra-comparison-0-3-A",
    name: "Number Comparison (Basic)",
    metadata: {
        competencyAreaId: "tal-og-algebra",
        skillsAreaId: "tal",
        gradeRange: "0-3",
        difficulty: "A",
        isBinding: true,
        tags: ["comparison", "number-sense", "magnitude", "basic"],
    },
    parameters: {
        a: {
            type: "integer",
            min: 0,
            max: 20,
        },
        b: {
            type: "integer",
            min: 0,
            max: 20,
        },
    },
    generate: (params, locale) => {
        const a = params.a as number;
        const b = params.b as number;

        let answer: string;
        let answerValue: string;
        if (a > b) {
            answer = ">";
            answerValue = ">";
        } else if (a < b) {
            answer = "<";
            answerValue = "<";
        } else {
            answer = "=";
            answerValue = "=";
        }

        const questionText =
            locale === "da-DK"
                ? `{{a}} ___ {{b}}\n\nIndsæt >, < eller =`
                : `{{a}} ___ {{b}}\n\nInsert >, < or =`;

        return {
            questionText,
            correctAnswer: {
                value: answerValue,
                equivalents:
                    locale === "da-DK"
                        ? answer === ">"
                            ? [">", "større end", "større", "gt"]
                            : answer === "<"
                              ? ["<", "mindre end", "mindre", "lt"]
                              : ["=", "lig med", "lige", "eq"]
                        : answer === ">"
                          ? [">", "greater than", "greater", "gt"]
                          : answer === "<"
                            ? ["<", "less than", "less", "lt"]
                            : ["=", "equal to", "equal", "equals", "eq"],
            },
        };
    },
    validate: (userAnswer, correctAnswer) => {
        return validateComparisonAnswer(userAnswer, correctAnswer);
    },
    hints: [
        // Level 1: General strategy
        (_params, locale) => {
            if (locale === "da-DK") {
                return 'Tænk på hvilken pile der peger mod det mindste tal. Det store tal "spiser" det lille tal.';
            }
            return 'Think about which arrow points to the smaller number. The big number "eats" the small number.';
        },
        // Level 2: Specific technique
        (params, locale) => {
            const a = params.a as number;
            const b = params.b as number;
            if (locale === "da-DK") {
                if (a === b) {
                    return `${a} og ${b} er det samme tal, så de er lige store.`;
                } else if (a > b) {
                    return `${a} er større end ${b}. Tænk på at tælle: hvilken kommer senere når du tæller?`;
                } else {
                    return `${a} er mindre end ${b}. Tænk på at tælle: hvilken kommer først når du tæller?`;
                }
            }
            if (a === b) {
                return `${a} and ${b} are the same number, so they are equal.`;
            } else if (a > b) {
                return `${a} is greater than ${b}. Think about counting: which comes later when you count?`;
            } else {
                return `${a} is less than ${b}. Think about counting: which comes first when you count?`;
            }
        },
        // Level 3: Partial solution with intermediate steps
        (params, locale) => {
            const a = params.a as number;
            const b = params.b as number;
            if (locale === "da-DK") {
                if (a === b) {
                    return `${a} = ${b} fordi begge tal er ens.`;
                } else if (a > b) {
                    return `Når du tæller ${b}, ${b + 1}, ..., ${a}, kommer ${a} efter ${b}.\nDerfor er ${a} > ${b}`;
                } else {
                    return `Når du tæller ${a}, ${a + 1}, ..., ${b}, kommer ${a} før ${b}.\nDerfor er ${a} < ${b}`;
                }
            }
            if (a === b) {
                return `${a} = ${b} because both numbers are the same.`;
            } else if (a > b) {
                return `When you count ${b}, ${b + 1}, ..., ${a}, ${a} comes after ${b}.\nTherefore ${a} > ${b}`;
            } else {
                return `When you count ${a}, ${a + 1}, ..., ${b}, ${a} comes before ${b}.\nTherefore ${a} < ${b}`;
            }
        },
        // Level 4: Complete solution
        (params, _locale) => {
            const a = params.a as number;
            const b = params.b as number;
            if (a > b) {
                return `${a} > ${b}`;
            } else if (a < b) {
                return `${a} < ${b}`;
            } else {
                return `${a} = ${b}`;
            }
        },
    ],
    contextType: "abstract",
};

/**
 * Number Comparison Template - Difficulty B (Developing)
 *
 * Compare two numbers in range 0-100 using >, <, or =
 * For students developing understanding of larger numbers
 */
export const numberComparisonB: ExerciseTemplate = {
    id: "tal-algebra-comparison-0-3-B",
    name: "Number Comparison (Developing)",
    metadata: {
        competencyAreaId: "tal-og-algebra",
        skillsAreaId: "tal",
        gradeRange: "0-3",
        difficulty: "B",
        isBinding: true,
        tags: ["comparison", "number-sense", "magnitude", "two-digit"],
    },
    parameters: {
        a: {
            type: "integer",
            min: 0,
            max: 100,
        },
        b: {
            type: "integer",
            min: 0,
            max: 100,
        },
    },
    generate: (params, locale) => {
        const a = params.a as number;
        const b = params.b as number;

        let answer: string;
        let answerValue: string;
        if (a > b) {
            answer = ">";
            answerValue = ">";
        } else if (a < b) {
            answer = "<";
            answerValue = "<";
        } else {
            answer = "=";
            answerValue = "=";
        }

        const questionText =
            locale === "da-DK"
                ? `{{a}} ___ {{b}}\n\nIndsæt >, < eller =`
                : `{{a}} ___ {{b}}\n\nInsert >, < or =`;

        return {
            questionText,
            correctAnswer: {
                value: answerValue,
                equivalents:
                    locale === "da-DK"
                        ? answer === ">"
                            ? [">", "større end", "større", "gt"]
                            : answer === "<"
                              ? ["<", "mindre end", "mindre", "lt"]
                              : ["=", "lig med", "lige", "eq"]
                        : answer === ">"
                          ? [">", "greater than", "greater", "gt"]
                          : answer === "<"
                            ? ["<", "less than", "less", "lt"]
                            : ["=", "equal to", "equal", "equals", "eq"],
            },
        };
    },
    validate: (userAnswer, correctAnswer) => {
        return validateComparisonAnswer(userAnswer, correctAnswer);
    },
    hints: [
        // Level 1: General strategy
        (_params, _locale) => {
            if (_locale === "da-DK") {
                return "Sammenlign tallene ved at se på titalværdien først, derefter entalværdien.";
            }
            return "Compare the numbers by looking at the tens value first, then the ones value.";
        },
        // Level 2: Specific technique
        (params, locale) => {
            const a = params.a as number;
            const b = params.b as number;
            const aTens = Math.floor(a / 10);
            const bTens = Math.floor(b / 10);
            const aOnes = a % 10;
            const bOnes = b % 10;

            if (locale === "da-DK") {
                if (a === b) {
                    return `${a} og ${b} er det samme tal.`;
                } else if (aTens !== bTens) {
                    return `${a} har ${aTens} tiere, ${b} har ${bTens} tiere. Sammenlign tierne først.`;
                } else {
                    return `Begge tal har ${aTens} tiere. Nu skal du sammenligne enerne: ${aOnes} og ${bOnes}.`;
                }
            }
            if (a === b) {
                return `${a} and ${b} are the same number.`;
            } else if (aTens !== bTens) {
                return `${a} has ${aTens} tens, ${b} has ${bTens} tens. Compare the tens first.`;
            } else {
                return `Both numbers have ${aTens} tens. Now compare the ones: ${aOnes} and ${bOnes}.`;
            }
        },
        // Level 3: Partial solution with intermediate steps
        (params, locale) => {
            const a = params.a as number;
            const b = params.b as number;
            const aTens = Math.floor(a / 10);
            const bTens = Math.floor(b / 10);
            const aOnes = a % 10;
            const bOnes = b % 10;

            if (locale === "da-DK") {
                if (a === b) {
                    return `${a} = ${b}`;
                } else if (aTens !== bTens) {
                    const comparison = aTens > bTens ? ">" : "<";
                    return `Tiere: ${aTens} ${comparison} ${bTens}\nDerfor: ${a} ${comparison} ${b}`;
                } else {
                    const comparison = aOnes > bOnes ? ">" : "<";
                    return `Tiere er ens (${aTens}), så sammenlign enere:\n${aOnes} ${comparison} ${bOnes}\nDerfor: ${a} ${comparison} ${b}`;
                }
            }
            if (a === b) {
                return `${a} = ${b}`;
            } else if (aTens !== bTens) {
                const comparison = aTens > bTens ? ">" : "<";
                return `Tens: ${aTens} ${comparison} ${bTens}\nTherefore: ${a} ${comparison} ${b}`;
            } else {
                const comparison = aOnes > bOnes ? ">" : "<";
                return `Tens are equal (${aTens}), so compare ones:\n${aOnes} ${comparison} ${bOnes}\nTherefore: ${a} ${comparison} ${b}`;
            }
        },
        // Level 4: Complete solution
        (params, _locale) => {
            const a = params.a as number;
            const b = params.b as number;
            if (a > b) {
                return `${a} > ${b}`;
            } else if (a < b) {
                return `${a} < ${b}`;
            } else {
                return `${a} = ${b}`;
            }
        },
    ],
    contextType: "abstract",
};

/**
 * Number Comparison Template - Difficulty C (Advanced)
 *
 * Compare two numbers in range 0-1000 using >, <, or =
 * For students ready to work with three-digit numbers
 */
export const numberComparisonC: ExerciseTemplate = {
    id: "tal-algebra-comparison-0-3-C",
    name: "Number Comparison (Advanced)",
    metadata: {
        competencyAreaId: "tal-og-algebra",
        skillsAreaId: "tal",
        gradeRange: "0-3",
        difficulty: "C",
        isBinding: true,
        tags: ["comparison", "number-sense", "magnitude", "three-digit"],
    },
    parameters: {
        a: {
            type: "integer",
            min: 0,
            max: 1000,
        },
        b: {
            type: "integer",
            min: 0,
            max: 1000,
        },
    },
    generate: (params, locale) => {
        const a = params.a as number;
        const b = params.b as number;

        let answer: string;
        let answerValue: string;
        if (a > b) {
            answer = ">";
            answerValue = ">";
        } else if (a < b) {
            answer = "<";
            answerValue = "<";
        } else {
            answer = "=";
            answerValue = "=";
        }

        const questionText =
            locale === "da-DK"
                ? `{{a}} ___ {{b}}\n\nIndsæt >, < eller =`
                : `{{a}} ___ {{b}}\n\nInsert >, < or =`;

        return {
            questionText,
            correctAnswer: {
                value: answerValue,
                equivalents:
                    locale === "da-DK"
                        ? answer === ">"
                            ? [">", "større end", "større", "gt"]
                            : answer === "<"
                              ? ["<", "mindre end", "mindre", "lt"]
                              : ["=", "lig med", "lige", "eq"]
                        : answer === ">"
                          ? [">", "greater than", "greater", "gt"]
                          : answer === "<"
                            ? ["<", "less than", "less", "lt"]
                            : ["=", "equal to", "equal", "equals", "eq"],
            },
        };
    },
    validate: (userAnswer, correctAnswer) => {
        return validateComparisonAnswer(userAnswer, correctAnswer);
    },
    hints: [
        // Level 1: General strategy
        (_params, _locale) => {
            if (_locale === "da-DK") {
                return "Sammenlign tallene ved at se på hundrederne først, derefter tierne, og til sidst enerne.";
            }
            return "Compare the numbers by looking at the hundreds first, then the tens, and finally the ones.";
        },
        // Level 2: Specific technique
        (params, locale) => {
            const a = params.a as number;
            const b = params.b as number;
            const aHundreds = Math.floor(a / 100);
            const bHundreds = Math.floor(b / 100);
            const aTens = Math.floor((a % 100) / 10);
            const bTens = Math.floor((b % 100) / 10);

            if (locale === "da-DK") {
                if (a === b) {
                    return `${a} og ${b} er det samme tal.`;
                } else if (aHundreds !== bHundreds) {
                    return `${a} har ${aHundreds} hundreder, ${b} har ${bHundreds} hundreder. Sammenlign hundrederne først.`;
                } else if (aTens !== bTens) {
                    return `Begge har ${aHundreds} hundreder. ${a} har ${aTens} tiere, ${b} har ${bTens} tiere.`;
                } else {
                    return `Begge har ${aHundreds} hundreder og ${aTens} tiere. Sammenlign enerne.`;
                }
            }
            if (a === b) {
                return `${a} and ${b} are the same number.`;
            } else if (aHundreds !== bHundreds) {
                return `${a} has ${aHundreds} hundreds, ${b} has ${bHundreds} hundreds. Compare the hundreds first.`;
            } else if (aTens !== bTens) {
                return `Both have ${aHundreds} hundreds. ${a} has ${aTens} tens, ${b} has ${bTens} tens.`;
            } else {
                return `Both have ${aHundreds} hundreds and ${aTens} tens. Compare the ones.`;
            }
        },
        // Level 3: Partial solution with intermediate steps
        (params, locale) => {
            const a = params.a as number;
            const b = params.b as number;
            const aHundreds = Math.floor(a / 100);
            const bHundreds = Math.floor(b / 100);
            const aTens = Math.floor((a % 100) / 10);
            const bTens = Math.floor((b % 100) / 10);
            const aOnes = a % 10;
            const bOnes = b % 10;

            if (locale === "da-DK") {
                if (a === b) {
                    return `${a} = ${b}`;
                } else if (aHundreds !== bHundreds) {
                    const comparison = aHundreds > bHundreds ? ">" : "<";
                    return `Hundreder: ${aHundreds} ${comparison} ${bHundreds}\nDerfor: ${a} ${comparison} ${b}`;
                } else if (aTens !== bTens) {
                    const comparison = aTens > bTens ? ">" : "<";
                    return `Hundreder er ens (${aHundreds}), sammenlign tiere:\n${aTens} ${comparison} ${bTens}\nDerfor: ${a} ${comparison} ${b}`;
                } else {
                    const comparison = aOnes > bOnes ? ">" : "<";
                    return `Hundreder (${aHundreds}) og tiere (${aTens}) er ens, sammenlign enere:\n${aOnes} ${comparison} ${bOnes}\nDerfor: ${a} ${comparison} ${b}`;
                }
            }
            if (a === b) {
                return `${a} = ${b}`;
            } else if (aHundreds !== bHundreds) {
                const comparison = aHundreds > bHundreds ? ">" : "<";
                return `Hundreds: ${aHundreds} ${comparison} ${bHundreds}\nTherefore: ${a} ${comparison} ${b}`;
            } else if (aTens !== bTens) {
                const comparison = aTens > bTens ? ">" : "<";
                return `Hundreds are equal (${aHundreds}), compare tens:\n${aTens} ${comparison} ${bTens}\nTherefore: ${a} ${comparison} ${b}`;
            } else {
                const comparison = aOnes > bOnes ? ">" : "<";
                return `Hundreds (${aHundreds}) and tens (${aTens}) are equal, compare ones:\n${aOnes} ${comparison} ${bOnes}\nTherefore: ${a} ${comparison} ${b}`;
            }
        },
        // Level 4: Complete solution
        (params, _locale) => {
            const a = params.a as number;
            const b = params.b as number;
            if (a > b) {
                return `${a} > ${b}`;
            } else if (a < b) {
                return `${a} < ${b}`;
            } else {
                return `${a} = ${b}`;
            }
        },
    ],
    contextType: "abstract",
};

// Export all number comparison templates
export const numberComparisonTemplates = [
    numberComparisonA,
    numberComparisonB,
    numberComparisonC,
];
