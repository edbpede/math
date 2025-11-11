/**
 * Template Registry Tests
 *
 * Comprehensive tests for the exercise template registry system including
 * registration, validation, indexing, filtering, selection, and anti-repetition.
 *
 * Requirements:
 * - 11.1: Template registry with multi-criteria indexing
 * - 11.3: Filtered and weighted selection based on SRS, binding, and recency
 */

import { describe, it, expect, beforeEach } from "vitest";
import {
  TemplateRegistry,
  TemplateValidationError,
  templateRegistry,
  registerTemplate,
  unregisterTemplate,
  getTemplate,
  findTemplates,
  selectTemplate,
  markTemplateUsed,
} from "./template-registry";
import type { ExerciseTemplate } from "./types";

// Helper function to create a minimal valid template
const createValidTemplate = (
  id: string,
  overrides: Partial<ExerciseTemplate> = {},
): ExerciseTemplate => {
  return {
    id,
    name: `Test Template ${id}`,
    metadata: {
      competencyAreaId: "tal-og-algebra",
      skillsAreaId: "tal-addition",
      gradeRange: "0-3",
      difficulty: "A",
      isBinding: true,
      tags: [],
    },
    parameters: {},
    generate: () => ({
      questionText: "Test question",
      correctAnswer: { value: 42 },
    }),
    validate: () => ({ correct: true }),
    hints: [() => "Hint 1", () => "Hint 2", () => "Hint 3", () => "Hint 4"],
    ...overrides,
  };
};

describe("TemplateRegistry", () => {
  let registry: TemplateRegistry;

  beforeEach(() => {
    // Create a fresh registry instance for each test
    registry = new TemplateRegistry();
  });

  describe("Template Registration", () => {
    it("should register a valid template", () => {
      const template = createValidTemplate("test-1");
      registry.register(template);

      expect(registry.has("test-1")).toBe(true);
      expect(registry.count()).toBe(1);
      expect(registry.get("test-1")).toEqual(template);
    });

    it("should register multiple templates", () => {
      const template1 = createValidTemplate("test-1");
      const template2 = createValidTemplate("test-2");
      const template3 = createValidTemplate("test-3");

      registry.register(template1);
      registry.register(template2);
      registry.register(template3);

      expect(registry.count()).toBe(3);
      expect(registry.has("test-1")).toBe(true);
      expect(registry.has("test-2")).toBe(true);
      expect(registry.has("test-3")).toBe(true);
    });

    it("should throw error for duplicate template ID", () => {
      const template1 = createValidTemplate("test-1");
      const template2 = createValidTemplate("test-1"); // Same ID

      registry.register(template1);

      expect(() => registry.register(template2)).toThrow(
        TemplateValidationError,
      );
      expect(() => registry.register(template2)).toThrow("already registered");
    });

    it("should validate template ID is non-empty string", () => {
      const template = createValidTemplate("");

      expect(() => registry.register(template)).toThrow(
        TemplateValidationError,
      );
      expect(() => registry.register(template)).toThrow("non-empty string");
    });

    it("should validate template name is non-empty string", () => {
      const template = createValidTemplate("test-1", { name: "" });

      expect(() => registry.register(template)).toThrow(
        TemplateValidationError,
      );
      expect(() => registry.register(template)).toThrow("non-empty string");
    });

    it("should validate metadata exists", () => {
      const template = createValidTemplate("test-1");
      // @ts-expect-error - Testing runtime validation
      delete template.metadata;

      expect(() => registry.register(template)).toThrow(
        TemplateValidationError,
      );
      expect(() => registry.register(template)).toThrow("metadata is required");
    });

    it("should validate competency area ID", () => {
      const template = createValidTemplate("test-1", {
        metadata: {
          // @ts-expect-error - Testing runtime validation
          competencyAreaId: "invalid-area",
          skillsAreaId: "test",
          gradeRange: "0-3",
          difficulty: "A",
          isBinding: true,
          tags: [],
        },
      });

      expect(() => registry.register(template)).toThrow(
        TemplateValidationError,
      );
      expect(() => registry.register(template)).toThrow(
        "Invalid competency area ID",
      );
    });

    it("should validate grade range", () => {
      const template = createValidTemplate("test-1", {
        metadata: {
          competencyAreaId: "tal-og-algebra",
          skillsAreaId: "test",
          // @ts-expect-error - Testing runtime validation
          gradeRange: "10-12",
          difficulty: "A",
          isBinding: true,
          tags: [],
        },
      });

      expect(() => registry.register(template)).toThrow(
        TemplateValidationError,
      );
      expect(() => registry.register(template)).toThrow("Invalid grade range");
    });

    it("should validate difficulty level", () => {
      const template = createValidTemplate("test-1", {
        metadata: {
          competencyAreaId: "tal-og-algebra",
          skillsAreaId: "test",
          gradeRange: "0-3",
          // @ts-expect-error - Testing runtime validation
          difficulty: "D",
          isBinding: true,
          tags: [],
        },
      });

      expect(() => registry.register(template)).toThrow(
        TemplateValidationError,
      );
      expect(() => registry.register(template)).toThrow("Invalid difficulty");
    });

    it("should validate isBinding is boolean", () => {
      const template = createValidTemplate("test-1", {
        metadata: {
          competencyAreaId: "tal-og-algebra",
          skillsAreaId: "test",
          gradeRange: "0-3",
          difficulty: "A",
          // @ts-expect-error - Testing runtime validation
          isBinding: "yes",
          tags: [],
        },
      });

      expect(() => registry.register(template)).toThrow(
        TemplateValidationError,
      );
      expect(() => registry.register(template)).toThrow(
        "isBinding must be a boolean",
      );
    });

    it("should validate tags is an array", () => {
      const template = createValidTemplate("test-1", {
        metadata: {
          competencyAreaId: "tal-og-algebra",
          skillsAreaId: "test",
          gradeRange: "0-3",
          difficulty: "A",
          isBinding: true,
          // @ts-expect-error - Testing runtime validation
          tags: "not-an-array",
        },
      });

      expect(() => registry.register(template)).toThrow(
        TemplateValidationError,
      );
      expect(() => registry.register(template)).toThrow(
        "Tags must be an array",
      );
    });

    it("should validate generate is a function", () => {
      const template = createValidTemplate("test-1");
      // @ts-expect-error - Testing runtime validation
      template.generate = "not-a-function";

      expect(() => registry.register(template)).toThrow(
        TemplateValidationError,
      );
      expect(() => registry.register(template)).toThrow(
        "generate must be a function",
      );
    });

    it("should validate validate is a function", () => {
      const template = createValidTemplate("test-1");
      // @ts-expect-error - Testing runtime validation
      template.validate = "not-a-function";

      expect(() => registry.register(template)).toThrow(
        TemplateValidationError,
      );
      expect(() => registry.register(template)).toThrow(
        "validate must be a function",
      );
    });

    it("should validate hints is an array", () => {
      const template = createValidTemplate("test-1");
      // @ts-expect-error - Testing runtime validation
      template.hints = "not-an-array";

      expect(() => registry.register(template)).toThrow(
        TemplateValidationError,
      );
      expect(() => registry.register(template)).toThrow(
        "hints must be an array",
      );
    });

    it("should validate at least 4 hint levels", () => {
      const template = createValidTemplate("test-1", {
        hints: [() => "Hint 1", () => "Hint 2"],
      });

      expect(() => registry.register(template)).toThrow(
        TemplateValidationError,
      );
      expect(() => registry.register(template)).toThrow(
        "at least 4 hint levels",
      );
    });

    it("should validate each hint is a function", () => {
      const template = createValidTemplate("test-1", {
        // @ts-expect-error - Testing runtime validation
        hints: [() => "H1", () => "H2", "not-a-function", () => "H4"],
      });

      expect(() => registry.register(template)).toThrow(
        TemplateValidationError,
      );
      expect(() => registry.register(template)).toThrow("must be a function");
    });
  });

  describe("Template Unregistration", () => {
    it("should unregister an existing template", () => {
      const template = createValidTemplate("test-1");
      registry.register(template);

      expect(registry.has("test-1")).toBe(true);
      const result = registry.unregister("test-1");

      expect(result).toBe(true);
      expect(registry.has("test-1")).toBe(false);
      expect(registry.count()).toBe(0);
    });

    it("should return false when unregistering non-existent template", () => {
      const result = registry.unregister("non-existent");
      expect(result).toBe(false);
    });

    it("should remove template from all indexes", () => {
      const template = createValidTemplate("test-1", {
        metadata: {
          competencyAreaId: "tal-og-algebra",
          skillsAreaId: "tal-addition",
          gradeRange: "0-3",
          difficulty: "A",
          isBinding: true,
          tags: ["addition", "basic"],
        },
      });

      registry.register(template);
      registry.unregister("test-1");

      // Verify template is not found by any criteria
      const byCompetency = registry.find({
        competencyAreaId: "tal-og-algebra",
      });
      expect(byCompetency).not.toContain("test-1");

      const byTags = registry.find({ tags: ["addition"] });
      expect(byTags).not.toContain("test-1");
    });

    it("should remove template from recently used list", () => {
      const template = createValidTemplate("test-1");
      registry.register(template);
      registry.markUsed("test-1");

      expect(registry.getRecentlyUsed()).toContain("test-1");

      registry.unregister("test-1");

      expect(registry.getRecentlyUsed()).not.toContain("test-1");
    });
  });

  describe("Multi-Criteria Indexing", () => {
    beforeEach(() => {
      // Register templates with various metadata
      registry.register(
        createValidTemplate("tal-0-3-a", {
          metadata: {
            competencyAreaId: "tal-og-algebra",
            skillsAreaId: "tal-addition",
            gradeRange: "0-3",
            difficulty: "A",
            isBinding: true,
            tags: ["addition", "basic"],
          },
        }),
      );

      registry.register(
        createValidTemplate("tal-0-3-b", {
          metadata: {
            competencyAreaId: "tal-og-algebra",
            skillsAreaId: "tal-subtraction",
            gradeRange: "0-3",
            difficulty: "B",
            isBinding: true,
            tags: ["subtraction", "intermediate"],
          },
        }),
      );

      registry.register(
        createValidTemplate("tal-4-6-a", {
          metadata: {
            competencyAreaId: "tal-og-algebra",
            skillsAreaId: "tal-multiplication",
            gradeRange: "4-6",
            difficulty: "A",
            isBinding: false,
            tags: ["multiplication", "basic"],
          },
        }),
      );

      registry.register(
        createValidTemplate("geo-0-3-a", {
          metadata: {
            competencyAreaId: "geometri-og-maling",
            skillsAreaId: "geo-shapes",
            gradeRange: "0-3",
            difficulty: "A",
            isBinding: true,
            tags: ["shapes", "basic"],
          },
        }),
      );

      registry.register(
        createValidTemplate("geo-4-6-c", {
          metadata: {
            competencyAreaId: "geometri-og-maling",
            skillsAreaId: "geo-area",
            gradeRange: "4-6",
            difficulty: "C",
            isBinding: false,
            tags: ["area", "advanced"],
          },
        }),
      );
    });

    it("should find templates by competency area", () => {
      const results = registry.find({ competencyAreaId: "tal-og-algebra" });
      expect(results).toHaveLength(3);
      expect(results).toContain("tal-0-3-a");
      expect(results).toContain("tal-0-3-b");
      expect(results).toContain("tal-4-6-a");
    });

    it("should find templates by skills area", () => {
      const results = registry.find({ skillsAreaId: "tal-addition" });
      expect(results).toHaveLength(1);
      expect(results).toContain("tal-0-3-a");
    });

    it("should find templates by grade range", () => {
      const results = registry.find({ gradeRange: "0-3" });
      expect(results).toHaveLength(3);
      expect(results).toContain("tal-0-3-a");
      expect(results).toContain("tal-0-3-b");
      expect(results).toContain("geo-0-3-a");
    });

    it("should find templates by difficulty", () => {
      const results = registry.find({ difficulty: "A" });
      expect(results).toHaveLength(3);
      expect(results).toContain("tal-0-3-a");
      expect(results).toContain("tal-4-6-a");
      expect(results).toContain("geo-0-3-a");
    });

    it("should find templates by binding status", () => {
      const results = registry.find({ isBinding: true });
      expect(results).toHaveLength(3);
      expect(results).toContain("tal-0-3-a");
      expect(results).toContain("tal-0-3-b");
      expect(results).toContain("geo-0-3-a");
    });

    it("should find templates by single tag", () => {
      const results = registry.find({ tags: ["addition"] });
      expect(results).toHaveLength(1);
      expect(results).toContain("tal-0-3-a");
    });

    it("should find templates matching all specified tags", () => {
      const results = registry.find({ tags: ["basic", "addition"] });
      expect(results).toHaveLength(1);
      expect(results).toContain("tal-0-3-a");
    });

    it("should combine multiple criteria with AND logic", () => {
      const results = registry.find({
        competencyAreaId: "tal-og-algebra",
        gradeRange: "0-3",
        difficulty: "A",
      });
      expect(results).toHaveLength(1);
      expect(results).toContain("tal-0-3-a");
    });

    it("should return empty array when no templates match", () => {
      const results = registry.find({
        competencyAreaId: "statistik-og-sandsynlighed",
      });
      expect(results).toHaveLength(0);
    });

    it("should exclude specified template IDs", () => {
      const results = registry.find({
        competencyAreaId: "tal-og-algebra",
        excludeTemplateIds: ["tal-0-3-a", "tal-4-6-a"],
      });
      expect(results).toHaveLength(1);
      expect(results).toContain("tal-0-3-b");
      expect(results).not.toContain("tal-0-3-a");
      expect(results).not.toContain("tal-4-6-a");
    });

    it("should return all templates when no criteria specified", () => {
      const results = registry.find({});
      expect(results).toHaveLength(5);
    });
  });

  describe("Template Selection with Weighting", () => {
    beforeEach(() => {
      registry.register(
        createValidTemplate("binding-a", {
          metadata: {
            competencyAreaId: "tal-og-algebra",
            skillsAreaId: "test",
            gradeRange: "0-3",
            difficulty: "A",
            isBinding: true,
            tags: [],
          },
        }),
      );

      registry.register(
        createValidTemplate("non-binding-a", {
          metadata: {
            competencyAreaId: "tal-og-algebra",
            skillsAreaId: "test",
            gradeRange: "0-3",
            difficulty: "A",
            isBinding: false,
            tags: [],
          },
        }),
      );

      registry.register(
        createValidTemplate("difficulty-b", {
          metadata: {
            competencyAreaId: "tal-og-algebra",
            skillsAreaId: "test",
            gradeRange: "0-3",
            difficulty: "B",
            isBinding: true,
            tags: [],
          },
        }),
      );

      registry.register(
        createValidTemplate("difficulty-c", {
          metadata: {
            competencyAreaId: "tal-og-algebra",
            skillsAreaId: "test",
            gradeRange: "0-3",
            difficulty: "C",
            isBinding: true,
            tags: [],
          },
        }),
      );
    });

    it("should select a template matching criteria", () => {
      const selected = registry.select({
        competencyAreaId: "tal-og-algebra",
        gradeRange: "0-3",
      });

      expect(selected).toBeTruthy();
      expect([
        "binding-a",
        "non-binding-a",
        "difficulty-b",
        "difficulty-c",
      ]).toContain(selected);
    });

    it("should return undefined when no templates match criteria", () => {
      const selected = registry.select({
        competencyAreaId: "statistik-og-sandsynlighed",
      });

      expect(selected).toBeUndefined();
    });

    it("should return only candidate when only one matches", () => {
      const selected = registry.select({
        competencyAreaId: "tal-og-algebra",
        difficulty: "C",
      });

      expect(selected).toBe("difficulty-c");
    });

    it("should prefer binding content with binding bonus", () => {
      // Run selection multiple times to verify statistical preference
      const selections: string[] = [];
      for (let i = 0; i < 100; i++) {
        const selected = registry.select(
          { competencyAreaId: "tal-og-algebra", difficulty: "A" },
          { bindingBonus: 1.0 },
        );
        if (selected) selections.push(selected);
      }

      // Binding template should be selected more often
      const bindingCount = selections.filter((s) => s === "binding-a").length;
      const nonBindingCount = selections.filter(
        (s) => s === "non-binding-a",
      ).length;

      expect(bindingCount).toBeGreaterThan(nonBindingCount);
    });

    it("should apply recency penalty to recently used templates", () => {
      // Mark one template as recently used
      registry.markUsed("binding-a");
      registry.markUsed("binding-a");
      registry.markUsed("binding-a");

      // Run selection multiple times
      const selections: string[] = [];
      for (let i = 0; i < 100; i++) {
        const selected = registry.select(
          { competencyAreaId: "tal-og-algebra", difficulty: "A" },
          { recencyPenalty: 1.0 },
        );
        if (selected) selections.push(selected);
      }

      // Recently used template should be selected less often
      const recentCount = selections.filter((s) => s === "binding-a").length;
      const otherCount = selections.filter((s) => s === "non-binding-a").length;

      expect(otherCount).toBeGreaterThan(recentCount);
    });

    it("should adjust difficulty based on mastery level", () => {
      // Low mastery (0) should prefer difficulty A
      const lowMasterySelections: string[] = [];
      for (let i = 0; i < 50; i++) {
        const selected = registry.select(
          { competencyAreaId: "tal-og-algebra" },
          { masteryAdjustment: 0.5 },
          0,
        );
        if (selected) lowMasterySelections.push(selected);
      }

      const lowMasteryA = lowMasterySelections.filter((s) =>
        s.includes("a"),
      ).length;
      const lowMasteryC = lowMasterySelections.filter(
        (s) => s === "difficulty-c",
      ).length;

      expect(lowMasteryA).toBeGreaterThan(lowMasteryC);

      // High mastery (100) should prefer difficulty C
      const highMasterySelections: string[] = [];
      for (let i = 0; i < 50; i++) {
        const selected = registry.select(
          { competencyAreaId: "tal-og-algebra" },
          { masteryAdjustment: 0.5 },
          100,
        );
        if (selected) highMasterySelections.push(selected);
      }

      const highMasteryC = highMasterySelections.filter(
        (s) => s === "difficulty-c",
      ).length;
      const highMasteryA = highMasterySelections.filter((s) =>
        s.includes("-a"),
      ).length;

      expect(highMasteryC).toBeGreaterThan(highMasteryA);
    });
  });

  describe("Anti-Repetition Tracking", () => {
    beforeEach(() => {
      for (let i = 1; i <= 25; i++) {
        registry.register(createValidTemplate(`test-${i}`));
      }
    });

    it("should track recently used templates", () => {
      registry.markUsed("test-1");
      registry.markUsed("test-2");
      registry.markUsed("test-3");

      const recentlyUsed = registry.getRecentlyUsed();
      expect(recentlyUsed).toHaveLength(3);
      expect(recentlyUsed[0]).toBe("test-3"); // Most recent first
      expect(recentlyUsed[1]).toBe("test-2");
      expect(recentlyUsed[2]).toBe("test-1");
    });

    it("should maintain max recently used queue size", () => {
      // Mark more than maxRecentSize (20) templates as used
      for (let i = 1; i <= 25; i++) {
        registry.markUsed(`test-${i}`);
      }

      const recentlyUsed = registry.getRecentlyUsed();
      expect(recentlyUsed).toHaveLength(20);
      expect(recentlyUsed[0]).toBe("test-25"); // Most recent
      expect(recentlyUsed[19]).toBe("test-6"); // Oldest in queue
    });

    it("should update usage count", () => {
      registry.markUsed("test-1");
      registry.markUsed("test-1");
      registry.markUsed("test-1");

      const stats = registry.getUsageStats("test-1");
      expect(stats?.usageCount).toBe(3);
    });

    it("should update last used timestamp", () => {
      const before = Date.now();
      registry.markUsed("test-1");
      const after = Date.now();

      const stats = registry.getUsageStats("test-1");
      expect(stats?.lastUsed).toBeTruthy();
      expect(stats!.lastUsed!.getTime()).toBeGreaterThanOrEqual(before);
      expect(stats!.lastUsed!.getTime()).toBeLessThanOrEqual(after);
    });

    it("should clear recently used list", () => {
      registry.markUsed("test-1");
      registry.markUsed("test-2");
      registry.markUsed("test-3");

      expect(registry.getRecentlyUsed()).toHaveLength(3);

      registry.clearRecentlyUsed();

      expect(registry.getRecentlyUsed()).toHaveLength(0);
    });

    it("should return undefined stats for non-existent template", () => {
      const stats = registry.getUsageStats("non-existent");
      expect(stats).toBeUndefined();
    });

    it("should handle marking non-existent template as used", () => {
      // Should not throw error
      expect(() => registry.markUsed("non-existent")).not.toThrow();
    });
  });

  describe("Convenience Functions", () => {
    // Clean up singleton registry before each convenience function test
    beforeEach(() => {
      // Unregister all test templates from singleton registry
      // This is necessary because the singleton is shared across all test files
      const allTemplateIds = templateRegistry.find({});
      for (const id of allTemplateIds) {
        // Only unregister test templates (those starting with 'test-')
        if (id.startsWith("test-")) {
          templateRegistry.unregister(id);
        }
      }
      templateRegistry.clearRecentlyUsed();
    });

    it("should register template via convenience function", () => {
      const template = createValidTemplate("test-conv-1");
      registerTemplate(template);

      expect(templateRegistry.has("test-conv-1")).toBe(true);
    });

    it("should unregister template via convenience function", () => {
      const template = createValidTemplate("test-conv-1");
      registerTemplate(template);

      const result = unregisterTemplate("test-conv-1");
      expect(result).toBe(true);
      expect(templateRegistry.has("test-conv-1")).toBe(false);
    });

    it("should get template via convenience function", () => {
      const template = createValidTemplate("test-conv-1");
      registerTemplate(template);

      const retrieved = getTemplate("test-conv-1");
      expect(retrieved).toEqual(template);
    });

    it("should find templates via convenience function", () => {
      registerTemplate(
        createValidTemplate("test-conv-1", {
          metadata: {
            competencyAreaId: "tal-og-algebra",
            skillsAreaId: "test",
            gradeRange: "0-3",
            difficulty: "A",
            isBinding: true,
            tags: [],
          },
        }),
      );

      const results = findTemplates({ competencyAreaId: "tal-og-algebra" });
      expect(results).toContain("test-conv-1");
    });

    it("should select template via convenience function", () => {
      registerTemplate(
        createValidTemplate("test-conv-1", {
          metadata: {
            competencyAreaId: "tal-og-algebra",
            skillsAreaId: "test",
            gradeRange: "0-3",
            difficulty: "A",
            isBinding: true,
            tags: [],
          },
        }),
      );

      const selected = selectTemplate({ competencyAreaId: "tal-og-algebra" });
      expect(selected).toBe("test-conv-1");
    });

    it("should mark template used via convenience function", () => {
      registerTemplate(createValidTemplate("test-conv-1"));

      markTemplateUsed("test-conv-1");

      expect(templateRegistry.getRecentlyUsed()).toContain("test-conv-1");
    });
  });

  describe("Edge Cases", () => {
    it("should handle empty registry", () => {
      expect(registry.count()).toBe(0);
      expect(registry.find({})).toHaveLength(0);
      expect(registry.select({})).toBeUndefined();
    });

    it("should handle template with empty tags array", () => {
      const template = createValidTemplate("test-1", {
        metadata: {
          competencyAreaId: "tal-og-algebra",
          skillsAreaId: "test",
          gradeRange: "0-3",
          difficulty: "A",
          isBinding: true,
          tags: [],
        },
      });

      expect(() => registry.register(template)).not.toThrow();
    });

    it("should handle template with multiple tags", () => {
      const template = createValidTemplate("test-1", {
        metadata: {
          competencyAreaId: "tal-og-algebra",
          skillsAreaId: "test",
          gradeRange: "0-3",
          difficulty: "A",
          isBinding: true,
          tags: ["addition", "basic", "word-problem", "money"],
        },
      });

      registry.register(template);

      expect(registry.find({ tags: ["addition", "basic"] })).toContain(
        "test-1",
      );
      expect(registry.find({ tags: ["money"] })).toContain("test-1");
    });

    it("should handle all valid competency areas", () => {
      const areas: Array<
        | "matematiske-kompetencer"
        | "tal-og-algebra"
        | "geometri-og-maling"
        | "statistik-og-sandsynlighed"
      > = [
        "matematiske-kompetencer",
        "tal-og-algebra",
        "geometri-og-maling",
        "statistik-og-sandsynlighed",
      ];

      areas.forEach((area) => {
        const template = createValidTemplate(`test-${area}`, {
          metadata: {
            competencyAreaId: area,
            skillsAreaId: "test",
            gradeRange: "0-3",
            difficulty: "A",
            isBinding: true,
            tags: [],
          },
        });

        expect(() => registry.register(template)).not.toThrow();
      });

      expect(registry.count()).toBe(4);
    });

    it("should handle all valid grade ranges", () => {
      const grades: Array<"0-3" | "4-6" | "7-9"> = ["0-3", "4-6", "7-9"];

      grades.forEach((grade) => {
        const template = createValidTemplate(`test-${grade}`, {
          metadata: {
            competencyAreaId: "tal-og-algebra",
            skillsAreaId: "test",
            gradeRange: grade,
            difficulty: "A",
            isBinding: true,
            tags: [],
          },
        });

        expect(() => registry.register(template)).not.toThrow();
      });

      expect(registry.count()).toBe(3);
    });

    it("should handle all valid difficulty levels", () => {
      const difficulties: Array<"A" | "B" | "C"> = ["A", "B", "C"];

      difficulties.forEach((diff) => {
        const template = createValidTemplate(`test-${diff}`, {
          metadata: {
            competencyAreaId: "tal-og-algebra",
            skillsAreaId: "test",
            gradeRange: "0-3",
            difficulty: diff,
            isBinding: true,
            tags: [],
          },
        });

        expect(() => registry.register(template)).not.toThrow();
      });

      expect(registry.count()).toBe(3);
    });

    it("should handle selection with all zero weights", () => {
      registry.register(createValidTemplate("test-1"));
      registry.register(createValidTemplate("test-2"));

      // This shouldn't throw, should fall back to uniform random
      const selected = registry.select(
        {},
        {
          srsBaseline: 0,
          bindingBonus: 0,
          recencyPenalty: 0,
          masteryAdjustment: 0,
        },
      );

      expect(selected).toBeTruthy();
      expect(["test-1", "test-2"]).toContain(selected);
    });
  });
});
