---
inclusion: always
---

# Project Structure

## Directory Organization

```
/
├── public/                         # Static assets
├── src/
│   ├── pages/                      # Astro pages (file-based routing)
│   │   ├── index.astro            # Landing page
│   │   ├── dashboard.astro        # Progress overview
│   │   ├── practice/
│   │   │   └── [competency].astro # Practice sessions
│   │   └── settings.astro         # User preferences
│   ├── components/
│   │   ├── islands/               # SolidJS interactive components
│   │   │   ├── UUIDGenerator.tsx
│   │   │   ├── UUIDLogin.tsx
│   │   │   ├── ExercisePractice.tsx
│   │   │   ├── ProgressDashboard.tsx
│   │   │   ├── LanguageSelector.tsx
│   │   │   └── HintSystem.tsx
│   │   ├── static/                # Non-interactive Astro components
│   │   └── layouts/
│   │       └── MainLayout.astro
│   ├── lib/
│   │   ├── curriculum/            # Curriculum type definitions
│   │   ├── exercises/             # Exercise generation engine
│   │   │   ├── template-registry.ts
│   │   │   ├── generator.ts
│   │   │   ├── validator.ts
│   │   │   └── templates/         # Template definitions by area
│   │   ├── mastery/               # Progress tracking and SRS
│   │   ├── i18n/                  # Internationalization
│   │   ├── supabase/              # Backend integration
│   │   └── offline/               # Service worker and sync
│   ├── locales/                   # Translation files
│   │   ├── da-DK/                 # Danish translations
│   │   └── en-US/                 # English translations
│   └── styles/
│       └── global.css
├── .kiro/
│   ├── specs/                     # Feature specifications
│   └── steering/                  # Project guidance documents
└── dist/                          # Build output (git-ignored)
```

## Key Conventions

### Component Organization
- **Islands**: SolidJS components with client-side interactivity (`.tsx`)
- **Static**: Astro components for static content (`.astro`)
- **Layouts**: Shared page layouts with i18n support

### Exercise Templates
- Organized by competency area under `src/lib/exercises/templates/`
- Each template is a TypeScript module exporting template definition
- Templates map explicitly to Danish Fælles Mål curriculum

### Translations
- Structured by locale (da-DK, en-US)
- Split by category (common, auth, competencies, exercises, etc.)
- JSON format with nested keys

### Type Safety
- All curriculum structures have TypeScript definitions
- Database types generated from Supabase schema
- Translation keys have generated types for compile-time checking
