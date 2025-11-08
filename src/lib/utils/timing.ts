/**
 * Timing Utilities
 *
 * Provides debounce, throttle, and SolidJS-specific timing helpers for
 * optimizing user input handlers and event listeners.
 *
 * Requirements:
 * - 13.3: Debounce user input handlers and throttle scroll/resize handlers
 * - Debounce progress updates (30s) per design.md line 908
 */

import { createSignal, createEffect, onCleanup, type Accessor } from 'solid-js';

/**
 * Standard debounce function
 *
 * Delays function execution until after `delay` milliseconds have passed
 * since the last time it was invoked.
 *
 * @param fn - Function to debounce
 * @param delay - Delay in milliseconds
 * @returns Debounced function
 *
 * @example
 * ```typescript
 * const debouncedSearch = debounce((query: string) => {
 *   searchAPI(query);
 * }, 300);
 * ```
 */
export function debounce<T extends (...args: any[]) => any>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;

  return function (this: any, ...args: Parameters<T>) {
    if (timeoutId !== null) {
      clearTimeout(timeoutId);
    }

    timeoutId = setTimeout(() => {
      fn.apply(this, args);
      timeoutId = null;
    }, delay);
  };
}

/**
 * Throttle function with trailing edge
 *
 * Ensures function is called at most once per `delay` milliseconds.
 * Includes trailing edge call to capture the final value.
 *
 * @param fn - Function to throttle
 * @param delay - Minimum time between calls in milliseconds
 * @returns Throttled function
 *
 * @example
 * ```typescript
 * const throttledScroll = throttle((event: Event) => {
 *   updateScrollPosition(event);
 * }, 100);
 * ```
 */
export function throttle<T extends (...args: any[]) => any>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => void {
  let lastCall = 0;
  let timeoutId: ReturnType<typeof setTimeout> | null = null;

  return function (this: any, ...args: Parameters<T>) {
    const now = Date.now();
    const timeSinceLastCall = now - lastCall;

    // Clear pending trailing call
    if (timeoutId !== null) {
      clearTimeout(timeoutId);
      timeoutId = null;
    }

    if (timeSinceLastCall >= delay) {
      // Immediate call
      lastCall = now;
      fn.apply(this, args);
    } else {
      // Schedule trailing call
      timeoutId = setTimeout(() => {
        lastCall = Date.now();
        fn.apply(this, args);
        timeoutId = null;
      }, delay - timeSinceLastCall);
    }
  };
}

/**
 * Create a debounced SolidJS signal
 *
 * Returns a signal that updates only after the source signal has stopped
 * changing for `delay` milliseconds.
 *
 * @param source - Source signal accessor
 * @param delay - Debounce delay in milliseconds
 * @returns Debounced signal accessor
 *
 * @example
 * ```tsx
 * const [searchQuery, setSearchQuery] = createSignal('');
 * const debouncedQuery = createDebouncedSignal(searchQuery, 300);
 *
 * createEffect(() => {
 *   // Only runs 300ms after user stops typing
 *   performSearch(debouncedQuery());
 * });
 * ```
 */
export function createDebouncedSignal<T>(
  source: Accessor<T>,
  delay: number
): Accessor<T> {
  const [debounced, setDebounced] = createSignal<T>(source());
  let timeoutId: ReturnType<typeof setTimeout> | null = null;

  createEffect(() => {
    const value = source();

    if (timeoutId !== null) {
      clearTimeout(timeoutId);
    }

    timeoutId = setTimeout(() => {
      setDebounced(() => value);
      timeoutId = null;
    }, delay);
  });

  onCleanup(() => {
    if (timeoutId !== null) {
      clearTimeout(timeoutId);
    }
  });

  return debounced;
}

/**
 * Create a throttled SolidJS signal
 *
 * Returns a signal that updates at most once per `delay` milliseconds.
 * Includes trailing edge update to capture final value.
 *
 * @param source - Source signal accessor
 * @param delay - Minimum time between updates in milliseconds
 * @returns Throttled signal accessor
 *
 * @example
 * ```tsx
 * const [scrollY, setScrollY] = createSignal(0);
 * const throttledScrollY = createThrottledSignal(scrollY, 100);
 *
 * createEffect(() => {
 *   // Only runs at most once per 100ms
 *   updateScrollIndicator(throttledScrollY());
 * });
 * ```
 */
export function createThrottledSignal<T>(
  source: Accessor<T>,
  delay: number
): Accessor<T> {
  const [throttled, setThrottled] = createSignal<T>(source());
  let lastUpdate = 0;
  let timeoutId: ReturnType<typeof setTimeout> | null = null;

  createEffect(() => {
    const value = source();
    const now = Date.now();
    const timeSinceLastUpdate = now - lastUpdate;

    // Clear pending trailing update
    if (timeoutId !== null) {
      clearTimeout(timeoutId);
      timeoutId = null;
    }

    if (timeSinceLastUpdate >= delay) {
      // Immediate update
      lastUpdate = now;
      setThrottled(() => value);
    } else {
      // Schedule trailing update
      timeoutId = setTimeout(() => {
        lastUpdate = Date.now();
        setThrottled(() => value);
        timeoutId = null;
      }, delay - timeSinceLastUpdate);
    }
  });

  onCleanup(() => {
    if (timeoutId !== null) {
      clearTimeout(timeoutId);
    }
  });

  return throttled;
}

/**
 * Cancel a debounced or throttled function
 *
 * Utility type for functions that can be cancelled.
 */
export interface CancellableFunction<T extends (...args: any[]) => any> {
  (...args: Parameters<T>): void;
  cancel: () => void;
}

/**
 * Create cancellable debounce function
 *
 * Returns a debounced function with a `cancel()` method to clear pending calls.
 *
 * @param fn - Function to debounce
 * @param delay - Delay in milliseconds
 * @returns Debounced function with cancel method
 */
export function debounceCancellable<T extends (...args: any[]) => any>(
  fn: T,
  delay: number
): CancellableFunction<T> {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;

  const debounced = function (this: any, ...args: Parameters<T>) {
    if (timeoutId !== null) {
      clearTimeout(timeoutId);
    }

    timeoutId = setTimeout(() => {
      fn.apply(this, args);
      timeoutId = null;
    }, delay);
  } as CancellableFunction<T>;

  debounced.cancel = () => {
    if (timeoutId !== null) {
      clearTimeout(timeoutId);
      timeoutId = null;
    }
  };

  return debounced;
}

/**
 * Create cancellable throttle function
 *
 * Returns a throttled function with a `cancel()` method to clear pending calls.
 *
 * @param fn - Function to throttle
 * @param delay - Minimum time between calls in milliseconds
 * @returns Throttled function with cancel method
 */
export function throttleCancellable<T extends (...args: any[]) => any>(
  fn: T,
  delay: number
): CancellableFunction<T> {
  let lastCall = 0;
  let timeoutId: ReturnType<typeof setTimeout> | null = null;

  const throttled = function (this: any, ...args: Parameters<T>) {
    const now = Date.now();
    const timeSinceLastCall = now - lastCall;

    if (timeoutId !== null) {
      clearTimeout(timeoutId);
      timeoutId = null;
    }

    if (timeSinceLastCall >= delay) {
      lastCall = now;
      fn.apply(this, args);
    } else {
      timeoutId = setTimeout(() => {
        lastCall = Date.now();
        fn.apply(this, args);
        timeoutId = null;
      }, delay - timeSinceLastCall);
    }
  } as CancellableFunction<T>;

  throttled.cancel = () => {
    if (timeoutId !== null) {
      clearTimeout(timeoutId);
      timeoutId = null;
    }
  };

  return throttled;
}

