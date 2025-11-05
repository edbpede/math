# Requirements Document

## Introduction

The Arithmetic Practice Portal is a privacy-first, modular mathematics practice platform designed for Danish public school students (grades 0-9). The system aligns with the official Danish "Fælles Mål" mathematics curriculum and provides infinite exercise variations through a template-based generation system. The platform uses UUID-based anonymous authentication, supports Danish and English languages from launch, and operates as an offline-capable Progressive Web App built with Astro, SolidJS, UnoCSS, and Supabase.

## Glossary

- **Platform**: The complete Arithmetic Practice Portal web application
- **User**: A student practicing mathematics (grades 0-9)
- **UUID**: Universally Unique Identifier serving as anonymous authentication credential
- **Exercise Instance**: A single generated mathematics problem presented to the user
- **Template**: A reusable specification for generating exercise instances with variable parameters
- **Mastery Level**: A numerical score (0-100) indicating user proficiency in a skill or competency area
- **SRS**: Spaced Repetition System for intelligent review scheduling
- **Competency Area**: One of four main curriculum divisions (Matematiske Kompetencer, Tal og Algebra, Geometri og Måling, Statistik og Sandsynlighed)
- **Skills Area**: Subdivision within a competency area (e.g., "Tal" within "Tal og Algebra")
- **Binding Content**: Mandatory curriculum content (kompetencemål, opmærksomhedspunkter)
- **Advisory Content**: Recommended curriculum content (færdigheds- og vidensmål)
- **Session**: A continuous practice period containing multiple exercise instances
- **Hint**: Progressive assistance provided to help users solve exercises
- **Context Pool**: Language-specific collection of real-world scenarios, names, and situations for exercises
- **Supabase**: Backend-as-a-Service providing PostgreSQL database, authentication, and real-time features
- **RLS**: Row Level Security policies enforcing data isolation at database level
- **PWA**: Progressive Web App with offline capability and installability
- **Weblate**: Translation management platform for collaborative internationalization

## Requirements

### Requirement 1: Anonymous UUID-Based Authentication

**User Story:** As a student, I want to access the platform without providing personal information, so that my privacy is protected while my progress is preserved.

#### Acceptance Criteria

1. WHEN a user clicks "Start Practice" for the first time, THE Platform SHALL generate a cryptographically secure 128-bit UUID formatted as four hyphen-separated groups (XXXX-XXXX-XXXX-XXXX)
2. THE Platform SHALL display the generated UUID prominently with clear instructions to save it for future access
3. THE Platform SHALL provide multiple UUID export options including copy to clipboard, download as text file, and QR code display
4. WHEN a user enters a valid UUID on any device, THE Platform SHALL restore complete progress data associated with that UUID
5. THE Platform SHALL persist user sessions via secure httpOnly cookies with sameSite strict attribute and HTTPS-only transmission

### Requirement 2: Multi-Language Support with Internationalization

**User Story:** As a student, I want to use the platform in my preferred language (Danish or English), so that I can understand instructions and practice effectively.

#### Acceptance Criteria

1. THE Platform SHALL support Danish (da-DK) as the default language and English (en-US) from launch
2. WHEN a user first accesses the platform, THE Platform SHALL detect browser language preference and set the interface language to Danish or English if supported, otherwise defaulting to Danish
3. THE Platform SHALL provide a language selector accessible from all pages that allows immediate language switching without page reload
4. THE Platform SHALL store language preference in the Supabase user record and synchronize across all user devices
5. THE Platform SHALL load all user-facing strings from structured JSON files organized by language and content category (common, auth, navigation, competencies, exercises, feedback, hints, contexts)
6. WHEN displaying exercise contexts, THE Platform SHALL select culturally appropriate names, places, currency, and scenarios from language-specific context pools
7. THE Platform SHALL format numbers according to language conventions (Danish: 1.234,56; English: 1,234.56)

### Requirement 3: Curriculum-Aligned Exercise Generation

**User Story:** As a student, I want to practice mathematics problems that align with my grade level and the Danish curriculum, so that my practice supports my school learning.

#### Acceptance Criteria

1. THE Platform SHALL organize content according to the four Danish Fælles Mål competency areas: Matematiske Kompetencer, Tal og Algebra, Geometri og Måling, and Statistik og Sandsynlighed
2. THE Platform SHALL map every exercise template to specific kompetencemål, færdigheds- og vidensområder, grade levels (0-3, 4-6, 7-9), and opmærksomhedspunkter where applicable
3. WHEN generating an exercise instance, THE Platform SHALL apply constraint satisfaction to ensure parameters produce valid, age-appropriate, and educationally sound problems
4. THE Platform SHALL generate exercise instances deterministically from a template and random seed combination
5. THE Platform SHALL provide three difficulty levels (A, B, C) within each grade range representing introductory, developing, and advanced content
6. THE Platform SHALL validate user answers against correct solutions including mathematical equivalences (e.g., 0.5 equals 1/2)

### Requirement 4: Progressive Hint System

**User Story:** As a student, I want to request hints when I'm stuck on a problem, so that I can learn problem-solving strategies without feeling judged.

#### Acceptance Criteria

1. THE Platform SHALL provide a hint button accessible during every exercise without penalty or negative feedback
2. THE Platform SHALL implement four progressive hint levels: general strategy, specific technique, partial solution with intermediate steps, and complete worked solution
3. WHEN a user requests a hint, THE Platform SHALL display the next hint level while keeping previous hints visible
4. THE Platform SHALL track hint usage count per exercise for mastery calculation purposes
5. THE Platform SHALL keep hints available after answer submission for learning review

### Requirement 5: Mastery Tracking with Spaced Repetition

**User Story:** As a student, I want the platform to track my progress and suggest what to practice next, so that I can improve efficiently and retain what I've learned.

#### Acceptance Criteria

1. THE Platform SHALL track mastery levels (0-100) at multiple granularities: competency area, skills area, specific skill, and template level
2. THE Platform SHALL calculate mastery scores from recent performance (last 10-20 attempts weighted heavily), response speed, hint usage, consistency over time, and time decay of older performance
3. THE Platform SHALL implement a modified SuperMemo 2 spaced repetition algorithm with ease factor, interval, and repetition count parameters per skill
4. WHEN a user answers correctly, THE Platform SHALL increase the review interval exponentially (1 day, 3 days, 7 days, 14 days, 30 days)
5. WHEN a user answers incorrectly, THE Platform SHALL reset the review interval to a short period (same day or next day)
6. THE Platform SHALL compose practice sessions balancing new content (10-30%), review content due per SRS (40-60%), targeted weak areas (10-30%), and random variety (10-20%)
7. THE Platform SHALL display mastery progress visually with color coding (red: introduced 0-20, yellow: developing 21-40, light green: progressing 41-60, green: proficient 61-80, blue: mastered 81-100)

### Requirement 6: Offline-Capable Progressive Web App

**User Story:** As a student, I want to practice mathematics even without internet connection, so that I can learn anywhere without interruption.

#### Acceptance Criteria

1. THE Platform SHALL implement a service worker that caches static assets (HTML, CSS, JavaScript, fonts) and exercise templates
2. THE Platform SHALL store exercise history and progress data in IndexedDB for offline access
3. WHEN offline, THE Platform SHALL queue progress updates locally and display clear offline status indication
4. WHEN connection is restored, THE Platform SHALL automatically synchronize queued updates to Supabase in the background
5. THE Platform SHALL resolve sync conflicts using last-write-wins strategy with timestamp comparison, taking maximum mastery level for progress updates
6. THE Platform SHALL provide PWA manifest enabling installation on devices with standalone display mode

### Requirement 7: Privacy-Preserving Data Architecture

**User Story:** As a student, I want my practice data to remain private and secure, so that only I can access my progress and no personal information is collected.

#### Acceptance Criteria

1. THE Platform SHALL store only UUID, timestamps, preferences, and grade level in the users table without collecting name, age, email, school, location, or IP address
2. THE Platform SHALL enforce Row Level Security policies on all Supabase tables ensuring users read and write only their own data (WHERE user_id = auth.uid())
3. THE Platform SHALL transmit all data exclusively over HTTPS with TLS 1.3
4. THE Platform SHALL implement rate limiting of 5 UUID entry attempts per minute per IP address to prevent brute force attacks
5. THE Platform SHALL provide user-initiated data deletion that removes all user records from the database
6. THE Platform SHALL collect only anonymous aggregate analytics without individual student identification, IP addresses, device fingerprinting, or cross-site tracking

### Requirement 8: Immediate Feedback and Learning Support

**User Story:** As a student, I want to know immediately if my answer is correct and understand why, so that I can learn from my mistakes and build confidence.

#### Acceptance Criteria

1. WHEN a user submits an answer, THE Platform SHALL validate the answer and display feedback within 1 second
2. IF the answer is correct, THE Platform SHALL display positive reinforcement with a brief explanation and option to continue
3. IF the answer is incorrect, THE Platform SHALL display gentle correction showing the correct answer and offering a hint without negative language
4. THE Platform SHALL provide an option to view complete worked solution at any time during or after exercise completion
5. THE Platform SHALL include visual aids (diagrams, number lines, charts) in feedback when relevant to support understanding

### Requirement 9: Accessible and Inclusive Interface

**User Story:** As a student with diverse abilities, I want to use the platform with assistive technologies and adaptations, so that I can practice mathematics effectively regardless of my needs.

#### Acceptance Criteria

1. THE Platform SHALL comply with WCAG 2.1 AA standards including sufficient color contrast ratios (minimum 4.5:1), keyboard navigation for all functionality, and semantic HTML with ARIA attributes
2. THE Platform SHALL provide high contrast mode and dyslexia-friendly font options (OpenDyslexic) in settings
3. THE Platform SHALL implement touch targets with minimum size of 44x44 pixels for motor accessibility
4. THE Platform SHALL support screen readers with descriptive ARIA labels, landmarks, alternative text for images, and MathML for mathematical expressions where supported
5. THE Platform SHALL use clear, grade-appropriate language with consistent terminology and optional tooltip definitions for technical terms

### Requirement 10: Translation Management with Weblate

**User Story:** As a translator, I want to contribute translations through a collaborative platform, so that students can use the application in multiple languages with high-quality translations.

#### Acceptance Criteria

1. THE Platform SHALL integrate with Weblate via Git synchronization for collaborative translation management
2. WHEN developers add new strings to Danish JSON files, THE Platform SHALL automatically sync strings to Weblate for translation
3. THE Platform SHALL provide translators with context, screenshots, glossary terms, and translation memory in the Weblate interface
4. WHEN translators complete translations in Weblate, THE Platform SHALL sync completed translations back to the Git repository for inclusion in the next build
5. THE Platform SHALL validate translations for placeholder consistency, formatting correctness, and key completeness during build process
6. THE Platform SHALL maintain a glossary of approved mathematical terminology translations accessible to all translators

### Requirement 11: Template-Based Content Extensibility

**User Story:** As a content developer, I want to create new exercise templates easily, so that the platform can expand curriculum coverage without modifying core code.

#### Acceptance Criteria

1. THE Platform SHALL implement a template registry system that indexes templates by competency area, skills area, grade level, difficulty, binding status, and tags
2. THE Platform SHALL require each template to specify metadata (curriculum mappings, grade level, difficulty), constraint specifications (parameter domains and relationships), generation logic, validation specification, hint strategy, and context pool
3. WHEN selecting an exercise template, THE Platform SHALL filter candidates by user-selected criteria and apply weighted random selection based on SRS priority, binding content status, recency, and user mastery
4. THE Platform SHALL generate 20-30 exercise instances in batch at session start with generation time under 200ms for the batch
5. THE Platform SHALL validate that each template maps explicitly to specific kompetencemål and færdigheds- og vidensområder with appropriate klassetrin

### Requirement 12: Session Management and Progress Persistence

**User Story:** As a student, I want my practice sessions to be saved automatically, so that I can review my history and my progress is never lost.

#### Acceptance Criteria

1. THE Platform SHALL create a session record in Supabase when a user begins practice, storing session UUID, user UUID, start timestamp, grade level, and competency area
2. WHEN a user completes an exercise, THE Platform SHALL append an exercise history record containing instance UUID, user UUID, session UUID, template identifier, timestamp, difficulty level, time spent, correctness, hints used, and user answer
3. THE Platform SHALL update mastery levels in the competency progress and skills progress tables after each exercise completion
4. THE Platform SHALL write progress updates to Supabase every 30 seconds during active sessions using debounced batch writes
5. WHEN a session ends, THE Platform SHALL update the session record with end timestamp, total exercises, correct count, and average time per exercise

### Requirement 13: Performance Optimization

**User Story:** As a student, I want the platform to load quickly and respond instantly, so that I can focus on learning without technical frustration.

#### Acceptance Criteria

1. THE Platform SHALL achieve page load time under 2 seconds and time to interactive under 3 seconds on standard broadband connections
2. THE Platform SHALL generate single exercise instances in under 10 milliseconds
3. THE Platform SHALL implement code splitting by route with lazy loading of SolidJS islands for interactive components
4. THE Platform SHALL optimize assets including lazy loading images, using WebP format, inlining small SVG icons, and subsetting fonts to needed characters
5. THE Platform SHALL purge unused CSS styles with UnoCSS and minify all production assets

### Requirement 14: First-Time User Experience

**User Story:** As a new student, I want to start practicing quickly with clear guidance, so that I can begin learning without confusion or barriers.

#### Acceptance Criteria

1. THE Platform SHALL display a clean landing page with brief explanation (1-2 sentences), visible language selector, and prominent "Start Practice" button
2. WHEN a user clicks "Start Practice", THE Platform SHALL automatically generate and display a UUID with multiple save options before allowing platform access
3. THE Platform SHALL present three clear grade level options (0-3 klasse, 4-6 klasse, 7-9 klasse) with brief descriptions after UUID acknowledgment
4. THE Platform SHALL display four competency area cards with icons and descriptions, indicating binding versus advisory content and providing grade-appropriate recommendations
5. THE Platform SHALL begin the first practice session with easier problems (difficulty A) and provide optional dismissible tutorial overlay

### Requirement 15: Cross-Device Synchronization

**User Story:** As a student, I want to access my progress from any device using my UUID, so that I can practice at school, home, or anywhere with seamless continuity.

#### Acceptance Criteria

1. WHEN a user enters their UUID on a new device, THE Platform SHALL retrieve and display complete progress data including mastery levels, exercise history, and preferences
2. THE Platform SHALL optionally implement Supabase Realtime subscriptions to broadcast progress changes instantly to all active user devices
3. THE Platform SHALL provide a "Remember this device" option that stores the UUID securely in local storage for automatic login
4. THE Platform SHALL display last sync timestamp and online/offline status clearly in the user interface
5. THE Platform SHALL provide a manual sync trigger button accessible from settings
