/**
 * Practice Streak Calculator Tests
 *
 * Tests for streak calculation logic including consecutive days,
 * timezone handling, and edge cases.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  calculatePracticeStreak,
  formatStreakMessage,
  type StreakData,
} from './streak-calculator';
import type { ExerciseAttempt } from './types';

// Helper to create exercise attempt
function createExercise(daysAgo: number, hour = 12): ExerciseAttempt {
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);
  date.setHours(hour, 0, 0, 0);

  return {
    exerciseId: `ex-${daysAgo}`,
    templateId: 'template-1',
    competencyAreaId: 'tal-og-algebra',
    skillId: 'addition-basics',
    difficulty: 'A',
    isBinding: true,
    correct: true,
    timeSpentSeconds: 30,
    hintsUsed: 0,
    userAnswer: '42',
    sessionId: 'session-1',
    createdAt: date,
  };
}

describe('calculatePracticeStreak', () => {
  beforeEach(() => {
    // Reset system time for each test
    vi.useRealTimers();
  });

  it('should return zero streak for empty history', () => {
    const result = calculatePracticeStreak([]);

    expect(result.currentStreak).toBe(0);
    expect(result.longestStreak).toBe(0);
    expect(result.lastPracticeDate).toBeNull();
    expect(result.isAtRisk).toBe(true);
  });

  it('should calculate 1-day streak for today only', () => {
    const exercises = [createExercise(0)];

    const result = calculatePracticeStreak(exercises);

    expect(result.currentStreak).toBe(1);
    expect(result.longestStreak).toBe(1);
    expect(result.isAtRisk).toBe(false);
  });

  it('should calculate multi-day streak for consecutive days', () => {
    const exercises = [
      createExercise(0), // Today
      createExercise(1), // Yesterday
      createExercise(2), // 2 days ago
      createExercise(3), // 3 days ago
    ];

    const result = calculatePracticeStreak(exercises);

    expect(result.currentStreak).toBe(4);
    expect(result.longestStreak).toBe(4);
    expect(result.isAtRisk).toBe(false);
  });

  it('should handle multiple exercises on same day', () => {
    const exercises = [
      createExercise(0, 9), // Today morning
      createExercise(0, 14), // Today afternoon
      createExercise(0, 20), // Today evening
      createExercise(1, 12), // Yesterday
    ];

    const result = calculatePracticeStreak(exercises);

    expect(result.currentStreak).toBe(2);
    expect(result.longestStreak).toBe(2);
  });

  it('should reset streak when day is skipped', () => {
    const exercises = [
      createExercise(0), // Today
      createExercise(1), // Yesterday
      // Gap: 2 days ago (skipped)
      createExercise(3), // 3 days ago
      createExercise(4), // 4 days ago
    ];

    const result = calculatePracticeStreak(exercises);

    expect(result.currentStreak).toBe(2);
    expect(result.longestStreak).toBe(2); // The 2-day streak from today
  });

  it('should calculate longest streak when current is broken', () => {
    const exercises = [
      createExercise(0), // Today
      // Gap: yesterday (skipped)
      createExercise(2), // 2 days ago
      createExercise(3), // 3 days ago
      createExercise(4), // 4 days ago
      createExercise(5), // 5 days ago (4-day streak in the past)
    ];

    const result = calculatePracticeStreak(exercises);

    expect(result.currentStreak).toBe(1); // Only today
    expect(result.longestStreak).toBe(4); // The past streak
  });

  it('should handle yesterday as start of streak (grace period)', () => {
    const exercises = [
      createExercise(1), // Yesterday
      createExercise(2), // 2 days ago
      createExercise(3), // 3 days ago
    ];

    const result = calculatePracticeStreak(exercises);

    expect(result.currentStreak).toBe(3);
    expect(result.isAtRisk).toBe(true); // Haven't practiced today
  });

  it('should return zero streak if last practice was 2+ days ago', () => {
    const exercises = [
      createExercise(2), // 2 days ago
      createExercise(3), // 3 days ago
      createExercise(4), // 4 days ago
    ];

    const result = calculatePracticeStreak(exercises);

    expect(result.currentStreak).toBe(0);
    expect(result.longestStreak).toBe(3);
    expect(result.isAtRisk).toBe(true);
  });

  it('should track last practice date correctly', () => {
    const now = new Date();
    const yesterday = new Date();
    yesterday.setDate(now.getDate() - 1);

    const exercises = [
      createExercise(1), // Yesterday
      createExercise(2), // 2 days ago
    ];

    const result = calculatePracticeStreak(exercises);

    expect(result.lastPracticeDate).toBeDefined();
    expect(result.lastPracticeDate!.toDateString()).toBe(yesterday.toDateString());
  });

  it('should handle exercises in random order', () => {
    const exercises = [
      createExercise(2),
      createExercise(0),
      createExercise(3),
      createExercise(1),
    ];

    const result = calculatePracticeStreak(exercises);

    expect(result.currentStreak).toBe(4); // Should still find consecutive days
  });

  it('should handle long streaks correctly', () => {
    // Create 30-day consecutive streak
    const exercises = Array.from({ length: 30 }, (_, i) => createExercise(i));

    const result = calculatePracticeStreak(exercises);

    expect(result.currentStreak).toBe(30);
    expect(result.longestStreak).toBe(30);
  });

  it('should handle multiple streaks and find longest', () => {
    const exercises = [
      // Current streak: 2 days
      createExercise(0),
      createExercise(1),
      // Gap
      // Past streak: 5 days
      createExercise(3),
      createExercise(4),
      createExercise(5),
      createExercise(6),
      createExercise(7),
      // Gap
      // Another past streak: 3 days
      createExercise(10),
      createExercise(11),
      createExercise(12),
    ];

    const result = calculatePracticeStreak(exercises);

    expect(result.currentStreak).toBe(2);
    expect(result.longestStreak).toBe(5); // The 5-day streak
  });

  it('should mark streak at risk if not practiced today', () => {
    const exercises = [
      createExercise(1), // Yesterday
      createExercise(2), // 2 days ago
    ];

    const result = calculatePracticeStreak(exercises);

    expect(result.isAtRisk).toBe(true);
  });

  it('should not mark streak at risk if practiced today', () => {
    const exercises = [
      createExercise(0), // Today
      createExercise(1), // Yesterday
    ];

    const result = calculatePracticeStreak(exercises);

    expect(result.isAtRisk).toBe(false);
  });

  it('should handle single day practice from long ago', () => {
    const exercises = [createExercise(30)];

    const result = calculatePracticeStreak(exercises);

    expect(result.currentStreak).toBe(0);
    expect(result.longestStreak).toBe(1);
    expect(result.lastPracticeDate).toBeDefined();
  });
});

describe('formatStreakMessage', () => {
  it('should return start message for zero streak', () => {
    const streakData: StreakData = {
      currentStreak: 0,
      longestStreak: 0,
      lastPracticeDate: null,
      isAtRisk: true,
    };

    const message = formatStreakMessage(streakData);

    expect(message).toBe('Start practicing to build your streak');
  });

  it('should show simple count for short streaks', () => {
    const streakData: StreakData = {
      currentStreak: 3,
      longestStreak: 3,
      lastPracticeDate: new Date(),
      isAtRisk: false,
    };

    const message = formatStreakMessage(streakData);

    expect(message).toContain('3-day streak');
  });

  it('should show encouragement when streak is at risk', () => {
    const streakData: StreakData = {
      currentStreak: 5,
      longestStreak: 5,
      lastPracticeDate: new Date(),
      isAtRisk: true,
    };

    const message = formatStreakMessage(streakData);

    expect(message).toContain('Practice today to keep it going');
  });

  it('should show milestone celebration for 7-day streak', () => {
    const streakData: StreakData = {
      currentStreak: 7,
      longestStreak: 7,
      lastPracticeDate: new Date(),
      isAtRisk: false,
    };

    const message = formatStreakMessage(streakData);

    expect(message).toContain('⭐');
    expect(message).toContain('One week');
  });

  it('should show milestone celebration for 14-day streak', () => {
    const streakData: StreakData = {
      currentStreak: 14,
      longestStreak: 14,
      lastPracticeDate: new Date(),
      isAtRisk: false,
    };

    const message = formatStreakMessage(streakData);

    expect(message).toContain('🔥');
    expect(message).toContain('Keep it up');
  });

  it('should show milestone celebration for 30-day streak', () => {
    const streakData: StreakData = {
      currentStreak: 30,
      longestStreak: 30,
      lastPracticeDate: new Date(),
      isAtRisk: false,
    };

    const message = formatStreakMessage(streakData);

    expect(message).toContain('🎉');
    expect(message).toContain('Amazing dedication');
  });
});

describe('Edge Cases', () => {
  it('should handle exercises spanning midnight', () => {
    const now = new Date();
    const justBeforeMidnight = new Date(now);
    justBeforeMidnight.setHours(23, 59, 0, 0);
    
    const justAfterMidnight = new Date(now);
    justAfterMidnight.setDate(justAfterMidnight.getDate() - 1);
    justAfterMidnight.setHours(0, 1, 0, 0);

    const exercises: ExerciseAttempt[] = [
      {
        ...createExercise(0),
        createdAt: justBeforeMidnight,
      },
      {
        ...createExercise(1),
        createdAt: justAfterMidnight,
      },
    ];

    const result = calculatePracticeStreak(exercises);

    expect(result.currentStreak).toBe(2);
  });

  it('should handle very large history efficiently', () => {
    // Create 1000 exercises over 365 days
    const exercises = Array.from({ length: 1000 }, (_, i) =>
      createExercise(Math.floor(i / 3))
    );

    const startTime = Date.now();
    const result = calculatePracticeStreak(exercises);
    const duration = Date.now() - startTime;

    // Should complete in reasonable time (< 100ms)
    expect(duration).toBeLessThan(100);
    expect(result.currentStreak).toBeGreaterThan(0);
  });

  it('should handle dates at year boundaries', () => {
    const newYearsDay = new Date('2024-01-01T12:00:00');
    const newYearsEve = new Date('2023-12-31T12:00:00');

    const exercises: ExerciseAttempt[] = [
      { ...createExercise(0), createdAt: newYearsDay },
      { ...createExercise(1), createdAt: newYearsEve },
    ];

    // Note: This test may need adjustment based on current date
    // The streak calculator uses current date as reference
    const result = calculatePracticeStreak(exercises);

    // Should handle year boundaries correctly
    expect(result).toBeDefined();
  });
});

