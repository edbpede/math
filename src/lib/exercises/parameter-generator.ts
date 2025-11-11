/**
 * Parameter Generation System
 *
 * Provides constraint satisfaction engine for deterministic parameter generation
 * from exercise templates with support for dependent parameters and validation.
 *
 * Requirements:
 * - 3.3: Apply constraint satisfaction to ensure valid, age-appropriate parameters
 * - 11.2: Support parameter domains, relationships, and constraint specifications
 */

import type {
  ParameterConstraints,
  ParameterConstraint,
  ParameterType,
} from "./types";

/**
 * Error thrown when parameter generation fails
 */
export class ParameterGenerationError extends Error {
  constructor(
    message: string,
    public parameterName: string,
    public cause?: unknown,
  ) {
    super(`Parameter generation failed for '${parameterName}': ${message}`);
    this.name = "ParameterGenerationError";
  }
}

/**
 * Error thrown when constraint validation fails
 */
export class ConstraintViolationError extends Error {
  constructor(
    message: string,
    public parameterName: string,
    public value: unknown,
  ) {
    super(
      `Constraint violation for '${parameterName}' (value: ${value}): ${message}`,
    );
    this.name = "ConstraintViolationError";
  }
}

/**
 * Configuration for parameter generation
 */
export interface GeneratorConfig {
  maxAttempts?: number; // Maximum attempts for constraint satisfaction (default: 100)
  seed?: number; // Random seed for deterministic generation
}

const DEFAULT_CONFIG: Required<GeneratorConfig> = {
  maxAttempts: 100,
  seed: Date.now(),
};

/**
 * Seeded Pseudo-Random Number Generator (PRNG)
 *
 * Uses Mulberry32 algorithm for fast, deterministic random number generation.
 * Provides full cycle length and good statistical properties.
 *
 * Reference: https://github.com/bryc/code/blob/master/jshash/PRNGs.md
 */
export class SeededRandom {
  private state: number;

  constructor(seed: number) {
    // Ensure seed is a 32-bit unsigned integer
    this.state = seed >>> 0 || 1;
  }

  /**
   * Generate next random number in range [0, 1)
   *
   * @returns Random float between 0 (inclusive) and 1 (exclusive)
   */
  next(): number {
    // Mulberry32 algorithm
    let t = (this.state += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

  /**
   * Generate random integer in range [min, max] (inclusive)
   *
   * @param min - Minimum value (inclusive)
   * @param max - Maximum value (inclusive)
   * @returns Random integer between min and max
   */
  nextInt(min: number, max: number): number {
    if (!Number.isInteger(min) || !Number.isInteger(max)) {
      throw new Error("nextInt requires integer bounds");
    }
    if (min > max) {
      throw new Error("min must be less than or equal to max");
    }
    return Math.floor(this.next() * (max - min + 1)) + min;
  }

  /**
   * Generate random float in range [min, max)
   *
   * @param min - Minimum value (inclusive)
   * @param max - Maximum value (exclusive)
   * @returns Random float between min and max
   */
  nextFloat(min: number, max: number): number {
    if (min >= max) {
      throw new Error("min must be less than max");
    }
    return this.next() * (max - min) + min;
  }

  /**
   * Select random element from array
   *
   * @param array - Array to select from
   * @returns Random element from the array
   */
  choice<T>(array: T[]): T {
    if (array.length === 0) {
      throw new Error("Cannot select from empty array");
    }
    return array[Math.floor(this.next() * array.length)];
  }

  /**
   * Shuffle array using Fisher-Yates algorithm
   *
   * @param array - Array to shuffle
   * @returns Shuffled copy of the array
   */
  shuffle<T>(array: T[]): T[] {
    const result = [...array];
    for (let i = result.length - 1; i > 0; i--) {
      const j = Math.floor(this.next() * (i + 1));
      [result[i], result[j]] = [result[j], result[i]];
    }
    return result;
  }
}

/**
 * Parameter Generator
 *
 * Generates parameter values from constraints using constraint satisfaction
 * with support for dependent parameters and custom validation functions.
 */
export class ParameterGenerator {
  private rng: SeededRandom;
  private config: Required<GeneratorConfig>;

  constructor(config: GeneratorConfig = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.rng = new SeededRandom(this.config.seed);
  }

  /**
   * Generate parameters satisfying all constraints
   *
   * @param constraints - Parameter constraints specification
   * @returns Generated parameter values
   * @throws {ParameterGenerationError} If generation fails after max attempts
   */
  generate(constraints: ParameterConstraints): Record<string, unknown> {
    // Build dependency graph to determine generation order
    const generationOrder = this.computeGenerationOrder(constraints);

    // Generate parameters in dependency order with retry logic
    for (let attempt = 0; attempt < this.config.maxAttempts; attempt++) {
      try {
        const params: Record<string, unknown> = {};

        for (const paramName of generationOrder) {
          const constraint = constraints[paramName];
          const value = this.generateParameter(paramName, constraint, params);
          params[paramName] = value;
        }

        // Validate all parameters together (for cross-parameter constraints)
        this.validateParameters(params, constraints);

        return params;
      } catch (error) {
        // If we're out of attempts, throw the error
        if (attempt === this.config.maxAttempts - 1) {
          if (error instanceof ConstraintViolationError) {
            throw new ParameterGenerationError(
              `Failed to generate valid parameters after ${this.config.maxAttempts} attempts`,
              error.parameterName,
              error,
            );
          }
          throw error;
        }
        // Otherwise, retry with a different random state
        continue;
      }
    }

    throw new ParameterGenerationError(
      `Failed to generate parameters after ${this.config.maxAttempts} attempts`,
      "unknown",
    );
  }

  /**
   * Validate parameter value against constraint
   *
   * @param paramName - Parameter name
   * @param value - Parameter value to validate
   * @param constraint - Constraint specification
   * @param params - All generated parameters (for dependent validation)
   * @throws {ConstraintViolationError} If validation fails
   */
  validate(
    paramName: string,
    value: unknown,
    constraint: ParameterConstraint,
    params: Record<string, unknown> = {},
  ): void {
    // Type validation
    if (!this.validateType(value, constraint.type)) {
      throw new ConstraintViolationError(
        `Expected type ${constraint.type} but got ${typeof value}`,
        paramName,
        value,
      );
    }

    // Range validation for numeric types
    if (constraint.type === "integer" || constraint.type === "decimal") {
      const numValue = value as number;

      if (constraint.min !== undefined && numValue < constraint.min) {
        throw new ConstraintViolationError(
          `Value ${numValue} is less than minimum ${constraint.min}`,
          paramName,
          value,
        );
      }

      if (constraint.max !== undefined && numValue > constraint.max) {
        throw new ConstraintViolationError(
          `Value ${numValue} is greater than maximum ${constraint.max}`,
          paramName,
          value,
        );
      }

      // Step validation
      if (constraint.step !== undefined && constraint.min !== undefined) {
        const steps = (numValue - constraint.min) / constraint.step;
        if (!Number.isInteger(steps)) {
          throw new ConstraintViolationError(
            `Value ${numValue} does not match step ${constraint.step} from minimum ${constraint.min}`,
            paramName,
            value,
          );
        }
      }
    }

    // Options validation
    if (constraint.options && constraint.options.length > 0) {
      if (!constraint.options.includes(value)) {
        throw new ConstraintViolationError(
          `Value is not in allowed options: ${JSON.stringify(constraint.options)}`,
          paramName,
          value,
        );
      }
    }

    // Custom constraint function
    if (constraint.constraint) {
      const testParams = { ...params, [paramName]: value };
      if (!constraint.constraint(testParams)) {
        throw new ConstraintViolationError(
          "Custom constraint function returned false",
          paramName,
          value,
        );
      }
    }
  }

  /**
   * Get the current random number generator state
   *
   * Useful for debugging and testing deterministic generation.
   *
   * @returns The current RNG instance
   */
  getRNG(): SeededRandom {
    return this.rng;
  }

  /**
   * Reset the random number generator with a new seed
   *
   * @param seed - New seed value
   */
  resetSeed(seed: number): void {
    this.rng = new SeededRandom(seed);
    this.config.seed = seed;
  }

  /**
   * Generate a single parameter value
   *
   * @param paramName - Parameter name
   * @param constraint - Constraint specification
   * @param existingParams - Already generated parameters (for dependencies)
   * @returns Generated parameter value
   * @throws {ParameterGenerationError} If generation fails
   */
  private generateParameter(
    paramName: string,
    constraint: ParameterConstraint,
    _existingParams: Record<string, unknown>,
  ): unknown {
    try {
      // If options are provided, select randomly from options
      if (constraint.options && constraint.options.length > 0) {
        return this.rng.choice(constraint.options);
      }

      // Generate based on type
      switch (constraint.type) {
        case "integer":
          return this.generateInteger(constraint);

        case "decimal":
          return this.generateDecimal(constraint);

        case "fraction":
          return this.generateFraction(constraint);

        case "string":
          return this.generateString(constraint);

        default:
          throw new ParameterGenerationError(
            `Unknown parameter type: ${constraint.type}`,
            paramName,
          );
      }
    } catch (error) {
      if (error instanceof ParameterGenerationError) {
        throw error;
      }
      throw new ParameterGenerationError(
        `Failed to generate parameter: ${error instanceof Error ? error.message : String(error)}`,
        paramName,
        error,
      );
    }
  }

  /**
   * Generate an integer value
   *
   * @param constraint - Constraint specification
   * @returns Generated integer
   */
  private generateInteger(constraint: ParameterConstraint): number {
    const min = constraint.min ?? 0;
    const max = constraint.max ?? 100;
    const step = constraint.step ?? 1;

    // Calculate number of valid steps
    const numSteps = Math.floor((max - min) / step);

    // Generate random step
    const randomStep = this.rng.nextInt(0, numSteps);

    // Calculate value
    return min + randomStep * step;
  }

  /**
   * Generate a decimal value
   *
   * @param constraint - Constraint specification
   * @returns Generated decimal
   */
  private generateDecimal(constraint: ParameterConstraint): number {
    const min = constraint.min ?? 0;
    const max = constraint.max ?? 100;
    const step = constraint.step;

    if (step !== undefined) {
      // If step is specified, generate like integer then scale
      const numSteps = Math.floor((max - min) / step);
      const randomStep = this.rng.nextInt(0, numSteps);
      return Number((min + randomStep * step).toFixed(10));
    }

    // Generate float in range
    return Number(this.rng.nextFloat(min, max).toFixed(2));
  }

  /**
   * Generate a fraction value
   *
   * @param constraint - Constraint specification
   * @returns Generated fraction as string "numerator/denominator"
   */
  private generateFraction(constraint: ParameterConstraint): string {
    const min = constraint.min ?? 1;
    const max = constraint.max ?? 10;

    const numerator = this.rng.nextInt(min, max);
    const denominator = this.rng.nextInt(min, max);

    // Ensure denominator is not zero
    return `${numerator}/${denominator === 0 ? 1 : denominator}`;
  }

  /**
   * Generate a string value
   *
   * @param constraint - Constraint specification
   * @returns Generated string
   */
  private generateString(constraint: ParameterConstraint): string {
    // For string type, options should be provided
    if (!constraint.options || constraint.options.length === 0) {
      throw new Error("String parameters must have options defined");
    }

    return this.rng.choice(constraint.options) as string;
  }

  /**
   * Validate type of a value
   *
   * @param value - Value to validate
   * @param type - Expected type
   * @returns true if type matches, false otherwise
   */
  private validateType(value: unknown, type: ParameterType): boolean {
    switch (type) {
      case "integer":
        return typeof value === "number" && Number.isInteger(value);

      case "decimal":
        return typeof value === "number";

      case "fraction":
        return typeof value === "string" && /^\d+\/\d+$/.test(value);

      case "string":
        return typeof value === "string";

      default:
        return false;
    }
  }

  /**
   * Compute generation order based on parameter dependencies
   *
   * Uses topological sort to ensure dependent parameters are generated
   * after their dependencies.
   *
   * @param constraints - Parameter constraints
   * @returns Array of parameter names in generation order
   * @throws {ParameterGenerationError} If circular dependency detected
   */
  private computeGenerationOrder(constraints: ParameterConstraints): string[] {
    const paramNames = Object.keys(constraints);
    const visited = new Set<string>();
    const visiting = new Set<string>();
    const order: string[] = [];

    const visit = (paramName: string): void => {
      if (visited.has(paramName)) {
        return;
      }

      if (visiting.has(paramName)) {
        throw new ParameterGenerationError(
          "Circular dependency detected",
          paramName,
        );
      }

      visiting.add(paramName);

      // Visit dependencies first
      const constraint = constraints[paramName];
      if (constraint.dependsOn) {
        for (const dep of constraint.dependsOn) {
          if (!constraints[dep]) {
            throw new ParameterGenerationError(
              `Depends on undefined parameter: ${dep}`,
              paramName,
            );
          }
          visit(dep);
        }
      }

      visiting.delete(paramName);
      visited.add(paramName);
      order.push(paramName);
    };

    // Visit all parameters
    for (const paramName of paramNames) {
      visit(paramName);
    }

    return order;
  }

  /**
   * Validate all parameters against constraints
   *
   * @param params - Generated parameters
   * @param constraints - Parameter constraints
   * @throws {ConstraintViolationError} If validation fails
   */
  private validateParameters(
    params: Record<string, unknown>,
    constraints: ParameterConstraints,
  ): void {
    for (const [paramName, constraint] of Object.entries(constraints)) {
      const value = params[paramName];
      this.validate(paramName, value, constraint, params);
    }
  }
}

/**
 * Create a parameter generator with the given seed
 *
 * @param seed - Random seed for deterministic generation
 * @returns New parameter generator instance
 */
export function createParameterGenerator(seed: number): ParameterGenerator {
  return new ParameterGenerator({ seed });
}

/**
 * Generate parameters from constraints with a specific seed
 *
 * Convenience function for one-off parameter generation.
 *
 * @param constraints - Parameter constraints specification
 * @param seed - Random seed for deterministic generation
 * @returns Generated parameter values
 */
export function generateParameters(
  constraints: ParameterConstraints,
  seed: number,
): Record<string, unknown> {
  const generator = createParameterGenerator(seed);
  return generator.generate(constraints);
}
