/**
 * WorkedSolutionDisplay Component
 *
 * SolidJS island component for rendering step-by-step worked solutions.
 * Displays each solution step with explanations, expressions, and visual aids.
 *
 * Requirements:
 * - 4.3: Display complete worked solution with intermediate steps
 * - 8.4: Provide worked solution at any time during or after exercise
 */

import { For, Show } from 'solid-js';
import type { WorkedSolution } from '@/lib/exercises/types';
import { useStore } from '@nanostores/solid';
import { $t } from '@/lib/i18n';
import VisualAidRenderer from './VisualAidRenderer';

export interface WorkedSolutionDisplayProps {
  /** The worked solution to display */
  solution: WorkedSolution;
  /** Whether to show the solution (controlled visibility) */
  show?: boolean;
  /** Optional CSS class for styling */
  class?: string;
}

/**
 * WorkedSolutionDisplay - Renders step-by-step worked solutions
 *
 * Displays a complete worked solution with all intermediate steps,
 * explanations, and visual aids. Supports accessibility features
 * including semantic HTML, ARIA attributes, and keyboard navigation.
 *
 * @example
 * ```tsx
 * <WorkedSolutionDisplay
 *   solution={workedSolution}
 *   show={showSolution}
 *   class="my-custom-class"
 * />
 * ```
 */
export default function WorkedSolutionDisplay(props: WorkedSolutionDisplayProps) {
  const t = useStore($t);

  return (
    <Show when={props.show !== false}>
      <div
        class={`worked-solution-container ${props.class || ''}`}
        role="region"
        aria-label={t()('solutions.workedSolutionLabel')}
      >
        {/* Header */}
        <div class="worked-solution-header mb-4 pb-3 border-b-2 border-purple-300">
          <h3 class="text-lg font-bold text-purple-900 flex items-center gap-2">
            <svg
              class="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
              aria-hidden="true"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            <span>{t()('solutions.stepByStepSolution')}</span>
          </h3>
        </div>

        {/* Solution Steps */}
        <div
          class="solution-steps space-y-4 mb-6"
          role="list"
          aria-label={t()('solutions.solutionSteps')}
        >
          <For each={props.solution.steps}>
            {(step, index) => (
              <div
                class="solution-step p-4 rounded-lg bg-gradient-to-r from-purple-50 to-purple-100 border border-purple-200 shadow-sm transition-all duration-200 hover:shadow-md"
                role="listitem"
                aria-label={`${t()('solutions.step')} ${index() + 1}`}
              >
                {/* Step number badge */}
                <div class="flex items-start gap-4">
                  <div
                    class="step-number flex-shrink-0 w-8 h-8 rounded-full bg-purple-600 text-white flex items-center justify-center font-bold text-sm shadow"
                    aria-hidden="true"
                  >
                    {index() + 1}
                  </div>

                  {/* Step content */}
                  <div class="step-content flex-1">
                    {/* Explanation */}
                    <div class="step-explanation text-gray-700 font-medium mb-2">
                      {step.explanation}
                    </div>

                    {/* Mathematical expression */}
                    <div class="step-expression p-3 bg-white rounded border border-purple-200 font-mono text-lg text-purple-900 shadow-sm">
                      {step.expression}
                    </div>

                    {/* Visual aid for this step */}
                    <Show when={step.visualAid}>
                      <div class="step-visual-aid mt-3">
                        <VisualAidRenderer visualAid={step.visualAid!} />
                      </div>
                    </Show>
                  </div>
                </div>
              </div>
            )}
          </For>
        </div>

        {/* Overall visual aid (if present) */}
        <Show when={props.solution.visualAid}>
          <div class="solution-visual-aid mb-6 p-4 bg-purple-50 rounded-lg border border-purple-200">
            <div class="text-sm font-medium text-purple-900 mb-3">
              {t()('solutions.overallVisualization')}
            </div>
            <VisualAidRenderer visualAid={props.solution.visualAid!} />
          </div>
        </Show>

        {/* Final answer */}
        <div
          class="final-answer p-4 rounded-lg bg-gradient-to-r from-green-100 to-green-200 border-2 border-green-400 shadow-md"
          role="status"
          aria-label={t()('solutions.finalAnswer')}
        >
          <div class="flex items-center gap-3">
            <svg
              class="w-8 h-8 text-green-700"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
              aria-hidden="true"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <div class="flex-1">
              <div class="text-sm font-medium text-green-800 uppercase tracking-wide mb-1">
                {t()('solutions.finalAnswer')}
              </div>
              <div class="text-xl font-bold text-green-900">
                {props.solution.finalAnswer}
              </div>
            </div>
          </div>
        </div>
      </div>
    </Show>
  );
}
