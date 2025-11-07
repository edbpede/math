/**
 * Spaced Repetition System (SRS) Test Suite
 *
 * Comprehensive tests for SuperMemo 2 algorithm implementation including:
 * - SRS parameter initialization
 * - Interval calculation on correct answers (exponential growth)
 * - Interval reset on incorrect answers
 * - Ease factor adjustment based on response quality
 * - Next review date calculation
 * - Review priority calculation
 * - Edge cases and boundary conditions
 *
 * Requirements:
 * - 5.3: Implement modified SuperMemo 2 spaced repetition algorithm
 * - 5.4: Increase review intervals exponentially on correct answers
 * - 5.5: Reset intervals on incorrect answers
 */

import { describe, it, expect } from 'vitest';
import {
  initializeSRSParameters,
  calculateQualityScore,
  updateSRSParameters,
  calculateNextReviewDate,
  isSkillDueForReview,
  calculateReviewPriority,
  getDueSkillsSortedByPriority,
} from './srs';
import type { SRSParameters, SRSUpdateInput, SkillProgress } from './types';

// ============================================================================
// Test Data Factories
// ============================================================================

function createSRSParams(overrides: Partial<SRSParameters> = {}): SRSParameters {
  return {
    easeFactor: 2.5,
    interval: 1,
    repetitionCount: 0,
    ...overrides,
  };
}

function createSkillProgress(overrides: Partial<SkillProgress> = {}): SkillProgress {
  return {
    skillId: 'test-skill',
    masteryLevel: 50,
    srsParams: createSRSParams(),
    attempts: 0,
    successes: 0,
    avgResponseTime: 30000,
    lastPracticed: new Date(),
    nextReview: new Date(Date.now() + 86400000), // Tomorrow
    ...overrides,
  };
}

// ============================================================================
// initializeSRSParameters() Tests
// ============================================================================

describe('initializeSRSParameters', () => {
  it('should initialize with default SuperMemo 2 values', () => {
    const params = initializeSRSParameters();

    expect(params.easeFactor).toBe(2.5);
    expect(params.interval).toBe(1);
    expect(params.repetitionCount).toBe(0);
  });

  it('should return new object each time (not reuse reference)', () => {
    const params1 = initializeSRSParameters();
    const params2 = initializeSRSParameters();

    expect(params1).not.toBe(params2);
    expect(params1).toEqual(params2);
  });
});

// ============================================================================
// calculateQualityScore() Tests
// ============================================================================

describe('calculateQualityScore', () => {
  describe('Correct answers', () => {
    it('should return quality 5 for perfect response (high quality)', () => {
      expect(calculateQualityScore(true, 1.0)).toBe(5);
      expect(calculateQualityScore(true, 0.9)).toBe(5);
      expect(calculateQualityScore(true, 0.67)).toBe(5);
    });

    it('should return quality 4 for good response (medium quality)', () => {
      expect(calculateQualityScore(true, 0.66)).toBe(4);
      expect(calculateQualityScore(true, 0.5)).toBe(4);
      expect(calculateQualityScore(true, 0.34)).toBe(4);
    });

    it('should return quality 3 for correct with difficulty (low quality)', () => {
      expect(calculateQualityScore(true, 0.33)).toBe(3);
      expect(calculateQualityScore(true, 0.2)).toBe(3);
      expect(calculateQualityScore(true, 0.0)).toBe(3);
    });
  });

  describe('Incorrect answers', () => {
    it('should return quality 2 for remembered but incorrect (high quality)', () => {
      expect(calculateQualityScore(false, 1.0)).toBe(2);
      expect(calculateQualityScore(false, 0.9)).toBe(2);
      expect(calculateQualityScore(false, 0.67)).toBe(2);
    });

    it('should return quality 1 for vague memory (medium quality)', () => {
      expect(calculateQualityScore(false, 0.66)).toBe(1);
      expect(calculateQualityScore(false, 0.5)).toBe(1);
      expect(calculateQualityScore(false, 0.34)).toBe(1);
    });

    it('should return quality 0 for complete blackout (low quality)', () => {
      expect(calculateQualityScore(false, 0.33)).toBe(0);
      expect(calculateQualityScore(false, 0.2)).toBe(0);
      expect(calculateQualityScore(false, 0.0)).toBe(0);
    });
  });

  describe('Edge cases', () => {
    it('should clamp quality values above 1.0', () => {
      expect(calculateQualityScore(true, 1.5)).toBe(5);
      expect(calculateQualityScore(true, 10.0)).toBe(5);
    });

    it('should clamp quality values below 0.0', () => {
      expect(calculateQualityScore(true, -0.5)).toBe(3);
      expect(calculateQualityScore(false, -1.0)).toBe(0);
    });
  });
});

// ============================================================================
// updateSRSParameters() - Correct Answer Tests (Req 5.4: Exponential Growth)
// ============================================================================

describe('updateSRSParameters - Correct Answers', () => {
  it('should set interval to 1 day on first correct answer', () => {
    const input: SRSUpdateInput = {
      wasCorrect: true,
      responseQuality: 0.8,
      currentParams: createSRSParams({
        easeFactor: 2.5,
        interval: 1,
        repetitionCount: 0,
      }),
    };

    const result = updateSRSParameters(input);

    expect(result.newParams.interval).toBe(1);
    expect(result.newParams.repetitionCount).toBe(1);
  });

  it('should set interval to 3 days on second correct answer', () => {
    const input: SRSUpdateInput = {
      wasCorrect: true,
      responseQuality: 0.8,
      currentParams: createSRSParams({
        easeFactor: 2.5,
        interval: 1,
        repetitionCount: 1,
      }),
    };

    const result = updateSRSParameters(input);

    expect(result.newParams.interval).toBe(3);
    expect(result.newParams.repetitionCount).toBe(2);
  });

  it('should calculate exponential interval growth after second repetition', () => {
    // Third repetition: interval = previous * easeFactor
    const input: SRSUpdateInput = {
      wasCorrect: true,
      responseQuality: 0.8,
      currentParams: createSRSParams({
        easeFactor: 2.5,
        interval: 3,
        repetitionCount: 2,
      }),
    };

    const result = updateSRSParameters(input);

    // 3 * 2.5 = 7.5, rounded to 8
    expect(result.newParams.interval).toBe(8);
    expect(result.newParams.repetitionCount).toBe(3);
  });

  it('should continue exponential growth for subsequent repetitions', () => {
    // Fourth repetition
    const input: SRSUpdateInput = {
      wasCorrect: true,
      responseQuality: 0.8,
      currentParams: createSRSParams({
        easeFactor: 2.5,
        interval: 8,
        repetitionCount: 3,
      }),
    };

    const result = updateSRSParameters(input);

    // 8 * adjusted_EF (2.5 -> ~2.58) = ~21
    expect(result.newParams.interval).toBeGreaterThanOrEqual(20);
    expect(result.newParams.interval).toBeLessThanOrEqual(22);
    expect(result.newParams.repetitionCount).toBe(4);
  });

  it('should demonstrate full exponential sequence (1, 3, 8+, 20+, 50+...)', () => {
    let params = createSRSParams({ easeFactor: 2.5, interval: 1, repetitionCount: 0 });
    const expectedMinIntervals = [1, 3, 8, 20, 50];

    for (let i = 0; i < expectedMinIntervals.length; i++) {
      const result = updateSRSParameters({
        wasCorrect: true,
        responseQuality: 0.8,
        currentParams: params,
      });

      // Allow for ease factor adjustments affecting exact values
      const expectedMin = expectedMinIntervals[i]!;
      expect(result.newParams.interval).toBeGreaterThanOrEqual(expectedMin);
      // Allow up to 40% variation due to EF adjustments accumulating over multiple iterations
      expect(result.newParams.interval).toBeLessThanOrEqual(Math.ceil(expectedMin * 1.4));
      params = result.newParams;
    }
  });

  it('should increase ease factor for perfect responses (quality 5)', () => {
    const input: SRSUpdateInput = {
      wasCorrect: true,
      responseQuality: 1.0, // Quality 5
      currentParams: createSRSParams({ easeFactor: 2.5 }),
    };

    const result = updateSRSParameters(input);

    // EF should increase for quality 5
    expect(result.newParams.easeFactor).toBeGreaterThan(2.5);
  });

  it('should maintain ease factor for good responses (quality 4)', () => {
    const input: SRSUpdateInput = {
      wasCorrect: true,
      responseQuality: 0.5, // Quality 4
      currentParams: createSRSParams({ easeFactor: 2.5 }),
    };

    const result = updateSRSParameters(input);

    // EF should stay approximately the same for quality 4
    expect(result.newParams.easeFactor).toBeGreaterThanOrEqual(2.4);
    expect(result.newParams.easeFactor).toBeLessThanOrEqual(2.6);
  });

  it('should slightly decrease ease factor for difficult correct responses (quality 3)', () => {
    const input: SRSUpdateInput = {
      wasCorrect: true,
      responseQuality: 0.2, // Quality 3
      currentParams: createSRSParams({ easeFactor: 2.5 }),
    };

    const result = updateSRSParameters(input);

    // EF should decrease slightly for quality 3
    expect(result.newParams.easeFactor).toBeLessThan(2.5);
    expect(result.newParams.easeFactor).toBeGreaterThanOrEqual(1.3); // Above minimum
  });

  it('should clamp ease factor to maximum (3.0)', () => {
    const input: SRSUpdateInput = {
      wasCorrect: true,
      responseQuality: 1.0, // Perfect quality
      currentParams: createSRSParams({ easeFactor: 2.95 }), // Near max
    };

    const result = updateSRSParameters(input);

    expect(result.newParams.easeFactor).toBeLessThanOrEqual(3.0);
  });

  it('should clamp ease factor to minimum (1.3)', () => {
    const input: SRSUpdateInput = {
      wasCorrect: true,
      responseQuality: 0.0, // Low quality correct (quality 3)
      currentParams: createSRSParams({ easeFactor: 1.4 }), // Near min
    };

    const result = updateSRSParameters(input);

    expect(result.newParams.easeFactor).toBeGreaterThanOrEqual(1.3);
  });
});

// ============================================================================
// updateSRSParameters() - Incorrect Answer Tests (Req 5.5: Interval Reset)
// ============================================================================

describe('updateSRSParameters - Incorrect Answers', () => {
  it('should reset interval to 1 day on incorrect answer', () => {
    const input: SRSUpdateInput = {
      wasCorrect: false,
      responseQuality: 0.5,
      currentParams: createSRSParams({
        easeFactor: 2.5,
        interval: 20,
        repetitionCount: 4,
      }),
    };

    const result = updateSRSParameters(input);

    expect(result.newParams.interval).toBe(1);
  });

  it('should reset repetition count to 0 on incorrect answer', () => {
    const input: SRSUpdateInput = {
      wasCorrect: false,
      responseQuality: 0.5,
      currentParams: createSRSParams({
        easeFactor: 2.5,
        interval: 20,
        repetitionCount: 4,
      }),
    };

    const result = updateSRSParameters(input);

    expect(result.newParams.repetitionCount).toBe(0);
  });

  it('should decrease ease factor on incorrect answer', () => {
    const input: SRSUpdateInput = {
      wasCorrect: false,
      responseQuality: 0.5,
      currentParams: createSRSParams({ easeFactor: 2.5 }),
    };

    const result = updateSRSParameters(input);

    expect(result.newParams.easeFactor).toBeLessThan(2.5);
  });

  it('should decrease ease factor more for complete blackout (quality 0)', () => {
    const input: SRSUpdateInput = {
      wasCorrect: false,
      responseQuality: 0.0, // Quality 0
      currentParams: createSRSParams({ easeFactor: 2.5 }),
    };

    const result = updateSRSParameters(input);

    expect(result.newParams.easeFactor).toBeLessThan(2.3);
  });

  it('should not let ease factor drop below minimum (1.3)', () => {
    const input: SRSUpdateInput = {
      wasCorrect: false,
      responseQuality: 0.0,
      currentParams: createSRSParams({ easeFactor: 1.4 }), // Near minimum
    };

    const result = updateSRSParameters(input);

    expect(result.newParams.easeFactor).toBeGreaterThanOrEqual(1.3);
  });

  it('should demonstrate reset behavior after long interval', () => {
    // Simulate skill that had reached 50-day interval, then failed
    const input: SRSUpdateInput = {
      wasCorrect: false,
      responseQuality: 0.3,
      currentParams: createSRSParams({
        easeFactor: 2.5,
        interval: 50,
        repetitionCount: 5,
      }),
    };

    const result = updateSRSParameters(input);

    expect(result.newParams.interval).toBe(1); // Reset to 1 day
    expect(result.newParams.repetitionCount).toBe(0); // Start over
  });
});

// ============================================================================
// calculateNextReviewDate() Tests
// ============================================================================

describe('calculateNextReviewDate', () => {
  it('should calculate next review date correctly for 1 day interval', () => {
    const now = new Date();
    const nextReview = calculateNextReviewDate(1);

    const expectedTime = now.getTime() + 24 * 60 * 60 * 1000;
    const actualTime = nextReview.getTime();

    // Allow 1 second tolerance for test execution time
    expect(actualTime).toBeGreaterThan(expectedTime - 1000);
    expect(actualTime).toBeLessThan(expectedTime + 1000);
  });

  it('should calculate next review date correctly for 7 day interval', () => {
    const now = new Date();
    const nextReview = calculateNextReviewDate(7);

    const expectedTime = now.getTime() + 7 * 24 * 60 * 60 * 1000;
    const actualTime = nextReview.getTime();

    expect(actualTime).toBeGreaterThan(expectedTime - 1000);
    expect(actualTime).toBeLessThan(expectedTime + 1000);
  });

  it('should handle large intervals correctly', () => {
    const nextReview = calculateNextReviewDate(365); // 1 year

    const expectedTime = Date.now() + 365 * 24 * 60 * 60 * 1000;
    const actualTime = nextReview.getTime();

    expect(actualTime).toBeGreaterThan(expectedTime - 1000);
    expect(actualTime).toBeLessThan(expectedTime + 1000);
  });

  it('should return Date object', () => {
    const result = calculateNextReviewDate(1);
    expect(result).toBeInstanceOf(Date);
  });
});

// ============================================================================
// isSkillDueForReview() Tests
// ============================================================================

describe('isSkillDueForReview', () => {
  it('should return true if next review is in the past', () => {
    const pastDate = new Date(Date.now() - 24 * 60 * 60 * 1000); // Yesterday
    const result = isSkillDueForReview(pastDate);

    expect(result).toBe(true);
  });

  it('should return true if next review is now', () => {
    const now = new Date();
    const result = isSkillDueForReview(now, now);

    expect(result).toBe(true);
  });

  it('should return false if next review is in the future', () => {
    const futureDate = new Date(Date.now() + 24 * 60 * 60 * 1000); // Tomorrow
    const result = isSkillDueForReview(futureDate);

    expect(result).toBe(false);
  });

  it('should use custom current date if provided', () => {
    const reviewDate = new Date('2025-01-15');
    const customNow = new Date('2025-01-10');

    const result = isSkillDueForReview(reviewDate, customNow);

    expect(result).toBe(false); // Review is 5 days in future from custom date
  });
});

// ============================================================================
// calculateReviewPriority() Tests
// ============================================================================

describe('calculateReviewPriority', () => {
  it('should return higher priority for overdue skills', () => {
    const oneDayOverdue = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const threeDaysOverdue = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);

    const priority1 = calculateReviewPriority(oneDayOverdue, 2.5, 50);
    const priority2 = calculateReviewPriority(threeDaysOverdue, 2.5, 50);

    expect(priority2).toBeGreaterThan(priority1);
  });

  it('should return higher priority for lower ease factor (more difficult)', () => {
    const reviewDate = new Date(Date.now() - 24 * 60 * 60 * 1000); // 1 day overdue

    const priorityEasy = calculateReviewPriority(reviewDate, 3.0, 50); // High EF = easy
    const priorityHard = calculateReviewPriority(reviewDate, 1.5, 50); // Low EF = hard

    expect(priorityHard).toBeGreaterThan(priorityEasy);
  });

  it('should return higher priority for lower mastery level', () => {
    const reviewDate = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const priorityHighMastery = calculateReviewPriority(reviewDate, 2.5, 80);
    const priorityLowMastery = calculateReviewPriority(reviewDate, 2.5, 20);

    expect(priorityLowMastery).toBeGreaterThan(priorityHighMastery);
  });

  it('should return 0 or near-0 priority for skills not yet due', () => {
    const futureDate = new Date(Date.now() + 24 * 60 * 60 * 1000);

    const priority = calculateReviewPriority(futureDate, 2.5, 50);

    expect(priority).toBeLessThan(1); // Should be low since not overdue
  });

  it('should combine all factors appropriately', () => {
    const reviewDate = new Date(Date.now() - 5 * 24 * 60 * 60 * 1000); // 5 days overdue

    // High priority case: overdue, difficult, low mastery
    const highPriority = calculateReviewPriority(reviewDate, 1.5, 20);

    // Low priority case: not overdue, easy, high mastery
    const futureDate = new Date(Date.now() + 24 * 60 * 60 * 1000);
    const lowPriority = calculateReviewPriority(futureDate, 3.0, 90);

    expect(highPriority).toBeGreaterThan(lowPriority);
  });
});

// ============================================================================
// getDueSkillsSortedByPriority() Tests
// ============================================================================

describe('getDueSkillsSortedByPriority', () => {
  it('should filter out skills not due for review', () => {
    const skills = [
      createSkillProgress({
        skillId: 'due-skill',
        nextReview: new Date(Date.now() - 24 * 60 * 60 * 1000), // Yesterday
      }),
      createSkillProgress({
        skillId: 'not-due-skill',
        nextReview: new Date(Date.now() + 24 * 60 * 60 * 1000), // Tomorrow
      }),
    ];

    const dueSkills = getDueSkillsSortedByPriority(skills);

    expect(dueSkills).toHaveLength(1);
    expect(dueSkills[0]?.skillId).toBe('due-skill');
  });

  it('should sort due skills by priority (highest first)', () => {
    const skills = [
      createSkillProgress({
        skillId: 'medium-priority',
        nextReview: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day overdue
        srsParams: createSRSParams({ easeFactor: 2.5 }),
        masteryLevel: 50,
      }),
      createSkillProgress({
        skillId: 'high-priority',
        nextReview: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days overdue
        srsParams: createSRSParams({ easeFactor: 1.5 }), // Difficult
        masteryLevel: 20, // Low mastery
      }),
      createSkillProgress({
        skillId: 'low-priority',
        nextReview: new Date(Date.now() - 1 * 60 * 60 * 1000), // 1 hour overdue
        srsParams: createSRSParams({ easeFactor: 3.0 }), // Easy
        masteryLevel: 90, // High mastery
      }),
    ];

    const sorted = getDueSkillsSortedByPriority(skills);

    expect(sorted).toHaveLength(3);
    expect(sorted[0]?.skillId).toBe('high-priority');
    expect(sorted[2]?.skillId).toBe('low-priority');
  });

  it('should return empty array if no skills are due', () => {
    const skills = [
      createSkillProgress({
        nextReview: new Date(Date.now() + 24 * 60 * 60 * 1000),
      }),
      createSkillProgress({
        nextReview: new Date(Date.now() + 48 * 60 * 60 * 1000),
      }),
    ];

    const dueSkills = getDueSkillsSortedByPriority(skills);

    expect(dueSkills).toHaveLength(0);
  });

  it('should handle empty input array', () => {
    const dueSkills = getDueSkillsSortedByPriority([]);

    expect(dueSkills).toHaveLength(0);
  });

  it('should work with custom current date', () => {
    const customDate = new Date('2025-01-15');

    const skills = [
      createSkillProgress({
        skillId: 'due-on-custom-date',
        nextReview: new Date('2025-01-10'), // 5 days before custom date
      }),
      createSkillProgress({
        skillId: 'not-due-on-custom-date',
        nextReview: new Date('2025-01-20'), // After custom date
      }),
    ];

    const dueSkills = getDueSkillsSortedByPriority(skills, customDate);

    expect(dueSkills).toHaveLength(1);
    expect(dueSkills[0]?.skillId).toBe('due-on-custom-date');
  });
});

// ============================================================================
// Integration Tests - Full SRS Workflow
// ============================================================================

describe('Integration Tests - Full SRS Workflow', () => {
  it('should demonstrate complete learning progression from new skill to mastery', () => {
    // Start with new skill
    let params = initializeSRSParameters();
    const intervals: number[] = [];

    // Simulate successful learning progression (all correct answers)
    for (let i = 0; i < 10; i++) {
      const result = updateSRSParameters({
        wasCorrect: true,
        responseQuality: 0.8, // Good quality
        currentParams: params,
      });

      intervals.push(result.newParams.interval);
      params = result.newParams;
    }

    // Verify exponential growth
    expect(intervals[0]).toBe(1);  // First: 1 day
    expect(intervals[1]).toBe(3);  // Second: 3 days
    expect(intervals[2]).toBeGreaterThan(intervals[1]); // Exponential growth starts
    expect(intervals[9]).toBeGreaterThan(intervals[8]); // Continues growing

    // Verify ease factor stayed healthy
    expect(params.easeFactor).toBeGreaterThan(2.0);
    expect(params.easeFactor).toBeLessThanOrEqual(3.0);
  });

  it('should demonstrate forgetting and relearning cycle', () => {
    // Build up to long interval
    let params = createSRSParams({
      easeFactor: 2.5,
      interval: 30,
      repetitionCount: 5,
    });

    // Simulate forgetting (incorrect answer)
    const forgotResult = updateSRSParameters({
      wasCorrect: false,
      responseQuality: 0.2,
      currentParams: params,
    });

    // Should reset to 1 day
    expect(forgotResult.newParams.interval).toBe(1);
    expect(forgotResult.newParams.repetitionCount).toBe(0);

    // Relearn with correct answers
    params = forgotResult.newParams;
    const relearn1 = updateSRSParameters({
      wasCorrect: true,
      responseQuality: 0.8,
      currentParams: params,
    });

    expect(relearn1.newParams.interval).toBe(1); // First interval

    const relearn2 = updateSRSParameters({
      wasCorrect: true,
      responseQuality: 0.8,
      currentParams: relearn1.newParams,
    });

    expect(relearn2.newParams.interval).toBe(3); // Second interval
  });

  it('should handle mixed performance realistically', () => {
    let params = initializeSRSParameters();
    const performance = [
      { correct: true, quality: 0.8 },
      { correct: true, quality: 0.9 },
      { correct: false, quality: 0.3 }, // Forgot
      { correct: true, quality: 0.7 },
      { correct: true, quality: 0.8 },
      { correct: true, quality: 0.85 },
    ];

    for (const attempt of performance) {
      const result = updateSRSParameters({
        wasCorrect: attempt.correct,
        responseQuality: attempt.quality,
        currentParams: params,
      });
      params = result.newParams;
    }

    // After mixed performance, should have reasonable parameters
    expect(params.easeFactor).toBeGreaterThan(1.5);
    expect(params.easeFactor).toBeLessThan(3.0);
    expect(params.interval).toBeGreaterThan(0);
  });

  it('should prioritize overdue difficult low-mastery skills for session composition', () => {
    const now = new Date();

    const skills = [
      createSkillProgress({
        skillId: 'new-easy-skill',
        nextReview: new Date(now.getTime() + 24 * 60 * 60 * 1000), // Future
        srsParams: createSRSParams({ easeFactor: 2.8 }),
        masteryLevel: 30,
      }),
      createSkillProgress({
        skillId: 'overdue-difficult-skill',
        nextReview: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000), // 7 days overdue
        srsParams: createSRSParams({ easeFactor: 1.5 }),
        masteryLevel: 25,
      }),
      createSkillProgress({
        skillId: 'slightly-overdue-mastered-skill',
        nextReview: new Date(now.getTime() - 24 * 60 * 60 * 1000), // 1 day overdue
        srsParams: createSRSParams({ easeFactor: 2.9 }),
        masteryLevel: 95,
      }),
    ];

    const dueSkills = getDueSkillsSortedByPriority(skills);

    // Should include both overdue skills, prioritize the difficult one
    expect(dueSkills).toHaveLength(2);
    expect(dueSkills[0]?.skillId).toBe('overdue-difficult-skill');
    expect(dueSkills[1]?.skillId).toBe('slightly-overdue-mastered-skill');
  });
});

// ============================================================================
// Edge Cases and Boundary Conditions
// ============================================================================

describe('Edge Cases', () => {
  it('should handle ease factor at minimum boundary', () => {
    const params = createSRSParams({ easeFactor: 1.3 }); // At minimum

    // Even with poor performance, should not go below 1.3
    const result = updateSRSParameters({
      wasCorrect: false,
      responseQuality: 0.0,
      currentParams: params,
    });

    expect(result.newParams.easeFactor).toBe(1.3);
  });

  it('should handle ease factor at maximum boundary', () => {
    const params = createSRSParams({ easeFactor: 3.0 }); // At maximum

    // Even with perfect performance, should not exceed 3.0
    const result = updateSRSParameters({
      wasCorrect: true,
      responseQuality: 1.0,
      currentParams: params,
    });

    expect(result.newParams.easeFactor).toBe(3.0);
  });

  it('should handle very large intervals gracefully', () => {
    const params = createSRSParams({
      easeFactor: 2.5,
      interval: 365, // 1 year
      repetitionCount: 10,
    });

    const result = updateSRSParameters({
      wasCorrect: true,
      responseQuality: 0.8,
      currentParams: params,
    });

    // Should continue growing but remain reasonable
    expect(result.newParams.interval).toBeGreaterThan(365);
    expect(result.newParams.interval).toBeLessThan(10000); // Stay in reasonable range
  });

  it('should handle repetition count of 0', () => {
    const params = createSRSParams({ repetitionCount: 0 });

    const result = updateSRSParameters({
      wasCorrect: true,
      responseQuality: 0.8,
      currentParams: params,
    });

    expect(result.newParams.repetitionCount).toBe(1);
    expect(result.newParams.interval).toBe(1);
  });

  it('should return valid next review date for all calculated intervals', () => {
    const intervals = [1, 3, 7, 14, 30, 90, 180, 365];

    for (const interval of intervals) {
      const nextReview = calculateNextReviewDate(interval);

      expect(nextReview).toBeInstanceOf(Date);
      expect(nextReview.getTime()).toBeGreaterThan(Date.now());
    }
  });
});
