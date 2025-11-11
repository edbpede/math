/**
 * Visual Aid Description Generator
 *
 * Generates descriptive alternative text for visual aids to support screen readers.
 * Provides detailed descriptions of number lines, diagrams, charts, and images.
 *
 * Requirements:
 * - 9.4: Alternative text for images and diagrams
 * - 9.4: Descriptive labels for mathematical visualizations
 *
 * @example
 * ```typescript
 * import { generateVisualAidDescription } from '@/lib/accessibility/visual-aid-descriptions'
 *
 * const description = generateVisualAidDescription('number-line', data, locale, translations)
 * // Returns: "Number line from 0 to 10 showing hops of plus 3, plus 2"
 * ```
 */

import type { VisualAid } from "@/lib/exercises/types";

/**
 * Number line data structure
 */
interface NumberLineData {
  start: number;
  end: number;
  hops: number[];
  range: [number, number];
}

/**
 * Diagram data structure
 */
interface DiagramData {
  diagramType: "place-value" | "fraction" | "generic";
  [key: string]: unknown;
}

/**
 * Place value diagram data
 */
interface PlaceValueData extends DiagramData {
  diagramType: "place-value";
  breakdown: {
    hundreds?: number;
    tens?: number;
    ones?: number;
  };
}

/**
 * Fraction diagram data
 */
interface FractionData extends DiagramData {
  diagramType: "fraction";
  numerator: number;
  denominator: number;
  shapeType: "circle" | "rectangle";
}

/**
 * Chart data structure
 */
interface ChartData {
  chartType: "bar" | "line" | "pie";
  [key: string]: unknown;
}

/**
 * Image data structure
 */
interface ImageData {
  src: string;
  alt: string;
  width?: number;
  height?: number;
}

/**
 * Translation function type
 */
type TranslationFunction = (
  key: string,
  params?: Record<string, string>,
) => string;

/**
 * Generate description for a number line
 */
function describeNumberLine(
  data: NumberLineData,
  _t: TranslationFunction,
): string {
  const [rangeStart, rangeEnd] = data.range;

  // Describe hops
  const hopDescriptions: string[] = [];
  for (const hop of data.hops) {
    if (hop > 0) {
      hopDescriptions.push(`${t("accessibility.math.operations.plus")} ${hop}`);
    } else if (hop < 0) {
      hopDescriptions.push(
        `${t("accessibility.math.operations.minus")} ${Math.abs(hop)}`,
      );
    }
  }

  const hopsText = hopDescriptions.join(", ");

  return t("accessibility.visualAids.numberLine", {
    start: rangeStart.toString(),
    end: rangeEnd.toString(),
    description: hopsText || "no operations",
  });
}

/**
 * Generate description for place value diagram
 */
function describePlaceValue(
  data: PlaceValueData,
  t: TranslationFunction,
): string {
  const { hundreds = 0, tens = 0, ones = 0 } = data.breakdown;

  return t("accessibility.visualAids.placeValue", {
    hundreds: hundreds.toString(),
    tens: tens.toString(),
    ones: ones.toString(),
  });
}

/**
 * Generate description for fraction diagram
 */
function describeFraction(data: FractionData, t: TranslationFunction): string {
  const key =
    data.shapeType === "circle"
      ? "accessibility.visualAids.fractionCircle"
      : "accessibility.visualAids.fractionRectangle";

  return t(key, {
    numerator: data.numerator.toString(),
    denominator: data.denominator.toString(),
  });
}

/**
 * Generate description for a diagram
 */
function describeDiagram(data: DiagramData, t: TranslationFunction): string {
  switch (data.diagramType) {
    case "place-value":
      return describePlaceValue(data as PlaceValueData, t);
    case "fraction":
      return describeFraction(data as FractionData, t);
    case "generic":
    default:
      // For generic diagrams, try to extract a description field
      const description = (data as unknown as { description?: string })
        .description;
      return t("accessibility.visualAids.genericDiagram", {
        description: description || "mathematical concept",
      });
  }
}

/**
 * Generate description for a chart
 */
function describeChart(data: ChartData, t: TranslationFunction): string {
  // Try to extract description from data
  const description =
    (data as unknown as { description?: string }).description ||
    "data visualization";

  return t("accessibility.visualAids.chart", {
    chartType: data.chartType,
    description,
  });
}

/**
 * Generate description for an image
 */
function describeImage(data: ImageData): string {
  // Images should already have alt text
  return data.alt;
}

/**
 * Generate a descriptive alternative text for a visual aid
 *
 * @param visualAid - The visual aid object
 * @param t - Translation function
 * @returns Descriptive text for screen readers
 */
export function generateVisualAidDescription(
  visualAid: VisualAid,
  t: TranslationFunction,
): string {
  try {
    switch (visualAid.type) {
      case "number-line":
        return describeNumberLine(visualAid.data as NumberLineData, t);
      case "diagram":
        return describeDiagram(visualAid.data as DiagramData, t);
      case "chart":
        return describeChart(visualAid.data as ChartData, t);
      case "image":
        return describeImage(visualAid.data as ImageData);
      default:
        // Fallback for unknown types
        return "Visual aid: mathematical diagram";
    }
  } catch (error) {
    console.error("Error generating visual aid description:", error);
    return "Visual aid: mathematical diagram";
  }
}

/**
 * Generate a long description for complex diagrams
 *
 * Provides detailed, narrative descriptions for complex visual aids
 * that require more context than a simple alt text.
 *
 * @param visualAid - The visual aid object
 * @param t - Translation function
 * @returns Long description for screen readers
 */
export function generateLongDescription(
  visualAid: VisualAid,
  t: TranslationFunction,
): string | null {
  // Only provide long descriptions for complex visualizations
  switch (visualAid.type) {
    case "number-line": {
      const data = visualAid.data as NumberLineData;
      const [rangeStart, rangeEnd] = data.range;

      let description = `This is a number line visualization spanning from ${rangeStart} to ${rangeEnd}. `;
      description += `It starts at ${data.start}. `;

      if (data.hops.length > 0) {
        description += "The following operations are shown: ";
        let currentPos = data.start;

        for (let i = 0; i < data.hops.length; i++) {
          const hop = data.hops[i];
          const nextPos = currentPos + hop;

          if (hop > 0) {
            description += `Move forward ${hop} from ${currentPos} to ${nextPos}. `;
          } else if (hop < 0) {
            description += `Move backward ${Math.abs(hop)} from ${currentPos} to ${nextPos}. `;
          }

          currentPos = nextPos;
        }

        description += `The final position is ${currentPos}.`;
      }

      return description;
    }

    case "diagram": {
      const data = visualAid.data as DiagramData;

      if (data.diagramType === "place-value") {
        const pvData = data as PlaceValueData;
        const { hundreds = 0, tens = 0, ones = 0 } = pvData.breakdown;
        const total = hundreds * 100 + tens * 10 + ones;

        return (
          `This place value diagram shows the number ${total} broken down into its components. ` +
          `It displays ${hundreds} hundred block${hundreds !== 1 ? "s" : ""}, ` +
          `${tens} tens block${tens !== 1 ? "s" : ""}, and ` +
          `${ones} ones block${ones !== 1 ? "s" : ""}.`
        );
      }

      if (data.diagramType === "fraction") {
        const fracData = data as FractionData;
        const { numerator, denominator, shapeType } = fracData;
        const shapeName = shapeType === "circle" ? "circle" : "rectangular bar";

        return (
          `This fraction diagram uses a ${shapeName} divided into ${denominator} equal parts. ` +
          `${numerator} of these parts are shaded to represent the fraction ${numerator}/${denominator}.`
        );
      }

      return null;
    }

    default:
      return null;
  }
}
