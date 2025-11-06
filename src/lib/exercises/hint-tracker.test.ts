/**
 * Hint Tracker Tests
 * 
 * Tests for hint tracking utilities to ensure correct behavior
 * for progressive hint revelation and usage tracking.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { createHintTracker, createReactiveHintTracker } from './hint-tracker';
import type { Hint } from './types';

describe('createHintTracker', () => {
  const mockHints: Hint[] = [
    { level: 1, text: 'Hint level 1' },
    { level: 2, text: 'Hint level 2' },
    { level: 3, text: 'Hint level 3' },
    { level: 4, text: 'Hint level 4' },
  ];

  let tracker: ReturnType<typeof createHintTracker>;

  beforeEach(() => {
    tracker = createHintTracker(mockHints);
  });

  describe('initialization', () => {
    it('should initialize with zero hints revealed', () => {
      expect(tracker.hintsRevealed).toBe(0);
      expect(tracker.getHintsUsedCount()).toBe(0);
    });

    it('should not have all hints revealed initially', () => {
      expect(tracker.areAllHintsRevealed()).toBe(false);
    });

    it('should return empty array for revealed hints initially', () => {
      expect(tracker.getRevealedHints()).toEqual([]);
    });
  });

  describe('revealNextHint', () => {
    it('should reveal first hint correctly', () => {
      const hint = tracker.revealNextHint();
      
      expect(hint).toEqual(mockHints[0]);
      expect(tracker.hintsRevealed).toBe(1);
      expect(tracker.getHintsUsedCount()).toBe(1);
    });

    it('should reveal hints sequentially', () => {
      const hint1 = tracker.revealNextHint();
      const hint2 = tracker.revealNextHint();
      const hint3 = tracker.revealNextHint();
      
      expect(hint1).toEqual(mockHints[0]);
      expect(hint2).toEqual(mockHints[1]);
      expect(hint3).toEqual(mockHints[2]);
      expect(tracker.hintsRevealed).toBe(3);
    });

    it('should reveal all 4 hints in order', () => {
      const revealed = [];
      for (let i = 0; i < 4; i++) {
        revealed.push(tracker.revealNextHint());
      }
      
      expect(revealed).toEqual(mockHints);
      expect(tracker.hintsRevealed).toBe(4);
    });

    it('should return null when all hints are revealed', () => {
      // Reveal all hints
      for (let i = 0; i < 4; i++) {
        tracker.revealNextHint();
      }
      
      // Try to reveal another
      const extraHint = tracker.revealNextHint();
      
      expect(extraHint).toBeNull();
      expect(tracker.hintsRevealed).toBe(4); // Should not increment
    });

    it('should handle multiple attempts to reveal beyond limit', () => {
      // Reveal all hints
      for (let i = 0; i < 4; i++) {
        tracker.revealNextHint();
      }
      
      // Try multiple times
      expect(tracker.revealNextHint()).toBeNull();
      expect(tracker.revealNextHint()).toBeNull();
      expect(tracker.revealNextHint()).toBeNull();
      
      expect(tracker.hintsRevealed).toBe(4);
    });
  });

  describe('getRevealedHints', () => {
    it('should return empty array when no hints revealed', () => {
      expect(tracker.getRevealedHints()).toEqual([]);
    });

    it('should return correct hints after revealing some', () => {
      tracker.revealNextHint();
      tracker.revealNextHint();
      
      const revealed = tracker.getRevealedHints();
      
      expect(revealed).toEqual([mockHints[0], mockHints[1]]);
      expect(revealed.length).toBe(2);
    });

    it('should return all hints when all are revealed', () => {
      for (let i = 0; i < 4; i++) {
        tracker.revealNextHint();
      }
      
      const revealed = tracker.getRevealedHints();
      
      expect(revealed).toEqual(mockHints);
      expect(revealed.length).toBe(4);
    });

    it('should not modify the original hints array', () => {
      tracker.revealNextHint();
      const revealed = tracker.getRevealedHints();
      
      // Modify returned array
      revealed.push({ level: 1, text: 'Extra hint' });
      
      // Original should be unchanged
      expect(tracker.getRevealedHints().length).toBe(1);
    });
  });

  describe('areAllHintsRevealed', () => {
    it('should return false initially', () => {
      expect(tracker.areAllHintsRevealed()).toBe(false);
    });

    it('should return false when some hints revealed', () => {
      tracker.revealNextHint();
      tracker.revealNextHint();
      
      expect(tracker.areAllHintsRevealed()).toBe(false);
    });

    it('should return true when all hints revealed', () => {
      for (let i = 0; i < 4; i++) {
        tracker.revealNextHint();
      }
      
      expect(tracker.areAllHintsRevealed()).toBe(true);
    });

    it('should remain true after attempting to reveal more', () => {
      for (let i = 0; i < 4; i++) {
        tracker.revealNextHint();
      }
      tracker.revealNextHint(); // Try to reveal 5th
      
      expect(tracker.areAllHintsRevealed()).toBe(true);
    });
  });

  describe('reset', () => {
    it('should reset hints revealed to zero', () => {
      tracker.revealNextHint();
      tracker.revealNextHint();
      
      tracker.reset();
      
      expect(tracker.hintsRevealed).toBe(0);
      expect(tracker.getHintsUsedCount()).toBe(0);
    });

    it('should allow revealing hints again after reset', () => {
      // Reveal all hints
      for (let i = 0; i < 4; i++) {
        tracker.revealNextHint();
      }
      expect(tracker.areAllHintsRevealed()).toBe(true);
      
      // Reset
      tracker.reset();
      
      // Should be able to reveal again
      const hint = tracker.revealNextHint();
      expect(hint).toEqual(mockHints[0]);
      expect(tracker.hintsRevealed).toBe(1);
    });

    it('should clear revealed hints array', () => {
      tracker.revealNextHint();
      tracker.revealNextHint();
      
      tracker.reset();
      
      expect(tracker.getRevealedHints()).toEqual([]);
    });
  });

  describe('edge cases', () => {
    it('should handle empty hints array', () => {
      const emptyTracker = createHintTracker([]);
      
      expect(emptyTracker.hintsRevealed).toBe(0);
      expect(emptyTracker.revealNextHint()).toBeNull();
      expect(emptyTracker.areAllHintsRevealed()).toBe(true); // No hints to reveal
    });

    it('should handle hints with visual aids', () => {
      const hintsWithVisualAids: Hint[] = [
        { level: 1, text: 'Hint 1', visualAid: { type: 'number-line', data: {} } },
        { level: 2, text: 'Hint 2', visualAid: { type: 'diagram', data: {} } },
        { level: 3, text: 'Hint 3' },
        { level: 4, text: 'Hint 4' },
      ];
      
      const visualTracker = createHintTracker(hintsWithVisualAids);
      
      const hint1 = visualTracker.revealNextHint();
      expect(hint1?.visualAid).toBeDefined();
      expect(hint1?.visualAid?.type).toBe('number-line');
      
      const hint2 = visualTracker.revealNextHint();
      expect(hint2?.visualAid?.type).toBe('diagram');
      
      const hint3 = visualTracker.revealNextHint();
      expect(hint3?.visualAid).toBeUndefined();
    });
  });
});

describe('createReactiveHintTracker', () => {
  const mockHints: Hint[] = [
    { level: 1, text: 'Hint level 1' },
    { level: 2, text: 'Hint level 2' },
    { level: 3, text: 'Hint level 3' },
    { level: 4, text: 'Hint level 4' },
  ];

  it('should update state when revealing hints', () => {
    let state = 0;
    const setState = (value: number | ((prev: number) => number)) => {
      if (typeof value === 'function') {
        state = value(state);
      } else {
        state = value;
      }
    };

    const tracker = createReactiveHintTracker(mockHints, setState);

    expect(state).toBe(0);

    const hint1 = tracker.revealNext();
    expect(hint1).toEqual(mockHints[0]);
    expect(state).toBe(1);

    const hint2 = tracker.revealNext();
    expect(hint2).toEqual(mockHints[1]);
    expect(state).toBe(2);
  });

  it('should reset state to zero', () => {
    let state = 3;
    const setState = (value: number | ((prev: number) => number)) => {
      if (typeof value === 'function') {
        state = value(state);
      } else {
        state = value;
      }
    };

    const tracker = createReactiveHintTracker(mockHints, setState);

    tracker.reset();
    expect(state).toBe(0);
  });

  it('should return null when all hints revealed', () => {
    let state = 4; // All hints already revealed
    const setState = (value: number | ((prev: number) => number)) => {
      if (typeof value === 'function') {
        state = value(state);
      } else {
        state = value;
      }
    };

    const tracker = createReactiveHintTracker(mockHints, setState);

    const hint = tracker.revealNext();
    expect(hint).toBeNull();
    expect(state).toBe(4); // State unchanged
  });

  it('should get revealed hints correctly', () => {
    let state = 2;
    const setState = (value: number | ((prev: number) => number)) => {
      if (typeof value === 'function') {
        state = value(state);
      } else {
        state = value;
      }
    };

    const tracker = createReactiveHintTracker(mockHints, setState);

    const revealed = tracker.getRevealedHints(state);
    expect(revealed).toEqual([mockHints[0], mockHints[1]]);
  });

  it('should check if all hints are revealed', () => {
    let state = 0;
    const setState = (value: number | ((prev: number) => number)) => {
      if (typeof value === 'function') {
        state = value(state);
      } else {
        state = value;
      }
    };

    const tracker = createReactiveHintTracker(mockHints, setState);

    expect(tracker.areAllRevealed(0)).toBe(false);
    expect(tracker.areAllRevealed(2)).toBe(false);
    expect(tracker.areAllRevealed(4)).toBe(true);
    expect(tracker.areAllRevealed(5)).toBe(true);
  });
});

