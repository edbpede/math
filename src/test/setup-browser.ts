/**
 * Browser-Specific Test Setup File
 *
 * This file runs for all test environments but only executes browser-specific
 * setup when running in a browser environment (happy-dom/jsdom).
 * It sets up SolidJS testing library, jest-dom matchers, and browser API mocks.
 */

import { beforeEach, afterEach, vi } from 'vitest';

// Only execute browser setup if we're in a browser environment
if (typeof window !== 'undefined' && typeof document !== 'undefined') {
  // Import browser testing utilities
  // These imports are evaluated at module load time, but the code inside
  // the conditional only runs in browser environments where they're needed.
  // In node environments, this entire block is skipped.
  const { cleanup } = await import('@solidjs/testing-library');
  await import('@testing-library/jest-dom/vitest');

  // Cleanup after each test to prevent test pollution
  // This must be registered synchronously during module evaluation
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  // Mock browser APIs that aren't available in jsdom/happy-dom

  // Clipboard API
  Object.defineProperty(navigator, 'clipboard', {
    value: {
      writeText: vi.fn().mockResolvedValue(undefined),
      readText: vi.fn().mockResolvedValue(''),
    },
    writable: true,
    configurable: true,
  });

  // FileReader API (for QR code generation)
  global.FileReader = class FileReader {
    readAsDataURL() {}
    addEventListener(event: string, callback: Function) {
      if (event === 'load') {
        setTimeout(() => callback({ target: { result: 'data:image/png;base64,mock' } }), 0);
      }
    }
    removeEventListener() {}
  } as any;

  // Blob API
  global.Blob = class Blob {
    constructor(parts: BlobPart[], options?: BlobPropertyBag) {}
  } as any;

  // URL.createObjectURL
  global.URL.createObjectURL = vi.fn(() => 'blob:mock-url');
  global.URL.revokeObjectURL = vi.fn();

  // localStorage mock
  const localStorageMock = (() => {
    let store: Record<string, string> = {};

    return {
      getItem: (key: string) => store[key] || null,
      setItem: (key: string, value: string) => {
        store[key] = value.toString();
      },
      removeItem: (key: string) => {
        delete store[key];
      },
      clear: () => {
        store = {};
      },
      get length() {
        return Object.keys(store).length;
      },
      key: (index: number) => {
        const keys = Object.keys(store);
        return keys[index] || null;
      },
    };
  })();

  Object.defineProperty(window, 'localStorage', {
    value: localStorageMock,
    writable: true,
  });

  // Reset localStorage before each test
  beforeEach(() => {
    localStorageMock.clear();
  });

  // fetch API mock
  global.fetch = vi.fn(() =>
    Promise.resolve({
      ok: true,
      status: 200,
      json: () => Promise.resolve({}),
      text: () => Promise.resolve(''),
      blob: () => Promise.resolve(new Blob()),
    } as Response)
  );

  // matchMedia mock (for responsive design tests)
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation((query) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  });

  // IntersectionObserver mock
  global.IntersectionObserver = class IntersectionObserver {
    constructor() {}
    disconnect() {}
    observe() {}
    takeRecords() {
      return [];
    }
    unobserve() {}
  } as any;

  // ResizeObserver mock
  global.ResizeObserver = class ResizeObserver {
    constructor() {}
    disconnect() {}
    observe() {}
    unobserve() {}
  } as any;

  // HTMLCanvasElement.getContext mock (for QR code canvas)
  HTMLCanvasElement.prototype.getContext = vi.fn().mockReturnValue({
    fillRect: vi.fn(),
    clearRect: vi.fn(),
    getImageData: vi.fn(),
    putImageData: vi.fn(),
    createImageData: vi.fn(),
    setTransform: vi.fn(),
    drawImage: vi.fn(),
    save: vi.fn(),
    fillText: vi.fn(),
    restore: vi.fn(),
    beginPath: vi.fn(),
    moveTo: vi.fn(),
    lineTo: vi.fn(),
    closePath: vi.fn(),
    stroke: vi.fn(),
    translate: vi.fn(),
    scale: vi.fn(),
    rotate: vi.fn(),
    arc: vi.fn(),
    fill: vi.fn(),
    measureText: vi.fn().mockReturnValue({ width: 0 }),
    transform: vi.fn(),
    rect: vi.fn(),
    clip: vi.fn(),
  });

  // HTMLCanvasElement.toDataURL mock
  HTMLCanvasElement.prototype.toDataURL = vi.fn().mockReturnValue('data:image/png;base64,mock');

  // Mock window.scrollTo
  window.scrollTo = vi.fn();

  // Mock console methods to reduce noise in tests (optional)
  // Uncomment if you want to suppress console output during tests
  // global.console = {
  //   ...console,
  //   log: vi.fn(),
  //   debug: vi.fn(),
  //   info: vi.fn(),
  //   warn: vi.fn(),
  // };
}
