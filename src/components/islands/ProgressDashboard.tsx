/**
 * Progress Dashboard Component
 *
 * SolidJS island component that visualizes user mastery levels across
 * competency areas with color-coded indicators, displays skills progress
 * breakdowns, shows practice streak counter, and presents review schedule
 * priorities.
 *
 * Requirements:
 * - 5.7: Visual mastery display with color coding
 * - 15.1: Display complete progress data (mastery, history, preferences)
 * - Task 8.6: Build progress dashboard component with all sections
 *
 * Features:
 * - Competency area cards with mastery percentages
 * - Skills area breakdown with progress bars
 * - Color-coded mastery indicators (red/yellow/green/blue)
 * - Practice streak counter
 * - Review schedule with upcoming priorities
 */

import {
  createSignal,
  createResource,
  Show,
  For,
  ErrorBoundary,
  Suspense,
  type Component,
} from 'solid-js';
import { useStore } from '@nanostores/solid';
import { $t } from '@/lib/i18n';
import type { GradeRange, CompetencyAreaId } from '@/lib/curriculum/types';
import type { CompetencyProgress, SkillProgress, ExerciseAttempt } from '@/lib/mastery/types';
import { getMasteryLevelBand } from '@/lib/mastery/calculator';
import { calculatePracticeStreak, formatStreakMessage } from '@/lib/mastery/streak-calculator';
import { getUpcomingReviews, formatReviewDate } from '@/lib/mastery/review-scheduler';
import {
  fetchCompetencyProgress,
  fetchSkillsProgress,
  fetchExerciseHistory,
} from '@/lib/supabase/progress';

/**
 * Props for ProgressDashboard component
 */
export interface ProgressDashboardProps {
  /** User UUID */
  userId: string;
  /** User's current grade range */
  gradeRange: GradeRange;
}

/**
 * Dashboard data structure
 */
interface DashboardData {
  competencies: CompetencyProgress[];
  skills: SkillProgress[];
  exerciseHistory: ExerciseAttempt[];
}

/**
 * Progress Dashboard Component
 *
 * Main dashboard for visualizing user progress across all competency areas.
 * Uses SolidJS fine-grained reactivity with createResource for async data.
 *
 * @example
 * ```tsx
 * <ProgressDashboard userId={user.id} gradeRange="4-6" />
 * ```
 */
const ProgressDashboard: Component<ProgressDashboardProps> = (props) => {
  const t = useStore($t);
  const [expandedCompetency, setExpandedCompetency] = createSignal<CompetencyAreaId | null>(null);

  // Fetch all dashboard data
  const [dashboardData] = createResource<DashboardData>(async () => {
    const [competencies, skills, exerciseHistory] = await Promise.all([
      fetchCompetencyProgress(props.userId),
      fetchSkillsProgress(props.userId),
      fetchExerciseHistory(props.userId, 1000), // Last 1000 exercises for streak calc
    ]);

    return { competencies, skills, exerciseHistory };
  });

  // Fetch review schedule
  const [reviewSchedule] = createResource(async () => {
    return await getUpcomingReviews(props.userId, 10);
  });

  // Calculate streak from exercise history
  const streakData = () => {
    const data = dashboardData();
    if (!data) return null;
    return calculatePracticeStreak(data.exerciseHistory);
  };

  // Toggle competency expansion
  const toggleCompetency = (competencyId: CompetencyAreaId) => {
    setExpandedCompetency((prev) => (prev === competencyId ? null : competencyId));
  };

  // Get skills for a competency area
  const getSkillsForCompetency = (competencyId: CompetencyAreaId) => {
    const data = dashboardData();
    if (!data) return [];
    
    // Filter skills by competency area (skill IDs should start with competency area ID)
    return data.skills.filter((skill) => 
      skill.skillId.startsWith(competencyId)
    );
  };

  // Format relative time
  const formatRelativeTime = (date: Date | undefined) => {
    if (!date) return t()('progress.competencyCard.notPracticedYet');
    
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return t()('common.time.justNow');
    if (diffDays === 1) return `1 ${t()('common.time.days')} ${t()('common.time.ago')}`;
    if (diffDays < 7) return `${diffDays} ${t()('common.time.days')} ${t()('common.time.ago')}`;
    
    const weeks = Math.floor(diffDays / 7);
    if (weeks === 1) return `1 ${t()('common.time.weeks')} ${t()('common.time.ago')}`;
    if (weeks < 4) return `${weeks} ${t()('common.time.weeks')} ${t()('common.time.ago')}`;
    
    const months = Math.floor(diffDays / 30);
    return `${months} ${t()('common.time.months')} ${t()('common.time.ago')}`;
  };

  return (
    <ErrorBoundary
      fallback={(err) => (
        <div class="rounded-lg border-2 border-red-200 bg-red-50 p-6 text-center">
          <p class="text-lg font-semibold text-red-800">
            {t()('progress.errors.loadFailed')}
          </p>
          <p class="mt-2 text-sm text-red-600">{String(err)}</p>
          <button
            onClick={() => window.location.reload()}
            class="mt-4 rounded-md bg-red-600 px-4 py-2 text-white hover:bg-red-700"
          >
            {t()('progress.errors.tryAgain')}
          </button>
        </div>
      )}
    >
      <div class="mx-auto max-w-7xl px-4 py-8">
        {/* Header */}
        <div class="mb-8">
          <h1 class="text-3xl font-bold text-gray-900">
            {t()('progress.dashboard.title')}
          </h1>
          <p class="mt-2 text-gray-600">
            {t()('progress.dashboard.subtitle')}
          </p>
        </div>

        <Suspense
          fallback={
            <div class="text-center py-12">
              <div class="inline-block h-12 w-12 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent"></div>
              <p class="mt-4 text-gray-600">{t()('progress.loading.progress')}</p>
            </div>
          }
        >
          {/* Practice Streak */}
          <Show when={streakData()}>
            {(data) => (
              <div class="mb-8 rounded-lg bg-gradient-to-r from-blue-500 to-purple-600 p-6 text-white shadow-lg">
                <div class="flex items-center justify-between">
                  <div>
                    <p class="text-sm font-medium opacity-90">
                      {t()('progress.sections.streak')}
                    </p>
                    <p class="mt-1 text-3xl font-bold">
                      {data().currentStreak > 0
                        ? t()('progress.streak.current', { count: data().currentStreak })
                        : t()('progress.streak.noStreak')}
                    </p>
                    <Show when={data().lastPracticeDate}>
                      <p class="mt-2 text-sm opacity-75">
                        {t()('progress.streak.lastPracticed', {
                          date: formatRelativeTime(data().lastPracticeDate!),
                        })}
                      </p>
                    </Show>
                  </div>
                  <div class="text-6xl">
                    {data().currentStreak >= 7 ? '🔥' : '⭐'}
                  </div>
                </div>
                <Show when={data().currentStreak > 0 && data().isAtRisk}>
                  <p class="mt-4 text-sm font-medium">
                    {t()('progress.streak.keepItGoing')}
                  </p>
                </Show>
                <Show when={data().currentStreak === 0}>
                  <p class="mt-4 text-sm font-medium">
                    {t()('progress.streak.practiceToday')}
                  </p>
                </Show>
              </div>
            )}
          </Show>

          {/* Competency Areas Grid */}
          <div class="mb-8">
            <h2 class="mb-4 text-2xl font-bold text-gray-900">
              {t()('progress.sections.competencies')}
            </h2>
            
            <Show
              when={dashboardData()?.competencies.length ?? 0 > 0}
              fallback={
                <div class="rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 p-8 text-center">
                  <p class="text-gray-600">{t()('progress.empty.noCompetencies')}</p>
                  <p class="mt-2 text-sm text-gray-500">
                    {t()('progress.empty.startPracticing')}
                  </p>
                </div>
              }
            >
              <div class="grid gap-6 md:grid-cols-2 lg:grid-cols-2">
                <For each={dashboardData()?.competencies}>
                  {(competency) => {
                    const band = () => getMasteryLevelBand(competency.masteryLevel);
                    const isExpanded = () => expandedCompetency() === competency.competencyAreaId;
                    
                    return (
                      <div class="rounded-lg border border-gray-200 bg-white shadow-sm transition-shadow hover:shadow-md">
                        {/* Competency Card Header */}
                        <div class="p-6">
                          <div class="flex items-start justify-between">
                            <div class="flex-1">
                              <h3 class="text-lg font-semibold text-gray-900">
                                {competency.competencyAreaId}
                              </h3>
                              <div class="mt-2 flex items-center gap-2">
                                <div class="flex-1">
                                  <div class="h-3 overflow-hidden rounded-full bg-gray-200">
                                    <div
                                      class="h-full transition-all duration-300"
                                      style={{
                                        width: `${competency.masteryLevel}%`,
                                        'background-color': band().colorCode === 'red' ? '#dc2626'
                                          : band().colorCode === 'yellow' ? '#fbbf24'
                                          : band().colorCode === 'light-green' ? '#86efac'
                                          : band().colorCode === 'green' ? '#16a34a'
                                          : '#3b82f6',
                                      }}
                                    />
                                  </div>
                                </div>
                                <span class="text-sm font-medium text-gray-700">
                                  {competency.masteryLevel}%
                                </span>
                              </div>
                              <div class="mt-3 flex items-center gap-2">
                                <span
                                  class="inline-block rounded-full px-3 py-1 text-xs font-medium text-white"
                                  style={{
                                    'background-color': band().colorCode === 'red' ? '#dc2626'
                                      : band().colorCode === 'yellow' ? '#fbbf24'
                                      : band().colorCode === 'light-green' ? '#86efac'
                                      : band().colorCode === 'green' ? '#16a34a'
                                      : '#3b82f6',
                                  }}
                                >
                                  {t()(`progress.masteryLevels.${band().level}`)}
                                </span>
                              </div>
                            </div>
                          </div>
                          
                          {/* Stats */}
                          <div class="mt-4 grid grid-cols-2 gap-4 text-sm">
                            <div>
                              <p class="text-gray-500">
                                {t()('progress.competencyCard.attemptsLabel')}
                              </p>
                              <p class="font-semibold text-gray-900">
                                {competency.totalAttempts}
                              </p>
                            </div>
                            <div>
                              <p class="text-gray-500">
                                {t()('progress.competencyCard.successRateLabel')}
                              </p>
                              <p class="font-semibold text-gray-900">
                                {competency.successRate.toFixed(1)}%
                              </p>
                            </div>
                          </div>
                          
                          <div class="mt-3 text-xs text-gray-500">
                            {t()('progress.competencyCard.lastPracticedLabel')}:{' '}
                            {formatRelativeTime(competency.lastPracticed)}
                          </div>
                          
                          {/* Toggle Skills Button */}
                          <button
                            onClick={() => toggleCompetency(competency.competencyAreaId)}
                            class="mt-4 w-full rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                            aria-expanded={isExpanded()}
                          >
                            {isExpanded()
                              ? t()('progress.competencyCard.hideSkills')
                              : t()('progress.competencyCard.viewSkills')}
                          </button>
                        </div>
                        
                        {/* Skills Breakdown */}
                        <Show when={isExpanded()}>
                          <div class="border-t border-gray-200 bg-gray-50 p-6">
                            <h4 class="mb-4 text-sm font-semibold text-gray-700">
                              {t()('progress.sections.skills')}
                            </h4>
                            <Show
                              when={getSkillsForCompetency(competency.competencyAreaId).length > 0}
                              fallback={
                                <p class="text-sm text-gray-500">
                                  {t()('progress.skillsBreakdown.noSkillsYet')}
                                </p>
                              }
                            >
                              <div class="space-y-3">
                                <For each={getSkillsForCompetency(competency.competencyAreaId)}>
                                  {(skill) => {
                                    const skillBand = () => getMasteryLevelBand(skill.masteryLevel);
                                    
                                    return (
                                      <div class="rounded-md bg-white p-3">
                                        <div class="flex items-center justify-between mb-2">
                                          <span class="text-sm font-medium text-gray-900">
                                            {skill.skillId}
                                          </span>
                                          <span class="text-sm text-gray-600">
                                            {skill.masteryLevel}%
                                          </span>
                                        </div>
                                        <div class="h-2 overflow-hidden rounded-full bg-gray-200">
                                          <div
                                            class="h-full transition-all duration-300"
                                            style={{
                                              width: `${skill.masteryLevel}%`,
                                              'background-color': skillBand().colorCode === 'red' ? '#dc2626'
                                                : skillBand().colorCode === 'yellow' ? '#fbbf24'
                                                : skillBand().colorCode === 'light-green' ? '#86efac'
                                                : skillBand().colorCode === 'green' ? '#16a34a'
                                                : '#3b82f6',
                                            }}
                                          />
                                        </div>
                                        <Show when={skill.nextReview}>
                                          <p class="mt-1 text-xs text-gray-500">
                                            {t()('progress.skillsBreakdown.nextReview', {
                                              date: formatReviewDate(skill.nextReview),
                                            })}
                                          </p>
                                        </Show>
                                      </div>
                                    );
                                  }}
                                </For>
                              </div>
                            </Show>
                          </div>
                        </Show>
                      </div>
                    );
                  }}
                </For>
              </div>
            </Show>
          </div>

          {/* Review Schedule */}
          <div>
            <h2 class="mb-4 text-2xl font-bold text-gray-900">
              {t()('progress.reviews.title')}
            </h2>
            
            <Suspense
              fallback={
                <div class="text-center py-8">
                  <p class="text-gray-600">{t()('progress.loading.reviews')}</p>
                </div>
              }
            >
              <Show
                when={reviewSchedule()?.total ?? 0 > 0}
                fallback={
                  <div class="rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 p-8 text-center">
                    <p class="text-gray-600">{t()('progress.reviews.noReviews')}</p>
                  </div>
                }
              >
                <div class="space-y-4">
                  {/* Overdue */}
                  <Show when={(reviewSchedule()?.overdue.length ?? 0) > 0}>
                    <div class="rounded-lg border-2 border-red-200 bg-red-50 p-4">
                      <h3 class="mb-3 text-sm font-semibold text-red-900">
                        {t()('progress.reviews.overdue')} ({reviewSchedule()?.overdue.length})
                      </h3>
                      <div class="space-y-2">
                        <For each={reviewSchedule()?.overdue}>
                          {(review) => (
                            <div class="flex items-center justify-between rounded-md bg-white p-3">
                              <div>
                                <p class="text-sm font-medium text-gray-900">{review.skillId}</p>
                                <p class="text-xs text-red-600">
                                  {t()('progress.reviews.overdueBy', { days: review.daysOverdue ?? 0 })}
                                </p>
                              </div>
                              <button class="rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700">
                                {t()('progress.reviews.practiceNow')}
                              </button>
                            </div>
                          )}
                        </For>
                      </div>
                    </div>
                  </Show>

                  {/* Due Today */}
                  <Show when={(reviewSchedule()?.today.length ?? 0) > 0}>
                    <div class="rounded-lg border border-yellow-200 bg-yellow-50 p-4">
                      <h3 class="mb-3 text-sm font-semibold text-yellow-900">
                        {t()('progress.reviews.dueToday')} ({reviewSchedule()?.today.length})
                      </h3>
                      <div class="space-y-2">
                        <For each={reviewSchedule()?.today}>
                          {(review) => (
                            <div class="flex items-center justify-between rounded-md bg-white p-3">
                              <div>
                                <p class="text-sm font-medium text-gray-900">{review.skillId}</p>
                                <p class="text-xs text-gray-600">
                                  {getMasteryLevelBand(review.masteryLevel).level}
                                </p>
                              </div>
                              <button class="rounded-md bg-yellow-600 px-4 py-2 text-sm font-medium text-white hover:bg-yellow-700">
                                {t()('progress.reviews.practiceNow')}
                              </button>
                            </div>
                          )}
                        </For>
                      </div>
                    </div>
                  </Show>

                  {/* This Week */}
                  <Show when={(reviewSchedule()?.thisWeek.length ?? 0) > 0}>
                    <div class="rounded-lg border border-blue-200 bg-blue-50 p-4">
                      <h3 class="mb-3 text-sm font-semibold text-blue-900">
                        {t()('progress.reviews.dueThisWeek')} ({reviewSchedule()?.thisWeek.length})
                      </h3>
                      <div class="space-y-2">
                        <For each={reviewSchedule()?.thisWeek}>
                          {(review) => (
                            <div class="flex items-center justify-between rounded-md bg-white p-3">
                              <div>
                                <p class="text-sm font-medium text-gray-900">{review.skillId}</p>
                                <p class="text-xs text-gray-600">
                                  {t()('progress.reviews.dueOn', {
                                    date: formatReviewDate(review.nextReviewAt),
                                  })}
                                </p>
                              </div>
                            </div>
                          )}
                        </For>
                      </div>
                    </div>
                  </Show>
                </div>
              </Show>
            </Suspense>
          </div>
        </Suspense>
      </div>
    </ErrorBoundary>
  );
};

export default ProgressDashboard;

