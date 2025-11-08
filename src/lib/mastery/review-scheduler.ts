/**
 * Review Scheduler
 *
 * Fetches and categorizes skills due for review based on SRS scheduling.
 * Provides prioritized list of skills needing practice.
 *
 * Requirements:
 * - Dashboard displays review schedule with upcoming priorities (Task 8.6)
 * - SRS-based intelligent review scheduling (Requirement 5.3, 5.4, 5.5)
 */

import { supabase } from '../supabase/client';
import type { SkillProgress } from './types';
import type { CompetencyAreaId } from '../curriculum/types';

export type ReviewUrgency = 'overdue' | 'today' | 'this-week' | 'upcoming';

export interface ScheduledReview {
  skillId: string;
  skillName?: string; // Will need to be resolved from curriculum
  competencyAreaId?: string;
  masteryLevel: number;
  nextReviewAt: Date;
  urgency: ReviewUrgency;
  daysOverdue?: number;
  lastPracticed?: Date;
}

export interface ReviewSchedule {
  overdue: ScheduledReview[];
  today: ScheduledReview[];
  thisWeek: ScheduledReview[];
  upcoming: ScheduledReview[];
  total: number;
}

/**
 * Get upcoming reviews for a user
 *
 * Fetches skills progress records with scheduled review dates,
 * categorizes by urgency, and returns prioritized list.
 *
 * @param userId - User UUID
 * @param limit - Maximum number of reviews to return (default: 10)
 * @returns Review schedule with categorized skills
 *
 * @example
 * ```typescript
 * const schedule = await getUpcomingReviews(userId);
 * console.log(`${schedule.overdue.length} overdue reviews`);
 * ```
 */
export async function getUpcomingReviews(
  userId: string,
  limit = 10
): Promise<ReviewSchedule> {
  // Fetch skills with next_review_at scheduled
  const { data, error } = await supabase
    .from('skills_progress')
    .select('*')
    .eq('user_id', userId)
    .not('next_review_at', 'is', null)
    .order('next_review_at', { ascending: true })
    .limit(limit * 2); // Fetch extra to ensure enough after filtering

  if (error) {
    console.error('Error fetching upcoming reviews:', error);
    return {
      overdue: [],
      today: [],
      thisWeek: [],
      upcoming: [],
      total: 0,
    };
  }

  if (!data || data.length === 0) {
    return {
      overdue: [],
      today: [],
      thisWeek: [],
      upcoming: [],
      total: 0,
    };
  }

  // Convert to ScheduledReview objects and categorize
  const reviews = data.map(row => convertToScheduledReview(row));
  const categorized = categorizeReviews(reviews);

  // Limit each category
  const limitPerCategory = Math.ceil(limit / 4);

  return {
    overdue: categorized.overdue.slice(0, limitPerCategory),
    today: categorized.today.slice(0, limitPerCategory),
    thisWeek: categorized.thisWeek.slice(0, limitPerCategory),
    upcoming: categorized.upcoming.slice(0, limitPerCategory),
    total: reviews.length,
  };
}

/**
 * Get count of overdue reviews
 *
 * Quick check for number of skills that need immediate attention.
 *
 * @param userId - User UUID
 * @returns Number of overdue reviews
 */
export async function getOverdueReviewCount(userId: string): Promise<number> {
  const now = new Date().toISOString();

  const { count, error } = await supabase
    .from('skills_progress')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .not('next_review_at', 'is', null)
    .lt('next_review_at', now);

  if (error) {
    console.error('Error fetching overdue count:', error);
    return 0;
  }

  return count || 0;
}

/**
 * Get reviews due today
 *
 * Fetches only skills due for review today.
 *
 * @param userId - User UUID
 * @returns Array of reviews due today
 */
export async function getTodayReviews(userId: string): Promise<ScheduledReview[]> {
  const todayStart = getStartOfDay(new Date());
  const todayEnd = getEndOfDay(new Date());

  const { data, error } = await supabase
    .from('skills_progress')
    .select('*')
    .eq('user_id', userId)
    .not('next_review_at', 'is', null)
    .gte('next_review_at', todayStart.toISOString())
    .lte('next_review_at', todayEnd.toISOString())
    .order('next_review_at', { ascending: true });

  if (error) {
    console.error('Error fetching today reviews:', error);
    return [];
  }

  if (!data) return [];

  return data.map(row => convertToScheduledReview(row));
}

/**
 * Convert database row to ScheduledReview
 */
function convertToScheduledReview(row: any): ScheduledReview {
  const nextReviewAt = new Date(row.next_review_at);
  const lastPracticed = row.last_practiced_at ? new Date(row.last_practiced_at) : undefined;
  const urgency = determineUrgency(nextReviewAt);
  const daysOverdue = urgency === 'overdue' ? calculateDaysOverdue(nextReviewAt) : undefined;

  return {
    skillId: row.skill_id,
    masteryLevel: row.mastery_level,
    nextReviewAt,
    urgency,
    daysOverdue,
    lastPracticed,
  };
}

/**
 * Categorize reviews by urgency
 */
function categorizeReviews(reviews: ScheduledReview[]): ReviewSchedule {
  const overdue: ScheduledReview[] = [];
  const today: ScheduledReview[] = [];
  const thisWeek: ScheduledReview[] = [];
  const upcoming: ScheduledReview[] = [];

  for (const review of reviews) {
    switch (review.urgency) {
      case 'overdue':
        overdue.push(review);
        break;
      case 'today':
        today.push(review);
        break;
      case 'this-week':
        thisWeek.push(review);
        break;
      case 'upcoming':
        upcoming.push(review);
        break;
    }
  }

  return {
    overdue,
    today,
    thisWeek,
    upcoming,
    total: reviews.length,
  };
}

/**
 * Determine urgency of a review
 */
function determineUrgency(nextReviewAt: Date): ReviewUrgency {
  const now = new Date();
  const todayEnd = getEndOfDay(now);
  const weekEnd = getEndOfWeek(now);

  if (nextReviewAt < now) {
    return 'overdue';
  }

  if (nextReviewAt <= todayEnd) {
    return 'today';
  }

  if (nextReviewAt <= weekEnd) {
    return 'this-week';
  }

  return 'upcoming';
}

/**
 * Calculate days overdue
 */
function calculateDaysOverdue(nextReviewAt: Date): number {
  const now = new Date();
  const diffMs = now.getTime() - nextReviewAt.getTime();
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  return Math.max(0, diffDays);
}

/**
 * Get start of day (00:00:00)
 */
function getStartOfDay(date: Date): Date {
  const start = new Date(date);
  start.setHours(0, 0, 0, 0);
  return start;
}

/**
 * Get end of day (23:59:59)
 */
function getEndOfDay(date: Date): Date {
  const end = new Date(date);
  end.setHours(23, 59, 59, 999);
  return end;
}

/**
 * Get end of week (Sunday 23:59:59)
 */
function getEndOfWeek(date: Date): Date {
  const end = new Date(date);
  const dayOfWeek = end.getDay(); // 0 = Sunday, 6 = Saturday
  const daysUntilSunday = 7 - dayOfWeek;
  end.setDate(end.getDate() + daysUntilSunday);
  end.setHours(23, 59, 59, 999);
  return end;
}

/**
 * Format relative time for review dates
 *
 * Helper function to display review dates in user-friendly format.
 *
 * @param date - Review date
 * @returns Formatted string (e.g., "in 2 days", "tomorrow", "today")
 */
export function formatReviewDate(date: Date): string {
  const now = new Date();
  
  // Use calendar days instead of 24-hour periods for more intuitive formatting
  // Normalize both dates to midnight in UTC for accurate day comparison
  const nowUTC = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  const targetUTC = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  const diffMs = targetUTC.getTime() - nowUTC.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays < 0) {
    const daysAgo = Math.abs(diffDays);
    if (daysAgo === 0) return 'today';
    if (daysAgo === 1) return 'yesterday';
    return `${daysAgo} days ago`;
  }

  if (diffDays === 0) return 'today';
  if (diffDays === 1) return 'tomorrow';
  if (diffDays < 7) return `in ${diffDays} days`;
  
  const weeks = Math.floor(diffDays / 7);
  if (weeks === 1) return 'in 1 week';
  if (weeks < 4) return `in ${weeks} weeks`;

  const months = Math.floor(diffDays / 30);
  if (months === 1) return 'in 1 month';
  return `in ${months} months`;
}

