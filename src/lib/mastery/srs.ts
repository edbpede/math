/**
 * Spaced Repetition System (SRS) - SuperMemo 2 Algorithm
 *
 * Implements the SuperMemo 2 algorithm for optimal review scheduling.
 * The algorithm adjusts review intervals based on performance, with:
 * - Exponential interval growth for correct answers
 * - Interval reset for incorrect answers
 * - Dynamic ease factor adjustment based on response quality
 *
 * Requirements:
 * - 5.3: Implement modified SuperMemo 2 spaced repetition algorithm
 * - 5.4: Increase review intervals exponentially on correct answers
 * - 5.5: Reset intervals on incorrect answers
 *
 * SuperMemo 2 Algorithm Overview:
 * - Ease Factor (EF): Difficulty multiplier (default 2.5, range 1.3-3.0)
 * - Interval: Days until next review (exponential growth)
 * - Repetition Count: Number of consecutive successful reviews
 *
 * @module mastery/srs
 */

import type { SRSParameters, SRSUpdateInput, SRSUpdateResult } from './types';

/**
 * Configuration constants for SuperMemo 2 algorithm
 * Based on the original SM-2 specification with slight modifications
 */
const SM2_CONFIG = {
  // Initial ease factor for new skills (2.5 is optimal from research)
  INITIAL_EASE_FACTOR: 2.5,

  // Ease factor boundaries (prevent extreme values)
  MIN_EASE_FACTOR: 1.3,
  MAX_EASE_FACTOR: 3.0,

  // Initial intervals in days
  FIRST_INTERVAL: 1,      // 1 day after first successful attempt
  SECOND_INTERVAL: 3,     // 3 days after second successful attempt

  // Interval on incorrect answer (reset to short review)
  INCORRECT_INTERVAL: 1,  // Review again tomorrow

  // Quality score thresholds
  QUALITY_THRESHOLD_PASS: 3, // Minimum quality to count as "correct"

  // Ease factor adjustment per quality level
  // Quality 0-2: decrease EF, Quality 3: maintain, Quality 4-5: increase EF
  EASE_ADJUSTMENT_FORMULA: (quality: number) =>
    0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02),
} as const;

/**
 * Initialize SRS parameters for a new skill
 *
 * Sets up default parameters per SuperMemo 2 specification:
 * - Ease Factor: 2.5 (standard initial value)
 * - Interval: 1 day (first review tomorrow)
 * - Repetition Count: 0 (no successful reviews yet)
 *
 * @returns Initial SRS parameters for a new skill
 *
 * @example
 * ```typescript
 * const params = initializeSRSParameters();
 * // { easeFactor: 2.5, interval: 1, repetitionCount: 0 }
 * ```
 */
export function initializeSRSParameters(): SRSParameters {
  return {
    easeFactor: SM2_CONFIG.INITIAL_EASE_FACTOR,
    interval: SM2_CONFIG.FIRST_INTERVAL,
    repetitionCount: 0,
  };
}

/**
 * Calculate response quality score (0-5) from answer correctness and other factors
 *
 * SuperMemo 2 uses a 6-point quality scale:
 * - 5: Perfect response (correct, fast, no hints)
 * - 4: Correct response after some hesitation (correct, normal speed, no hints)
 * - 3: Correct with difficulty (correct, slow or hints used)
 * - 2: Incorrect but remembered (incorrect, close answer)
 * - 1: Incorrect, vague memory (incorrect, far from correct)
 * - 0: Complete blackout (incorrect, no idea)
 *
 * For our simplified implementation, we use:
 * - wasCorrect: boolean (correct or incorrect)
 * - responseQuality: 0-1 score from other factors (speed, hints, etc.)
 *
 * @param wasCorrect - Whether the answer was correct
 * @param responseQuality - Quality score from 0-1 (based on speed, hints, confidence)
 * @returns Quality score 0-5 for SuperMemo 2 algorithm
 *
 * @example
 * ```typescript
 * const quality = calculateQualityScore(true, 0.9);  // 5 (perfect)
 * const quality2 = calculateQualityScore(true, 0.6); // 4 (good)
 * const quality3 = calculateQualityScore(false, 0.5); // 2 (incorrect but tried)
 * ```
 */
export function calculateQualityScore(wasCorrect: boolean, responseQuality: number): number {
  // Clamp responseQuality to 0-1 range
  const normalizedQuality = Math.max(0, Math.min(1, responseQuality));

  if (wasCorrect) {
    // Correct answers: map 0-1 quality to 3-5 range
    // 0.0-0.33: quality 3 (correct with difficulty)
    // 0.34-0.66: quality 4 (correct with hesitation)
    // 0.67-1.0: quality 5 (perfect response)
    if (normalizedQuality <= 0.33) return 3;
    if (normalizedQuality <= 0.66) return 4;
    return 5;
  } else {
    // Incorrect answers: map 0-1 quality to 0-2 range
    // 0.0-0.33: quality 0 (complete blackout)
    // 0.34-0.66: quality 1 (vague memory)
    // 0.67-1.0: quality 2 (remembered but incorrect)
    if (normalizedQuality <= 0.33) return 0;
    if (normalizedQuality <= 0.66) return 1;
    return 2;
  }
}

/**
 * Update SRS parameters based on performance using SuperMemo 2 algorithm
 *
 * Core SuperMemo 2 logic:
 * 1. If quality >= 3 (correct):
 *    - Increment repetition count
 *    - Calculate new interval based on repetition count:
 *      - First repetition: 1 day
 *      - Second repetition: 3 days
 *      - Third+ repetition: previous_interval * ease_factor
 *    - Adjust ease factor based on quality
 * 2. If quality < 3 (incorrect):
 *    - Reset repetition count to 0
 *    - Set interval to 1 day (re-review tomorrow)
 *    - Ease factor may decrease slightly
 *
 * Requirement 5.4: Exponential interval growth on correct answers
 * Requirement 5.5: Interval reset on incorrect answers
 *
 * @param input - Update input containing correctness, quality, and current parameters
 * @returns Updated SRS parameters and next review date
 *
 * @example
 * ```typescript
 * const result = updateSRSParameters({
 *   wasCorrect: true,
 *   responseQuality: 0.85,
 *   currentParams: { easeFactor: 2.5, interval: 1, repetitionCount: 0 }
 * });
 * // result.newParams.interval = 3 (second interval)
 * // result.newParams.repetitionCount = 1
 * ```
 */
export function updateSRSParameters(input: SRSUpdateInput): SRSUpdateResult {
  const { wasCorrect, responseQuality, currentParams } = input;

  // Calculate quality score (0-5)
  const quality = calculateQualityScore(wasCorrect, responseQuality);

  // Clone current parameters to avoid mutation
  let newEaseFactor = currentParams.easeFactor;
  let newInterval: number;
  let newRepetitionCount: number;

  // Calculate ease factor adjustment using SM-2 formula
  // EF' = EF + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02))
  const easeAdjustment = SM2_CONFIG.EASE_ADJUSTMENT_FORMULA(quality);
  newEaseFactor = currentParams.easeFactor + easeAdjustment;

  // Clamp ease factor to valid range
  newEaseFactor = Math.max(
    SM2_CONFIG.MIN_EASE_FACTOR,
    Math.min(SM2_CONFIG.MAX_EASE_FACTOR, newEaseFactor)
  );

  // Check if response quality meets passing threshold
  if (quality >= SM2_CONFIG.QUALITY_THRESHOLD_PASS) {
    // CORRECT ANSWER PATH (Requirement 5.4: exponential interval growth)
    newRepetitionCount = currentParams.repetitionCount + 1;

    // Calculate interval based on repetition count
    if (newRepetitionCount === 1) {
      // First successful review: 1 day
      newInterval = SM2_CONFIG.FIRST_INTERVAL;
    } else if (newRepetitionCount === 2) {
      // Second successful review: 3 days
      newInterval = SM2_CONFIG.SECOND_INTERVAL;
    } else {
      // Third+ successful review: exponential growth
      // I(n) = I(n-1) * EF
      newInterval = Math.round(currentParams.interval * newEaseFactor);
    }
  } else {
    // INCORRECT ANSWER PATH (Requirement 5.5: interval reset)
    newRepetitionCount = 0;
    newInterval = SM2_CONFIG.INCORRECT_INTERVAL;

    // Optional: decrease ease factor slightly on failure
    // (helps prevent skills from becoming too easy if consistently failing)
    newEaseFactor = Math.max(
      SM2_CONFIG.MIN_EASE_FACTOR,
      newEaseFactor - 0.2
    );
  }

  // Build new parameters
  const newParams: SRSParameters = {
    easeFactor: newEaseFactor,
    interval: newInterval,
    repetitionCount: newRepetitionCount,
  };

  // Calculate next review date
  const nextReviewDate = calculateNextReviewDate(newInterval);

  return {
    newParams,
    nextReviewDate,
  };
}

/**
 * Calculate next review date based on interval
 *
 * Adds the interval (in days) to the current date to determine when
 * the skill should be reviewed next.
 *
 * @param intervalDays - Number of days until next review
 * @returns Date object representing the next review date
 *
 * @example
 * ```typescript
 * const nextReview = calculateNextReviewDate(7);
 * // Returns date 7 days from now
 * ```
 */
export function calculateNextReviewDate(intervalDays: number): Date {
  const now = new Date();
  const nextReview = new Date(now.getTime() + intervalDays * 24 * 60 * 60 * 1000);
  return nextReview;
}

/**
 * Determine if a skill is due for review based on SRS scheduling
 *
 * Compares the next review date with the current date to determine
 * if the skill should be included in the current practice session.
 *
 * @param nextReviewDate - Scheduled next review date from SRS
 * @param currentDate - Current date (defaults to now)
 * @returns True if skill is due for review, false otherwise
 *
 * @example
 * ```typescript
 * const isDue = isSkillDueForReview(skillProgress.nextReview);
 * if (isDue) {
 *   // Include skill in practice session
 * }
 * ```
 */
export function isSkillDueForReview(
  nextReviewDate: Date,
  currentDate: Date = new Date()
): boolean {
  return currentDate >= nextReviewDate;
}

/**
 * Calculate review priority score for session composition
 *
 * Determines how urgently a skill needs to be reviewed based on:
 * - How overdue it is (days past next review date)
 * - Ease factor (lower EF = more difficult = higher priority)
 * - Mastery level (lower mastery = higher priority)
 *
 * Used by session composition algorithm to prioritize which skills
 * to include when building practice sessions (Requirement 5.6).
 *
 * @param nextReviewDate - Scheduled next review date
 * @param easeFactor - Current ease factor
 * @param masteryLevel - Current mastery level (0-100)
 * @param currentDate - Current date (defaults to now)
 * @returns Priority score (higher = more urgent)
 *
 * @example
 * ```typescript
 * const priority = calculateReviewPriority(
 *   skillProgress.nextReview,
 *   skillProgress.srsParams.easeFactor,
 *   skillProgress.masteryLevel
 * );
 * // Higher score = should be reviewed sooner
 * ```
 */
export function calculateReviewPriority(
  nextReviewDate: Date,
  easeFactor: number,
  masteryLevel: number,
  currentDate: Date = new Date()
): number {
  // Calculate days overdue (negative if not yet due)
  const daysOverdue = (currentDate.getTime() - nextReviewDate.getTime()) / (24 * 60 * 60 * 1000);

  // Overdue factor: exponential urgency for overdue items
  // Skills that are overdue get progressively higher priority
  const overdueFactor = Math.max(0, daysOverdue) * 2;

  // Difficulty factor: lower ease factor = more difficult = higher priority
  // Normalized to 0-1 range (EF 1.3-3.0 maps to priority 1.0-0.0)
  const difficultyFactor = (SM2_CONFIG.MAX_EASE_FACTOR - easeFactor) /
                           (SM2_CONFIG.MAX_EASE_FACTOR - SM2_CONFIG.MIN_EASE_FACTOR);

  // Mastery factor: lower mastery = higher priority
  // Normalized to 0-1 range (mastery 0-100 maps to priority 1.0-0.0)
  const masteryFactor = (100 - masteryLevel) / 100;

  // Combined priority score
  // Weights: overdue (50%), difficulty (30%), mastery (20%)
  const priority =
    overdueFactor * 0.5 +
    difficultyFactor * 0.3 +
    masteryFactor * 0.2;

  return priority;
}

/**
 * Get skills due for review sorted by priority
 *
 * Helper function to filter and sort skills that are due for review,
 * ordered by review priority (most urgent first).
 *
 * Used by session composition to build the review queue.
 *
 * @param skills - Array of skill progress objects
 * @param currentDate - Current date (defaults to now)
 * @returns Array of skills due for review, sorted by priority (descending)
 *
 * @example
 * ```typescript
 * const dueSkills = getDueSkillsSortedByPriority(allSkills);
 * // Returns skills that need review, most urgent first
 * ```
 */
export function getDueSkillsSortedByPriority<T extends {
  nextReview: Date;
  srsParams: SRSParameters;
  masteryLevel: number;
}>(
  skills: T[],
  currentDate: Date = new Date()
): T[] {
  // Filter to only skills due for review
  const dueSkills = skills.filter(skill =>
    isSkillDueForReview(skill.nextReview, currentDate)
  );

  // Sort by priority (highest first)
  return dueSkills.sort((a, b) => {
    const priorityA = calculateReviewPriority(
      a.nextReview,
      a.srsParams.easeFactor,
      a.masteryLevel,
      currentDate
    );
    const priorityB = calculateReviewPriority(
      b.nextReview,
      b.srsParams.easeFactor,
      b.masteryLevel,
      currentDate
    );

    return priorityB - priorityA; // Descending order
  });
}
