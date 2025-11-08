/**
 * FeedbackDisplay Component
 *
 * SolidJS island component for displaying immediate exercise feedback.
 * Shows positive reinforcement for correct answers, gentle corrections for
 * incorrect answers, optional worked solutions, and visual aids.
 *
 * Requirements:
 * - 8.1: Display feedback within 1 second
 * - 8.2: Display positive reinforcement with brief explanation and continue option
 * - 8.3: Display gentle correction showing correct answer without negative language
 * - 8.4: Provide option to view complete worked solution (button-triggered)
 * - 8.5: Include visual aids in feedback when relevant
 * - 9.1: WCAG 2.1 AA compliance (keyboard nav, ARIA, contrast)
 * - 9.3: Touch targets minimum 44x44 pixels
 */

import { createSignal, Show } from 'solid-js';
import { useStore } from '@nanostores/solid';
import { $t } from '@/lib/i18n';
import type { WorkedSolution, VisualAid } from '@/lib/exercises/types';
import WorkedSolutionDisplay from './WorkedSolutionDisplay';
import VisualAidRenderer from './VisualAidRenderer';

/**
 * Props for FeedbackDisplay component
 */
export interface FeedbackDisplayProps {
  /** Whether the answer was correct */
  isCorrect: boolean;
  
  /** Feedback message (random reinforcement or correction) */
  message: string;
  
  /** The correct answer to display (for incorrect responses) */
  correctAnswer: string;
  
  /** The user's submitted answer */
  userAnswer: string;
  
  /** Optional worked solution (shown behind button toggle) */
  workedSolution?: WorkedSolution;
  
  /** Optional visual aid (shown automatically when present) */
  visualAid?: VisualAid;
  
  /** Callback when Continue button is clicked (correct answers) */
  onContinue?: () => void;
  
  /** Callback when Try Again button is clicked (incorrect answers) */
  onTryAgain?: () => void;
  
  /** Optional CSS class for styling */
  class?: string;
}

/**
 * FeedbackDisplay - Main feedback display component
 *
 * Displays immediate feedback after exercise submission with:
 * - Positive reinforcement for correct answers (green theme)
 * - Gentle correction for incorrect answers (orange theme)
 * - Correct answer display for incorrect responses
 * - Optional worked solution viewer (button-triggered)
 * - Automatic visual aid display when provided
 * - Action buttons (Continue/Try Again)
 *
 * @example
 * ```tsx
 * <FeedbackDisplay
 *   isCorrect={true}
 *   message="Excellent!"
 *   correctAnswer="42"
 *   userAnswer="42"
 *   onContinue={() => nextExercise()}
 * />
 * ```
 */
export default function FeedbackDisplay(props: FeedbackDisplayProps) {
  const t = useStore($t);
  
  // Toggle state for worked solution display
  const [showSolution, setShowSolution] = createSignal(false);
  
  /**
   * Toggle worked solution visibility
   */
  const handleToggleSolution = () => {
    setShowSolution((prev) => !prev);
  };
  
  return (
    <div
      class={`feedback-display-container mb-6 p-6 rounded-lg border-2 transition-all duration-300 animate-slide-in ${props.class || ''}`}
      classList={{
        'bg-green-50 border-green-400': props.isCorrect,
        'bg-orange-50 border-orange-400': !props.isCorrect,
      }}
      role="alert"
      aria-live="polite"
      aria-atomic="true"
    >
      <div class="feedback-content">
        {/* Header with icon and title */}
        <div class="feedback-header flex items-start gap-4 mb-4">
          {/* Icon */}
          <div class="flex-shrink-0">
            <Show
              when={props.isCorrect}
              fallback={
                <svg
                  class="w-8 h-8 text-orange-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  />
                </svg>
              }
            >
              <svg
                class="w-8 h-8 text-green-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </Show>
          </div>
          
          {/* Title and message */}
          <div class="flex-1">
            <h4
              class="text-lg font-bold mb-2"
              classList={{
                'text-green-900': props.isCorrect,
                'text-orange-900': !props.isCorrect,
              }}
            >
              {props.isCorrect ? t()('feedback.correct.title') : t()('feedback.incorrect.title')}
            </h4>
            <p
              class="text-base mb-3"
              classList={{
                'text-green-800': props.isCorrect,
                'text-orange-800': !props.isCorrect,
              }}
            >
              {props.message}
            </p>
            
            {/* Show correct answer for incorrect responses */}
            <Show when={!props.isCorrect}>
              <p class="text-base font-semibold text-orange-900 mt-2">
                {t()('feedback.incorrect.showCorrect', { answer: props.correctAnswer })}
              </p>
            </Show>
          </div>
        </div>
        
        {/* Visual Aid Section (auto-display when present) */}
        <Show when={props.visualAid}>
          <div class="visual-aid-section mb-6 p-4 bg-white rounded-lg border-2 border-gray-200 shadow-sm">
            <div class="text-sm font-medium text-gray-700 mb-3">
              {t()('hints.common.visualAid')}
            </div>
            <VisualAidRenderer visualAid={props.visualAid!} />
          </div>
        </Show>
        
        {/* Worked Solution Section (button-triggered) */}
        <Show when={props.workedSolution}>
          <div class="worked-solution-section mb-6">
            <button
              onClick={handleToggleSolution}
              class="mb-4 px-5 py-3 bg-purple-600 text-white font-semibold rounded-lg hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 transition-all flex items-center gap-2"
              style={{ 'min-width': '44px', 'min-height': '44px' }}
              aria-expanded={showSolution()}
              aria-controls="worked-solution-content"
            >
              <svg
                class="w-5 h-5 transition-transform duration-200"
                classList={{
                  'rotate-180': showSolution(),
                }}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M19 9l-7 7-7-7"
                />
              </svg>
              <span>
                {showSolution()
                  ? t()('feedback.incorrect.hideSolution')
                  : t()('feedback.incorrect.viewSolution')}
              </span>
            </button>
            
            <div id="worked-solution-content">
              <Show when={showSolution()}>
                <div class="p-4 bg-white rounded-lg border-2 border-purple-200 shadow-sm">
                  <WorkedSolutionDisplay solution={props.workedSolution!} show={true} />
                </div>
              </Show>
            </div>
          </div>
        </Show>
        
        {/* Action Buttons */}
        <div class="action-buttons flex gap-3 flex-wrap">
          <Show
            when={props.isCorrect}
            fallback={
              <Show when={props.onTryAgain}>
                <button
                  onClick={props.onTryAgain}
                  class="px-6 py-3 bg-orange-600 text-white font-semibold rounded-lg hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 transition-all"
                  style={{ 'min-width': '44px', 'min-height': '44px' }}
                  aria-label={t()('feedback.incorrect.tryAgain')}
                >
                  {t()('feedback.incorrect.tryAgain')}
                </button>
              </Show>
            }
          >
            <Show when={props.onContinue}>
              <button
                onClick={props.onContinue}
                class="px-6 py-3 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-all"
                style={{ 'min-width': '44px', 'min-height': '44px' }}
                aria-label={t()('feedback.correct.continue')}
              >
                {t()('feedback.correct.continue')}
              </button>
            </Show>
          </Show>
        </div>
      </div>
    </div>
  );
}

