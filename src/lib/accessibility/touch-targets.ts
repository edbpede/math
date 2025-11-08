/**
 * Touch Target Utilities
 *
 * Utilities for ensuring interactive elements meet WCAG 2.1 AA motor accessibility
 * requirements with minimum 44x44 pixel touch targets.
 *
 * Requirements:
 * - 9.3: Touch targets minimum 44x44 pixels for motor accessibility
 */

/**
 * Minimum dimensions for touch targets (in pixels)
 * Based on WCAG 2.1 AA Level Success Criterion 2.5.5
 */
export const TOUCH_TARGET_MIN_SIZE = 44 as const;

/**
 * Minimum spacing between adjacent touch targets (in pixels)
 * Prevents accidental activation of adjacent elements
 */
export const TOUCH_TARGET_MIN_SPACING = 8 as const;

/**
 * Touch target size configuration
 */
export interface TouchTargetSize {
  width: number;
  height: number;
}

/**
 * Touch target configuration options
 */
export interface TouchTargetConfig {
  /**
   * Minimum width in pixels (default: 44)
   */
  minWidth?: number;
  /**
   * Minimum height in pixels (default: 44)
   */
  minHeight?: number;
  /**
   * Whether to use inline styles vs CSS classes (default: false)
   */
  useInlineStyles?: boolean;
  /**
   * Additional padding to add for generous click areas (default: 0)
   */
  extraPadding?: number;
}

/**
 * Get CSS classes for touch target compliance
 *
 * Returns UnoCSS classes that ensure minimum 44x44px touch targets.
 * Use this for applying touch target requirements via utility classes.
 *
 * @param config - Optional configuration for custom dimensions
 * @returns Space-separated string of CSS classes
 *
 * @example
 * ```tsx
 * <button class={getTouchTargetClasses()}>Click me</button>
 * // Returns: "touch-target" (min-w-44px min-h-44px)
 * ```
 *
 * @example
 * ```tsx
 * <button class={getTouchTargetClasses({ extraPadding: 2 })}>
 *   Large target
 * </button>
 * // Returns: "touch-target p-2"
 * ```
 */
export function getTouchTargetClasses(config?: TouchTargetConfig): string {
  const classes: string[] = ['touch-target'];

  if (config?.extraPadding && config.extraPadding > 0) {
    classes.push(`p-${config.extraPadding}`);
  }

  return classes.join(' ');
}

/**
 * Get inline styles for touch target compliance
 *
 * Returns style object with minimum dimensions for touch targets.
 * Use when CSS classes cannot be applied (e.g., third-party components).
 *
 * @param config - Optional configuration for custom dimensions
 * @returns Style object with min-width and min-height
 *
 * @example
 * ```tsx
 * <button style={getTouchTargetStyles()}>Click me</button>
 * // Returns: { 'min-width': '44px', 'min-height': '44px' }
 * ```
 */
export function getTouchTargetStyles(
  config?: TouchTargetConfig
): Record<string, string> {
  const minWidth = config?.minWidth ?? TOUCH_TARGET_MIN_SIZE;
  const minHeight = config?.minHeight ?? TOUCH_TARGET_MIN_SIZE;

  return {
    'min-width': `${minWidth}px`,
    'min-height': `${minHeight}px`,
  };
}

/**
 * Validate if an element meets touch target size requirements
 *
 * Useful for testing and debugging. Checks if an element's computed
 * dimensions meet the minimum 44x44px requirement.
 *
 * @param element - The DOM element to validate
 * @param config - Optional configuration for custom minimum dimensions
 * @returns true if element meets requirements, false otherwise
 *
 * @example
 * ```typescript
 * const button = document.querySelector('button');
 * if (!ensureTouchTarget(button)) {
 *   console.warn('Button does not meet touch target requirements');
 * }
 * ```
 */
export function ensureTouchTarget(
  element: HTMLElement | null | undefined,
  config?: TouchTargetConfig
): boolean {
  if (!element) return false;

  const minWidth = config?.minWidth ?? TOUCH_TARGET_MIN_SIZE;
  const minHeight = config?.minHeight ?? TOUCH_TARGET_MIN_SIZE;

  const rect = element.getBoundingClientRect();

  return rect.width >= minWidth && rect.height >= minHeight;
}

/**
 * Get current dimensions of an element
 *
 * Helper function to get the actual rendered dimensions of an element.
 * Useful for debugging touch target issues.
 *
 * @param element - The DOM element to measure
 * @returns Object with width and height properties, or null if element is invalid
 *
 * @example
 * ```typescript
 * const button = document.querySelector('button');
 * const size = getElementSize(button);
 * console.log(`Button size: ${size.width}x${size.height}`);
 * ```
 */
export function getElementSize(
  element: HTMLElement | null | undefined
): TouchTargetSize | null {
  if (!element) return null;

  const rect = element.getBoundingClientRect();

  return {
    width: rect.width,
    height: rect.height,
  };
}

/**
 * Check if two elements have sufficient spacing
 *
 * Validates that two interactive elements have minimum spacing to prevent
 * accidental activation. Uses center-to-center distance calculation.
 *
 * @param element1 - First interactive element
 * @param element2 - Second interactive element
 * @param minSpacing - Minimum spacing in pixels (default: 8)
 * @returns true if spacing is sufficient, false otherwise
 *
 * @example
 * ```typescript
 * const btn1 = document.querySelector('#button1');
 * const btn2 = document.querySelector('#button2');
 * if (!hasSufficientSpacing(btn1, btn2)) {
 *   console.warn('Buttons are too close together');
 * }
 * ```
 */
export function hasSufficientSpacing(
  element1: HTMLElement | null | undefined,
  element2: HTMLElement | null | undefined,
  minSpacing: number = TOUCH_TARGET_MIN_SPACING
): boolean {
  if (!element1 || !element2) return false;

  const rect1 = element1.getBoundingClientRect();
  const rect2 = element2.getBoundingClientRect();

  // Calculate center points
  const center1 = {
    x: rect1.left + rect1.width / 2,
    y: rect1.top + rect1.height / 2,
  };

  const center2 = {
    x: rect2.left + rect2.width / 2,
    y: rect2.top + rect2.height / 2,
  };

  // Calculate horizontal and vertical distances
  const horizontalDist = Math.abs(center1.x - center2.x);
  const verticalDist = Math.abs(center1.y - center2.y);

  // Elements must have minimum spacing in at least one direction
  // Account for half of each element's size plus minimum spacing
  const minHorizontalDist = (rect1.width + rect2.width) / 2 + minSpacing;
  const minVerticalDist = (rect1.height + rect2.height) / 2 + minSpacing;

  return (
    horizontalDist >= minHorizontalDist || verticalDist >= minVerticalDist
  );
}

/**
 * Audit all interactive elements on a page for touch target compliance
 *
 * Scans the DOM for interactive elements and validates touch target requirements.
 * Returns a report of elements that don't meet the requirements.
 *
 * @param root - Root element to start scanning from (default: document.body)
 * @param config - Optional configuration for custom dimensions
 * @returns Array of elements that don't meet requirements
 *
 * @example
 * ```typescript
 * const nonCompliant = auditTouchTargets();
 * if (nonCompliant.length > 0) {
 *   console.warn(`Found ${nonCompliant.length} non-compliant elements:`, nonCompliant);
 * }
 * ```
 */
export function auditTouchTargets(
  root: HTMLElement = document.body,
  config?: TouchTargetConfig
): Array<{ element: HTMLElement; size: TouchTargetSize; selector: string }> {
  const interactiveSelectors = [
    'button',
    'a[href]',
    'input[type="button"]',
    'input[type="submit"]',
    'input[type="reset"]',
    'input[type="checkbox"]',
    'input[type="radio"]',
    '[role="button"]',
    '[role="link"]',
    '[tabindex]:not([tabindex="-1"])',
  ];

  const elements = root.querySelectorAll(
    interactiveSelectors.join(', ')
  ) as NodeListOf<HTMLElement>;

  const nonCompliant: Array<{
    element: HTMLElement;
    size: TouchTargetSize;
    selector: string;
  }> = [];

  elements.forEach((element) => {
    if (!ensureTouchTarget(element, config)) {
      const size = getElementSize(element);
      if (size) {
        // Create a simple selector for the element
        const selector = element.id
          ? `#${element.id}`
          : element.className
          ? `.${element.className.split(' ')[0]}`
          : element.tagName.toLowerCase();

        nonCompliant.push({
          element,
          size,
          selector,
        });
      }
    }
  });

  return nonCompliant;
}

/**
 * Type guard to check if config requests inline styles
 *
 * @param config - Touch target configuration
 * @returns true if inline styles should be used
 */
export function shouldUseInlineStyles(
  config?: TouchTargetConfig
): boolean {
  return config?.useInlineStyles === true;
}

