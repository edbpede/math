/**
 * Tal og Algebra Exercise Templates
 *
 * Exports and registration for all Tal og Algebra (Numbers and Algebra) templates
 * covering basic arithmetic operations (grades 0-3), fractions and decimals (grades 4-6).
 *
 * Competency Area: Tal og Algebra (Numbers and Algebra)
 * Skills Areas: Regning (Calculation), Brøker og procent (Fractions and percentages)
 */

import { registerTemplate } from "../../template-registry";
import { additionTemplates } from "./addition";
import { decimalPlaceValueTemplates } from "./decimal-place-value";
import { divisionTemplates } from "./division";
import { fractionDecimalConversionTemplates } from "./fraction-decimal-conversion";
import { fractionEquivalenceTemplates } from "./fraction-equivalence";
import { fractionRepresentationTemplates } from "./fraction-representation";
import { multiplicationTemplates } from "./multiplication";
import { numberComparisonTemplates } from "./number-comparison";
import { numberOrderingTemplates } from "./number-ordering";
import { placeValueIdentificationTemplates } from "./place-value-identification";
import { roundingTemplates } from "./rounding";
import { subtractionTemplates } from "./subtraction";

// Export all templates
export { additionTemplates } from "./addition";
export { decimalPlaceValueTemplates } from "./decimal-place-value";
export { divisionTemplates } from "./division";
export { fractionDecimalConversionTemplates } from "./fraction-decimal-conversion";
export { fractionEquivalenceTemplates } from "./fraction-equivalence";
export { fractionRepresentationTemplates } from "./fraction-representation";
export { multiplicationTemplates } from "./multiplication";
export { numberComparisonTemplates } from "./number-comparison";
export { numberOrderingTemplates } from "./number-ordering";
export { placeValueIdentificationTemplates } from "./place-value-identification";
export { roundingTemplates } from "./rounding";
export { subtractionTemplates } from "./subtraction";

// Combine all templates
export const talOgAlgebraTemplates = [
  ...additionTemplates,
  ...subtractionTemplates,
  ...multiplicationTemplates,
  ...divisionTemplates,
  ...numberComparisonTemplates,
  ...placeValueIdentificationTemplates,
  ...numberOrderingTemplates,
  ...roundingTemplates,
  ...fractionRepresentationTemplates,
  ...fractionEquivalenceTemplates,
  ...decimalPlaceValueTemplates,
  ...fractionDecimalConversionTemplates,
];

/**
 * Register all Tal og Algebra templates with the template registry
 *
 * This function should be called during application initialization
 * to make these templates available for exercise generation.
 */
export function registerTalOgAlgebraTemplates(): void {
  talOgAlgebraTemplates.forEach((template) => {
    registerTemplate(template);
  });
}
