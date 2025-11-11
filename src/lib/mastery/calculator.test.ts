/**
 * Mastery Calculator Test Suite
 *
 * Comprehensive tests for mastery calculation engine including:
 * - Unit tests for each calculation factor
 * - Edge cases (no data, insufficient data, extreme values)
 * - Integration tests with realistic data patterns
 * - Performance benchmarks (<5ms target per Req 13.2)
 */

import { describe, it, expect } from "vitest";
import {
  calculateMasteryLevel,
  calculateRecentPerformance,
  calculateResponseSpeedFactor,
  calculateHintUsageFactor,
  calculateConsistencyScore,
  calculateTimeDecayFactor,
  getMasteryLevelBand,
  type MasteryCalculationResult,
} from "./calculator";
import type { ExerciseAttempt, SkillProgress } from "./types";

// ============================================================================
// Test Data Factories
// ============================================================================

function createAttempt(
  overrides: Partial<ExerciseAttempt> = {},
): ExerciseAttempt {
  return {
    id: `attempt-${Math.random()}`,
    userId: "test-user",
    sessionId: "test-session",
    templateId: "test-template",
    competencyAreaId: "tal-og-algebra",
    skillId: "tal-og-algebra:addition:basic-0-3",
    difficulty: "A",
    isBinding: true,
    correct: true,
    timeSpentSeconds: 45,
    hintsUsed: 0,
    userAnswer: "42",
    createdAt: new Date(),
    ...overrides,
  };
}

function createSkillProgress(
  overrides: Partial<SkillProgress> = {},
): SkillProgress {
  return {
    skillId: "tal-og-algebra:addition:basic-0-3",
    masteryLevel: 50,
    srsParams: {
      easeFactor: 2.5,
      interval: 1,
      repetitionCount: 0,
    },
    attempts: 10,
    successes: 7,
    avgResponseTime: 45000, // 45 seconds in ms
    lastPracticed: new Date(),
    nextReview: new Date(Date.now() + 86400000), // Tomorrow
    ...overrides,
  };
}

function createAttemptSequence(
  pattern: boolean[],
  baseDate = new Date(),
): ExerciseAttempt[] {
  return pattern.map((correct, index) =>
    createAttempt({
      correct,
      createdAt: new Date(baseDate.getTime() + index * 60000), // 1 minute apart
    }),
  );
}

// ============================================================================
// calculateMasteryLevel() Tests
// ============================================================================

describe("calculateMasteryLevel", () => {
  it('should return status "insufficient-data" with 0 mastery for no attempts', () => {
    const result = calculateMasteryLevel([], createSkillProgress());

    expect(result.status).toBe("insufficient-data");
    if (result.status === "insufficient-data") {
      expect(result.masteryLevel).toBe(0);
      expect(result.message).toContain("No attempts");
    }
  });

  it('should return status "insufficient-data" for <5 attempts with basic calculation', () => {
    const attempts = createAttemptSequence([true, true, true, false]); // 4 attempts, 75% success
    const result = calculateMasteryLevel(attempts, createSkillProgress());

    expect(result.status).toBe("insufficient-data");
    if (result.status === "insufficient-data") {
      expect(result.masteryLevel).toBeGreaterThan(0);
      expect(result.masteryLevel).toBeLessThanOrEqual(60); // Capped at 60 for <5 attempts
      expect(result.message).toContain("4 attempts");
    }
  });

  it('should return status "success" for >=5 attempts with full calculation', () => {
    const attempts = createAttemptSequence([true, true, true, true, false]); // 5 attempts, 80% success
    const result = calculateMasteryLevel(attempts, createSkillProgress());

    expect(result.status).toBe("success");
    if (result.status === "success") {
      expect(result.masteryLevel).toBeGreaterThan(0);
      expect(result.masteryLevel).toBeLessThanOrEqual(100);
    }
  });

  it("should return mastery 0-100 range for all correct attempts", () => {
    const attempts = createAttemptSequence(Array(10).fill(true));
    const result = calculateMasteryLevel(attempts, createSkillProgress());

    expect(result.status).toBe("success");
    if (result.status === "success") {
      expect(result.masteryLevel).toBeGreaterThanOrEqual(0);
      expect(result.masteryLevel).toBeLessThanOrEqual(100);
      expect(result.masteryLevel).toBeGreaterThan(70); // High score expected
    }
  });

  it("should return low mastery for all incorrect attempts", () => {
    const attempts = createAttemptSequence(Array(10).fill(false));
    const result = calculateMasteryLevel(attempts, createSkillProgress());

    expect(result.status).toBe("success");
    if (result.status === "success") {
      expect(result.masteryLevel).toBeLessThan(55); // Low score expected (other factors still contribute)
    }
  });

  it("should calculate mastery for mixed performance pattern", () => {
    const attempts = createAttemptSequence([
      true,
      true,
      false,
      true,
      false,
      true,
      true,
      true,
      false,
      true,
    ]); // 70% success
    const result = calculateMasteryLevel(attempts, createSkillProgress());

    expect(result.status).toBe("success");
    if (result.status === "success") {
      expect(result.masteryLevel).toBeGreaterThan(40);
      expect(result.masteryLevel).toBeLessThan(80);
    }
  });

  it("should weight recent attempts more heavily", () => {
    // Improving performance: old attempts wrong, recent attempts right
    const improvingAttempts = createAttemptSequence([
      false,
      false,
      false,
      false,
      false,
      true,
      true,
      true,
      true,
      true,
    ]);

    // Declining performance: old attempts right, recent attempts wrong
    const decliningAttempts = createAttemptSequence([
      true,
      true,
      true,
      true,
      true,
      false,
      false,
      false,
      false,
      false,
    ]);

    const improvingResult = calculateMasteryLevel(
      improvingAttempts,
      createSkillProgress(),
    );
    const decliningResult = calculateMasteryLevel(
      decliningAttempts,
      createSkillProgress(),
    );

    // Improving should score higher due to recency weighting
    expect(improvingResult.masteryLevel).toBeGreaterThan(
      decliningResult.masteryLevel,
    );
  });

  it("should handle errors gracefully", () => {
    // Pass invalid data that might cause errors
    const invalidProgress = createSkillProgress({
      avgResponseTime: -1, // Invalid negative time
    });

    const attempts = createAttemptSequence([true, true, true, true, true]);
    const result = calculateMasteryLevel(attempts, invalidProgress);

    // Should still return a result (either success or error status)
    expect(["success", "error"]).toContain(result.status);
  });
});

// ============================================================================
// calculateRecentPerformance() Tests
// ============================================================================

describe("calculateRecentPerformance", () => {
  it("should return 0 for empty array", () => {
    const result = calculateRecentPerformance([]);
    expect(result).toBe(0);
  });

  it("should return 1.0 for all correct attempts", () => {
    const attempts = createAttemptSequence(Array(10).fill(true));
    const result = calculateRecentPerformance(attempts);
    expect(result).toBeCloseTo(1.0, 2);
  });

  it("should return ~0 for all incorrect attempts", () => {
    const attempts = createAttemptSequence(Array(10).fill(false));
    const result = calculateRecentPerformance(attempts);
    expect(result).toBeCloseTo(0, 2);
  });

  it("should return ~0.5 for 50% success rate", () => {
    const attempts = createAttemptSequence([
      true,
      false,
      true,
      false,
      true,
      false,
    ]);
    const result = calculateRecentPerformance(attempts);
    expect(result).toBeGreaterThan(0.3);
    expect(result).toBeLessThan(0.7);
  });

  it("should weight recent attempts more heavily (improving)", () => {
    const improvingAttempts = createAttemptSequence([
      false,
      false,
      false,
      true,
      true,
      true,
      true,
      true,
    ]);
    const result = calculateRecentPerformance(improvingAttempts);

    // Should be > 0.5 despite only 62.5% overall success
    expect(result).toBeGreaterThan(0.6);
  });

  it("should weight recent attempts more heavily (declining)", () => {
    const decliningAttempts = createAttemptSequence([
      true,
      true,
      true,
      true,
      true,
      false,
      false,
      false,
    ]);
    const result = calculateRecentPerformance(decliningAttempts);

    // Should be < 0.5 despite 62.5% overall success
    expect(result).toBeLessThan(0.6);
  });

  it("should handle single attempt", () => {
    const correctAttempt = createAttemptSequence([true]);
    const incorrectAttempt = createAttemptSequence([false]);

    expect(calculateRecentPerformance(correctAttempt)).toBe(1.0);
    expect(calculateRecentPerformance(incorrectAttempt)).toBe(0);
  });
});

// ============================================================================
// calculateResponseSpeedFactor() Tests
// ============================================================================

describe("calculateResponseSpeedFactor", () => {
  it("should return 1.0 for optimal response time", () => {
    const attempts = [createAttempt({ difficulty: "A" })];
    const progress = createSkillProgress({
      avgResponseTime: 30000, // 30s - optimal for Grade 0-3 Difficulty A
    });

    const result = calculateResponseSpeedFactor(attempts, progress);
    expect(result).toBe(1.0);
  });

  it("should penalize suspiciously fast responses (<10s)", () => {
    const attempts = [createAttempt({ difficulty: "A" })];
    const progress = createSkillProgress({
      avgResponseTime: 5000, // 5s - too fast
    });

    const result = calculateResponseSpeedFactor(attempts, progress);
    expect(result).toBeLessThan(0.5);
  });

  it("should decay score for slower than expected responses", () => {
    const attempts = [createAttempt({ difficulty: "A" })];
    const optimalProgress = createSkillProgress({ avgResponseTime: 30000 }); // 30s optimal
    const slowProgress = createSkillProgress({ avgResponseTime: 90000 }); // 90s slow

    const optimalScore = calculateResponseSpeedFactor(
      attempts,
      optimalProgress,
    );
    const slowScore = calculateResponseSpeedFactor(attempts, slowProgress);

    expect(slowScore).toBeLessThan(optimalScore);
    expect(slowScore).toBeGreaterThan(0.2); // Should still have some score
  });

  it("should adjust expectations by difficulty level", () => {
    const attemptsA = [createAttempt({ difficulty: "A" })];
    const attemptsC = [createAttempt({ difficulty: "C" })];

    // Same 60s time for different difficulties
    const progressA = createSkillProgress({ avgResponseTime: 60000 });
    const progressC = createSkillProgress({ avgResponseTime: 60000 });

    const scoreA = calculateResponseSpeedFactor(attemptsA, progressA);
    const scoreC = calculateResponseSpeedFactor(attemptsC, progressC);

    // 60s is slower for difficulty A (expected 30s) but optimal for difficulty C
    expect(scoreC).toBeGreaterThan(scoreA);
  });

  it("should return neutral 0.5 for no data", () => {
    const result = calculateResponseSpeedFactor([], createSkillProgress());
    expect(result).toBe(0.5);
  });
});

// ============================================================================
// calculateHintUsageFactor() Tests
// ============================================================================

describe("calculateHintUsageFactor", () => {
  it("should return 1.0 for no hints used", () => {
    const attempts = Array(10)
      .fill(null)
      .map(() => createAttempt({ hintsUsed: 0 }));
    const result = calculateHintUsageFactor(attempts);
    expect(result).toBe(1.0);
  });

  it("should return 1.0 for empty array (no penalty)", () => {
    const result = calculateHintUsageFactor([]);
    expect(result).toBe(1.0);
  });

  it("should apply moderate penalty for 1-2 hints average", () => {
    const attempts = Array(10)
      .fill(null)
      .map(() => createAttempt({ hintsUsed: 1 }));
    const result = calculateHintUsageFactor(attempts);
    expect(result).toBeGreaterThan(0.6);
    expect(result).toBeLessThan(0.8);
  });

  it("should apply heavy penalty for 3+ hints average", () => {
    const attempts = Array(10)
      .fill(null)
      .map(() => createAttempt({ hintsUsed: 4 }));
    const result = calculateHintUsageFactor(attempts);
    expect(result).toBeLessThanOrEqual(0.4);
  });

  it("should scale penalty proportionally to hint usage", () => {
    const noHints = Array(10)
      .fill(null)
      .map(() => createAttempt({ hintsUsed: 0 }));
    const someHints = Array(10)
      .fill(null)
      .map(() => createAttempt({ hintsUsed: 1 }));
    const manyHints = Array(10)
      .fill(null)
      .map(() => createAttempt({ hintsUsed: 3 }));

    const scoreNone = calculateHintUsageFactor(noHints);
    const scoreSome = calculateHintUsageFactor(someHints);
    const scoreMany = calculateHintUsageFactor(manyHints);

    expect(scoreNone).toBeGreaterThan(scoreSome);
    expect(scoreSome).toBeGreaterThan(scoreMany);
  });

  it("should calculate average hints correctly across mixed usage", () => {
    const attempts = [
      createAttempt({ hintsUsed: 0 }),
      createAttempt({ hintsUsed: 0 }),
      createAttempt({ hintsUsed: 2 }),
      createAttempt({ hintsUsed: 0 }),
    ]; // Average: 0.5 hints

    const result = calculateHintUsageFactor(attempts);
    expect(result).toBeGreaterThan(0.8); // Should be high penalty level
    expect(result).toBeLessThan(1.0);
  });
});

// ============================================================================
// calculateConsistencyScore() Tests
// ============================================================================

describe("calculateConsistencyScore", () => {
  it("should return 0.5 for single attempt (neutral)", () => {
    const attempts = createAttemptSequence([true]);
    const result = calculateConsistencyScore(attempts);
    expect(result).toBe(0.5);
  });

  it("should return high score for perfectly consistent performance (all correct)", () => {
    const attempts = createAttemptSequence(Array(10).fill(true));
    const result = calculateConsistencyScore(attempts);
    expect(result).toBeGreaterThan(0.9);
  });

  it("should return high score for perfectly consistent performance (all incorrect)", () => {
    const attempts = createAttemptSequence(Array(10).fill(false));
    const result = calculateConsistencyScore(attempts);
    expect(result).toBeGreaterThan(0.9);
  });

  it("should return low score for inconsistent 50/50 performance", () => {
    const attempts = createAttemptSequence([
      true,
      false,
      true,
      false,
      true,
      false,
      true,
      false,
    ]);
    const result = calculateConsistencyScore(attempts);
    expect(result).toBeLessThan(0.5); // High variance = low consistency
  });

  it("should return higher score for more consistent patterns", () => {
    const consistent = createAttemptSequence([
      true,
      true,
      true,
      true,
      true,
      true,
      true,
      false,
      false,
    ]); // Mostly correct
    const inconsistent = createAttemptSequence([
      true,
      false,
      true,
      false,
      true,
      false,
      true,
      false,
      true,
    ]); // Alternating

    const consistentScore = calculateConsistencyScore(consistent);
    const inconsistentScore = calculateConsistencyScore(inconsistent);

    expect(consistentScore).toBeGreaterThan(inconsistentScore);
  });

  it("should handle edge case of 2 attempts", () => {
    const sameTwice = createAttemptSequence([true, true]);
    const differentTwice = createAttemptSequence([true, false]);

    const sameScore = calculateConsistencyScore(sameTwice);
    const differentScore = calculateConsistencyScore(differentTwice);

    expect(sameScore).toBeGreaterThan(differentScore);
  });

  it("should return value in 0-1 range", () => {
    const attempts = createAttemptSequence([
      true,
      false,
      true,
      true,
      false,
      true,
    ]);
    const result = calculateConsistencyScore(attempts);
    expect(result).toBeGreaterThanOrEqual(0);
    expect(result).toBeLessThanOrEqual(1);
  });
});

// ============================================================================
// calculateTimeDecayFactor() Tests
// ============================================================================

describe("calculateTimeDecayFactor", () => {
  it("should return 1.0 for practice today", () => {
    const today = new Date();
    const result = calculateTimeDecayFactor(today);
    expect(result).toBe(1.0);
  });

  it("should return ~0.5 for practice 14 days ago (half-life)", () => {
    const fourteenDaysAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000);
    const result = calculateTimeDecayFactor(fourteenDaysAgo);
    expect(result).toBeGreaterThan(0.45);
    expect(result).toBeLessThan(0.55);
  });

  it("should return ~0.25 for practice 28 days ago (2x half-life)", () => {
    const twentyEightDaysAgo = new Date(Date.now() - 28 * 24 * 60 * 60 * 1000);
    const result = calculateTimeDecayFactor(twentyEightDaysAgo);
    expect(result).toBeGreaterThan(0.2);
    expect(result).toBeLessThan(0.3);
  });

  it("should return minimum 0.05 for very old practice (floor)", () => {
    const veryOldDate = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000); // 1 year ago
    const result = calculateTimeDecayFactor(veryOldDate);
    expect(result).toBeGreaterThanOrEqual(0.05);
  });

  it("should decay exponentially over time", () => {
    const today = new Date();
    const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const twoWeeksAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000);
    const fourWeeksAgo = new Date(Date.now() - 28 * 24 * 60 * 60 * 1000);

    const scoreToday = calculateTimeDecayFactor(today);
    const scoreOneWeek = calculateTimeDecayFactor(oneWeekAgo);
    const scoreTwoWeeks = calculateTimeDecayFactor(twoWeeksAgo);
    const scoreFourWeeks = calculateTimeDecayFactor(fourWeeksAgo);

    // Each should be progressively smaller
    expect(scoreToday).toBeGreaterThan(scoreOneWeek);
    expect(scoreOneWeek).toBeGreaterThan(scoreTwoWeeks);
    expect(scoreTwoWeeks).toBeGreaterThan(scoreFourWeeks);
  });
});

// ============================================================================
// getMasteryLevelBand() Tests
// ============================================================================

describe("getMasteryLevelBand", () => {
  it('should return "introduced" band for 0-20 range', () => {
    expect(getMasteryLevelBand(0).level).toBe("introduced");
    expect(getMasteryLevelBand(10).level).toBe("introduced");
    expect(getMasteryLevelBand(20).level).toBe("introduced");
    expect(getMasteryLevelBand(0).colorCode).toBe("red");
  });

  it('should return "developing" band for 21-40 range', () => {
    expect(getMasteryLevelBand(21).level).toBe("developing");
    expect(getMasteryLevelBand(30).level).toBe("developing");
    expect(getMasteryLevelBand(40).level).toBe("developing");
    expect(getMasteryLevelBand(30).colorCode).toBe("yellow");
  });

  it('should return "progressing" band for 41-60 range', () => {
    expect(getMasteryLevelBand(41).level).toBe("progressing");
    expect(getMasteryLevelBand(50).level).toBe("progressing");
    expect(getMasteryLevelBand(60).level).toBe("progressing");
    expect(getMasteryLevelBand(50).colorCode).toBe("light-green");
  });

  it('should return "proficient" band for 61-80 range', () => {
    expect(getMasteryLevelBand(61).level).toBe("proficient");
    expect(getMasteryLevelBand(70).level).toBe("proficient");
    expect(getMasteryLevelBand(80).level).toBe("proficient");
    expect(getMasteryLevelBand(70).colorCode).toBe("green");
  });

  it('should return "mastered" band for 81-100 range', () => {
    expect(getMasteryLevelBand(81).level).toBe("mastered");
    expect(getMasteryLevelBand(90).level).toBe("mastered");
    expect(getMasteryLevelBand(100).level).toBe("mastered");
    expect(getMasteryLevelBand(90).colorCode).toBe("blue");
  });

  it("should handle scores below 0 (clamp to 0)", () => {
    const band = getMasteryLevelBand(-10);
    expect(band.level).toBe("introduced");
  });

  it("should handle scores above 100 (clamp to 100)", () => {
    const band = getMasteryLevelBand(150);
    expect(band.level).toBe("mastered");
  });
});

// ============================================================================
// Integration Tests
// ============================================================================

describe("Integration Tests", () => {
  it("should calculate realistic mastery for beginner student", () => {
    // Beginner: slow, uses hints, inconsistent, recent practice
    const attempts = [
      createAttempt({ correct: true, timeSpentSeconds: 80, hintsUsed: 2 }),
      createAttempt({ correct: false, timeSpentSeconds: 90, hintsUsed: 3 }),
      createAttempt({ correct: true, timeSpentSeconds: 70, hintsUsed: 2 }),
      createAttempt({ correct: false, timeSpentSeconds: 85, hintsUsed: 2 }),
      createAttempt({ correct: true, timeSpentSeconds: 65, hintsUsed: 1 }),
    ];

    const progress = createSkillProgress({
      avgResponseTime: 78000, // 78s average
      lastPracticed: new Date(), // Today
    });

    const result = calculateMasteryLevel(attempts, progress);

    if (result.status === "success" || result.status === "insufficient-data") {
      expect(result.masteryLevel).toBeGreaterThan(0);
      expect(result.masteryLevel).toBeLessThan(60); // Should be in developing/progressing range (60% success with penalties)
      expect(getMasteryLevelBand(result.masteryLevel).level).toMatch(
        /introduced|developing|progressing/,
      );
    }
  });

  it("should calculate realistic mastery for proficient student", () => {
    // Proficient: fast, no hints, consistent, recent practice
    const attempts = [
      createAttempt({ correct: true, timeSpentSeconds: 25, hintsUsed: 0 }),
      createAttempt({ correct: true, timeSpentSeconds: 28, hintsUsed: 0 }),
      createAttempt({ correct: true, timeSpentSeconds: 22, hintsUsed: 0 }),
      createAttempt({ correct: true, timeSpentSeconds: 30, hintsUsed: 0 }),
      createAttempt({ correct: true, timeSpentSeconds: 26, hintsUsed: 0 }),
      createAttempt({ correct: true, timeSpentSeconds: 24, hintsUsed: 0 }),
      createAttempt({ correct: false, timeSpentSeconds: 35, hintsUsed: 0 }), // One mistake
      createAttempt({ correct: true, timeSpentSeconds: 27, hintsUsed: 0 }),
    ];

    const progress = createSkillProgress({
      avgResponseTime: 27000, // 27s average - optimal
      lastPracticed: new Date(), // Today
    });

    const result = calculateMasteryLevel(attempts, progress);

    if (result.status === "success" || result.status === "insufficient-data") {
      expect(result.masteryLevel).toBeGreaterThan(60);
      expect(getMasteryLevelBand(result.masteryLevel).level).toMatch(
        /proficient|mastered/,
      );
    }
  });

  it("should calculate realistic mastery for rusty student (not practiced recently)", () => {
    // Good historical performance but not practiced in 30 days
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const attempts = Array(10)
      .fill(null)
      .map(() =>
        createAttempt({
          correct: true,
          timeSpentSeconds: 30,
          hintsUsed: 0,
          createdAt: thirtyDaysAgo,
        }),
      );

    const progress = createSkillProgress({
      avgResponseTime: 30000,
      lastPracticed: thirtyDaysAgo,
    });

    const result = calculateMasteryLevel(attempts, progress);

    // Should have high mastery due to excellent performance, slightly lowered by time decay
    // Time decay is 10% weight, so 30 days ago (~0.18 decay) only reduces score by ~8 points
    if (result.status === "success" || result.status === "insufficient-data") {
      expect(result.masteryLevel).toBeGreaterThan(70);
      expect(result.masteryLevel).toBeLessThan(100); // Should have some decay effect
    }

    // Compare to freshly practiced version to verify decay is working
    const freshProgress = createSkillProgress({
      avgResponseTime: 30000,
      lastPracticed: new Date(), // Today
    });
    const freshResult = calculateMasteryLevel(attempts, freshProgress);

    // Rusty student should score lower than fresh student
    if (
      (result.status === "success" || result.status === "insufficient-data") &&
      (freshResult.status === "success" ||
        freshResult.status === "insufficient-data")
    ) {
      expect(result.masteryLevel).toBeLessThan(freshResult.masteryLevel);
    }
  });
});

// ============================================================================
// Performance Tests
// ============================================================================

describe("Performance Tests", () => {
  it("should calculate mastery in <5ms for single skill (Req 13.2)", () => {
    const attempts = Array(20)
      .fill(null)
      .map(() => createAttempt({ correct: Math.random() > 0.3 }));
    const progress = createSkillProgress();

    const startTime = performance.now();
    calculateMasteryLevel(attempts, progress);
    const endTime = performance.now();

    const duration = endTime - startTime;
    expect(duration).toBeLessThan(5); // Must be <5ms
  });

  it("should calculate mastery for 50 skills in <250ms (batch scenario)", () => {
    const skills = Array(50)
      .fill(null)
      .map(() => ({
        attempts: Array(20)
          .fill(null)
          .map(() => createAttempt({ correct: Math.random() > 0.3 })),
        progress: createSkillProgress(),
      }));

    const startTime = performance.now();
    skills.forEach(({ attempts, progress }) => {
      calculateMasteryLevel(attempts, progress);
    });
    const endTime = performance.now();

    const duration = endTime - startTime;
    expect(duration).toBeLessThan(250); // Should be <5ms * 50
  });

  it("should handle large attempt history efficiently", () => {
    const attempts = Array(100)
      .fill(null)
      .map(() => createAttempt({ correct: Math.random() > 0.3 }));
    const progress = createSkillProgress();

    const startTime = performance.now();
    calculateMasteryLevel(attempts, progress);
    const endTime = performance.now();

    const duration = endTime - startTime;
    expect(duration).toBeLessThan(10); // Should still be very fast
  });
});
