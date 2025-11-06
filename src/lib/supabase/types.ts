/**
 * Database type definitions for Supabase
 *
 * These types will be auto-generated from the Supabase schema using:
 * `supabase gen types typescript --project-id <project-id> > src/lib/supabase/types.ts`
 *
 * For now, we provide manual type definitions based on the schema in design.md
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          created_at: string
          last_active_at: string
          grade_range: '0-3' | '4-6' | '7-9'
          locale: 'da-DK' | 'en-US'
          preferences: Json
        }
        Insert: {
          id?: string
          created_at?: string
          last_active_at?: string
          grade_range: '0-3' | '4-6' | '7-9'
          locale?: 'da-DK' | 'en-US'
          preferences?: Json
        }
        Update: {
          id?: string
          created_at?: string
          last_active_at?: string
          grade_range?: '0-3' | '4-6' | '7-9'
          locale?: 'da-DK' | 'en-US'
          preferences?: Json
        }
      }
      competency_progress: {
        Row: {
          id: string
          user_id: string
          competency_area_id: string
          grade_range: string
          mastery_level: number
          total_attempts: number
          success_rate: number
          last_practiced_at: string | null
          achieved_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          competency_area_id: string
          grade_range: string
          mastery_level?: number
          total_attempts?: number
          success_rate?: number
          last_practiced_at?: string | null
          achieved_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          competency_area_id?: string
          grade_range?: string
          mastery_level?: number
          total_attempts?: number
          success_rate?: number
          last_practiced_at?: string | null
          achieved_at?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      skills_progress: {
        Row: {
          id: string
          user_id: string
          skill_id: string
          mastery_level: number
          attempts: number
          successes: number
          avg_response_time_ms: number | null
          ease_factor: number
          interval_days: number
          repetition_count: number
          last_practiced_at: string | null
          next_review_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          skill_id: string
          mastery_level?: number
          attempts?: number
          successes?: number
          avg_response_time_ms?: number | null
          ease_factor?: number
          interval_days?: number
          repetition_count?: number
          last_practiced_at?: string | null
          next_review_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          skill_id?: string
          mastery_level?: number
          attempts?: number
          successes?: number
          avg_response_time_ms?: number | null
          ease_factor?: number
          interval_days?: number
          repetition_count?: number
          last_practiced_at?: string | null
          next_review_at?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      exercise_history: {
        Row: {
          id: string
          user_id: string
          session_id: string
          template_id: string
          competency_area_id: string
          skill_id: string
          difficulty: 'A' | 'B' | 'C'
          is_binding: boolean
          correct: boolean
          time_spent_seconds: number
          hints_used: number
          user_answer: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          session_id: string
          template_id: string
          competency_area_id: string
          skill_id: string
          difficulty: 'A' | 'B' | 'C'
          is_binding?: boolean
          correct: boolean
          time_spent_seconds: number
          hints_used?: number
          user_answer?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          session_id?: string
          template_id?: string
          competency_area_id?: string
          skill_id?: string
          difficulty?: 'A' | 'B' | 'C'
          is_binding?: boolean
          correct?: boolean
          time_spent_seconds?: number
          hints_used?: number
          user_answer?: string | null
          created_at?: string
        }
      }
      sessions: {
        Row: {
          id: string
          user_id: string
          grade_range: string
          competency_area_id: string | null
          started_at: string
          ended_at: string | null
          total_exercises: number
          correct_count: number
          avg_time_per_exercise_seconds: number | null
        }
        Insert: {
          id?: string
          user_id: string
          grade_range: string
          competency_area_id?: string | null
          started_at?: string
          ended_at?: string | null
          total_exercises?: number
          correct_count?: number
          avg_time_per_exercise_seconds?: number | null
        }
        Update: {
          id?: string
          user_id?: string
          grade_range?: string
          competency_area_id?: string | null
          started_at?: string
          ended_at?: string | null
          total_exercises?: number
          correct_count?: number
          avg_time_per_exercise_seconds?: number | null
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}
