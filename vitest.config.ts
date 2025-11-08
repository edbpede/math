import { defineConfig } from 'vitest/config';
import { resolve } from 'path';
import solid from 'vite-plugin-solid';

// Vite plugin to force solid-js/web to use client build
const solidJsWebClientPlugin = () => ({
  name: 'solid-js-web-client',
  enforce: 'pre', // Run before other plugins
  resolveId(id: string, importer?: string) {
    // Intercept solid-js/web imports and force client build
    // Match both 'solid-js/web' and any path ending with it
    if (id === 'solid-js/web' || id.includes('solid-js/web')) {
      const clientPath = resolve(__dirname, 'node_modules/solid-js/web/dist/web.js');
      // Return the resolved path - Vite will use this instead of the default resolution
      return clientPath;
    }
    return null;
  },
});

export default defineConfig({
  plugins: [
    solidJsWebClientPlugin(),
    solid({
      // Configure SolidJS for test environment
      // Use DOM renderer (not SSR)
      ssr: false,
    }),
  ],
  // Configure Vite to use client-side rendering for SolidJS in tests
  define: {
    // Force SolidJS to use client mode
    'process.env.SOLID_SSR': 'false',
  },
  // Configure optimizeDeps to force browser build for solid-js/web
  optimizeDeps: {
    include: ['solid-js/web'],
    esbuildOptions: {
      conditions: ['browser', 'development', 'module', 'import', 'default'],
    },
  },
  test: {
    globals: true,
    environment: 'node',
    include: ['src/**/*.test.ts', 'src/**/*.test.tsx', 'src/**/*.spec.ts', 'src/**/*.spec.tsx'],
    setupFiles: [
      './src/test/setup.ts', // Base setup (runs for all environments)
      './src/test/setup-solidjs-client.ts', // SolidJS client mode (must be before setup-browser)
      './src/test/setup-browser.ts', // Browser setup (checks environment internally)
    ],
    environmentMatchGlobs: [
      // Use happy-dom for component tests (TSX files) - better for SolidJS
      ['src/components/**/*.test.tsx', 'happy-dom'],
      ['src/components/**/*.spec.tsx', 'happy-dom'],
    ],
    // Configure environment variables for tests
    env: {
      // Force SolidJS to run in client mode (not SSR)
      SOLID_SSR: 'false',
    },
    // Configure server dependencies to use browser resolution for solid-js/web
    server: {
      deps: {
        // Force browser resolution for solid-js/web to use client build
        conditions: ['browser', 'development', 'module', 'import', 'default'],
        inline: ['solid-js/web', '@solidjs/testing-library'], // Force inline processing
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
      // Force solid-js/web to use client build in tests
      // This prevents "Client-only API called on the server side" errors
      // Use absolute path to ensure correct resolution
      'solid-js/web': resolve(process.cwd(), 'node_modules/solid-js/web/dist/web.js'),
    },
    // Ensure solid-js/web resolves to client build (browser condition)
    // This must be set to prioritize browser over node condition
    conditions: ['browser', 'development', 'module', 'import', 'default'],
  },
});
