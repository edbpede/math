/**
 * Fraction/Decimal Conversion Template Tests
 *
 * Comprehensive tests for fraction/decimal conversion exercise templates
 */

import { describe, it, expect, beforeEach } from "vitest";
import {
  fractionDecimalConversionA,
  fractionDecimalConversionB,
  fractionDecimalConversionC,
} from "./fraction-decimal-conversion";
import { TemplateRegistry } from "../../template-registry";
import { ParameterGenerator } from "../../parameter-generator";

describe("Fraction/Decimal Conversion Templates", () => {
  let registry: TemplateRegistry;

  beforeEach(() => {
    registry = new TemplateRegistry();
  });

  describe("fractionDecimalConversionA (Difficulty A)", () => {
    it("should have correct metadata", () => {
      expect(fractionDecimalConversionA.id).toBe(
        "tal-algebra-fraction-decimal-conversion-4-6-A",
      );
      expect(fractionDecimalConversionA.metadata.competencyAreaId).toBe(
        "tal-og-algebra",
      );
      expect(fractionDecimalConversionA.metadata.skillsAreaId).toBe(
        "broker-og-procent",
      );
      expect(fractionDecimalConversionA.metadata.gradeRange).toBe("4-6");
      expect(fractionDecimalConversionA.metadata.difficulty).toBe("A");
      expect(fractionDecimalConversionA.metadata.isBinding).toBe(true);
      expect(fractionDecimalConversionA.metadata.tags).toContain("conversion");
    });

    it("should register successfully", () => {
      expect(() => registry.register(fractionDecimalConversionA)).not.toThrow();
      expect(registry.has(fractionDecimalConversionA.id)).toBe(true);
    });

    it("should generate valid parameters", () => {
      const generator = new ParameterGenerator({ seed: 42 });
      for (let i = 0; i < 20; i++) {
        const params = generator.generate(
          fractionDecimalConversionA.parameters,
        );
        const choice = params.fractionChoice as number;

        expect(choice).toBeGreaterThanOrEqual(0);
        expect(choice).toBeLessThanOrEqual(6);
      }
    });

    it("should generate correct conversion for 1/2", () => {
      const params = { fractionChoice: 0 }; // 1/2
      const resultDA = fractionDecimalConversionA.generate(params, "da-DK");
      const resultEN = fractionDecimalConversionA.generate(params, "en-US");

      expect(resultDA.correctAnswer.value).toBe(0.5);
      expect(resultDA.correctAnswer.equivalents).toContain("0,5");
      expect(resultDA.correctAnswer.equivalents).toContain("1/2");
      expect(resultDA.questionText).toContain("1/2");

      expect(resultEN.correctAnswer.value).toBe(0.5);
      expect(resultEN.correctAnswer.equivalents).toContain("0.5");
    });

    it("should generate correct conversion for 1/4", () => {
      const params = { fractionChoice: 1 }; // 1/4
      const result = fractionDecimalConversionA.generate(params, "da-DK");

      expect(result.correctAnswer.value).toBe(0.25);
      expect(result.correctAnswer.equivalents).toContain("0,25");
      expect(result.correctAnswer.equivalents).toContain("1/4");
    });

    it("should generate correct conversion for 3/4", () => {
      const params = { fractionChoice: 2 }; // 3/4
      const result = fractionDecimalConversionA.generate(params, "da-DK");

      expect(result.correctAnswer.value).toBe(0.75);
      expect(result.correctAnswer.equivalents).toContain("0,75");
      expect(result.correctAnswer.equivalents).toContain("3/4");
    });

    it("should validate answers in multiple formats", () => {
      const correctAnswer = { value: 0.5, equivalents: ["0,5", "1/2"] };

      expect(
        fractionDecimalConversionA.validate("0.5", correctAnswer).correct,
      ).toBe(true);
      expect(
        fractionDecimalConversionA.validate("0,5", correctAnswer).correct,
      ).toBe(true);
      expect(
        fractionDecimalConversionA.validate("1/2", correctAnswer).correct,
      ).toBe(true);
      expect(
        fractionDecimalConversionA.validate("2/4", correctAnswer).correct,
      ).toBe(true); // Equivalent
      expect(
        fractionDecimalConversionA.validate("0.25", correctAnswer).correct,
      ).toBe(false);
    });

    it("should provide 4 hint levels", () => {
      expect(fractionDecimalConversionA.hints).toHaveLength(4);

      const params = { fractionChoice: 0 };
      const hint1 = fractionDecimalConversionA.hints[0](params, "da-DK");
      const hint2 = fractionDecimalConversionA.hints[1](params, "da-DK");
      const hint3 = fractionDecimalConversionA.hints[2](params, "da-DK");
      const hint4 = fractionDecimalConversionA.hints[3](params, "da-DK");

      expect(hint1).toBeTruthy();
      expect(hint2).toBeTruthy();
      expect(hint3).toBeTruthy();
      expect(hint4).toBeTruthy();
      expect(hint4).toContain("0,5");
    });

    it("should generate hints in both Danish and English", () => {
      const params = { fractionChoice: 3 };
      const hintDA = fractionDecimalConversionA.hints[0](params, "da-DK");
      const hintEN = fractionDecimalConversionA.hints[0](params, "en-US");

      expect(hintDA).not.toBe(hintEN);
      const hintDAText = typeof hintDA === "string" ? hintDA : hintDA.text;
      const hintENText = typeof hintEN === "string" ? hintEN : hintEN.text;
      expect(hintDAText.length).toBeGreaterThan(0);
      expect(hintENText.length).toBeGreaterThan(0);
    });
  });

  describe("fractionDecimalConversionB (Difficulty B)", () => {
    it("should have correct metadata", () => {
      expect(fractionDecimalConversionB.id).toBe(
        "tal-algebra-fraction-decimal-conversion-4-6-B",
      );
      expect(fractionDecimalConversionB.metadata.difficulty).toBe("B");
      expect(fractionDecimalConversionB.metadata.tags).toContain("tenths");
      expect(fractionDecimalConversionB.metadata.tags).toContain("hundredths");
    });

    it("should register successfully", () => {
      expect(() => registry.register(fractionDecimalConversionB)).not.toThrow();
      expect(registry.has(fractionDecimalConversionB.id)).toBe(true);
    });

    it("should generate valid parameters", () => {
      const generator = new ParameterGenerator({ seed: 123 });
      for (let i = 0; i < 30; i++) {
        const params = generator.generate(
          fractionDecimalConversionB.parameters,
        );
        const conversionType = params.conversionType as number;
        const numerator = params.numerator as number;
        const direction = params.direction as number;

        expect(conversionType).toBeGreaterThanOrEqual(0);
        expect(conversionType).toBeLessThanOrEqual(1);
        expect(direction).toBeGreaterThanOrEqual(0);
        expect(direction).toBeLessThanOrEqual(1);

        if (conversionType === 0) {
          // Tenths
          expect(numerator).toBeGreaterThanOrEqual(1);
          expect(numerator).toBeLessThanOrEqual(9);
        } else {
          // Hundredths
          expect(numerator).toBeGreaterThanOrEqual(1);
          expect(numerator).toBeLessThanOrEqual(99);
          expect(numerator % 10).not.toBe(0); // Not multiple of 10
        }
      }
    });

    it("should generate correct tenths to decimal conversion", () => {
      const params = { conversionType: 0, numerator: 3, direction: 0 };
      const result = fractionDecimalConversionB.generate(params, "da-DK");

      expect(result.correctAnswer.value).toBe("0,3");
      expect(result.correctAnswer.equivalents).toContain(0.3);
      expect(result.correctAnswer.equivalents).toContain("3/10");
      expect(result.questionText).toContain("3/10");
    });

    it("should generate correct hundredths to decimal conversion", () => {
      const params = { conversionType: 1, numerator: 7, direction: 0 };
      const result = fractionDecimalConversionB.generate(params, "da-DK");

      expect(result.correctAnswer.value).toBe("0,07");
      expect(result.correctAnswer.equivalents).toContain(0.07);
      expect(result.correctAnswer.equivalents).toContain("7/100");
      expect(result.questionText).toContain("7/100");
    });

    it("should generate correct decimal to fraction conversion", () => {
      const params = { conversionType: 0, numerator: 5, direction: 1 };
      const result = fractionDecimalConversionB.generate(params, "da-DK");

      expect(result.correctAnswer.value).toBe("5/10");
      expect(result.correctAnswer.equivalents).toContain(0.5);
      expect(result.correctAnswer.equivalents).toContain("0,5");
      expect(result.questionText).toContain("0,5");
    });

    it("should handle two-digit hundredths correctly", () => {
      const params = { conversionType: 1, numerator: 37, direction: 0 };
      const result = fractionDecimalConversionB.generate(params, "da-DK");

      expect(result.correctAnswer.value).toBe("0,37");
      expect(result.correctAnswer.equivalents).toContain(0.37);
      expect(result.correctAnswer.equivalents).toContain("37/100");
    });

    it("should validate bidirectional conversions", () => {
      const correctAnswer = { value: "0,3", equivalents: [0.3, "3/10", "0,3"] };

      expect(
        fractionDecimalConversionB.validate("0.3", correctAnswer).correct,
      ).toBe(true);
      expect(
        fractionDecimalConversionB.validate("0,3", correctAnswer).correct,
      ).toBe(true);
      expect(
        fractionDecimalConversionB.validate("3/10", correctAnswer).correct,
      ).toBe(true);
      expect(
        fractionDecimalConversionB.validate("6/20", correctAnswer).correct,
      ).toBe(true); // Equivalent
    });

    it("should provide 4 hint levels", () => {
      expect(fractionDecimalConversionB.hints).toHaveLength(4);
    });
  });

  describe("fractionDecimalConversionC (Difficulty C)", () => {
    it("should have correct metadata", () => {
      expect(fractionDecimalConversionC.id).toBe(
        "tal-algebra-fraction-decimal-conversion-4-6-C",
      );
      expect(fractionDecimalConversionC.metadata.difficulty).toBe("C");
      expect(fractionDecimalConversionC.metadata.tags).toContain("advanced");
    });

    it("should register successfully", () => {
      expect(() => registry.register(fractionDecimalConversionC)).not.toThrow();
      expect(registry.has(fractionDecimalConversionC.id)).toBe(true);
    });

    it("should generate valid parameters", () => {
      const generator = new ParameterGenerator({ seed: 456 });
      for (let i = 0; i < 30; i++) {
        const params = generator.generate(
          fractionDecimalConversionC.parameters,
        );
        const denominator = params.baseDenominator as number;
        const numerator = params.numerator as number;

        expect([4, 5, 8, 20, 25]).toContain(denominator);
        expect(numerator).toBeGreaterThanOrEqual(1);
        expect(numerator).toBeLessThanOrEqual(24);
        expect(numerator).toBeLessThan(denominator);
      }
    });

    it("should convert fractions with denominator 4", () => {
      const params = { baseDenominator: 4, numerator: 3 };
      const result = fractionDecimalConversionC.generate(params, "da-DK");

      expect(result.correctAnswer.value).toBe(0.75);
      expect(result.correctAnswer.equivalents).toContain("0,75");
      expect(result.correctAnswer.equivalents).toContain("3/4");
    });

    it("should convert fractions with denominator 5", () => {
      const params = { baseDenominator: 5, numerator: 2 };
      const result = fractionDecimalConversionC.generate(params, "da-DK");

      expect(result.correctAnswer.value).toBe(0.4);
      expect(result.correctAnswer.equivalents).toContain("0,4");
      expect(result.correctAnswer.equivalents).toContain("2/5");
    });

    it("should convert fractions with denominator 8", () => {
      const params = { baseDenominator: 8, numerator: 5 };
      const result = fractionDecimalConversionC.generate(params, "da-DK");

      expect(result.correctAnswer.value).toBe(0.625);
      expect(result.correctAnswer.equivalents).toContain("0,625");
      expect(result.correctAnswer.equivalents).toContain("5/8");
    });

    it("should convert fractions with denominator 20", () => {
      const params = { baseDenominator: 20, numerator: 7 };
      const result = fractionDecimalConversionC.generate(params, "da-DK");

      expect(result.correctAnswer.value).toBe(0.35);
      expect(result.correctAnswer.equivalents).toContain("0,35");
      expect(result.correctAnswer.equivalents).toContain("7/20");
    });

    it("should convert fractions with denominator 25", () => {
      const params = { baseDenominator: 25, numerator: 3 };
      const result = fractionDecimalConversionC.generate(params, "da-DK");

      expect(result.correctAnswer.value).toBe(0.12);
      expect(result.correctAnswer.equivalents).toContain("0,12");
      expect(result.correctAnswer.equivalents).toContain("3/25");
    });

    it("should validate complex conversions", () => {
      const correctAnswer = { value: 0.75, equivalents: ["0,75", "3/4"] };

      expect(
        fractionDecimalConversionC.validate("0.75", correctAnswer).correct,
      ).toBe(true);
      expect(
        fractionDecimalConversionC.validate("0,75", correctAnswer).correct,
      ).toBe(true);
      expect(
        fractionDecimalConversionC.validate("3/4", correctAnswer).correct,
      ).toBe(true);
      expect(
        fractionDecimalConversionC.validate("6/8", correctAnswer).correct,
      ).toBe(true); // Equivalent
      expect(
        fractionDecimalConversionC.validate("0.5", correctAnswer).correct,
      ).toBe(false);
    });

    it("should provide 4 hint levels", () => {
      expect(fractionDecimalConversionC.hints).toHaveLength(4);

      const params = { baseDenominator: 4, numerator: 1 };
      const hint4 = fractionDecimalConversionC.hints[3](params, "da-DK");
      expect(hint4).toContain("0,25");
    });

    it("should provide appropriate hints for each denominator", () => {
      const params4 = { baseDenominator: 4, numerator: 1 };
      const hint4 = fractionDecimalConversionC.hints[1](params4, "da-DK");
      expect(hint4).toContain("25");

      const params5 = { baseDenominator: 5, numerator: 1 };
      const hint5 = fractionDecimalConversionC.hints[1](params5, "da-DK");
      expect(hint5).toContain("2");

      const params8 = { baseDenominator: 8, numerator: 1 };
      const hint8 = fractionDecimalConversionC.hints[1](params8, "da-DK");
      expect(hint8).toContain("125");
    });
  });

  describe("Template Determinism", () => {
    it("should generate same result with same seed", () => {
      const generator1 = new ParameterGenerator({ seed: 999 });
      const params1 = generator1.generate(
        fractionDecimalConversionA.parameters,
      );
      const result1 = fractionDecimalConversionA.generate(params1, "da-DK");

      const generator2 = new ParameterGenerator({ seed: 999 });
      const params2 = generator2.generate(
        fractionDecimalConversionA.parameters,
      );
      const result2 = fractionDecimalConversionA.generate(params2, "da-DK");

      expect(params1).toEqual(params2);
      expect(result1.correctAnswer.value).toBe(result2.correctAnswer.value);
    });
  });
});
