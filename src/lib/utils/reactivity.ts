/**
 * Reactivity Utilities
 *
 * SolidJS-specific utilities for optimizing reactivity and batching updates.
 * Provides helpers for batching multiple state updates into a single render.
 *
 * Requirements:
 * - 13.3: Optimize SolidJS reactivity with batching
 * - Follows Astro-Solid-Stack guidelines (lines 28-37)
 */

import { batch, untrack as solidUntrack, createEffect, onCleanup } from 'solid-js';

/**
 * Batch multiple reactive updates
 *
 * Wrapper around SolidJS `batch()` for batching multiple signal updates
 * into a single render cycle. Improves performance when updating multiple
 * related signals.
 *
 * @param fn - Function containing multiple updates
 * @returns Result of the function
 *
 * @example
 * ```tsx
 * batchUpdates(() => {
 *   setName('John');
 *   setAge(30);
 *   setEmail('john@example.com');
 * });
 * // Only triggers one render instead of three
 * ```
 */
export function batchUpdates<T>(fn: () => T): T {
  return batch(fn);
}

/**
 * Read a signal value without creating a dependency
 *
 * Wrapper around SolidJS `untrack()` for reading reactive values
 * without subscribing to changes.
 *
 * @param fn - Function to execute without tracking
 * @returns Result of the function
 *
 * @example
 * ```tsx
 * createEffect(() => {
 *   const currentValue = signal();
 *   // Read another signal without tracking it
 *   const otherValue = untrack(() => otherSignal());
 *   // Effect only re-runs when signal() changes
 * });
 * ```
 */
export function untrack<T>(fn: () => T): T {
  return solidUntrack(fn);
}

/**
 * Create a batched effect
 *
 * Creates an effect that batches multiple updates before re-running.
 * Useful for effects that update multiple signals based on dependencies.
 *
 * @param fn - Effect function
 * @param delay - Batch delay in milliseconds (default: 0 - next microtask)
 *
 * @example
 * ```tsx
 * createBatchedEffect(() => {
 *   const data = dataSignal();
 *   // These updates will be batched
 *   setProcessed(process(data));
 *   setValidated(validate(data));
 *   setFormatted(format(data));
 * });
 * ```
 */
export function createBatchedEffect(fn: () => void, delay: number = 0): void {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;
  let pendingUpdate = false;

  createEffect(() => {
    // Track dependencies
    fn();

    // Mark as pending
    pendingUpdate = true;

    // Clear existing timeout
    if (timeoutId !== null) {
      clearTimeout(timeoutId);
    }

    // Batch the update
    timeoutId = setTimeout(() => {
      if (pendingUpdate) {
        batch(() => {
          fn();
        });
        pendingUpdate = false;
      }
      timeoutId = null;
    }, delay);
  });

  onCleanup(() => {
    if (timeoutId !== null) {
      clearTimeout(timeoutId);
    }
  });
}

/**
 * Batch multiple async operations
 *
 * Queues multiple async operations and processes them in batches.
 * Useful for batching API calls or database updates.
 *
 * @param operations - Array of async operations
 * @param batchSize - Number of operations to process at once (default: 10)
 * @returns Promise that resolves when all operations complete
 *
 * @example
 * ```typescript
 * const updates = items.map(item => () => updateItem(item));
 * await batchAsync(updates, 5); // Process 5 at a time
 * ```
 */
export async function batchAsync<T>(
  operations: Array<() => Promise<T>>,
  batchSize: number = 10
): Promise<T[]> {
  const results: T[] = [];

  for (let i = 0; i < operations.length; i += batchSize) {
    const batch = operations.slice(i, i + batchSize);
    const batchResults = await Promise.all(batch.map((op) => op()));
    results.push(...batchResults);
  }

  return results;
}

/**
 * Create a queue for batching operations
 *
 * Creates a queue that batches operations and processes them together.
 * Useful for debouncing multiple similar operations.
 *
 * @param processor - Function to process batched items
 * @param delay - Batch delay in milliseconds
 * @returns Queue functions
 *
 * @example
 * ```typescript
 * const { enqueue, flush } = createBatchQueue(
 *   async (items) => {
 *     await saveItems(items);
 *   },
 *   1000
 * );
 *
 * enqueue(item1);
 * enqueue(item2);
 * // Both saved together after 1 second
 * ```
 */
export function createBatchQueue<T>(
  processor: (items: T[]) => Promise<void> | void,
  delay: number
): {
  enqueue: (item: T) => void;
  flush: () => Promise<void>;
  size: () => number;
} {
  let queue: T[] = [];
  let timeoutId: ReturnType<typeof setTimeout> | null = null;

  const flush = async () => {
    if (timeoutId !== null) {
      clearTimeout(timeoutId);
      timeoutId = null;
    }

    if (queue.length === 0) {
      return;
    }

    const items = [...queue];
    queue = [];

    await processor(items);
  };

  const enqueue = (item: T) => {
    queue.push(item);

    if (timeoutId !== null) {
      clearTimeout(timeoutId);
    }

    timeoutId = setTimeout(flush, delay);
  };

  return {
    enqueue,
    flush,
    size: () => queue.length,
  };
}

/**
 * Optimize component updates with memo
 *
 * Creates a component wrapper that only re-renders when props deeply change.
 * Useful for expensive components.
 *
 * @param shouldUpdate - Function to determine if component should update
 * @param component - Component render function
 * @returns Optimized component
 *
 * @example
 * ```tsx
 * const OptimizedCard = createOptimizedComponent(
 *   (prev, next) => prev.id === next.id,
 *   (props) => <Card {...props} />
 * );
 * ```
 */
export function createOptimizedComponent<P>(
  shouldUpdate: (prevProps: P, nextProps: P) => boolean,
  component: (props: P) => any
) {
  let prevProps: P | null = null;
  let prevResult: any = null;

  return (props: P) => {
    if (prevProps !== null && shouldUpdate(prevProps, props)) {
      return prevResult;
    }

    prevProps = props;
    prevResult = component(props);
    return prevResult;
  };
}

/**
 * Defer computation until idle
 *
 * Schedules computation to run when browser is idle using requestIdleCallback
 * or falls back to setTimeout.
 *
 * @param fn - Function to execute when idle
 * @param options - Idle options
 *
 * @example
 * ```typescript
 * deferUntilIdle(() => {
 *   // Non-critical computation
 *   preloadNextPage();
 * });
 * ```
 */
export function deferUntilIdle(
  fn: () => void,
  options: { timeout?: number } = {}
): void {
  const { timeout = 2000 } = options;

  if (typeof requestIdleCallback !== 'undefined') {
    requestIdleCallback(fn, { timeout });
  } else {
    // Fallback for browsers without requestIdleCallback
    setTimeout(fn, 1);
  }
}

/**
 * Create a batched updater function
 *
 * Returns a function that batches calls and executes them together.
 *
 * @param updater - Update function
 * @param delay - Batch delay in milliseconds
 * @returns Batched updater function
 *
 * @example
 * ```tsx
 * const batchedUpdate = createBatchedUpdater(
 *   (values: string[]) => {
 *     values.forEach(v => addToList(v));
 *   },
 *   100
 * );
 *
 * batchedUpdate('a');
 * batchedUpdate('b');
 * batchedUpdate('c');
 * // All three processed together
 * ```
 */
export function createBatchedUpdater<T>(
  updater: (items: T[]) => void,
  delay: number
): (item: T) => void {
  const { enqueue } = createBatchQueue(updater, delay);
  return enqueue;
}

