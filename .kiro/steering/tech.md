# Technology Stack

## Core Framework

- **Astro 5**: Static site generation with islands architecture
- **SolidJS**: Reactive UI components for interactive islands
- **TypeScript**: Strict mode enabled with comprehensive type safety
- **Bun**: Package manager and runtime

## Styling

- **UnoCSS**: Atomic CSS with Tailwind compatibility (200x faster than Tailwind)
- Presets: Wind (Tailwind-compatible), Attributify, Icons
- Custom shortcuts for buttons, touch targets, accessibility
- Mobile-first breakpoints: sm(640px), md(768px), lg(1024px)

## State Management

- **Nanostores**: Lightweight reactive stores for cross-island state
- `@nanostores/persistent`: LocalStorage persistence
- `@nanostores/solid`: SolidJS integration

## Backend & Data

- **Supabase**: PostgreSQL database with real-time subscriptions
- **IndexedDB** (via `idb`): Offline storage for exercises and progress
- **Service Worker**: PWA with offline-first caching strategy

## Testing

- **Vitest**: Unit and component testing (required - Bun's native test runner is incompatible)
- **@solidjs/testing-library**: SolidJS component testing
- **@testing-library/jest-dom**: DOM matchers
- **fake-indexeddb**: IndexedDB mocking
- **happy-dom**: DOM environment for component tests
- **jsdom**: Node environment for logic tests

> **⚠️ IMPORTANT:** Always use `bun run test`, NOT `bun test`
> Bun's native test runner does not support browser environments (no DOM).

## Build & Development

### Common Commands

```bash
# Development
bun install              # Install dependencies
bun run dev             # Start dev server at localhost:4321

# Building
bun run build           # Build production site to ./dist/
                        # Includes: PWA icon generation + cache manifest

# Testing
bun run test            # Run tests in watch mode (use this, not `bun test`!)
bun run test:run        # Run tests once (CI mode)
bun run test:ui         # Open Vitest UI

# Validation
bun run validate-translations              # Validate all translations
bun run validate-translations:locale       # Validate specific locale
bun run validate-translations:component    # Validate specific component

# Service Worker
bun run sw:clear        # Uninstall service worker

# Preview
bun run preview         # Preview production build locally
```

### Build Process

1. Generate PWA icons from base SVG
2. Run Astro build (SSG)
3. Generate cache manifest for offline assets

## Path Aliases

```typescript
@/lib/*         → src/lib/*
@/components/*  → src/components/*
@/pages/*       → src/pages/*
@/styles/*      → src/styles/*
@/locales/*     → src/locales/*
```

## TypeScript Configuration

- Extends `astro/tsconfigs/strict`
- JSX: `preserve` with `solid-js` import source
- Strict mode: All strict flags enabled
- No unused locals/parameters
- No implicit returns
- No fallthrough cases

## Environment Variables

Required for Supabase integration:
- `PUBLIC_SUPABASE_URL`
- `PUBLIC_SUPABASE_ANON_KEY`

See `.env.example` for template.

## Deployment Notes

- Output: `static` (SSG) - change to `server` or `hybrid` for API routes with httpOnly cookies
- Adapters available: Vercel, Netlify, Node
- PWA assets generated at build time
- Service worker registered client-side
