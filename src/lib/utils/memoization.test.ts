/**
 * Tests for memoization utilities
 */

import { describe, it, expect, vi } from 'vitest';
import {
  memoize,
  memoizeWithExpiry,
  memoizeAsync,
  weakMemoize,
  hashObject,
} from './memoization';

describe('memoize', () => {
  it('should cache function results', () => {
    const fn = vi.fn((a: number, b: number) => a + b);
    const memoized = memoize(fn);

    const result1 = memoized(2, 3);
    const result2 = memoized(2, 3);

    expect(result1).toBe(5);
    expect(result2).toBe(5);
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('should cache different argument combinations separately', () => {
    const fn = vi.fn((a: number, b: number) => a + b);
    const memoized = memoize(fn);

    memoized(2, 3);
    memoized(3, 4);
    memoized(2, 3);

    expect(fn).toHaveBeenCalledTimes(2); // Once for (2,3), once for (3,4)
  });

  it('should respect maxSize limit', () => {
    const fn = vi.fn((n: number) => n * 2);
    const memoized = memoize(fn, { maxSize: 2 });

    memoized(1); // Cache: ["1"]
    memoized(2); // Cache: ["1", "2"]
    memoized(3); // Cache: ["2", "3"] (1 evicted, 3 added)

    fn.mockClear();

    // After mockClear, cache still has ["2", "3"]
    memoized(1); // Cache miss - adds 1, evicts 2: ["3", "1"], fn called 1x
    memoized(2); // Cache miss - adds 2, evicts 3: ["1", "2"], fn called 2x

    // Both 1 and 2 need to recompute because:
    // - 1 was evicted when 3 was added
    // - 2 was evicted when 1 was added back (cache was ["3", "1"], 2 not present)
    expect(fn).toHaveBeenCalledTimes(2);
  });

  it('should allow custom key serializer', () => {
    const fn = vi.fn((obj: { x: number; y: number }) => obj.x + obj.y);
    const memoized = memoize(fn, {
      keySerializer: (obj) => `${obj.x},${obj.y}`,
    });

    memoized({ x: 1, y: 2 });
    memoized({ x: 1, y: 2 }); // Different object, same content

    expect(fn).toHaveBeenCalledTimes(1); // Should use cached result
  });

  it('should provide cache management methods', () => {
    const fn = vi.fn((n: number) => n * 2);
    const memoized = memoize(fn);

    memoized(1);
    memoized(2);

    expect(memoized.cache.size()).toBe(2);

    memoized.cache.clear();
    expect(memoized.cache.size()).toBe(0);
  });
});

describe('memoizeWithExpiry', () => {
  it('should cache results with TTL', () => {
    const fn = vi.fn((n: number) => n * 2);
    const memoized = memoizeWithExpiry(fn, { ttl: 1000, maxSize: 10 });

    const result1 = memoized(5);
    const result2 = memoized(5);

    expect(result1).toBe(10);
    expect(result2).toBe(10);
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('should recompute after TTL expires', async () => {
    const fn = vi.fn((n: number) => n * 2);
    const memoized = memoizeWithExpiry(fn, { ttl: 10, maxSize: 10 });

    memoized(5);
    
    // Wait for TTL to expire
    await new Promise((resolve) => setTimeout(resolve, 15));

    fn.mockClear();
    memoized(5); // Should recompute

    expect(fn).toHaveBeenCalledTimes(1);
  });
});

describe('memoizeAsync', () => {
  it('should cache async function results', async () => {
    const fn = vi.fn(async (n: number) => {
      await new Promise((resolve) => setTimeout(resolve, 10));
      return n * 2;
    });
    const memoized = memoizeAsync(fn);

    const result1 = await memoized(5);
    const result2 = await memoized(5);

    expect(result1).toBe(10);
    expect(result2).toBe(10);
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('should handle concurrent calls to same arguments', async () => {
    const fn = vi.fn(async (n: number) => {
      await new Promise((resolve) => setTimeout(resolve, 10));
      return n * 2;
    });
    const memoized = memoizeAsync(fn);

    const [result1, result2] = await Promise.all([memoized(5), memoized(5)]);

    expect(result1).toBe(10);
    expect(result2).toBe(10);
    expect(fn).toHaveBeenCalledTimes(1); // Only one actual call
  });
});

describe('weakMemoize', () => {
  it('should cache results for object keys', () => {
    const fn = vi.fn((obj: { value: number }) => obj.value * 2);
    const memoized = weakMemoize(fn);

    const obj = { value: 5 };
    const result1 = memoized(obj);
    const result2 = memoized(obj);

    expect(result1).toBe(10);
    expect(result2).toBe(10);
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('should not cache for different object instances', () => {
    const fn = vi.fn((obj: { value: number }) => obj.value * 2);
    const memoized = weakMemoize(fn);

    memoized({ value: 5 });
    memoized({ value: 5 }); // Different instance

    expect(fn).toHaveBeenCalledTimes(2);
  });
});

describe('hashObject', () => {
  it('should generate consistent hashes', () => {
    const obj = { a: 1, b: 2 };
    const hash1 = hashObject(obj);
    const hash2 = hashObject(obj);

    expect(hash1).toBe(hash2);
  });

  it('should generate different hashes for different objects', () => {
    const hash1 = hashObject({ a: 1 });
    const hash2 = hashObject({ a: 2 });

    expect(hash1).not.toBe(hash2);
  });

  it('should handle strings', () => {
    const hash1 = hashObject('test');
    const hash2 = hashObject('test');
    const hash3 = hashObject('different');

    expect(hash1).toBe(hash2);
    expect(hash1).not.toBe(hash3);
  });
});

describe('Performance', () => {
  it('should provide significant speedup for expensive calculations', () => {
    const expensiveFn = (n: number) => {
      let result = 0;
      for (let i = 0; i < 1000000; i++) {
        result += Math.sqrt(i) * n;
      }
      return result;
    };

    const memoized = memoize(expensiveFn);

    // First call (uncached)
    const start1 = performance.now();
    memoized(5);
    const duration1 = performance.now() - start1;

    // Second call (cached)
    const start2 = performance.now();
    memoized(5);
    const duration2 = performance.now() - start2;

    // Cached call should be at least 100x faster
    expect(duration2).toBeLessThan(duration1 / 100);
    expect(duration2).toBeLessThan(1); // Should be sub-millisecond
  });

  it('should have minimal overhead for cache operations', () => {
    const fn = (n: number) => n * 2;
    const memoized = memoize(fn, { maxSize: 1000 });

    const start = performance.now();
    for (let i = 0; i < 1000; i++) {
      memoized(i);
    }
    const duration = performance.now() - start;

    expect(duration).toBeLessThan(10); // Should be very fast
  });

  it('should maintain >80% cache hit rate in realistic scenario', () => {
    const fn = vi.fn((n: number) => n * 2);
    const memoized = memoize(fn, { maxSize: 100 });

    // Simulate realistic access pattern with some repetition
    const calls = 1000;
    for (let i = 0; i < calls; i++) {
      // 80% chance to use one of 50 common values
      const value = Math.random() < 0.8 ? Math.floor(Math.random() * 50) : Math.floor(Math.random() * 200);
      memoized(value);
    }

    const hitRate = 1 - fn.mock.calls.length / calls;
    expect(hitRate).toBeGreaterThan(0.8); // >80% cache hit rate
  });
});

