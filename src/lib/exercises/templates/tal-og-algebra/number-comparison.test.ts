/**
 * Number Comparison Template Tests
 *
 * Comprehensive tests for number comparison exercise templates
 */

import { describe, it, expect, beforeEach } from "vitest";
import {
  numberComparisonA,
  numberComparisonB,
  numberComparisonC,
} from "./number-comparison";
import { TemplateRegistry } from "../../template-registry";
import { ParameterGenerator } from "../../parameter-generator";

describe("Number Comparison Templates", () => {
  let registry: TemplateRegistry;

  beforeEach(() => {
    registry = new TemplateRegistry();
  });

  describe("numberComparisonA (Difficulty A)", () => {
    it("should have correct metadata", () => {
      expect(numberComparisonA.id).toBe("tal-algebra-comparison-0-3-A");
      expect(numberComparisonA.metadata.competencyAreaId).toBe(
        "tal-og-algebra",
      );
      expect(numberComparisonA.metadata.skillsAreaId).toBe("tal");
      expect(numberComparisonA.metadata.gradeRange).toBe("0-3");
      expect(numberComparisonA.metadata.difficulty).toBe("A");
      expect(numberComparisonA.metadata.isBinding).toBe(true);
      expect(numberComparisonA.metadata.tags).toContain("comparison");
    });

    it("should register successfully", () => {
      expect(() => registry.register(numberComparisonA)).not.toThrow();
      expect(registry.has(numberComparisonA.id)).toBe(true);
    });

    it("should generate valid parameters in range 0-20", () => {
      const generator = new ParameterGenerator({ seed: 42 });
      for (let i = 0; i < 20; i++) {
        const params = generator.generate(numberComparisonA.parameters);
        const a = params.a as number;
        const b = params.b as number;

        expect(a).toBeGreaterThanOrEqual(0);
        expect(a).toBeLessThanOrEqual(20);
        expect(b).toBeGreaterThanOrEqual(0);
        expect(b).toBeLessThanOrEqual(20);
      }
    });

    it("should generate correct comparison operators", () => {
      const testCases = [
        { a: 10, b: 5, expected: ">" },
        { a: 3, b: 8, expected: "<" },
        { a: 7, b: 7, expected: "=" },
      ];

      testCases.forEach(({ a, b, expected }) => {
        const params = { a, b };
        const result = numberComparisonA.generate(params, "da-DK");
        expect(result.correctAnswer.value).toBe(expected);
      });
    });

    it("should validate correct answers with symbols", () => {
      const params = { a: 15, b: 8 };
      const result = numberComparisonA.generate(params, "da-DK");

      expect(
        numberComparisonA.validate(">", result.correctAnswer).correct,
      ).toBe(true);
      expect(
        numberComparisonA.validate("<", result.correctAnswer).correct,
      ).toBe(false);
      expect(
        numberComparisonA.validate("=", result.correctAnswer).correct,
      ).toBe(false);
    });

    it("should validate correct answers with Danish words", () => {
      const params = { a: 15, b: 8 };
      const result = numberComparisonA.generate(params, "da-DK");

      expect(
        numberComparisonA.validate("større end", result.correctAnswer).correct,
      ).toBe(true);
      expect(
        numberComparisonA.validate("større", result.correctAnswer).correct,
      ).toBe(true);
      expect(
        numberComparisonA.validate("mindre end", result.correctAnswer).correct,
      ).toBe(false);
    });

    it("should validate correct answers with English words", () => {
      const params = { a: 15, b: 8 };
      const result = numberComparisonA.generate(params, "en-US");

      expect(
        numberComparisonA.validate("greater than", result.correctAnswer)
          .correct,
      ).toBe(true);
      expect(
        numberComparisonA.validate("greater", result.correctAnswer).correct,
      ).toBe(true);
      expect(
        numberComparisonA.validate("less than", result.correctAnswer).correct,
      ).toBe(false);
    });

    it("should provide 4 hint levels", () => {
      expect(numberComparisonA.hints).toHaveLength(4);

      const params = { a: 15, b: 8 };
      const hint1 = numberComparisonA.hints[0](params, "da-DK");
      const hint2 = numberComparisonA.hints[1](params, "da-DK");
      const hint3 = numberComparisonA.hints[2](params, "da-DK");
      const hint4 = numberComparisonA.hints[3](params, "da-DK");

      expect(hint1).toBeTruthy();
      expect(hint2).toBeTruthy();
      expect(hint3).toBeTruthy();
      expect(hint4).toBeTruthy();
      expect(hint4).toContain(">"); // Final hint should contain answer
    });

    it("should generate hints in both Danish and English", () => {
      const params = { a: 15, b: 8 };
      const hintDA = numberComparisonA.hints[0](params, "da-DK");
      const hintEN = numberComparisonA.hints[0](params, "en-US");

      expect(hintDA).not.toBe(hintEN);
      const hintDAText = typeof hintDA === "string" ? hintDA : hintDA.text;
      const hintENText = typeof hintEN === "string" ? hintEN : hintEN.text;
      expect(hintDAText.length).toBeGreaterThan(0);
      expect(hintENText.length).toBeGreaterThan(0);
    });

    it("should handle equal numbers correctly", () => {
      const params = { a: 10, b: 10 };
      const result = numberComparisonA.generate(params, "da-DK");

      expect(result.correctAnswer.value).toBe("=");
      expect(
        numberComparisonA.validate("=", result.correctAnswer).correct,
      ).toBe(true);
      expect(
        numberComparisonA.validate("lig med", result.correctAnswer).correct,
      ).toBe(true);
    });
  });

  describe("numberComparisonB (Difficulty B)", () => {
    it("should have correct metadata", () => {
      expect(numberComparisonB.id).toBe("tal-algebra-comparison-0-3-B");
      expect(numberComparisonB.metadata.difficulty).toBe("B");
      expect(numberComparisonB.metadata.tags).toContain("two-digit");
    });

    it("should register successfully", () => {
      expect(() => registry.register(numberComparisonB)).not.toThrow();
      expect(registry.has(numberComparisonB.id)).toBe(true);
    });

    it("should generate valid parameters in range 0-100", () => {
      const generator = new ParameterGenerator({ seed: 42 });
      for (let i = 0; i < 20; i++) {
        const params = generator.generate(numberComparisonB.parameters);
        const a = params.a as number;
        const b = params.b as number;

        expect(a).toBeGreaterThanOrEqual(0);
        expect(a).toBeLessThanOrEqual(100);
        expect(b).toBeGreaterThanOrEqual(0);
        expect(b).toBeLessThanOrEqual(100);
      }
    });

    it("should generate correct comparison operators for two-digit numbers", () => {
      const testCases = [
        { a: 85, b: 47, expected: ">" },
        { a: 23, b: 91, expected: "<" },
        { a: 56, b: 56, expected: "=" },
      ];

      testCases.forEach(({ a, b, expected }) => {
        const params = { a, b };
        const result = numberComparisonB.generate(params, "da-DK");
        expect(result.correctAnswer.value).toBe(expected);
      });
    });

    it("should provide hints mentioning tens and ones", () => {
      const params = { a: 85, b: 47 };
      const hint2 = numberComparisonB.hints[1](params, "da-DK");

      // Should mention tens (tiere in Danish)
      const hint2Text = typeof hint2 === "string" ? hint2 : hint2.text;
      expect(hint2Text.toLowerCase()).toMatch(/tiere|tier/);
    });

    it("should validate correct answers", () => {
      const params = { a: 85, b: 47 };
      const result = numberComparisonB.generate(params, "da-DK");

      expect(
        numberComparisonB.validate(">", result.correctAnswer).correct,
      ).toBe(true);
      expect(
        numberComparisonB.validate("<", result.correctAnswer).correct,
      ).toBe(false);
    });

    it("should provide 4 hint levels", () => {
      expect(numberComparisonB.hints).toHaveLength(4);
    });
  });

  describe("numberComparisonC (Difficulty C)", () => {
    it("should have correct metadata", () => {
      expect(numberComparisonC.id).toBe("tal-algebra-comparison-0-3-C");
      expect(numberComparisonC.metadata.difficulty).toBe("C");
      expect(numberComparisonC.metadata.tags).toContain("three-digit");
    });

    it("should register successfully", () => {
      expect(() => registry.register(numberComparisonC)).not.toThrow();
      expect(registry.has(numberComparisonC.id)).toBe(true);
    });

    it("should generate valid parameters in range 0-1000", () => {
      const generator = new ParameterGenerator({ seed: 42 });
      for (let i = 0; i < 20; i++) {
        const params = generator.generate(numberComparisonC.parameters);
        const a = params.a as number;
        const b = params.b as number;

        expect(a).toBeGreaterThanOrEqual(0);
        expect(a).toBeLessThanOrEqual(1000);
        expect(b).toBeGreaterThanOrEqual(0);
        expect(b).toBeLessThanOrEqual(1000);
      }
    });

    it("should generate correct comparison operators for three-digit numbers", () => {
      const testCases = [
        { a: 785, b: 342, expected: ">" },
        { a: 156, b: 893, expected: "<" },
        { a: 500, b: 500, expected: "=" },
      ];

      testCases.forEach(({ a, b, expected }) => {
        const params = { a, b };
        const result = numberComparisonC.generate(params, "da-DK");
        expect(result.correctAnswer.value).toBe(expected);
      });
    });

    it("should provide hints mentioning hundreds, tens, and ones", () => {
      const params = { a: 785, b: 342 };
      const hint2 = numberComparisonC.hints[1](params, "da-DK");

      // Should mention hundreds (hundreder in Danish)
      const hint2Text = typeof hint2 === "string" ? hint2 : hint2.text;
      expect(hint2Text.toLowerCase()).toMatch(/hundreder|hundred/);
    });

    it("should validate correct answers", () => {
      const params = { a: 785, b: 342 };
      const result = numberComparisonC.generate(params, "da-DK");

      expect(
        numberComparisonC.validate(">", result.correctAnswer).correct,
      ).toBe(true);
      expect(
        numberComparisonC.validate("<", result.correctAnswer).correct,
      ).toBe(false);
    });

    it("should provide 4 hint levels", () => {
      expect(numberComparisonC.hints).toHaveLength(4);
    });

    it("should handle comparison when hundreds differ", () => {
      const params = { a: 785, b: 342 };
      const hint3 = numberComparisonC.hints[2](params, "da-DK");

      // Should show comparison logic
      expect(hint3).toContain("785");
      expect(hint3).toContain("342");
    });

    it("should handle comparison when only ones differ", () => {
      const params = { a: 557, b: 553 };
      const hint2 = numberComparisonC.hints[1](params, "da-DK");

      // Should mention that hundreds and tens are equal
      const hint2Text = typeof hint2 === "string" ? hint2 : hint2.text;
      expect(hint2Text.toLowerCase()).toMatch(/enerne|enere|ones/);
    });
  });

  describe("Cross-template compatibility", () => {
    it("should not have duplicate template IDs", () => {
      const ids = [
        numberComparisonA.id,
        numberComparisonB.id,
        numberComparisonC.id,
      ];
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(ids.length);
    });

    it("should all have the same competency and skills area", () => {
      const templates = [
        numberComparisonA,
        numberComparisonB,
        numberComparisonC,
      ];
      templates.forEach((template) => {
        expect(template.metadata.competencyAreaId).toBe("tal-og-algebra");
        expect(template.metadata.skillsAreaId).toBe("tal");
        expect(template.metadata.gradeRange).toBe("0-3");
      });
    });

    it("should all be binding content", () => {
      const templates = [
        numberComparisonA,
        numberComparisonB,
        numberComparisonC,
      ];
      templates.forEach((template) => {
        expect(template.metadata.isBinding).toBe(true);
      });
    });
  });
});
