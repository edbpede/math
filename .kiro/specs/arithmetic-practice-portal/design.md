# Design Document

## Overview

The Arithmetic Practice Portal is architected as a static-first Progressive Web Application using Astro's island architecture for optimal performance. The system separates concerns into distinct layers: a static frontend with interactive SolidJS islands, a template-based exercise generation engine running client-side, and a Supabase backend providing authentication, data persistence, and real-time synchronization.

The design prioritizes privacy (UUID-only authentication), performance (sub-second interactions), offline capability (service worker + IndexedDB), and extensibility (modular template system). All user-facing content supports Danish and English from launch through a compile-time i18n system integrated with Weblate for collaborative translation.

### Key Design Principles

1. **Privacy by Design**: Zero personal data collection, anonymous UUID authentication, no tracking
2. **Offline First**: Full functionality without network, background sync when available
3. **Static + Dynamic**: Astro generates static HTML, SolidJS islands add interactivity where needed
4. **Modular Content**: Template-based exercise generation enables infinite variation from finite definitions
5. **Curriculum Fidelity**: Explicit mapping to Danish Fælles Mål at every level
6. **Progressive Enhancement**: Core functionality works everywhere, enhanced features where supported
7. **Type Safety**: TypeScript strict mode throughout, generated types from schemas

## Architecture

### High-Level System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        Client Layer                          │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  Astro Static Pages (HTML/CSS)                         │ │
│  │  - Landing, Dashboard, Settings                        │ │
│  │  - Pre-rendered at build time                          │ │
│  └────────────────────────────────────────────────────────┘ │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  SolidJS Interactive Islands                           │ │
│  │  - Exercise Practice Component                         │ │
│  │  - Progress Visualizations                             │ │
│  │  - Language Selector                                   │ │
│  └────────────────────────────────────────────────────────┘ │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  Exercise Generation Engine (Client-Side)              │ │
│  │  - Template Registry                                   │ │
│  │  - Parameter Generator                                 │ │
│  │  - Instance Builder                                    │ │
│  └────────────────────────────────────────────────────────┘ │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  Offline Layer                                         │ │
│  │  - Service Worker (cache + sync)                       │ │
│  │  - IndexedDB (local data store)                        │ │
│  │  - Sync Queue Manager                                  │ │
│  └────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
                            ↕ HTTPS
┌─────────────────────────────────────────────────────────────┐
│                      Supabase Backend                        │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  Supabase Auth (UUID-based)                            │ │
│  └────────────────────────────────────────────────────────┘ │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  PostgreSQL Database + RLS                             │ │
│  │  - users, progress, history, sessions                  │ │
│  └────────────────────────────────────────────────────────┘ │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  Realtime (optional cross-device sync)                 │ │
│  └────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

### Technology Stack Rationale

**Astro**: Chosen for zero-JS by default, excellent performance, and island architecture allowing selective hydration
**SolidJS**: Selected for fine-grained reactivity, small bundle size, and excellent TypeScript support
**UnoCSS**: Provides utility-first styling with minimal runtime overhead and excellent tree-shaking
**Supabase**: Offers PostgreSQL with automatic REST API, built-in auth, RLS, and realtime without backend code
**TypeScript**: Ensures type safety across curriculum definitions, templates, and data models


## Components and Interfaces

### Frontend Component Structure

```
src/
├── pages/                          # Astro pages (static routes)
│   ├── index.astro                # Landing page with UUID generation
│   ├── dashboard.astro            # Progress overview and navigation
│   ├── practice/
│   │   └── [competency].astro    # Practice session pages
│   └── settings.astro             # User preferences
├── components/
│   ├── islands/                   # SolidJS interactive components
│   │   ├── UUIDGenerator.tsx     # UUID creation and display
│   │   ├── UUIDLogin.tsx         # UUID entry form
│   │   ├── ExercisePractice.tsx  # Main practice interface
│   │   ├── ProgressDashboard.tsx # Mastery visualizations
│   │   ├── LanguageSelector.tsx  # Language switcher
│   │   └── HintSystem.tsx        # Progressive hint display
│   ├── static/                    # Non-interactive components
│   │   ├── Header.astro
│   │   ├── Footer.astro
│   │   └── CompetencyCard.astro
│   └── layouts/
│       └── MainLayout.astro       # Base layout with i18n
├── lib/
│   ├── curriculum/                # Curriculum type definitions
│   │   ├── types.ts              # Competency areas, skills, grades
│   │   └── mappings.ts           # Fælles Mål mappings
│   ├── exercises/                 # Exercise generation system
│   │   ├── template-registry.ts  # Template storage and indexing
│   │   ├── generator.ts          # Instance generation logic
│   │   ├── validator.ts          # Answer validation
│   │   └── templates/            # Template definitions by area
│   │       ├── matematiske-kompetencer/
│   │       ├── tal-og-algebra/
│   │       ├── geometri-og-maling/
│   │       └── statistik-og-sandsynlighed/
│   ├── mastery/                   # Progress tracking
│   │   ├── calculator.ts         # Mastery score computation
│   │   ├── srs.ts                # Spaced repetition algorithm
│   │   └── types.ts              # Progress data structures
│   ├── i18n/                      # Internationalization
│   │   ├── index.ts              # Translation loader
│   │   ├── types.ts              # Generated types from keys
│   │   └── contexts.ts           # Language-specific context pools
│   ├── supabase/                  # Backend integration
│   │   ├── client.ts             # Supabase client setup
│   │   ├── auth.ts               # UUID authentication
│   │   ├── progress.ts           # Progress data operations
│   │   └── types.ts              # Database type definitions
│   └── offline/                   # Offline functionality
│       ├── sync-manager.ts       # Queue and sync logic
│       ├── storage.ts            # IndexedDB wrapper
│       └── service-worker.ts     # SW registration
├── locales/                       # Translation files
│   ├── da-DK/
│   │   ├── common.json
│   │   ├── auth.json
│   │   ├── competencies.json
│   │   └── exercises.json
│   └── en-US/
│       └── [same structure]
└── styles/
    └── global.css                 # UnoCSS utilities and custom styles
```

### Core Interfaces and Types

```typescript
// Curriculum Types
interface CompetencyArea {
  id: 'matematiske-kompetencer' | 'tal-og-algebra' | 'geometri-og-maling' | 'statistik-og-sandsynlighed'
  nameKey: string
  descriptionKey: string
  skillsAreas: SkillsArea[]
}

interface SkillsArea {
  id: string
  competencyAreaId: string
  nameKey: string
  gradeRange: GradeRange
  isBinding: boolean
  attentionPoints?: AttentionPoint[]
}

type GradeRange = '0-3' | '4-6' | '7-9'
type Difficulty = 'A' | 'B' | 'C'

// Exercise Template Types
interface ExerciseTemplate {
  id: string
  metadata: TemplateMetadata
  constraints: ParameterConstraints
  generate: (seed: number, difficulty: Difficulty) => ExerciseInstance
  validate: (answer: string, correctAnswer: Answer) => boolean
  generateHints: (instance: ExerciseInstance) => Hint[]
}

interface TemplateMetadata {
  competencyAreaId: string
  skillsAreaId: string
  gradeRange: GradeRange
  difficulty: Difficulty
  isBinding: boolean
  attentionPointId?: string
  tags: string[]
}

interface ExerciseInstance {
  id: string
  templateId: string
  questionText: string
  correctAnswer: Answer
  distractors?: string[]
  hints: Hint[]
  metadata: TemplateMetadata
  context: ExerciseContext
}

interface Answer {
  value: string | number
  equivalents?: Array<string | number>
  tolerance?: number
}

// Progress Types
interface UserProgress {
  userId: string
  competencyProgress: Map<string, CompetencyProgress>
  skillsProgress: Map<string, SkillProgress>
  lastActive: Date
}

interface CompetencyProgress {
  competencyAreaId: string
  masteryLevel: number  // 0-100
  totalAttempts: number
  successRate: number
  lastPracticed: Date
}

interface SkillProgress {
  skillId: string
  masteryLevel: number
  srsParams: SRSParameters
  attempts: number
  successes: number
  avgResponseTime: number
  lastPracticed: Date
  nextReview: Date
}

interface SRSParameters {
  easeFactor: number
  interval: number
  repetitionCount: number
}

// i18n Types
interface TranslationKey {
  key: string
  params?: Record<string, string | number>
}

interface ContextPool {
  locale: 'da-DK' | 'en-US'
  names: string[]
  places: string[]
  currency: { symbol: string; name: string }
  items: Record<string, string[]>
}
```


## Data Models

### Supabase Database Schema

```sql
-- Users table (UUID-based, no personal info)
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_active_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  grade_range TEXT NOT NULL CHECK (grade_range IN ('0-3', '4-6', '7-9')),
  locale TEXT NOT NULL DEFAULT 'da-DK' CHECK (locale IN ('da-DK', 'en-US')),
  preferences JSONB DEFAULT '{}'::jsonb
);

-- Competency progress tracking
CREATE TABLE competency_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  competency_area_id TEXT NOT NULL,
  grade_range TEXT NOT NULL,
  mastery_level INTEGER NOT NULL DEFAULT 0 CHECK (mastery_level >= 0 AND mastery_level <= 100),
  total_attempts INTEGER NOT NULL DEFAULT 0,
  success_rate DECIMAL(5,2) NOT NULL DEFAULT 0.00,
  last_practiced_at TIMESTAMPTZ,
  achieved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, competency_area_id, grade_range)
);

-- Skills progress tracking with SRS parameters
CREATE TABLE skills_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  skill_id TEXT NOT NULL,
  mastery_level INTEGER NOT NULL DEFAULT 0 CHECK (mastery_level >= 0 AND mastery_level <= 100),
  attempts INTEGER NOT NULL DEFAULT 0,
  successes INTEGER NOT NULL DEFAULT 0,
  avg_response_time_ms INTEGER,
  ease_factor DECIMAL(4,2) NOT NULL DEFAULT 2.50,
  interval_days INTEGER NOT NULL DEFAULT 1,
  repetition_count INTEGER NOT NULL DEFAULT 0,
  last_practiced_at TIMESTAMPTZ,
  next_review_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, skill_id)
);

-- Exercise history (append-only log)
CREATE TABLE exercise_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  session_id UUID NOT NULL,
  template_id TEXT NOT NULL,
  competency_area_id TEXT NOT NULL,
  skill_id TEXT NOT NULL,
  difficulty TEXT NOT NULL CHECK (difficulty IN ('A', 'B', 'C')),
  is_binding BOOLEAN NOT NULL DEFAULT false,
  correct BOOLEAN NOT NULL,
  time_spent_seconds INTEGER NOT NULL,
  hints_used INTEGER NOT NULL DEFAULT 0,
  user_answer TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Practice sessions
CREATE TABLE sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  grade_range TEXT NOT NULL,
  competency_area_id TEXT,
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ended_at TIMESTAMPTZ,
  total_exercises INTEGER NOT NULL DEFAULT 0,
  correct_count INTEGER NOT NULL DEFAULT 0,
  avg_time_per_exercise_seconds INTEGER
);

-- Indexes for performance
CREATE INDEX idx_competency_progress_user ON competency_progress(user_id);
CREATE INDEX idx_skills_progress_user ON skills_progress(user_id);
CREATE INDEX idx_skills_progress_next_review ON skills_progress(user_id, next_review_at);
CREATE INDEX idx_exercise_history_user_time ON exercise_history(user_id, created_at DESC);
CREATE INDEX idx_exercise_history_session ON exercise_history(session_id);
CREATE INDEX idx_sessions_user ON sessions(user_id, started_at DESC);

-- Row Level Security Policies
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE competency_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE skills_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE exercise_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;

-- Users can only access their own data
CREATE POLICY users_select_own ON users FOR SELECT USING (auth.uid() = id);
CREATE POLICY users_update_own ON users FOR UPDATE USING (auth.uid() = id);

CREATE POLICY competency_progress_all ON competency_progress FOR ALL USING (auth.uid() = user_id);
CREATE POLICY skills_progress_all ON skills_progress FOR ALL USING (auth.uid() = user_id);
CREATE POLICY exercise_history_select ON exercise_history FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY exercise_history_insert ON exercise_history FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY sessions_all ON sessions FOR ALL USING (auth.uid() = user_id);
```

### IndexedDB Schema (Offline Storage)

```typescript
// IndexedDB stores for offline capability
interface OfflineDatabase {
  // Store 1: Exercise instances (pre-generated for offline use)
  exercises: {
    key: string  // exercise instance ID
    value: {
      instance: ExerciseInstance
      generated_at: Date
      used: boolean
    }
  }
  
  // Store 2: Pending progress updates (sync queue)
  syncQueue: {
    key: string  // queue item ID
    value: {
      type: 'exercise_complete' | 'progress_update' | 'session_end'
      data: any
      timestamp: Date
      retries: number
    }
  }
  
  // Store 3: Cached progress data
  progressCache: {
    key: string  // 'competency' | 'skills' | 'history'
    value: {
      data: any
      cached_at: Date
      expires_at: Date
    }
  }
  
  // Store 4: User preferences (local copy)
  preferences: {
    key: string  // preference key
    value: any
  }
}
```

### Exercise Template Data Structure

```typescript
// Template definition format (stored as TypeScript modules)
interface TemplateDefinition {
  // Metadata
  id: string
  name: string
  competencyAreaId: string
  skillsAreaId: string
  gradeRange: GradeRange
  difficulty: Difficulty
  isBinding: boolean
  attentionPointId?: string
  tags: string[]
  
  // Parameter constraints
  parameters: {
    [key: string]: {
      type: 'integer' | 'decimal' | 'fraction' | 'string'
      min?: number
      max?: number
      step?: number
      options?: any[]
      dependsOn?: string[]  // other parameter names
      constraint?: (params: Record<string, any>) => boolean
    }
  }
  
  // Generation function
  generate: (params: Record<string, any>, locale: string) => {
    questionText: string
    correctAnswer: Answer
    distractors?: string[]
    visualAid?: VisualAid
  }
  
  // Validation function
  validate: (userAnswer: string, correctAnswer: Answer) => {
    correct: boolean
    normalized?: string
  }
  
  // Hint generation
  hints: Array<(params: Record<string, any>, locale: string) => string>
  
  // Context requirements
  contextType?: 'shopping' | 'school' | 'nature' | 'sports' | 'abstract'
}
```


## Error Handling

### Client-Side Error Handling Strategy

**Exercise Generation Errors**
- Constraint satisfaction failures: Log template ID, retry with different seed up to 3 times, fallback to simpler template
- Invalid parameter combinations: Validate constraints before generation, provide clear error to template developer
- Template not found: Log error, select alternative template from same skills area

**Network Errors**
- Failed API calls: Retry with exponential backoff (3 attempts), queue for offline sync if persistent
- Authentication failures: Clear invalid session, redirect to UUID entry with clear message
- Timeout errors: Show user-friendly message, enable offline mode automatically

**Data Validation Errors**
- Invalid user input: Show inline validation message, suggest correct format
- Corrupted local storage: Clear and re-sync from Supabase, notify user of data refresh
- Schema mismatch: Migrate data structure, log version mismatch for monitoring

**Offline Sync Errors**
- Conflict detection: Compare timestamps, take maximum mastery level, append all history records
- Sync queue overflow: Limit queue to 1000 items, compress older entries
- Persistent sync failures: Show manual sync option, provide export functionality

### Error Boundaries and Recovery

```typescript
// SolidJS error boundary for interactive islands
<ErrorBoundary
  fallback={(err, reset) => (
    <div class="error-container">
      <p>{t('errors.something_went_wrong')}</p>
      <button onClick={reset}>{t('errors.try_again')}</button>
    </div>
  )}
>
  <ExercisePractice />
</ErrorBoundary>

// Global error handler
window.addEventListener('unhandledrejection', (event) => {
  console.error('Unhandled promise rejection:', event.reason)
  // Log to monitoring service (if implemented)
  // Show user-friendly error message
  showToast(t('errors.unexpected_error'), 'error')
})
```

### User-Facing Error Messages

All error messages follow these principles:
- Clear, non-technical language appropriate to grade level
- Actionable guidance (what user can do)
- No blame or negative framing
- Consistent tone with platform voice

Examples:
- Network error: "Kan ikke oprette forbindelse. Dine svar gemmes lokalt og synkroniseres senere." (Cannot connect. Your answers are saved locally and will sync later.)
- Invalid UUID: "Dette øvelsesnummer findes ikke. Tjek venligst om du har indtastet det korrekt." (This practice number doesn't exist. Please check if you entered it correctly.)
- Generation failure: "Kunne ikke oprette opgave. Prøver en anden..." (Could not create exercise. Trying another...)

## Testing Strategy

### Unit Testing

**Exercise Generation System**
- Test each template generates valid instances with various seeds
- Verify constraint satisfaction for all parameter combinations
- Validate answer checking handles equivalences correctly
- Confirm hint progression is logical and complete

**Mastery Calculation**
- Test mastery score computation with various performance patterns
- Verify SRS interval calculations match SuperMemo 2 algorithm
- Confirm ease factor adjustments work correctly
- Test edge cases (all correct, all incorrect, mixed patterns)

**i18n System**
- Verify translation loading for all supported locales
- Test interpolation with various parameter types
- Confirm fallback behavior when translations missing
- Validate number and date formatting per locale

**Validation Logic**
- Test answer validation with correct answers, equivalents, and incorrect answers
- Verify tolerance handling for numeric answers
- Test fraction/decimal equivalence recognition
- Confirm case-insensitive text matching where appropriate

### Integration Testing

**Authentication Flow**
- Test UUID generation produces valid format
- Verify UUID login retrieves correct user data
- Confirm session persistence across page reloads
- Test "remember device" functionality

**Practice Session Flow**
- Test complete session from start to completion
- Verify progress updates persist to Supabase
- Confirm mastery calculations update correctly
- Test hint system integration with exercises

**Offline Functionality**
- Test practice session works completely offline
- Verify sync queue accumulates updates correctly
- Confirm background sync triggers when online
- Test conflict resolution with concurrent updates

**Cross-Device Sync**
- Test progress syncs between devices with same UUID
- Verify realtime updates (if implemented)
- Confirm last-write-wins conflict resolution
- Test sync status indicators update correctly

### End-to-End Testing

**Critical User Journeys**
1. New user: Landing → UUID generation → Grade selection → First practice session
2. Returning user: UUID entry → Dashboard → Continue practice → View progress
3. Offline practice: Start offline → Complete exercises → Go online → Verify sync
4. Language switching: Change language → Verify UI updates → Complete exercise in new language
5. Mastery progression: Practice skill repeatedly → Verify mastery increases → Confirm SRS scheduling

**Accessibility Testing**
- Keyboard navigation through all interactive elements
- Screen reader compatibility (NVDA, JAWS, VoiceOver)
- High contrast mode rendering
- Touch target sizes on mobile devices
- Zoom functionality up to 200%

### Performance Testing

**Load Time Metrics**
- Initial page load under 2 seconds
- Time to interactive under 3 seconds
- Exercise generation under 10ms per instance
- Batch generation (20 exercises) under 200ms

**Runtime Performance**
- Answer validation under 1ms
- Progress calculation under 5ms
- UI updates (SolidJS reactivity) under 16ms (60fps)
- IndexedDB operations under 10ms

**Bundle Size Targets**
- Initial HTML/CSS under 50KB
- Main JavaScript bundle under 100KB
- Per-route chunks under 30KB each
- Total locale files under 20KB per language

### Testing Tools

- **Vitest**: Unit and integration testing
- **Playwright**: End-to-end testing
- **axe-core**: Accessibility testing
- **Lighthouse**: Performance auditing
- **TypeScript**: Compile-time type checking


## Key Design Decisions and Rationales

### 1. Client-Side Exercise Generation

**Decision**: Generate exercises entirely in the browser rather than server-side.

**Rationale**:
- Enables full offline functionality without pre-fetching thousands of exercises
- Reduces server costs and complexity (no compute backend needed)
- Provides infinite variation without storage constraints
- Allows deterministic generation (same seed = same exercise) for debugging
- Templates can be updated via static deployment without backend changes

**Trade-offs**:
- Larger initial JavaScript bundle (mitigated by code splitting)
- Template logic exposed in client code (acceptable for educational content)
- Cannot prevent template inspection (not a concern for this use case)

### 2. UUID-Only Authentication

**Decision**: Use UUID as sole authentication credential without passwords.

**Rationale**:
- Eliminates personal data collection (GDPR compliance by design)
- Removes password management complexity and security risks
- Provides sufficient entropy (128-bit) for security
- Enables truly anonymous usage while preserving progress
- Simplifies user experience (no registration forms)

**Trade-offs**:
- Users must save UUID carefully (mitigated by multiple export options)
- No account recovery mechanism (acceptable given no personal data)
- Potential for UUID sharing (acceptable in educational context)

### 3. Astro + SolidJS Island Architecture

**Decision**: Use Astro for static generation with SolidJS islands for interactivity.

**Rationale**:
- Astro ships zero JavaScript by default, excellent performance
- SolidJS provides fine-grained reactivity with small bundle size
- Island architecture loads JavaScript only where needed
- Static generation enables edge deployment and CDN caching
- TypeScript support throughout

**Trade-offs**:
- More complex than single-framework approach (mitigated by clear separation)
- Requires understanding of hydration boundaries
- Limited to client-side routing (acceptable for this application)

### 4. Compile-Time i18n

**Decision**: Load translations at build time rather than runtime.

**Rationale**:
- Zero runtime overhead for translation loading
- Type safety for translation keys via generated types
- Smaller bundles (only selected language included per build)
- No flash of untranslated content
- Enables static analysis of translation coverage

**Trade-offs**:
- Requires separate builds per language (mitigated by build automation)
- Cannot switch languages without page reload (acceptable UX trade-off)
- Translation updates require redeployment (acceptable for educational content)

**Note**: After further consideration, we'll implement runtime i18n to enable instant language switching without page reload, as specified in requirements. This provides better UX despite slightly larger bundle size.

### 5. Supabase for Backend

**Decision**: Use Supabase rather than custom backend or other BaaS.

**Rationale**:
- PostgreSQL provides robust relational data model with ACID guarantees
- Row Level Security enforces data isolation at database level
- Automatic REST API generation eliminates backend code
- Built-in authentication system adaptable to UUID approach
- Realtime subscriptions enable cross-device sync
- Generous free tier suitable for MVP

**Trade-offs**:
- Vendor lock-in (mitigated by standard PostgreSQL underneath)
- Less control over API design (acceptable for CRUD operations)
- Requires understanding of RLS policies

### 6. Modified SuperMemo 2 for SRS

**Decision**: Implement SM-2 algorithm rather than more complex alternatives (SM-15, Anki's algorithm).

**Rationale**:
- Well-documented and proven effective for spaced repetition
- Simpler to implement and debug than newer algorithms
- Sufficient for educational use case
- Adaptable to skill-based rather than card-based learning
- Transparent algorithm enables user understanding

**Trade-offs**:
- Less sophisticated than modern algorithms (acceptable for MVP)
- May not optimize as aggressively (can iterate based on data)

### 7. Template-Based Content System

**Decision**: Define exercises as templates with constraint-based parameter generation.

**Rationale**:
- Enables infinite content variation from finite definitions
- Separates content structure from presentation
- Allows curriculum experts to define templates without coding
- Facilitates quality assurance (review template, not instances)
- Supports multiple languages through template localization

**Trade-offs**:
- More complex than static exercise database
- Requires careful constraint design to avoid invalid instances
- Template quality directly impacts user experience

### 8. Progressive Web App Architecture

**Decision**: Build as PWA with service worker and offline capability.

**Rationale**:
- Enables practice without internet connection (critical for accessibility)
- Installable on devices without app store friction
- Background sync ensures data persistence
- Reduces server load through caching
- Modern web capabilities (notifications, etc.) available if needed

**Trade-offs**:
- Service worker complexity (mitigated by Workbox or similar)
- Cache invalidation challenges (managed through versioning)
- iOS limitations (acceptable, core functionality works)

### 9. Privacy-Preserving Analytics

**Decision**: Collect only anonymous aggregate analytics, no individual tracking.

**Rationale**:
- Respects user privacy (GDPR compliant)
- Provides sufficient data for platform improvement
- No third-party analytics services (data stays in-house)
- Builds trust with users and parents
- Reduces legal and compliance burden

**Trade-offs**:
- Cannot track individual user journeys (acceptable for privacy)
- Less detailed insights than full analytics (sufficient for needs)
- Requires custom implementation (manageable scope)

### 10. Curriculum-First Design

**Decision**: Structure entire system around Danish Fælles Mål curriculum.

**Rationale**:
- Ensures educational validity and relevance
- Enables explicit mapping of content to standards
- Facilitates teacher adoption and trust
- Supports assessment of competency goal achievement
- Differentiates from generic math practice platforms

**Trade-offs**:
- Less flexible for other curricula (acceptable for target market)
- Requires curriculum expertise for content development
- Updates needed when curriculum changes (manageable maintenance)

## Security Considerations

### Authentication Security

**UUID Generation**
- Use `crypto.randomUUID()` for cryptographically secure generation
- 128-bit entropy provides 2^128 possible values (effectively unguessable)
- Format validation on entry prevents injection attacks

**Session Management**
- HttpOnly cookies prevent JavaScript access (XSS protection)
- Secure flag ensures HTTPS-only transmission
- SameSite: Strict prevents CSRF attacks
- Session tokens rotate every 24 hours
- Logout clears all session data and cookies

**Rate Limiting**
- 5 UUID entry attempts per minute per IP address
- Exponential backoff on failed attempts
- Temporary IP blocking after 20 failed attempts in 1 hour

### Data Security

**At Rest**
- Supabase encrypts database at rest (AES-256)
- Backups encrypted with separate keys
- No sensitive data stored (only UUID and practice data)

**In Transit**
- All communication over HTTPS with TLS 1.3
- Certificate pinning for Supabase API (if supported)
- Secure WebSocket (wss://) for realtime features

**Access Control**
- Row Level Security enforced at database level
- No direct database access from client
- API access controlled by Supabase policies
- Service role key never exposed to client

### Application Security

**Input Validation**
- All user input sanitized before processing
- Answer formats validated against expected types
- No code execution possible from user input
- SQL injection prevented by parameterized queries (Supabase)

**XSS Prevention**
- Astro and SolidJS escape output by default
- Content Security Policy headers restrict script sources
- No `dangerouslySetInnerHTML` or equivalent usage
- User-generated content (answers) never rendered as HTML

**CSRF Protection**
- SameSite: Strict cookies prevent cross-site requests
- No state-changing GET requests
- CORS headers restrict API access to known origins

**Dependency Security**
- Regular dependency updates via Dependabot
- Automated vulnerability scanning in CI/CD
- Minimal dependency tree to reduce attack surface
- Pin exact versions in production builds

### Privacy Protection

**Data Minimization**
- Collect only essential data (UUID, progress, preferences)
- No personal information requested or stored
- No tracking cookies or analytics scripts
- No third-party integrations that collect data

**User Rights**
- View all data: Dashboard shows complete progress
- Export data: JSON export of all user data
- Delete data: One-click account deletion removes all records
- Transparent practices: Clear privacy policy

**Compliance**
- GDPR compliant by design (no personal data)
- No cookie consent needed (only essential cookies)
- Data retention policy: Active accounts indefinite, inactive 2 years
- Right to be forgotten: Complete data deletion on request

## Performance Optimization Strategies

### Build-Time Optimizations

**Code Splitting**
- Route-based splitting (each page is separate chunk)
- Component-level splitting for large islands
- Dynamic imports for rarely-used features
- Shared chunks for common dependencies

**Asset Optimization**
- Image optimization with Astro's built-in tools
- WebP format with fallbacks
- Responsive images with srcset
- Lazy loading for below-fold images
- SVG optimization and inlining for icons

**CSS Optimization**
- UnoCSS purges unused styles
- Critical CSS inlined in HTML
- Non-critical CSS loaded asynchronously
- CSS minification and compression

**JavaScript Optimization**
- Tree shaking removes unused code
- Minification with terser
- Compression (gzip/brotli) at CDN level
- Preload critical JavaScript

### Runtime Optimizations

**Exercise Generation**
- Pre-compute parameter bounds at template registration
- Cache constraint validation results
- Memoize expensive calculations
- Generate exercise pool in background (Web Worker if needed)

**Rendering Performance**
- SolidJS fine-grained reactivity minimizes re-renders
- Virtual scrolling for long lists (exercise history)
- Debounce user input handlers
- Throttle scroll and resize handlers
- RequestAnimationFrame for animations

**Data Loading**
- Batch database queries on session start
- Debounce progress updates (write every 30 seconds)
- Optimistic UI updates (assume success)
- Background sync for non-critical writes
- Cache frequently accessed data in memory

**Offline Performance**
- Service worker caches all static assets
- IndexedDB for structured data storage
- Pre-generate exercise pool for offline use
- Compress cached data to reduce storage

### Monitoring and Metrics

**Core Web Vitals**
- LCP (Largest Contentful Paint): Target < 2.5s
- FID (First Input Delay): Target < 100ms
- CLS (Cumulative Layout Shift): Target < 0.1

**Custom Metrics**
- Exercise generation time: Target < 10ms
- Answer validation time: Target < 1ms
- Progress calculation time: Target < 5ms
- Sync queue processing time: Target < 100ms per item

**Monitoring Tools**
- Lighthouse CI in build pipeline
- Real User Monitoring (RUM) for production metrics
- Error tracking with source maps
- Performance budgets enforced in CI

