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
import { registerTemplate } from '../../template-registry';

// Export all templates
export { additionTemplates } from './addition';
export { subtractionTemplates } from './subtraction';
export { multiplicationTemplates } from './multiplication';
export { divisionTemplates } from './division';

// Combine all templates
export const talOgAlgebraTemplates = [
  ...additionTemplates,
  ...subtractionTemplates,
  ...multiplicationTemplates,
  ...divisionTemplates,
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

