/**
 * Tal og Algebra Exercise Templates
 * 
 * Exports and registration for all Tal og Algebra (Numbers and Algebra) templates
 * covering basic arithmetic operations for grades 0-3.
 * 
 * Competency Area: Tal og Algebra (Numbers and Algebra)
 * Skills Area: Regning (Calculation and number patterns)
 */

import { additionTemplates } from './addition';
import { subtractionTemplates } from './subtraction';
import { multiplicationTemplates } from './multiplication';
import { divisionTemplates } from './division';
import { numberComparisonTemplates } from './number-comparison';
import { placeValueIdentificationTemplates } from './place-value-identification';
import { numberOrderingTemplates } from './number-ordering';
import { roundingTemplates } from './rounding';
import { registerTemplate } from '../../template-registry';

// Export all templates
export { additionTemplates } from './addition';
export { subtractionTemplates } from './subtraction';
export { multiplicationTemplates } from './multiplication';
export { divisionTemplates } from './division';
export { numberComparisonTemplates } from './number-comparison';
export { placeValueIdentificationTemplates } from './place-value-identification';
export { numberOrderingTemplates } from './number-ordering';
export { roundingTemplates } from './rounding';

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
];

/**
 * Register all Tal og Algebra templates with the template registry
 * 
 * This function should be called during application initialization
 * to make these templates available for exercise generation.
 */
export function registerTalOgAlgebraTemplates(): void {
  talOgAlgebraTemplates.forEach(template => {
    registerTemplate(template);
  });
}

