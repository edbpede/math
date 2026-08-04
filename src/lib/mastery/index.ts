/**
 * Mastery Tracking Module
 *
 * Exports for mastery calculation, progress tracking, and SRS system.
 *
 * @module mastery
 */

// Calculator exports
export {
  calculateConsistencyScore,
  calculateHintUsageFactor,
  calculateMasteryLevel,
  calculateRecentPerformance,
  calculateResponseSpeedFactor,
  calculateTimeDecayFactor,
  getMasteryLevelBand,
  type MasteryCalculationResult,
} from "./calculator";
// Type exports
export type {
  CompetencyProgress,
  ExerciseAttempt,
  MasteryCalculationInput,
  MasteryLevel,
  MasteryLevelBand,
  PracticeSession,
  SkillProgress,
  SRSParameters,
  SRSUpdateInput,
  SRSUpdateResult,
  UserProgress,
} from "./types";
export { MASTERY_LEVELS } from "./types";
