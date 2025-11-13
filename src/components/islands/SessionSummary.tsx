/**
 * SessionSummary Component
 *
 * SolidJS island component for displaying practice session results.
 * Shows statistics, achievements, and provides action buttons for next steps.
 *
 * Requirements:
 * - 8.2: Display positive reinforcement
 * - 9.1: WCAG 2.1 AA compliance (keyboard nav, ARIA, contrast)
 * - 9.3: Touch targets minimum 44x44 pixels
 */

import { createMemo, For, Show } from 'solid-js';
import { useStore } from '@nanostores/solid';
import { $t } from '@/lib/i18n';
import { ErrorBoundaryWrapper } from './ErrorBoundary';

/**
 * Session statistics data
 */
export interface SessionStats {
  totalExercises: number;
  correctCount: number;
  avgTimeSeconds: number;
  hintsUsed: number;
  skippedCount: number;
}

/**
 * Props for SessionSummary component
 */
export interface SessionSummaryProps {
  /** Session statistics to display */
  stats: SessionStats;

  /** Optional mastery points earned (for future enhancement) */
  masteryGain?: number;

  /** Callback when user wants to practice again */
  onPracticeAgain: () => void;

  /** Callback when user wants to view progress dashboard */
  onViewProgress: () => void;

  /** Callback when user wants to return to main dashboard */
  onReturnToDashboard: () => void;

  /** Optional CSS class for styling */
  class?: string;
}

/**
 * SessionSummary Component (Internal)
 *
 * Displays session statistics with positive reinforcement messaging,
 * highlights achievements, and provides navigation options.
 *
 * Note: This is the internal component. Use the default export which
 * includes error boundary protection.
 */
const SessionSummaryComponent = (props: SessionSummaryProps) => {
  const t = useStore($t);

  // Calculate accuracy percentage
  const accuracy = createMemo(() => {
    if (props.stats.totalExercises === 0) return 0;
    return Math.round((props.stats.correctCount / props.stats.totalExercises) * 100);
  });

  // Format average time as MM:SS
  const avgTimeFormatted = createMemo(() => {
    const seconds = Math.round(props.stats.avgTimeSeconds);
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  });

  // Determine congratulations message based on accuracy
  const congratsMessage = createMemo(() => {
    const acc = accuracy();
    if (acc >= 90) return t()('exercises.session.summary.excellentWork');
    if (acc >= 70) return t()('exercises.session.summary.goodProgress');
    return t()('exercises.session.summary.keepPracticing');
  });

  // Determine achievements unlocked
  const achievements = createMemo(() => {
    const unlocked: string[] = [];
    if (accuracy() === 100) unlocked.push('perfectScore');
    if (props.stats.hintsUsed === 0 && props.stats.correctCount > 0) unlocked.push('noHints');
    if (props.stats.avgTimeSeconds < 30) unlocked.push('fastLearner');
    if (props.stats.totalExercises >= 30) unlocked.push('persistent');
    return unlocked;
  });

  return (
    <div class={`session-summary ${props.class || ''}`}>
      {/* Header with celebration */}
      <div class="text-center mb-8">
        <div class="text-6xl mb-4" aria-hidden="true">🎉</div>
        <h1 class="text-3xl font-bold text-gray-900 mb-2">
          {t()('exercises.session.summary.title')}
        </h1>
        <p class="text-xl text-gray-700">
          {congratsMessage()}
        </p>
      </div>

      {/* Achievements */}
      <Show when={achievements().length > 0}>
        <div class="mb-8 p-6 bg-yellow-50 border border-yellow-200 rounded-lg">
          <h2 class="text-lg font-semibold text-yellow-900 mb-4 text-center">
            Achievements Unlocked!
          </h2>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <For each={achievements()}>
              {(achievement) => (
                <div class="flex items-center p-3 bg-white rounded-lg shadow-sm">
                  <span class="text-2xl mr-3" aria-hidden="true">🏆</span>
                  <span class="text-sm font-medium text-gray-800">
                    {t()(`exercises.session.summary.achievements.${achievement}`)}
                  </span>
                </div>
              )}
            </For>
          </div>
        </div>
      </Show>

      {/* Statistics */}
      <div class="mb-8 p-6 bg-white border border-gray-200 rounded-lg shadow-sm">
        <h2 class="text-xl font-semibold text-gray-900 mb-6">
          {t()('exercises.session.summary.statistics.title')}
        </h2>
        <div class="grid grid-cols-2 gap-6">
          {/* Total exercises */}
          <div class="text-center">
            <div class="text-3xl font-bold text-blue-600 mb-1">
              {props.stats.totalExercises}
            </div>
            <div class="text-sm text-gray-600">
              {t()('exercises.session.summary.statistics.total')}
            </div>
          </div>

          {/* Correct count */}
          <div class="text-center">
            <div class="text-3xl font-bold text-green-600 mb-1">
              {props.stats.correctCount}
            </div>
            <div class="text-sm text-gray-600">
              {t()('exercises.session.summary.statistics.correct')}
            </div>
          </div>

          {/* Accuracy */}
          <div class="text-center">
            <div class="text-3xl font-bold text-purple-600 mb-1">
              {accuracy()}%
            </div>
            <div class="text-sm text-gray-600">
              {t()('exercises.session.summary.statistics.accuracy')}
            </div>
          </div>

          {/* Average time */}
          <div class="text-center">
            <div class="text-3xl font-bold text-orange-600 mb-1">
              {avgTimeFormatted()}
            </div>
            <div class="text-sm text-gray-600">
              {t()('exercises.session.summary.statistics.avgTime')}
            </div>
          </div>

          {/* Hints used */}
          <Show when={props.stats.hintsUsed > 0}>
            <div class="text-center">
              <div class="text-3xl font-bold text-yellow-600 mb-1">
                {props.stats.hintsUsed}
              </div>
              <div class="text-sm text-gray-600">
                {t()('exercises.session.summary.statistics.hintsUsed')}
              </div>
            </div>
          </Show>

          {/* Skipped */}
          <Show when={props.stats.skippedCount > 0}>
            <div class="text-center">
              <div class="text-3xl font-bold text-gray-600 mb-1">
                {props.stats.skippedCount}
              </div>
              <div class="text-sm text-gray-600">
                {t()('exercises.session.summary.statistics.skipped')}
              </div>
            </div>
          </Show>

          {/* Mastery gain (if provided) */}
          <Show when={props.masteryGain !== undefined && props.masteryGain! > 0}>
            <div class="text-center col-span-2">
              <div class="text-3xl font-bold text-indigo-600 mb-1">
                +{props.masteryGain}
              </div>
              <div class="text-sm text-gray-600">
                {t()('exercises.session.summary.statistics.masteryGain')}
              </div>
            </div>
          </Show>
        </div>
      </div>

      {/* Action buttons */}
      <div class="space-y-3">
        <button
          type="button"
          onClick={props.onPracticeAgain}
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
          {t()('exercises.session.summary.actions.practiceAgain')}
        </button>

        <button
          type="button"
          onClick={props.onViewProgress}
          class="
            w-full py-4 px-6
            bg-green-600 hover:bg-green-700
            text-white font-semibold text-lg rounded-lg
            transition-colors
            min-h-[44px]
            focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2
            shadow-md hover:shadow-lg
          "
        >
          {t()('exercises.session.summary.actions.viewProgress')}
        </button>

        <button
          type="button"
          onClick={props.onReturnToDashboard}
          class="
            w-full py-4 px-6
            bg-gray-200 hover:bg-gray-300
            text-gray-800 font-semibold text-lg rounded-lg
            transition-colors
            min-h-[44px]
            focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2
            shadow-sm hover:shadow-md
          "
        >
          {t()('exercises.session.summary.actions.dashboard')}
        </button>
      </div>
    </div>
  );
};

/**
 * SessionSummary wrapped with ErrorBoundary
 *
 * Default export includes error boundary for robust error handling.
 *
 * @example
 * ```tsx
 * <SessionSummary
 *   stats={{ totalExercises: 20, correctCount: 16, avgTimeSeconds: 45, hintsUsed: 3, skippedCount: 1 }}
 *   onPracticeAgain={() => restart()}
 *   onViewProgress={() => navigate('/progress')}
 *   onReturnToDashboard={() => navigate('/dashboard')}
 * />
 * ```
 */
export default function SessionSummary(props: SessionSummaryProps) {
  return (
    <ErrorBoundaryWrapper
      componentName="SessionSummary"
      errorMessageKey="errors.session.summaryFailed"
    >
      <SessionSummaryComponent {...props} />
    </ErrorBoundaryWrapper>
  );
}
