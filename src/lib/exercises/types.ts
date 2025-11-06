/**
 * Exercise Template Type Definitions
 * 
 * Type definitions for the exercise generation system including templates,
 * instances, answers, hints, and constraints.
 * 
 * Requirements:
 * - 3.2: Map templates to specific curriculum elements
 * - 11.2: Template registry with metadata and generation logic
 */

import type { CompetencyAreaId, Difficulty, GradeRange } from '../curriculum/types';

export interface TemplateMetadata {
  competencyAreaId: CompetencyAreaId;
  skillsAreaId: string;
  gradeRange: GradeRange;
  difficulty: Difficulty;
  isBinding: boolean;
  attentionPointId?: string;
  tags: string[];
}

export interface Answer {
  value: string | number;
  equivalents?: Array<string | number>;
  tolerance?: number;
}

export type ParameterType = 'integer' | 'decimal' | 'fraction' | 'string';

export interface ParameterConstraint {
  type: ParameterType;
  min?: number;
  max?: number;
  step?: number;
  options?: unknown[];
  dependsOn?: string[];
  constraint?: (params: Record<string, unknown>) => boolean;
}

export interface ParameterConstraints {
  [key: string]: ParameterConstraint;
}

export type ContextType = 'shopping' | 'school' | 'nature' | 'sports' | 'abstract';

export interface VisualAid {
  type: 'number-line' | 'diagram' | 'chart' | 'image';
  data: unknown;
}

/**
 * Represents a single step in a worked solution
 */
export interface SolutionStep {
  /** Description of what's happening in this step */
  explanation: string;
  /** Mathematical expression or calculation for this step */
  expression: string;
  /** Optional visual aid for this specific step */
  visualAid?: VisualAid;
}

/**
 * Represents a complete worked solution with step-by-step breakdown
 *
 * Requirements:
 * - 4.3: Display complete worked solution with intermediate steps
 * - 8.4: Provide worked solution at any time during or after exercise
 */
export interface WorkedSolution {
  /** Array of steps showing the complete solution process */
  steps: SolutionStep[];
  /** Final answer statement */
  finalAnswer: string;
  /** Optional overall visual aid for the entire solution */
  visualAid?: VisualAid;
}

export interface Hint {
  level: 1 | 2 | 3 | 4;
  text: string;
  visualAid?: VisualAid;
  /** Worked solution (typically for level 4 hints) */
  workedSolution?: WorkedSolution;
}

export interface ExerciseContext {
  locale: 'da-DK' | 'en-US';
  contextType?: ContextType;
  names?: string[];
  places?: string[];
  items?: string[];
}

export interface ExerciseInstance {
  id: string;
  templateId: string;
  questionText: string;
  correctAnswer: Answer;
  distractors?: string[];
  hints: Hint[];
  metadata: TemplateMetadata;
  context: ExerciseContext;
  seed: number;
}

export interface GenerationResult {
  questionText: string;
  correctAnswer: Answer;
  distractors?: string[];
  visualAid?: VisualAid;
}

export interface ValidationResult {
  correct: boolean;
  normalized?: string;
}

/**
 * Hint generator function that can return either:
 * - A string (simple text hint)
 * - A Hint object (with optional workedSolution and visualAid)
 */
export type HintGenerator = (
  params: Record<string, unknown>,
  locale: string
) => string | Omit<Hint, 'level'>;

export interface ExerciseTemplate {
  id: string;
  name: string;
  metadata: TemplateMetadata;
  parameters: ParameterConstraints;
  generate: (params: Record<string, unknown>, locale: string) => GenerationResult;
  validate: (userAnswer: string, correctAnswer: Answer) => ValidationResult;
  hints: HintGenerator[];
  contextType?: ContextType;
}

export interface TemplateRegistryEntry {
  template: ExerciseTemplate;
  weight: number;
  lastUsed?: Date;
  usageCount: number;
}
