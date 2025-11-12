/**
 * GradeSelector Component
 *
 * SolidJS island component for selecting grade range during onboarding.
 * Displays three clear options for grade levels with descriptions.
 *
 * Requirements:
 * - 14.3: Three clear grade level options with brief descriptions
 */

import { createSignal, For } from "solid-js";
import { useStore } from "@nanostores/solid";
import { $t } from "@/lib/i18n";
import type { GradeRange } from "@/lib/curriculum/types";

export interface GradeSelectorProps {
  /** Currently selected grade range */
  selectedGrade?: GradeRange;
  /** Callback when grade is selected */
  onSelect: (gradeRange: GradeRange) => void;
  /** Optional CSS class for styling */
  class?: string;
}

const gradeOptions: GradeRange[] = ["0-3", "4-6", "7-9"];

/**
 * GradeSelector - Interactive grade range selection component
 *
 * Provides clear visual cards for selecting grade level (0-3, 4-6, 7-9)
 * with descriptions appropriate to Danish school system.
 *
 * @example
 * ```tsx
 * <GradeSelector
 *   selectedGrade="4-6"
 *   onSelect={(grade) => console.log('Selected:', grade)}
 * />
 * ```
 */
export default function GradeSelector(props: GradeSelectorProps) {
  const t = useStore($t);
  const [selected, setSelected] = createSignal<GradeRange | undefined>(
    props.selectedGrade
  );

  const handleSelect = (grade: GradeRange) => {
    setSelected(grade);
    props.onSelect(grade);
  };

  return (
    <div
      class={`grade-selector ${props.class || ""}`}
      role="radiogroup"
      aria-label={t()("onboarding.gradeSelection.title")}
    >
      <div class="grid grid-cols-1 gap-4 md:grid-cols-3">
        <For each={gradeOptions}>
          {(grade) => {
            const isSelected = () => selected() === grade;
            const gradeKey = grade as "0-3" | "4-6" | "7-9";

            return (
              <button
                type="button"
                onClick={() => handleSelect(grade)}
                class={`grade-card group relative flex flex-col items-center p-6 rounded-lg border-3 transition-all duration-200 focus:outline-none focus:ring-4 focus:ring-blue-300 min-h-44px ${
                  isSelected()
                    ? "border-blue-600 bg-blue-50 shadow-lg"
                    : "border-gray-300 bg-white hover:border-blue-400 hover:bg-blue-50 shadow-md hover:shadow-lg"
                }`}
                role="radio"
                aria-checked={isSelected()}
                aria-label={`${t()(`onboarding.gradeSelection.grades.${gradeKey}.label`)} - ${t()(`onboarding.gradeSelection.grades.${gradeKey}.description`)}`}
              >
                {/* Selection Indicator */}
                <div
                  class={`absolute top-4 right-4 w-6 h-6 rounded-full border-2 transition-all duration-200 ${
                    isSelected()
                      ? "border-blue-600 bg-blue-600"
                      : "border-gray-300 bg-white group-hover:border-blue-400"
                  }`}
                  aria-hidden="true"
                >
                  {isSelected() && (
                    <svg
                      class="w-4 h-4 text-white mx-auto mt-0.5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="3"
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  )}
                </div>

                {/* Grade Icon */}
                <div
                  class={`mb-4 ${isSelected() ? "text-blue-600" : "text-gray-500 group-hover:text-blue-500"}`}
                  aria-hidden="true"
                >
                  <svg
                    class="w-16 h-16"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                    />
                  </svg>
                </div>

                {/* Grade Label */}
                <div
                  class={`text-xl font-bold mb-2 ${isSelected() ? "text-blue-900" : "text-gray-900"}`}
                >
                  {t()(`onboarding.gradeSelection.grades.${gradeKey}.label`)}
                </div>

                {/* Grade Description */}
                <div
                  class={`text-sm text-center ${isSelected() ? "text-blue-700" : "text-gray-600"}`}
                >
                  {t()(`onboarding.gradeSelection.grades.${gradeKey}.description`)}
                </div>
              </button>
            );
          }}
        </For>
      </div>
    </div>
  );
}
