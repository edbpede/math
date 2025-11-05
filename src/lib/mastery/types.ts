/**
 * Progress Tracking and Mastery Type Definitions
 * 
 * Type definitions for user progress tracking, mastery calculation,
 * and spaced repetition system (SRS) parameters.
 * 
 * Requirements:
 * - 3.1: Track mastery at multiple granularities
 * - 3.2: Implement spaced repetition system
 */

import type { CompetencyAreaId, GradeRange, Difficulty } from '../curriculum/types';

export interface SRSParameters {
  easeFactor: number;
  interval: number;
  repetitionCount: number;
}

export interface SkillProgress {
  skillId: string;
  masteryLevel: number;
  srsParams: SRSParameters;
  attempts: number;
  successes: number;
  avgResponseTime: number;
  lastPracticed: Date;
  nextReview: Date;
}

export interface CompetencyProgress {
  competencyAreaId: CompetencyAreaId;
  gradeRange: GradeRange;
  masteryLevel: number;
  totalAttempts: number;
  successRate: number;
  lastPracticed: Date;
  achievedAt?: Date;
}

export interface UserProgress {
  userId: string;
  competencyProgress: Map<string, CompetencyProgress>;
  skillsProgress: Map<string, SkillProgress>;
  lastActive: Date;
}

export interface ExerciseAttempt {
  id: string;
  userId: string;
  sessionId: string;
  templateId: string;
  competencyAreaId: CompetencyAreaId;
  skillId: string;
  difficulty: Difficulty;
  isBinding: boolean;
  correct: boolean;
  timeSpentSeconds: number;
  hintsUsed: number;
  userAnswer: string;
  createdAt: Date;
}

export interface PracticeSession {
  id: string;
  userId: string;
  gradeRange: GradeRange;
  competencyAreaId?: CompetencyAreaId;
  startedAt: Date;
  endedAt?: Date;
  totalExercises: number;
  correctCount: number;
  avgTimePerExerciseSeconds?: number;
}

export interface MasteryCalculationInput {
  recentAttempts: ExerciseAttempt[];
  responseSpeed: number;
  hintsUsed: number;
  consistencyScore: number;
  timeDecayFactor: number;
}

export interface SRSUpdateInput {
  wasCorrect: boolean;
  responseQuality: number;
  currentParams: SRSParameters;
}

export interface SRSUpdateResult {
  newParams: SRSParameters;
  nextReviewDate: Date;
}

export type MasteryLevel = 
  | 'introduced'
  | 'developing'
  | 'progressing'
  | 'proficient'
  | 'mastered';

export interface MasteryLevelBand {
  level: MasteryLevel;
  min: number;
  max: number;
  colorCode: string;
}

export const MASTERY_LEVELS: MasteryLevelBand[] = [
  { level: 'introduced', min: 0, max: 20, colorCode: 'red' },
  { level: 'developing', min: 21, max: 40, colorCode: 'yellow' },
  { level: 'progressing', min: 41, max: 60, colorCode: 'light-green' },
  { level: 'proficient', min: 61, max: 80, colorCode: 'green' },
  { level: 'mastered', min: 81, max: 100, colorCode: 'blue' },
];
