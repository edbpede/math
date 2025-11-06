# Supabase Database Migrations

This directory contains SQL migration files for the Arithmetic Practice Portal database schema.

## Overview

The database schema implements a privacy-first, UUID-based authentication system with:
- Anonymous user tracking (no personal data)
- Progress tracking at competency and skills level
- Spaced Repetition System (SRS) for optimal learning
- Append-only exercise history for analytics
- Row Level Security (RLS) for data isolation

## Schema Components

### Tables

1. **users** - Privacy-first user records with UUID-only authentication
2. **competency_progress** - Mastery tracking at competency area level
3. **skills_progress** - Detailed progress with SRS parameters (SuperMemo 2)
4. **exercise_history** - Append-only log of all exercise attempts
5. **sessions** - Practice session tracking with statistics

### Security

All tables have Row Level Security (RLS) enabled to ensure:
- Users can only access their own data
- Database-level enforcement (not just application-level)
- Protection against unauthorized access

### Indexes

Performance indexes are created on:
- Foreign key columns (user_id)
- Query filter columns (created_at, next_review_at)
- RLS policy columns (for optimal query planning)

## Local Development Setup

### Prerequisites

1. Install Supabase CLI:
```bash
# macOS
brew install supabase/tap/supabase

# Other platforms: https://supabase.com/docs/guides/cli
```

2. Install Docker Desktop (required for local Supabase):
   - macOS: https://www.docker.com/products/docker-desktop/
   - Ensure Docker is running before starting Supabase

### Initialize Local Supabase

1. Initialize Supabase in the project (only needed once):
```bash
supabase init
```

2. Start local Supabase services:
```bash
supabase start
```

This will start:
- PostgreSQL database (local)
- Supabase Studio (web UI)
- Auth server
- Realtime server
- Storage server

You'll see output with local URLs and keys. Save these for your `.env` file.

3. Apply migrations:
```bash
supabase db reset
```

This applies all migrations in `supabase/migrations/` to your local database.

### View Local Database

Access Supabase Studio (local web UI):
```bash
supabase studio
```

Or visit: http://localhost:54323

## Production Setup

### Apply Migrations to Production

1. Link to your Supabase project:
```bash
supabase link --project-ref <your-project-ref>
```

2. Push migrations to production:
```bash
supabase db push
```

**⚠️ Warning**: This applies migrations directly to production. Use with caution!

### Alternative: Manual Application

You can also apply migrations manually via the Supabase Dashboard:
1. Go to https://supabase.com/dashboard
2. Select your project
3. Go to SQL Editor
4. Copy and paste the migration SQL
5. Execute

## Generating TypeScript Types

After applying migrations, generate TypeScript types:

```bash
# Generate types from local database
supabase gen types typescript --local > src/lib/supabase/types.ts

# Or from production database
supabase gen types typescript --project-id <your-project-id> > src/lib/supabase/types.ts
```

The generated types provide end-to-end type safety from database to UI.

## Creating New Migrations

### Using Supabase CLI

1. Make changes to your database schema locally (via Studio or SQL)

2. Generate a new migration:
```bash
supabase db diff --use-migra -f <migration_name>
```

3. Review the generated migration file in `supabase/migrations/`

4. Test the migration:
```bash
supabase db reset
```

### Manual Migration Creation

1. Create a new file: `supabase/migrations/YYYYMMDDHHMMSS_description.sql`
   - Use timestamp format for ordering
   - Use descriptive name

2. Write your SQL:
```sql
-- Add a new column
ALTER TABLE users ADD COLUMN new_field TEXT;

-- Update RLS policies if needed
-- Add indexes if needed
```

3. Test locally:
```bash
supabase db reset
```

## Migration Best Practices

### Naming Conventions
- Format: `YYYYMMDDHHMMSS_description.sql`
- Use lowercase with underscores
- Be descriptive but concise
- Example: `20251106120000_add_user_preferences.sql`

### Writing Migrations
- Make migrations idempotent when possible
- Add comments explaining complex logic
- Include rollback instructions in comments
- Test locally before pushing to production

### Schema Changes
- Always add indexes for foreign keys
- Always add indexes for RLS policy columns
- Use `TIMESTAMPTZ` not `TIMESTAMP`
- Use `NUMERIC(12,2)` for monetary values
- Use `CHECK` constraints for validation

### RLS Policies
- Wrap `auth.uid()` in `(SELECT auth.uid())` for performance
  - This enables PostgreSQL query planner caching
  - Can improve performance 50-200x
- Test RLS policies with different user contexts
- Document policy intent in comments

### Performance Considerations
- Create indexes on all WHERE clause columns
- Create indexes on all JOIN columns
- Create partial indexes for filtered queries
- Use `EXPLAIN ANALYZE` to verify index usage

## Environment Variables

Required environment variables (add to `.env`):

```bash
# Local development (from `supabase start` output)
PUBLIC_SUPABASE_URL=http://localhost:54321
PUBLIC_SUPABASE_ANON_KEY=<your-local-anon-key>

# Production
PUBLIC_SUPABASE_URL=https://<your-project>.supabase.co
PUBLIC_SUPABASE_ANON_KEY=<your-production-anon-key>
```

See `.env.example` for complete configuration.

## Troubleshooting

### Migration Fails

1. Check syntax errors in SQL
2. Verify references to existing tables/columns
3. Check for naming conflicts
4. Review error messages carefully

Reset and try again:
```bash
supabase db reset
```

### RLS Policies Not Working

1. Verify RLS is enabled: `ALTER TABLE <table> ENABLE ROW LEVEL SECURITY;`
2. Check policy syntax with `\d+ <table>` in psql
3. Test with different user contexts
4. Verify `auth.uid()` is wrapped in `(SELECT auth.uid())`

### Type Generation Fails

1. Ensure migrations are applied successfully
2. Verify Supabase CLI is up to date
3. Check project link: `supabase status`
4. Try regenerating with `--local` flag first

### Local Database Not Starting

1. Ensure Docker is running
2. Check Docker has sufficient resources
3. Stop and restart: `supabase stop && supabase start`
4. Check logs: `supabase logs`

## Additional Resources

- [Supabase CLI Documentation](https://supabase.com/docs/guides/cli)
- [Supabase Local Development](https://supabase.com/docs/guides/cli/local-development)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [Row Level Security Guide](https://supabase.com/docs/guides/auth/row-level-security)

## Schema Version

Current schema version: **20251106000000** (Initial Schema)

Last updated: 2025-11-06
