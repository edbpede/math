/**
 * Curriculum Type Definitions
 * 
 * Type definitions for the Danish Fælles Mål mathematics curriculum structure.
 * Supports competency areas, skills areas, grade ranges, and difficulty levels.
 * 
 * Requirements:
 * - 3.1: Organize content according to four Danish Fælles Mål competency areas
 * - 3.2: Map every exercise template to specific curriculum elements
 */

export type GradeRange = '0-3' | '4-6' | '7-9';

export type Difficulty = 'A' | 'B' | 'C';

export type CompetencyAreaId = 
  | 'matematiske-kompetencer'
  | 'tal-og-algebra'
  | 'geometri-og-maling'
  | 'statistik-og-sandsynlighed';

export interface AttentionPoint {
  id: string;
  nameKey: string;
  descriptionKey: string;
  gradeRange: GradeRange;
}

export interface SkillsArea {
  id: string;
  competencyAreaId: CompetencyAreaId;
  nameKey: string;
  descriptionKey: string;
  gradeRange: GradeRange;
  isBinding: boolean;
  attentionPoints?: AttentionPoint[];
}

export interface CompetencyArea {
  id: CompetencyAreaId;
  nameKey: string;
  descriptionKey: string;
  skillsAreas: SkillsArea[];
}

export interface CurriculumMapping {
  competencyAreaId: CompetencyAreaId;
  skillsAreaId: string;
  gradeRange: GradeRange;
  difficulty: Difficulty;
  isBinding: boolean;
  attentionPointId?: string;
  kompetencemål: string[];
  færdighedsOgVidensområder: string[];
}
