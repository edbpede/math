/**
 * Place Value Identification Template Tests
 *
 * Comprehensive tests for place value identification exercise templates
 */

import { describe, it, expect, beforeEach } from "vitest";
import {
  placeValueIdentificationA,
  placeValueIdentificationB,
  placeValueIdentificationC,
} from "./place-value-identification";
import { TemplateRegistry } from "../../template-registry";
import { ParameterGenerator } from "../../parameter-generator";

describe("Place Value Identification Templates", () => {
  let registry: TemplateRegistry;

  beforeEach(() => {
    registry = new TemplateRegistry();
  });

  describe("placeValueIdentificationA (Difficulty A)", () => {
    it("should have correct metadata", () => {
      expect(placeValueIdentificationA.id).toBe(
        "tal-algebra-place-value-0-3-A",
      );
      expect(placeValueIdentificationA.metadata.competencyAreaId).toBe(
        "tal-og-algebra",
      );
      expect(placeValueIdentificationA.metadata.skillsAreaId).toBe("tal");
      expect(placeValueIdentificationA.metadata.gradeRange).toBe("0-3");
      expect(placeValueIdentificationA.metadata.difficulty).toBe("A");
      expect(placeValueIdentificationA.metadata.isBinding).toBe(true);
      expect(placeValueIdentificationA.metadata.tags).toContain("place-value");
    });

    it("should register successfully", () => {
      expect(() => registry.register(placeValueIdentificationA)).not.toThrow();
      expect(registry.has(placeValueIdentificationA.id)).toBe(true);
    });

    it("should generate valid parameters in range 10-20", () => {
      const generator = new ParameterGenerator({ seed: 42 });
      for (let i = 0; i < 20; i++) {
        const params = generator.generate(placeValueIdentificationA.parameters);
        const number = params.number as number;
        const position = params.position as string;

        expect(number).toBeGreaterThanOrEqual(10);
        expect(number).toBeLessThanOrEqual(20);
        expect(["ones", "tens"]).toContain(position);
      }
    });

    it("should correctly identify ones place value", () => {
      const params = { number: 17, position: "ones" };
      const result = placeValueIdentificationA.generate(params, "da-DK");

      expect(result.correctAnswer.value).toBe(7);
    });

    it("should correctly identify tens place value", () => {
      const params = { number: 17, position: "tens" };
      const result = placeValueIdentificationA.generate(params, "da-DK");

      expect(result.correctAnswer.value).toBe(10);
    });

    it("should validate correct answers", () => {
      const params = { number: 15, position: "ones" };
      const result = placeValueIdentificationA.generate(params, "da-DK");

      expect(
        placeValueIdentificationA.validate("5", result.correctAnswer).correct,
      ).toBe(true);
      expect(
        placeValueIdentificationA.validate("15", result.correctAnswer).correct,
      ).toBe(false);
    });

    it("should provide 4 hint levels", () => {
      expect(placeValueIdentificationA.hints).toHaveLength(4);

      const params = { number: 15, position: "ones" };
      const hint1 = placeValueIdentificationA.hints[0](params, "da-DK");
      const hint2 = placeValueIdentificationA.hints[1](params, "da-DK");
      const hint3 = placeValueIdentificationA.hints[2](params, "da-DK");
      const hint4 = placeValueIdentificationA.hints[3](params, "da-DK");

      expect(hint1).toBeTruthy();
      expect(hint2).toBeTruthy();
      expect(hint3).toBeTruthy();
      expect(hint4).toBeTruthy();
    });

    it("should generate hints in both Danish and English", () => {
      const params = { number: 15, position: "ones" };
      const hintDA = placeValueIdentificationA.hints[0](params, "da-DK");
      const hintEN = placeValueIdentificationA.hints[0](params, "en-US");

      expect(hintDA).not.toBe(hintEN);
      const hintDAText = typeof hintDA === "string" ? hintDA : hintDA.text;
      const hintENText = typeof hintEN === "string" ? hintEN : hintEN.text;
      expect(hintDAText.length).toBeGreaterThan(0);
      expect(hintENText.length).toBeGreaterThan(0);
    });

    it("should generate different questions for different positions", () => {
      const paramsOnes = { number: 15, position: "ones" };
      const paramsTens = { number: 15, position: "tens" };

      const resultOnes = placeValueIdentificationA.generate(
        paramsOnes,
        "da-DK",
      );
      const resultTens = placeValueIdentificationA.generate(
        paramsTens,
        "da-DK",
      );

      expect(resultOnes.correctAnswer.value).not.toBe(
        resultTens.correctAnswer.value,
      );
    });
  });

  describe("placeValueIdentificationB (Difficulty B)", () => {
    it("should have correct metadata", () => {
      expect(placeValueIdentificationB.id).toBe(
        "tal-algebra-place-value-0-3-B",
      );
      expect(placeValueIdentificationB.metadata.difficulty).toBe("B");
      expect(placeValueIdentificationB.metadata.tags).toContain("two-digit");
    });

    it("should register successfully", () => {
      expect(() => registry.register(placeValueIdentificationB)).not.toThrow();
      expect(registry.has(placeValueIdentificationB.id)).toBe(true);
    });

    it("should generate valid parameters in range 10-99", () => {
      const generator = new ParameterGenerator({ seed: 42 });
      for (let i = 0; i < 20; i++) {
        const params = generator.generate(placeValueIdentificationB.parameters);
        const number = params.number as number;
        const position = params.position as string;

        expect(number).toBeGreaterThanOrEqual(10);
        expect(number).toBeLessThanOrEqual(99);
        expect(["ones", "tens"]).toContain(position);
      }
    });

    it("should correctly identify ones place value in two-digit numbers", () => {
      const params = { number: 73, position: "ones" };
      const result = placeValueIdentificationB.generate(params, "da-DK");

      expect(result.correctAnswer.value).toBe(3);
    });

    it("should correctly identify tens place value in two-digit numbers", () => {
      const params = { number: 73, position: "tens" };
      const result = placeValueIdentificationB.generate(params, "da-DK");

      expect(result.correctAnswer.value).toBe(70);
    });

    it("should validate correct answers", () => {
      const params = { number: 84, position: "tens" };
      const result = placeValueIdentificationB.generate(params, "da-DK");

      expect(
        placeValueIdentificationB.validate("80", result.correctAnswer).correct,
      ).toBe(true);
      expect(
        placeValueIdentificationB.validate("8", result.correctAnswer).correct,
      ).toBe(false);
    });

    it("should provide 4 hint levels", () => {
      expect(placeValueIdentificationB.hints).toHaveLength(4);
    });

    it("should handle numbers with zero in ones place", () => {
      const params = { number: 30, position: "ones" };
      const result = placeValueIdentificationB.generate(params, "da-DK");

      expect(result.correctAnswer.value).toBe(0);
    });

    it("should handle numbers with zero in ones place for tens", () => {
      const params = { number: 30, position: "tens" };
      const result = placeValueIdentificationB.generate(params, "da-DK");

      expect(result.correctAnswer.value).toBe(30);
    });
  });

  describe("placeValueIdentificationC (Difficulty C)", () => {
    it("should have correct metadata", () => {
      expect(placeValueIdentificationC.id).toBe(
        "tal-algebra-place-value-0-3-C",
      );
      expect(placeValueIdentificationC.metadata.difficulty).toBe("C");
      expect(placeValueIdentificationC.metadata.tags).toContain("three-digit");
    });

    it("should register successfully", () => {
      expect(() => registry.register(placeValueIdentificationC)).not.toThrow();
      expect(registry.has(placeValueIdentificationC.id)).toBe(true);
    });

    it("should generate valid parameters in range 100-999", () => {
      const generator = new ParameterGenerator({ seed: 42 });
      for (let i = 0; i < 20; i++) {
        const params = generator.generate(placeValueIdentificationC.parameters);
        const number = params.number as number;
        const position = params.position as string;

        expect(number).toBeGreaterThanOrEqual(100);
        expect(number).toBeLessThanOrEqual(999);
        expect(["ones", "tens", "hundreds"]).toContain(position);
      }
    });

    it("should correctly identify ones place value in three-digit numbers", () => {
      const params = { number: 526, position: "ones" };
      const result = placeValueIdentificationC.generate(params, "da-DK");

      expect(result.correctAnswer.value).toBe(6);
    });

    it("should correctly identify tens place value in three-digit numbers", () => {
      const params = { number: 526, position: "tens" };
      const result = placeValueIdentificationC.generate(params, "da-DK");

      expect(result.correctAnswer.value).toBe(20);
    });

    it("should correctly identify hundreds place value in three-digit numbers", () => {
      const params = { number: 526, position: "hundreds" };
      const result = placeValueIdentificationC.generate(params, "da-DK");

      expect(result.correctAnswer.value).toBe(500);
    });

    it("should validate correct answers for ones", () => {
      const params = { number: 749, position: "ones" };
      const result = placeValueIdentificationC.generate(params, "da-DK");

      expect(
        placeValueIdentificationC.validate("9", result.correctAnswer).correct,
      ).toBe(true);
      expect(
        placeValueIdentificationC.validate("90", result.correctAnswer).correct,
      ).toBe(false);
    });

    it("should validate correct answers for tens", () => {
      const params = { number: 749, position: "tens" };
      const result = placeValueIdentificationC.generate(params, "da-DK");

      expect(
        placeValueIdentificationC.validate("40", result.correctAnswer).correct,
      ).toBe(true);
      expect(
        placeValueIdentificationC.validate("4", result.correctAnswer).correct,
      ).toBe(false);
    });

    it("should validate correct answers for hundreds", () => {
      const params = { number: 749, position: "hundreds" };
      const result = placeValueIdentificationC.generate(params, "da-DK");

      expect(
        placeValueIdentificationC.validate("700", result.correctAnswer).correct,
      ).toBe(true);
      expect(
        placeValueIdentificationC.validate("7", result.correctAnswer).correct,
      ).toBe(false);
    });

    it("should provide 4 hint levels", () => {
      expect(placeValueIdentificationC.hints).toHaveLength(4);
    });

    it("should handle numbers with zeros", () => {
      const params = { number: 305, position: "tens" };
      const result = placeValueIdentificationC.generate(params, "da-DK");

      expect(result.correctAnswer.value).toBe(0);
    });

    it("should provide hints mentioning hundreds, tens, and ones", () => {
      const params = { number: 526, position: "hundreds" };
      const hint1 = placeValueIdentificationC.hints[0](params, "da-DK");

      // Should mention place value positions
      const hint1Text = typeof hint1 === "string" ? hint1 : hint1.text;
      expect(hint1Text.toLowerCase()).toMatch(/hundred|tier|ener/);
    });
  });

  describe("Cross-template compatibility", () => {
    it("should not have duplicate template IDs", () => {
      const ids = [
        placeValueIdentificationA.id,
        placeValueIdentificationB.id,
        placeValueIdentificationC.id,
      ];
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(ids.length);
    });

    it("should all have the same competency and skills area", () => {
      const templates = [
        placeValueIdentificationA,
        placeValueIdentificationB,
        placeValueIdentificationC,
      ];
      templates.forEach((template) => {
        expect(template.metadata.competencyAreaId).toBe("tal-og-algebra");
        expect(template.metadata.skillsAreaId).toBe("tal");
        expect(template.metadata.gradeRange).toBe("0-3");
      });
    });

    it("should all be binding content", () => {
      const templates = [
        placeValueIdentificationA,
        placeValueIdentificationB,
        placeValueIdentificationC,
      ];
      templates.forEach((template) => {
        expect(template.metadata.isBinding).toBe(true);
      });
    });
  });
});
