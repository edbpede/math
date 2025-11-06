/**
 * Exercise Instance Generator
 *
 * Generates concrete exercise instances from templates with support for:
 * - Deterministic generation from template + seed
 * - Batch generation for session preparation
 * - Context integration for culturally appropriate content
 * - Distractor generation for multiple choice exercises
 *
 * Requirements:
 * - 3.4: Generate instances deterministically (template + seed → instance)
 * - 11.4: Generate 20-30 instances in batch <200ms (~10ms per instance)
 */

import type {
  ExerciseInstance,
  ExerciseTemplate,
  Hint,
  ExerciseContext,
} from './types';
import type { Locale } from '../i18n/types';
import { ParameterGenerator } from './parameter-generator';
import { templateRegistry, type TemplateSelectionCriteria } from './template-registry';
import { ContextSelector } from '../i18n/context-selector';
import { formatNumber } from '../i18n/utils';
import { generateDistractors } from './distractors';

/**
 * Error thrown when instance generation fails
 */
export class InstanceGenerationError extends Error {
  constructor(
    message: string,
    public templateId: string,
    public seed: number,
    public cause?: unknown,
  ) {
    super(`Instance generation failed for template '${templateId}' with seed ${seed}: ${message}`);
    this.name = 'InstanceGenerationError';
  }
}

/**
 * Options for instance generation
 */
export interface GenerationOptions {
  locale?: Locale;
  contextSelector?: ContextSelector;
  includeDistractors?: boolean; // Generate distractors for multiple choice (default: true)
  distractorCount?: number; // Number of distractors (default: 3)
}

/**
 * Options for batch generation
 */
export interface BatchGenerationOptions extends GenerationOptions {
  startSeed?: number; // Starting seed for batch (default: Date.now())
}

/**
 * Generate a single exercise instance from a template
 *
 * @param templateId - The template ID to use
 * @param seed - Random seed for deterministic generation
 * @param options - Generation options
 * @returns Generated exercise instance
 * @throws {InstanceGenerationError} If generation fails
 */
export async function generateInstance(
  templateId: string,
  seed: number,
  options: GenerationOptions = {}
): Promise<ExerciseInstance> {
  const {
    locale = 'da-DK',
    contextSelector,
    includeDistractors = true,
    distractorCount = 3,
  } = options;

  // Get template from registry
  const template = templateRegistry.get(templateId);
  if (!template) {
    throw new InstanceGenerationError(
      'Template not found in registry',
      templateId,
      seed,
    );
  }

  try {
    // Generate parameters using constraint satisfaction
    const paramGenerator = new ParameterGenerator({ seed });
    const params = paramGenerator.generate(template.parameters);

    // Create or use provided context selector
    const contextSelectorInstance = contextSelector || new ContextSelector(locale);

    // Build exercise context
    const context: ExerciseContext = {
      locale,
      contextType: template.contextType,
    };

    // Select contexts based on template type if needed
    if (template.contextType && template.contextType !== 'abstract') {
      try {
        context.names = await contextSelectorInstance.selectNames(2);
        context.places = await contextSelectorInstance.selectPlace();
        
        // Select items based on context type
        const itemCategories: Record<string, string> = {
          shopping: 'food',
          school: 'school',
          nature: 'animals',
          sports: 'sports',
        };
        
        const itemCategory = itemCategories[template.contextType];
        if (itemCategory) {
          context.items = await contextSelectorInstance.selectItems(itemCategory, 3);
        }
      } catch (error) {
        // Context selection failed, continue with empty context
        console.warn(`Context selection failed for template ${templateId}:`, error);
      }
    }

    // Generate question, answer, and visual aids using template function
    const generationResult = template.generate(params, locale);

    // Render question text with parameter substitution
    const questionText = renderQuestionText(
      generationResult.questionText,
      params,
      locale,
      context
    );

    // Generate hints using template hint functions
    const hints: Hint[] = template.hints.map((hintFn, index) => ({
      level: (index + 1) as 1 | 2 | 3 | 4,
      text: hintFn(params, locale),
      visualAid: generationResult.visualAid,
    }));

    // Generate distractors if requested
    let distractors: string[] | undefined;
    if (includeDistractors) {
      distractors = generateDistractors(generationResult.correctAnswer, {
        count: distractorCount,
        seed,
        excludeValues: [],
      });
    }

    // Create instance ID from template ID and seed
    const instanceId = `${templateId}-${seed}`;

    // Mark template as used for anti-repetition tracking
    templateRegistry.markUsed(templateId);

    return {
      id: instanceId,
      templateId,
      questionText,
      correctAnswer: generationResult.correctAnswer,
      distractors,
      hints,
      metadata: template.metadata,
      context,
      seed,
    };
  } catch (error) {
    throw new InstanceGenerationError(
      error instanceof Error ? error.message : String(error),
      templateId,
      seed,
      error,
    );
  }
}

/**
 * Generate a batch of exercise instances
 *
 * Efficiently generates multiple instances for a practice session.
 * Uses template selection criteria to find appropriate templates
 * and generates instances with sequential seeds.
 *
 * @param criteria - Template selection criteria
 * @param count - Number of instances to generate
 * @param options - Batch generation options
 * @returns Array of generated exercise instances
 * @throws {InstanceGenerationError} If generation fails
 */
export async function generateBatch(
  criteria: TemplateSelectionCriteria,
  count: number,
  options: BatchGenerationOptions = {}
): Promise<ExerciseInstance[]> {
  const {
    startSeed = Date.now(),
    locale = 'da-DK',
    contextSelector,
    includeDistractors = true,
    distractorCount = 3,
  } = options;

  // Pre-allocate results array for performance
  const instances: ExerciseInstance[] = new Array(count);

  // Create context selector once for the batch
  const contextSelectorInstance = contextSelector || new ContextSelector(locale);

  // Generate instances
  for (let i = 0; i < count; i++) {
    // Select a template based on criteria
    const templateId = templateRegistry.select(criteria);

    if (!templateId) {
      throw new InstanceGenerationError(
        'No templates found matching criteria',
        'unknown',
        startSeed + i,
      );
    }

    // Generate instance with sequential seed
    const seed = startSeed + i;
    const instance = await generateInstance(templateId, seed, {
      locale,
      contextSelector: contextSelectorInstance,
      includeDistractors,
      distractorCount,
    });

    instances[i] = instance;
  }

  return instances;
}

/**
 * Generate a batch of instances from specific template IDs
 *
 * Useful when you want precise control over which templates to use.
 *
 * @param templateIds - Array of template IDs to use
 * @param options - Batch generation options
 * @returns Array of generated exercise instances
 */
export async function generateBatchFromTemplates(
  templateIds: string[],
  options: BatchGenerationOptions = {}
): Promise<ExerciseInstance[]> {
  const {
    startSeed = Date.now(),
    locale = 'da-DK',
    contextSelector,
    includeDistractors = true,
    distractorCount = 3,
  } = options;

  // Pre-allocate results array
  const instances: ExerciseInstance[] = new Array(templateIds.length);

  // Create context selector once for the batch
  const contextSelectorInstance = contextSelector || new ContextSelector(locale);

  // Generate instances
  for (let i = 0; i < templateIds.length; i++) {
    const seed = startSeed + i;
    const instance = await generateInstance(templateIds[i], seed, {
      locale,
      contextSelector: contextSelectorInstance,
      includeDistractors,
      distractorCount,
    });

    instances[i] = instance;
  }

  return instances;
}

/**
 * Render question text with parameter substitution
 *
 * Supports:
 * - {{paramName}} - Replace with parameter value
 * - {{paramName:format}} - Replace with formatted parameter (e.g., number formatting)
 * - {{context.names[0]}} - Replace with context values
 * - {{context.places}} - Replace with context values
 * - {{context.items[0]}} - Replace with context items
 *
 * @param questionText - Question text with placeholders
 * @param params - Generated parameters
 * @param locale - User locale for formatting
 * @param context - Exercise context with names, places, items
 * @returns Rendered question text
 */
function renderQuestionText(
  questionText: string,
  params: Record<string, unknown>,
  locale: Locale,
  context: ExerciseContext
): string {
  let rendered = questionText;

  // Replace context placeholders
  if (context.names && context.names.length > 0) {
    context.names.forEach((name, index) => {
      rendered = rendered.replace(
        new RegExp(`\\{\\{context\\.names\\[${index}\\]\\}\\}`, 'g'),
        name
      );
    });
    // Also support {{context.name}} for first name
    rendered = rendered.replace(/\{\{context\.name\}\}/g, context.names[0]);
  }

  if (context.places) {
    const place = Array.isArray(context.places) ? context.places[0] : context.places;
    rendered = rendered.replace(/\{\{context\.place\}\}/g, place);
  }

  if (context.items && context.items.length > 0) {
    context.items.forEach((item, index) => {
      rendered = rendered.replace(
        new RegExp(`\\{\\{context\\.items\\[${index}\\]\\}\\}`, 'g'),
        item
      );
    });
    // Also support {{context.item}} for first item
    rendered = rendered.replace(/\{\{context\.item\}\}/g, context.items[0]);
  }

  // Replace parameter placeholders with optional formatting
  const paramPattern = /\{\{([^:}]+)(?::([^}]+))?\}\}/g;
  rendered = rendered.replace(paramPattern, (match, paramName, format) => {
    const paramValue = params[paramName];

    if (paramValue === undefined) {
      console.warn(`Parameter ${paramName} not found in params`);
      return match; // Keep placeholder if parameter not found
    }

    // Apply formatting if specified
    if (format === 'number' && typeof paramValue === 'number') {
      return formatNumber(paramValue, locale);
    }

    // Default: convert to string
    return String(paramValue);
  });

  return rendered;
}

/**
 * Re-generate an exercise instance with the same template and seed
 *
 * Useful for testing deterministic generation or replaying exercises.
 *
 * @param instance - The instance to regenerate
 * @param options - Generation options
 * @returns Newly generated instance (should be identical to original)
 */
export async function regenerateInstance(
  instance: ExerciseInstance,
  options: GenerationOptions = {}
): Promise<ExerciseInstance> {
  return generateInstance(instance.templateId, instance.seed, {
    locale: instance.context.locale,
    ...options,
  });
}

/**
 * Validate that an instance can be generated from a template
 *
 * Useful for testing template definitions before registration.
 *
 * @param template - The template to validate
 * @param testSeeds - Array of seeds to test (default: [1, 42, 1337])
 * @returns true if all test generations succeed
 */
export async function validateTemplate(
  template: ExerciseTemplate,
  testSeeds: number[] = [1, 42, 1337]
): Promise<boolean> {
  for (const seed of testSeeds) {
    try {
      const params = new ParameterGenerator({ seed }).generate(template.parameters);
      const result = template.generate(params, 'da-DK');
      
      // Validate result structure
      if (!result.questionText || result.questionText.trim() === '') {
        throw new Error('Generated question text is empty');
      }
      
      if (result.correctAnswer.value === undefined || result.correctAnswer.value === null) {
        throw new Error('Generated correct answer is undefined or null');
      }
      
      // Validate hints
      if (template.hints.length < 4) {
        throw new Error('Template must provide at least 4 hint levels');
      }
      
      for (let i = 0; i < template.hints.length; i++) {
        const hint = template.hints[i](params, 'da-DK');
        if (!hint || hint.trim() === '') {
          throw new Error(`Hint level ${i + 1} is empty`);
        }
      }
    } catch (error) {
      console.error(`Template validation failed for seed ${seed}:`, error);
      return false;
    }
  }

  return true;
}

/**
 * Get generation statistics for monitoring performance
 *
 * @param instances - Array of generated instances
 * @returns Statistics about the generation
 */
export function getGenerationStats(instances: ExerciseInstance[]): {
  count: number;
  uniqueTemplates: number;
  contextsUsed: number;
  avgHintsPerInstance: number;
} {
  const templateIds = new Set(instances.map(i => i.templateId));
  const contextsUsed = instances.filter(i => 
    i.context.names || i.context.places || i.context.items
  ).length;
  
  const totalHints = instances.reduce((sum, i) => sum + i.hints.length, 0);
  const avgHints = instances.length > 0 ? totalHints / instances.length : 0;

  return {
    count: instances.length,
    uniqueTemplates: templateIds.size,
    contextsUsed,
    avgHintsPerInstance: avgHints,
  };
}

