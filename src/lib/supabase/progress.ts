/**
 * Progress Tracking Data Access Layer
 *
 * Provides functions for interacting with progress tracking tables:
 * - competency_progress: Top-level competency area mastery
 * - skills_progress: Skills area mastery with SRS parameters
 * - exercise_history: Append-only log of exercise attempts
 * - sessions: Practice session tracking
 *
 * Features:
 * - Type-safe database operations
 * - Batched updates for performance (Requirement 12.4)
 * - Error handling with retry logic
 * - Optimistic UI support
 *
 * Requirements:
 * - 5.1: Track mastery at multiple granularities
 * - 12.2: Log exercise history
 * - 12.3: Update mastery levels after exercise completion
 * - 12.4: Debounced batch writes every 30 seconds
 */

import { supabase } from "./client";
import type { Database } from "./types";
import type {
    CompetencyProgress,
    SkillProgress,
    ExerciseAttempt,
    PracticeSession,
} from "../mastery/types";
import type {
    CompetencyAreaId,
    GradeRange,
    Difficulty,
} from "../curriculum/types";

// ============================================================================
// TYPE ALIASES FOR DATABASE OPERATIONS
// ============================================================================

type CompetencyProgressRow =
    Database["public"]["Tables"]["competency_progress"]["Row"];
type CompetencyProgressUpdate =
    Database["public"]["Tables"]["competency_progress"]["Update"];

type SkillsProgressRow = Database["public"]["Tables"]["skills_progress"]["Row"];
type SkillsProgressUpdate =
    Database["public"]["Tables"]["skills_progress"]["Update"];

type ExerciseHistoryRow =
    Database["public"]["Tables"]["exercise_history"]["Row"];
type ExerciseHistoryInsert =
    Database["public"]["Tables"]["exercise_history"]["Insert"];

type SessionRow = Database["public"]["Tables"]["sessions"]["Row"];
type SessionInsert = Database["public"]["Tables"]["sessions"]["Insert"];
type SessionUpdate = Database["public"]["Tables"]["sessions"]["Update"];

// ============================================================================
// ERROR HANDLING UTILITIES
// ============================================================================

/**
 * Error class for progress tracking operations
 */
export class ProgressError extends Error {
    constructor(
        message: string,
        public readonly operation: string,
        public readonly cause?: unknown,
    ) {
        super(message);
        this.name = "ProgressError";
    }
}

/**
 * Retry configuration for database operations
 */
interface RetryConfig {
    maxAttempts: number;
    initialDelayMs: number;
    maxDelayMs: number;
    backoffMultiplier: number;
}

const DEFAULT_RETRY_CONFIG: RetryConfig = {
    maxAttempts: 3,
    initialDelayMs: 100,
    maxDelayMs: 2000,
    backoffMultiplier: 2,
};

/**
 * Execute a database operation with exponential backoff retry logic
 *
 * @param operation - The database operation to execute
 * @param operationName - Name for error messages and logging
 * @param config - Retry configuration (optional)
 * @returns Result of the operation
 * @throws ProgressError if all retries fail
 */
async function withRetry<T>(
    operation: () => Promise<T>,
    operationName: string,
    config: RetryConfig = DEFAULT_RETRY_CONFIG,
): Promise<T> {
    let lastError: unknown;
    let delay = config.initialDelayMs;

    for (let attempt = 1; attempt <= config.maxAttempts; attempt++) {
        try {
            return await operation();
        } catch (error) {
            lastError = error;

            // Don't retry on last attempt
            if (attempt === config.maxAttempts) {
                break;
            }

            // Log retry attempt (in production, send to monitoring)
            console.warn(
                `[ProgressTracking] ${operationName} failed (attempt ${attempt}/${config.maxAttempts}), retrying in ${delay}ms`,
                error,
            );

            // Wait before retry with exponential backoff
            await new Promise((resolve) => setTimeout(resolve, delay));
            delay = Math.min(
                delay * config.backoffMultiplier,
                config.maxDelayMs,
            );
        }
    }

    // All retries failed
    throw new ProgressError(
        `Failed to ${operationName} after ${config.maxAttempts} attempts`,
        operationName,
        lastError,
    );
}

// ============================================================================
// DATA TRANSFORMATION UTILITIES
// ============================================================================

/**
 * Convert database row to CompetencyProgress domain type
 */
function rowToCompetencyProgress(
    row: CompetencyProgressRow,
): CompetencyProgress {
    return {
        competencyAreaId: row.competency_area_id as CompetencyAreaId,
        gradeRange: row.grade_range as GradeRange,
        masteryLevel: row.mastery_level,
        totalAttempts: row.total_attempts,
        successRate: Number(row.success_rate),
        lastPracticed: row.last_practiced_at
            ? new Date(row.last_practiced_at)
            : new Date(),
        achievedAt: row.achieved_at ? new Date(row.achieved_at) : undefined,
    };
}

/**
 * Convert database row to SkillProgress domain type
 */
function rowToSkillProgress(row: SkillsProgressRow): SkillProgress {
    return {
        skillId: row.skill_id,
        masteryLevel: row.mastery_level,
        srsParams: {
            easeFactor: Number(row.ease_factor),
            interval: row.interval_days,
            repetitionCount: row.repetition_count,
        },
        attempts: row.attempts,
        successes: row.successes,
        avgResponseTime: row.avg_response_time_ms ?? 0,
        lastPracticed: row.last_practiced_at
            ? new Date(row.last_practiced_at)
            : new Date(),
        nextReview: row.next_review_at
            ? new Date(row.next_review_at)
            : new Date(),
    };
}

/**
 * Convert database row to ExerciseAttempt domain type
 */
function rowToExerciseAttempt(row: ExerciseHistoryRow): ExerciseAttempt {
    return {
        id: row.id,
        userId: row.user_id,
        sessionId: row.session_id,
        templateId: row.template_id,
        competencyAreaId: row.competency_area_id as CompetencyAreaId,
        skillId: row.skill_id,
        difficulty: row.difficulty as Difficulty,
        isBinding: row.is_binding,
        correct: row.correct,
        timeSpentSeconds: row.time_spent_seconds,
        hintsUsed: row.hints_used,
        userAnswer: row.user_answer ?? "",
        createdAt: new Date(row.created_at),
    };
}

/**
 * Convert database row to PracticeSession domain type
 */
function rowToPracticeSession(row: SessionRow): PracticeSession {
    return {
        id: row.id,
        userId: row.user_id,
        gradeRange: row.grade_range as GradeRange,
        competencyAreaId: row.competency_area_id as
            | CompetencyAreaId
            | undefined,
        startedAt: new Date(row.started_at),
        endedAt: row.ended_at ? new Date(row.ended_at) : undefined,
        totalExercises: row.total_exercises,
        correctCount: row.correct_count,
        avgTimePerExerciseSeconds:
            row.avg_time_per_exercise_seconds ?? undefined,
    };
}

// ============================================================================
// FETCH OPERATIONS
// ============================================================================

/**
 * Fetch all competency progress for a user
 *
 * @param userId - User UUID
 * @returns Array of competency progress records
 * @throws ProgressError if fetch fails
 */
export async function fetchCompetencyProgress(
    userId: string,
): Promise<CompetencyProgress[]> {
    return withRetry(async () => {
        const { data, error } = await supabase
            .from("competency_progress")
            .select("*")
            .eq("user_id", userId)
            .order("competency_area_id", { ascending: true });

        if (error) {
            throw error;
        }

        return (data ?? []).map(rowToCompetencyProgress);
    }, "fetch competency progress");
}

/**
 * Fetch competency progress for a specific area and grade range
 *
 * @param userId - User UUID
 * @param competencyAreaId - Competency area identifier
 * @param gradeRange - Grade range (0-3, 4-6, 7-9)
 * @returns Competency progress or null if not found
 * @throws ProgressError if fetch fails
 */
export async function fetchCompetencyProgressByArea(
    userId: string,
    competencyAreaId: CompetencyAreaId,
    gradeRange: GradeRange,
): Promise<CompetencyProgress | null> {
    return withRetry(async () => {
        const { data, error } = await supabase
            .from("competency_progress")
            .select("*")
            .eq("user_id", userId)
            .eq("competency_area_id", competencyAreaId)
            .eq("grade_range", gradeRange)
            .single();

        if (error) {
            // Not found is not an error - return null
            if (error.code === "PGRST116") {
                return null;
            }
            throw error;
        }

        return data ? rowToCompetencyProgress(data) : null;
    }, "fetch competency progress by area");
}

/**
 * Fetch all skills progress for a user
 *
 * @param userId - User UUID
 * @returns Array of skills progress records
 * @throws ProgressError if fetch fails
 */
export async function fetchSkillsProgress(
    userId: string,
): Promise<SkillProgress[]> {
    return withRetry(async () => {
        const { data, error } = await supabase
            .from("skills_progress")
            .select("*")
            .eq("user_id", userId)
            .order("skill_id", { ascending: true });

        if (error) {
            throw error;
        }

        return (data ?? []).map(rowToSkillProgress);
    }, "fetch skills progress");
}

/**
 * Fetch skills progress for a specific skill
 *
 * @param userId - User UUID
 * @param skillId - Skill identifier
 * @returns Skill progress or null if not found
 * @throws ProgressError if fetch fails
 */
export async function fetchSkillProgressBySkill(
    userId: string,
    skillId: string,
): Promise<SkillProgress | null> {
    return withRetry(async () => {
        const { data, error } = await supabase
            .from("skills_progress")
            .select("*")
            .eq("user_id", userId)
            .eq("skill_id", skillId)
            .single();

        if (error) {
            // Not found is not an error - return null
            if (error.code === "PGRST116") {
                return null;
            }
            throw error;
        }

        return data ? rowToSkillProgress(data) : null;
    }, "fetch skill progress by skill");
}

/**
 * Fetch skills due for review (SRS)
 *
 * @param userId - User UUID
 * @param beforeDate - Only return skills due before this date (defaults to now)
 * @returns Array of skills progress records due for review
 * @throws ProgressError if fetch fails
 */
export async function fetchSkillsDueForReview(
    userId: string,
    beforeDate: Date = new Date(),
): Promise<SkillProgress[]> {
    return withRetry(async () => {
        const { data, error } = await supabase
            .from("skills_progress")
            .select("*")
            .eq("user_id", userId)
            .lte("next_review_at", beforeDate.toISOString())
            .order("next_review_at", { ascending: true });

        if (error) {
            throw error;
        }

        return (data ?? []).map(rowToSkillProgress);
    }, "fetch skills due for review");
}

/**
 * Fetch recent exercise history for a user
 *
 * @param userId - User UUID
 * @param limit - Maximum number of records to return (default 100)
 * @returns Array of exercise attempts
 * @throws ProgressError if fetch fails
 */
export async function fetchExerciseHistory(
    userId: string,
    limit: number = 100,
): Promise<ExerciseAttempt[]> {
    return withRetry(async () => {
        const { data, error } = await supabase
            .from("exercise_history")
            .select("*")
            .eq("user_id", userId)
            .order("created_at", { ascending: false })
            .limit(limit);

        if (error) {
            throw error;
        }

        return (data ?? []).map(rowToExerciseAttempt);
    }, "fetch exercise history");
}

/**
 * Fetch exercise history for a specific skill
 *
 * @param userId - User UUID
 * @param skillId - Skill identifier
 * @param limit - Maximum number of records to return (default 20)
 * @returns Array of exercise attempts for the skill
 * @throws ProgressError if fetch fails
 */
export async function fetchExerciseHistoryBySkill(
    userId: string,
    skillId: string,
    limit: number = 20,
): Promise<ExerciseAttempt[]> {
    return withRetry(async () => {
        const { data, error } = await supabase
            .from("exercise_history")
            .select("*")
            .eq("user_id", userId)
            .eq("skill_id", skillId)
            .order("created_at", { ascending: false })
            .limit(limit);

        if (error) {
            throw error;
        }

        return (data ?? []).map(rowToExerciseAttempt);
    }, "fetch exercise history by skill");
}

// ============================================================================
// UPDATE OPERATIONS
// ============================================================================

/**
 * Update competency progress (upsert - insert or update)
 *
 * @param userId - User UUID
 * @param progress - Competency progress data to update
 * @returns Updated competency progress
 * @throws ProgressError if update fails
 */
export async function updateCompetencyProgress(
    userId: string,
    progress: Omit<CompetencyProgress, "lastPracticed" | "achievedAt">,
): Promise<CompetencyProgress> {
    return withRetry(async () => {
        const updateData: CompetencyProgressUpdate = {
            user_id: userId,
            competency_area_id: progress.competencyAreaId,
            grade_range: progress.gradeRange,
            mastery_level: progress.masteryLevel,
            total_attempts: progress.totalAttempts,
            success_rate: progress.successRate,
            last_practiced_at: new Date().toISOString(),
            // Set achieved_at if mastery level reaches proficient (80+) and not already set
            achieved_at:
                progress.masteryLevel >= 80
                    ? new Date().toISOString()
                    : undefined,
        };

        const { data, error } = await supabase
            .from("competency_progress")
            // @ts-ignore - Supabase type inference issue with generated types
            .upsert(updateData as CompetencyProgressUpdate, {
                onConflict: "user_id,competency_area_id,grade_range",
            })
            .select()
            .single();

        if (error) {
            throw error;
        }

        return rowToCompetencyProgress(data);
    }, "update competency progress");
}

/**
 * Update skill progress (upsert - insert or update)
 *
 * @param userId - User UUID
 * @param progress - Skill progress data to update
 * @returns Updated skill progress
 * @throws ProgressError if update fails
 */
export async function updateSkillProgress(
    userId: string,
    progress: Omit<SkillProgress, "lastPracticed">,
): Promise<SkillProgress> {
    return withRetry(async () => {
        const updateData: SkillsProgressUpdate = {
            user_id: userId,
            skill_id: progress.skillId,
            mastery_level: progress.masteryLevel,
            attempts: progress.attempts,
            successes: progress.successes,
            avg_response_time_ms: progress.avgResponseTime,
            ease_factor: progress.srsParams.easeFactor,
            interval_days: progress.srsParams.interval,
            repetition_count: progress.srsParams.repetitionCount,
            last_practiced_at: new Date().toISOString(),
            next_review_at: progress.nextReview.toISOString(),
        };

        const { data, error } = await supabase
            .from("skills_progress")
            // @ts-ignore - Supabase type inference issue with generated types
            .upsert(updateData as SkillsProgressUpdate, {
                onConflict: "user_id,skill_id",
            })
            .select()
            .single();

        if (error) {
            throw error;
        }

        return rowToSkillProgress(data);
    }, "update skill progress");
}

/**
 * Batch update multiple competency progress records
 * Requirement 12.4: Debounced batch writes for performance
 *
 * @param userId - User UUID
 * @param progressList - Array of competency progress data to update
 * @returns Array of updated competency progress records
 * @throws ProgressError if batch update fails
 */
export async function batchUpdateCompetencyProgress(
    userId: string,
    progressList: Array<
        Omit<CompetencyProgress, "lastPracticed" | "achievedAt">
    >,
): Promise<CompetencyProgress[]> {
    if (progressList.length === 0) {
        return [];
    }

    return withRetry(async () => {
        const now = new Date().toISOString();
        const updateData: CompetencyProgressUpdate[] = progressList.map(
            (progress) => ({
                user_id: userId,
                competency_area_id: progress.competencyAreaId,
                grade_range: progress.gradeRange,
                mastery_level: progress.masteryLevel,
                total_attempts: progress.totalAttempts,
                success_rate: progress.successRate,
                last_practiced_at: now,
                achieved_at: progress.masteryLevel >= 80 ? now : undefined,
            }),
        );

        const { data, error } = await supabase
            .from("competency_progress")
            // @ts-ignore - Supabase type inference issue with generated types
            .upsert(updateData as CompetencyProgressUpdate[], {
                onConflict: "user_id,competency_area_id,grade_range",
            })
            .select();

        if (error) {
            throw error;
        }

        return (data ?? []).map(rowToCompetencyProgress);
    }, "batch update competency progress");
}

/**
 * Batch update multiple skill progress records
 * Requirement 12.4: Debounced batch writes for performance
 *
 * @param userId - User UUID
 * @param progressList - Array of skill progress data to update
 * @returns Array of updated skill progress records
 * @throws ProgressError if batch update fails
 */
export async function batchUpdateSkillProgress(
    userId: string,
    progressList: Array<Omit<SkillProgress, "lastPracticed">>,
): Promise<SkillProgress[]> {
    if (progressList.length === 0) {
        return [];
    }

    return withRetry(async () => {
        const now = new Date().toISOString();
        const updateData: SkillsProgressUpdate[] = progressList.map(
            (progress) => ({
                user_id: userId,
                skill_id: progress.skillId,
                mastery_level: progress.masteryLevel,
                attempts: progress.attempts,
                successes: progress.successes,
                avg_response_time_ms: progress.avgResponseTime,
                ease_factor: progress.srsParams.easeFactor,
                interval_days: progress.srsParams.interval,
                repetition_count: progress.srsParams.repetitionCount,
                last_practiced_at: now,
                next_review_at: progress.nextReview.toISOString(),
            }),
        );

        const { data, error } = await supabase
            .from("skills_progress")
            // @ts-ignore - Supabase type inference issue with generated types
            .upsert(updateData as SkillsProgressUpdate[], {
                onConflict: "user_id,skill_id",
            })
            .select();

        if (error) {
            throw error;
        }

        return (data ?? []).map(rowToSkillProgress);
    }, "batch update skill progress");
}

// ============================================================================
// EXERCISE HISTORY OPERATIONS
// ============================================================================

/**
 * Log an exercise attempt to history
 * Requirement 12.2: Append exercise history record on completion
 *
 * @param attempt - Exercise attempt data to log
 * @returns Created exercise attempt record
 * @throws ProgressError if logging fails
 */
export async function logExerciseAttempt(
    attempt: Omit<ExerciseAttempt, "id" | "createdAt">,
): Promise<ExerciseAttempt> {
    return withRetry(async () => {
        const insertData: ExerciseHistoryInsert = {
            user_id: attempt.userId,
            session_id: attempt.sessionId,
            template_id: attempt.templateId,
            competency_area_id: attempt.competencyAreaId,
            skill_id: attempt.skillId,
            difficulty: attempt.difficulty,
            is_binding: attempt.isBinding,
            correct: attempt.correct,
            time_spent_seconds: attempt.timeSpentSeconds,
            hints_used: attempt.hintsUsed,
            user_answer: attempt.userAnswer,
        };

        const { data, error } = await supabase
            .from("exercise_history")
            // @ts-ignore - Supabase type inference issue with generated types
            .insert(insertData as ExerciseHistoryInsert)
            .select()
            .single();

        if (error) {
            throw error;
        }

        return rowToExerciseAttempt(data);
    }, "log exercise attempt");
}

/**
 * Batch log multiple exercise attempts
 * Useful for offline sync when connection is restored
 *
 * @param attempts - Array of exercise attempt data to log
 * @returns Array of created exercise attempt records
 * @throws ProgressError if batch logging fails
 */
export async function batchLogExerciseAttempts(
    attempts: Array<Omit<ExerciseAttempt, "id" | "createdAt">>,
): Promise<ExerciseAttempt[]> {
    if (attempts.length === 0) {
        return [];
    }

    return withRetry(async () => {
        const insertData: ExerciseHistoryInsert[] = attempts.map((attempt) => ({
            user_id: attempt.userId,
            session_id: attempt.sessionId,
            template_id: attempt.templateId,
            competency_area_id: attempt.competencyAreaId,
            skill_id: attempt.skillId,
            difficulty: attempt.difficulty,
            is_binding: attempt.isBinding,
            correct: attempt.correct,
            time_spent_seconds: attempt.timeSpentSeconds,
            hints_used: attempt.hintsUsed,
            user_answer: attempt.userAnswer,
        }));

        const { data, error } = await supabase
            .from("exercise_history")
            // @ts-ignore - Supabase type inference issue with generated types
            .insert(insertData as ExerciseHistoryInsert[])
            .select();

        if (error) {
            throw error;
        }

        return (data ?? []).map(rowToExerciseAttempt);
    }, "batch log exercise attempts");
}

// ============================================================================
// SESSION MANAGEMENT OPERATIONS
// ============================================================================

/**
 * Start a new practice session
 * Requirement 12.1: Create session record with UUID, timestamps, grade level
 *
 * @param userId - User UUID
 * @param gradeRange - Grade range for session
 * @param competencyAreaId - Optional competency area focus
 * @returns Created session record
 * @throws ProgressError if session creation fails
 */
export async function startSession(
    userId: string,
    gradeRange: GradeRange,
    competencyAreaId?: CompetencyAreaId,
): Promise<PracticeSession> {
    return withRetry(async () => {
        const insertData: SessionInsert = {
            user_id: userId,
            grade_range: gradeRange,
            competency_area_id: competencyAreaId,
            started_at: new Date().toISOString(),
        };

        const { data, error } = await supabase
            .from("sessions")
            // @ts-ignore - Supabase type inference issue with generated types
            .insert(insertData as SessionInsert)
            .select()
            .single();

        if (error) {
            throw error;
        }

        return rowToPracticeSession(data);
    }, "start session");
}

/**
 * Update session statistics during practice
 *
 * @param sessionId - Session UUID
 * @param totalExercises - Total number of exercises completed
 * @param correctCount - Number of correct answers
 * @returns Updated session record
 * @throws ProgressError if update fails
 */
export async function updateSession(
    sessionId: string,
    totalExercises: number,
    correctCount: number,
): Promise<PracticeSession> {
    return withRetry(async () => {
        const updateData: SessionUpdate = {
            total_exercises: totalExercises,
            correct_count: correctCount,
        };

        const { data, error } = await supabase
            .from("sessions")
            // @ts-ignore - Supabase type inference issue with generated types
            .update(updateData as SessionUpdate)
            .eq("id", sessionId)
            .select()
            .single();

        if (error) {
            throw error;
        }

        return rowToPracticeSession(data);
    }, "update session");
}

/**
 * End a practice session
 * Requirement 12.5: Update session with end timestamp and statistics
 *
 * @param sessionId - Session UUID
 * @param totalExercises - Total number of exercises completed
 * @param correctCount - Number of correct answers
 * @param avgTimePerExerciseSeconds - Average time per exercise
 * @returns Updated session record
 * @throws ProgressError if update fails
 */
export async function endSession(
    sessionId: string,
    totalExercises: number,
    correctCount: number,
    avgTimePerExerciseSeconds: number,
): Promise<PracticeSession> {
    return withRetry(async () => {
        const updateData: SessionUpdate = {
            ended_at: new Date().toISOString(),
            total_exercises: totalExercises,
            correct_count: correctCount,
            avg_time_per_exercise_seconds: Math.round(
                avgTimePerExerciseSeconds,
            ),
        };

        const { data, error } = await supabase
            .from("sessions")
            // @ts-ignore - Supabase type inference issue with generated types
            .update(updateData as SessionUpdate)
            .eq("id", sessionId)
            .select()
            .single();

        if (error) {
            throw error;
        }

        return rowToPracticeSession(data);
    }, "end session");
}

/**
 * Fetch a specific session by ID
 *
 * @param sessionId - Session UUID
 * @returns Session record or null if not found
 * @throws ProgressError if fetch fails
 */
export async function fetchSession(
    sessionId: string,
): Promise<PracticeSession | null> {
    return withRetry(async () => {
        const { data, error } = await supabase
            .from("sessions")
            .select("*")
            .eq("id", sessionId)
            .single();

        if (error) {
            // Not found is not an error - return null
            if (error.code === "PGRST116") {
                return null;
            }
            throw error;
        }

        return data ? rowToPracticeSession(data) : null;
    }, "fetch session");
}

/**
 * Fetch recent sessions for a user
 *
 * @param userId - User UUID
 * @param limit - Maximum number of sessions to return (default 20)
 * @returns Array of session records
 * @throws ProgressError if fetch fails
 */
export async function fetchRecentSessions(
    userId: string,
    limit: number = 20,
): Promise<PracticeSession[]> {
    return withRetry(async () => {
        const { data, error } = await supabase
            .from("sessions")
            .select("*")
            .eq("user_id", userId)
            .order("started_at", { ascending: false })
            .limit(limit);

        if (error) {
            throw error;
        }

        return (data ?? []).map(rowToPracticeSession);
    }, "fetch recent sessions");
}

/**
 * Fetch the active session for a user (session without ended_at)
 *
 * @param userId - User UUID
 * @returns Active session or null if no active session
 * @throws ProgressError if fetch fails
 */
export async function fetchActiveSession(
    userId: string,
): Promise<PracticeSession | null> {
    return withRetry(async () => {
        const { data, error } = await supabase
            .from("sessions")
            .select("*")
            .eq("user_id", userId)
            .is("ended_at", null)
            .order("started_at", { ascending: false })
            .limit(1)
            .maybeSingle();

        if (error) {
            throw error;
        }

        return data ? rowToPracticeSession(data) : null;
    }, "fetch active session");
}
