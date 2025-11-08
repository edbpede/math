/**
 * Tests for reactivity utilities (SolidJS batching)
 */

import { describe, it, expect, vi } from 'vitest';
import {
  batchUpdates,
  untrack,
  batchAsync,
  createBatchQueue,
  deferUntilIdle,
} from './reactivity';

describe('batchUpdates', () => {
  it('should batch multiple updates', () => {
    const fn = vi.fn();
    
    batchUpdates(() => {
      fn();
      fn();
      fn();
    });

    expect(fn).toHaveBeenCalledTimes(3);
  });

  it('should return the result of the batched function', () => {
    const result = batchUpdates(() => {
      return 42;
    });

    expect(result).toBe(42);
  });
});

describe('untrack', () => {
  it('should read values without creating dependencies', () => {
    const fn = vi.fn(() => 42);
    
    const result = untrack(fn);

    expect(result).toBe(42);
    expect(fn).toHaveBeenCalledTimes(1);
  });
});

describe('batchAsync', () => {
  it('should process operations in batches', async () => {
    const operations = Array.from({ length: 25 }, (_, i) => 
      vi.fn(async () => i)
    );

    const results = await batchAsync(operations, 10);

    expect(results).toHaveLength(25);
    expect(results[0]).toBe(0);
    expect(results[24]).toBe(24);
    operations.forEach((op) => expect(op).toHaveBeenCalledTimes(1));
  });

  it('should handle different batch sizes', async () => {
    const operations = Array.from({ length: 15 }, (_, i) =>
      vi.fn(async () => i * 2)
    );

    const results = await batchAsync(operations, 5);

    expect(results).toHaveLength(15);
    expect(results).toEqual([0, 2, 4, 6, 8, 10, 12, 14, 16, 18, 20, 22, 24, 26, 28]);
  });

  it('should handle errors in operations', async () => {
    const operations = [
      async () => 1,
      async () => {
        throw new Error('Test error');
      },
      async () => 3,
    ];

    await expect(batchAsync(operations, 2)).rejects.toThrow('Test error');
  });
});

describe('createBatchQueue', () => {
  it('should queue items and process them together', async () => {
    const processor = vi.fn(async (items: number[]) => {
      // Process all items
    });

    const { enqueue, flush, size } = createBatchQueue(processor, 100);

    enqueue(1);
    enqueue(2);
    enqueue(3);

    expect(size()).toBe(3);

    await flush();

    expect(processor).toHaveBeenCalledTimes(1);
    expect(processor).toHaveBeenCalledWith([1, 2, 3]);
    expect(size()).toBe(0);
  });

  it('should auto-flush after delay', async () => {
    const processor = vi.fn(async (items: number[]) => {
      // Process all items
    });

    const { enqueue } = createBatchQueue(processor, 10);

    enqueue(1);
    enqueue(2);

    // Wait for auto-flush
    await new Promise((resolve) => setTimeout(resolve, 15));

    expect(processor).toHaveBeenCalledTimes(1);
    expect(processor).toHaveBeenCalledWith([1, 2]);
  });

  it('should reset delay on new items', async () => {
    const processor = vi.fn(async (items: number[]) => {
      // Process all items
    });

    const { enqueue } = createBatchQueue(processor, 20);

    enqueue(1);
    await new Promise((resolve) => setTimeout(resolve, 10));
    enqueue(2); // Resets timer
    await new Promise((resolve) => setTimeout(resolve, 10));
    enqueue(3); // Resets timer again

    // Should not have flushed yet
    expect(processor).not.toHaveBeenCalled();

    // Wait for flush
    await new Promise((resolve) => setTimeout(resolve, 25));
    expect(processor).toHaveBeenCalledTimes(1);
    expect(processor).toHaveBeenCalledWith([1, 2, 3]);
  });
});

describe('deferUntilIdle', () => {
  it('should defer execution', async () => {
    const fn = vi.fn();

    deferUntilIdle(fn);

    expect(fn).not.toHaveBeenCalled();

    // Wait for execution
    await new Promise((resolve) => setTimeout(resolve, 10));

    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('should use timeout as fallback', async () => {
    const fn = vi.fn();

    deferUntilIdle(fn, { timeout: 5 });

    await new Promise((resolve) => setTimeout(resolve, 10));

    expect(fn).toHaveBeenCalledTimes(1);
  });
});

describe('Performance', () => {
  it('batchAsync should process large batches efficiently', async () => {
    const operations = Array.from({ length: 1000 }, (_, i) =>
      async () => i
    );

    const start = performance.now();
    await batchAsync(operations, 50);
    const duration = performance.now() - start;

    // Should complete reasonably fast (adjust based on system)
    expect(duration).toBeLessThan(1000);
  });

  it('createBatchQueue should handle high throughput', async () => {
    const processor = vi.fn(async (items: number[]) => {
      // Simulate some processing
      await new Promise((resolve) => setTimeout(resolve, 1));
    });

    const { enqueue } = createBatchQueue(processor, 10);

    const start = performance.now();
    for (let i = 0; i < 100; i++) {
      enqueue(i);
    }
    const enqueueDuration = performance.now() - start;

    // Enqueuing should be very fast
    expect(enqueueDuration).toBeLessThan(10);

    // Wait for processing
    await new Promise((resolve) => setTimeout(resolve, 20));

    // Should have batched all items into fewer calls
    expect(processor.mock.calls.length).toBeLessThan(10);
  });
});

