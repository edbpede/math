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
})
