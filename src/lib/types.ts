/**
 * Central Type Definitions Export
 * 
 * Re-exports all type definitions from the various modules for convenient importing.
 */

export type {
  GradeRange,
  Difficulty,
  CompetencyAreaId,
  AttentionPoint,
  SkillsArea,
  CompetencyArea,
  CurriculumMapping,
} from './curriculum/types';

export type {
  TemplateMetadata,
  Answer,
  ParameterType,
  ParameterConstraint,
  ParameterConstraints,
  ContextType,
  VisualAid,
  Hint,
  ExerciseContext,
  ExerciseInstance,
  GenerationResult,
  ValidationResult,
  ExerciseTemplate,
  TemplateRegistryEntry,
} from './exercises/types';

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
} from './mastery/types';

export { MASTERY_LEVELS } from './mastery/types';

export type {
  Locale,
  TranslationKey,
  TranslationCategory,
  Translations,
  ContextPool,
  NumberFormatOptions,
  DateFormatOptions,
  LocaleConfig,
  TranslationFunction,
  I18nContext,
} from './i18n/types';

export { SUPPORTED_LOCALES } from './i18n/types';
