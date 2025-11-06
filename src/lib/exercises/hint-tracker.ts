/**
 * Hint Tracking Utilities
 * 
 * Utilities for tracking hint usage during exercise practice.
 * Provides centralized logic for revealing hints progressively and
 * tracking usage counts for mastery calculation.
 * 
 * Requirements:
 * - 4.3: Display next level while keeping previous hints visible
 * - 4.4: Track hint usage count per exercise for mastery calculation
 */

import type { Hint } from './types';

/**
 * Interface for hint tracker state and methods
 */
export interface HintTracker {
  /** Current number of hints revealed (0-4) */
  hintsRevealed: number;
  
  /** Reveal the next hint and return it */
  revealNextHint: () => Hint | null;
  
  /** Get the current count of hints used */
  getHintsUsedCount: () => number;
  
  /** Reset the tracker for a new exercise */
  reset: () => void;
  
  /** Get array of all revealed hints so far */
  getRevealedHints: () => Hint[];
  
  /** Check if all hints have been revealed */
  areAllHintsRevealed: () => boolean;
}

/**
 * Create a hint tracker for managing hint revelation during exercise practice
 * 
 * @param hints - Array of hints for the current exercise (should have 4 levels)
 * @returns HintTracker object with state and methods
 * 
 * @example
 * ```typescript
 * const tracker = createHintTracker(exerciseInstance.hints);
 * 
 * // User requests first hint
 * const hint1 = tracker.revealNextHint();
 * console.log(tracker.getHintsUsedCount()); // 1
 * 
 * // User requests second hint
 * const hint2 = tracker.revealNextHint();
 * console.log(tracker.getHintsUsedCount()); // 2
 * 
 * // Get all revealed hints
 * const revealed = tracker.getRevealedHints(); // [hint1, hint2]
 * 
 * // Reset for new exercise
 * tracker.reset();
 * console.log(tracker.getHintsUsedCount()); // 0
 * ```
 */
export function createHintTracker(hints: Hint[]): HintTracker {
  let hintsRevealed = 0;
  
  return {
    get hintsRevealed() {
      return hintsRevealed;
    },
    
    revealNextHint(): Hint | null {
      if (hintsRevealed >= hints.length) {
        return null;
      }
      
      const hint = hints[hintsRevealed];
      hintsRevealed++;
      return hint;
    },
    
    getHintsUsedCount(): number {
      return hintsRevealed;
    },
    
    reset(): void {
      hintsRevealed = 0;
    },
    
    getRevealedHints(): Hint[] {
      return hints.slice(0, hintsRevealed);
    },
    
    areAllHintsRevealed(): boolean {
      return hintsRevealed >= hints.length;
    },
  };
}

/**
 * Create a reactive hint tracker using a state setter (for use with SolidJS)
 * 
 * This version returns a function to update state and the tracker methods
 * operate on that state, making it suitable for reactive frameworks.
 * 
 * @param hints - Array of hints for the current exercise
 * @param setState - State setter function (e.g., from SolidJS createSignal)
 * @returns Object with tracker methods that update state
 * 
 * @example
 * ```typescript
 * const [hintsRevealed, setHintsRevealed] = createSignal(0);
 * const tracker = createReactiveHintTracker(hints, setHintsRevealed);
 * 
 * // Reveal hint (updates signal)
 * tracker.revealNext();
 * console.log(hintsRevealed()); // 1
 * ```
 */
export function createReactiveHintTracker(
  hints: Hint[],
  setState: (value: number | ((prev: number) => number)) => void
) {
  return {
    revealNext(): Hint | null {
      let revealed: Hint | null = null;
      setState((prev) => {
        if (prev >= hints.length) {
          return prev;
        }
        revealed = hints[prev];
        return prev + 1;
      });
      return revealed;
    },
    
    reset(): void {
      setState(0);
    },
    
    getRevealedHints(currentCount: number): Hint[] {
      return hints.slice(0, currentCount);
    },
    
    areAllRevealed(currentCount: number): boolean {
      return currentCount >= hints.length;
    },
  };
}

