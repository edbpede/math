---
name: astro-solid-stack
description: Production-ready Astro + SolidJS + UnoCSS + Supabase patterns for static-hosted development
---

You are an expert in modern static site generation using Astro 5.x, SolidJS 1.8+, UnoCSS 0.62+, Supabase v2+, and TypeScript 5.x, specializing in SSG optimization, fine-grained reactivity, and secure database patterns.

## Purpose

Build performant, type-safe static applications with islands architecture, leveraging content collections, discriminated unions, atomic CSS, and row-level security for production deployments.

## Astro Architecture

### Content & Routing
- **Use content collections over glob imports**: Provides automatic type generation via Zod schemas, compile-time validation, and superior performance compared to runtime parsing.
- **Generate static paths with getStaticPaths()**: Pre-renders dynamic routes at build time for CDN-cacheable HTML with zero server processing and automatic 404 handling.
- **Implement middleware for auth state**: Centralizes authentication checks and session refresh across all routes before page rendering, ensuring consistent auth state.

### Islands Strategy
- **Create discrete islands ≤10KB each**: Wrap only minimal DOM requiring reactivity; each island hydrates independently enabling parallel loading and granular execution control.
- **Prioritize client:visible for below-fold, client:idle for deferred, client:load only for critical**: Defers 70-90% of JavaScript execution until needed, dramatically improving Interaction to Next Paint.
- **Use View Transitions for SPA-like navigation**: Provides smooth transitions without full page reloads while maintaining SSG benefits; auto-handles fallbacks for unsupported browsers.

### Configuration
- **Use astro:env API with schema definition**: Provides runtime validation at startup and compile-time type safety with automatic client/server separation preventing secret leakage.
- **Configure base path for GitHub Pages subdirectory**: Prevents broken links and missing assets when serving from `/repo-name/` path; use custom domain with CNAME to avoid complexity.

## SolidJS Reactivity

### Reactive Primitives
- **Use signals for primitives, stores for nested objects, never destructure**: Destructuring breaks reactivity by reading values outside tracking scope; signals provide optimal performance with automatic subscription tracking.
- **Apply splitProps() for separation, mergeProps() for defaults**: Preserves reactivity during prop manipulation; destructuring reads values immediately and loses reactive connections.
- **Use Show over ternaries, For for objects, Index for primitives**: Built-in control flow enables fine-grained reactivity and type narrowing; For keys by reference, Index keys by index for optimal reconciliation.

### Async & Resources
- **Use createResource with Suspense and ErrorBoundary wrappers**: Provides declarative async fetching with automatic refetching and caching; never access .loading or .error properties directly for SSR compatibility.
- **Use Nanostores for cross-island state**: Framework-agnostic state management (0.2KB) works across React, SolidJS, Vue with consistent API; prevents vendor lock-in in multi-framework codebases.

## UnoCSS Configuration

### Setup & Presets
- **Use dedicated uno.config.ts in project root**: Enables IDE support, ESLint integration, and HMR performance with automatic discovery and hot reload without build restarts.
- **Use presetWind for Tailwind compatibility, add presetAttributify for complex components, presetIcons for pure CSS icons**: Wind provides 200x faster generation; Attributify improves readability for 10+ utility combinations; Icons delivers 10,000+ icons as pure CSS without JavaScript.

### Dynamic Classes
- **Safelist only programmatically-generated classes static analysis cannot detect**: Dynamic string concatenation breaks build-time extraction; prefer static mapping objects to enable extraction without safelist overhead.
- **Define design tokens in theme config for auto-generated CSS variables**: Semantic token naming enables theme switching without class changes; tokens flow through all utilities automatically.

## Supabase Patterns

### Database Design
- **Wrap auth.uid() in (SELECT auth.uid()) for RLS policies**: Enables PostgreSQL initPlan caching, evaluating function once per statement instead of per row for 50-200x performance improvement.
- **Use timestamptz not timestamp, numeric(12,2) for money, UUIDv7 for distributed IDs**: timestamptz stores absolute UTC preventing timezone bugs; numeric prevents floating-point rounding; UUIDv7 embeds timestamp for sortability reducing B-tree fragmentation.
- **Create B-tree indexes on all WHERE clause and RLS policy columns**: Accelerates queries 10-100x; use GIN for JSONB containment queries, BRIN for time-series data (1000x smaller indexes).

### Real-Time & Storage
- **Prefer Broadcast for ephemeral events, postgres_changes only for persisted data**: Broadcast has <50ms latency and better scalability for transient events; postgres_changes subscribe to database WAL for persistence requirements.
- **Enable RLS on storage.objects table**: Maps storage operations to database permissions using same policy language; use storage.foldername() helper for path-based access control.

### Edge Functions
- **Use JSR imports, design functions as idempotent, complete in <10s**: JSR provides native Deno support with built-in TypeScript; idempotency prevents duplicate side effects during retries; timeout protection for cold starts.

### Type Safety
- **Auto-generate TypeScript types with supabase gen types**: Provides end-to-end type safety from database to UI; use QueryData for join queries to infer nested types from query structure.
- **Use Supavisor transaction mode (port 6543) for serverless, session mode (5432) for long connections**: Transaction mode minimizes overhead for short-lived connections; session mode supports all PostgreSQL features including prepared statements.

## TypeScript Patterns

### Strict Configuration
- **Enable strict plus noUncheckedIndexedAccess, noPropertyAccessFromIndexSignature, exactOptionalPropertyTypes**: Catches 80% of "cannot read property of undefined" errors at compile time; forces handling of potentially undefined array/object access.
- **Use moduleResolution: bundler with path aliases**: Matches modern build tool behavior preventing false errors; path aliases eliminate brittle relative imports while maintaining full type checking.

### Type Design
- **Use discriminated unions with status field for async state**: Prevents impossible states through exhaustive type checking; TypeScript narrows types based on discriminant field catching logic errors at compile time.
- **Use utility types (Partial, Required, Pick, Omit) and conditional types with infer**: Eliminates manual type duplication enabling type-safe refactoring; conditional types provide advanced manipulation for generic patterns.

### Framework Integration
- **Define Props interface in Astro components**: Enables autocomplete and type checking across component usage; install @astrojs/ts-plugin for .astro imports in TypeScript files.
- **Pass Database type to createClient once for automatic query typing**: Single type annotation provides complete type safety for entire query chain; regenerate types on schema changes to maintain accuracy.

## Performance Optimization

### Bundle Splitting
- **Configure manualChunks to separate vendor from application code**: Vendor chunks rarely change staying cached while app code updates frequently, reducing download volume 70-90% for returning users.
- **Use dynamic imports for route-based and component-level splitting**: Loads only code for visited routes and visible components; wrap in lazy() for SolidJS reducing initial payload 40-70%.

### Images & Caching
- **Use Astro Picture with formats=['avif', 'webp'] and responsive widths**: AVIF provides 50% better compression than JPEG; responsive widths prevent serving desktop images to mobile; add priority to LCP candidate.
- **Set Cache-Control: public, max-age=31536000, immutable for hashed assets**: Enables permanent caching with cache-busting via filename hash achieving 99%+ cache hit rate for returning visitors.
- **Use max-age=60, stale-while-revalidate=300 for API responses**: Serves cached content instantly (<100ms) while background revalidation updates cache, reducing perceived latency from 2-5s to <100ms for 95% of requests.

### Query Optimization
- **Index all columns in WHERE clauses and RLS policies**: Use EXPLAIN ANALYZE to verify index usage revealing sequential scans (bad) vs index scans (good).
- **Use Supabase relationship syntax for single-query joins**: Eliminates N+1 queries causing exponential slowdown reducing 100 queries to 1, improving response from seconds to milliseconds.

## Security Practices

### XSS & CSP
- **Use framework auto-escaping; sanitize user HTML with DOMPurify**: Frameworks auto-escape by default; never use innerHTML with untrusted data to prevent XSS attacks.
- **Enable Astro experimental CSP with hash-based policies**: Prevents XSS by restricting resource sources; never use 'unsafe-inline' in production as Astro 5.9+ auto-generates hashes.

### Access Control
- **Enable RLS on all public tables with indexed policy columns**: Enforces database-level access control; SELECT wrapping of auth.uid() enables query planner caching (10-100x faster).
- **Store keys in .env locally, platform secrets in production with PUBLIC_ prefix**: Prevents version control leakage; Supabase provides separate anon (public) and service_role (private) keys.
- **Allowlist specific origins in CORS configuration**: Never use * wildcard in production to prevent unauthorized domains accessing API.

### Input Validation
- **Validate all input with Zod schemas**: Prevents injection attacks and type coercion vulnerabilities; file uploads need magic byte validation and path validation must prevent ../ traversal.
- **Run npm audit weekly, enable Dependabot**: Supply chain attacks target npm; regular audits catch known CVEs while continuous monitoring catches new vulnerabilities.

## Development Workflow

### Tooling
- **Use Biome over ESLint+Prettier**: 10-35x faster linting/formatting consolidating tools into single Rust-based package, reducing node_modules from ~127 to 1 package with 97% Prettier compatibility.
- **Use Vitest with Astro Container API for unit/component tests, Playwright for E2E**: Vitest integrates with Vite/Astro build system; Container API enables testing Astro components in isolation.

### Local Development
- **Use supabase init + supabase start with Docker for local development**: Enables offline development, faster iteration, RLS testing without production quotas; migration-based schema ensures reproducibility.
- **Use rollup-plugin-visualizer to monitor bundle composition**: Visualization reveals unexpected dependencies preventing bundle bloat from full library imports instead of tree-shakeable subpaths.

## Package Management

### Selection & Versioning
- **Evaluate packages on maintenance (<6mo commits), security (audit history), bundle size (<50KB), TypeScript types, license**: Unmaintained packages accumulate vulnerabilities; large bundles hurt performance; missing types reduce safety.
- **Pin Astro integrations to Astro major, use ^ for SolidJS, lock Supabase to minor ~2.43.0**: Astro integrations tightly coupled to version; Supabase breaking changes rare but significant requiring careful review.

### Monorepo & Migration
- **Use pnpm workspaces with workspace:* for inter-package dependencies**: pnpm provides fastest installs (3x npm) with hardlinked node_modules; workspace protocol ensures local linking.
- **Read CHANGELOG, test in feature branch, use codemods, migrate incrementally**: Major versions contain breaking changes; incremental migration (dev→staging→prod) reduces risk with rollback capability.

## Critical Priorities

1. Enable RLS on all Supabase tables with indexed policy columns
2. Use TypeScript strict mode with noUncheckedIndexedAccess
3. Generate Supabase types and pass to client for end-to-end type safety
4. Configure UnoCSS with uno.config.ts for 200x faster generation
5. Use client directives strategically to defer 70-90% of JavaScript
