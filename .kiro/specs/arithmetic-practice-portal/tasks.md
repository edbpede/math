# Implementation Plan

- [x] 1. Set up project foundation and type system
  - Create TypeScript type definitions for curriculum structure (CompetencyArea, SkillsArea, GradeRange, Difficulty)
  - Define exercise template interfaces (ExerciseTemplate, TemplateMetadata, ExerciseInstance, Answer)
  - Create progress tracking types (UserProgress, CompetencyProgress, SkillProgress, SRSParameters)
  - Set up i18n type system with translation key interfaces
  - Configure TypeScript strict mode and path aliases
  - _Requirements: 3.1, 3.2, 11.2_

- [ ] 2. Implement Supabase integration and authentication
  - [x] 2.1 Set up Supabase client configuration
    - Install @supabase/supabase-js package
    - Create Supabase client singleton with environment variables
    - Configure client options (auth persistence, realtime)
    - _Requirements: 1.1, 7.2_
  
  - [x] 2.2 Implement UUID-based authentication system
    - Create UUID generation function using crypto.randomUUID()
    - Build UUID formatting utility (XXXX-XXXX-XXXX-XXXX format)
    - Implement UUID validation with format checking
    - Create authentication functions (signIn, signOut, getSession)
    - Set up session management with httpOnly cookies
    - _Requirements: 1.1, 1.2, 1.5_
  
  - [x] 2.3 Create database schema and RLS policies
    - Write SQL migration for users table with UUID primary key
    - Create competency_progress table with user_id foreign key
    - Create skills_progress table with SRS parameters
    - Create exercise_history table (append-only)
    - Create sessions table
    - Implement Row Level Security policies for all tables
    - Create indexes for performance optimization
    - _Requirements: 7.1, 7.2, 12.1_
  
  - [x] 2.4 Build data access layer for progress tracking
    - Create functions to fetch user progress (competency and skills)
    - Implement progress update functions with batching
    - Build exercise history logging functions
    - Create session management functions (start, update, end)
    - Add error handling and retry logic
    - _Requirements: 5.1, 12.2, 12.3, 12.4_

- [ ] 3. Build internationalization (i18n) system
  - [x] 3.1 Create i18n infrastructure
    - Set up locale file structure (da-DK and en-US directories)
    - Create translation JSON files (common, auth, navigation, competencies, exercises, feedback, hints, contexts)
    - Build translation loader function with caching
    - Implement interpolation support for dynamic values
    - Add fallback logic (requested language → Danish)
    - _Requirements: 2.1, 2.2, 2.5_
  
  - [x] 3.2 Implement language-specific context pools
    - Create Danish context pool (names, places, currency, items)
    - Create English context pool with culturally appropriate content
    - Build context selection logic based on user locale
    - Implement context rotation to ensure variety
    - _Requirements: 2.6, 3.3_
  
  - [x] 3.3 Add number and date formatting utilities
    - Implement locale-aware number formatting (Danish: 1.234,56; English: 1,234.56)
    - Create date/time formatting functions per locale
    - Build answer normalization to accept both formats
    - _Requirements: 2.7_
  
  - [x] 3.4 Configure Weblate integration
    - Set up Git-based Weblate synchronization
    - Create Weblate configuration for translation components
    - Document translation workflow for contributors
    - _Requirements: 10.1, 10.2, 10.3, 10.4_

- [x] 4. Implement exercise generation engine
  - [x] 4.1 Build template registry system
    - Create template registry class with indexing by multiple criteria
    - Implement template registration function with validation
    - Build template selection algorithm with filtering and weighting
    - Add anti-repetition tracking for recently used templates
    - _Requirements: 11.1, 11.3_
  
  - [x] 4.2 Create parameter generation system
    - Build constraint satisfaction engine for parameter generation
    - Implement parameter validation against constraints
    - Create deterministic random number generator from seed
    - Add parameter relationship handling (dependent parameters)
    - _Requirements: 3.3, 11.2_
  
  - [x] 4.3 Implement exercise instance generator
    - Create instance generation function (template + seed → instance)
    - Build question text rendering with parameter substitution
    - Implement correct answer computation
    - Add distractor generation for multiple choice exercises
    - Generate exercise instances in batches (20-30 at a time)
    - _Requirements: 3.4, 11.4_
  
  - [x] 4.4 Build answer validation system
    - Create answer validation function with equivalence checking
    - Implement tolerance handling for numeric answers
    - Add fraction/decimal equivalence recognition
    - Support multiple correct answer formats
    - _Requirements: 3.6, 8.1_

- [x] 5. Create starter exercise templates for Tal og Algebra
  - [x] 5.1 Implement basic arithmetic templates (grades 0-3)
    - Create addition template (single and double digit)
    - Create subtraction template (single and double digit)
    - Create simple multiplication template (up to 10x10)
    - Create simple division template (with whole number results)
    - Map templates to Tal og Algebra competency and skills areas
    - _Requirements: 3.1, 3.2, 3.5_
  
  - [x] 5.2 Implement place value and number sense templates
    - Create number comparison template (greater/less than)
    - Create place value identification template
    - Create number ordering template
    - Create rounding template
    - _Requirements: 3.1, 3.2_
  
  - [x] 5.3 Build fraction and decimal templates (grades 4-6)
    - Create fraction representation template
    - Create fraction equivalence template
    - Create decimal place value template
    - Create fraction/decimal conversion template
    - _Requirements: 3.1, 3.2_

- [x] 6. Implement progressive hint system
  - [x] 6.1 Create hint generation framework
    - Build hint level structure (4 progressive levels)
    - Implement hint generation function per template
    - Create hint display component with level progression
    - Add hint usage tracking for mastery calculation
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_
  
  - [x] 6.2 Add worked solution generator
    - Create step-by-step solution builder
    - Implement solution rendering with intermediate steps
    - Add visual aids for geometric and visual problems
    - _Requirements: 4.3, 8.4_

- [x] 7. Build mastery tracking and SRS system
  - [x] 7.1 Implement mastery calculation engine
    - Create mastery score computation from recent performance
    - Add response speed weighting to mastery calculation
    - Implement hint usage penalty in mastery scoring
    - Build consistency tracking over time
    - Add time decay for older performance data
    - _Requirements: 5.2, 5.7_
  
  - [x] 7.2 Implement SuperMemo 2 spaced repetition algorithm
    - Create SRS parameter initialization (ease factor, interval, repetition count)
    - Implement interval calculation on correct answers (exponential growth)
    - Add interval reset logic on incorrect answers
    - Build ease factor adjustment based on response quality
    - Create next review date calculation
    - _Requirements: 5.3, 5.4, 5.5_
  
  - [x] 7.3 Build session composition algorithm
    - Implement content balancing (new 10-30%, review 40-60%, targeted 10-30%, random 10-20%)
    - Create review queue based on SRS next review dates
    - Add weak area identification and targeting
    - Build template selection with SRS priority weighting
    - _Requirements: 5.6_

- [ ] 8. Create core UI components with SolidJS
  - [x] 8.1 Build UUID generation and display component
    - Create UUIDGenerator island component
    - Implement copy to clipboard functionality
    - Add download as text file feature
    - Build QR code generation and display
    - Create save instructions display
    - _Requirements: 1.2, 1.3, 14.2_
  
  - [x] 8.2 Build UUID login component
    - Create UUIDLogin island with formatted input
    - Implement real-time formatting as user types
    - Add validation and error messaging
    - Build "Remember this device" checkbox with local storage
    - Implement rate limiting display (attempts remaining)
    - _Requirements: 1.4, 15.3_
  
  - [x] 8.3 Create language selector component
    - Build LanguageSelector island with flag icons
    - Implement instant language switching without reload
    - Add current language highlighting
    - Create language preference persistence to Supabase
    - _Requirements: 2.3, 2.4_
  
  - [x] 8.4 Build exercise practice component
    - Create ExercisePractice island as main practice interface
    - Implement answer input with format validation
    - Add submit button with loading state
    - Build progress indicator (problem X of Y)
    - Create hint button with progressive disclosure
    - Add skip functionality
    - _Requirements: 8.1, 8.2, 8.3, 14.5_
  
  - [x] 8.5 Create feedback display component
    - Build immediate feedback UI (correct/incorrect)
    - Implement positive reinforcement messages for correct answers
    - Add gentle correction display for incorrect answers
    - Create worked solution viewer
    - Add visual aids rendering (diagrams, number lines)
    - _Requirements: 8.2, 8.3, 8.4, 8.5_
  
  - [x] 8.6 Build progress dashboard component
    - Create ProgressDashboard island with mastery visualizations
    - Implement competency area cards with mastery percentages
    - Add skills area breakdown with progress bars
    - Build color-coded mastery indicators (red/yellow/green/blue)
    - Create practice streak counter
    - Display review schedule with upcoming priorities
    - _Requirements: 5.7, 15.1_

- [ ] 9. Create Astro pages and layouts
  - [x] 9.1 Build main layout with navigation
    - Create MainLayout.astro with header and footer
    - Implement navigation menu with i18n support
    - Add language selector integration
    - Build responsive layout for mobile and desktop
    - _Requirements: 2.1, 9.4_
  
  - [ ] 9.2 Create landing page
    - Build index.astro with clean, welcoming design
    - Add brief explanation (1-2 sentences)
    - Implement "Start Practice" primary action
    - Add "I have a practice number" secondary link
    - Integrate language auto-detection
    - _Requirements: 14.1_
  
  - [ ] 9.3 Build dashboard page
    - Create dashboard.astro with progress overview
    - Add personalized welcome message
    - Implement recommended practice section (SRS-based)
    - Build competency area navigation cards
    - Add quick continue option
    - _Requirements: 15.1_
  
  - [ ] 9.4 Create practice session page
    - Build practice/[competency].astro dynamic route
    - Implement session setup (difficulty selection, mode selection)
    - Integrate ExercisePractice component
    - Add session completion summary
    - _Requirements: 14.5_
  
  - [ ] 9.5 Build settings page
    - Create settings.astro with user preferences
    - Add grade level selection
    - Implement display preferences (theme, font size, dyslexia font)
    - Build UUID management section (view, export, delete account)
    - _Requirements: 9.1, 9.2_

- [ ] 10. Implement offline functionality with service worker
  - [ ] 10.1 Set up service worker infrastructure
    - Create service worker registration in main app
    - Implement cache versioning strategy
    - Build static asset caching (HTML, CSS, JS, fonts)
    - Add exercise template caching
    - _Requirements: 6.1, 6.2_
  
  - [ ] 10.2 Build IndexedDB storage layer
    - Create IndexedDB wrapper with typed stores
    - Implement exercise instance cache store
    - Build sync queue store for pending updates
    - Add progress cache store
    - Create preferences store
    - _Requirements: 6.2_
  
  - [ ] 10.3 Implement offline sync queue
    - Create sync queue manager for pending operations
    - Build queue persistence to IndexedDB
    - Implement background sync when connection restored
    - Add conflict resolution (last-write-wins, max mastery)
    - Create sync status indicators in UI
    - _Requirements: 6.3, 6.4, 6.5, 15.4_
  
  - [ ] 10.4 Add PWA manifest and installability
    - Create manifest.json with app metadata
    - Add app icons in multiple sizes
    - Configure display mode (standalone)
    - Implement install prompt handling
    - _Requirements: 6.6_

- [ ] 11. Implement accessibility features
  - [ ] 11.1 Add keyboard navigation support
    - Ensure all interactive elements are keyboard accessible
    - Implement focus management for modals and overlays
    - Add skip navigation links
    - Create keyboard shortcuts for common actions
    - _Requirements: 9.1_
  
  - [ ] 11.2 Build screen reader support
    - Add ARIA labels and landmarks to all components
    - Implement descriptive alternative text for images
    - Create MathML rendering for mathematical expressions
    - Add live regions for dynamic content updates
    - _Requirements: 9.4_
  
  - [ ] 11.3 Implement visual accessibility options
    - Create high contrast mode toggle
    - Add dyslexia-friendly font option (OpenDyslexic)
    - Ensure color contrast ratios meet WCAG 2.1 AA (4.5:1)
    - Implement scalable text (respects user zoom)
    - Build clear focus indicators
    - _Requirements: 9.2_
  
  - [ ] 11.4 Add motor accessibility features
    - Ensure touch targets are minimum 44x44 pixels
    - Implement generous click areas
    - Remove time-pressured interactions (except challenge mode)
    - Add voice input support (browser-based)
    - _Requirements: 9.3_

- [ ] 12. Implement security measures
  - [ ] 12.1 Add rate limiting for UUID entry
    - Implement client-side rate limiting (5 attempts per minute)
    - Add exponential backoff on failed attempts
    - Display remaining attempts to user
    - _Requirements: 1.5, 7.4_
  
  - [ ] 12.2 Configure security headers
    - Set Content Security Policy headers
    - Add Secure and HttpOnly flags to cookies
    - Configure SameSite: Strict for CSRF protection
    - Ensure HTTPS-only transmission
    - _Requirements: 1.5, 7.3_
  
  - [ ] 12.3 Implement input validation and sanitization
    - Validate all user input formats
    - Sanitize answer inputs before processing
    - Add XSS prevention (framework defaults + CSP)
    - Implement SQL injection prevention (Supabase parameterized queries)
    - _Requirements: 7.5_

- [ ] 13. Build performance optimizations
  - [ ] 13.1 Implement code splitting and lazy loading
    - Configure route-based code splitting
    - Add dynamic imports for large components
    - Implement lazy loading for below-fold images
    - Create shared chunks for common dependencies
    - _Requirements: 13.3_
  
  - [ ] 13.2 Optimize asset delivery
    - Convert images to WebP format with fallbacks
    - Implement responsive images with srcset
    - Inline critical CSS in HTML
    - Add preload hints for critical resources
    - Configure compression (gzip/brotli)
    - _Requirements: 13.4, 13.5_
  
  - [ ] 13.3 Add runtime performance optimizations
    - Implement exercise pool pre-generation in background
    - Add memoization for expensive calculations
    - Debounce user input handlers
    - Use virtual scrolling for long lists
    - Optimize SolidJS reactivity with batching
    - _Requirements: 13.1, 13.2_

- [ ] 14. Create session management and persistence
  - [ ] 14.1 Implement session lifecycle management
    - Create session start function with Supabase record creation
    - Build session state management with SolidJS stores
    - Implement session pause and resume functionality
    - Add session end with summary statistics
    - _Requirements: 12.1, 12.5_
  
  - [ ] 14.2 Build progress persistence layer
    - Implement debounced progress updates (every 30 seconds)
    - Create batch write operations for efficiency
    - Add optimistic UI updates
    - Build error handling and retry logic
    - _Requirements: 12.3, 12.4_
  
  - [ ] 14.3 Add cross-device synchronization
    - Implement Supabase Realtime subscriptions (optional)
    - Build progress broadcast to active devices
    - Add sync status display in UI
    - Create manual sync trigger
    - _Requirements: 15.2, 15.5_

- [ ] 15. Implement first-time user experience
  - [ ] 15.1 Build onboarding flow
    - Create welcome screen with brief explanation
    - Implement UUID generation and save flow
    - Build grade level selection interface
    - Add competency area introduction
    - Create optional tutorial overlay (dismissible)
    - _Requirements: 14.1, 14.2, 14.3, 14.4, 14.5_
  
  - [ ] 15.2 Add returning user flow
    - Build UUID entry interface
    - Implement session restoration
    - Create personalized dashboard
    - Add recommended practice suggestions
    - _Requirements: 1.4, 15.1_

- [ ] 16. Add UnoCSS styling system
  - [ ] 16.1 Configure UnoCSS with presets
    - Set up UnoCSS configuration file
    - Add utility presets (typography, colors, spacing)
    - Configure custom theme colors
    - Add responsive breakpoints
    - _Requirements: 9.1, 9.2_
  
  - [ ] 16.2 Create component styles
    - Build button styles with variants
    - Create card component styles
    - Add form input styles
    - Implement progress bar styles
    - Create badge and indicator styles
    - _Requirements: 5.7, 8.2, 8.3_
  
  - [ ] 16.3 Implement responsive layout utilities
    - Create grid and flexbox utilities
    - Add spacing utilities
    - Build responsive typography scale
    - Implement container utilities
    - _Requirements: 9.1_

- [ ] 17. Create error handling and user feedback
  - [ ] 17.1 Implement error boundaries
    - Add SolidJS error boundaries to island components
    - Create fallback UI for component errors
    - Build global error handler for unhandled rejections
    - _Requirements: 8.1, 8.2_
  
  - [ ] 17.2 Build user-facing error messages
    - Create error message translation keys
    - Implement toast notification system
    - Add inline validation messages
    - Build error recovery actions
    - _Requirements: 8.2, 8.3_
  
  - [ ] 17.3 Add network error handling
    - Implement retry logic with exponential backoff
    - Build offline mode automatic activation
    - Create sync failure notifications
    - Add manual retry options
    - _Requirements: 6.3, 6.4_

- [ ] 18. Build deployment configuration
  - [ ] 18.1 Configure build process
    - Set up production build script
    - Add environment variable configuration
    - Configure asset optimization
    - Set up source maps for debugging
    - _Requirements: 13.3, 13.4, 13.5_
  
  - [ ] 18.2 Add deployment scripts
    - Create deployment configuration for Vercel/Netlify
    - Set up automatic preview deployments
    - Configure production deployment triggers
    - Add rollback capability
    - _Requirements: 13.1_
  
  - [ ] 18.3 Set up monitoring and analytics
    - Implement privacy-preserving analytics
    - Add error tracking
    - Configure performance monitoring
    - Set up uptime monitoring
    - _Requirements: 7.6_
