# Arithmetic Practice Portal - Architectural Guide

## Overview

This is a **Danish mathematics practice application** built as a Progressive Web App (PWA) targeting grades 0-9. The application is a privacy-focused, offline-first educational platform that uses UUID-based authentication (no email/password) and provides adaptive learning through spaced repetition and mastery tracking.

**Tech Stack:**
- Astro 5.x (Static Site Generator with SSR middleware)
- SolidJS (Reactive UI framework)
- Supabase (PostgreSQL backend + Realtime)
- UnoCSS (Atomic CSS)
- Nanostores (State management)
- IndexedDB (Offline storage)
- Vitest (Testing)

## Application Type

**Progressive Web App (PWA)** with:
- Service Worker for offline functionality
- Install prompts for iOS/Android
- Manifest.json for native-like experience
- Multi-language support (Danish/English)
- Comprehensive accessibility features

**Deployment Mode:** Currently static (`output: 'static'`), but designed to support SSR with adapters (Vercel/Netlify/Node) for production with authenticated API routes.

---

## Architecture Overview

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    CLIENT (Browser)                          │
├─────────────────────────────────────────────────────────────┤
│  Astro Pages (.astro)                                       │
│  ├─ Landing (/index.astro)                                  │
│  ├─ Dashboard (/dashboard.astro)                            │
│  ├─ Practice Session (/practice/[uuid].astro)              │
│  └─ Settings (/settings.astro)                             │
│                                                              │
│  SolidJS Islands (client:load/idle/visible)                │
│  ├─ ExercisePractice.tsx (main practice UI)                │
│  ├─ ProgressDashboard.tsx (mastery visualizations)         │
│  ├─ UUIDGenerator.tsx / UUIDLogin.tsx (auth flows)         │
│  └─ SettingsForm.tsx (preferences)                         │
│                                                              │
│  State Management (Nanostores)                              │
│  ├─ $networkStatus (online/offline state)                  │
│  ├─ $syncStatus (sync queue status)                        │
│  └─ $locale (i18n state)                                   │
│                                                              │
│  Offline Layer (IndexedDB + Service Worker)                │
│  ├─ offlineStorage (idb wrapper)                           │
│  ├─ syncManager (queue operations)                         │
│  └─ sw.js (cache strategies)                               │
├─────────────────────────────────────────────────────────────┤
│                    MIDDLEWARE                                │
│  middleware.ts (Session validation on every request)        │
├─────────────────────────────────────────────────────────────┤
│                    API ROUTES                                │
│  /api/auth/* (UUID generation, signin/signout)             │
│  /api/preferences/* (settings sync)                         │
├─────────────────────────────────────────────────────────────┤
│                    BACKEND (Supabase)                        │
│  PostgreSQL Tables:                                          │
│  ├─ users (UUID-based accounts)                            │
│  ├─ competency_progress (high-level mastery)               │
│  ├─ skills_progress (granular mastery + SRS)               │
│  ├─ exercise_history (append-only attempt log)             │
│  └─ sessions (practice session tracking)                   │
│                                                              │
│  Realtime: Cross-device sync notifications                 │
└─────────────────────────────────────────────────────────────┘
```

---

## Directory Structure

```
/home/dev/GitHub/edbpede/math/
├── src/
│   ├── components/
│   │   ├── islands/          # SolidJS interactive components (client-side)
│   │   │   ├── ExercisePractice.tsx      # Main practice session UI
│   │   │   ├── ProgressDashboard.tsx     # Mastery visualization
│   │   │   ├── UUIDGenerator.tsx         # UUID creation flow
│   │   │   ├── UUIDLogin.tsx             # UUID authentication
│   │   │   ├── SettingsForm.tsx          # User preferences
│   │   │   ├── HintSystem.tsx            # 4-level hint system
│   │   │   ├── FeedbackDisplay.tsx       # Exercise feedback
│   │   │   └── OfflineIndicator.tsx      # Network status
│   │   ├── layouts/          # Astro layout components
│   │   │   └── MainLayout.astro          # Base layout with PWA setup
│   │   └── static/           # Static Astro components
│   │       ├── Header.astro
│   │       └── Footer.astro
│   │
│   ├── lib/                  # Core business logic (framework-agnostic)
│   │   ├── auth/             # Authentication & session management
│   │   │   ├── uuid.ts       # UUID generation/validation
│   │   │   ├── service.ts    # User CRUD operations
│   │   │   ├── session.ts    # JWT session tokens (httpOnly cookies)
│   │   │   └── rate-limiter.ts  # Server-side rate limiting
│   │   │
│   │   ├── exercises/        # Exercise generation engine
│   │   │   ├── generator.ts         # Instance generation (deterministic)
│   │   │   ├── template-registry.ts # Template selection/storage
│   │   │   ├── parameter-generator.ts # Constraint satisfaction
│   │   │   ├── distractors.ts       # Wrong answer generation
│   │   │   ├── validator.ts         # Answer validation
│   │   │   ├── hint-tracker.ts      # Hint penalty system
│   │   │   └── templates/           # Exercise templates by topic
│   │   │       └── tal-og-algebra/  # Numbers & Algebra templates
│   │   │
│   │   ├── mastery/          # Mastery calculation & SRS
│   │   │   ├── calculator.ts        # 5-factor mastery scoring
│   │   │   ├── srs.ts               # Spaced Repetition System (SM-2 based)
│   │   │   ├── review-scheduler.ts  # Next review timing
│   │   │   └── streak-calculator.ts # Daily practice streaks
│   │   │
│   │   ├── curriculum/       # Danish curriculum mapping
│   │   │   └── types.ts      # Competency areas, grade ranges
│   │   │
│   │   ├── i18n/             # Internationalization
│   │   │   ├── store.ts      # Nanostore for locale
│   │   │   ├── loader.ts     # JSON translation loader
│   │   │   ├── context-selector.ts  # Culturally appropriate contexts
│   │   │   └── utils.ts      # Formatting helpers
│   │   │
│   │   ├── offline/          # Offline-first architecture
│   │   │   ├── storage.ts           # IndexedDB wrapper (idb)
│   │   │   ├── sync-manager.ts      # Background sync orchestrator
│   │   │   ├── sync-operations.ts   # Sync queue processing
│   │   │   ├── conflict-resolution.ts # Last-write-wins strategy
│   │   │   ├── cache-utils.ts       # Service worker integration
│   │   │   └── service-worker-registration.ts
│   │   │
│   │   ├── stores/           # Global reactive state (Nanostores)
│   │   │   └── network-status.ts    # Network/sync status atoms
│   │   │
│   │   ├── supabase/         # Backend integration
│   │   │   ├── client.ts     # Supabase singleton
│   │   │   ├── progress.ts   # Progress tracking DAL
│   │   │   └── types.ts      # Generated DB types
│   │   │
│   │   ├── preferences/      # User settings
│   │   │   └── index.ts      # Theme, font, accessibility prefs
│   │   │
│   │   ├── session/          # Practice session composition
│   │   │   ├── composer.ts   # Session planning algorithm
│   │   │   └── types.ts      # Session structure
│   │   │
│   │   ├── accessibility/    # WCAG 2.1 AA compliance
│   │   │   └── index.ts      # Screen reader, keyboard nav helpers
│   │   │
│   │   └── types.ts          # Central type exports
│   │
│   ├── locales/              # Translation JSON files
│   │   ├── da-DK/            # Danish (primary)
│   │   │   ├── common.json
│   │   │   ├── exercises.json
│   │   │   ├── contexts.json  # Culturally appropriate item pools
│   │   │   └── ...
│   │   └── en-US/            # English
│   │
│   ├── pages/                # Astro file-based routing
│   │   ├── index.astro       # Landing page
│   │   ├── dashboard.astro   # User dashboard (auth required)
│   │   ├── settings.astro    # Settings page
│   │   ├── practice/
│   │   │   └── [sessionId].astro  # Dynamic practice session
│   │   └── api/              # API endpoints (for SSR mode)
│   │       ├── auth/
│   │       │   ├── generate.ts    # POST: Create new UUID
│   │       │   ├── signin.ts      # POST: UUID login
│   │       │   └── signout.ts     # POST: Clear session
│   │       └── preferences/
│   │           └── sync.ts        # POST: Sync preferences
│   │
│   ├── styles/
│   │   └── global.css        # Global styles + accessibility
│   │
│   ├── middleware.ts         # Astro middleware (session validation)
│   └── test/
│       └── setup.ts          # Vitest global setup
│
├── public/
│   ├── sw.js                 # Service Worker (cache strategies)
│   ├── manifest.json         # PWA manifest
│   ├── cache-manifest.json   # Pre-cache asset list (generated)
│   ├── icons/                # PWA icons (generated)
│   └── fonts/                # OpenDyslexic font (accessibility)
│
├── scripts/
│   ├── generate-pwa-icons.ts      # Build: Generate icon sizes
│   ├── generate-cache-manifest.ts # Build: List cacheable assets
│   └── validate-translations.ts   # CI: Check i18n completeness
│
├── supabase/                 # Supabase project configuration
│   └── migrations/           # Database schema migrations
│
├── astro.config.mjs          # Astro + SolidJS + UnoCSS
├── uno.config.ts             # UnoCSS theme (Tailwind-compatible)
├── vitest.config.ts          # Test configuration
├── tsconfig.json             # TypeScript (strict mode)
└── package.json              # Dependencies
```

---

## State Management Patterns

### Nanostores Architecture

**Why Nanostores?** Framework-agnostic reactive state that works seamlessly with Astro's island architecture. Stores are ~200 bytes and support computed values.

**Key Stores:**

1. **Network Status** (`src/lib/stores/network-status.ts`):
   ```typescript
   export const $networkStatus = atom<NetworkStatus>({
     online: navigator.onLine,
     lastChanged: new Date()
   })
   
   export const $syncStatus = atom<SyncStatus>({
     syncing: false,
     queueCount: 0,
     lastSyncTime: null,
     error: null
   })
   
   // Computed stores
   export const $connectionStatusText = computed($networkStatus, ...)
   ```
   - Used by: `OfflineIndicator.tsx`, `SyncStatusIndicator.tsx`
   - Updates on: `online/offline` events, sync manager events

2. **I18n Store** (`src/lib/i18n/store.ts`):
   ```typescript
   export const $locale = persistentAtom<Locale>('locale', 'da-DK')
   export const $t = atom<TranslationFunction>(...)
   ```
   - Persisted to localStorage via `@nanostores/persistent`
   - Used by: All components needing translations

3. **Preferences** (persisted to IndexedDB + Supabase):
   - Managed via `src/lib/preferences/index.ts`
   - Synced across devices when online

**Usage Pattern in SolidJS:**
```typescript
import { useStore } from '@nanostores/solid'
import { $networkStatus } from '@/lib/stores/network-status'

function MyComponent() {
  const networkStatus = useStore($networkStatus)
  
  return <div>{networkStatus().online ? 'Online' : 'Offline'}</div>
}
```

---

## Database & Backend Integration

### Supabase Architecture

**Connection:** Singleton client (`src/lib/supabase/client.ts`)
- Type-safe via generated types (`Database` from `types.ts`)
- Realtime enabled for cross-device sync
- Auth session stored in localStorage (key: `math-edbpede-auth`)

**Database Schema (PostgreSQL):**

```sql
-- Users (UUID-based, no email/password)
users
├─ id (uuid, PK)
├─ uuid (text, UNIQUE) -- 4-digit formatted UUID for login
├─ grade_range (text) -- '0-3', '4-6', '7-9'
├─ locale (text)
├─ created_at
└─ last_active_at

-- High-level competency tracking
competency_progress
├─ id (uuid, PK)
├─ user_id (uuid, FK -> users)
├─ competency_id (text) -- e.g., 'tal-og-algebra'
├─ mastery_level (int) -- 0-100
├─ exercises_completed (int)
└─ updated_at

-- Granular skill tracking with SRS
skills_progress
├─ id (uuid, PK)
├─ user_id (uuid, FK -> users)
├─ skill_id (text) -- e.g., 'addition-within-20'
├─ mastery_level (int) -- 0-100
├─ srs_interval (int) -- Days until next review
├─ srs_ease_factor (float) -- SRS difficulty multiplier
├─ srs_due_date (timestamp)
├─ streak_days (int)
└─ updated_at

-- Append-only exercise history (never updated)
exercise_history
├─ id (uuid, PK)
├─ user_id (uuid, FK -> users)
├─ session_id (uuid, FK -> sessions)
├─ template_id (text)
├─ correct (boolean)
├─ response_time_seconds (int)
├─ hints_used (int)
├─ difficulty (text)
└─ created_at

-- Practice sessions
sessions
├─ id (uuid, PK)
├─ user_id (uuid, FK -> users)
├─ competency_id (text)
├─ exercises_planned (int)
├─ exercises_completed (int)
├─ started_at
└─ completed_at
```

**Data Access Patterns:**

1. **Progress Tracking** (`src/lib/supabase/progress.ts`):
   - Batched writes (debounced 30s) for performance
   - Retry logic with exponential backoff
   - Optimistic UI updates

2. **Offline Sync** (`src/lib/offline/sync-manager.ts`):
   - Queue operations in IndexedDB when offline
   - Background sync when online
   - Last-write-wins conflict resolution

3. **Realtime Subscriptions** (planned for cross-device sync):
   ```typescript
   supabase
     .channel('progress-updates')
     .on('postgres_changes', { 
       event: 'UPDATE', 
       schema: 'public', 
       table: 'skills_progress',
       filter: `user_id=eq.${userId}`
     }, handleProgressUpdate)
     .subscribe()
   ```

---

## Authentication System

### UUID-Based Authentication

**Why UUIDs?** Privacy-first approach:
- No email collection
- No password management
- Memorable 4-part format: `7b3f-4c2a-8d1e-9f6b`
- QR code support for device transfer

**Flow:**

```
┌─────────────────────────────────────────────────────────┐
│ 1. ONBOARDING (/demo-uuid.astro)                       │
│    User clicks "Start Practice"                        │
│    ↓                                                    │
│    POST /api/auth/generate                             │
│    └─ Creates user in Supabase                         │
│    └─ Returns UUID + QR code                           │
│    ↓                                                    │
│    User saves UUID (print, screenshot, write down)     │
└─────────────────────────────────────────────────────────┘
         │
         ↓
┌─────────────────────────────────────────────────────────┐
│ 2. LOGIN (/demo-login.astro)                           │
│    User enters UUID (manual or QR scan)                │
│    ↓                                                    │
│    POST /api/auth/signin                               │
│    └─ Validates UUID (rate limited: 5 attempts/15min)  │
│    └─ Creates JWT session token (7 days)               │
│    └─ Sets httpOnly cookie                             │
│    ↓                                                    │
│    Redirect to /dashboard                              │
└─────────────────────────────────────────────────────────┘
         │
         ↓
┌─────────────────────────────────────────────────────────┐
│ 3. AUTHENTICATED REQUESTS                              │
│    middleware.ts runs on every request                 │
│    ↓                                                    │
│    Reads session cookie                                │
│    ↓                                                    │
│    Validates JWT token                                 │
│    ↓                                                    │
│    Fetches user from Supabase                          │
│    ↓                                                    │
│    Attaches to Astro.locals.user                       │
│    ↓                                                    │
│    (Optional) Refreshes token if halfway expired       │
└─────────────────────────────────────────────────────────┘
```

**Session Management:**
- JWT tokens stored in httpOnly cookies (XSS protection)
- 7-day expiry (configurable via `SESSION_DURATION_DAYS`)
- Auto-refresh at midpoint (3.5 days)
- Server-side validation on every request via middleware

**Security:**
- Rate limiting on `/api/auth/signin` (5 attempts per IP/15min)
- UUIDs are cryptographically random (not sequential)
- No session stored in localStorage (only in cookies)

---

## Exercise Generation System

### Template-Based Deterministic Generation

**Philosophy:** `template + seed → instance` (always same result)

**Pipeline:**

```
Template Selection
    ↓
Parameter Generation (constraint satisfaction)
    ↓
Context Injection (names, places, items)
    ↓
Question/Answer Generation (template function)
    ↓
Hint Generation (4 progressive levels)
    ↓
Distractor Generation (wrong answers)
    ↓
Exercise Instance (ready to display)
```

**Key Components:**

1. **Template Registry** (`src/lib/exercises/template-registry.ts`):
   - Stores all exercise templates
   - Supports filtering by competency, grade, difficulty
   - Anti-repetition tracking (weighted selection)
   - Performance: O(1) lookup, <1ms selection

2. **Parameter Generator** (`src/lib/exercises/parameter-generator.ts`):
   - Constraint satisfaction for numeric parameters
   - Seeded PRNG for deterministic results
   - Example constraints:
     ```typescript
     {
       a: { min: 10, max: 50 },
       b: { min: 1, max: a.value - 1 }, // Dependent constraint
       sum: { value: (params) => params.a + params.b }
     }
     ```

3. **Template Structure**:
   ```typescript
   {
     id: 'add-within-100',
     metadata: {
       competencyId: 'tal-og-algebra',
       gradeRange: '0-3',
       difficulty: 'A',
       skillId: 'addition-within-100'
     },
     contextType: 'abstract', // or 'shopping', 'school', etc.
     parameters: { /* constraints */ },
     generate: (params, locale) => ({
       questionText: `{{a}} + {{b}} = ?`,
       correctAnswer: { value: params.sum, unit: null },
       visualAid: { type: 'number-line', range: [0, 100] }
     }),
     hints: [
       (params) => `Tip: Start from ${params.a}`,
       (params) => `Add ${params.b} to ${params.a}`,
       (params) => `Use a number line`,
       (params) => `The answer is ${params.sum}`
     ]
   }
   ```

4. **Batch Generation** (for practice sessions):
   - Generates 20-30 instances in <200ms (<10ms per instance)
   - Reuses context selector for performance
   - Sequential seeds from `Date.now()`

---

## Mastery & Spaced Repetition

### 5-Factor Mastery Calculation

**Algorithm** (`src/lib/mastery/calculator.ts`):

```
Mastery Score (0-100) = 
  45% Recent Performance (last 10-20 attempts with recency weighting)
+ 20% Response Speed (compared to difficulty benchmarks)
+ 15% Hint Usage (penalty for hints requested)
+ 10% Consistency (low stddev = higher score)
+ 10% Time Decay (exponential decay if not practiced)
```

**Mastery Bands** (color-coded):
- 0-20: Introduced (red) - Just learning
- 21-40: Developing (yellow) - Gaining skills
- 41-60: Progressing (light green) - Making progress
- 61-80: Proficient (green) - Solid understanding
- 81-100: Mastered (blue) - Expert level

**Spaced Repetition System** (`src/lib/mastery/srs.ts`):
- Based on SuperMemo SM-2 algorithm
- Adjusts intervals based on performance:
  - Correct answer → interval increases (1d → 3d → 7d → 14d → 30d)
  - Incorrect → interval resets to 1 day
- Ease factor adjusts difficulty (2.5 default, range 1.3-2.5)

**Review Scheduling** (`src/lib/mastery/review-scheduler.ts`):
- Prioritizes skills due for review
- Balances old material with new skills (80/20 rule)
- Considers mastery level for review frequency

---

## Offline-First Architecture

### Three-Layer Caching Strategy

**1. Service Worker** (`public/sw.js`):
- **Cache-First:** Static assets (JS, CSS, fonts, images)
- **Network-First:** HTML pages, API calls (with cache fallback)
- **Stale-While-Revalidate:** Exercise templates
- Cache versioning: `math-v1-static`, `math-v1-runtime`
- Cleanup on activation (removes old versions)

**2. IndexedDB** (`src/lib/offline/storage.ts`):
```
Database: arithmetic-practice-offline
├─ exercises (pre-generated instances)
│  ├─ Index: generatedAt
│  └─ Index: used
├─ syncQueue (pending operations)
│  ├─ Index: timestamp
│  └─ Index: type
├─ progressCache (mastery snapshot)
└─ preferences (user settings)
```

**3. Sync Manager** (`src/lib/offline/sync-manager.ts`):
```
┌─────────────────────────────────────────────────┐
│ User submits exercise while offline             │
│    ↓                                             │
│ Add to IndexedDB sync queue                     │
│    ↓                                             │
│ Update local progress cache                     │
│    ↓                                             │
│ Optimistic UI update                            │
└─────────────────────────────────────────────────┘
         │
         ↓ (when online)
┌─────────────────────────────────────────────────┐
│ Background sync triggered                       │
│    ↓                                             │
│ Process queue in order (FIFO)                   │
│    ↓                                             │
│ POST to Supabase                                │
│    ↓                                             │
│ On success: Remove from queue                   │
│ On failure: Retry with exponential backoff      │
│    ↓                                             │
│ Emit sync events (success/error)                │
└─────────────────────────────────────────────────┘
```

**Conflict Resolution:**
- Last-write-wins strategy (simple, predictable)
- Timestamps used for ordering
- Single-device assumption (most users)

---

## Testing Strategy

### Vitest Configuration

**Setup** (`vitest.config.ts`):
- **Unit tests:** Node environment (fast, no DOM)
- **Component tests:** happy-dom environment (lighter than jsdom)
- Global setup: `src/test/setup.ts`
  - Mocks: `navigator.clipboard`, `IndexedDB`, `FileReader`, `matchMedia`
  - SolidJS testing library integration
  - Cleanup after each test

**Test Coverage:**
- **42 test files** total
- Comprehensive coverage of:
  - Exercise generation (`generator.test.ts`, `parameter-generator.test.ts`)
  - Mastery calculation (`calculator.test.ts`, `srs.test.ts`)
  - Offline sync (`sync-manager.test.ts`, `storage.test.ts`)
  - Components (`ExercisePractice.test.tsx`, `ProgressDashboard.test.tsx`)
  - Auth flows (`UUIDGenerator.test.tsx`, `UUIDLogin.test.tsx`)
  - i18n (`context-selector.test.ts`, `utils.test.ts`)

**Running Tests:**
```bash
bun test              # Watch mode
bun test:ui           # Vitest UI
bun test:run          # CI mode (single run)
```

**Testing Patterns:**

1. **Component Testing (SolidJS):**
   ```typescript
   import { render, screen } from '@solidjs/testing-library'
   import '@testing-library/jest-dom'
   
   test('displays exercise question', () => {
     const instance = createMockExercise()
     render(() => <ExercisePractice instance={instance} />)
     expect(screen.getByText(/What is/)).toBeInTheDocument()
   })
   ```

2. **Unit Testing (Pure Functions):**
   ```typescript
   import { calculateMastery } from '@/lib/mastery/calculator'
   
   test('calculates mastery from attempts', () => {
     const attempts = createMockAttempts()
     const result = calculateMastery(attempts, '4-6', 'A')
     expect(result.status).toBe('success')
     expect(result.masteryLevel).toBeGreaterThan(50)
   })
   ```

---

## Build Process & PWA

### Build Pipeline

**Command:** `bun run build`

**Steps:**
1. **Pre-build:** Generate PWA icons
   - `scripts/generate-pwa-icons.ts`
   - Creates 72px → 512px PNG from `public/favicon.svg`
   - Generates maskable icons for Android

2. **Astro Build:**
   - Compiles `.astro` pages to HTML
   - Bundles SolidJS islands (code splitting per island)
   - Processes UnoCSS (atomic CSS generation)
   - Optimizes assets (minification, compression)

3. **Post-build:** Generate cache manifest
   - `scripts/generate-cache-manifest.ts`
   - Scans `dist/` for all assets
   - Creates `public/cache-manifest.json`
   - Used by service worker for pre-caching

**Output Structure:**
```
dist/
├── index.html           # Landing page (static)
├── dashboard.html       # Dashboard (requires auth)
├── _astro/              # Bundled JS/CSS (hashed filenames)
│   ├── island-*.js      # SolidJS islands (lazy loaded)
│   ├── page-*.js        # Page-specific JS
│   └── *.css            # UnoCSS output
├── api/                 # API routes (if SSR enabled)
└── [static assets]      # Fonts, icons, manifest
```

**PWA Manifest** (`public/manifest.json`):
- App name: "Matematik Øvelses Portal"
- Display: standalone (fullscreen app)
- Theme color: #3b82f6 (blue)
- Icons: 72px → 512px + maskable variants
- Shortcuts: Quick access to practice

**Service Worker Lifecycle:**
1. **Install:** Pre-cache critical assets (`/`, `/dashboard`, fonts)
2. **Activate:** Clean up old caches (version-based)
3. **Fetch:** Intercept requests with cache strategies

---

## Important Conventions & Patterns

### 1. File Organization

- **Barrel Exports:** Each module has an `index.ts` exporting public API
  ```typescript
  // src/lib/auth/index.ts
  export { generateUUID, signInWithUUID } from './service'
  export type { User, Session } from './service'
  ```

- **Colocation:** Tests live next to source files (`*.test.ts`)
  ```
  calculator.ts
  calculator.test.ts
  ```

- **Naming:**
  - PascalCase: Components (`ExercisePractice.tsx`)
  - kebab-case: Utilities (`network-status.ts`)
  - `$` prefix: Nanostores (`$locale`, `$t`)

### 2. TypeScript Patterns

- **Strict Mode:** All strict flags enabled (`tsconfig.json`)
- **Path Aliases:**
  ```typescript
  import { generateUUID } from '@/lib/auth'
  import ExercisePractice from '@/components/islands/ExercisePractice'
  ```

- **Discriminated Unions:**
  ```typescript
  type Result = 
    | { status: 'success'; data: T }
    | { status: 'error'; message: string }
  ```

- **Type-Safe Database:** Generated from Supabase schema
  ```typescript
  import type { Database } from '@/lib/supabase/types'
  type User = Database['public']['Tables']['users']['Row']
  ```

### 3. Component Architecture (SolidJS Islands)

- **Islands Pattern:** Only interactive components are hydrated
  ```astro
  <ExercisePractice client:load />   <!-- Eager -->
  <InstallPrompt client:idle />      <!-- When idle -->
  <ProgressChart client:visible />   <!-- When visible -->
  ```

- **Props Validation:** TypeScript interfaces for all props
  ```typescript
  interface ExercisePracticeProps {
    instance: ExerciseInstance
    onComplete: (result: AttemptResult) => void
  }
  ```

- **No Prop Drilling:** Use Nanostores for shared state
  ```typescript
  // Bad: Pass through 5 components
  <Parent locale={locale}>
    <Child locale={locale}>
      <GrandChild locale={locale} />
  
  // Good: Use nanostore
  const locale = useStore($locale)
  ```

### 4. i18n Patterns

- **Translation Keys:** Dot notation
  ```json
  {
    "exercises.practice.submit": "Indsend svar",
    "feedback.correct.title": "Korrekt!"
  }
  ```

- **Usage in Components:**
  ```typescript
  const t = useStore($t)
  return <button>{t()('exercises.practice.submit')}</button>
  ```

- **Context Pools:** Culturally appropriate items
  ```json
  {
    "contexts": {
      "food": ["æble", "banan", "pære"],
      "places": ["skole", "park", "bibliotek"]
    }
  }
  ```

### 5. Error Handling

- **Custom Error Classes:**
  ```typescript
  export class InstanceGenerationError extends Error {
    constructor(
      message: string,
      public templateId: string,
      public cause?: unknown
    ) { ... }
  }
  ```

- **Result Types (no throws):**
  ```typescript
  async function getUserByUUID(uuid: string): Promise<AuthResult<User>> {
    try {
      // ...
      return { success: true, data: { user } }
    } catch (error) {
      return { success: false, error: 'User not found' }
    }
  }
  ```

### 6. Performance Targets

- Exercise generation: <10ms per instance
- Batch generation (20 exercises): <200ms
- Mastery calculation: <5ms
- Initial page load: <2s on 3G
- Time to interactive: <3s

---

## Accessibility Features

**WCAG 2.1 AA Compliance:**

1. **Keyboard Navigation:**
   - All interactive elements focusable
   - Skip navigation links (`SkipNavigation.astro`)
   - Tab order follows logical reading flow
   - Visible focus indicators (2px blue outline)

2. **Screen Reader Support:**
   - Semantic HTML (`<main>`, `<nav>`, `<article>`)
   - ARIA landmarks and labels
   - Live regions for dynamic content
   - Alt text for all images

3. **Visual Accessibility:**
   - Minimum 44x44px touch targets
   - High contrast mode support
   - Dyslexia-friendly font option (OpenDyslexic)
   - Adjustable font sizes (sm/base/lg/xl/2xl)
   - Color is never the only visual indicator

4. **Preferences** (`src/lib/preferences/`):
   ```typescript
   {
     theme: 'light' | 'dark' | 'system',
     fontSize: 'base' | 'lg' | 'xl',
     highContrast: boolean,
     dyslexiaFont: boolean,
     reduceMotion: boolean
   }
   ```

5. **UnoCSS Utilities:**
   - `touch-target`: 44x44px minimum
   - `sr-only`: Screen reader only content
   - `focus-visible-ring`: Accessible focus states
   - `skip-link`: Keyboard-only visible links

---

## Key Architectural Decisions

### 1. Static vs SSR

**Current:** `output: 'static'` (pre-rendered HTML)
**Reasoning:** 
- Simpler deployment (CDN-friendly)
- Better performance (no server compute)
- Works for client-side auth (UUID in cookies)

**Future:** May switch to SSR for:
- Server-side session validation
- API routes with httpOnly cookies
- Better SEO for dynamic content

### 2. UUID Authentication

**Why not email/password?**
- Target audience: Young students (no email)
- Privacy-first approach (GDPR-friendly)
- Simpler UX (no password reset flows)
- Parental control (adults can manage UUIDs)

**Tradeoff:**
- User must save UUID (manual step)
- QR codes help with device transfer

### 3. Offline-First

**Why IndexedDB + Service Worker?**
- Target use case: Students practicing anywhere (no internet)
- Large storage capacity (50MB+ per origin)
- Persistent across sessions
- Native browser support (no external dependencies)

**Alternative considered:**
- LocalStorage: Too small (5-10MB limit)
- WebSQL: Deprecated

### 4. SolidJS over React

**Why SolidJS?**
- No virtual DOM (faster reactivity)
- Smaller bundle size (~7kb vs ~40kb React)
- Better Astro integration (islands work smoothly)
- Signals-based reactivity (similar to Nanostores)

### 5. UnoCSS over Tailwind

**Why UnoCSS?**
- 200x faster generation (no PostCSS)
- Smaller runtime (~5kb vs ~50kb Tailwind)
- Same syntax (Tailwind-compatible)
- Better tree-shaking

### 6. Nanostores over Redux/Zustand

**Why Nanostores?**
- Framework-agnostic (works with Astro + SolidJS)
- Tiny bundle size (~200 bytes per store)
- Simple API (atom, computed, map)
- Persistent stores built-in

### 7. Monolithic Template Registry

**Why not database-stored templates?**
- Type-safety at compile time
- No network latency for template access
- Version control with code
- Easier to audit/review templates

**Tradeoff:**
- Requires redeploy to add templates
- Not user-editable (intentional)

---

## Common Workflows

### Adding a New Exercise Template

1. Create template file in `src/lib/exercises/templates/tal-og-algebra/`
2. Define metadata, parameters, generate function, hints
3. Add to registry in `templates/tal-og-algebra/index.ts`
4. Write tests in `*.test.ts`
5. Run validation: `bun test templates`

### Adding a Translation

1. Add keys to `src/locales/da-DK/[category].json`
2. Add English equivalent in `src/locales/en-US/[category].json`
3. Validate: `bun run validate-translations`
4. Use in code: `t()('category.key')`

### Testing Offline Functionality

1. Start dev server: `bun run dev`
2. Open DevTools → Application → Service Workers
3. Check "Offline" checkbox
4. Test practice flow (should work from cache)
5. Check IndexedDB for queued operations

### Debugging Sync Issues

1. Open DevTools → Application → IndexedDB → `arithmetic-practice-offline`
2. Check `syncQueue` table for pending operations
3. Check console for `[SyncManager]` logs
4. Manually trigger sync: `syncManager.manualSync()`

---

## Future Architectural Considerations

1. **SSR Migration:**
   - Add adapter (Vercel/Netlify/Node)
   - Move API routes to proper endpoints
   - Server-side session validation

2. **Realtime Sync:**
   - Supabase Realtime subscriptions
   - Cross-device progress updates
   - Collaborative features (parent monitoring)

3. **Analytics:**
   - Privacy-respecting metrics (no tracking)
   - Aggregated progress insights
   - Template effectiveness scoring

4. **Content Management:**
   - Admin panel for template creation
   - A/B testing framework
   - Template versioning

5. **Performance:**
   - Web Workers for heavy computation
   - Virtual scrolling for large lists
   - Lazy loading for template bundles

---

## Quick Reference

### Key Files to Understand First

1. `src/middleware.ts` - Request authentication
2. `src/lib/auth/session.ts` - Session management
3. `src/lib/exercises/generator.ts` - Exercise creation
4. `src/lib/mastery/calculator.ts` - Mastery scoring
5. `src/lib/offline/sync-manager.ts` - Offline sync
6. `src/components/islands/ExercisePractice.tsx` - Main UI

### Environment Variables

```bash
# Required
PUBLIC_SUPABASE_URL=https://xxx.supabase.co
PUBLIC_SUPABASE_ANON_KEY=eyJxxx...

# Optional
SESSION_DURATION_DAYS=7
RATE_LIMIT_MAX_ATTEMPTS=5
RATE_LIMIT_WINDOW_MINUTES=15
```

### Useful Commands

```bash
bun run dev                          # Dev server (localhost:4321)
bun run build                        # Production build
bun test                             # Run tests (watch mode)
bun run validate-translations        # Check i18n completeness
bun run sw:clear                     # Uninstall service worker
```

---

## Gotchas & Known Issues

1. **Service Worker Development:**
   - Disabled in dev mode (see `middleware.ts`)
   - Must build + preview to test SW
   - Use "Update on reload" in DevTools

2. **Astro Islands:**
   - Props must be serializable (no functions)
   - Use Nanostores for callbacks
   - `client:load` blocks rendering

3. **IndexedDB:**
   - Async API (always await)
   - Version upgrades require browser restart
   - Use `fake-indexeddb` in tests

4. **Supabase Types:**
   - Regenerate after schema changes:
     ```bash
     supabase gen types typescript --local > src/lib/supabase/types.ts
     ```

5. **UnoCSS:**
   - Safelist dynamic classes in `uno.config.ts`
   - No runtime generation (build-time only)

---

**Last Updated:** 2025-11-08
**Astro Version:** 5.15.3
**SolidJS Version:** 1.9.10
