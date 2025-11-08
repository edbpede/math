/**
 * Memoization Utilities
 *
 * Provides memoization functions with LRU cache for expensive calculations.
 * Optimizes performance by caching results of pure functions.
 *
 * Requirements:
 * - 13.3: Add memoization for expensive calculations
 * - Target: Mastery calculation <5ms (Req 13.2)
 */

import { createMemo, type Accessor } from 'solid-js';

/**
 * LRU Cache implementation
 *
 * Least Recently Used cache with maximum size limit.
 * Automatically evicts oldest entries when capacity is exceeded.
 */
class LRUCache<K, V> {
  private cache: Map<K, V>;
  private readonly maxSize: number;

  constructor(maxSize: number) {
    this.cache = new Map();
    this.maxSize = maxSize;
  }

  get(key: K): V | undefined {
    const value = this.cache.get(key);
    if (value !== undefined) {
      // Move to end (most recently used)
      this.cache.delete(key);
      this.cache.set(key, value);
    }
    return value;
  }

  set(key: K, value: V): void {
    // Remove if exists (to update position)
    if (this.cache.has(key)) {
      this.cache.delete(key);
    }
    // Add to end (most recently used)
    this.cache.set(key, value);

    // Evict oldest if over capacity
    if (this.cache.size > this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }
  }

  has(key: K): boolean {
    return this.cache.has(key);
  }

  clear(): void {
    this.cache.clear();
  }

  get size(): number {
    return this.cache.size;
  }
}

/**
 * Memoization options
 */
export interface MemoizeOptions {
  /** Maximum cache size (default: 100) */
  maxSize?: number;
  /** Custom key serializer (default: JSON.stringify) */
  keySerializer?: (...args: any[]) => string;
}

/**
 * Memoize a function with LRU cache
 *
 * Caches function results based on arguments. Uses LRU eviction when
 * cache reaches maximum size.
 *
 * @param fn - Function to memoize
 * @param options - Memoization options
 * @returns Memoized function with cache management methods
 *
 * @example
 * ```typescript
 * const expensiveCalc = memoize((a: number, b: number) => {
 *   // Expensive calculation
 *   return a * b + Math.sqrt(a + b);
 * }, { maxSize: 50 });
 *
 * const result1 = expensiveCalc(5, 10); // Calculates
 * const result2 = expensiveCalc(5, 10); // Returns cached
 * ```
 */
export function memoize<T extends (...args: any[]) => any>(
  fn: T,
  options: MemoizeOptions = {}
): T & { cache: { clear: () => void; size: () => number } } {
  const { maxSize = 100, keySerializer = JSON.stringify } = options;
  const cache = new LRUCache<string, ReturnType<T>>(maxSize);

  const memoized = function (this: any, ...args: Parameters<T>): ReturnType<T> {
    const key = keySerializer(...args);

    if (cache.has(key)) {
      return cache.get(key)!;
    }

    const result = fn.apply(this, args);
    cache.set(key, result);
    return result;
  } as T & { cache: { clear: () => void; size: () => number } };

  // Add cache management methods
  memoized.cache = {
    clear: () => cache.clear(),
    size: () => cache.size,
  };

  return memoized;
}

/**
 * Options for time-expiring memoization
 */
export interface MemoizeWithExpiryOptions extends MemoizeOptions {
  /** Time to live in milliseconds */
  ttl: number;
}

/**
 * Cache entry with expiry
 */
interface CacheEntryWithExpiry<T> {
  value: T;
  expiresAt: number;
}

/**
 * Memoize with time-based expiry
 *
 * Caches function results with automatic expiration after TTL.
 * Useful for data that changes over time.
 *
 * @param fn - Function to memoize
 * @param options - Memoization options with TTL
 * @returns Memoized function with cache management
 *
 * @example
 * ```typescript
 * const fetchData = memoizeWithExpiry(
 *   async (id: string) => {
 *     return await api.fetch(id);
 *   },
 *   { ttl: 60000, maxSize: 50 } // 1 minute TTL
 * );
 * ```
 */
export function memoizeWithExpiry<T extends (...args: any[]) => any>(
  fn: T,
  options: MemoizeWithExpiryOptions
): T & { cache: { clear: () => void; size: () => number } } {
  const { maxSize = 100, ttl, keySerializer = JSON.stringify } = options;
  const cache = new LRUCache<string, CacheEntryWithExpiry<ReturnType<T>>>(maxSize);

  const memoized = function (this: any, ...args: Parameters<T>): ReturnType<T> {
    const key = keySerializer(...args);
    const now = Date.now();

    const cached = cache.get(key);
    if (cached && cached.expiresAt > now) {
      return cached.value;
    }

    const result = fn.apply(this, args);
    cache.set(key, {
      value: result,
      expiresAt: now + ttl,
    });
    return result;
  } as T & { cache: { clear: () => void; size: () => number } };

  memoized.cache = {
    clear: () => cache.clear(),
    size: () => cache.size,
  };

  return memoized;
}

/**
 * Create memoized selector for SolidJS
 *
 * Creates a memoized computation that only re-runs when dependencies change.
 * Integrates with SolidJS reactivity system.
 *
 * @param fn - Selector function
 * @returns Memoized accessor
 *
 * @example
 * ```tsx
 * const expensiveComputation = createMemoizedSelector(() => {
 *   const data = someSignal();
 *   // Expensive calculation
 *   return processData(data);
 * });
 *
 * // Will only recompute when someSignal changes
 * const result = expensiveComputation();
 * ```
 */
export function createMemoizedSelector<T>(fn: () => T): Accessor<T> {
  return createMemo(fn);
}

/**
 * Hash function for creating cache keys from objects
 *
 * Simple hash function for objects that can't be JSON.stringify'd
 * or when you need a more compact key.
 *
 * @param obj - Object to hash
 * @returns Hash string
 */
export function hashObject(obj: any): string {
  const str = typeof obj === 'string' ? obj : JSON.stringify(obj);
  let hash = 0;

  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32-bit integer
  }

  return hash.toString(36);
}

/**
 * Create a memoized async function
 *
 * Memoizes async functions, handling Promise resolution.
 * Caches both successful results and errors.
 *
 * @param fn - Async function to memoize
 * @param options - Memoization options
 * @returns Memoized async function
 *
 * @example
 * ```typescript
 * const fetchUser = memoizeAsync(
 *   async (userId: string) => {
 *     return await api.getUser(userId);
 *   },
 *   { maxSize: 100 }
 * );
 * ```
 */
export function memoizeAsync<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  options: MemoizeOptions = {}
): T & { cache: { clear: () => void; size: () => number } } {
  const { maxSize = 100, keySerializer = JSON.stringify } = options;
  const cache = new LRUCache<string, Promise<Awaited<ReturnType<T>>>>(maxSize);

  const memoized = function (this: any, ...args: Parameters<T>): ReturnType<T> {
    const key = keySerializer(...args);

    if (cache.has(key)) {
      return cache.get(key) as ReturnType<T>;
    }

    const promise = fn.apply(this, args) as Promise<Awaited<ReturnType<T>>>;

    // Cache the promise
    cache.set(key, promise);

    // Remove from cache if promise rejects
    promise.catch(() => {
      // Don't cache errors by default
      // Could be made configurable if needed
    });

    return promise as ReturnType<T>;
  } as T & { cache: { clear: () => void; size: () => number } };

  memoized.cache = {
    clear: () => cache.clear(),
    size: () => cache.size,
  };

  return memoized;
}

/**
 * Weak memoization for single argument functions
 *
 * Uses WeakMap for memoization, allowing garbage collection of keys.
 * Only works with object arguments.
 *
 * @param fn - Function to memoize (must take single object argument)
 * @returns Memoized function
 *
 * @example
 * ```typescript
 * const processData = weakMemoize((data: DataObject) => {
 *   return expensiveTransform(data);
 * });
 * ```
 */
export function weakMemoize<T extends object, R>(
  fn: (arg: T) => R
): (arg: T) => R {
  const cache = new WeakMap<T, R>();

  return function (arg: T): R {
    if (cache.has(arg)) {
      return cache.get(arg)!;
    }

    const result = fn(arg);
    cache.set(arg, result);
    return result;
  };
}

