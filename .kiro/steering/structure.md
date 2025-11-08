# Project Structure

## Directory Organization

```
src/
├── components/          # UI components
│   ├── islands/        # SolidJS interactive components (client-side)
│   ├── layouts/        # Astro layout components
│   └── static/         # Astro static components (Header, Footer, etc.)
├── lib/                # Core business logic
│   ├── accessibility/  # A11y utilities (announcer, focus-trap, math-to-speech)
│   ├── auth/          # UUID authentication system
│   ├── curriculum/    # Curriculum type definitions
│   ├── exercises/     # Exercise generation and validation
│   │   └── templates/ # Exercise templates by competency area
│   ├── i18n/          # Internationalization system
│   ├── mastery/       # SRS, mastery calculation, streak tracking
│   ├── offline/       # PWA, IndexedDB, sync manager
│   ├── preferences/   # User preferences management
│   ├── session/       # Practice session composition
│   ├── stores/        # Nanostores (network status, etc.)
│   ├── supabase/      # Supabase client and queries
│   └── types/         # Shared type definitions
├── locales/           # Translation files (JSON)
│   ├── da-DK/         # Danish translations
│   └── en-US/         # English translations
├── pages/             # Astro pages (file-based routing)
│   ├── api/           # API endpoints
│   │   ├── auth/      # Authentication endpoints
│   │   └── preferences/ # Preferences endpoints
│   └── practice/      # Practice session pages
├── styles/            # Global CSS
└── middleware.ts      # Session validation middleware

public/                # Static assets
├── fonts/             # OpenDyslexic font files
├── icons/             # PWA icons (generated at build)
├── manifest.json      # PWA manifest
└── sw.js             # Service worker

scripts/               # Build and utility scripts
├── generate-pwa-icons.ts
├── generate-cache-manifest.ts
├── uninstall-sw.ts
└── validate-translations.ts

supabase/              # Supabase configuration
└── migrations/        # Database migrations
```

## Component Architecture

### Islands (SolidJS)

Interactive components that hydrate on the client. Use for:
- Forms and user input
- Real-time state updates
- Complex interactions
- Client-side data fetching

Examples: `ExercisePractice`, `LanguageSelector`, `ProgressDashboard`

### Static Components (Astro)

Server-rendered components with no client-side JavaScript. Use for:
- Headers, footers, navigation
- Static content
- SEO-critical content

Examples: `Header.astro`, `Footer.astro`, `SkipNavigation.astro`

## Library Organization

### Core Modules

- **auth/**: UUID generation, session management, user CRUD
- **exercises/**: Template registry, parameter generation, validation, hints
- **i18n/**: Translation loading, locale switching, context pools
- **mastery/**: SRS algorithm, mastery calculation, review scheduling
- **offline/**: Cache config, sync manager, conflict resolution, IndexedDB storage

### Supporting Modules

- **accessibility/**: Screen reader support, keyboard shortcuts, touch targets
- **preferences/**: User settings (font, contrast, language)
- **session/**: Exercise session composition and management
- **supabase/**: Database client and progress tracking

## File Naming Conventions

- **Components**: PascalCase (e.g., `ExercisePractice.tsx`)
- **Libraries**: kebab-case (e.g., `hint-tracker.ts`)
- **Tests**: Same name with `.test.ts` or `.test.tsx` suffix
- **Types**: `types.ts` in each module directory
- **Index files**: `index.ts` for public exports

## Testing Strategy

- **Unit tests**: Logic in `src/lib/` modules
- **Component tests**: Islands in `src/components/islands/`
- **Test location**: Co-located with source files (`.test.ts` next to `.ts`)
- **Environment**: 
  - `happy-dom` for component tests (TSX)
  - `node` for logic tests (TS)

## Translation Structure

Each locale has separate JSON files by domain:
- `common.json` - UI strings, buttons, labels
- `auth.json` - Authentication messages
- `exercises.json` - Exercise session strings
- `feedback.json` - Correct/incorrect feedback
- `hints.json` - Hint system strings
- `contexts.json` - Context pools (names, places, items)
- `competencies.json` - Competency area names
- `navigation.json` - Menu and routing
- `progress.json` - Progress tracking strings
- `settings.json` - Settings page strings
- `errors.json` - Error messages
- `accessibility.json` - Screen reader announcements
- `solutions.json` - Worked solution strings
- `sync.json` - Sync status messages

## API Routes

RESTful endpoints in `src/pages/api/`:
- `POST /api/auth/generate` - Generate new UUID
- `POST /api/auth/signin` - Sign in with UUID
- `POST /api/auth/signout` - Sign out
- `GET /api/auth/session` - Get current session
- `GET /api/preferences/get` - Get user preferences
- `POST /api/preferences/update` - Update preferences

## Exercise Templates

Located in `src/lib/exercises/templates/` organized by competency area:
- Each template exports: metadata, parameters, generate(), validate(), hints[]
- Templates registered in `template-registry.ts`
- Tests co-located with templates

## Key Patterns

- **Islands Architecture**: Minimal JavaScript, hydrate only interactive components
- **Offline-First**: IndexedDB primary, Supabase sync secondary
- **Type Safety**: Strict TypeScript, no `any` types
- **Accessibility**: ARIA labels, keyboard navigation, screen reader support
- **Mobile-First**: Responsive design starting from mobile breakpoints
- **Privacy-First**: No PII collection, UUID-only identification
