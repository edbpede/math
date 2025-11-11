/**
 * Rounding Template Tests
 *
 * Comprehensive tests for rounding exercise templates
 */

import { describe, it, expect, beforeEach } from "vitest";
import { roundingA, roundingB, roundingC } from "./rounding";
import { TemplateRegistry } from "../../template-registry";
import { ParameterGenerator } from "../../parameter-generator";

describe("Rounding Templates", () => {
  let registry: TemplateRegistry;

  beforeEach(() => {
    registry = new TemplateRegistry();
  });

  describe("roundingA (Difficulty A)", () => {
    it("should have correct metadata", () => {
      expect(roundingA.id).toBe("tal-algebra-rounding-0-3-A");
      expect(roundingA.metadata.competencyAreaId).toBe("tal-og-algebra");
      expect(roundingA.metadata.skillsAreaId).toBe("tal");
      expect(roundingA.metadata.gradeRange).toBe("0-3");
      expect(roundingA.metadata.difficulty).toBe("A");
      expect(roundingA.metadata.isBinding).toBe(true);
      expect(roundingA.metadata.tags).toContain("rounding");
    });

    it("should register successfully", () => {
      expect(() => registry.register(roundingA)).not.toThrow();
      expect(registry.has(roundingA.id)).toBe(true);
    });

    it("should generate valid parameters in range 10-99", () => {
      const generator = new ParameterGenerator({ seed: 42 });
      for (let i = 0; i < 20; i++) {
        const params = generator.generate(roundingA.parameters);
        const number = params.number as number;

        expect(number).toBeGreaterThanOrEqual(10);
        expect(number).toBeLessThanOrEqual(99);
      }
    });

    it("should round down when ones digit < 5", () => {
      const testCases = [
        { number: 23, expected: 20 },
        { number: 41, expected: 40 },
        { number: 64, expected: 60 },
      ];

      testCases.forEach(({ number, expected }) => {
        const params = { number };
        const result = roundingA.generate(params, "da-DK");
        expect(result.correctAnswer.value).toBe(expected);
      });
    });

    it("should round up when ones digit >= 5", () => {
      const testCases = [
        { number: 25, expected: 30 },
        { number: 47, expected: 50 },
        { number: 69, expected: 70 },
      ];

      testCases.forEach(({ number, expected }) => {
        const params = { number };
        const result = roundingA.generate(params, "da-DK");
        expect(result.correctAnswer.value).toBe(expected);
      });
    });

    it("should handle exact tens correctly", () => {
      const testCases = [
        { number: 20, expected: 20 },
        { number: 50, expected: 50 },
        { number: 90, expected: 90 },
      ];

      testCases.forEach(({ number, expected }) => {
        const params = { number };
        const result = roundingA.generate(params, "da-DK");
        expect(result.correctAnswer.value).toBe(expected);
      });
    });

    it("should validate correct answers", () => {
      const params = { number: 47 };
      const result = roundingA.generate(params, "da-DK");

      expect(roundingA.validate("50", result.correctAnswer).correct).toBe(true);
      expect(roundingA.validate("40", result.correctAnswer).correct).toBe(
        false,
      );
    });

    it("should provide 4 hint levels", () => {
      expect(roundingA.hints).toHaveLength(4);

      const params = { number: 47 };
      const hint1 = roundingA.hints[0](params, "da-DK");
      const hint2 = roundingA.hints[1](params, "da-DK");
      const hint3 = roundingA.hints[2](params, "da-DK");
      const hint4 = roundingA.hints[3](params, "da-DK");

      expect(hint1).toBeTruthy();
      expect(hint2).toBeTruthy();
      expect(hint3).toBeTruthy();
      expect(hint4).toBeTruthy();
      expect(hint4).toContain("50"); // Final hint should contain answer
    });

    it("should generate hints in both Danish and English", () => {
      const params = { number: 47 };
      const hintDA = roundingA.hints[0](params, "da-DK");
      const hintEN = roundingA.hints[0](params, "en-US");

      expect(hintDA).not.toBe(hintEN);
      const hintDAText = typeof hintDA === "string" ? hintDA : hintDA.text;
      const hintENText = typeof hintEN === "string" ? hintEN : hintEN.text;
      expect(hintDAText.length).toBeGreaterThan(0);
      expect(hintENText.length).toBeGreaterThan(0);
    });
  });

  describe("roundingB (Difficulty B)", () => {
    it("should have correct metadata", () => {
      expect(roundingB.id).toBe("tal-algebra-rounding-0-3-B");
      expect(roundingB.metadata.difficulty).toBe("B");
      expect(roundingB.metadata.tags).toContain("tens");
      expect(roundingB.metadata.tags).toContain("hundreds");
    });

    it("should register successfully", () => {
      expect(() => registry.register(roundingB)).not.toThrow();
      expect(registry.has(roundingB.id)).toBe(true);
    });

    it("should generate valid parameters in range 10-199", () => {
      const generator = new ParameterGenerator({ seed: 42 });
      for (let i = 0; i < 20; i++) {
        const params = generator.generate(roundingB.parameters);
        const number = params.number as number;
        const roundTo = params.roundTo as string;

        expect(number).toBeGreaterThanOrEqual(10);
        expect(number).toBeLessThanOrEqual(199);
        expect(["10", "100"]).toContain(roundTo);
      }
    });

    it("should round to nearest 10 when roundTo is 10", () => {
      const testCases = [
        { number: 73, roundTo: "10", expected: 70 },
        { number: 87, roundTo: "10", expected: 90 },
        { number: 125, roundTo: "10", expected: 130 },
      ];

      testCases.forEach(({ number, roundTo, expected }) => {
        const params = { number, roundTo };
        const result = roundingB.generate(params, "da-DK");
        expect(result.correctAnswer.value).toBe(expected);
      });
    });

    it("should round to nearest 100 when roundTo is 100", () => {
      const testCases = [
        { number: 130, roundTo: "100", expected: 100 },
        { number: 152, roundTo: "100", expected: 200 },
        { number: 175, roundTo: "100", expected: 200 },
      ];

      testCases.forEach(({ number, roundTo, expected }) => {
        const params = { number, roundTo };
        const result = roundingB.generate(params, "da-DK");
        expect(result.correctAnswer.value).toBe(expected);
      });
    });

    it("should validate correct answers", () => {
      const params = { number: 87, roundTo: "10" };
      const result = roundingB.generate(params, "da-DK");

      expect(roundingB.validate("90", result.correctAnswer).correct).toBe(true);
      expect(roundingB.validate("80", result.correctAnswer).correct).toBe(
        false,
      );
    });

    it("should provide 4 hint levels", () => {
      expect(roundingB.hints).toHaveLength(4);
    });

    it("should provide different hints for rounding to 10 vs 100", () => {
      const params10 = { number: 87, roundTo: "10" };
      const params100 = { number: 152, roundTo: "100" };

      const hint10 = roundingB.hints[1](params10, "da-DK");
      const hint100 = roundingB.hints[1](params100, "da-DK");

      expect(hint10).not.toBe(hint100);
    });
  });

  describe("roundingC (Difficulty C)", () => {
    it("should have correct metadata", () => {
      expect(roundingC.id).toBe("tal-algebra-rounding-0-3-C");
      expect(roundingC.metadata.difficulty).toBe("C");
      expect(roundingC.metadata.tags).toContain("hundreds");
      expect(roundingC.metadata.tags).toContain("three-digit");
    });

    it("should register successfully", () => {
      expect(() => registry.register(roundingC)).not.toThrow();
      expect(registry.has(roundingC.id)).toBe(true);
    });

    it("should generate valid parameters in range 100-999", () => {
      const generator = new ParameterGenerator({ seed: 42 });
      for (let i = 0; i < 20; i++) {
        const params = generator.generate(roundingC.parameters);
        const number = params.number as number;

        expect(number).toBeGreaterThanOrEqual(100);
        expect(number).toBeLessThanOrEqual(999);
      }
    });

    it("should round down when tens digit < 5", () => {
      const testCases = [
        { number: 234, expected: 200 },
        { number: 541, expected: 500 },
        { number: 843, expected: 800 },
      ];

      testCases.forEach(({ number, expected }) => {
        const params = { number };
        const result = roundingC.generate(params, "da-DK");
        expect(result.correctAnswer.value).toBe(expected);
      });
    });

    it("should round up when tens digit >= 5", () => {
      const testCases = [
        { number: 250, expected: 300 },
        { number: 567, expected: 600 },
        { number: 879, expected: 900 },
      ];

      testCases.forEach(({ number, expected }) => {
        const params = { number };
        const result = roundingC.generate(params, "da-DK");
        expect(result.correctAnswer.value).toBe(expected);
      });
    });

    it("should handle exact hundreds correctly", () => {
      const testCases = [
        { number: 200, expected: 200 },
        { number: 500, expected: 500 },
        { number: 900, expected: 900 },
      ];

      testCases.forEach(({ number, expected }) => {
        const params = { number };
        const result = roundingC.generate(params, "da-DK");
        expect(result.correctAnswer.value).toBe(expected);
      });
    });

    it("should validate correct answers", () => {
      const params = { number: 567 };
      const result = roundingC.generate(params, "da-DK");

      expect(roundingC.validate("600", result.correctAnswer).correct).toBe(
        true,
      );
      expect(roundingC.validate("500", result.correctAnswer).correct).toBe(
        false,
      );
    });

    it("should provide 4 hint levels", () => {
      expect(roundingC.hints).toHaveLength(4);
    });

    it("should provide hints mentioning tens digit and hundreds", () => {
      const params = { number: 567 };
      const hint2 = roundingC.hints[1](params, "da-DK");

      // Should mention relevant place value concepts
      expect(hint2.toLowerCase()).toMatch(/tier|ten/);
    });

    it("should handle edge case near 1000", () => {
      const params = { number: 999 };
      const result = roundingC.generate(params, "da-DK");

      expect(result.correctAnswer.value).toBe(1000);
    });
  });

  describe("Cross-template compatibility", () => {
    it("should not have duplicate template IDs", () => {
      const ids = [roundingA.id, roundingB.id, roundingC.id];
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(ids.length);
    });

    it("should all have the same competency and skills area", () => {
      const templates = [roundingA, roundingB, roundingC];
      templates.forEach((template) => {
        expect(template.metadata.competencyAreaId).toBe("tal-og-algebra");
        expect(template.metadata.skillsAreaId).toBe("tal");
        expect(template.metadata.gradeRange).toBe("0-3");
      });
    });

    it("should all be binding content", () => {
      const templates = [roundingA, roundingB, roundingC];
      templates.forEach((template) => {
        expect(template.metadata.isBinding).toBe(true);
      });
    });
  });

  describe("Rounding edge cases", () => {
    it("should handle rounding with ones digit exactly 5", () => {
      const params = { number: 45 };
      const result = roundingA.generate(params, "da-DK");

      // Should round up when exactly 5
      expect(result.correctAnswer.value).toBe(50);
    });

    it("should handle rounding with tens digit exactly 5", () => {
      const params = { number: 150 };
      const result = roundingC.generate(params, "da-DK");

      // Should round up when exactly 5
      expect(result.correctAnswer.value).toBe(200);
    });
  });
});
