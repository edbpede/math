/**
 * SolidJS Client Mode Setup
 * 
 * This file must be loaded FIRST to ensure solid-js/web uses the client build
 * instead of the server build. This prevents "Client-only API called on the server side" errors.
 */

import { vi } from 'vitest';

// CRITICAL: Configure SolidJS for client mode BEFORE any imports
if (typeof process !== 'undefined') {
  process.env.SOLID_SSR = 'false';
}
(globalThis as any).__SOLID_SSR__ = false;

// Mock solid-js/web to use client build instead of server build
// This must be done before @solidjs/testing-library imports it
// Note: vi.mock is hoisted, so we can't use dynamic imports or top-level variables
// Instead, we rely on the Vite plugin and alias configuration in vitest.config.ts
// to force the client build. This file just sets up the environment variables.

