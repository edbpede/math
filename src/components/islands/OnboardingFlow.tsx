/**
 * OnboardingFlow Component
 *
 * Main orchestrator for the onboarding flow. Manages state transitions
 * between welcome, UUID generation, grade selection, competency intro,
 * and tutorial steps.
 *
 * Requirements:
 * - 14.1-14.5: Complete onboarding flow management
 */

import { createSignal, Show } from "solid-js";
import { useStore } from "@nanostores/solid";
import { $t, $locale } from "@/lib/i18n";
import type { GradeRange, CompetencyAreaId } from "@/lib/curriculum/types";
import UUIDGenerator from "./UUIDGenerator";
import GradeSelector from "./GradeSelector";
import CompetencyAreaIntro from "./CompetencyAreaIntro";
import TutorialOverlay from "./TutorialOverlay";
import LanguageSelector from "./LanguageSelector";
import { ErrorBoundaryWrapper } from "./ErrorBoundary";

type OnboardingStep =
  | "welcome"
  | "uuid"
  | "grade"
  | "competency"
  | "tutorial";

/**
 * OnboardingFlow Component (Internal)
 *
 * Guides new users through account creation, preference selection,
 * and introduction to the platform features.
 *
 * Flow:
 * 1. Welcome screen
 * 2. UUID generation
 * 3. Grade selection
 * 4. Competency introduction
 * 5. Tutorial (optional)
 * 6. Redirect to practice session
 *
 * Note: This is the internal component. Use the default export which
 * includes error boundary protection.
 */
const OnboardingFlowComponent = () => {
  const t = useStore($t);
  const locale = useStore($locale);
  const [currentStep, setCurrentStep] = createSignal<OnboardingStep>("welcome");
  const [generatedUUID, setGeneratedUUID] = createSignal<string | null>(null);
  const [selectedGrade, setSelectedGrade] = createSignal<GradeRange | null>(
    null
  );
  const [selectedCompetency, setSelectedCompetency] =
    createSignal<CompetencyAreaId | null>(null);
  const [showTutorial, setShowTutorial] = createSignal(false);
  const [isAuthenticating, setIsAuthenticating] = createSignal(false);

  // Progress tracking
  const totalSteps = 5;
  const stepNumbers: Record<OnboardingStep, number> = {
    welcome: 1,
    uuid: 2,
    grade: 3,
    competency: 4,
    tutorial: 5,
  };

  const currentStepNumber = () => stepNumbers[currentStep()];

  // Step navigation handlers
  const handleWelcomeNext = () => {
    setCurrentStep("uuid");
  };

  const handleUUIDGenerated = (uuid: string) => {
    setGeneratedUUID(uuid);
  };

  const handleUUIDNext = async () => {
    if (!generatedUUID()) return;

    // Authenticate with the generated UUID
    setIsAuthenticating(true);
    try {
      const response = await fetch("/api/auth/signin", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          uuid: generatedUUID(),
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        // Move to grade selection
        setCurrentStep("grade");
      } else {
        console.error("Authentication failed:", data.error);
        // TODO: Show error message
      }
    } catch (error) {
      console.error("Authentication error:", error);
      // TODO: Show error message
    } finally {
      setIsAuthenticating(false);
    }
  };

  const handleGradeSelected = async (grade: GradeRange) => {
    setSelectedGrade(grade);

    // Update user's grade range
    try {
      const response = await fetch("/api/auth/update-grade", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          gradeRange: grade,
        }),
      });

      if (response.ok) {
        // Move to competency introduction
        setCurrentStep("competency");
      }
    } catch (error) {
      console.error("Failed to update grade:", error);
      // Still proceed even if update fails
      setCurrentStep("competency");
    }
  };

  const handleCompetencySelected = (competencyId: CompetencyAreaId) => {
    setSelectedCompetency(competencyId);
    // Show tutorial before starting practice
    setShowTutorial(true);
    setCurrentStep("tutorial");
  };

  const handleTutorialComplete = () => {
    setShowTutorial(false);
    // Redirect to practice session
    if (selectedCompetency()) {
      window.location.href = `/practice/${selectedCompetency()}`;
    }
  };

  const handleSkipTutorial = () => {
    setShowTutorial(false);
    // Redirect to dashboard instead
    window.location.href = "/dashboard";
  };

  return (
    <div class="onboarding-flow">
      {/* Header with Language Selector */}
      <div class="w-full bg-white border-b border-gray-200 sticky top-0 z-40">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div class="flex justify-between items-center">
            {/* Logo/Title */}
            <div class="flex items-center gap-3">
              <svg
                class="w-8 h-8 text-blue-600"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                aria-hidden="true"
              >
                <path d="M12 2L2 7l10 5 10-5-10-5z" />
                <path d="M2 17l10 5 10-5" />
                <path d="M2 12l10 5 10-5" />
              </svg>
              <h1 class="text-xl font-bold text-gray-900 sm:text-2xl">
                {t()("common.app.title")}
              </h1>
            </div>

            {/* Language Selector */}
            <div class="flex-shrink-0">
              <LanguageSelector variant="compact" layout="horizontal" />
            </div>
          </div>

          {/* Progress Bar */}
          <Show when={currentStep() !== "tutorial"}>
            <div class="mt-4">
              <div class="flex items-center justify-between mb-2">
                <span class="text-sm font-medium text-gray-700">
                  {t()("onboarding.steps." + currentStep())}
                </span>
                <span class="text-sm text-gray-500">
                  {t()("onboarding.progress.stepOf", {
                    current: currentStepNumber().toString(),
                    total: (totalSteps - 1).toString(), // Exclude tutorial from count
                  })}
                </span>
              </div>
              <div class="w-full bg-gray-200 rounded-full h-2">
                <div
                  class="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{
                    width: `${(currentStepNumber() / (totalSteps - 1)) * 100}%`,
                  }}
                  role="progressbar"
                  aria-valuenow={currentStepNumber()}
                  aria-valuemin={1}
                  aria-valuemax={totalSteps - 1}
                />
              </div>
            </div>
          </Show>
        </div>
      </div>

      {/* Main Content */}
      <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Welcome Step */}
        <Show when={currentStep() === "welcome"}>
          <div class="text-center max-w-2xl mx-auto animate-fadeIn">
            <h2 class="text-4xl font-bold text-gray-900 mb-4">
              {t()("onboarding.welcome.title")}
            </h2>
            <p class="text-xl text-gray-600 mb-8">
              {t()("onboarding.welcome.subtitle")}
            </p>
            <p class="text-md text-gray-500 mb-12">
              {t()("onboarding.welcome.description")}
            </p>

            <button
              type="button"
              onClick={handleWelcomeNext}
              class="px-8 py-4 bg-blue-600 text-white text-lg font-semibold rounded-lg shadow-lg hover:bg-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-300 transition-all duration-200 active:bg-blue-800 min-h-44px"
            >
              {t()("common.actions.next")}
            </button>
          </div>
        </Show>

        {/* UUID Generation Step */}
        <Show when={currentStep() === "uuid"}>
          <div class="animate-fadeIn">
            <div class="text-center mb-8">
              <h2 class="text-3xl font-bold text-gray-900 mb-4">
                {t()("onboarding.steps.uuid")}
              </h2>
              <p class="text-lg text-gray-600">
                {t()("auth.uuid.description")}
              </p>
            </div>

            <UUIDGenerator
              gradeRange="0-3" // Default, will be updated in next step
              locale={locale()}
              autoGenerate={true}
              onComplete={handleUUIDGenerated}
            />

            <Show when={generatedUUID()}>
              <div class="text-center mt-8">
                <button
                  type="button"
                  onClick={handleUUIDNext}
                  disabled={isAuthenticating()}
                  class="px-8 py-4 bg-blue-600 text-white text-lg font-semibold rounded-lg shadow-lg hover:bg-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-300 transition-all duration-200 active:bg-blue-800 disabled:opacity-50 disabled:cursor-not-allowed min-h-44px"
                >
                  {isAuthenticating()
                    ? t()("common.status.loading")
                    : t()("common.actions.next")}
                </button>
              </div>
            </Show>
          </div>
        </Show>

        {/* Grade Selection Step */}
        <Show when={currentStep() === "grade"}>
          <div class="animate-fadeIn">
            <div class="text-center mb-8">
              <h2 class="text-3xl font-bold text-gray-900 mb-4">
                {t()("onboarding.gradeSelection.title")}
              </h2>
              <p class="text-lg text-gray-600">
                {t()("onboarding.gradeSelection.subtitle")}
              </p>
            </div>

            <GradeSelector onSelect={handleGradeSelected} />
          </div>
        </Show>

        {/* Competency Introduction Step */}
        <Show when={currentStep() === "competency"}>
          <div class="animate-fadeIn">
            <div class="text-center mb-8">
              <h2 class="text-3xl font-bold text-gray-900 mb-4">
                {t()("onboarding.competencyIntro.title")}
              </h2>
              <p class="text-lg text-gray-600">
                {t()("onboarding.competencyIntro.subtitle")}
              </p>
            </div>

            <Show when={selectedGrade()}>
              <CompetencyAreaIntro
                gradeRange={selectedGrade()!}
                onSelect={handleCompetencySelected}
              />
            </Show>

            {/* Option to skip and go to dashboard */}
            <div class="text-center mt-8">
              <button
                type="button"
                onClick={handleSkipTutorial}
                class="text-gray-600 hover:text-gray-800 underline focus:outline-none focus:ring-2 focus:ring-gray-400 rounded px-2 py-1"
              >
                {t()("common.actions.skip")} - Go to dashboard
              </button>
            </div>
          </div>
        </Show>

        {/* Tutorial Step */}
        <Show when={currentStep() === "tutorial"}>
          <TutorialOverlay
            show={showTutorial()}
            onComplete={handleTutorialComplete}
          />
        </Show>
      </div>
    </div>
  );
};

/**
 * OnboardingFlow wrapped with ErrorBoundary
 *
 * Default export includes error boundary for robust error handling.
 */
export default function OnboardingFlow() {
  return (
    <ErrorBoundaryWrapper
      componentName="OnboardingFlow"
      errorMessageKey="errors.onboarding.failed"
    >
      <OnboardingFlowComponent />
    </ErrorBoundaryWrapper>
  );
}
