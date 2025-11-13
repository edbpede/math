// @ts-check
import { defineConfig } from "astro/config";
import solidJs from "@astrojs/solid-js";
import UnoCSS from "unocss/astro";

// https://astro.build/config
export default defineConfig({
  // NOTE: API routes with httpOnly cookies require server-side rendering
  // For production deployment, add an adapter:
  // - Vercel: @astrojs/vercel/serverless
  // - Netlify: @astrojs/netlify/functions
  // - Node: @astrojs/node
  // Then change output to 'server' or 'hybrid'
  // See: https://docs.astro.build/en/guides/on-demand-rendering/
  output: "static",

  integrations: [solidJs(), UnoCSS()],

  vite: {
    build: {
      // Enable source maps for production debugging (Requirement 18.1)
      // Source maps are separate files, only loaded when DevTools is open
      sourcemap: true,

      rollupOptions: {
        output: {
          // Configure manual chunks for better code splitting (Requirement 13.3)
          manualChunks(id) {
            // Vendor chunks: separate large dependencies
            if (id.includes("node_modules")) {
              // Supabase in separate chunk (large dependency)
              if (id.includes("@supabase/supabase-js")) {
                return "supabase";
              }

              // QR code library (used only in UUID generation)
              if (id.includes("qrcode")) {
                return "qrcode";
              }

              // SolidJS core and nanostores
              if (id.includes("solid-js") || id.includes("nanostores")) {
                return "solid-core";
              }

              // IndexedDB wrapper
              if (id.includes("idb")) {
                return "idb";
              }

              // Other vendor dependencies in shared vendor chunk
              return "vendor";
            }

            // Application chunks: separate by functional area
            // Exercise generation system
            if (id.includes("/src/lib/exercises/")) {
              return "exercises";
            }

            // Mastery and SRS system
            if (id.includes("/src/lib/mastery/")) {
              return "mastery";
            }

            // Offline/PWA functionality
            if (id.includes("/src/lib/offline/")) {
              return "offline";
            }

            // Large island components (lazy loaded)
            if (id.includes("ExercisePractice.tsx")) {
              return "island-practice";
            }

            if (id.includes("ProgressDashboard.tsx")) {
              return "island-dashboard";
            }

            if (id.includes("UUIDGenerator.tsx")) {
              return "island-uuid-gen";
            }

            if (id.includes("UUIDLogin.tsx")) {
              return "island-uuid-login";
            }

            if (id.includes("SettingsForm.tsx")) {
              return "island-settings";
            }

            // Return undefined for all other modules (default chunk)
            return undefined;
          },
        },
      },

      // Set chunk size warning limit (500kb)
      chunkSizeWarningLimit: 500,

      // Enable minification and compression (Requirement 13.5)
      minify: "terser",
      terserOptions: {
        compress: {
          drop_console: true, // Remove console.log in production
          drop_debugger: true,
          pure_funcs: ["console.log", "console.info", "console.debug"],
        },
        mangle: true,
        format: {
          comments: false, // Remove comments
        },
      },

      // Enable CSS minification (Requirement 13.5)
      cssMinify: true,

      // Report compressed size for monitoring
      reportCompressedSize: true,

      // Inline assets smaller than 4KB (Requirement 13.4)
      assetsInlineLimit: 4096,
    },
  },
});
