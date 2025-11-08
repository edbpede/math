// @ts-check
import { defineConfig } from 'astro/config'
import solidJs from '@astrojs/solid-js'
import UnoCSS from 'unocss/astro'

// https://astro.build/config
export default defineConfig({
  // NOTE: API routes with httpOnly cookies require server-side rendering
  // For production deployment, add an adapter:
  // - Vercel: @astrojs/vercel/serverless
  // - Netlify: @astrojs/netlify/functions
  // - Node: @astrojs/node
  // Then change output to 'server' or 'hybrid'
  // See: https://docs.astro.build/en/guides/on-demand-rendering/
  output: 'static',

  integrations: [
    solidJs(),
    UnoCSS(),
  ],

  vite: {
    build: {
      rollupOptions: {
        output: {
          // Configure manual chunks for better code splitting
          manualChunks(id) {
            // Vendor chunks: separate large dependencies
            if (id.includes('node_modules')) {
              // Supabase in separate chunk (large dependency)
              if (id.includes('@supabase/supabase-js')) {
                return 'supabase'
              }
              
              // QR code library (used only in UUID generation)
              if (id.includes('qrcode')) {
                return 'qrcode'
              }
              
              // SolidJS core and nanostores
              if (id.includes('solid-js') || id.includes('nanostores')) {
                return 'solid-core'
              }
              
              // IndexedDB wrapper
              if (id.includes('idb')) {
                return 'idb'
              }
              
              // Other vendor dependencies in shared vendor chunk
              return 'vendor'
            }
            
            // Application chunks: separate by functional area
            // Exercise generation system
            if (id.includes('/src/lib/exercises/')) {
              return 'exercises'
            }
            
            // Mastery and SRS system
            if (id.includes('/src/lib/mastery/')) {
              return 'mastery'
            }
            
            // Offline/PWA functionality
            if (id.includes('/src/lib/offline/')) {
              return 'offline'
            }
            
            // Large island components
            if (id.includes('ExercisePractice.tsx')) {
              return 'island-practice'
            }
            
            if (id.includes('ProgressDashboard.tsx')) {
              return 'island-dashboard'
            }
            
            if (id.includes('UUIDGenerator.tsx')) {
              return 'island-uuid-gen'
            }
            
            if (id.includes('UUIDLogin.tsx')) {
              return 'island-uuid-login'
            }
            
            if (id.includes('SettingsForm.tsx')) {
              return 'island-settings'
            }
          },
        },
      },
      // Set chunk size warning limit (500kb)
      chunkSizeWarningLimit: 500,
    },
  },
})
