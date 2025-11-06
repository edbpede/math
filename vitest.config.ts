import { defineConfig } from 'vitest/config';
import { resolve } from 'path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['src/**/*.test.ts', 'src/**/*.test.tsx', 'src/**/*.spec.ts', 'src/**/*.spec.tsx'],
    environmentMatchGlobs: [
      // Use jsdom for component tests (TSX files)
      ['src/components/**/*.test.tsx', 'jsdom'],
      ['src/components/**/*.spec.tsx', 'jsdom'],
    ],
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
  },
});
