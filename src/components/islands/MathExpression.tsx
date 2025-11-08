/**
 * MathExpression Component
 *
 * SolidJS component for rendering mathematical expressions with accessibility support.
 * Provides ARIA labels with spoken representations for screen readers.
 *
 * Features:
 * - Automatic detection of mathematical patterns
 * - Screen reader friendly spoken representations
 * - Multi-language support (Danish/English)
 * - Progressive enhancement (MathML support planned)
 *
 * Requirements:
 * - 9.4: MathML rendering for mathematical expressions (partial - ARIA labels implemented)
 * - 9.4: Screen reader support for mathematical content
 *
 * @example
 * ```tsx
 * <MathExpression expression="1/2" />
 * // Renders with aria-label="one half"
 *
 * <MathExpression expression="2 + 3" />
 * // Renders with aria-label="2 plus 3"
 * ```
 */

import { createMemo } from 'solid-js'
import { useStore } from '@nanostores/solid'
import { $t } from '@/lib/i18n'
import { parseMathExpression, containsMath } from '@/lib/accessibility/math-parser'
import { mathToSpeech } from '@/lib/accessibility/math-to-speech'

export interface MathExpressionProps {
  /** The mathematical expression as text */
  expression: string
  /** Optional CSS class for styling */
  class?: string
  /** Whether to display inline (default) or block */
  display?: 'inline' | 'block'
}

/**
 * MathExpression - Renders mathematical expressions with accessibility
 *
 * Automatically detects mathematical patterns in text and provides
 * spoken representations for screen readers via ARIA labels.
 *
 * @example
 * ```tsx
 * <MathExpression expression="x + 5 = 10" />
 * <MathExpression expression="3/4" display="block" class="text-2xl" />
 * ```
 */
export default function MathExpression(props: MathExpressionProps) {
  const t = useStore($t)

  // Check if expression contains math
  const hasMath = createMemo(() => containsMath(props.expression))

  // Parse the expression
  const parsed = createMemo(() => {
    if (!hasMath()) return null
    return parseMathExpression(props.expression)
  })

  // Generate spoken representation
  const spokenForm = createMemo(() => {
    const expr = parsed()
    if (!expr) return props.expression

    try {
      return mathToSpeech(expr, t())
    } catch (error) {
      console.error('Error converting math to speech:', error)
      return props.expression
    }
  })

  // Determine if we should render with special math styling
  const renderAsMath = createMemo(() => hasMath())

  // CSS classes
  const classes = createMemo(() => {
    const baseClass = props.class || ''
    const displayClass = props.display === 'block' ? 'block' : 'inline'
    const mathClass = renderAsMath() ? 'math-expression font-mono' : ''

    return `${baseClass} ${displayClass} ${mathClass}`.trim()
  })

  return (
    <span
      class={classes()}
      role={renderAsMath() ? 'math' : undefined}
      aria-label={renderAsMath() ? spokenForm() : undefined}
    >
      {props.expression}
    </span>
  )
}
