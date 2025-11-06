/**
 * Mastery Tracking Module
 *
 * Exports for mastery calculation, progress tracking, and SRS system.
 *
 * @module mastery
 */

// Type exports
export type {
  SRSParameters,
  SkillProgress,
  CompetencyProgress,
  UserProgress,
  ExerciseAttempt,
  PracticeSession,
  MasteryCalculationInput,
  SRSUpdateInput,
  SRSUpdateResult,
  MasteryLevel,
  MasteryLevelBand,
} from './types';

export { MASTERY_LEVELS } from './types';

// Calculator exports
export {
  calculateMasteryLevel,
  calculateRecentPerformance,
  calculateResponseSpeedFactor,
  calculateHintUsageFactor,
  calculateConsistencyScore,
  calculateTimeDecayFactor,
  getMasteryLevelBand,
  type MasteryCalculationResult,
} from './calculator';
