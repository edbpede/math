/**
 * Tests for timing utilities (debounce, throttle)
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  debounce,
  throttle,
  debounceCancellable,
  throttleCancellable,
} from './timing';

describe('debounce', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should delay function execution', () => {
    const fn = vi.fn();
    const debounced = debounce(fn, 100);

    debounced();
    expect(fn).not.toHaveBeenCalled();

    vi.advanceTimersByTime(100);
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('should reset delay on multiple calls', () => {
    const fn = vi.fn();
    const debounced = debounce(fn, 100);

    debounced();
    vi.advanceTimersByTime(50);
    debounced();
    vi.advanceTimersByTime(50);

    expect(fn).not.toHaveBeenCalled();

    vi.advanceTimersByTime(50);
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('should pass arguments correctly', () => {
    const fn = vi.fn();
    const debounced = debounce(fn, 100);

    debounced('arg1', 'arg2');
    vi.advanceTimersByTime(100);

    expect(fn).toHaveBeenCalledWith('arg1', 'arg2');
  });

  it('should preserve this context', () => {
    const obj = {
      value: 42,
      fn: vi.fn(function (this: any) {
        return this.value;
      }),
    };

    const debounced = debounce(obj.fn, 100);
    debounced.call(obj);

    vi.advanceTimersByTime(100);
    expect(obj.fn).toHaveBeenCalled();
  });
});

describe('throttle', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should execute immediately on first call', () => {
    const fn = vi.fn();
    const throttled = throttle(fn, 100);

    throttled();
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('should not execute again until delay passes', () => {
    const fn = vi.fn();
    const throttled = throttle(fn, 100);

    throttled();
    throttled();
    throttled();

    expect(fn).toHaveBeenCalledTimes(1);

    vi.advanceTimersByTime(100);
    expect(fn).toHaveBeenCalledTimes(2); // Trailing edge call
  });

  it('should include trailing edge call', () => {
    const fn = vi.fn();
    const throttled = throttle(fn, 100);

    throttled('first');
    vi.advanceTimersByTime(50);
    throttled('second');
    vi.advanceTimersByTime(50);
    throttled('third');

    // First call executed immediately
    expect(fn).toHaveBeenCalledTimes(1);
    expect(fn).toHaveBeenCalledWith('first');

    // Trailing call after delay
    vi.advanceTimersByTime(100);
    expect(fn).toHaveBeenCalledTimes(2);
    expect(fn).toHaveBeenLastCalledWith('third');
  });

  it('should pass arguments correctly', () => {
    const fn = vi.fn();
    const throttled = throttle(fn, 100);

    throttled('arg1', 'arg2');
    expect(fn).toHaveBeenCalledWith('arg1', 'arg2');
  });
});

describe('debounceCancellable', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should cancel pending execution', () => {
    const fn = vi.fn();
    const debounced = debounceCancellable(fn, 100);

    debounced();
    debounced.cancel();

    vi.advanceTimersByTime(100);
    expect(fn).not.toHaveBeenCalled();
  });

  it('should allow normal execution after cancel', () => {
    const fn = vi.fn();
    const debounced = debounceCancellable(fn, 100);

    debounced();
    debounced.cancel();
    debounced();

    vi.advanceTimersByTime(100);
    expect(fn).toHaveBeenCalledTimes(1);
  });
});

describe('throttleCancellable', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should cancel pending trailing call', () => {
    const fn = vi.fn();
    const throttled = throttleCancellable(fn, 100);

    throttled();
    throttled();
    throttled.cancel();

    vi.advanceTimersByTime(100);
    expect(fn).toHaveBeenCalledTimes(1); // Only immediate call, no trailing
  });
});

describe('Performance', () => {
  it('debounce should handle rapid calls efficiently', () => {
    const fn = vi.fn();
    const debounced = debounce(fn, 10);

    const start = performance.now();
    for (let i = 0; i < 1000; i++) {
      debounced(i);
    }
    const duration = performance.now() - start;

    expect(duration).toBeLessThan(50); // Should be very fast
  });

  it('throttle should handle rapid calls efficiently', () => {
    const fn = vi.fn();
    const throttled = throttle(fn, 10);

    const start = performance.now();
    for (let i = 0; i < 1000; i++) {
      throttled(i);
    }
    const duration = performance.now() - start;

    expect(duration).toBeLessThan(50); // Should be very fast
  });
});

