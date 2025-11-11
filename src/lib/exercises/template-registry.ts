/**
 * Exercise Template Registry System
 *
 * Provides centralized storage, indexing, and selection of exercise templates.
 * Supports multi-criteria filtering, weighted selection, and anti-repetition tracking.
 *
 * Requirements:
 * - 11.1: Implement template registry with multi-criteria indexing
 * - 11.3: Filter and weighted random selection based on SRS, binding status, and recency
 */

import type {
  ExerciseTemplate,
  TemplateRegistryEntry,
  TemplateMetadata,
} from "./types";
import type {
  CompetencyAreaId,
  Difficulty,
  GradeRange,
} from "../curriculum/types";

// Selection criteria for filtering templates
export interface TemplateSelectionCriteria {
  competencyAreaId?: CompetencyAreaId;
  skillsAreaId?: string;
  gradeRange?: GradeRange;
  difficulty?: Difficulty;
  isBinding?: boolean;
  tags?: string[];
  excludeTemplateIds?: string[];
}

// Weighting factors for template selection
export interface SelectionWeights {
  srsBaseline: number; // Base weight for all templates
  bindingBonus: number; // Additional weight for binding content
  recencyPenalty: number; // Weight reduction per recent usage
  masteryAdjustment: number; // Weight adjustment based on mastery level (0-100)
}

// Default selection weights
const DEFAULT_WEIGHTS: SelectionWeights = {
  srsBaseline: 1.0,
  bindingBonus: 0.3,
  recencyPenalty: 0.5,
  masteryAdjustment: 0.0,
};

// Validation error types
export class TemplateValidationError extends Error {
  constructor(
    message: string,
    public templateId: string,
    public field?: string,
  ) {
    super(`Template validation failed for '${templateId}': ${message}`);
    this.name = "TemplateValidationError";
  }
}

/**
 * Template Registry
 *
 * Manages exercise template storage, indexing, and selection with support for:
 * - Multi-criteria indexing (competency area, skills area, grade, difficulty, tags)
 * - Anti-repetition tracking (recently used templates)
 * - Weighted random selection based on SRS priority, binding status, and recency
 */
export class TemplateRegistry {
  // Primary storage: template ID -> registry entry
  private templates = new Map<string, TemplateRegistryEntry>();

  // Multi-criteria indexes for efficient filtering
  private competencyIndex = new Map<CompetencyAreaId, Set<string>>();
  private skillsIndex = new Map<string, Set<string>>();
  private gradeIndex = new Map<GradeRange, Set<string>>();
  private difficultyIndex = new Map<Difficulty, Set<string>>();
  private bindingIndex = new Map<boolean, Set<string>>();
  private tagIndex = new Map<string, Set<string>>();

  // Recently used templates (FIFO queue with max size)
  private recentlyUsed: string[] = [];
  private readonly maxRecentSize: number = 20;

  /**
   * Register a new template in the registry
   *
   * @param template - The exercise template to register
   * @throws {TemplateValidationError} If template validation fails
   */
  register(template: ExerciseTemplate): void {
    // Validate template before registration
    this.validateTemplate(template);

    // Check for duplicate registration
    if (this.templates.has(template.id)) {
      throw new TemplateValidationError(
        "Template ID already registered",
        template.id,
        "id",
      );
    }

    // Create registry entry with initial metadata
    const entry: TemplateRegistryEntry = {
      template,
      weight: 1.0,
      lastUsed: undefined,
      usageCount: 0,
    };

    // Store in primary map
    this.templates.set(template.id, entry);

    // Update all indexes
    this.indexTemplate(template.id, template.metadata);
  }

  /**
   * Unregister a template from the registry
   *
   * @param templateId - The ID of the template to remove
   * @returns true if template was found and removed, false otherwise
   */
  unregister(templateId: string): boolean {
    const entry = this.templates.get(templateId);
    if (!entry) {
      return false;
    }

    // Remove from all indexes
    this.deindexTemplate(templateId, entry.template.metadata);

    // Remove from primary storage
    this.templates.delete(templateId);

    // Remove from recently used
    this.recentlyUsed = this.recentlyUsed.filter((id) => id !== templateId);

    return true;
  }

  /**
   * Get a template by ID
   *
   * @param templateId - The template ID to retrieve
   * @returns The template, or undefined if not found
   */
  get(templateId: string): ExerciseTemplate | undefined {
    return this.templates.get(templateId)?.template;
  }

  /**
   * Check if a template exists in the registry
   *
   * @param templateId - The template ID to check
   * @returns true if template exists, false otherwise
   */
  has(templateId: string): boolean {
    return this.templates.has(templateId);
  }

  /**
   * Get total number of registered templates
   *
   * @returns The count of registered templates
   */
  count(): number {
    return this.templates.size;
  }

  /**
   * Find templates matching the given criteria
   *
   * @param criteria - Selection criteria for filtering
   * @returns Array of template IDs matching all criteria
   */
  find(criteria: TemplateSelectionCriteria): string[] {
    // Start with all templates
    let candidateIds = new Set<string>(this.templates.keys());

    // Apply each filter criterion
    if (criteria.competencyAreaId !== undefined) {
      candidateIds = this.intersect(
        candidateIds,
        this.competencyIndex.get(criteria.competencyAreaId),
      );
    }

    if (criteria.skillsAreaId !== undefined) {
      candidateIds = this.intersect(
        candidateIds,
        this.skillsIndex.get(criteria.skillsAreaId),
      );
    }

    if (criteria.gradeRange !== undefined) {
      candidateIds = this.intersect(
        candidateIds,
        this.gradeIndex.get(criteria.gradeRange),
      );
    }

    if (criteria.difficulty !== undefined) {
      candidateIds = this.intersect(
        candidateIds,
        this.difficultyIndex.get(criteria.difficulty),
      );
    }

    if (criteria.isBinding !== undefined) {
      candidateIds = this.intersect(
        candidateIds,
        this.bindingIndex.get(criteria.isBinding),
      );
    }

    // Filter by tags (template must have ALL specified tags)
    if (criteria.tags && criteria.tags.length > 0) {
      candidateIds = new Set(
        Array.from(candidateIds).filter((id) => {
          const entry = this.templates.get(id);
          if (!entry) return false;
          return criteria.tags!.every((tag) =>
            entry.template.metadata.tags.includes(tag),
          );
        }),
      );
    }

    // Exclude specified templates
    if (criteria.excludeTemplateIds && criteria.excludeTemplateIds.length > 0) {
      criteria.excludeTemplateIds.forEach((id) => candidateIds.delete(id));
    }

    return Array.from(candidateIds);
  }

  /**
   * Select a random template using weighted selection
   *
   * @param criteria - Selection criteria for filtering
   * @param weights - Weighting factors (optional, uses defaults if not provided)
   * @param masteryLevel - User's mastery level for this skill (0-100)
   * @returns Selected template ID, or undefined if no matches found
   */
  select(
    criteria: TemplateSelectionCriteria,
    weights: Partial<SelectionWeights> = {},
    masteryLevel: number = 50,
  ): string | undefined {
    // Find matching templates
    const candidateIds = this.find(criteria);

    if (candidateIds.length === 0) {
      return undefined;
    }

    // If only one candidate, return it
    if (candidateIds.length === 1) {
      return candidateIds[0];
    }

    // Merge provided weights with defaults
    const effectiveWeights: SelectionWeights = {
      ...DEFAULT_WEIGHTS,
      ...weights,
    };

    // Calculate weights for each candidate
    const weightedCandidates = candidateIds.map((id) => ({
      id,
      weight: this.calculateWeight(id, effectiveWeights, masteryLevel),
    }));

    // Perform weighted random selection
    return this.weightedRandomSelect(weightedCandidates);
  }

  /**
   * Mark a template as used (for anti-repetition tracking)
   *
   * @param templateId - The template ID that was used
   */
  markUsed(templateId: string): void {
    const entry = this.templates.get(templateId);
    if (!entry) {
      return;
    }

    // Update usage metadata
    entry.lastUsed = new Date();
    entry.usageCount += 1;

    // Add to recently used queue
    this.recentlyUsed.push(templateId);

    // Maintain max queue size (FIFO)
    if (this.recentlyUsed.length > this.maxRecentSize) {
      this.recentlyUsed.shift();
    }
  }

  /**
   * Get list of recently used template IDs (most recent first)
   *
   * @returns Array of recently used template IDs
   */
  getRecentlyUsed(): string[] {
    return [...this.recentlyUsed].reverse();
  }

  /**
   * Clear the recently used templates list
   */
  clearRecentlyUsed(): void {
    this.recentlyUsed = [];
  }

  /**
   * Get usage statistics for a template
   *
   * @param templateId - The template ID to query
   * @returns Usage stats, or undefined if template not found
   */
  getUsageStats(
    templateId: string,
  ): { usageCount: number; lastUsed?: Date } | undefined {
    const entry = this.templates.get(templateId);
    if (!entry) {
      return undefined;
    }
    return {
      usageCount: entry.usageCount,
      lastUsed: entry.lastUsed,
    };
  }

  /**
   * Validate template structure and metadata
   *
   * @param template - The template to validate
   * @throws {TemplateValidationError} If validation fails
   */
  private validateTemplate(template: ExerciseTemplate): void {
    // Validate required fields
    if (
      !template.id ||
      typeof template.id !== "string" ||
      template.id.trim() === ""
    ) {
      throw new TemplateValidationError(
        "Template ID is required and must be a non-empty string",
        template.id || "unknown",
        "id",
      );
    }

    if (
      !template.name ||
      typeof template.name !== "string" ||
      template.name.trim() === ""
    ) {
      throw new TemplateValidationError(
        "Template name is required and must be a non-empty string",
        template.id,
        "name",
      );
    }

    // Validate metadata
    if (!template.metadata) {
      throw new TemplateValidationError(
        "Template metadata is required",
        template.id,
        "metadata",
      );
    }

    this.validateMetadata(template.id, template.metadata);

    // Validate parameters
    if (!template.parameters || typeof template.parameters !== "object") {
      throw new TemplateValidationError(
        "Template parameters must be an object",
        template.id,
        "parameters",
      );
    }

    // Validate functions
    if (typeof template.generate !== "function") {
      throw new TemplateValidationError(
        "Template generate must be a function",
        template.id,
        "generate",
      );
    }

    if (typeof template.validate !== "function") {
      throw new TemplateValidationError(
        "Template validate must be a function",
        template.id,
        "validate",
      );
    }

    if (!Array.isArray(template.hints)) {
      throw new TemplateValidationError(
        "Template hints must be an array",
        template.id,
        "hints",
      );
    }

    if (template.hints.length < 4) {
      throw new TemplateValidationError(
        "Template must provide at least 4 hint levels",
        template.id,
        "hints",
      );
    }

    template.hints.forEach((hint, index) => {
      if (typeof hint !== "function") {
        throw new TemplateValidationError(
          `Hint at index ${index} must be a function`,
          template.id,
          `hints[${index}]`,
        );
      }
    });
  }

  /**
   * Validate template metadata
   *
   * @param templateId - The template ID (for error messages)
   * @param metadata - The metadata to validate
   * @throws {TemplateValidationError} If validation fails
   */
  private validateMetadata(
    templateId: string,
    metadata: TemplateMetadata,
  ): void {
    // Validate competency area ID
    const validCompetencyAreas: CompetencyAreaId[] = [
      "matematiske-kompetencer",
      "tal-og-algebra",
      "geometri-og-maling",
      "statistik-og-sandsynlighed",
    ];

    if (!validCompetencyAreas.includes(metadata.competencyAreaId)) {
      throw new TemplateValidationError(
        `Invalid competency area ID: ${metadata.competencyAreaId}`,
        templateId,
        "metadata.competencyAreaId",
      );
    }

    // Validate skills area ID
    if (!metadata.skillsAreaId || typeof metadata.skillsAreaId !== "string") {
      throw new TemplateValidationError(
        "Skills area ID is required and must be a string",
        templateId,
        "metadata.skillsAreaId",
      );
    }

    // Validate grade range
    const validGradeRanges: GradeRange[] = ["0-3", "4-6", "7-9"];
    if (!validGradeRanges.includes(metadata.gradeRange)) {
      throw new TemplateValidationError(
        `Invalid grade range: ${metadata.gradeRange}`,
        templateId,
        "metadata.gradeRange",
      );
    }

    // Validate difficulty
    const validDifficulties: Difficulty[] = ["A", "B", "C"];
    if (!validDifficulties.includes(metadata.difficulty)) {
      throw new TemplateValidationError(
        `Invalid difficulty: ${metadata.difficulty}`,
        templateId,
        "metadata.difficulty",
      );
    }

    // Validate binding status
    if (typeof metadata.isBinding !== "boolean") {
      throw new TemplateValidationError(
        "isBinding must be a boolean",
        templateId,
        "metadata.isBinding",
      );
    }

    // Validate tags
    if (!Array.isArray(metadata.tags)) {
      throw new TemplateValidationError(
        "Tags must be an array",
        templateId,
        "metadata.tags",
      );
    }

    metadata.tags.forEach((tag, index) => {
      if (typeof tag !== "string") {
        throw new TemplateValidationError(
          `Tag at index ${index} must be a string`,
          templateId,
          `metadata.tags[${index}]`,
        );
      }
    });
  }

  /**
   * Add template to all relevant indexes
   *
   * @param templateId - The template ID to index
   * @param metadata - The template metadata containing indexing values
   */
  private indexTemplate(templateId: string, metadata: TemplateMetadata): void {
    // Index by competency area
    this.addToIndex(
      this.competencyIndex,
      metadata.competencyAreaId,
      templateId,
    );

    // Index by skills area
    this.addToIndex(this.skillsIndex, metadata.skillsAreaId, templateId);

    // Index by grade range
    this.addToIndex(this.gradeIndex, metadata.gradeRange, templateId);

    // Index by difficulty
    this.addToIndex(this.difficultyIndex, metadata.difficulty, templateId);

    // Index by binding status
    this.addToIndex(this.bindingIndex, metadata.isBinding, templateId);

    // Index by tags
    metadata.tags.forEach((tag) => {
      this.addToIndex(this.tagIndex, tag, templateId);
    });
  }

  /**
   * Remove template from all indexes
   *
   * @param templateId - The template ID to deindex
   * @param metadata - The template metadata containing indexing values
   */
  private deindexTemplate(
    templateId: string,
    metadata: TemplateMetadata,
  ): void {
    // Remove from competency area index
    this.removeFromIndex(
      this.competencyIndex,
      metadata.competencyAreaId,
      templateId,
    );

    // Remove from skills area index
    this.removeFromIndex(this.skillsIndex, metadata.skillsAreaId, templateId);

    // Remove from grade range index
    this.removeFromIndex(this.gradeIndex, metadata.gradeRange, templateId);

    // Remove from difficulty index
    this.removeFromIndex(this.difficultyIndex, metadata.difficulty, templateId);

    // Remove from binding status index
    this.removeFromIndex(this.bindingIndex, metadata.isBinding, templateId);

    // Remove from tag indexes
    metadata.tags.forEach((tag) => {
      this.removeFromIndex(this.tagIndex, tag, templateId);
    });
  }

  /**
   * Add a template ID to an index
   *
   * @param index - The index map to update
   * @param key - The index key
   * @param templateId - The template ID to add
   */
  private addToIndex<K>(
    index: Map<K, Set<string>>,
    key: K,
    templateId: string,
  ): void {
    let set = index.get(key);
    if (!set) {
      set = new Set();
      index.set(key, set);
    }
    set.add(templateId);
  }

  /**
   * Remove a template ID from an index
   *
   * @param index - The index map to update
   * @param key - The index key
   * @param templateId - The template ID to remove
   */
  private removeFromIndex<K>(
    index: Map<K, Set<string>>,
    key: K,
    templateId: string,
  ): void {
    const set = index.get(key);
    if (set) {
      set.delete(templateId);
      // Clean up empty sets
      if (set.size === 0) {
        index.delete(key);
      }
    }
  }

  /**
   * Compute intersection of two sets
   *
   * @param set1 - First set
   * @param set2 - Second set (may be undefined)
   * @returns Intersection of the two sets
   */
  private intersect(
    set1: Set<string>,
    set2: Set<string> | undefined,
  ): Set<string> {
    if (!set2) {
      return new Set();
    }
    return new Set(Array.from(set1).filter((id) => set2.has(id)));
  }

  /**
   * Calculate selection weight for a template
   *
   * @param templateId - The template ID to calculate weight for
   * @param weights - Weighting factors
   * @param masteryLevel - User's mastery level (0-100)
   * @returns Calculated weight value
   */
  private calculateWeight(
    templateId: string,
    weights: SelectionWeights,
    masteryLevel: number,
  ): number {
    const entry = this.templates.get(templateId);
    if (!entry) {
      return 0;
    }

    // Start with baseline weight
    let weight = weights.srsBaseline;

    // Add bonus for binding content
    if (entry.template.metadata.isBinding) {
      weight += weights.bindingBonus;
    }

    // Apply recency penalty (reduce weight for recently used templates)
    const recentIndex = this.recentlyUsed.indexOf(templateId);
    if (recentIndex !== -1) {
      // More recent usage = higher penalty
      const recencyFactor =
        (this.recentlyUsed.length - recentIndex) / this.recentlyUsed.length;
      weight -= weights.recencyPenalty * recencyFactor;
    }

    // Apply mastery adjustment
    // Lower mastery = prefer easier difficulty
    // Higher mastery = prefer harder difficulty
    const difficultyValues: Record<Difficulty, number> = { A: 1, B: 2, C: 3 };
    const templateDifficulty =
      difficultyValues[entry.template.metadata.difficulty];
    const optimalDifficulty = 1 + masteryLevel / 50; // Maps 0->1, 50->2, 100->3
    const difficultyDistance = Math.abs(templateDifficulty - optimalDifficulty);
    weight -= weights.masteryAdjustment * difficultyDistance;

    // Ensure weight is non-negative
    return Math.max(0, weight);
  }

  /**
   * Perform weighted random selection from candidates
   *
   * @param candidates - Array of candidates with weights
   * @returns Selected candidate ID, or undefined if all weights are zero
   */
  private weightedRandomSelect(
    candidates: Array<{ id: string; weight: number }>,
  ): string | undefined {
    // Calculate total weight
    const totalWeight = candidates.reduce((sum, c) => sum + c.weight, 0);

    if (totalWeight <= 0) {
      // All weights are zero or negative, fall back to uniform random
      return candidates[Math.floor(Math.random() * candidates.length)].id;
    }

    // Select random point in weight distribution
    let random = Math.random() * totalWeight;

    // Find the candidate at this point
    for (const candidate of candidates) {
      random -= candidate.weight;
      if (random <= 0) {
        return candidate.id;
      }
    }

    // Fallback (shouldn't reach here due to floating point arithmetic)
    return candidates[candidates.length - 1].id;
  }
}

// Export singleton instance
export const templateRegistry = new TemplateRegistry();

// Export convenience functions
export const registerTemplate = (template: ExerciseTemplate): void => {
  templateRegistry.register(template);
};

export const unregisterTemplate = (templateId: string): boolean => {
  return templateRegistry.unregister(templateId);
};

export const getTemplate = (
  templateId: string,
): ExerciseTemplate | undefined => {
  return templateRegistry.get(templateId);
};

export const findTemplates = (
  criteria: TemplateSelectionCriteria,
): string[] => {
  return templateRegistry.find(criteria);
};

export const selectTemplate = (
  criteria: TemplateSelectionCriteria,
  weights?: Partial<SelectionWeights>,
  masteryLevel?: number,
): string | undefined => {
  return templateRegistry.select(criteria, weights, masteryLevel);
};

export const markTemplateUsed = (templateId: string): void => {
  templateRegistry.markUsed(templateId);
};
