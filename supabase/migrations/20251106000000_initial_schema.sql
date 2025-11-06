-- ============================================================================
-- Arithmetic Practice Portal - Initial Database Schema
-- ============================================================================
-- This migration creates the complete database schema for the mathematics
-- practice platform including:
-- - Users table (UUID-based, privacy-first)
-- - Progress tracking tables (competency and skills level)
-- - Exercise history (append-only log)
-- - Practice sessions tracking
-- - Row Level Security policies
-- - Performance indexes
--
-- Requirements: 7.1, 7.2, 12.1
-- Design Reference: design.md lines 256-356
-- ============================================================================

-- ============================================================================
-- USERS TABLE
-- ============================================================================
-- Privacy-first user table with UUID-only authentication
-- No personal data collected (name, email, age, school, location, IP)
-- Requirement 7.1: Store only UUID, timestamps, preferences, and grade level

CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_active_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  grade_range TEXT NOT NULL CHECK (grade_range IN ('0-3', '4-6', '7-9')),
  locale TEXT NOT NULL DEFAULT 'da-DK' CHECK (locale IN ('da-DK', 'en-US')),
  preferences JSONB DEFAULT '{}'::jsonb
);

-- Add comment for documentation
COMMENT ON TABLE users IS 'Privacy-first user table with UUID-only authentication. No personal data collected.';
COMMENT ON COLUMN users.id IS 'UUID serving as anonymous authentication credential';
COMMENT ON COLUMN users.grade_range IS 'User grade level (klassetrin): 0-3, 4-6, or 7-9';
COMMENT ON COLUMN users.locale IS 'User preferred language: da-DK (Danish) or en-US (English)';
COMMENT ON COLUMN users.preferences IS 'User preferences (theme, font, display options) stored as JSON';

-- ============================================================================
-- COMPETENCY PROGRESS TABLE
-- ============================================================================
-- Tracks mastery at competency area level (top-level curriculum divisions)
-- Four competency areas: Matematiske Kompetencer, Tal og Algebra,
-- Geometri og Måling, Statistik og Sandsynlighed

CREATE TABLE competency_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  competency_area_id TEXT NOT NULL,
  grade_range TEXT NOT NULL,
  mastery_level INTEGER NOT NULL DEFAULT 0 CHECK (mastery_level >= 0 AND mastery_level <= 100),
  total_attempts INTEGER NOT NULL DEFAULT 0,
  success_rate NUMERIC(5,2) NOT NULL DEFAULT 0.00,
  last_practiced_at TIMESTAMPTZ,
  achieved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, competency_area_id, grade_range)
);

-- Add comments
COMMENT ON TABLE competency_progress IS 'Tracks user mastery at competency area level (top-level curriculum divisions)';
COMMENT ON COLUMN competency_progress.competency_area_id IS 'Danish Fælles Mål competency area identifier';
COMMENT ON COLUMN competency_progress.mastery_level IS 'Mastery score 0-100 (0-20: introduced, 21-40: developing, 41-60: progressing, 61-80: proficient, 81-100: mastered)';
COMMENT ON COLUMN competency_progress.success_rate IS 'Percentage of correct answers (0.00-100.00)';
COMMENT ON COLUMN competency_progress.achieved_at IS 'Timestamp when mastery level >= 80 (proficient) was first achieved';

-- ============================================================================
-- SKILLS PROGRESS TABLE
-- ============================================================================
-- Tracks mastery at skills area level with Spaced Repetition System parameters
-- Implements modified SuperMemo 2 algorithm for optimal review scheduling

CREATE TABLE skills_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  skill_id TEXT NOT NULL,
  mastery_level INTEGER NOT NULL DEFAULT 0 CHECK (mastery_level >= 0 AND mastery_level <= 100),
  attempts INTEGER NOT NULL DEFAULT 0,
  successes INTEGER NOT NULL DEFAULT 0,
  avg_response_time_ms INTEGER,
  -- Spaced Repetition System (SRS) parameters (SuperMemo 2)
  ease_factor NUMERIC(4,2) NOT NULL DEFAULT 2.50,
  interval_days INTEGER NOT NULL DEFAULT 1,
  repetition_count INTEGER NOT NULL DEFAULT 0,
  last_practiced_at TIMESTAMPTZ,
  next_review_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, skill_id)
);

-- Add comments
COMMENT ON TABLE skills_progress IS 'Tracks user mastery at skills area level with Spaced Repetition System parameters';
COMMENT ON COLUMN skills_progress.skill_id IS 'Skills area identifier within competency area';
COMMENT ON COLUMN skills_progress.avg_response_time_ms IS 'Average time to answer in milliseconds';
COMMENT ON COLUMN skills_progress.ease_factor IS 'SRS ease factor (2.5 = default, >2.5 = easier, <2.5 = harder)';
COMMENT ON COLUMN skills_progress.interval_days IS 'Current interval between reviews in days';
COMMENT ON COLUMN skills_progress.repetition_count IS 'Number of successful consecutive reviews';
COMMENT ON COLUMN skills_progress.next_review_at IS 'Scheduled next review date/time for SRS';

-- ============================================================================
-- EXERCISE HISTORY TABLE
-- ============================================================================
-- Append-only log of all exercise attempts
-- Enables learning analytics and progress calculation
-- Requirement 12.1: Session tracking with exercise details

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

-- Add comments
COMMENT ON TABLE exercise_history IS 'Append-only log of all exercise attempts for learning analytics';
COMMENT ON COLUMN exercise_history.template_id IS 'Exercise template identifier';
COMMENT ON COLUMN exercise_history.difficulty IS 'Difficulty level: A (introductory), B (developing), C (advanced)';
COMMENT ON COLUMN exercise_history.is_binding IS 'Whether exercise covers binding (mandatory) curriculum content';
COMMENT ON COLUMN exercise_history.hints_used IS 'Number of hints requested during exercise';
COMMENT ON COLUMN exercise_history.user_answer IS 'User submitted answer (for review/analysis)';

-- ============================================================================
-- SESSIONS TABLE
-- ============================================================================
-- Tracks practice sessions with aggregated statistics
-- Requirement 12.1: Session record with UUID, timestamps, grade level, competency

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

-- Add comments
COMMENT ON TABLE sessions IS 'Tracks practice sessions with aggregated statistics';
COMMENT ON COLUMN sessions.competency_area_id IS 'Primary competency area practiced (null for mixed sessions)';
COMMENT ON COLUMN sessions.ended_at IS 'Session end timestamp (null for active sessions)';
COMMENT ON COLUMN sessions.avg_time_per_exercise_seconds IS 'Average time per exercise in session';

-- ============================================================================
-- INDEXES FOR PERFORMANCE OPTIMIZATION
-- ============================================================================
-- Create B-tree indexes on all WHERE clause and RLS policy columns
-- Reference: astro-solid-stack.md line 54

-- Competency Progress indexes
CREATE INDEX idx_competency_progress_user
  ON competency_progress(user_id);
CREATE INDEX idx_competency_progress_lookup
  ON competency_progress(user_id, competency_area_id, grade_range);

-- Skills Progress indexes
CREATE INDEX idx_skills_progress_user
  ON skills_progress(user_id);
CREATE INDEX idx_skills_progress_next_review
  ON skills_progress(user_id, next_review_at)
  WHERE next_review_at IS NOT NULL;
CREATE INDEX idx_skills_progress_lookup
  ON skills_progress(user_id, skill_id);

-- Exercise History indexes
CREATE INDEX idx_exercise_history_user_time
  ON exercise_history(user_id, created_at DESC);
CREATE INDEX idx_exercise_history_session
  ON exercise_history(session_id);
CREATE INDEX idx_exercise_history_user_session
  ON exercise_history(user_id, session_id);
CREATE INDEX idx_exercise_history_skill
  ON exercise_history(user_id, skill_id, created_at DESC);

-- Sessions indexes
CREATE INDEX idx_sessions_user
  ON sessions(user_id, started_at DESC);
CREATE INDEX idx_sessions_active
  ON sessions(user_id, ended_at)
  WHERE ended_at IS NULL;

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================
-- Requirement 7.2: Enforce data isolation at database level
-- Users can only read and write their own data
-- Reference: astro-solid-stack.md line 52 - use (SELECT auth.uid()) for caching

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE competency_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE skills_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE exercise_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- USERS TABLE POLICIES
-- ============================================================================

-- Users can view their own record
CREATE POLICY users_select_own ON users
  FOR SELECT
  USING ((SELECT auth.uid()) = id);

-- Users can update their own record
CREATE POLICY users_update_own ON users
  FOR UPDATE
  USING ((SELECT auth.uid()) = id);

-- Users can insert their own record (for initial registration)
CREATE POLICY users_insert_own ON users
  FOR INSERT
  WITH CHECK ((SELECT auth.uid()) = id);

-- ============================================================================
-- COMPETENCY PROGRESS POLICIES
-- ============================================================================

-- Users have full access to their own competency progress
CREATE POLICY competency_progress_all ON competency_progress
  FOR ALL
  USING ((SELECT auth.uid()) = user_id);

-- ============================================================================
-- SKILLS PROGRESS POLICIES
-- ============================================================================

-- Users have full access to their own skills progress
CREATE POLICY skills_progress_all ON skills_progress
  FOR ALL
  USING ((SELECT auth.uid()) = user_id);

-- ============================================================================
-- EXERCISE HISTORY POLICIES
-- ============================================================================

-- Users can view their own exercise history
CREATE POLICY exercise_history_select ON exercise_history
  FOR SELECT
  USING ((SELECT auth.uid()) = user_id);

-- Users can insert their own exercise history
CREATE POLICY exercise_history_insert ON exercise_history
  FOR INSERT
  WITH CHECK ((SELECT auth.uid()) = user_id);

-- No updates or deletes allowed (append-only table)

-- ============================================================================
-- SESSIONS POLICIES
-- ============================================================================

-- Users have full access to their own sessions
CREATE POLICY sessions_all ON sessions
  FOR ALL
  USING ((SELECT auth.uid()) = user_id);

-- ============================================================================
-- FUNCTIONS AND TRIGGERS
-- ============================================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for competency_progress
CREATE TRIGGER update_competency_progress_updated_at
  BEFORE UPDATE ON competency_progress
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Trigger for skills_progress
CREATE TRIGGER update_skills_progress_updated_at
  BEFORE UPDATE ON skills_progress
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Function to update user last_active_at
CREATE OR REPLACE FUNCTION update_user_last_active()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE users
  SET last_active_at = NOW()
  WHERE id = NEW.user_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update user last_active_at on exercise completion
CREATE TRIGGER update_last_active_on_exercise
  AFTER INSERT ON exercise_history
  FOR EACH ROW
  EXECUTE FUNCTION update_user_last_active();

-- ============================================================================
-- GRANTS
-- ============================================================================
-- Grant permissions to authenticated users

GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================

-- Verify schema integrity
DO $$
BEGIN
  -- Check that all tables exist
  IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'users') THEN
    RAISE EXCEPTION 'users table not created';
  END IF;

  IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'competency_progress') THEN
    RAISE EXCEPTION 'competency_progress table not created';
  END IF;

  IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'skills_progress') THEN
    RAISE EXCEPTION 'skills_progress table not created';
  END IF;

  IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'exercise_history') THEN
    RAISE EXCEPTION 'exercise_history table not created';
  END IF;

  IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'sessions') THEN
    RAISE EXCEPTION 'sessions table not created';
  END IF;

  RAISE NOTICE 'Schema migration completed successfully';
END $$;
