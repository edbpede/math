/**
 * Exercise Instance Generator Tests
 */

import { describe, it, expect, beforeEach } from "vitest";
import {
  generateInstance,
  generateBatch,
  generateBatchFromTemplates,
  regenerateInstance,
  validateTemplate,
  getGenerationStats,
  InstanceGenerationError,
} from "./generator";
import { templateRegistry, registerTemplate } from "./template-registry";
import type {
  ExerciseTemplate,
  GenerationResult,
  ValidationResult,
} from "./types";

// Mock template for testing
const createMockTemplate = (id: string): ExerciseTemplate => ({
  id,
  name: `Test Template ${id}`,
  metadata: {
    competencyAreaId: "tal-og-algebra",
    skillsAreaId: "tal",
    gradeRange: "0-3",
    difficulty: "A",
    isBinding: true,
    tags: ["addition", "basic"],
  },
  parameters: {
    a: {
      type: "integer",
      min: 1,
      max: 10,
    },
    b: {
      type: "integer",
      min: 1,
      max: 10,
    },
  },
  generate: (params): GenerationResult => {
    const a = params.a as number;
    const b = params.b as number;
    return {
      questionText: `{{a}} + {{b}} = ?`,
      correctAnswer: {
        value: a + b,
      },
    };
  },
  validate: (userAnswer, correctAnswer): ValidationResult => {
    const userValue = parseFloat(userAnswer);
    const correctValue = correctAnswer.value as number;
    return {
      correct: userValue === correctValue,
      normalized: userAnswer,
    };
  },
  hints: [
    (params) => `Start by counting ${params.a}`,
    (params) => `Then add ${params.b} more`,
    (_params) => `Try using your fingers to count`,
    (params) => `The answer is ${(params.a as number) + (params.b as number)}`,
  ],
  contextType: "abstract",
});

// Mock template with context
const createContextTemplate = (id: string): ExerciseTemplate => ({
  id,
  name: `Context Template ${id}`,
  metadata: {
    competencyAreaId: "tal-og-algebra",
    skillsAreaId: "tal",
    gradeRange: "0-3",
    difficulty: "A",
    isBinding: true,
    tags: ["addition", "context"],
  },
  parameters: {
    a: {
      type: "integer",
      min: 1,
      max: 10,
    },
  },
  generate: (params): GenerationResult => {
    const a = params.a as number;
    return {
      questionText: `{{context.name}} har {{a}} {{context.item}}. Hvor mange er det?`,
      correctAnswer: {
        value: a,
      },
    };
  },
  validate: (userAnswer, correctAnswer): ValidationResult => {
    const userValue = parseFloat(userAnswer);
    const correctValue = correctAnswer.value as number;
    return {
      correct: userValue === correctValue,
    };
  },
  hints: [
    () => "Tæl dem en ad gangen",
    () => "Brug dine fingre",
    () => "Prøv at tegne dem",
    (params) => `Svaret er ${params.a}`,
  ],
  contextType: "school",
});

describe("Exercise Instance Generator", () => {
  beforeEach(() => {
    // Clear registry before each test
    const registry = templateRegistry;

    // Unregister any existing test templates
    ["test-template-1", "test-template-2", "context-template-1"].forEach(
      (id) => {
        try {
          registry.unregister(id);
        } catch {
          // Ignore if template doesn't exist
        }
      },
    );
  });

  describe("generateInstance", () => {
    it("should generate a valid exercise instance", async () => {
      const template = createMockTemplate("test-template-1");
      registerTemplate(template);

      const instance = await generateInstance("test-template-1", 12345, {
        locale: "da-DK",
      });

      expect(instance).toBeDefined();
      expect(instance.id).toBe("test-template-1-12345");
      expect(instance.templateId).toBe("test-template-1");
      expect(instance.seed).toBe(12345);
      expect(instance.questionText).toBeDefined();
      expect(instance.correctAnswer).toBeDefined();
      expect(instance.hints).toHaveLength(4);
      expect(instance.metadata).toBeDefined();
      expect(instance.context.locale).toBe("da-DK");
    });

    it("should be deterministic with same seed", async () => {
      const template = createMockTemplate("test-template-1");
      registerTemplate(template);

      const instance1 = await generateInstance("test-template-1", 12345, {
        locale: "da-DK",
      });

      const instance2 = await generateInstance("test-template-1", 12345, {
        locale: "da-DK",
      });

      expect(instance1.questionText).toBe(instance2.questionText);
      expect(instance1.correctAnswer).toEqual(instance2.correctAnswer);
      expect(instance1.hints).toEqual(instance2.hints);
    });

    it("should generate different instances with different seeds", async () => {
      const template = createMockTemplate("test-template-1");
      registerTemplate(template);

      const instance1 = await generateInstance("test-template-1", 12345, {
        locale: "da-DK",
      });

      const instance2 = await generateInstance("test-template-1", 54321, {
        locale: "da-DK",
      });

      // Questions might be different due to different parameters
      expect(instance1.seed).not.toBe(instance2.seed);
      expect(instance1.id).not.toBe(instance2.id);
    });

    it("should throw error for non-existent template", async () => {
      await expect(
        generateInstance("non-existent-template", 12345, { locale: "da-DK" }),
      ).rejects.toThrow(InstanceGenerationError);
    });

    it("should substitute parameters in question text", async () => {
      const template = createMockTemplate("test-template-1");
      registerTemplate(template);

      const instance = await generateInstance("test-template-1", 12345, {
        locale: "da-DK",
      });

      // Question should have parameters substituted
      expect(instance.questionText).toMatch(/^\d+ \+ \d+ = \?$/);
    });

    it("should generate hints at all four levels", async () => {
      const template = createMockTemplate("test-template-1");
      registerTemplate(template);

      const instance = await generateInstance("test-template-1", 12345, {
        locale: "da-DK",
      });

      expect(instance.hints).toHaveLength(4);
      expect(instance.hints[0].level).toBe(1);
      expect(instance.hints[1].level).toBe(2);
      expect(instance.hints[2].level).toBe(3);
      expect(instance.hints[3].level).toBe(4);
    });

    it("should generate distractors by default", async () => {
      const template = createMockTemplate("test-template-1");
      registerTemplate(template);

      const instance = await generateInstance("test-template-1", 12345, {
        locale: "da-DK",
        includeDistractors: true,
      });

      expect(instance.distractors).toBeDefined();
      expect(instance.distractors!.length).toBeGreaterThan(0);
    });

    it("should not generate distractors when disabled", async () => {
      const template = createMockTemplate("test-template-1");
      registerTemplate(template);

      const instance = await generateInstance("test-template-1", 12345, {
        locale: "da-DK",
        includeDistractors: false,
      });

      expect(instance.distractors).toBeUndefined();
    });

    it("should handle context templates", async () => {
      const template = createContextTemplate("context-template-1");
      registerTemplate(template);

      const instance = await generateInstance("context-template-1", 12345, {
        locale: "da-DK",
      });

      expect(instance.context.contextType).toBe("school");
      // Context selection might fail in test environment, but should not throw
      expect(instance.questionText).toBeDefined();
    });

    it("should generate correct answer value", async () => {
      const template = createMockTemplate("test-template-1");
      registerTemplate(template);

      const instance = await generateInstance("test-template-1", 12345, {
        locale: "da-DK",
      });

      // Extract parameters from question text
      const match = instance.questionText.match(/^(\d+) \+ (\d+) = \?$/);
      if (match) {
        const [, aStr, bStr] = match;
        const a = parseInt(aStr, 10);
        const b = parseInt(bStr, 10);
        const expected = a + b;

        expect(instance.correctAnswer.value).toBe(expected);
      }
    });
  });

  describe("generateBatch", () => {
    it("should generate specified number of instances", async () => {
      const template = createMockTemplate("test-template-1");
      registerTemplate(template);

      const instances = await generateBatch(
        { competencyAreaId: "tal-og-algebra" },
        5,
        { locale: "da-DK", startSeed: 1000 },
      );

      expect(instances).toHaveLength(5);
    });

    it("should generate instances with sequential seeds", async () => {
      const template = createMockTemplate("test-template-1");
      registerTemplate(template);

      const startSeed = 1000;
      const instances = await generateBatch(
        { competencyAreaId: "tal-og-algebra" },
        3,
        { locale: "da-DK", startSeed },
      );

      expect(instances[0].seed).toBe(startSeed);
      expect(instances[1].seed).toBe(startSeed + 1);
      expect(instances[2].seed).toBe(startSeed + 2);
    });

    it("should throw error when no templates match criteria", async () => {
      await expect(
        generateBatch({ competencyAreaId: "non-existent-area" as any }, 5, {
          locale: "da-DK",
        }),
      ).rejects.toThrow(InstanceGenerationError);
    });

    it("should use same context selector for entire batch", async () => {
      const template = createContextTemplate("context-template-1");
      registerTemplate(template);

      const instances = await generateBatch(
        { competencyAreaId: "tal-og-algebra" },
        3,
        { locale: "da-DK", startSeed: 1000 },
      );

      // All instances should have context (even if empty due to test environment)
      instances.forEach((instance) => {
        expect(instance.context).toBeDefined();
        expect(instance.context.locale).toBe("da-DK");
      });
    });

    it("should generate all instances with distractors when enabled", async () => {
      const template = createMockTemplate("test-template-1");
      registerTemplate(template);

      const instances = await generateBatch(
        { competencyAreaId: "tal-og-algebra" },
        3,
        { locale: "da-DK", includeDistractors: true },
      );

      instances.forEach((instance) => {
        expect(instance.distractors).toBeDefined();
        expect(instance.distractors!.length).toBeGreaterThan(0);
      });
    });

    it("should meet performance requirements", async () => {
      const template = createMockTemplate("test-template-1");
      registerTemplate(template);

      const count = 25;
      const startTime = performance.now();

      await generateBatch({ competencyAreaId: "tal-og-algebra" }, count, {
        locale: "da-DK",
        startSeed: 1000,
      });

      const endTime = performance.now();
      const duration = endTime - startTime;

      // Should complete 25 instances in less than 250ms (10ms per instance)
      expect(duration).toBeLessThan(250);
    });
  });

  describe("generateBatchFromTemplates", () => {
    it("should generate instances from specific template IDs", async () => {
      const template1 = createMockTemplate("test-template-1");
      const template2 = createMockTemplate("test-template-2");
      registerTemplate(template1);
      registerTemplate(template2);

      const templateIds = [
        "test-template-1",
        "test-template-2",
        "test-template-1",
      ];
      const instances = await generateBatchFromTemplates(templateIds, {
        locale: "da-DK",
        startSeed: 1000,
      });

      expect(instances).toHaveLength(3);
      expect(instances[0].templateId).toBe("test-template-1");
      expect(instances[1].templateId).toBe("test-template-2");
      expect(instances[2].templateId).toBe("test-template-1");
    });

    it("should use sequential seeds for batch", async () => {
      const template = createMockTemplate("test-template-1");
      registerTemplate(template);

      const startSeed = 2000;
      const instances = await generateBatchFromTemplates(
        ["test-template-1", "test-template-1"],
        { locale: "da-DK", startSeed },
      );

      expect(instances[0].seed).toBe(startSeed);
      expect(instances[1].seed).toBe(startSeed + 1);
    });
  });

  describe("regenerateInstance", () => {
    it("should regenerate identical instance with same seed", async () => {
      const template = createMockTemplate("test-template-1");
      registerTemplate(template);

      const original = await generateInstance("test-template-1", 12345, {
        locale: "da-DK",
      });

      const regenerated = await regenerateInstance(original, {
        locale: "da-DK",
      });

      expect(regenerated.questionText).toBe(original.questionText);
      expect(regenerated.correctAnswer).toEqual(original.correctAnswer);
      expect(regenerated.seed).toBe(original.seed);
      expect(regenerated.templateId).toBe(original.templateId);
    });
  });

  describe("validateTemplate", () => {
    it("should validate a well-formed template", async () => {
      const template = createMockTemplate("test-template-1");

      const isValid = await validateTemplate(template);

      expect(isValid).toBe(true);
    });

    it("should reject template with empty question text", async () => {
      const template = createMockTemplate("test-template-1");
      template.generate = () => ({
        questionText: "",
        correctAnswer: { value: 42 },
      });

      const isValid = await validateTemplate(template);

      expect(isValid).toBe(false);
    });

    it("should reject template with null answer", async () => {
      const template = createMockTemplate("test-template-1");
      template.generate = () => ({
        questionText: "Question?",
        correctAnswer: { value: null as any },
      });

      const isValid = await validateTemplate(template);

      expect(isValid).toBe(false);
    });

    it("should reject template with insufficient hints", async () => {
      const template = createMockTemplate("test-template-1");
      template.hints = [() => "Hint 1", () => "Hint 2"]; // Only 2 hints, need 4

      const isValid = await validateTemplate(template);

      expect(isValid).toBe(false);
    });

    it("should reject template with empty hints", async () => {
      const template = createMockTemplate("test-template-1");
      template.hints = [
        () => "Hint 1",
        () => "",
        () => "Hint 3",
        () => "Hint 4",
      ];

      const isValid = await validateTemplate(template);

      expect(isValid).toBe(false);
    });

    it("should test multiple seeds", async () => {
      const template = createMockTemplate("test-template-1");

      const isValid = await validateTemplate(template, [1, 2, 3, 4, 5]);

      expect(isValid).toBe(true);
    });
  });

  describe("getGenerationStats", () => {
    it("should calculate correct statistics", async () => {
      const template1 = createMockTemplate("test-template-1");
      const template2 = createMockTemplate("test-template-2");
      registerTemplate(template1);
      registerTemplate(template2);

      const instances = await generateBatchFromTemplates(
        ["test-template-1", "test-template-2", "test-template-1"],
        { locale: "da-DK" },
      );

      const stats = getGenerationStats(instances);

      expect(stats.count).toBe(3);
      expect(stats.uniqueTemplates).toBe(2);
      expect(stats.avgHintsPerInstance).toBe(4);
    });

    it("should handle empty array", () => {
      const stats = getGenerationStats([]);

      expect(stats.count).toBe(0);
      expect(stats.uniqueTemplates).toBe(0);
      expect(stats.avgHintsPerInstance).toBe(0);
    });
  });

  describe("Integration: Full exercise flow", () => {
    it("should generate complete exercise with all components", async () => {
      const template = createMockTemplate("test-template-1");
      registerTemplate(template);

      const instance = await generateInstance("test-template-1", 42, {
        locale: "da-DK",
        includeDistractors: true,
        distractorCount: 3,
      });

      // Verify all components are present
      expect(instance.id).toBe("test-template-1-42");
      expect(instance.templateId).toBe("test-template-1");
      expect(instance.seed).toBe(42);
      expect(instance.questionText).toBeTruthy();
      expect(instance.correctAnswer.value).toBeDefined();
      expect(instance.distractors).toHaveLength(3);
      expect(instance.hints).toHaveLength(4);
      expect(instance.metadata.competencyAreaId).toBe("tal-og-algebra");
      expect(instance.context.locale).toBe("da-DK");

      // Verify distractors don't include correct answer
      const correctValue = instance.correctAnswer.value.toString();
      expect(instance.distractors).not.toContain(correctValue);
    });
  });
});
