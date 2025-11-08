# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

An Arithmetic Practice Portal built with Astro, SolidJS, and Supabase. Features privacy-first UUID-based authentication (no personal data collection), internationalization (Danish/English), spaced repetition system (SRS) for learning optimization, and comprehensive progress tracking.

**Implementation Status**: Foundation phase complete. Core infrastructure (auth, i18n, database layer) is implemented. Exercise generation engine, mastery algorithms, and UI components are in active development. See [tasks.md](.kiro/specs/arithmetic-practice-portal/tasks.md) for detailed implementation plan.

## Development Commands

```bash
# Start development server (localhost:4321)
bun run dev

# Build for production
bun run build

# Preview production build
bun run preview

# Astro CLI commands
bun run astro -- <command>
bun run astro -- --help
```

## Tech Stack

- **Framework**: Astro 5 (SSG/SSR hybrid, currently static)
- **UI Library**: SolidJS (with islands architecture)
- **Database**: Supabase (PostgreSQL with RLS)
- **Styling**: UnoCSS (atomic CSS)
- **State**: Nanostores (reactive stores)
- **i18n**: Custom implementation with locale files

## Architecture

### Authentication System (UUID-Based)

The application uses **privacy-first anonymous authentication** with cryptographically secure UUIDs. No personal information is collected.

**Key components**:
- [src/lib/auth/](src/lib/auth/) - UUID generation, session management, user CRUD
- [src/pages/api/auth/](src/pages/api/auth/) - API endpoints (generate, signin, signout, session)
- [src/middleware.ts](src/middleware.ts) - Session validation middleware

**Session flow**:
1. User requests new account → `/api/auth/generate` (POST)
2. Server generates UUID, creates user in Supabase, returns formatted UUID
3. Session stored in httpOnly cookie: `math-session=<token>`
4. Middleware validates session on every request
5. User data available via `Astro.locals.user` in all pages

**UUID format**: `XXXX-XXXX-XXXX-XXXX` (19 chars, user-friendly)
**Session lifetime**: 24 hours (auto-refresh at 12 hours)
**Security**: HttpOnly, Secure, SameSite=Strict cookies

See [src/lib/auth/README.md](src/lib/auth/README.md) for detailed documentation.

### Internationalization (i18n)

Custom i18n system with Danish (da-DK) and English (en-US) support.

**Key components**:
- [src/lib/i18n/](src/lib/i18n/) - Translation loading, reactive stores, formatters
- [src/locales/](src/locales/) - Translation JSON files by locale
- State management via Nanostores for cross-island reactivity

**Translation files** (by category):
- `common.json` - General UI strings
- `auth.json` - Authentication strings
- `exercises.json`, `feedback.json`, `hints.json` - Exercise-related
- `contexts.json` - Context pools (names, places, items for exercises)
- `errors.json` - Error messages

**Usage in Astro pages**:
```typescript
const t = $t.get()
const title = t('common.app.title')
```

**Usage in SolidJS components**:
```typescript
import { useStore } from '@nanostores/solid'
import { $t } from '@/lib/i18n'

const t = useStore($t)
const title = t()('common.app.title')
```

**Interpolation**: Use `{{variable}}` syntax in translations
**Locale switching**: `await changeLocale('da-DK' | 'en-US')`

See [src/lib/i18n/README.md](src/lib/i18n/README.md) for detailed usage examples.

### Database & Progress Tracking

Supabase PostgreSQL database with Row Level Security (RLS).

**Schema tables**:
- `users` - UUID-based user records (no personal data)
- `competency_progress` - Mastery tracking at competency area level
- `skills_progress` - Fine-grained progress with SRS parameters (SuperMemo 2)
- `exercise_history` - Append-only log of all exercise attempts
- `sessions` - Practice session tracking with statistics

**Data access layer**:
- [src/lib/supabase/progress.ts](src/lib/supabase/progress.ts) - All database operations
- Features: Type-safe operations, retry logic with exponential backoff, batch updates
- Error handling via `ProgressError` class

**Key features**:
- Batched updates for performance (Requirement 12.4)
- SRS scheduling for optimal review timing
- Session auto-refresh for continuous access
- RLS ensures users only access their own data

**Common operations**:
```typescript
import {
  fetchCompetencyProgress,
  updateSkillProgress,
  logExerciseAttempt,
  startSession,
  endSession
} from '@/lib/supabase/progress'
```

### TypeScript Path Aliases

Configure in [tsconfig.json](tsconfig.json):
```typescript
import { something } from '@/lib/auth'       // src/lib/auth
import { Component } from '@/components/*'   // src/components
import { Page } from '@/pages/*'             // src/pages
import styles from '@/styles/*'              // src/styles
import locale from '@/locales/*'             // src/locales
```

### Middleware

[src/middleware.ts](src/middleware.ts) runs on every request:
- Validates session cookies
- Attaches `Astro.locals.user` and `Astro.locals.session`
- Auto-refreshes sessions when needed
- Provides consistent auth state across application

Access user in any Astro page:
```typescript
const user = Astro.locals.user
if (!user) return Astro.redirect('/login')
```

## Supabase Setup

### Local Development

**Prerequisites**: Docker Desktop, Supabase CLI

```bash
# Install Supabase CLI (macOS)
brew install supabase/tap/supabase

# Start local Supabase (requires Docker)
supabase start

# Apply migrations
supabase db reset

# View local database UI
supabase studio  # or visit http://localhost:54323

# Generate TypeScript types after schema changes
supabase gen types typescript --local > src/lib/supabase/types.ts
```

**Environment variables**: Copy output from `supabase start` to `.env`

See [supabase/README.md](supabase/README.md) for detailed setup instructions.

### Production Deployment

```bash
# Link to Supabase project
supabase link --project-ref <your-project-ref>

# Push migrations to production
supabase db push

# Generate production types
supabase gen types typescript --project-id <id> > src/lib/supabase/types.ts
```

## Deployment Configuration

**Current mode**: Static output (SSG)
**Note**: API routes with httpOnly cookies require SSR. For production deployment:

1. Add an adapter to [astro.config.mjs](astro.config.mjs):
   - Vercel: `@astrojs/vercel/serverless`
   - Netlify: `@astrojs/netlify/functions`
   - Node: `@astrojs/node`
2. Change `output: 'static'` to `output: 'server'` or `output: 'hybrid'`

## Project Structure

```
src/
├── lib/
│   ├── auth/           # UUID auth system, session management
│   ├── i18n/           # Internationalization, translation loading
│   ├── supabase/       # Database client, progress tracking DAL
│   ├── curriculum/     # Types for competency areas, grade ranges
│   ├── exercises/      # Types for exercise templates
│   └── mastery/        # Types for progress tracking, SRS
├── pages/
│   ├── api/auth/       # Auth API endpoints
│   └── *.astro         # Astro pages (file-based routing)
├── components/         # SolidJS components (islands)
├── locales/            # Translation JSON files (da-DK, en-US)
├── middleware.ts       # Auth middleware (runs on all requests)
└── env.d.ts            # TypeScript environment types

supabase/
├── migrations/         # Database schema migrations
└── README.md           # Supabase setup guide
```

## Key Requirements & Patterns

### Privacy-First Design
- **No personal data collection** - users identified solely by UUID
- Row Level Security (RLS) enforces data isolation at database level
- HttpOnly cookies prevent XSS attacks

### Progress Tracking Pattern
1. Start session: `startSession(userId, gradeRange)`
2. Log each exercise: `logExerciseAttempt(attempt)`
3. Update progress: `updateSkillProgress(userId, progress)` or use batch operations
4. End session: `endSession(sessionId, stats)`

### Spaced Repetition System (SRS)
- SuperMemo 2 algorithm implementation
- `fetchSkillsDueForReview()` returns skills needing practice
- SRS parameters stored per skill: easeFactor, interval, repetitionCount
- Next review date calculated automatically

### Batched Updates
Use batch operations for performance when updating multiple records:
```typescript
batchUpdateSkillProgress(userId, progressList)
batchUpdateCompetencyProgress(userId, progressList)
batchLogExerciseAttempts(attempts)
```

### Error Handling
All database operations include:
- Exponential backoff retry logic (3 attempts max)
- Type-safe error returns via `ProgressError` class
- Graceful degradation on failure

## TypeScript Configuration

Strict mode enabled with:
- `strictNullChecks: true`
- `noImplicitAny: true`
- `noUnusedLocals: true`
- `noUnusedParameters: true`
- `noImplicitReturns: true`

All code should maintain strict type safety.

## File References

When referencing code locations in documentation or comments, use this format:
- Files: `src/lib/auth/service.ts`
- Specific lines: `src/lib/auth/service.ts:142`
- Line ranges: `src/middleware.ts:58-102`
