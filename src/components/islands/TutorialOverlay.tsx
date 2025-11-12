/**
 * TutorialOverlay Component
 *
 * SolidJS island component for displaying an optional tutorial overlay
 * that explains how to use the practice platform. Dismissible and navigable.
 *
 * Requirements:
 * - 14.5: Optional dismissible tutorial overlay
 */

import { createSignal, For, Show, onMount, type JSX } from "solid-js";
import { useStore } from "@nanostores/solid";
import { $t } from "@/lib/i18n";

export interface TutorialOverlayProps {
  /** Whether to show the tutorial on mount */
  show?: boolean;
  /** Callback when tutorial is completed or dismissed */
  onComplete: () => void;
  /** Optional CSS class for styling */
  class?: string;
}

interface TutorialStep {
  number: number;
  titleKey: string;
  descriptionKey: string;
  icon: () => JSX.Element;
}

const tutorialSteps: TutorialStep[] = [
  {
    number: 1,
    titleKey: "onboarding.tutorial.steps.1.title",
    descriptionKey: "onboarding.tutorial.steps.1.description",
    icon: () => (
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
          d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
        />
      </svg>
    ),
  },
  {
    number: 2,
    titleKey: "onboarding.tutorial.steps.2.title",
    descriptionKey: "onboarding.tutorial.steps.2.description",
    icon: () => (
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
          d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      </svg>
    ),
  },
  {
    number: 3,
    titleKey: "onboarding.tutorial.steps.3.title",
    descriptionKey: "onboarding.tutorial.steps.3.description",
    icon: () => (
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
          d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
        />
      </svg>
    ),
  },
  {
    number: 4,
    titleKey: "onboarding.tutorial.steps.4.title",
    descriptionKey: "onboarding.tutorial.steps.4.description",
    icon: () => (
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
          d="M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071c3.904-3.905 10.236-3.905 14.141 0M1.394 9.393c5.857-5.857 15.355-5.857 21.213 0"
        />
      </svg>
    ),
  },
];

/**
 * TutorialOverlay - Shows tutorial steps in an overlay
 *
 * Displays a multi-step tutorial explaining how to use the platform.
 * Users can navigate between steps, skip, or complete the tutorial.
 *
 * @example
 * ```tsx
 * <TutorialOverlay
 *   show={true}
 *   onComplete={() => console.log('Tutorial completed')}
 * />
 * ```
 */
export default function TutorialOverlay(props: TutorialOverlayProps) {
  const t = useStore($t);
  const [visible, setVisible] = createSignal(props.show ?? true);
  const [currentStep, setCurrentStep] = createSignal(0);

  // Trap focus within the overlay when visible
  onMount(() => {
    if (visible()) {
      // Find first focusable element
      const overlay = document.querySelector('[role="dialog"]');
      if (overlay) {
        const focusable = overlay.querySelector("button");
        if (focusable) {
          (focusable as HTMLElement).focus();
        }
      }
    }
  });

  const handleNext = () => {
    if (currentStep() < tutorialSteps.length - 1) {
      setCurrentStep(currentStep() + 1);
    } else {
      handleComplete();
    }
  };

  const handlePrevious = () => {
    if (currentStep() > 0) {
      setCurrentStep(currentStep() - 1);
    }
  };

  const handleSkip = () => {
    setVisible(false);
    props.onComplete();
  };

  const handleComplete = () => {
    setVisible(false);
    props.onComplete();
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === "Escape") {
      handleSkip();
    } else if (e.key === "ArrowRight") {
      handleNext();
    } else if (e.key === "ArrowLeft") {
      handlePrevious();
    }
  };

  return (
    <Show when={visible()}>
      <div
        class="tutorial-overlay fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50 animate-fadeIn"
        role="dialog"
        aria-modal="true"
        aria-labelledby="tutorial-title"
        onKeyDown={handleKeyDown}
      >
        {/* Tutorial Card */}
        <div
          class={`tutorial-card bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto ${props.class || ""}`}
        >
          {/* Header */}
          <div class="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 rounded-t-xl">
            <div class="flex items-center justify-between">
              <h2
                id="tutorial-title"
                class="text-2xl font-bold text-gray-900"
              >
                {t()("onboarding.tutorial.title")}
              </h2>
              <button
                type="button"
                onClick={handleSkip}
                class="text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-lg p-2"
                aria-label={t()("common.actions.close")}
              >
                <svg
                  class="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            {/* Progress Indicator */}
            <div class="flex gap-2 mt-4">
              <For each={tutorialSteps}>
                {(_, index) => (
                  <div
                    class={`h-2 flex-1 rounded-full transition-all duration-300 ${
                      index() <= currentStep()
                        ? "bg-blue-600"
                        : "bg-gray-200"
                    }`}
                    aria-hidden="true"
                  />
                )}
              </For>
            </div>
          </div>

          {/* Step Content */}
          <div class="p-8">
            <For each={tutorialSteps}>
              {(step, index) => (
                <Show when={currentStep() === index()}>
                  <div class="text-center animate-fadeIn">
                    {/* Icon */}
                    <div
                      class="flex justify-center mb-6 text-blue-600"
                      aria-hidden="true"
                    >
                      {step.icon()}
                    </div>

                    {/* Step Number */}
                    <div class="text-sm font-semibold text-blue-600 mb-2">
                      {t()("onboarding.progress.stepOf", {
                        current: step.number.toString(),
                        total: tutorialSteps.length.toString(),
                      })}
                    </div>

                    {/* Title */}
                    <h3 class="text-2xl font-bold text-gray-900 mb-4">
                      {t()(step.titleKey)}
                    </h3>

                    {/* Description */}
                    <p class="text-lg text-gray-600 leading-relaxed">
                      {t()(step.descriptionKey)}
                    </p>
                  </div>
                </Show>
              )}
            </For>
          </div>

          {/* Footer */}
          <div class="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-6 py-4 rounded-b-xl">
            <div class="flex items-center justify-between gap-4">
              {/* Skip Button */}
              <button
                type="button"
                onClick={handleSkip}
                class="px-4 py-2 text-gray-600 hover:text-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-400 rounded-lg transition-colors duration-200 min-h-44px"
              >
                {t()("onboarding.tutorial.skip")}
              </button>

              {/* Navigation Buttons */}
              <div class="flex gap-3">
                {/* Previous Button */}
                <Show when={currentStep() > 0}>
                  <button
                    type="button"
                    onClick={handlePrevious}
                    class="px-6 py-2 bg-white border-2 border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-4 focus:ring-gray-300 transition-all duration-200 min-h-44px"
                  >
                    {t()("onboarding.tutorial.previous")}
                  </button>
                </Show>

                {/* Next/Done Button */}
                <button
                  type="button"
                  onClick={handleNext}
                  class="px-6 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-300 transition-all duration-200 min-h-44px"
                >
                  {currentStep() === tutorialSteps.length - 1
                    ? t()("onboarding.tutorial.done")
                    : t()("onboarding.tutorial.next")}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Show>
  );
}
