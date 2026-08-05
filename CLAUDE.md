# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

Astro 5 static site with SolidJS islands: an offline-first Danish arithmetic practice portal. Package manager is Bun (pinned via `packageManager` in `package.json`).

## Essential Commands

Run all commands from the repository root.

| Command | Purpose |
| --- | --- |
| `bun install` | Install dependencies (CI uses `--frozen-lockfile`) |
| `bun run dev` | Dev server on `localhost:4321` |
| `bun run test` | Vitest watch mode |
| `bun run test:run` | Vitest single pass — the CI test command |
| `bun run test:run src/lib/exercises/hint-tracker.test.ts` | Run one test file |
| `bun run test:run -t "normalizes answers"` | Run tests matching a name |
| `bun run lint` / `bun run lint:fix` | Biome format + lint (`--write` for fixes) |
| `bunx biome ci .` | Exact non-writing gate CI enforces |
| `bun tsc --noEmit` | Type check — there is no npm script for this |
| `bun run build` | Full production build; **requires Supabase env vars** |
| `bun run build:skip-validation` | Same pipeline minus `validate-env`; use when no `.env` exists |
| `bun run validate-translations` | Check `en-US` against `da-DK` |
| `bun run preview` | Serve `./dist` |

Never run `bun test` — Bun's native runner is incompatible with this SolidJS + jsdom setup. Always `bun run test*` so Vitest and `vitest.config.ts` are used.

Targeted translation checks (use these forms; the `validate-translations:locale` / `:component` scripts end in a dangling `=` and need the value appended):

```bash
bun run validate-translations --locale=en-US
bun run validate-translations --component=common
```

Full local validation sequence, mirroring CI: `bunx biome ci . && bun run validate-translations && bun run test:run && bun tsc --noEmit && bun run build:skip-validation`.

`bun run lint` currently exits 0 with ~197 warnings and ~21 infos. Warnings are non-blocking; do not mass-fix them as part of an unrelated change.

## Architecture Overview

- **`src/lib/`** holds all domain logic, one directory per concern, each with `types.ts` and usually an `index.ts` barrel. Import through the barrel (e.g. `@/lib/i18n`), not deep paths.
- **`src/components/islands/`** are SolidJS `.tsx` components that hydrate client-side. **`src/components/static/`** and **`layouts/`** are Astro components with no client JS. Put anything interactive in `islands/`.
- **`src/middleware.ts`** runs on every request: validates the session cookie, populates `Astro.locals.user` / `Astro.locals.session`, refreshes tokens halfway through their lifetime, and applies security headers from `src/lib/security` to *every* response — including the error path. Read auth state from `Astro.locals`, never re-parse cookies in a page.
- **Exercise pipeline**: `src/lib/exercises/template-registry.ts` exports a singleton `templateRegistry` plus thin function wrappers. `generator.ts` and `session/composer.ts` select and instantiate templates through that singleton. Templates live in `src/lib/exercises/templates/<competency>/` and satisfy the `ExerciseTemplate` interface in `src/lib/exercises/types.ts` (`metadata`, `parameters`, `generate`, `validate`, `hints`).
- **Data flow is offline-first**: IndexedDB (via `idb`, in `src/lib/offline/`) is primary; Supabase sync is secondary and reconciles later.
- **State across islands** uses nanostores (`src/lib/stores/`, `@nanostores/solid`), not props or context.

`astro.config.mjs` sets `output: "static"` with **no adapter configured**. The API routes under `src/pages/api/` therefore do not run in built output — each one carries a comment noting that `export const prerender = false` must be added when deploying with an adapter. Adding an adapter is a deliberate migration, documented in `VERCEL_MIGRATION.md`; do not assume the endpoints are live.

## Repository Conventions

- Components `PascalCase.tsx`; library modules `kebab-case.ts`; tests co-located as `<name>.test.ts(x)` beside the source.
- Biome owns formatting: 2-space indent, 100-char lines, double quotes, always semicolons, trailing commas everywhere. Do not hand-format.
- TypeScript is strict with `noUnusedLocals` / `noUnusedParameters` on, while Biome has `noUnusedImports` / `noUnusedVariables` **off**. `bun tsc --noEmit` is the authority on dead code — lint will not catch it.
- Danish (`da-DK`) is the source locale; `en-US` is a target. Add keys to `da-DK` first. Validation fails on keys missing from the target *and* on extra keys, so the two locales must match exactly.

## Common Change Workflows

**Adding an exercise template**

1. Create `src/lib/exercises/templates/tal-og-algebra/<name>.ts` exporting a `<name>Templates` array of `ExerciseTemplate`.
2. Add matching `import` + `export` lines and spread it into `talOgAlgebraTemplates` in that directory's `index.ts` — all three places.
3. Add `<name>.test.ts` alongside it.
4. Add any new user-facing strings to `src/locales/da-DK/` and `src/locales/en-US/`.
5. Run `bun run test:run <path>` then `bun tsc --noEmit`.

**Adding a path alias** — declare it in **both** `tsconfig.json` (`compilerOptions.paths`) and `vitest.config.ts` (`resolve.alias`). Only tsconfig is wrong: tests will fail to resolve it.

**Adding a translation file** — create it in both locale directories *and* append its name to the `COMPONENTS` array in `scripts/validate-translations.ts`. That array lists 9 components while `src/locales/da-DK/` holds 14 files, so `accessibility`, `progress`, `settings`, `solutions`, and `sync` are currently unvalidated. Weblate component wiring lives in `.weblate.yaml`.

## Testing and Validation

`vitest.config.ts` is the single source of truth: `jsdom` environment for every test, `isolate: true`, `globals: true`, 10s timeout, and `server.deps.inline` deduping `solid-js`. Suite is 57 files matching `src/**/*.{test,spec}.{ts,tsx}`.

`src/test/setup.ts` runs `initI18n()` and `changeLocale("en-US")` for real, snapshots `$locale`/`$translations`, and restores them in a global `beforeEach`. Assert against English strings.

Do not `vi.mock("@/lib/i18n")`. Replacing that module leaves the real `$translations` atom null for later files in the run, which surfaces as raw keys like `errors.general.unexpected` and produces order-dependent CI-only failures. Stub the narrower dependency instead. `src/test/setup.ts` documents the incident in detail — read it before changing global test setup.

Note: `.kiro/steering/structure.md` and `tech.md` claim `happy-dom` for component tests and `node` for logic tests. That is stale; `vitest.config.ts` sets `jsdom` for everything. Trust the config.

## Critical Gotchas

- **`bun run build` cannot pass on a clean checkout.** `scripts/validate-env.ts` requires a real `.env` file on disk when the Supabase variables are absent from the environment. Use `bun run build:skip-validation` locally and in any new workflow — this is why `.github/workflows/smoke.yml` uses it. Astro still needs `PUBLIC_SUPABASE_URL` and `PUBLIC_SUPABASE_ANON_KEY` set while prerendering.
- **`registerTalOgAlgebraTemplates()` has no production call site.** `src/lib/exercises/templates/tal-og-algebra/index.ts` defines it, and nothing in `src/` imports the barrel, so `templateRegistry` is empty at runtime outside tests that register fixtures themselves. If exercise selection returns nothing, this is why — wire the registration in rather than reaching around the registry.
- **Use the shared Supabase client** exported as `supabase` from `src/lib/supabase/client.ts`. It is the only `createClient` call in the repo and centralizes auth and connection options; a second client would bypass them.
- **`README.md` is largely the unmodified Astro starter template** and links to `TEST_RUNNER_GUIDE.md` and `docs/DEPLOYMENT.md`, neither of which exists. Its command table is accurate; ignore its structure and doc links.
- `.astro/` (generated types), `dist/`, and `bun.lock` are not hand-edited. Biome also excludes `dist`, `.astro`, `.omc`, `public/**/*.svg`, and `public/cache-manifest.json`.

## Additional Documentation

- `.kiro/steering/product.md` — Read for product scope, target grades, and feature intent before adding user-facing behavior.
- `.kiro/steering/structure.md` — Directory map and naming rules; useful orientation, but stale on test environments.
- `.kiro/steering/tech.md` — Stack rationale and path aliases; stale on test environments.
- `.kiro/specs/arithmetic-practice-portal/requirements.md` — Read when code comments cite a numbered requirement (e.g. "Requirement 13.3").
- `.kiro/specs/arithmetic-practice-portal/design.md` — Read before changing the mastery/SRS or offline-sync algorithms.
- `VERCEL_MIGRATION.md` — Read before adding an Astro adapter or enabling server rendering for the API routes.
- `supabase/README.md` and `supabase/migrations/` — Read before any schema change; there is a single initial migration.
- `.weblate.yaml` — Read when adding a locale or translation component.
- `.github/workflows/code-quality.yml` — Read before touching Biome config; a Renovate-only job auto-migrates and pushes to Renovate branches.
- `.github/workflows/smoke.yml` — Read before changing build scripts or routes; it asserts `/`, `/login`, `/onboarding`, `/demo-login`, `/demo-uuid` each serve a `<title>`.
