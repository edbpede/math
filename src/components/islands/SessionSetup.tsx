/**
 * SessionSetup Component
 *
 * SolidJS island component for configuring practice session parameters.
 * Allows users to select difficulty level, number of exercises, and view
 * first-time user notice.
 *
 * Requirements:
 * - 14.5: Begin first practice session with easier problems (difficulty A)
 * - 9.1: WCAG 2.1 AA compliance (keyboard nav, ARIA, contrast)
 * - 9.3: Touch targets minimum 44x44 pixels
 */

import { createSignal, Show } from 'solid-js';
import { useStore } from '@nanostores/solid';
import { $t } from '@/lib/i18n';
import type { Difficulty } from '@/lib/curriculum/types';
import { ErrorBoundaryWrapper } from './ErrorBoundary';

/**
 * Session configuration data
 */
export interface SessionConfig {
  difficulty: Difficulty | 'Auto';
  exerciseCount: 10 | 20 | 30;
}

/**
 * Props for SessionSetup component
 */
export interface SessionSetupProps {
  /** Whether this is the user's first time in this competency area */
  isFirstTime: boolean;

  /** Callback when user starts the session with selected configuration */
  onStart: (config: SessionConfig) => void;

  /** Optional CSS class for styling */
  class?: string;
}

/**
 * SessionSetup Component (Internal)
 *
 * Provides UI for selecting difficulty level and exercise count.
 * Implements Requirement 14.5 by defaulting to difficulty A for first-time users.
 *
 * Note: This is the internal component. Use the default export which
 * includes error boundary protection.
 */
const SessionSetupComponent = (props: SessionSetupProps) => {
  const t = useStore($t);

  // Default to 'A' for first-time users (Requirement 14.5), otherwise 'Auto'
  const [selectedDifficulty, setSelectedDifficulty] = createSignal<Difficulty | 'Auto'>(
    props.isFirstTime ? 'A' : 'Auto'
  );
  const [selectedCount, setSelectedCount] = createSignal<10 | 20 | 30>(20);

  const handleStart = () => {
    props.onStart({
      difficulty: selectedDifficulty(),
      exerciseCount: selectedCount()
    });
  };

  const difficultyOptions: Array<{ value: Difficulty | 'Auto'; key: string }> = [
    { value: 'Auto', key: 'auto' },
    { value: 'A', key: 'a' },
    { value: 'B', key: 'b' },
    { value: 'C', key: 'c' }
  ];

  const countOptions: Array<{ value: 10 | 20 | 30; key: string }> = [
    { value: 10, key: '10' },
    { value: 20, key: '20' },
    { value: 30, key: '30' }
  ];

  return (
    <div class={`session-setup ${props.class || ''}`}>
      {/* Header */}
      <div class="mb-8">
        <h1 class="text-3xl font-bold text-gray-900 mb-2">
          {t()('exercises.session.setup.title')}
        </h1>
        <p class="text-lg text-gray-600">
          {t()('exercises.session.setup.subtitle')}
        </p>
      </div>

      {/* First-time notice */}
      <Show when={props.isFirstTime}>
        <div
          class="mb-8 p-4 bg-blue-50 border border-blue-200 rounded-lg"
          role="status"
          aria-live="polite"
        >
          <p class="text-blue-800 text-sm">
            {t()('exercises.session.setup.firstTimeNotice')}
          </p>
        </div>
      </Show>

      {/* Difficulty selection */}
      <div class="mb-8">
        <label
          id="difficulty-label"
          class="block text-lg font-semibold text-gray-800 mb-4"
        >
          {t()('exercises.session.setup.difficulty.label')}
        </label>
        <div
          role="radiogroup"
          aria-labelledby="difficulty-label"
          class="space-y-3"
        >
          {difficultyOptions.map((option) => {
            const isSelected = () => selectedDifficulty() === option.value;
            return (
              <button
                type="button"
                role="radio"
                aria-checked={isSelected()}
                onClick={() => setSelectedDifficulty(option.value)}
                class={`
                  w-full text-left p-4 rounded-lg border-2 transition-all
                  min-h-[44px] cursor-pointer
                  ${isSelected()
                    ? 'border-blue-500 bg-blue-50 shadow-md'
                    : 'border-gray-300 bg-white hover:border-blue-300 hover:bg-blue-50'
                  }
                  focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
                `}
              >
                <div class="flex items-start">
                  <div
                    class={`
                      flex-shrink-0 w-5 h-5 rounded-full border-2 mt-0.5 mr-3
                      ${isSelected()
                        ? 'border-blue-500 bg-blue-500'
                        : 'border-gray-400 bg-white'
                      }
                    `}
                    aria-hidden="true"
                  >
                    <Show when={isSelected()}>
                      <div class="w-full h-full rounded-full bg-white scale-40" />
                    </Show>
                  </div>
                  <div class="flex-1">
                    <div class="font-semibold text-gray-900 mb-1">
                      {t()(`exercises.session.setup.difficulty.${option.key}`)}
                    </div>
                    <div class="text-sm text-gray-600">
                      {t()(`exercises.session.setup.difficulty.${option.key}Description`)}
                    </div>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Exercise count selection */}
      <div class="mb-8">
        <label
          id="count-label"
          class="block text-lg font-semibold text-gray-800 mb-4"
        >
          {t()('exercises.session.setup.exerciseCount.label')}
        </label>
        <div
          role="radiogroup"
          aria-labelledby="count-label"
          class="space-y-3"
        >
          {countOptions.map((option) => {
            const isSelected = () => selectedCount() === option.value;
            return (
              <button
                type="button"
                role="radio"
                aria-checked={isSelected()}
                onClick={() => setSelectedCount(option.value)}
                class={`
                  w-full text-left p-4 rounded-lg border-2 transition-all
                  min-h-[44px] cursor-pointer
                  ${isSelected()
                    ? 'border-blue-500 bg-blue-50 shadow-md'
                    : 'border-gray-300 bg-white hover:border-blue-300 hover:bg-blue-50'
                  }
                  focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
                `}
              >
                <div class="flex items-start">
                  <div
                    class={`
                      flex-shrink-0 w-5 h-5 rounded-full border-2 mt-0.5 mr-3
                      ${isSelected()
                        ? 'border-blue-500 bg-blue-500'
                        : 'border-gray-400 bg-white'
                      }
                    `}
                    aria-hidden="true"
                  >
                    <Show when={isSelected()}>
                      <div class="w-full h-full rounded-full bg-white scale-40" />
                    </Show>
                  </div>
                  <div class="flex-1">
                    <div class="font-semibold text-gray-900 mb-1">
                      {t()(`exercises.session.setup.exerciseCount.${option.key}`)}
                    </div>
                    <div class="text-sm text-gray-600">
                      {t()(`exercises.session.setup.exerciseCount.${option.key}Description`)}
                    </div>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Start button */}
      <div class="mt-8">
        <button
          type="button"
          onClick={handleStart}
          class="
            w-full py-4 px-6
            bg-blue-600 hover:bg-blue-700
            text-white font-semibold text-lg rounded-lg
            transition-colors
            min-h-[44px]
            focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
            shadow-md hover:shadow-lg
          "
        >
          {t()('exercises.session.setup.startButton')}
        </button>
      </div>
    </div>
  );
};

/**
 * SessionSetup wrapped with ErrorBoundary
 *
 * Default export includes error boundary for robust error handling.
 *
 * @example
 * ```tsx
 * <SessionSetup
 *   isFirstTime={true}
 *   onStart={(config) => handleStart(config)}
 * />
 * ```
 */
export default function SessionSetup(props: SessionSetupProps) {
  return (
    <ErrorBoundaryWrapper
      componentName="SessionSetup"
      errorMessageKey="errors.session.setupFailed"
    >
      <SessionSetupComponent {...props} />
    </ErrorBoundaryWrapper>
  );
}
