/**
 * Central Type Definitions Export
 *
 * Re-exports all type definitions from the various modules for convenient importing.
 */

export type {
  AttentionPoint,
  CompetencyArea,
  CompetencyAreaId,
  CurriculumMapping,
  Difficulty,
  GradeRange,
  SkillsArea,
} from "./curriculum/types";

export type {
  Answer,
  ContextType,
  ExerciseContext,
  ExerciseInstance,
  ExerciseTemplate,
  GenerationResult,
  Hint,
  ParameterConstraint,
  ParameterConstraints,
  ParameterType,
  TemplateMetadata,
  TemplateRegistryEntry,
  ValidationResult,
  VisualAid,
} from "./exercises/types";
export type {
  ContextPool,
  DateFormatOptions,
  I18nContext,
  Locale,
  LocaleConfig,
  NumberFormatOptions,
  TranslationCategory,
  TranslationFunction,
  TranslationKey,
  Translations,
} from "./i18n/types";
export { SUPPORTED_LOCALES } from "./i18n/types";
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
} from "./mastery/types";
export { MASTERY_LEVELS } from "./mastery/types";
