---
inclusion: always
---

# Tech Stack

## Core Technologies

- **Astro** (v5.15.3): Static site generator with island architecture for optimal performance
- **SolidJS** (v1.9.10): Fine-grained reactive UI library for interactive islands
- **TypeScript**: Strict mode enabled for type safety throughout
- **UnoCSS** (v66.5.4): Atomic CSS engine with minimal runtime overhead
- **Supabase**: Backend-as-a-Service (PostgreSQL + Auth + Realtime)

## Architecture Patterns

- **Island Architecture**: Static HTML with selective hydration for interactivity
- **Offline-First**: Service worker + IndexedDB for full offline capability
- **Privacy by Design**: UUID-only authentication, no personal data collection
- **Template-Based Content**: Client-side exercise generation from templates

## Build System

- **Package Manager**: npm
- **Module System**: ES Modules (`"type": "module"`)
- **JSX Runtime**: SolidJS (`jsxImportSource: "solid-js"`)
- **Type Checking**: TypeScript strict mode with path aliases

## Common Commands

Run all commands from the project root:

- `npm install` - Install dependencies
- `npm run dev` - Start development server at `localhost:4321`
- `npm run build` - Build production site to `./dist/`
- `npm run preview` - Preview production build locally
- `npm run astro` - Run Astro CLI commands

## Key Dependencies (to be added)

- `@supabase/supabase-js` - Supabase client library
- `workbox-*` - Service worker utilities for offline functionality
- `idb` - IndexedDB wrapper for local storage

## Configuration Files

- `astro.config.mjs` - Astro configuration with SolidJS and UnoCSS integrations
- `tsconfig.json` - TypeScript configuration with strict mode and path aliases
- `package.json` - Project dependencies and scripts
- `uno.config.ts` - UnoCSS configuration (to be created)

## Development Principles

- **Type Safety First**: All data structures have TypeScript definitions
- **Performance**: Target <2s page load, <3s time to interactive
- **Accessibility**: WCAG 2.1 AA compliance throughout
- **Internationalization**: Danish primary, English from launch
- **Curriculum Fidelity**: Explicit mapping to Danish Fælles Mål at every level
