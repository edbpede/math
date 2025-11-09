/**
 * Vitest Test Setup File - Consolidated
 *
 * All test setup in one file (following SolidJS best practices).
 * - DOM initialization for jsdom
 * - SolidJS client-side configuration
 * - Environment variables
 * - IndexedDB mocking
 * - SolidJS testing library setup
 * - Browser API mocks
 */

// ============================================================================
// DOM Initialization (MUST BE FIRST - before any imports)
// ============================================================================

// Ensure jsdom's DOM is fully initialized before SolidJS loads
if (typeof window !== 'undefined' && typeof document !== 'undefined') {
  // Ensure document.body exists for @solidjs/testing-library
  if (!document.body) {
    const body = document.createElement('body');
    document.documentElement.appendChild(body);
  }

  // Configure SolidJS for client-side rendering (not SSR)
  // This MUST be set before any solid-js imports
  globalThis.SOLID_SSR = false;
  (globalThis as any).__SOLID_SSR__ = false;
}

import { beforeEach, afterEach, vi } from 'vitest';
import { cleanup } from '@solidjs/testing-library';
import '@testing-library/jest-dom/vitest';
import 'fake-indexeddb/auto';
import { initI18n, changeLocale } from '@/lib/i18n';

// ============================================================================
// Environment Variables
// ============================================================================

vi.stubEnv('PUBLIC_SUPABASE_URL', 'https://test.supabase.co');
vi.stubEnv('PUBLIC_SUPABASE_ANON_KEY', 'test-anon-key');

// ============================================================================
// I18n Initialization
// ============================================================================

// Initialize i18n system globally for all tests
// This ensures translations are loaded before any tests run
await initI18n();
await changeLocale('en-US'); // Default to English for consistent test assertions

// ============================================================================
// SolidJS Testing Library Setup
// ============================================================================

// Cleanup after each test to prevent test pollution
afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

// ============================================================================
// Browser API Mocks
// ============================================================================

// Clipboard API
Object.defineProperty(navigator, 'clipboard', {
  value: {
    writeText: vi.fn().mockResolvedValue(undefined),
    readText: vi.fn().mockResolvedValue(''),
  },
  writable: true,
  configurable: true,
});

// ClipboardEvent and DataTransfer for paste event testing
global.DataTransfer = class DataTransfer {
  private data: Map<string, string> = new Map();

  getData(format: string): string {
    return this.data.get(format) || '';
  }

  setData(format: string, data: string): void {
    this.data.set(format, data);
  }

  clearData(format?: string): void {
    if (format) {
      this.data.delete(format);
    } else {
      this.data.clear();
    }
  }

  get types(): string[] {
    return Array.from(this.data.keys());
  }
} as any;

global.ClipboardEvent = class ClipboardEvent extends Event {
  clipboardData: DataTransfer | null;

  constructor(type: string, eventInitDict?: ClipboardEventInit) {
    super(type, eventInitDict);
    this.clipboardData = eventInitDict?.clipboardData || new DataTransfer();
  }
} as any;

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
