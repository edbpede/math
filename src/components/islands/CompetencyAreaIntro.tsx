/**
 * CompetencyAreaIntro Component
 *
 * SolidJS island component for introducing competency areas during onboarding.
 * Displays four competency area cards with icons, descriptions, and recommendations.
 *
 * Requirements:
 * - 14.4: Four competency area cards with icons and descriptions
 */

import { createSignal, For, Show, type JSX } from "solid-js";
import { useStore } from "@nanostores/solid";
import { $t } from "@/lib/i18n";
import type { CompetencyAreaId, GradeRange } from "@/lib/curriculum/types";

export interface CompetencyAreaIntroProps {
  /** User's selected grade range for recommendations */
  gradeRange: GradeRange;
  /** Callback when competency area is selected */
  onSelect: (competencyId: CompetencyAreaId) => void;
  /** Optional CSS class for styling */
  class?: string;
}

interface CompetencyAreaOption {
  id: CompetencyAreaId;
  nameKey: string;
  descriptionKey: string;
  icon: () => JSX.Element;
  isBinding: boolean;
  recommendedGrades: GradeRange[];
}

const competencyAreas: CompetencyAreaOption[] = [
  {
    id: "matematiske-kompetencer",
    nameKey: "competencies.matematiske-kompetencer.name",
    descriptionKey: "competencies.matematiske-kompetencer.description",
    isBinding: true,
    recommendedGrades: ["0-3", "4-6", "7-9"],
    icon: () => (
      <svg
        class="w-12 h-12"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
        />
      </svg>
    ),
  },
  {
    id: "tal-og-algebra",
    nameKey: "competencies.tal-og-algebra.name",
    descriptionKey: "competencies.tal-og-algebra.description",
    isBinding: true,
    recommendedGrades: ["0-3", "4-6", "7-9"],
    icon: () => (
      <svg
        class="w-12 h-12"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14"
        />
      </svg>
    ),
  },
  {
    id: "geometri-og-maling",
    nameKey: "competencies.geometri-og-maling.name",
    descriptionKey: "competencies.geometri-og-maling.description",
    isBinding: true,
    recommendedGrades: ["0-3", "4-6", "7-9"],
    icon: () => (
      <svg
        class="w-12 h-12"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3"
        />
      </svg>
    ),
  },
  {
    id: "statistik-og-sandsynlighed",
    nameKey: "competencies.statistik-og-sandsynlighed.name",
    descriptionKey: "competencies.statistik-og-sandsynlighed.description",
    isBinding: false,
    recommendedGrades: ["4-6", "7-9"],
    icon: () => (
      <svg
        class="w-12 h-12"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
        />
      </svg>
    ),
  },
];

/**
 * CompetencyAreaIntro - Displays competency areas for selection
 *
 * Shows all four competency areas with visual cards, descriptions,
 * and recommendations based on user's grade level.
 *
 * @example
 * ```tsx
 * <CompetencyAreaIntro
 *   gradeRange="4-6"
 *   onSelect={(id) => console.log('Selected:', id)}
 * />
 * ```
 */
export default function CompetencyAreaIntro(props: CompetencyAreaIntroProps) {
  const t = useStore($t);
  const [hoveredCard, setHoveredCard] = createSignal<CompetencyAreaId | null>(
    null
  );

  const isRecommended = (area: CompetencyAreaOption): boolean => {
    return area.recommendedGrades.includes(props.gradeRange);
  };

  return (
    <div class={`competency-intro ${props.class || ""}`}>
      <div class="grid grid-cols-1 gap-6 sm:grid-cols-2">
        <For each={competencyAreas}>
          {(area) => {
            const recommended = isRecommended(area);
            const isHovered = () => hoveredCard() === area.id;

            return (
              <article
                class={`competency-card group relative bg-white rounded-lg border-2 shadow-md transition-all duration-200 hover:shadow-xl hover:border-blue-400 ${
                  isHovered() ? "border-blue-400" : "border-gray-300"
                }`}
                onMouseEnter={() => setHoveredCard(area.id)}
                onMouseLeave={() => setHoveredCard(null)}
              >
                {/* Recommended Badge */}
                <Show when={recommended}>
                  <div class="absolute -top-3 -right-3 z-10">
                    <div class="px-3 py-1 bg-green-500 text-white text-xs font-bold rounded-full shadow-md">
                      {t()("onboarding.competencyIntro.recommended")}
                    </div>
                  </div>
                </Show>

                {/* Binding/Advisory Badge */}
                <div class="absolute top-3 left-3">
                  <div
                    class={`px-2 py-1 text-xs font-semibold rounded ${
                      area.isBinding
                        ? "bg-blue-100 text-blue-800"
                        : "bg-gray-100 text-gray-700"
                    }`}
                  >
                    {area.isBinding
                      ? t()("onboarding.competencyIntro.badge.binding")
                      : t()("onboarding.competencyIntro.badge.advisory")}
                  </div>
                </div>

                {/* Card Content */}
                <button
                  type="button"
                  onClick={() => props.onSelect(area.id)}
                  class="w-full p-6 pt-10 text-left focus:outline-none focus:ring-4 focus:ring-blue-300 rounded-lg min-h-44px"
                  aria-label={`${t()(area.nameKey)} - ${t()(area.descriptionKey)}`}
                >
                  {/* Icon */}
                  <div
                    class="flex justify-center mb-4 text-blue-600 group-hover:text-blue-700"
                    aria-hidden="true"
                  >
                    {area.icon()}
                  </div>

                  {/* Title */}
                  <h3 class="text-lg font-bold text-gray-900 mb-2 text-center group-hover:text-blue-700">
                    {t()(area.nameKey)}
                  </h3>

                  {/* Description */}
                  <p class="text-sm text-gray-600 text-center leading-relaxed">
                    {t()(area.descriptionKey)}
                  </p>

                  {/* Hover Indicator */}
                  <div class="mt-4 text-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                    <span class="text-sm font-semibold text-blue-600">
                      {t()("common.actions.start")} →
                    </span>
                  </div>
                </button>
              </article>
            );
          }}
        </For>
      </div>
    </div>
  );
}
