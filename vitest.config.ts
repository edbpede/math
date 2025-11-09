import { defineConfig } from 'vitest/config';
import { resolve } from 'path';
import solid from 'vite-plugin-solid';

/**
 * Vitest Configuration - SolidJS + jsdom
 *
 * Configures Vitest for SolidJS component testing with jsdom.
 * Key configurations:
 * - jsdom environment for DOM testing
 * - deps.inline to prevent solid-js double-loading
 * - resolve.conditions for browser environment
 * - transformMode for proper JSX handling
 *
 * See: https://docs.solidjs.com/guides/testing
 */
export default defineConfig({
  plugins: [solid()],
  test: {
    globals: true,
    environment: 'jsdom',
    include: ['src/**/*.test.ts', 'src/**/*.test.tsx', 'src/**/*.spec.ts', 'src/**/*.spec.tsx'],
    setupFiles: ['./src/test/setup.ts'],
    // Transform JSX files in web mode (for SolidJS)
    transformMode: {
      web: [/\.[jt]sx?$/],
    },
    // Inline solid-js packages to prevent double-loading (Vitest 1.x+ syntax)
    server: {
      deps: {
        inline: [/solid-js/, /@solidjs/],
      },
    },
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
      '@/lib': resolve(__dirname, './src/lib'),
      '@/components': resolve(__dirname, './src/components'),
      '@/pages': resolve(__dirname, './src/pages'),
      '@/styles': resolve(__dirname, './src/styles'),
      '@/locales': resolve(__dirname, './src/locales'),
    },
    // Use browser resolution for SolidJS in tests (browser must come before development)
    conditions: ['browser', 'development'],
  },
});
