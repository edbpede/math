/**
 * Session Composition Algorithm
 *
 * Implements intelligent session composition that balances new content, review content,
 * weak areas, and random variety according to spaced repetition principles.
 *
 * Requirements:
 * - 5.6: Compose sessions balancing new (10-30%), review (40-60%), weak areas (10-30%), random (10-20%)
 */

import type {
  SessionCompositionConfig,
  SessionCompositionResult,
  SessionPlan,
  PlannedExercise,
  CategoryAllocation,
  ContentCategory,
  NewContentCriteria,
  WeakAreaCriteria,
} from './types';
import {
  DEFAULT_SESSION_CONFIG,
  DEFAULT_NEW_CONTENT_CRITERIA,
  DEFAULT_WEAK_AREA_CRITERIA,
} from './types';
import type { SkillProgress, CompetencyAreaId, GradeRange } from '../types';
import { getDueSkillsSortedByPriority } from '../mastery/srs';
import { templateRegistry, type TemplateSelectionCriteria } from '../exercises/template-registry';

/**
 * Options for session composition
 */
export interface ComposeSessionOptions {
  /** User ID for this session */
  userId: string;

  /** Grade range to compose for */
  gradeRange: GradeRange;

  /** Optional competency area filter */
  competencyAreaId?: CompetencyAreaId;

  /** User's skills progress data */
  skillsProgress: SkillProgress[];

  /** Configuration for content balancing (uses defaults if not provided) */
  config?: Partial<SessionCompositionConfig>;

  /** Criteria for identifying new content (uses defaults if not provided) */
  newContentCriteria?: Partial<NewContentCriteria>;

  /** Criteria for identifying weak areas (uses defaults if not provided) */
  weakAreaCriteria?: Partial<WeakAreaCriteria>;

  /** Current date (for testing purposes) */
  currentDate?: Date;
}

/**
 * Compose a practice session with balanced content
 *
 * Main entry point for session composition. Orchestrates the entire process:
 * 1. Calculate category allocation based on config
 * 2. Identify skills in each category (new, review, weak, random)
 * 3. Select templates for each category with SRS priority weighting
 * 4. Build and shuffle the final session plan
 *
 * Requirements:
 * - 5.6: Balance new (10-30%), review (40-60%), weak areas (10-30%), random (10-20%)
 *
 * @param options - Session composition options
 * @returns SessionCompositionResult with discriminated union status
 *
 * @example
 * ```typescript
 * const result = await composeSession({
 *   userId: 'user-123',
 *   gradeRange: '4-6',
 *   skillsProgress: userSkillsData,
 *   config: { totalExercises: 30 }
 * });
 *
 * if (result.status === 'success') {
 *   console.log(`Session with ${result.sessionPlan.exercises.length} exercises`);
 * }
 * ```
 */
export function composeSession(options: ComposeSessionOptions): SessionCompositionResult {
  try {
    // Merge provided config with defaults
    const config: SessionCompositionConfig = {
      ...DEFAULT_SESSION_CONFIG,
      ...options.config,
    };

    // Merge criteria with defaults
    const newContentCriteria = {
      ...DEFAULT_NEW_CONTENT_CRITERIA,
      ...options.newContentCriteria,
    };

    const weakAreaCriteria = {
      ...DEFAULT_WEAK_AREA_CRITERIA,
      ...options.weakAreaCriteria,
    };

    const currentDate = options.currentDate || new Date();

    // Validate configuration
    const validationError = validateConfig(config);
    if (validationError) {
      return {
        status: 'error',
        message: validationError,
      };
    }

    // Step 1: Calculate category allocation
    const allocation = calculateCategoryAllocation(config);

    // Step 2: Identify skills in each category
    const newSkills = identifyNewContent(
      options.skillsProgress,
      newContentCriteria,
      currentDate
    );

    const reviewSkills = identifyReviewContent(
      options.skillsProgress,
      currentDate
    );

    const weakAreaSkills = identifyWeakAreas(
      options.skillsProgress,
      weakAreaCriteria
    );

    // Step 3: Build template selection criteria
    const baseCriteria: TemplateSelectionCriteria = {
      gradeRange: options.gradeRange,
      competencyAreaId: options.competencyAreaId,
    };

    // Step 4: Select templates for each category
    const exercises: PlannedExercise[] = [];
    const usedTemplateIds = new Set<string>();

    // Select review content (highest priority)
    const reviewExercises = selectTemplatesForCategory(
      'review',
      reviewSkills,
      allocation.review,
      baseCriteria,
      usedTemplateIds
    );
    exercises.push(...reviewExercises);

    // Select weak area content
    const weakAreaExercises = selectTemplatesForCategory(
      'weak-area',
      weakAreaSkills,
      allocation.weakArea,
      baseCriteria,
      usedTemplateIds
    );
    exercises.push(...weakAreaExercises);

    // Select new content
    const newExercises = selectTemplatesForCategory(
      'new',
      newSkills,
      allocation.new,
      baseCriteria,
      usedTemplateIds
    );
    exercises.push(...newExercises);

    // Select random content (from all available, excluding used templates)
    const randomExercises = selectRandomContent(
      options.skillsProgress,
      allocation.random,
      baseCriteria,
      usedTemplateIds
    );
    exercises.push(...randomExercises);

    // Check if we have sufficient exercises
    // Accept sessions with at least 50% of requested exercises to handle edge cases
    if (exercises.length < Math.max(5, config.totalExercises * 0.5)) {
      // If we have less than 50% of requested exercises (minimum 5), report insufficient data
      return {
        status: 'insufficient-data',
        message: `Not enough content available. Found ${exercises.length} exercises, need at least ${Math.max(5, Math.ceil(config.totalExercises * 0.5))}.`,
        availableExercises: exercises.length,
        requestedExercises: config.totalExercises,
      };
    }

    // Step 5: Shuffle exercises to distribute categories throughout session
    const shuffledExercises = shuffleExercises(exercises);

    // Add position to each exercise
    shuffledExercises.forEach((exercise, index) => {
      exercise.position = index;
    });

    // Build final session plan
    const sessionPlan: SessionPlan = {
      userId: options.userId,
      gradeRange: options.gradeRange,
      competencyAreaId: options.competencyAreaId,
      config,
      allocation,
      exercises: shuffledExercises,
      composedAt: currentDate,
    };

    return {
      status: 'success',
      sessionPlan,
    };
  } catch (error) {
    return {
      status: 'error',
      message: error instanceof Error ? error.message : 'Unknown error during session composition',
      error: error instanceof Error ? error : undefined,
    };
  }
}

/**
 * Validate session composition configuration
 *
 * Ensures percentages sum to ~100 and totalExercises is reasonable.
 *
 * @param config - Configuration to validate
 * @returns Error message if invalid, undefined if valid
 */
function validateConfig(config: SessionCompositionConfig): string | undefined {
  const totalPercent =
    config.newContentPercent +
    config.reviewContentPercent +
    config.weakAreaPercent +
    config.randomPercent;

  // Allow 1% tolerance for rounding
  if (Math.abs(totalPercent - 100) > 1) {
    return `Category percentages must sum to 100 (got ${totalPercent})`;
  }

  if (config.totalExercises < 5) {
    return 'Total exercises must be at least 5';
  }

  if (config.totalExercises > 100) {
    return 'Total exercises must be at most 100';
  }

  // Validate individual percentages are within requirement bounds
  if (config.newContentPercent < 0 || config.newContentPercent > 100) {
    return `New content percent must be 0-100 (got ${config.newContentPercent})`;
  }

  if (config.reviewContentPercent < 0 || config.reviewContentPercent > 100) {
    return `Review content percent must be 0-100 (got ${config.reviewContentPercent})`;
  }

  if (config.weakAreaPercent < 0 || config.weakAreaPercent > 100) {
    return `Weak area percent must be 0-100 (got ${config.weakAreaPercent})`;
  }

  if (config.randomPercent < 0 || config.randomPercent > 100) {
    return `Random percent must be 0-100 (got ${config.randomPercent})`;
  }

  return undefined;
}

/**
 * Calculate category allocation from configuration
 *
 * Converts percentage-based configuration to actual exercise counts,
 * handling rounding to ensure total matches configured amount.
 *
 * @param config - Session composition configuration
 * @returns Category allocation with exercise counts
 */
function calculateCategoryAllocation(config: SessionCompositionConfig): CategoryAllocation {
  const { totalExercises } = config;

  // Calculate ideal allocations
  const newIdeal = (config.newContentPercent / 100) * totalExercises;
  const reviewIdeal = (config.reviewContentPercent / 100) * totalExercises;
  const weakAreaIdeal = (config.weakAreaPercent / 100) * totalExercises;
  const randomIdeal = (config.randomPercent / 100) * totalExercises;

  // Round down initially
  let newCount = Math.floor(newIdeal);
  let reviewCount = Math.floor(reviewIdeal);
  let weakAreaCount = Math.floor(weakAreaIdeal);
  let randomCount = Math.floor(randomIdeal);

  // Calculate remainder to distribute
  let allocated = newCount + reviewCount + weakAreaCount + randomCount;
  let remainder = totalExercises - allocated;

  // Distribute remainder to categories based on their fractional parts
  const fractionalParts = [
    { category: 'new', fraction: newIdeal - newCount },
    { category: 'review', fraction: reviewIdeal - reviewCount },
    { category: 'weakArea', fraction: weakAreaIdeal - weakAreaCount },
    { category: 'random', fraction: randomIdeal - randomCount },
  ].sort((a, b) => b.fraction - a.fraction);

  for (let i = 0; i < remainder; i++) {
    const category = fractionalParts[i % fractionalParts.length].category;
    if (category === 'new') newCount++;
    else if (category === 'review') reviewCount++;
    else if (category === 'weakArea') weakAreaCount++;
    else if (category === 'random') randomCount++;
  }

  return {
    new: newCount,
    review: reviewCount,
    weakArea: weakAreaCount,
    random: randomCount,
    total: totalExercises,
  };
}

/**
 * Identify new content skills
 *
 * Finds skills that are either:
 * - Never practiced (attempts === 0)
 * - Rarely practiced (attempts < threshold)
 * - Not practiced recently (lastPracticed > threshold days ago)
 *
 * @param skillsProgress - All user skills progress
 * @param criteria - Criteria for identifying new content
 * @param currentDate - Current date
 * @returns Array of skills considered "new content"
 */
function identifyNewContent(
  skillsProgress: SkillProgress[],
  criteria: NewContentCriteria,
  currentDate: Date
): SkillProgress[] {
  return skillsProgress.filter(skill => {
    // Never practiced
    if (skill.attempts === 0) {
      return true;
    }

    // Rarely practiced
    if (skill.attempts < criteria.maxAttempts) {
      return true;
    }

    // Not practiced recently
    const daysSinceLastPractice =
      (currentDate.getTime() - skill.lastPracticed.getTime()) / (24 * 60 * 60 * 1000);

    if (daysSinceLastPractice >= criteria.minDaysSinceLastPractice) {
      return true;
    }

    return false;
  });
}

/**
 * Identify review content skills
 *
 * Uses the existing SRS getDueSkillsSortedByPriority function to find
 * skills that are due for review based on their next review date.
 *
 * @param skillsProgress - All user skills progress
 * @param currentDate - Current date
 * @returns Array of skills due for review, sorted by priority
 */
function identifyReviewContent(
  skillsProgress: SkillProgress[],
  currentDate: Date
): SkillProgress[] {
  return getDueSkillsSortedByPriority(skillsProgress, currentDate);
}

/**
 * Identify weak area skills
 *
 * Finds skills with low mastery levels that need improvement.
 * Requires minimum attempts to ensure sufficient data.
 *
 * @param skillsProgress - All user skills progress
 * @param criteria - Criteria for identifying weak areas
 * @returns Array of skills considered "weak areas", sorted by mastery (lowest first)
 */
function identifyWeakAreas(
  skillsProgress: SkillProgress[],
  criteria: WeakAreaCriteria
): SkillProgress[] {
  const weakSkills = skillsProgress.filter(
    skill =>
      skill.masteryLevel <= criteria.maxMasteryLevel &&
      skill.attempts >= criteria.minAttempts
  );

  // Sort by mastery level (lowest first) for prioritization
  return weakSkills.sort((a, b) => a.masteryLevel - b.masteryLevel);
}

/**
 * Select templates for a content category
 *
 * Selects the specified number of templates for a category, using skill
 * progress data to inform template selection via SRS priority weighting.
 * Allows selecting multiple templates per skill by cycling through skills.
 *
 * @param category - Content category
 * @param skills - Skills in this category (sorted by priority)
 * @param count - Number of exercises to select
 * @param baseCriteria - Base template selection criteria
 * @param usedTemplateIds - Set of already used template IDs (to avoid duplicates)
 * @returns Array of planned exercises
 */
function selectTemplatesForCategory(
  category: ContentCategory,
  skills: SkillProgress[],
  count: number,
  baseCriteria: TemplateSelectionCriteria,
  usedTemplateIds: Set<string>
): PlannedExercise[] {
  const exercises: PlannedExercise[] = [];

  // If no skills available for this category, return empty
  if (skills.length === 0 || count === 0) {
    return exercises;
  }

  // Track failed attempts to avoid infinite loops
  let consecutiveFailures = 0;
  const maxConsecutiveFailures = skills.length;

  // Keep selecting until we have enough or can't find more
  while (exercises.length < count && consecutiveFailures < maxConsecutiveFailures) {
    // Cycle through skills in priority order
    const skillIndex = exercises.length % skills.length;
    const skill = skills[skillIndex];

    // Build selection criteria for this skill
    const criteria: TemplateSelectionCriteria = {
      ...baseCriteria,
      skillsAreaId: skill.skillId,
      excludeTemplateIds: Array.from(usedTemplateIds),
    };

    // Calculate selection weights based on category
    const weights = calculateSelectionWeights(category, skill);

    // Select template with weighted selection
    const templateId = templateRegistry.select(
      criteria,
      weights,
      skill.masteryLevel
    );

    if (templateId) {
      exercises.push({
        templateId,
        category,
        skillId: skill.skillId,
        skillProgress: skill,
        position: 0, // Will be set after shuffling
      });

      usedTemplateIds.add(templateId);
      consecutiveFailures = 0; // Reset failure count on success
    } else {
      // No template found for this skill, count as failure
      consecutiveFailures++;
    }
  }

  return exercises;
}

/**
 * Select random content
 *
 * Selects random exercises from all available skills to add variety
 * and prevent sessions from becoming too predictable.
 * Allows selecting multiple templates per skill.
 *
 * @param skillsProgress - All user skills progress
 * @param count - Number of random exercises to select
 * @param baseCriteria - Base template selection criteria
 * @param usedTemplateIds - Set of already used template IDs
 * @returns Array of planned exercises
 */
function selectRandomContent(
  skillsProgress: SkillProgress[],
  count: number,
  baseCriteria: TemplateSelectionCriteria,
  usedTemplateIds: Set<string>
): PlannedExercise[] {
  const exercises: PlannedExercise[] = [];

  if (count === 0 || skillsProgress.length === 0) {
    return exercises;
  }

  // Shuffle skills for random selection
  const shuffledSkills = [...skillsProgress].sort(() => Math.random() - 0.5);

  // Track failed attempts to avoid infinite loops
  let consecutiveFailures = 0;
  const maxConsecutiveFailures = shuffledSkills.length;

  // Keep selecting until we have enough or can't find more
  while (exercises.length < count && consecutiveFailures < maxConsecutiveFailures) {
    // Cycle through shuffled skills
    const skillIndex = exercises.length % shuffledSkills.length;
    const skill = shuffledSkills[skillIndex];

    const criteria: TemplateSelectionCriteria = {
      ...baseCriteria,
      skillsAreaId: skill.skillId,
      excludeTemplateIds: Array.from(usedTemplateIds),
    };

    // Use balanced weights for random content
    const weights = {
      srsBaseline: 1.0,
      bindingBonus: 0.2,
      recencyPenalty: 0.3,
      masteryAdjustment: 0.0,
    };

    const templateId = templateRegistry.select(
      criteria,
      weights,
      skill.masteryLevel
    );

    if (templateId) {
      exercises.push({
        templateId,
        category: 'random',
        skillId: skill.skillId,
        skillProgress: skill,
        position: 0,
      });

      usedTemplateIds.add(templateId);
      consecutiveFailures = 0; // Reset on success
    } else {
      consecutiveFailures++;
    }
  }

  return exercises;
}

/**
 * Calculate selection weights for template selection
 *
 * Adjusts template selection weights based on content category and skill progress.
 * Different categories prioritize different factors:
 * - Review: High SRS baseline, high binding bonus (prioritize mandatory content)
 * - Weak Area: Lower difficulty preference, high binding bonus
 * - New: Balanced weights, slight recency penalty
 * - Random: Balanced weights
 *
 * @param category - Content category
 * @param skill - Skill progress data
 * @returns Selection weights for template registry
 */
function calculateSelectionWeights(
  category: ContentCategory,
  skill: SkillProgress
): Partial<{ srsBaseline: number; bindingBonus: number; recencyPenalty: number; masteryAdjustment: number }> {
  switch (category) {
    case 'review':
      // Review content: prioritize due items and binding content
      return {
        srsBaseline: 1.5, // Higher baseline for review items
        bindingBonus: 0.4, // Strong preference for binding content
        recencyPenalty: 0.5,
        masteryAdjustment: 0.2, // Adjust for appropriate difficulty
      };

    case 'weak-area':
      // Weak areas: focus on binding content and appropriate difficulty
      return {
        srsBaseline: 1.0,
        bindingBonus: 0.4, // Strong preference for binding content
        recencyPenalty: 0.3,
        masteryAdjustment: 0.3, // Higher adjustment to match difficulty to low mastery
      };

    case 'new':
      // New content: balanced selection
      return {
        srsBaseline: 1.0,
        bindingBonus: 0.3,
        recencyPenalty: 0.4, // Higher penalty to ensure variety in new content
        masteryAdjustment: 0.1,
      };

    case 'random':
      // Random: balanced weights for variety
      return {
        srsBaseline: 1.0,
        bindingBonus: 0.2,
        recencyPenalty: 0.3,
        masteryAdjustment: 0.0,
      };
  }
}

/**
 * Shuffle exercises to distribute categories throughout session
 *
 * Uses a smart shuffling algorithm that:
 * 1. Prevents same category from clustering together
 * 2. Distributes categories evenly throughout the session
 * 3. Maintains some randomness while avoiding patterns
 *
 * Algorithm:
 * - Group exercises by category
 * - Calculate ideal spacing for each category
 * - Place exercises at evenly distributed positions
 * - Add small random offset to prevent perfect regularity
 *
 * @param exercises - Unshuffled exercises
 * @returns Shuffled exercises with distributed categories
 */
function shuffleExercises(exercises: PlannedExercise[]): PlannedExercise[] {
  if (exercises.length === 0) {
    return exercises;
  }

  // Group exercises by category
  const byCategory = exercises.reduce((acc, exercise) => {
    if (!acc[exercise.category]) {
      acc[exercise.category] = [];
    }
    acc[exercise.category].push(exercise);
    return acc;
  }, {} as Record<ContentCategory, PlannedExercise[]>);

  // Create result array
  const result: (PlannedExercise | null)[] = new Array(exercises.length).fill(null);

  // Place each category's exercises at evenly distributed positions
  const categories = Object.keys(byCategory) as ContentCategory[];

  for (const category of categories) {
    const categoryExercises = byCategory[category];
    const spacing = exercises.length / categoryExercises.length;

    categoryExercises.forEach((exercise, index) => {
      // Calculate base position with even spacing
      let position = Math.floor(index * spacing);

      // Add small random offset (±20% of spacing) to prevent perfect regularity
      const offset = Math.floor((Math.random() - 0.5) * spacing * 0.4);
      position = Math.max(0, Math.min(exercises.length - 1, position + offset));

      // Find next available slot if position is taken
      while (result[position] !== null) {
        position = (position + 1) % exercises.length;
      }

      result[position] = exercise;
    });
  }

  // Filter out any null values (shouldn't happen, but for type safety)
  return result.filter((ex): ex is PlannedExercise => ex !== null);
}
