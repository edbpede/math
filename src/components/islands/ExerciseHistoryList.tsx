/**
 * ExerciseHistoryList Component
 *
 * Virtual scrolling list component for displaying large exercise history.
 * Uses @tanstack/solid-virtual for efficient rendering of 1000+ items.
 *
 * Requirements:
 * - 13.3: Use virtual scrolling for long lists to optimize performance
 * - Target: Render max 100 DOM nodes for 1000+ items
 */

import { createVirtualizer } from '@tanstack/solid-virtual';
import { createSignal, For, Show } from 'solid-js';
import { useStore } from '@nanostores/solid';
import { $t } from '@/lib/i18n';
import type { ExerciseAttempt } from '@/lib/mastery/types';
import { getMasteryLevelBand } from '@/lib/mastery/calculator';

/**
 * Props for ExerciseHistoryList
 */
export interface ExerciseHistoryListProps {
  /** Array of exercise attempts to display */
  history: ExerciseAttempt[];
  /** Optional CSS class for styling */
  class?: string;
  /** Height of the scrollable container in pixels */
  height?: number;
}

/**
 * ExerciseHistoryList - Virtual scrolling list for exercise history
 *
 * Efficiently renders large lists of exercise attempts using virtual scrolling.
 * Only renders visible rows plus overscan buffer for smooth scrolling.
 *
 * @example
 * ```tsx
 * <ExerciseHistoryList
 *   history={exerciseHistory}
 *   height={600}
 *   class="rounded-lg shadow"
 * />
 * ```
 */
export default function ExerciseHistoryList(props: ExerciseHistoryListProps) {
  const t = useStore($t);
  const [scrollElement, setScrollElement] = createSignal<HTMLDivElement>();

  // Create virtualizer
  const virtualizer = createVirtualizer({
    get count() {
      return props.history.length;
    },
    getScrollElement: () => scrollElement(),
    estimateSize: () => 60, // Fixed row height for performance
    overscan: 5, // Render 5 extra items above/below viewport
  });

  /**
   * Format date for display
   */
  const formatDate = (date: Date): string => {
    return new Intl.DateTimeFormat(t()('locale') || 'da-DK', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  /**
   * Format duration in human-readable format
   */
  const formatDuration = (seconds: number): string => {
    if (seconds < 60) {
      return `${seconds}s`;
    }
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
  };

  /**
   * Get status color class based on correctness
   */
  const getStatusColor = (correct: boolean): string => {
    return correct
      ? 'bg-green-100 text-green-800 border-green-200'
      : 'bg-red-100 text-red-800 border-red-200';
  };

  /**
   * Get status icon
   */
  const getStatusIcon = (correct: boolean): string => {
    return correct ? '✓' : '✗';
  };

  return (
    <div class={`exercise-history-list ${props.class || ''}`}>
      {/* Header */}
      <div class="mb-4">
        <h3 class="text-lg font-semibold text-gray-900">
          {t()('progress.history.title')}
        </h3>
        <p class="text-sm text-gray-600">
          {t()('progress.history.totalAttempts')}: {props.history.length}
        </p>
      </div>

      {/* Empty state */}
      <Show when={props.history.length === 0}>
        <div class="rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 p-8 text-center">
          <p class="text-gray-600">{t()('progress.history.empty')}</p>
        </div>
      </Show>

      {/* Virtual scrolling list */}
      <Show when={props.history.length > 0}>
        <div
          ref={setScrollElement}
          class="overflow-auto rounded-lg border border-gray-200"
          style={{
            height: `${props.height || 600}px`,
            contain: 'strict',
          }}
        >
          <div
            style={{
              height: `${virtualizer.getTotalSize()}px`,
              width: '100%',
              position: 'relative',
            }}
          >
            <For each={virtualizer.getVirtualItems()}>
              {(virtualItem) => {
                const attempt = props.history[virtualItem.index];
                return (
                  <div
                    data-index={virtualItem.index}
                    class="absolute top-0 left-0 w-full"
                    style={{
                      height: `${virtualItem.size}px`,
                      transform: `translateY(${virtualItem.start}px)`,
                    }}
                  >
                    {/* Exercise history row */}
                    <div class="flex items-center gap-4 border-b border-gray-200 p-4 hover:bg-gray-50 transition-colors">
                      {/* Status indicator */}
                      <div
                        class={`flex h-10 w-10 items-center justify-center rounded-full border-2 font-bold ${getStatusColor(attempt.correct)}`}
                        aria-label={
                          attempt.correct
                            ? t()('progress.history.correct')
                            : t()('progress.history.incorrect')
                        }
                      >
                        {getStatusIcon(attempt.correct)}
                      </div>

                      {/* Exercise details */}
                      <div class="flex-1 min-w-0">
                        <div class="flex items-center gap-2">
                          <span class="text-sm font-medium text-gray-900 truncate">
                            {attempt.templateId}
                          </span>
                          <Show when={attempt.difficulty}>
                            <span class="text-xs px-2 py-0.5 rounded bg-gray-100 text-gray-700">
                              {attempt.difficulty}
                            </span>
                          </Show>
                        </div>
                        <div class="flex items-center gap-3 mt-1 text-xs text-gray-600">
                          <span>
                            ⏱️ {formatDuration(attempt.timeSpentSeconds)}
                          </span>
                          <Show when={attempt.hintsUsed > 0}>
                            <span>
                              💡 {attempt.hintsUsed}{' '}
                              {attempt.hintsUsed === 1
                                ? t()('common.hint')
                                : t()('common.hints')}
                            </span>
                          </Show>
                          <span class="text-gray-400">
                            {formatDate(attempt.createdAt)}
                          </span>
                        </div>
                      </div>

                      {/* User answer (if available) */}
                      <Show when={attempt.userAnswer}>
                        <div class="text-sm text-gray-700 font-mono">
                          {attempt.userAnswer}
                        </div>
                      </Show>
                    </div>
                  </div>
                );
              }}
            </For>
          </div>
        </div>

        {/* Stats footer */}
        <div class="mt-4 flex gap-6 text-sm text-gray-600">
          <div>
            <span class="font-medium">
              {t()('progress.history.correctCount')}:
            </span>{' '}
            {props.history.filter((a) => a.correct).length}
          </div>
          <div>
            <span class="font-medium">
              {t()('progress.history.incorrectCount')}:
            </span>{' '}
            {props.history.filter((a) => !a.correct).length}
          </div>
          <div>
            <span class="font-medium">
              {t()('progress.history.successRate')}:
            </span>{' '}
            {props.history.length > 0
              ? Math.round(
                  (props.history.filter((a) => a.correct).length /
                    props.history.length) *
                    100
                )
              : 0}
            %
          </div>
        </div>
      </Show>
    </div>
  );
}

