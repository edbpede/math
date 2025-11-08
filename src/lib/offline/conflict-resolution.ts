/**
 * Conflict Resolution Logic
 *
 * Resolves conflicts between local (queued) data and server data when syncing.
 * 
 * Strategy (Requirement 6.5):
 * - Last-write-wins for timestamps, attempts, successes
 * - Maximum value for mastery levels
 * - Latest for SRS parameters (based on repetition count)
 * - Sum for attempt counts when merging
 *
 * Requirements:
 * - 6.5: Conflict resolution with last-write-wins and max mastery
 */

import type { CompetencyProgress, SkillProgress } from '../mastery/types'

/**
 * Compare two dates and return true if dateA is newer than dateB
 */
export function isNewer(dateA: Date, dateB: Date): boolean {
  return dateA.getTime() > dateB.getTime()
}

/**
 * Merge competency progress with conflict resolution
 *
 * Strategy:
 * - Use maximum mastery level (protects against data loss)
 * - Use latest timestamp for lastPracticed
 * - Sum total attempts (accumulate all practice)
 * - Recalculate success rate from merged data
 * - Keep earliest achievedAt if both exist
 *
 * @param local - Local progress data from queue
 * @param server - Current server progress data
 * @returns Merged progress data
 */
export function mergeCompetencyProgress(
  local: CompetencyProgress,
  server: CompetencyProgress
): CompetencyProgress {
  // Sanity check - ensure we're merging the same competency
  if (
    local.competencyAreaId !== server.competencyAreaId ||
    local.gradeRange !== server.gradeRange
  ) {
    throw new Error(
      `Cannot merge different competency areas: ${local.competencyAreaId} vs ${server.competencyAreaId}`
    )
  }

  // Use maximum mastery level (Requirement 6.5)
  const masteryLevel = Math.max(local.masteryLevel, server.masteryLevel)

  // Use latest timestamp for lastPracticed (last-write-wins)
  const lastPracticed = isNewer(local.lastPracticed, server.lastPracticed)
    ? local.lastPracticed
    : server.lastPracticed

  // Sum total attempts (accumulate practice across devices)
  const totalAttempts = local.totalAttempts + server.totalAttempts

  // For success rate, we need to recalculate from the merged data
  // We don't have individual success counts, so we take weighted average
  // based on attempt counts
  const localSuccesses = Math.round((local.successRate / 100) * local.totalAttempts)
  const serverSuccesses = Math.round((server.successRate / 100) * server.totalAttempts)
  const totalSuccesses = localSuccesses + serverSuccesses
  const successRate = totalAttempts > 0 ? (totalSuccesses / totalAttempts) * 100 : 0

  // Keep earliest achievedAt (first time reaching proficiency)
  let achievedAt: Date | undefined
  if (local.achievedAt && server.achievedAt) {
    achievedAt = isNewer(server.achievedAt, local.achievedAt)
      ? local.achievedAt
      : server.achievedAt
  } else {
    achievedAt = local.achievedAt || server.achievedAt
  }

  return {
    competencyAreaId: local.competencyAreaId,
    gradeRange: local.gradeRange,
    masteryLevel,
    totalAttempts,
    successRate,
    lastPracticed,
    achievedAt,
  }
}

/**
 * Merge skill progress with conflict resolution
 *
 * Strategy:
 * - Use maximum mastery level
 * - Use latest timestamp for lastPracticed
 * - Sum attempts and successes
 * - Use latest SRS parameters (based on repetition count)
 * - Use latest nextReview date
 *
 * @param local - Local progress data from queue
 * @param server - Current server progress data
 * @returns Merged progress data
 */
export function mergeSkillProgress(
  local: SkillProgress,
  server: SkillProgress
): SkillProgress {
  // Sanity check - ensure we're merging the same skill
  if (local.skillId !== server.skillId) {
    throw new Error(`Cannot merge different skills: ${local.skillId} vs ${server.skillId}`)
  }

  // Use maximum mastery level (Requirement 6.5)
  const masteryLevel = Math.max(local.masteryLevel, server.masteryLevel)

  // Use latest timestamp for lastPracticed (last-write-wins)
  const lastPracticed = isNewer(local.lastPracticed, server.lastPracticed)
    ? local.lastPracticed
    : server.lastPracticed

  // Sum attempts and successes (accumulate practice)
  const attempts = local.attempts + server.attempts
  const successes = local.successes + server.successes

  // Calculate weighted average response time
  const totalTime = local.avgResponseTime * local.attempts + server.avgResponseTime * server.attempts
  const avgResponseTime = attempts > 0 ? totalTime / attempts : 0

  // Use SRS parameters from the one with higher repetition count (more recent practice)
  // If equal repetition count, use the one with newer lastPracticed
  let srsParams = local.srsParams
  let nextReview = local.nextReview

  if (server.srsParams.repetitionCount > local.srsParams.repetitionCount) {
    srsParams = server.srsParams
    nextReview = server.nextReview
  } else if (
    server.srsParams.repetitionCount === local.srsParams.repetitionCount &&
    isNewer(server.lastPracticed, local.lastPracticed)
  ) {
    srsParams = server.srsParams
    nextReview = server.nextReview
  }

  return {
    skillId: local.skillId,
    masteryLevel,
    srsParams,
    attempts,
    successes,
    avgResponseTime,
    lastPracticed,
    nextReview,
  }
}

/**
 * Check if two CompetencyProgress objects represent the same entity
 */
export function isSameCompetency(a: CompetencyProgress, b: CompetencyProgress): boolean {
  return a.competencyAreaId === b.competencyAreaId && a.gradeRange === b.gradeRange
}

/**
 * Check if two SkillProgress objects represent the same entity
 */
export function isSameSkill(a: SkillProgress, b: SkillProgress): boolean {
  return a.skillId === b.skillId
}

