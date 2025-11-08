/**
 * Practice Streak Calculator
 *
 * Calculates consecutive days of practice activity from exercise history.
 * Handles timezone considerations and provides streak statistics.
 *
 * Requirements:
 * - Dashboard should display practice streak counter (Task 8.6)
 * - Track user engagement and consistency
 */

import type { ExerciseAttempt } from './types';

export interface StreakData {
  currentStreak: number;
  longestStreak: number;
  lastPracticeDate: Date | null;
  isAtRisk: boolean; // True if user hasn't practiced today
}

/**
 * Calculate practice streak from exercise history
 *
 * Analyzes exercise attempts to determine consecutive days of practice.
 * A "practice day" is any day with at least one exercise attempt.
 * Considers dates in user's local timezone.
 *
 * Algorithm:
 * 1. Group exercises by local date (YYYY-MM-DD)
 * 2. Sort dates in descending order
 * 3. Count consecutive days starting from most recent
 * 4. Stop when a day is skipped
 *
 * @param exerciseHistory - Array of exercise attempts (should be sorted by date desc)
 * @returns Streak data including current and longest streaks
 *
 * @example
 * ```typescript
 * const streak = calculatePracticeStreak(exercises);
 * console.log(`${streak.currentStreak}-day streak!`);
 * ```
 */
export function calculatePracticeStreak(
  exerciseHistory: ExerciseAttempt[]
): StreakData {
  // Handle empty history
  if (exerciseHistory.length === 0) {
    return {
      currentStreak: 0,
      longestStreak: 0,
      lastPracticeDate: null,
      isAtRisk: true,
    };
  }

  // Group exercises by local date (YYYY-MM-DD format)
  const practiceDates = new Set<string>();
  let mostRecentDate: Date | null = null;

  for (const attempt of exerciseHistory) {
    const attemptDate = attempt.createdAt;
    const dateKey = getLocalDateKey(attemptDate);
    practiceDates.add(dateKey);

    // Track most recent practice
    if (!mostRecentDate || attemptDate > mostRecentDate) {
      mostRecentDate = attemptDate;
    }
  }

  // Convert to sorted array (descending - most recent first)
  const sortedDates = Array.from(practiceDates).sort().reverse();

  // Calculate current streak
  const currentStreak = calculateStreakFromDates(sortedDates);

  // Calculate longest streak (scan through all dates)
  const longestStreak = calculateLongestStreak(sortedDates);

  // Determine if streak is at risk (user hasn't practiced today)
  const today = getLocalDateKey(new Date());
  const isAtRisk = sortedDates[0] !== today;

  return {
    currentStreak,
    longestStreak,
    lastPracticeDate: mostRecentDate,
    isAtRisk,
  };
}

/**
 * Get local date key in YYYY-MM-DD format
 *
 * @param date - Date object to convert
 * @returns Date string in YYYY-MM-DD format (local timezone)
 */
function getLocalDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Calculate current streak from sorted dates
 *
 * Counts consecutive days starting from the most recent date.
 * Stops when a day is skipped.
 *
 * @param sortedDates - Array of date strings (YYYY-MM-DD) sorted descending
 * @returns Number of consecutive practice days
 */
function calculateStreakFromDates(sortedDates: string[]): number {
  if (sortedDates.length === 0) return 0;

  const today = getLocalDateKey(new Date());
  const yesterday = getLocalDateKey(getYesterday());

  // Streak must start from today or yesterday (grace period)
  if (sortedDates[0] !== today && sortedDates[0] !== yesterday) {
    return 0;
  }

  let streak = 0;
  let expectedDate = sortedDates[0];

  for (const dateKey of sortedDates) {
    if (dateKey === expectedDate) {
      streak++;
      // Move to previous day
      expectedDate = getPreviousDay(expectedDate);
    } else {
      // Gap found, streak ends
      break;
    }
  }

  return streak;
}

/**
 * Calculate longest streak from all dates
 *
 * Scans through entire date history to find the longest consecutive period.
 *
 * @param sortedDates - Array of date strings (YYYY-MM-DD) sorted descending
 * @returns Maximum consecutive practice days in history
 */
function calculateLongestStreak(sortedDates: string[]): number {
  if (sortedDates.length === 0) return 0;

  let maxStreak = 1;
  let currentStreak = 1;

  for (let i = 0; i < sortedDates.length - 1; i++) {
    const currentDate = sortedDates[i]!;
    const nextDate = sortedDates[i + 1]!;
    const expectedPrevious = getPreviousDay(currentDate);

    if (nextDate === expectedPrevious) {
      // Consecutive day found
      currentStreak++;
      maxStreak = Math.max(maxStreak, currentStreak);
    } else {
      // Gap found, reset current streak
      currentStreak = 1;
    }
  }

  return maxStreak;
}

/**
 * Get yesterday's date
 *
 * @returns Date object for yesterday
 */
function getYesterday(): Date {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  return yesterday;
}

/**
 * Get previous day for a given date string
 *
 * @param dateKey - Date string in YYYY-MM-DD format
 * @returns Previous day in YYYY-MM-DD format
 */
function getPreviousDay(dateKey: string): string {
  const date = new Date(dateKey + 'T00:00:00'); // Parse as local time
  date.setDate(date.getDate() - 1);
  return getLocalDateKey(date);
}

/**
 * Format streak for display
 *
 * Helper function to format streak count with appropriate messaging.
 *
 * @param streakData - Streak data from calculatePracticeStreak
 * @returns User-friendly streak message
 */
export function formatStreakMessage(streakData: StreakData): string {
  const { currentStreak, isAtRisk } = streakData;

  if (currentStreak === 0) {
    return 'Start practicing to build your streak';
  }

  if (isAtRisk && currentStreak > 0) {
    return `${currentStreak}-day streak – Practice today to keep it going!`;
  }

  // Milestone celebrations
  if (currentStreak >= 30) {
    return `🎉 ${currentStreak}-day streak! Amazing dedication!`;
  }
  if (currentStreak >= 14) {
    return `🔥 ${currentStreak}-day streak! Keep it up!`;
  }
  if (currentStreak >= 7) {
    return `⭐ ${currentStreak}-day streak! One week strong!`;
  }

  return `${currentStreak}-day streak`;
}

