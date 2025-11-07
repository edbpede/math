/**
 * Session Composition Type Definitions
 *
 * Type definitions for practice session composition including content balancing,
 * category allocation, and session planning.
 *
 * Requirements:
 * - 5.6: Compose sessions balancing new (10-30%), review (40-60%), weak areas (10-30%), random (10-20%)
 */

import type { CompetencyAreaId, GradeRange, SkillProgress } from '../types';

/**
 * Content category for session composition
 *
 * Defines the four types of content that can be included in a practice session:
 * - new: Skills never practiced or practiced long ago
 * - review: Skills due for review based on SRS
 * - weak-area: Skills with low mastery levels
 * - random: Random selection for variety
 */
export type ContentCategory = 'new' | 'review' | 'weak-area' | 'random';

/**
 * Configuration for session composition content balancing
 *
 * Defines the percentage ranges for each content category in a session.
 * All percentages must sum to 100 (with some tolerance for rounding).
 *
 * Requirements:
 * - 5.6: Balance new (10-30%), review (40-60%), weak areas (10-30%), random (10-20%)
 */
export interface SessionCompositionConfig {
  /** Percentage of new content (0-100) */
  newContentPercent: number;

  /** Percentage of review content due per SRS (0-100) */
  reviewContentPercent: number;

  /** Percentage targeting weak areas (0-100) */
  weakAreaPercent: number;

  /** Percentage for random variety (0-100) */
  randomPercent: number;

  /** Total number of exercises in the session */
  totalExercises: number;
}

/**
 * Default session composition configuration
 *
 * Defaults to middle of each range:
 * - New: 20% (middle of 10-30%)
 * - Review: 50% (middle of 40-60%)
 * - Weak: 20% (middle of 10-30%)
 * - Random: 10% (middle of 10-20%)
 */
export const DEFAULT_SESSION_CONFIG: SessionCompositionConfig = {
  newContentPercent: 20,
  reviewContentPercent: 50,
  weakAreaPercent: 20,
  randomPercent: 10,
  totalExercises: 25,
};

/**
 * Allocation of exercises per content category
 *
 * Represents the actual number of exercises allocated to each category
 * based on the configured percentages.
 */
export interface CategoryAllocation {
  /** Number of new content exercises */
  new: number;

  /** Number of review exercises due per SRS */
  review: number;

  /** Number of weak area exercises */
  weakArea: number;

  /** Number of random variety exercises */
  random: number;

  /** Total exercises (sum of all categories) */
  total: number;
}

/**
 * Planned exercise in a session
 *
 * Represents a single exercise that will be generated for the session,
 * including which template to use and which content category it belongs to.
 */
export interface PlannedExercise {
  /** Template ID to use for generation */
  templateId: string;

  /** Content category this exercise belongs to */
  category: ContentCategory;

  /** Skill ID being practiced */
  skillId: string;

  /** Optional skill progress data (for review/weak area exercises) */
  skillProgress?: SkillProgress;

  /** Position in the session (0-indexed) */
  position: number;
}

/**
 * Complete session plan
 *
 * Represents a fully planned practice session with all exercises
 * selected and ordered, ready for generation.
 */
export interface SessionPlan {
  /** User ID this session is for */
  userId: string;

  /** Grade range for this session */
  gradeRange: GradeRange;

  /** Optional competency area filter */
  competencyAreaId?: CompetencyAreaId;

  /** Configuration used to compose this session */
  config: SessionCompositionConfig;

  /** Actual allocation achieved */
  allocation: CategoryAllocation;

  /** Ordered list of planned exercises */
  exercises: PlannedExercise[];

  /** Timestamp when session was composed */
  composedAt: Date;
}

/**
 * Session composition result - Success case
 *
 * Returned when session composition completes successfully.
 */
export interface SessionCompositionSuccess {
  status: 'success';
  sessionPlan: SessionPlan;
}

/**
 * Session composition result - Insufficient data case
 *
 * Returned when there isn't enough content to compose a session
 * (e.g., not enough templates available, new user with no progress).
 */
export interface SessionCompositionInsufficientData {
  status: 'insufficient-data';
  message: string;
  availableExercises: number;
  requestedExercises: number;
}

/**
 * Session composition result - Error case
 *
 * Returned when an error occurs during session composition.
 */
export interface SessionCompositionError {
  status: 'error';
  message: string;
  error?: Error;
}

/**
 * Discriminated union for session composition results
 *
 * Type-safe result type following the project's pattern of using
 * discriminated unions with status field.
 */
export type SessionCompositionResult =
  | SessionCompositionSuccess
  | SessionCompositionInsufficientData
  | SessionCompositionError;

/**
 * Criteria for identifying new content
 *
 * Defines what qualifies as "new" content for session composition.
 */
export interface NewContentCriteria {
  /** Minimum attempts to not be considered "new" */
  maxAttempts: number;

  /** Minimum days since last practice to be considered "new again" */
  minDaysSinceLastPractice: number;
}

/**
 * Default criteria for new content identification
 *
 * Skills with fewer than 3 attempts or not practiced in 14+ days
 * are considered "new" content.
 */
export const DEFAULT_NEW_CONTENT_CRITERIA: NewContentCriteria = {
  maxAttempts: 3,
  minDaysSinceLastPractice: 14,
};

/**
 * Criteria for identifying weak areas
 *
 * Defines what qualifies as a "weak area" for session composition.
 */
export interface WeakAreaCriteria {
  /** Maximum mastery level to be considered a weak area */
  maxMasteryLevel: number;

  /** Minimum attempts required (to ensure sufficient data) */
  minAttempts: number;
}

/**
 * Default criteria for weak area identification
 *
 * Skills with mastery < 40 (introduced/developing bands) and at least
 * 3 attempts are considered weak areas.
 */
export const DEFAULT_WEAK_AREA_CRITERIA: WeakAreaCriteria = {
  maxMasteryLevel: 40,
  minAttempts: 3,
};
