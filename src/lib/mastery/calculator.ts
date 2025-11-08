/**
 * Mastery Calculation Engine
 *
 * Calculates mastery scores (0-100) from exercise attempt history using a weighted
 * algorithm that combines five factors:
 *
 * 1. Recent Performance (45%): Success rate from last 10-20 attempts with recency weighting
 * 2. Response Speed (20%): Speed comparison vs difficulty benchmarks
 * 3. Hint Usage (15%): Penalty for hints requested
 * 4. Consistency (10%): Standard deviation of recent performance
 * 5. Time Decay (10%): Exponential decay for skills not practiced recently
 *
 * Requirements:
 * - 5.2: Calculate mastery scores from multiple weighted factors
 * - 5.7: Map scores to visual mastery bands (0-20 red, 21-40 yellow, etc.)
 * - 13.2: Performance target <5ms per calculation
 *
 * @module mastery/calculator
 */

import type { ExerciseAttempt, SkillProgress, MasteryLevelBand } from './types';
import type { Difficulty, GradeRange } from '../curriculum/types';
import { MASTERY_LEVELS } from './types';
import { memoize } from '../utils/memoization';

/**
 * Discriminated union for mastery calculation results
 * Enables type-safe handling of different calculation outcomes
 */
export type MasteryCalculationResult =
  | { status: 'success'; masteryLevel: number }
  | { status: 'insufficient-data'; masteryLevel: number; message: string }
  | { status: 'error'; message: string };

/**
 * Configuration constants for mastery calculation algorithm
 */
const WEIGHTS = {
  RECENT_PERFORMANCE: 0.45,
  RESPONSE_SPEED: 0.20,
  HINT_USAGE: 0.15,
  CONSISTENCY: 0.10,
  TIME_DECAY: 0.10,
} as const;

const CONFIG = {
  MIN_ATTEMPTS_FOR_FULL_CALCULATION: 5,
  RECENT_ATTEMPTS_WINDOW: 20,
  RECENCY_DECAY_RATE: 0.1,
  TIME_DECAY_HALF_LIFE_DAYS: 14,
  SUSPICIOUSLY_FAST_SECONDS: 10,
} as const;

/**
 * Expected response time benchmarks by grade range and difficulty (in seconds)
 * Based on typical student performance patterns
 */
const RESPONSE_TIME_BENCHMARKS: Record<GradeRange, Record<Difficulty, { min: number; expected: number; max: number }>> = {
  '0-3': {
    A: { min: 15, expected: 30, max: 60 },
    B: { min: 20, expected: 45, max: 90 },
    C: { min: 30, expected: 60, max: 120 },
  },
  '4-6': {
    A: { min: 20, expected: 40, max: 80 },
    B: { min: 30, expected: 60, max: 120 },
    C: { min: 45, expected: 90, max: 180 },
  },
  '7-9': {
    A: { min: 30, expected: 60, max: 120 },
    B: { min: 45, expected: 90, max: 180 },
    C: { min: 60, expected: 120, max: 240 },
  },
};

/**
 * Internal mastery calculation function (unmemoized)
 *
 * Calculates mastery level (0-100) from recent exercise attempts using a weighted
 * algorithm combining five factors. Uses discriminated union for type-safe result handling.
 *
 * @param recentAttempts - Array of recent exercise attempts (typically last 20)
 * @param skillProgress - Current skill progress data (for avgResponseTime and lastPracticed)
 * @returns MasteryCalculationResult with status and calculated mastery level
 */
function calculateMasteryLevelInternal(
  recentAttempts: ExerciseAttempt[],
  skillProgress: SkillProgress
): MasteryCalculationResult {
  // Edge case: No attempts
  if (recentAttempts.length === 0) {
    return {
      status: 'insufficient-data',
      masteryLevel: 0,
      message: 'No attempts recorded',
    };
  }

  // Edge case: Insufficient data for full calculation
  if (recentAttempts.length < CONFIG.MIN_ATTEMPTS_FOR_FULL_CALCULATION) {
    const basicMastery = calculateBasicMastery(recentAttempts);
    return {
      status: 'insufficient-data',
      masteryLevel: basicMastery,
      message: `Only ${recentAttempts.length} attempts available (need ${CONFIG.MIN_ATTEMPTS_FOR_FULL_CALCULATION} for full calculation)`,
    };
  }

  try {
    // Calculate each factor (normalized to 0-1)
    const recentPerf = calculateRecentPerformance(recentAttempts);
    const speedFactor = calculateResponseSpeedFactor(recentAttempts, skillProgress);
    const hintFactor = calculateHintUsageFactor(recentAttempts);
    const consistency = calculateConsistencyScore(recentAttempts);
    const timeDecay = calculateTimeDecayFactor(skillProgress.lastPracticed);

    // Combine factors with weights and scale to 0-100
    const weightedScore =
      recentPerf * WEIGHTS.RECENT_PERFORMANCE +
      speedFactor * WEIGHTS.RESPONSE_SPEED +
      hintFactor * WEIGHTS.HINT_USAGE +
      consistency * WEIGHTS.CONSISTENCY +
      timeDecay * WEIGHTS.TIME_DECAY;

    const mastery = weightedScore * 100;

    // Clamp to valid range and round
    const masteryLevel = Math.max(0, Math.min(100, Math.round(mastery)));

    return {
      status: 'success',
      masteryLevel,
    };
  } catch (error) {
    return {
      status: 'error',
      message: error instanceof Error ? error.message : 'Unknown error during calculation',
    };
  }
}

/**
 * Memoized mastery calculation function
 *
 * Caches calculation results for identical input combinations,
 * providing significant performance improvements for repeated calculations.
 *
 * @param recentAttempts - Array of recent exercise attempts (typically last 20)
 * @param skillProgress - Current skill progress data (for avgResponseTime and lastPracticed)
 * @returns MasteryCalculationResult with status and calculated mastery level
 *
 * @example
 * ```typescript
 * const result = calculateMasteryLevel(attempts, progress);
 * if (result.status === 'success') {
 *   console.log(`Mastery level: ${result.masteryLevel}`);
 * }
 * ```
 */
export const calculateMasteryLevel = memoize(calculateMasteryLevelInternal, {
  maxSize: 200,
  keySerializer: (attempts: ExerciseAttempt[], progress: SkillProgress) => {
    // Create cache key from relevant data
    const attemptKeys = attempts
      .slice(0, CONFIG.RECENT_ATTEMPTS_WINDOW)
      .map(a => `${a.correct ? '1' : '0'}${a.timeSpentSeconds}${a.hintsUsed}`)
      .join('-');
    const progressKey = `${progress.skillId}_${progress.lastPracticed?.getTime() || 0}_${progress.avgResponseTime || 0}`;
    return `${attemptKeys}_${progressKey}`;
  },
});

/**
 * Calculate basic mastery for insufficient data (<5 attempts)
 * Simple success rate without advanced weighting
 *
 * @param attempts - Array of exercise attempts
 * @returns Basic mastery score (0-100)
 */
function calculateBasicMastery(attempts: ExerciseAttempt[]): number {
  const successCount = attempts.filter(a => a.correct).length;
  const successRate = successCount / attempts.length;

  // Scale to 0-60 range (can't achieve "mastered" with <5 attempts)
  const mastery = successRate * 60;

  return Math.round(mastery);
}

/**
 * Calculate recent performance factor (0-1)
 *
 * Uses exponential recency weighting where more recent attempts have higher weight.
 * Formula: weight(i) = e^(-decay * (n - i)) where i = attempt index (0 = oldest)
 *
 * Weight distribution example for 10 attempts:
 * - Attempt 0 (oldest): ~0.37
 * - Attempt 5 (middle): ~0.61
 * - Attempt 9 (newest): 1.00
 *
 * @param recentAttempts - Array of recent attempts (up to 20)
 * @returns Weighted success rate (0-1)
 */
export function calculateRecentPerformance(recentAttempts: ExerciseAttempt[]): number {
  if (recentAttempts.length === 0) return 0;

  const n = recentAttempts.length;
  let weightedSum = 0;
  let totalWeight = 0;

  for (let i = 0; i < n; i++) {
    // Exponential recency weight: newer attempts have weight closer to 1
    const weight = Math.exp(-CONFIG.RECENCY_DECAY_RATE * (n - 1 - i));
    const value = recentAttempts[i]?.correct ? 1 : 0;

    weightedSum += value * weight;
    totalWeight += weight;
  }

  return totalWeight > 0 ? weightedSum / totalWeight : 0;
}

/**
 * Calculate response speed factor (0-1)
 *
 * Compares average response time to expected time for difficulty level.
 * - Within expected range: 1.0 (best score)
 * - Slower than expected: decay based on how much slower
 * - Suspiciously fast (<10s): penalty (likely guessing)
 *
 * @param recentAttempts - Array of recent attempts
 * @param skillProgress - Current skill progress (contains avgResponseTime)
 * @returns Response speed score (0-1)
 */
export function calculateResponseSpeedFactor(
  recentAttempts: ExerciseAttempt[],
  skillProgress: SkillProgress
): number {
  if (recentAttempts.length === 0) return 0.5; // Neutral score for no data

  // Get the most common grade range and difficulty from recent attempts
  const { gradeRange, difficulty } = getMostCommonDifficulty(recentAttempts);
  const benchmark = RESPONSE_TIME_BENCHMARKS[gradeRange][difficulty];

  const avgTime = skillProgress.avgResponseTime / 1000; // Convert ms to seconds

  // Suspiciously fast (likely guessing)
  if (avgTime < CONFIG.SUSPICIOUSLY_FAST_SECONDS) {
    return 0.4; // Penalty for rushing
  }

  // Within optimal range
  if (avgTime >= benchmark.min && avgTime <= benchmark.expected) {
    return 1.0;
  }

  // Slower than expected: decay exponentially
  if (avgTime > benchmark.expected) {
    const excessTime = avgTime - benchmark.expected;
    const maxExcess = benchmark.max - benchmark.expected;
    const slownessFactor = Math.min(excessTime / maxExcess, 2); // Cap at 2x expected
    return Math.max(0.3, 1.0 - slownessFactor * 0.5); // Decay from 1.0 to 0.3
  }

  // Faster than expected but not suspicious (good!)
  return 1.0;
}

/**
 * Extract most common grade range and difficulty from recent attempts
 * Used for determining appropriate response time benchmarks
 *
 * @param attempts - Array of exercise attempts
 * @returns Most common grade range and difficulty
 */
function getMostCommonDifficulty(attempts: ExerciseAttempt[]): { gradeRange: GradeRange; difficulty: Difficulty } {
  if (attempts.length === 0) {
    return { gradeRange: '0-3', difficulty: 'A' }; // Default fallback
  }

  // Count occurrences of each difficulty
  const difficultyCount = new Map<Difficulty, number>();
  const gradeRangeCount = new Map<GradeRange, number>();

  for (const attempt of attempts) {
    difficultyCount.set(attempt.difficulty, (difficultyCount.get(attempt.difficulty) ?? 0) + 1);

    // Extract grade range from skillId (format: "competency:skill:gradeRange")
    // For now, use a heuristic or default
    const gradeRange = extractGradeRangeFromSkillId(attempt.skillId);
    gradeRangeCount.set(gradeRange, (gradeRangeCount.get(gradeRange) ?? 0) + 1);
  }

  // Find most common
  let maxDifficultyCount = 0;
  let mostCommonDifficulty: Difficulty = 'A';
  difficultyCount.forEach((count, diff) => {
    if (count > maxDifficultyCount) {
      maxDifficultyCount = count;
      mostCommonDifficulty = diff;
    }
  });

  let maxGradeRangeCount = 0;
  let mostCommonGradeRange: GradeRange = '0-3';
  gradeRangeCount.forEach((count, grade) => {
    if (count > maxGradeRangeCount) {
      maxGradeRangeCount = count;
      mostCommonGradeRange = grade;
    }
  });

  return { gradeRange: mostCommonGradeRange, difficulty: mostCommonDifficulty };
}

/**
 * Extract grade range from skill ID
 * Skill IDs follow format: "competency-area:skill-area:specific-skill"
 * Grade range is typically encoded in the structure
 *
 * @param skillId - Skill identifier
 * @returns Extracted or default grade range
 */
function extractGradeRangeFromSkillId(skillId: string): GradeRange {
  // For now, return a sensible default
  // In production, this would parse the skillId structure
  // Example: "tal-og-algebra:addition:basic-0-3" -> "0-3"
  if (skillId.includes('0-3')) return '0-3';
  if (skillId.includes('4-6')) return '4-6';
  if (skillId.includes('7-9')) return '7-9';

  return '0-3'; // Default to youngest grade range
}

/**
 * Calculate hint usage factor (0-1)
 *
 * Applies penalty based on average hints used per attempt.
 * Penalty scale:
 * - 0 hints avg: 1.0 (100% - no penalty)
 * - 0.5 hints avg: 0.85
 * - 1-2 hints avg: 0.70
 * - 3+ hints avg: 0.40
 *
 * @param recentAttempts - Array of recent attempts
 * @returns Hint usage score (0-1, where 1 = no hints)
 */
export function calculateHintUsageFactor(recentAttempts: ExerciseAttempt[]): number {
  if (recentAttempts.length === 0) return 1.0; // No attempts = no penalty

  const totalHints = recentAttempts.reduce((sum, attempt) => sum + attempt.hintsUsed, 0);
  const avgHints = totalHints / recentAttempts.length;

  // Penalty curve: exponential decay
  // 0 hints = 1.0, 1 hint = 0.70, 2 hints = 0.50, 3+ hints = 0.40
  if (avgHints === 0) return 1.0;
  if (avgHints <= 0.5) return 0.85;
  if (avgHints <= 1.0) return 0.75;
  if (avgHints <= 2.0) return 0.60;
  if (avgHints <= 3.0) return 0.50;
  return 0.40; // Heavy penalty for 3+ hints
}

/**
 * Calculate consistency score (0-1)
 *
 * Measures consistency of performance using standard deviation of recent attempts.
 * Lower standard deviation = more consistent = higher score.
 *
 * Standard deviation calculation:
 * - Binary array: [1,1,0,1,0] (1 = correct, 0 = incorrect)
 * - Calculate σ (standard deviation)
 * - Score = 1 - (σ / maxPossibleStdDev)
 *
 * @param recentAttempts - Array of recent attempts
 * @returns Consistency score (0-1)
 */
export function calculateConsistencyScore(recentAttempts: ExerciseAttempt[]): number {
  if (recentAttempts.length < 2) return 0.5; // Need at least 2 attempts

  // Create binary array (1 = correct, 0 = incorrect)
  const binaryResults = recentAttempts.map(attempt => attempt.correct ? 1 : 0);

  // Calculate mean
  const mean = binaryResults.reduce((sum, val) => sum + val, 0) / binaryResults.length;

  // Calculate variance
  const variance = binaryResults.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / binaryResults.length;

  // Calculate standard deviation
  const stdDev = Math.sqrt(variance);

  // Maximum possible standard deviation for binary data is 0.5 (occurs at 50% success rate)
  const maxStdDev = 0.5;

  // Score: lower stdDev = more consistent = higher score
  const consistencyScore = 1 - (stdDev / maxStdDev);

  return Math.max(0, Math.min(1, consistencyScore));
}

/**
 * Calculate time decay factor (0-1)
 *
 * Applies exponential decay based on days since last practice.
 * Skills not practiced recently show slight decay in mastery.
 *
 * Decay formula: e^(-ln(2) * daysSinceLastPractice / halfLife)
 * - Half-life: 14 days (skill retention decays to 50% at 14 days)
 * - Today: 1.0 (100% retention)
 * - 14 days: 0.5 (50% retention)
 * - 28 days: 0.25 (25% retention)
 * - 60 days: ~0.06 (6% retention)
 *
 * @param lastPracticed - Date of last practice
 * @returns Time decay factor (0-1)
 */
export function calculateTimeDecayFactor(lastPracticed: Date): number {
  const now = new Date();
  const daysSinceLastPractice = (now.getTime() - lastPracticed.getTime()) / (1000 * 60 * 60 * 24);

  // No decay if practiced today
  if (daysSinceLastPractice < 1) return 1.0;

  // Exponential decay with half-life
  const halfLife = CONFIG.TIME_DECAY_HALF_LIFE_DAYS;
  const decayFactor = Math.exp(-Math.LN2 * daysSinceLastPractice / halfLife);

  return Math.max(0.05, decayFactor); // Floor at 5% (never fully forgotten)
}

/**
 * Get mastery level band for a given score
 *
 * Maps numeric mastery score (0-100) to visual mastery bands per Requirement 5.7:
 * - 0-20: introduced (red)
 * - 21-40: developing (yellow)
 * - 41-60: progressing (light-green)
 * - 61-80: proficient (green)
 * - 81-100: mastered (blue)
 *
 * @param masteryScore - Numeric mastery score (0-100)
 * @returns MasteryLevelBand with level, range, and color code
 *
 * @example
 * ```typescript
 * const band = getMasteryLevelBand(75);
 * console.log(band.level); // "proficient"
 * console.log(band.colorCode); // "green"
 * ```
 */
export function getMasteryLevelBand(masteryScore: number): MasteryLevelBand {
  // Clamp score to valid range
  const score = Math.max(0, Math.min(100, masteryScore));

  // Find matching band
  for (const band of MASTERY_LEVELS) {
    if (score >= band.min && score <= band.max) {
      return band;
    }
  }

  // Fallback (should never reach here due to band coverage)
  return MASTERY_LEVELS[0]!;
}
