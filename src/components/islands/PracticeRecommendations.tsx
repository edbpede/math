/**
 * Practice Recommendations Component
 *
 * SolidJS island that displays personalized practice recommendations based on:
 * - SRS (spaced repetition) review schedule
 * - Overdue reviews that need attention
 * - Skills due today
 * - Suggested new content to explore
 *
 * Requirements:
 * - 15.2: Add recommended practice suggestions
 * - 5.6: SRS-based session composition
 * - Task 15.2: Returning user flow with recommendations
 */

import {
  createResource,
  Show,
  For,
  ErrorBoundary,
  Suspense,
  type Component,
} from "solid-js";
import { useStore } from "@nanostores/solid";
import { $t } from "@/lib/i18n";
import type { GradeRange } from "@/lib/curriculum/types";
import {
  getUpcomingReviews,
  type ReviewSchedule,
} from "@/lib/mastery/review-scheduler";

/**
 * Props for PracticeRecommendations component
 */
export interface PracticeRecommendationsProps {
  /** User UUID */
  userId: string;
  /** User's current grade range */
  gradeRange: GradeRange;
  /** Maximum number of recommendations to show */
  maxRecommendations?: number;
}

/**
 * Recommendation action item
 */
interface RecommendationItem {
  id: string;
  title: string;
  description: string;
  urgency: "high" | "medium" | "low";
  actionUrl: string;
  actionLabel: string;
  icon: "overdue" | "today" | "new" | "continue";
}

/**
 * Practice Recommendations Component
 *
 * Shows personalized practice suggestions based on SRS and user progress.
 * Highlights overdue reviews, today's practice, and new content to explore.
 *
 * @example
 * ```tsx
 * <PracticeRecommendations
 *   userId={user.id}
 *   gradeRange="4-6"
 *   maxRecommendations={3}
 * />
 * ```
 */
const PracticeRecommendations: Component<PracticeRecommendationsProps> = (
  props,
) => {
  const t = useStore($t);

  // Fetch review schedule
  const [reviewSchedule] = createResource<ReviewSchedule>(async () => {
    return await getUpcomingReviews(props.userId, 20);
  });

  /**
   * Generate recommendation items from review schedule
   */
  const recommendations = (): RecommendationItem[] => {
    const schedule = reviewSchedule();
    if (!schedule) return [];

    const items: RecommendationItem[] = [];
    const maxRecs = props.maxRecommendations ?? 3;

    // 1. Overdue reviews (highest priority)
    if (schedule.overdue.length > 0) {
      const count = schedule.overdue.length;
      const firstSkill = schedule.overdue[0];
      const competencyId = firstSkill.competencyAreaId || "tal-og-algebra";

      items.push({
        id: "overdue",
        title:
          count === 1
            ? t()("progress.recommendations.overdueReviews", { count })
            : t()("progress.recommendations.overdueReviewsPlural", { count }),
        description: t()("progress.recommendations.reviewReady"),
        urgency: "high",
        actionUrl: `/practice/${competencyId}`,
        actionLabel: t()("progress.recommendations.practiceNow"),
        icon: "overdue",
      });
    }

    // 2. Reviews due today (medium priority)
    if (schedule.today.length > 0 && items.length < maxRecs) {
      const count = schedule.today.length;
      const firstSkill = schedule.today[0];
      const competencyId = firstSkill.competencyAreaId || "tal-og-algebra";

      items.push({
        id: "today",
        title:
          count === 1
            ? t()("progress.recommendations.todayReviews", { count })
            : t()("progress.recommendations.todayReviewsPlural", { count }),
        description: t()("progress.recommendations.reviewReady"),
        urgency: "medium",
        actionUrl: `/practice/${competencyId}`,
        actionLabel: t()("progress.recommendations.practiceNow"),
        icon: "today",
      });
    }

    // 3. Suggest new content if no reviews or space remaining
    if (items.length < maxRecs) {
      // Find least practiced competency area to suggest
      const competencyId = suggestNewCompetency();

      items.push({
        id: "new-content",
        title: t()("progress.recommendations.exploreNew"),
        description: t()("progress.recommendations.newContent"),
        urgency: "low",
        actionUrl: `/practice/${competencyId}`,
        actionLabel: t()("progress.recommendations.practiceNow"),
        icon: "new",
      });
    }

    return items.slice(0, maxRecs);
  };

  /**
   * Suggest a competency area for new content
   * For now, returns a default - can be enhanced with actual logic
   */
  const suggestNewCompetency = (): string => {
    // TODO: Base on actual user progress data
    // For now, default to "Tal og Algebra" as most fundamental
    return "tal-og-algebra";
  };

  /**
   * Get icon component based on type
   */
  const getIcon = (type: RecommendationItem["icon"]) => {
    switch (type) {
      case "overdue":
        return (
          <svg
            class="h-6 w-6"
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
        );
      case "today":
        return (
          <svg
            class="h-6 w-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
        );
      case "new":
        return (
          <svg
            class="h-6 w-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M12 6v6m0 0v6m0-6h6m-6 0H6"
            />
          </svg>
        );
      case "continue":
        return (
          <svg
            class="h-6 w-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"
            />
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        );
    }
  };

  /**
   * Get color classes based on urgency
   */
  const getUrgencyColors = (urgency: RecommendationItem["urgency"]) => {
    switch (urgency) {
      case "high":
        return {
          bg: "bg-red-50",
          border: "border-red-200",
          icon: "text-red-600",
          button: "bg-red-600 hover:bg-red-700 text-white",
        };
      case "medium":
        return {
          bg: "bg-orange-50",
          border: "border-orange-200",
          icon: "text-orange-600",
          button: "bg-orange-600 hover:bg-orange-700 text-white",
        };
      case "low":
        return {
          bg: "bg-blue-50",
          border: "border-blue-200",
          icon: "text-blue-600",
          button: "bg-blue-600 hover:bg-blue-700 text-white",
        };
    }
  };

  return (
    <ErrorBoundary
      fallback={() => (
        <div class="rounded-lg border-2 border-red-200 bg-red-50 p-4">
          <p class="text-sm text-red-800">
            {t()("progress.errors.loadFailed")}
          </p>
        </div>
      )}
    >
      <div class="practice-recommendations">
        {/* Header */}
        <div class="mb-4">
          <h2 class="text-2xl font-bold text-gray-900">
            {t()("progress.recommendations.title")}
          </h2>
          <p class="text-sm text-gray-600">
            {t()("progress.recommendations.subtitle")}
          </p>
        </div>

        <Suspense
          fallback={
            <div class="space-y-4">
              {Array.from({ length: 2 }).map(() => (
                <div class="h-32 animate-pulse rounded-lg bg-gray-200" />
              ))}
            </div>
          }
        >
          <Show
            when={recommendations().length > 0}
            fallback={
              <div class="rounded-lg border-2 border-green-200 bg-green-50 p-6 text-center">
                <div class="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
                  <svg
                    class="h-6 w-6 text-green-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                </div>
                <p class="text-lg font-semibold text-green-900">
                  {t()("progress.recommendations.noDue")}
                </p>
              </div>
            }
          >
            <div class="space-y-4">
              <For each={recommendations()}>
                {(item) => {
                  const colors = getUrgencyColors(item.urgency);

                  return (
                    <div
                      class={`recommendation-card rounded-lg border-2 p-6 transition-shadow hover:shadow-md ${colors.bg} ${colors.border}`}
                      role="article"
                      aria-labelledby={`rec-${item.id}-title`}
                    >
                      <div class="flex items-start gap-4">
                        {/* Icon */}
                        <div
                          class={`flex-shrink-0 ${colors.icon}`}
                          aria-hidden="true"
                        >
                          {getIcon(item.icon)}
                        </div>

                        {/* Content */}
                        <div class="flex-1">
                          <h3
                            id={`rec-${item.id}-title`}
                            class="mb-1 text-lg font-semibold text-gray-900"
                          >
                            {item.title}
                          </h3>
                          <p class="mb-3 text-sm text-gray-700">
                            {item.description}
                          </p>

                          {/* Action Button */}
                          <a
                            href={item.actionUrl}
                            class={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition-colors focus:outline-none focus:ring-4 focus:ring-offset-2 ${colors.button}`}
                            aria-label={`${item.actionLabel} - ${item.title}`}
                          >
                            {item.actionLabel}
                            <svg
                              class="h-4 w-4"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                              aria-hidden="true"
                            >
                              <path
                                stroke-linecap="round"
                                stroke-linejoin="round"
                                stroke-width="2"
                                d="M9 5l7 7-7 7"
                              />
                            </svg>
                          </a>
                        </div>
                      </div>
                    </div>
                  );
                }}
              </For>
            </div>
          </Show>
        </Suspense>
      </div>
    </ErrorBoundary>
  );
};

export default PracticeRecommendations;
