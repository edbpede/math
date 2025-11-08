/**
 * Math-to-Speech Converter
 *
 * Converts parsed mathematical expressions into spoken text for screen readers.
 * Provides internationalized spoken representations of mathematical concepts.
 *
 * Requirements:
 * - 9.4: Screen reader support for mathematical expressions
 * - 2.1: Multi-language support (Danish and English)
 *
 * @example
 * ```typescript
 * import { mathToSpeech } from '@/lib/accessibility/math-to-speech'
 *
 * const expr = parseMathExpression('1/2')
 * const speech = mathToSpeech(expr, translations)
 * // Returns: "one half"
 * ```
 */

import type {
  MathExpression,
  NumberExpression,
  FractionExpression,
  OperationExpression,
  EquationExpression,
} from './math-parser'

/**
 * Translation function type
 */
type TranslationFunction = (key: string, params?: Record<string, string>) => string

/**
 * Convert a number to speech
 */
function numberToSpeech(expr: NumberExpression): string {
  // For simple numbers, just return the string representation
  // Screen readers will handle pronunciation
  return expr.value.toString()
}

/**
 * Convert a fraction to speech
 */
function fractionToSpeech(expr: FractionExpression, t: TranslationFunction): string {
  const { numerator, denominator } = expr

  // Check for common fractions with special names
  if (numerator === 1 && denominator === 2) {
    return t('accessibility.math.fractions.oneHalf')
  }
  if (numerator === 1 && denominator === 3) {
    return t('accessibility.math.fractions.oneThird')
  }
  if (numerator === 1 && denominator === 4) {
    return t('accessibility.math.fractions.oneQuarter')
  }
  if (numerator === 2 && denominator === 3) {
    return t('accessibility.math.fractions.twoThirds')
  }
  if (numerator === 3 && denominator === 4) {
    return t('accessibility.math.fractions.threeQuarters')
  }

  // Generic fraction
  return t('accessibility.math.fractions.generic', {
    numerator: numerator.toString(),
    denominator: denominator.toString(),
  })
}

/**
 * Get spoken form of an operator
 */
function operatorToSpeech(operator: string, t: TranslationFunction): string {
  switch (operator) {
    case '+':
      return t('accessibility.math.operations.plus')
    case '-':
      return t('accessibility.math.operations.minus')
    case '×':
    case '*':
      return t('accessibility.math.operations.times')
    case '÷':
    case '/':
      return t('accessibility.math.operations.dividedBy')
    default:
      return operator
  }
}

/**
 * Convert an operation to speech
 */
function operationToSpeech(expr: OperationExpression, t: TranslationFunction): string {
  const left = mathToSpeech(expr.left, t)
  const operator = operatorToSpeech(expr.operator, t)
  const right = mathToSpeech(expr.right, t)

  return `${left} ${operator} ${right}`
}

/**
 * Convert an equation to speech
 */
function equationToSpeech(expr: EquationExpression, t: TranslationFunction): string {
  const left = mathToSpeech(expr.left, t)
  const equals = t('accessibility.math.operations.equals')
  const right = mathToSpeech(expr.right, t)

  return `${left} ${equals} ${right}`
}

/**
 * Convert a mathematical expression to spoken text
 *
 * @param expr - The parsed math expression
 * @param t - Translation function
 * @returns Spoken representation of the expression
 */
export function mathToSpeech(expr: MathExpression, t: TranslationFunction): string {
  switch (expr.type) {
    case 'number':
      return numberToSpeech(expr)
    case 'fraction':
      return fractionToSpeech(expr, t)
    case 'operation':
      return operationToSpeech(expr, t)
    case 'equation':
      return equationToSpeech(expr, t)
    case 'text':
      // For text, just return as-is (screen reader will read it normally)
      return expr.text
    default:
      return expr.originalText
  }
}

/**
 * Convert mathematical text to speech
 *
 * Convenience function that parses and converts in one step.
 *
 * @param text - Mathematical expression as text
 * @param t - Translation function
 * @returns Spoken representation
 */
export function textToMathSpeech(text: string, t: TranslationFunction): string {
  // Import parseMathExpression dynamically to avoid circular dependency
  const { parseMathExpression } = require('./math-parser')
  const expr = parseMathExpression(text)
  return mathToSpeech(expr, t)
}
