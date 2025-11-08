/**
 * Touch Target Utilities Tests
 *
 * Tests for touch target utility functions ensuring WCAG 2.1 AA compliance.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  TOUCH_TARGET_MIN_SIZE,
  TOUCH_TARGET_MIN_SPACING,
  getTouchTargetClasses,
  getTouchTargetStyles,
  ensureTouchTarget,
  getElementSize,
  hasSufficientSpacing,
  shouldUseInlineStyles,
} from './touch-targets';

// Mock DOM element for testing
class MockHTMLElement {
  private _rect: DOMRect;

  constructor(width: number, height: number, x = 0, y = 0) {
    this._rect = {
      width,
      height,
      x,
      y,
      top: y,
      left: x,
      bottom: y + height,
      right: x + width,
      toJSON: () => ({}),
    };
  }

  getBoundingClientRect(): DOMRect {
    return this._rect;
  }
}

describe('Touch Target Constants', () => {
  it('should export correct minimum size constant', () => {
    expect(TOUCH_TARGET_MIN_SIZE).toBe(44);
  });

  it('should export correct minimum spacing constant', () => {
    expect(TOUCH_TARGET_MIN_SPACING).toBe(8);
  });
});

describe('getTouchTargetClasses', () => {
  it('should return default touch-target class', () => {
    const classes = getTouchTargetClasses();
    expect(classes).toBe('touch-target');
  });

  it('should include extra padding when specified', () => {
    const classes = getTouchTargetClasses({ extraPadding: 2 });
    expect(classes).toBe('touch-target p-2');
  });

  it('should not include padding when zero', () => {
    const classes = getTouchTargetClasses({ extraPadding: 0 });
    expect(classes).toBe('touch-target');
  });

  it('should handle larger padding values', () => {
    const classes = getTouchTargetClasses({ extraPadding: 6 });
    expect(classes).toBe('touch-target p-6');
  });
});

describe('getTouchTargetStyles', () => {
  it('should return default min dimensions', () => {
    const styles = getTouchTargetStyles();
    expect(styles).toEqual({
      'min-width': '44px',
      'min-height': '44px',
    });
  });

  it('should return custom min width', () => {
    const styles = getTouchTargetStyles({ minWidth: 50 });
    expect(styles).toEqual({
      'min-width': '50px',
      'min-height': '44px',
    });
  });

  it('should return custom min height', () => {
    const styles = getTouchTargetStyles({ minHeight: 60 });
    expect(styles).toEqual({
      'min-width': '44px',
      'min-height': '60px',
    });
  });

  it('should return both custom dimensions', () => {
    const styles = getTouchTargetStyles({ minWidth: 50, minHeight: 60 });
    expect(styles).toEqual({
      'min-width': '50px',
      'min-height': '60px',
    });
  });
});

describe('ensureTouchTarget', () => {
  it('should return false for null element', () => {
    expect(ensureTouchTarget(null)).toBe(false);
  });

  it('should return false for undefined element', () => {
    expect(ensureTouchTarget(undefined)).toBe(false);
  });

  it('should return true when element meets minimum dimensions', () => {
    const element = new MockHTMLElement(44, 44) as unknown as HTMLElement;
    expect(ensureTouchTarget(element)).toBe(true);
  });

  it('should return true when element exceeds minimum dimensions', () => {
    const element = new MockHTMLElement(100, 50) as unknown as HTMLElement;
    expect(ensureTouchTarget(element)).toBe(true);
  });

  it('should return false when width is too small', () => {
    const element = new MockHTMLElement(40, 44) as unknown as HTMLElement;
    expect(ensureTouchTarget(element)).toBe(false);
  });

  it('should return false when height is too small', () => {
    const element = new MockHTMLElement(44, 40) as unknown as HTMLElement;
    expect(ensureTouchTarget(element)).toBe(false);
  });

  it('should return false when both dimensions are too small', () => {
    const element = new MockHTMLElement(30, 30) as unknown as HTMLElement;
    expect(ensureTouchTarget(element)).toBe(false);
  });

  it('should use custom minimum dimensions', () => {
    const element = new MockHTMLElement(48, 48) as unknown as HTMLElement;
    expect(ensureTouchTarget(element, { minWidth: 50, minHeight: 50 })).toBe(
      false
    );
    expect(ensureTouchTarget(element, { minWidth: 48, minHeight: 48 })).toBe(
      true
    );
  });
});

describe('getElementSize', () => {
  it('should return null for null element', () => {
    expect(getElementSize(null)).toBeNull();
  });

  it('should return null for undefined element', () => {
    expect(getElementSize(undefined)).toBeNull();
  });

  it('should return correct dimensions', () => {
    const element = new MockHTMLElement(100, 50) as unknown as HTMLElement;
    const size = getElementSize(element);
    expect(size).toEqual({ width: 100, height: 50 });
  });

  it('should handle zero dimensions', () => {
    const element = new MockHTMLElement(0, 0) as unknown as HTMLElement;
    const size = getElementSize(element);
    expect(size).toEqual({ width: 0, height: 0 });
  });
});

describe('hasSufficientSpacing', () => {
  it('should return false for null elements', () => {
    expect(hasSufficientSpacing(null, null)).toBe(false);
  });

  it('should return false when first element is null', () => {
    const element2 = new MockHTMLElement(44, 44) as unknown as HTMLElement;
    expect(hasSufficientSpacing(null, element2)).toBe(false);
  });

  it('should return false when second element is null', () => {
    const element1 = new MockHTMLElement(44, 44) as unknown as HTMLElement;
    expect(hasSufficientSpacing(element1, null)).toBe(false);
  });

  it('should return true when elements have sufficient horizontal spacing', () => {
    const element1 = new MockHTMLElement(44, 44, 0, 0) as unknown as HTMLElement;
    const element2 = new MockHTMLElement(
      44,
      44,
      100,
      0
    ) as unknown as HTMLElement;
    expect(hasSufficientSpacing(element1, element2)).toBe(true);
  });

  it('should return true when elements have sufficient vertical spacing', () => {
    const element1 = new MockHTMLElement(44, 44, 0, 0) as unknown as HTMLElement;
    const element2 = new MockHTMLElement(
      44,
      44,
      0,
      100
    ) as unknown as HTMLElement;
    expect(hasSufficientSpacing(element1, element2)).toBe(true);
  });

  it('should return false when elements are too close', () => {
    const element1 = new MockHTMLElement(44, 44, 0, 0) as unknown as HTMLElement;
    const element2 = new MockHTMLElement(
      44,
      44,
      45,
      0
    ) as unknown as HTMLElement;
    expect(hasSufficientSpacing(element1, element2)).toBe(false);
  });

  it('should use custom minimum spacing', () => {
    const element1 = new MockHTMLElement(44, 44, 0, 0) as unknown as HTMLElement;
    const element2 = new MockHTMLElement(
      44,
      44,
      60,
      0
    ) as unknown as HTMLElement;
    
    // With default spacing (8px), elements are sufficient (60 >= 44 + 8 = 52)
    expect(hasSufficientSpacing(element1, element2, 8)).toBe(true);
    
    // With larger spacing requirement (30px), elements are too close (60 < 44 + 30 = 74)
    expect(hasSufficientSpacing(element1, element2, 30)).toBe(false);
  });

  it('should handle elements of different sizes', () => {
    const element1 = new MockHTMLElement(60, 44, 0, 0) as unknown as HTMLElement;
    const element2 = new MockHTMLElement(
      44,
      60,
      100,
      0
    ) as unknown as HTMLElement;
    expect(hasSufficientSpacing(element1, element2)).toBe(true);
  });
});

describe('shouldUseInlineStyles', () => {
  it('should return false by default', () => {
    expect(shouldUseInlineStyles()).toBe(false);
  });

  it('should return false when useInlineStyles is undefined', () => {
    expect(shouldUseInlineStyles({})).toBe(false);
  });

  it('should return false when useInlineStyles is false', () => {
    expect(shouldUseInlineStyles({ useInlineStyles: false })).toBe(false);
  });

  it('should return true when useInlineStyles is true', () => {
    expect(shouldUseInlineStyles({ useInlineStyles: true })).toBe(true);
  });
});

