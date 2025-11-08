/**
 * ExercisePractice Component
 *
 * SolidJS island component serving as the main practice interface.
 * Handles answer input, validation, feedback display, hint integration,
 * progress tracking, and skip functionality.
 *
 * Requirements:
 * - 8.1: Validate answer and display feedback within 1 second
 * - 8.2: Display positive reinforcement with brief explanation and continue option
 * - 8.3: Display gentle correction showing correct answer without negative language
 * - 14.5: Begin first practice session with easier problems
 * - 4.1: Hint button accessible during every exercise
 * - 4.3: Keep hints visible after answer submission
 * - 9.1: WCAG 2.1 AA compliance (keyboard nav, ARIA, contrast)
 * - 9.3: Touch targets minimum 44x44 pixels
 */

import { createSignal, createEffect, Show, onMount } from 'solid-js';
import { useStore } from '@nanostores/solid';
import { $t } from '@/lib/i18n';
import { createKeyboardShortcuts } from '@/lib/accessibility';
import type { ExerciseInstance } from '@/lib/exercises/types';
import HintSystem from './HintSystem';
import FeedbackDisplay from './FeedbackDisplay';

/**
 * Exercise attempt data for logging
 */
export interface ExerciseAttempt {
  exerciseId: string;
  templateId: string;
  correct: boolean;
  timeSpentSeconds: number;
  hintsUsed: number;
  userAnswer: string;
  skipped?: boolean;
}

/**
 * Props for ExercisePractice component
 */
export interface ExercisePracticeProps {
  /** Array of pre-generated exercise instances */
  exercises: ExerciseInstance[];
  
  /** Current exercise index (0-based) */
  currentIndex: number;
  
  /** Active practice session ID */
  sessionId: string;
  
  /** Callback when exercise is completed (correct, incorrect, or try again) */
  onExerciseComplete: (attempt: ExerciseAttempt) => void;
  
  /** Callback when exercise is skipped */
  onSkip: (attempt: ExerciseAttempt) => void;
  
  /** Callback when all exercises are finished */
  onSessionComplete: () => void;
  
  /** Optional CSS class for styling */
  class?: string;
}

/**
 * Validation result state
 */
type ValidationState = 
  | { status: 'pending' }
  | { status: 'validating' }
  | { status: 'correct'; message: string }
  | { status: 'incorrect'; message: string; correctAnswer: string };

/**
 * ExercisePractice - Main practice interface component
 *
 * Displays exercises one at a time, handles user input, validates answers,
 * shows feedback, integrates hints, and manages exercise flow.
 *
 * @example
 * ```tsx
 * <ExercisePractice
 *   exercises={exerciseInstances}
 *   currentIndex={0}
 *   sessionId={sessionId}
 *   onExerciseComplete={(attempt) => logAttempt(attempt)}
 *   onSkip={(attempt) => logSkip(attempt)}
 *   onSessionComplete={() => showSummary()}
 * />
 * ```
 */
export default function ExercisePractice(props: ExercisePracticeProps) {
  const t = useStore($t);

  // State management
  const [answer, setAnswer] = createSignal('');
  const [validationState, setValidationState] = createSignal<ValidationState>({ status: 'pending' });
  const [hintsUsed, setHintsUsed] = createSignal(0);
  const [startTime, setStartTime] = createSignal(Date.now());
  const [showSkipConfirm, setShowSkipConfirm] = createSignal(false);
  const [answerInputRef, setAnswerInputRef] = createSignal<HTMLInputElement>();

  // Ref for triggering hint button programmatically
  let hintButtonRef: HTMLButtonElement | undefined;

  // Keyboard shortcuts setup
  const shortcuts = createKeyboardShortcuts();

  // Register shortcuts
  shortcuts.register('hint', {
    key: 'h',
    description: 'Get hint',
    handler: () => {
      // Trigger hint button click if available and not disabled
      if (hintButtonRef && !hintButtonRef.disabled) {
        hintButtonRef.click();
      }
    },
    condition: () => {
      const state = validationState();
      return state.status !== 'validating';
    },
  });

  shortcuts.register('skip', {
    key: 's',
    description: 'Skip exercise',
    handler: () => {
      const state = validationState();
      // Only allow skip if not submitted yet
      if (state.status === 'pending' || state.status === 'validating') {
        if (!showSkipConfirm()) {
          handleSkipClick();
        }
      }
    },
    condition: () => {
      const state = validationState();
      return state.status === 'pending' || state.status === 'validating';
    },
  });

  shortcuts.register('continue', {
    key: 'Enter',
    description: 'Continue to next exercise',
    handler: () => {
      const state = validationState();
      if (state.status === 'correct') {
        handleNext();
      } else if (state.status === 'incorrect') {
        handleTryAgain();
      }
    },
    condition: () => {
      const state = validationState();
      return state.status === 'correct' || state.status === 'incorrect';
    },
  });
  
  // Get current exercise
  const getCurrentExercise = () => props.exercises[props.currentIndex];
  const isLastExercise = () => props.currentIndex >= props.exercises.length - 1;
  const totalExercises = () => props.exercises.length;
  
  // Reset state when exercise changes
  createEffect(() => {
    // Track currentIndex to trigger reset
    const _index = props.currentIndex;
    const exercise = getCurrentExercise();
    
    if (exercise) {
      setAnswer('');
      setValidationState({ status: 'pending' });
      setHintsUsed(0);
      setStartTime(Date.now());
      setShowSkipConfirm(false);
      
      // Focus answer input on new exercise
      setTimeout(() => {
        answerInputRef()?.focus();
      }, 100);
    }
  });
  
  // Focus answer input on mount
  onMount(() => {
    answerInputRef()?.focus();
  });
  
  /**
   * Handle hint request from HintSystem
   */
  const handleHintRequested = (level: number) => {
    setHintsUsed((prev) => prev + 1);
  };
  
  /**
   * Calculate time spent on current exercise
   */
  const calculateTimeSpent = (): number => {
    return Math.floor((Date.now() - startTime()) / 1000);
  };
  
  /**
   * Normalize answer for validation (trim whitespace)
   */
  const normalizeAnswer = (value: string): string => {
    return value.trim();
  };
  
  /**
   * Handle answer input change
   */
  const handleAnswerChange = (value: string) => {
    setAnswer(value);
  };
  
  /**
   * Handle answer submission
   */
  const handleSubmit = async (event?: Event) => {
    event?.preventDefault();
    
    const normalizedAnswer = normalizeAnswer(answer());
    
    // Validate answer is not empty
    if (!normalizedAnswer) {
      return;
    }
    
    const exercise = getCurrentExercise();
    if (!exercise) return;
    
    // Set loading state
    setValidationState({ status: 'validating' });
    
    try {
      // Validate answer using template's validation function
      const template = exercise.templateId;
      const validation = exercise.metadata.competencyAreaId; // TODO: Get template and validate
      
      // For now, use a simple validation approach
      // This will be improved when we have proper template validation
      const isCorrect = normalizedAnswer.toLowerCase() === String(exercise.correctAnswer.value).toLowerCase();
      
      const timeSpent = calculateTimeSpent();
      
      // Create attempt data
      const attempt: ExerciseAttempt = {
        exerciseId: exercise.id,
        templateId: exercise.templateId,
        correct: isCorrect,
        timeSpentSeconds: timeSpent,
        hintsUsed: hintsUsed(),
        userAnswer: normalizedAnswer,
      };
      
      if (isCorrect) {
        // Get random success message
        const messages = t()('feedback.correct.messages') as string[];
        const randomMessage = messages[Math.floor(Math.random() * messages.length)];
        
        setValidationState({
          status: 'correct',
          message: randomMessage,
        });
        
        // Call completion callback
        props.onExerciseComplete(attempt);
      } else {
        // Get random incorrect message
        const messages = t()('feedback.incorrect.messages') as string[];
        const randomMessage = messages[Math.floor(Math.random() * messages.length)];
        
        setValidationState({
          status: 'incorrect',
          message: randomMessage,
          correctAnswer: String(exercise.correctAnswer.value),
        });
        
        // Call completion callback (for incorrect attempt tracking)
        props.onExerciseComplete(attempt);
      }
    } catch (error) {
      console.error('Error validating answer:', error);
      
      // Fallback validation
      const isCorrect = normalizeAnswer(answer()) === String(getCurrentExercise()?.correctAnswer.value);
      setValidationState({
        status: isCorrect ? 'correct' : 'incorrect',
        message: isCorrect ? t()('feedback.correct.title') : t()('feedback.incorrect.title'),
        correctAnswer: String(getCurrentExercise()?.correctAnswer.value),
      });
    }
  };
  
  /**
   * Handle try again button click
   */
  const handleTryAgain = () => {
    setAnswer('');
    setValidationState({ status: 'pending' });
    answerInputRef()?.focus();
  };
  
  /**
   * Handle next exercise button click
   */
  const handleNext = () => {
    if (isLastExercise()) {
      props.onSessionComplete();
    } else {
      // Parent should increment currentIndex
      // This component is controlled by parent
    }
  };
  
  /**
   * Handle skip button click
   */
  const handleSkipClick = () => {
    setShowSkipConfirm(true);
  };
  
  /**
   * Handle skip confirmation
   */
  const handleSkipConfirm = () => {
    const exercise = getCurrentExercise();
    if (!exercise) return;
    
    const timeSpent = calculateTimeSpent();
    
    const attempt: ExerciseAttempt = {
      exerciseId: exercise.id,
      templateId: exercise.templateId,
      correct: false,
      timeSpentSeconds: timeSpent,
      hintsUsed: hintsUsed(),
      userAnswer: '',
      skipped: true,
    };
    
    props.onSkip(attempt);
    setShowSkipConfirm(false);
  };
  
  /**
   * Handle skip cancellation
   */
  const handleSkipCancel = () => {
    setShowSkipConfirm(false);
  };
  
  /**
   * Handle enter key in answer input
   */
  const handleKeyDown = (event: KeyboardEvent) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      handleSubmit();
    }
  };
  
  const exercise = getCurrentExercise();
  const state = validationState();
  const isSubmitting = state.status === 'validating';
  const hasSubmitted = state.status === 'correct' || state.status === 'incorrect';
  const isCorrect = state.status === 'correct';
  const isIncorrect = state.status === 'incorrect';
  
  return (
    <div
      class={`exercise-practice-container max-w-4xl mx-auto p-6 ${props.class || ''}`}
      role="main"
      aria-label={t()('exercises.session.title')}
    >
      {/* Progress Indicator */}
      <div
        class="progress-section mb-8"
        role="region"
        aria-label={t()('exercises.session.progress', {
          current: (props.currentIndex + 1).toString(),
          total: totalExercises().toString(),
        })}
      >
        <div class="flex items-center justify-between mb-3">
          <h2 class="text-lg font-semibold text-gray-700">
            {t()('exercises.session.progress', {
              current: (props.currentIndex + 1).toString(),
              total: totalExercises().toString(),
            })}
          </h2>
          <span class="text-sm text-gray-600">
            {Math.round(((props.currentIndex + 1) / totalExercises()) * 100)}%
          </span>
        </div>
        
        {/* Progress bar */}
        <div
          class="progress-bar w-full h-3 bg-gray-200 rounded-full overflow-hidden"
          role="progressbar"
          aria-valuenow={props.currentIndex + 1}
          aria-valuemin={1}
          aria-valuemax={totalExercises()}
        >
          <div
            class="progress-fill h-full bg-blue-600 transition-all duration-500 ease-out"
            style={{
              width: `${((props.currentIndex + 1) / totalExercises()) * 100}%`,
            }}
          />
        </div>
      </div>
      
      <Show when={exercise} fallback={<div class="text-center text-gray-600">{t()('errors.exercise.notFound')}</div>}>
        {(ex) => (
          <div class="exercise-content bg-white rounded-lg shadow-md p-8">
            {/* Question */}
            <div
              class="question-section mb-8"
              role="region"
              aria-label={t()('exercises.exercise.question')}
            >
              <h3 class="text-xl font-bold text-gray-900 mb-4">
                {t()('exercises.exercise.question')}
              </h3>
              <div class="question-text text-2xl font-medium text-gray-800 leading-relaxed p-6 bg-blue-50 rounded-lg border-2 border-blue-200">
                {ex().questionText}
              </div>
              
              {/* Exercise metadata */}
              <div class="mt-4 flex gap-3 flex-wrap">
                <span class="text-xs px-3 py-1 rounded-full bg-gray-100 text-gray-700">
                  {t()('exercises.exercise.difficulty', { level: ex().metadata.difficulty })}
                </span>
                <Show when={ex().metadata.isBinding}>
                  <span class="text-xs px-3 py-1 rounded-full bg-purple-100 text-purple-700 font-medium">
                    {t()('exercises.exercise.bindingContent')}
                  </span>
                </Show>
              </div>
            </div>
            
            {/* Answer Input */}
            <form onSubmit={handleSubmit} class="answer-section mb-6">
              <label
                for="answer-input"
                class="block text-lg font-semibold text-gray-700 mb-3"
              >
                {t()('exercises.exercise.yourAnswer')}
              </label>
              <div class="flex gap-3">
                <input
                  ref={setAnswerInputRef}
                  id="answer-input"
                  type="text"
                  value={answer()}
                  onInput={(e) => handleAnswerChange(e.currentTarget.value)}
                  onKeyDown={handleKeyDown}
                  disabled={hasSubmitted || isSubmitting}
                  placeholder={t()('exercises.exercise.placeholder')}
                  class="flex-1 px-4 py-3 text-lg border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed transition-all"
                  style={{ 'min-height': '44px' }}
                  aria-label={t()('exercises.exercise.yourAnswer')}
                  aria-required="true"
                  aria-invalid={isIncorrect}
                />
                
                <Show when={!hasSubmitted}>
                  <button
                    type="submit"
                    disabled={!answer().trim() || isSubmitting}
                    class="px-6 py-3 font-semibold rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2"
                    classList={{
                      'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500': !isSubmitting && answer().trim(),
                      'bg-gray-300 text-gray-500 cursor-not-allowed': !answer().trim() || isSubmitting,
                    }}
                    style={{ 'min-width': '44px', 'min-height': '44px' }}
                    aria-label={t()('exercises.exercise.checkAnswer')}
                  >
                    <Show when={isSubmitting} fallback={t()('exercises.exercise.checkAnswer')}>
                      {t()('exercises.validation.checking')}
                    </Show>
                  </button>
                </Show>
              </div>
            </form>
            
            {/* Feedback Display */}
            <Show when={hasSubmitted && state.status === 'correct'}>
              <FeedbackDisplay
                isCorrect={true}
                message={state.message}
                correctAnswer={String(ex().correctAnswer.value)}
                userAnswer={answer()}
                workedSolution={ex().workedSolution}
                visualAid={ex().visualAid}
                onContinue={handleNext}
              />
            </Show>
            
            <Show when={hasSubmitted && state.status === 'incorrect'}>
              <FeedbackDisplay
                isCorrect={false}
                message={state.message}
                correctAnswer={'correctAnswer' in state ? state.correctAnswer : String(ex().correctAnswer.value)}
                userAnswer={answer()}
                workedSolution={ex().workedSolution}
                visualAid={ex().visualAid}
                onTryAgain={handleTryAgain}
              />
            </Show>
            
            {/* Hint System */}
            <div class="hint-section mb-6">
              <HintSystem
                hints={ex().hints}
                onHintRequested={handleHintRequested}
                disabled={isSubmitting}
                resetKey={ex().id}
                hintButtonRef={(el) => (hintButtonRef = el)}
              />
            </div>
            
            {/* Skip Button */}
            <Show when={!hasSubmitted}>
              <div class="skip-section flex justify-end">
                <Show when={!showSkipConfirm()} fallback={
                  <div class="skip-confirm flex items-center gap-3 p-4 bg-yellow-50 border-2 border-yellow-300 rounded-lg">
                    <p class="text-sm text-yellow-900 font-medium">
                      {t()('exercises.session.confirmQuit')}
                    </p>
                    <button
                      onClick={handleSkipConfirm}
                      class="px-4 py-2 bg-yellow-600 text-white font-medium rounded hover:bg-yellow-700 focus:outline-none focus:ring-2 focus:ring-yellow-500 transition-all text-sm"
                      style={{ 'min-height': '44px' }}
                    >
                      {t()('common.actions.confirm')}
                    </button>
                    <button
                      onClick={handleSkipCancel}
                      class="px-4 py-2 bg-gray-300 text-gray-700 font-medium rounded hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500 transition-all text-sm"
                      style={{ 'min-height': '44px' }}
                    >
                      {t()('common.actions.cancel')}
                    </button>
                  </div>
                }>
                  <button
                    onClick={handleSkipClick}
                    class="px-5 py-2 text-gray-600 font-medium rounded hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-400 transition-all text-sm"
                    style={{ 'min-height': '44px' }}
                    aria-label={t()('exercises.exercise.skipExercise')}
                  >
                    {t()('exercises.exercise.skipExercise')}
                  </button>
                </Show>
              </div>
            </Show>
          </div>
        )}
      </Show>
    </div>
  );
}

