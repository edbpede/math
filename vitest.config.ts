import { defineConfig } from 'vitest/config';
import { resolve } from 'path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['src/**/*.test.ts', 'src/**/*.test.tsx', 'src/**/*.spec.ts', 'src/**/*.spec.tsx'],
    setupFiles: [
      './src/test/setup.ts', // Base setup (runs for all environments)
      './src/test/setup-browser.ts', // Browser setup (checks environment internally)
    ],
    environmentMatchGlobs: [
      // Use happy-dom for component tests (TSX files) - better for SolidJS
      ['src/components/**/*.test.tsx', 'happy-dom'],
      ['src/components/**/*.spec.tsx', 'happy-dom'],
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
