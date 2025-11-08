/**
 * Math Expression Parser
 *
 * Parses mathematical expressions from text strings and converts them into
 * structured data for accessibility purposes (screen readers, MathML, etc.).
 *
 * Supports:
 * - Basic arithmetic operations (+, -, ×, ÷, *, /)
 * - Fractions (1/2, 3/4)
 * - Equations (x + 5 = 10)
 * - Numbers (integers, decimals)
 *
 * Requirements:
 * - 9.4: MathML rendering for mathematical expressions
 * - 9.4: Screen reader support for mathematical content
 *
 * @example
 * ```typescript
 * import { parseMathExpression } from '@/lib/accessibility/math-parser'
 *
 * const expr = parseMathExpression('2 + 3')
 * // Returns: { type: 'operation', left: 2, operator: '+', right: 3 }
 * ```
 */

/**
 * Math expression types
 */
export type MathExpressionType =
  | 'number'
  | 'fraction'
  | 'operation'
  | 'equation'
  | 'text'

/**
 * Base math expression
 */
export interface BaseMathExpression {
  type: MathExpressionType
  originalText: string
}

/**
 * Number expression
 */
export interface NumberExpression extends BaseMathExpression {
  type: 'number'
  value: number
  isDecimal: boolean
}

/**
 * Fraction expression
 */
export interface FractionExpression extends BaseMathExpression {
  type: 'fraction'
  numerator: number
  denominator: number
}

/**
 * Operation expression
 */
export interface OperationExpression extends BaseMathExpression {
  type: 'operation'
  left: MathExpression
  operator: '+' | '-' | '×' | '÷' | '*' | '/'
  right: MathExpression
}

/**
 * Equation expression
 */
export interface EquationExpression extends BaseMathExpression {
  type: 'equation'
  left: MathExpression
  right: MathExpression
}

/**
 * Text (fallback) expression
 */
export interface TextExpression extends BaseMathExpression {
  type: 'text'
  text: string
}

/**
 * Union type for all math expressions
 */
export type MathExpression =
  | NumberExpression
  | FractionExpression
  | OperationExpression
  | EquationExpression
  | TextExpression

/**
 * Check if a string is a valid number
 */
function isNumber(str: string): boolean {
  return /^-?\d+(\.\d+)?$/.test(str.trim())
}

/**
 * Parse a number from a string
 */
function parseNumber(text: string): NumberExpression | null {
  const trimmed = text.trim()
  if (!isNumber(trimmed)) return null

  const value = parseFloat(trimmed)
  const isDecimal = trimmed.includes('.')

  return {
    type: 'number',
    value,
    isDecimal,
    originalText: text,
  }
}

/**
 * Parse a fraction (e.g., "1/2", "3/4")
 */
function parseFraction(text: string): FractionExpression | null {
  const fractionRegex = /^(\d+)\s*\/\s*(\d+)$/
  const match = text.trim().match(fractionRegex)

  if (!match) return null

  const numerator = parseInt(match[1], 10)
  const denominator = parseInt(match[2], 10)

  // Validate denominator is not zero
  if (denominator === 0) return null

  return {
    type: 'fraction',
    numerator,
    denominator,
    originalText: text,
  }
}

/**
 * Parse an operation (e.g., "2 + 3", "10 - 5")
 */
function parseOperation(text: string): OperationExpression | null {
  // Match operations with common symbols
  const operationRegex = /^(.+?)\s*([\+\-×÷\*\/])\s*(.+)$/
  const match = text.trim().match(operationRegex)

  if (!match) return null

  const leftText = match[1]
  const operator = match[2] as '+' | '-' | '×' | '÷' | '*' | '/'
  const rightText = match[3]

  // Recursively parse left and right sides
  const left = parseMathExpression(leftText)
  const right = parseMathExpression(rightText)

  return {
    type: 'operation',
    left,
    operator,
    right,
    originalText: text,
  }
}

/**
 * Parse an equation (e.g., "x + 5 = 10", "2 + 3 = 5")
 */
function parseEquation(text: string): EquationExpression | null {
  const equationRegex = /^(.+?)\s*=\s*(.+)$/
  const match = text.trim().match(equationRegex)

  if (!match) return null

  const leftText = match[1]
  const rightText = match[2]

  // Recursively parse left and right sides
  const left = parseMathExpression(leftText)
  const right = parseMathExpression(rightText)

  return {
    type: 'equation',
    left,
    right,
    originalText: text,
  }
}

/**
 * Parse a mathematical expression from text
 *
 * Tries to identify the type of mathematical expression and parse it accordingly.
 * Falls back to a text expression if no pattern matches.
 *
 * @param text - The mathematical expression as text
 * @returns Parsed math expression
 */
export function parseMathExpression(text: string): MathExpression {
  const trimmed = text.trim()

  // Try to parse as equation first (contains '=')
  if (trimmed.includes('=')) {
    const equation = parseEquation(trimmed)
    if (equation) return equation
  }

  // Try to parse as fraction
  const fraction = parseFraction(trimmed)
  if (fraction) return fraction

  // Try to parse as number
  const number = parseNumber(trimmed)
  if (number) return number

  // Try to parse as operation (last, as it's most general)
  const operation = parseOperation(trimmed)
  if (operation) return operation

  // Fallback to text
  return {
    type: 'text',
    text: trimmed,
    originalText: text,
  }
}

/**
 * Check if text contains mathematical expressions
 *
 * @param text - The text to check
 * @returns True if text likely contains math
 */
export function containsMath(text: string): boolean {
  // Check for common math symbols
  const mathSymbols = /[\+\-×÷\*\/\=]/
  const fractionPattern = /\d+\s*\/\s*\d+/
  const numberPattern = /\d/

  return (
    mathSymbols.test(text) ||
    fractionPattern.test(text) ||
    (numberPattern.test(text) && text.trim().split(/\s+/).length <= 3)
  )
}

/**
 * Extract all math expressions from a text string
 *
 * @param text - The text containing math expressions
 * @returns Array of math expressions found in the text
 */
export function extractMathExpressions(text: string): MathExpression[] {
  const expressions: MathExpression[] = []

  // For now, treat the entire text as one expression if it contains math
  // A more sophisticated implementation would split on sentences/phrases
  if (containsMath(text)) {
    expressions.push(parseMathExpression(text))
  }

  return expressions
}
