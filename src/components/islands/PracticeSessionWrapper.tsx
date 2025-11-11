/**
 * PracticeSessionWrapper Component
 *
 * SolidJS island component that orchestrates the complete practice session flow.
 * Manages state transitions between setup → practicing → summary, handles
 * exercise batch generation, tracks progress, and persists data to database.
 *
 * Requirements:
 * - 14.5: Begin first practice session with easier problems (difficulty A)
 * - 12.4: Batch updates for performance
 * - 8.1: Validate answer and display feedback within 1 second
 */

import { createSignal, createMemo, Match, Switch } from "solid-js";
import type {
  CompetencyAreaId,
  GradeRange,
  Difficulty,
} from "@/lib/curriculum/types";
import type { ExerciseInstance } from "@/lib/exercises/types";
import type { Locale } from "@/lib/i18n/types";
import { generateBatch } from "@/lib/exercises/generator";
import {
  startSession,
  endSession,
  updateSession,
  logExerciseAttempt,
} from "@/lib/supabase/progress";
import SessionSetup from "./SessionSetup";
import ExercisePractice from "./ExercisePractice";
import SessionSummary from "./SessionSummary";
import type { SessionConfig } from "./SessionSetup";
import type { SessionStats } from "./SessionSummary";
import type { ExerciseAttempt as ExercisePracticeAttempt } from "./ExercisePractice";

/**
 * Props for PracticeSessionWrapper component
 */
export interface PracticeSessionWrapperProps {
  /** User ID */
  userId: string;

  /** Competency area for this practice session */
  competencyAreaId: CompetencyAreaId;

  /** User's grade range */
  gradeRange: GradeRange;

  /** User's locale for exercise generation */
  locale: Locale;

  /** Whether this is the user's first time in this competency area */
  isFirstTime: boolean;

  /** Optional CSS class for styling */
  class?: string;
}

/**
 * Session flow states
 */
type SessionState = "setup" | "practicing" | "complete" | "error";

/**
 * PracticeSessionWrapper - Main session orchestrator
 *
 * Manages the complete practice session lifecycle:
 * 1. Setup: User configures difficulty and exercise count
 * 2. Practicing: User completes exercises one by one
 * 3. Summary: Display results and provide next actions
 *
 * @example
 * ```tsx
 * <PracticeSessionWrapper
 *   userId="user-123"
 *   competencyAreaId="tal-og-algebra"
 *   gradeRange="4-6"
 *   locale="da-DK"
 *   isFirstTime={false}
 *   client:load
 * />
 * ```
 */
export default function PracticeSessionWrapper(
  props: PracticeSessionWrapperProps,
) {
  // State management
  const [sessionState, setSessionState] = createSignal<SessionState>("setup");
  const [sessionId, setSessionId] = createSignal<string>("");
  const [exercises, setExercises] = createSignal<ExerciseInstance[]>([]);
  const [currentIndex, setCurrentIndex] = createSignal(0);
  const [errorMessage, setErrorMessage] = createSignal("");

  // Statistics tracking
  const [correctCount, setCorrectCount] = createSignal(0);
  const [hintsUsed, setHintsUsed] = createSignal(0);
  const [skippedCount, setSkippedCount] = createSignal(0);
  const [totalTimeSeconds, setTotalTimeSeconds] = createSignal(0);
  const [exerciseStartTime, setExerciseStartTime] = createSignal(Date.now());

  // Computed values
  const currentExercise = createMemo(() => {
    const exs = exercises();
    const idx = currentIndex();
    return exs[idx] || null;
  });

  const isLastExercise = createMemo(() => {
    return currentIndex() >= exercises().length - 1;
  });

  /**
   * Start a new practice session with user-selected configuration
   */
  const handleStartSession = async (config: SessionConfig) => {
    try {
      // Create session in database
      const session = await startSession(
        props.userId,
        props.gradeRange,
        props.competencyAreaId,
      );
      setSessionId(session.id);

      // Generate exercise batch
      const difficulty =
        config.difficulty === "Auto" ? undefined : config.difficulty;
      const generatedExercises = await generateBatch(
        {
          competencyAreaId: props.competencyAreaId,
          gradeRange: props.gradeRange,
          difficulty,
        },
        config.exerciseCount,
        { locale: props.locale },
      );

      setExercises(generatedExercises);
      setCurrentIndex(0);
      setExerciseStartTime(Date.now());
      setSessionState("practicing");
    } catch (error) {
      console.error("Failed to start session:", error);
      setErrorMessage("Failed to start session. Please try again.");
      setSessionState("error");
    }
  };

  /**
   * Handle exercise completion (correct, incorrect, or try again)
   */
  const handleExerciseComplete = async (attempt: ExercisePracticeAttempt) => {
    try {
      const exercise = currentExercise();
      if (!exercise) return;

      // Calculate time spent on this exercise
      const timeSpent = Math.round((Date.now() - exerciseStartTime()) / 1000);
      setTotalTimeSeconds(totalTimeSeconds() + timeSpent);

      // Update statistics
      if (attempt.correct) {
        setCorrectCount(correctCount() + 1);
      }
      setHintsUsed(hintsUsed() + attempt.hintsUsed);

      // Log attempt to database
      await logExerciseAttempt({
        userId: props.userId,
        sessionId: sessionId(),
        templateId: exercise.templateId,
        competencyAreaId: props.competencyAreaId,
        skillId: exercise.metadata.skillId || "unknown",
        difficulty: exercise.metadata.difficulty,
        isBinding: exercise.metadata.isBinding,
        correct: attempt.correct,
        timeSpentSeconds: timeSpent,
        hintsUsed: attempt.hintsUsed,
        userAnswer: attempt.userAnswer,
      });

      // Update session every 5 exercises for persistence
      const completedCount = currentIndex() + 1;
      if (completedCount % 5 === 0) {
        await updateSession(sessionId(), completedCount, correctCount());
      }

      // Move to next exercise or complete session
      if (isLastExercise()) {
        await completeSession();
      } else {
        setCurrentIndex(currentIndex() + 1);
        setExerciseStartTime(Date.now());
      }
    } catch (error) {
      console.error("Failed to log exercise attempt:", error);
      // Continue despite error (graceful degradation)
      if (isLastExercise()) {
        await completeSession();
      } else {
        setCurrentIndex(currentIndex() + 1);
        setExerciseStartTime(Date.now());
      }
    }
  };

  /**
   * Handle exercise skip
   */
  const handleSkip = async (attempt: ExercisePracticeAttempt) => {
    try {
      const exercise = currentExercise();
      if (!exercise) return;

      // Calculate time spent on this exercise
      const timeSpent = Math.round((Date.now() - exerciseStartTime()) / 1000);
      setTotalTimeSeconds(totalTimeSeconds() + timeSpent);

      // Update statistics
      setSkippedCount(skippedCount() + 1);
      setHintsUsed(hintsUsed() + attempt.hintsUsed);

      // Log skipped attempt to database
      await logExerciseAttempt({
        userId: props.userId,
        sessionId: sessionId(),
        templateId: exercise.templateId,
        competencyAreaId: props.competencyAreaId,
        skillId: exercise.metadata.skillId || "unknown",
        difficulty: exercise.metadata.difficulty,
        isBinding: exercise.metadata.isBinding,
        correct: false,
        timeSpentSeconds: timeSpent,
        hintsUsed: attempt.hintsUsed,
        userAnswer: attempt.userAnswer || "",
      });

      // Move to next exercise or complete session
      if (isLastExercise()) {
        await completeSession();
      } else {
        setCurrentIndex(currentIndex() + 1);
        setExerciseStartTime(Date.now());
      }
    } catch (error) {
      console.error("Failed to log skipped exercise:", error);
      // Continue despite error
      if (isLastExercise()) {
        await completeSession();
      } else {
        setCurrentIndex(currentIndex() + 1);
        setExerciseStartTime(Date.now());
      }
    }
  };

  /**
   * Complete the practice session
   */
  const completeSession = async () => {
    try {
      const totalExercises = exercises().length;
      const avgTime =
        totalExercises > 0 ? totalTimeSeconds() / totalExercises : 0;

      // End session in database
      await endSession(sessionId(), totalExercises, correctCount(), avgTime);

      // Transition to summary state
      setSessionState("complete");
    } catch (error) {
      console.error("Failed to end session:", error);
      // Show summary anyway (graceful degradation)
      setSessionState("complete");
    }
  };

  /**
   * Handle "Practice Again" action from summary
   */
  const handlePracticeAgain = () => {
    // Reset all state and return to setup
    setSessionId("");
    setExercises([]);
    setCurrentIndex(0);
    setCorrectCount(0);
    setHintsUsed(0);
    setSkippedCount(0);
    setTotalTimeSeconds(0);
    setSessionState("setup");
  };

  /**
   * Handle "View Progress" action from summary
   */
  const handleViewProgress = () => {
    window.location.href = "/dashboard";
  };

  /**
   * Handle "Return to Dashboard" action from summary
   */
  const handleReturnToDashboard = () => {
    window.location.href = "/dashboard";
  };

  /**
   * Prepare session stats for summary display
   */
  const sessionStats = createMemo<SessionStats>(() => ({
    totalExercises: exercises().length,
    correctCount: correctCount(),
    avgTimeSeconds:
      exercises().length > 0 ? totalTimeSeconds() / exercises().length : 0,
    hintsUsed: hintsUsed(),
    skippedCount: skippedCount(),
  }));

  return (
    <div
      class={`practice-session-wrapper max-w-4xl mx-auto px-4 py-8 ${props.class || ""}`}
    >
      <Switch>
        {/* Setup state */}
        <Match when={sessionState() === "setup"}>
          <SessionSetup
            isFirstTime={props.isFirstTime}
            onStart={handleStartSession}
          />
        </Match>

        {/* Practicing state */}
        <Match when={sessionState() === "practicing" && currentExercise()}>
          <ExercisePractice
            exercises={exercises()}
            currentIndex={currentIndex()}
            sessionId={sessionId()}
            onExerciseComplete={handleExerciseComplete}
            onSkip={handleSkip}
            onSessionComplete={completeSession}
          />
        </Match>

        {/* Complete state */}
        <Match when={sessionState() === "complete"}>
          <SessionSummary
            stats={sessionStats()}
            onPracticeAgain={handlePracticeAgain}
            onViewProgress={handleViewProgress}
            onReturnToDashboard={handleReturnToDashboard}
          />
        </Match>

        {/* Error state */}
        <Match when={sessionState() === "error"}>
          <div class="text-center py-12">
            <div class="text-red-600 text-xl font-semibold mb-4">Error</div>
            <p class="text-gray-700 mb-6">{errorMessage()}</p>
            <button
              type="button"
              onClick={() => setSessionState("setup")}
              class="
                py-3 px-6 bg-blue-600 hover:bg-blue-700
                text-white font-semibold rounded-lg
                transition-colors
                focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
              "
            >
              Try Again
            </button>
          </div>
        </Match>
      </Switch>
    </div>
  );
}
