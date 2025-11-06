/**
 * HintSystem Component
 * 
 * SolidJS island component for displaying progressive hints during exercise practice.
 * Implements 4-level hint revelation with usage tracking for mastery calculation.
 * 
 * Requirements:
 * - 4.1: Hint button accessible during every exercise without penalty
 * - 4.2: Implement four progressive hint levels
 * - 4.3: Display next hint level while keeping previous hints visible
 * - 4.4: Track hint usage count per exercise for mastery calculation
 * - 4.5: Keep hints available after answer submission for learning review
 */

import { createSignal, createEffect, For, Show } from 'solid-js';
import type { Hint } from '@/lib/exercises/types';
import { createReactiveHintTracker } from '@/lib/exercises/hint-tracker';
import { useStore } from '@nanostores/solid';
import { $t } from '@/lib/i18n';

export interface HintSystemProps {
  /** Array of hints for the current exercise (should have 4 levels) */
  hints: Hint[];
  
  /** Callback invoked when a hint is requested, receives the hint level (1-4) */
  onHintRequested: (level: number) => void;
  
  /** Whether the hint system is disabled (e.g., during answer submission) */
  disabled?: boolean;
  
  /** Key to reset the component state (change this when moving to a new exercise) */
  resetKey?: number | string;
}

/**
 * HintSystem - Progressive hint display component
 * 
 * Displays hints one at a time as the user requests them, keeping previous hints
 * visible. Tracks usage count for mastery calculation and supports accessibility.
 * 
 * @example
 * ```tsx
 * <HintSystem
 *   hints={exerciseInstance.hints}
 *   onHintRequested={(level) => console.log(`Hint ${level} requested`)}
 *   disabled={isSubmitting}
 *   resetKey={exerciseInstance.id}
 * />
 * ```
 */
export default function HintSystem(props: HintSystemProps) {
  const t = useStore($t);
  const [hintsRevealed, setHintsRevealed] = createSignal(0);
  const tracker = createReactiveHintTracker(props.hints, setHintsRevealed);

  // Reset state when resetKey changes (new exercise)
  createEffect(() => {
    // Access resetKey to track it
    const _key = props.resetKey;
    tracker.reset();
  });

  const handleRevealHint = () => {
    const hint = tracker.revealNext();
    if (hint) {
      props.onHintRequested(hint.level);
    }
  };

  const getRevealedHints = () => tracker.getRevealedHints(hintsRevealed());
  const areAllRevealed = () => tracker.areAllRevealed(hintsRevealed());
  const totalHints = () => props.hints.length;

  return (
    <div
      class="hint-system"
      role="region"
      aria-label={t()('hints.common.hintProgress', {
        current: hintsRevealed().toString(),
        total: totalHints().toString(),
      })}
    >
      {/* Hint button */}
      <div class="hint-button-container mb-4">
        <button
          type="button"
          class="hint-button px-6 py-3 rounded-lg font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2"
          classList={{
            'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500': !areAllRevealed() && !props.disabled,
            'bg-gray-300 text-gray-500 cursor-not-allowed': areAllRevealed() || props.disabled,
          }}
          onClick={handleRevealHint}
          disabled={areAllRevealed() || props.disabled}
          aria-label={
            areAllRevealed()
              ? t()('hints.common.allHintsShown')
              : `${t()('hints.common.hintProgress', {
                  current: (hintsRevealed() + 1).toString(),
                  total: totalHints().toString(),
                })}`
          }
          style={{
            'min-width': '44px',
            'min-height': '44px',
          }}
        >
          <Show
            when={!areAllRevealed()}
            fallback={
              <span class="flex items-center gap-2">
                <svg
                  class="w-5 h-5"
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
                    d="M5 13l4 4L19 7"
                  />
                </svg>
                <span>{t()('hints.common.allHintsShown')}</span>
              </span>
            }
          >
            <span class="flex items-center gap-2">
              <svg
                class="w-5 h-5"
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
                  d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                />
              </svg>
              <span>
                {hintsRevealed() === 0
                  ? t()('hints.common.getHint')
                  : t()('hints.common.getNextHint')}
              </span>
            </span>
          </Show>
        </button>

        {/* Progress indicator */}
        <Show when={hintsRevealed() > 0}>
          <div
            class="hint-progress mt-2 text-sm text-gray-600"
            aria-live="polite"
          >
            {t()('hints.common.hintProgress', {
              current: hintsRevealed().toString(),
              total: totalHints().toString(),
            })}
          </div>
        </Show>
      </div>

      {/* Revealed hints */}
      <Show when={hintsRevealed() > 0}>
        <div
          class="revealed-hints space-y-4"
          role="list"
          aria-label={t()('hints.common.revealedHints')}
        >
          <For each={getRevealedHints()}>
            {(hint) => (
              <div
                class="hint-item p-4 rounded-lg border-l-4 transition-all duration-300 animate-fade-in"
                classList={{
                  'bg-blue-50 border-blue-500': hint.level === 1,
                  'bg-green-50 border-green-500': hint.level === 2,
                  'bg-yellow-50 border-yellow-500': hint.level === 3,
                  'bg-purple-50 border-purple-500': hint.level === 4,
                }}
                role="listitem"
                aria-label={`${t()('hints.common.hintLevel')} ${hint.level}`}
              >
                {/* Hint level badge */}
                <div class="flex items-start gap-3">
                  <div
                    class="hint-level-badge flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm"
                    classList={{
                      'bg-blue-600 text-white': hint.level === 1,
                      'bg-green-600 text-white': hint.level === 2,
                      'bg-yellow-600 text-white': hint.level === 3,
                      'bg-purple-600 text-white': hint.level === 4,
                    }}
                    aria-hidden="true"
                  >
                    {hint.level}
                  </div>

                  {/* Hint content */}
                  <div class="hint-content flex-1">
                    <div class="hint-text text-gray-800 leading-relaxed whitespace-pre-line">
                      {hint.text}
                    </div>

                    {/* Visual aid (if present) */}
                    <Show when={hint.visualAid}>
                      <div
                        class="hint-visual-aid mt-3 p-3 bg-white rounded border border-gray-200"
                        role="img"
                        aria-label={t()('hints.common.visualAid')}
                      >
                        <div class="text-sm text-gray-600 mb-2 font-medium">
                          {t()('hints.common.visualAid')}
                        </div>
                        {/* Visual aid rendering will be implemented based on type */}
                        <div class="text-xs text-gray-500">
                          Type: {hint.visualAid?.type}
                        </div>
                      </div>
                    </Show>
                  </div>
                </div>
              </div>
            )}
          </For>
        </div>
      </Show>
    </div>
  );
}

