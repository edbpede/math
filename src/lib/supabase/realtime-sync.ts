/**
 * Supabase Realtime Cross-Device Synchronization
 *
 * Implements real-time progress broadcasting across multiple devices using
 * Supabase Realtime subscriptions. When a user updates their progress on one
 * device, other active devices receive updates instantly.
 *
 * Features:
 * - Real-time progress updates via postgres_changes
 * - Automatic subscription management
 * - User-specific filtering (only receive own updates)
 * - Cache invalidation on remote updates
 * - Connection state tracking
 *
 * Requirements:
 * - 15.2: Implement Supabase Realtime subscriptions for cross-device sync
 * - 15.2: Build progress broadcast to active devices
 */

import { supabase } from './client'
import {
  $competencyProgressCache,
  $skillProgressCache,
} from '../session/progress-persistence'
import type { CompetencyProgress, SkillProgress } from '../mastery/types'
import type { RealtimeChannel, RealtimePostgresChangesPayload } from '@supabase/supabase-js'
import type { Database } from './types'
import type { GradeRange, CompetencyAreaId } from '../curriculum/types'

// Type aliases for database tables
type CompetencyProgressRow = Database['public']['Tables']['competency_progress']['Row']
type SkillProgressRow = Database['public']['Tables']['skills_progress']['Row']

/**
 * Realtime connection status
 */
export type RealtimeConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'error'

/**
 * Realtime sync event types
 */
export type RealtimeSyncEvent =
  | { type: 'connection-change'; status: RealtimeConnectionStatus }
  | { type: 'competency-update'; progress: CompetencyProgress }
  | { type: 'skill-update'; progress: SkillProgress }
  | { type: 'error'; message: string }

/**
 * Realtime sync event listener
 */
export type RealtimeSyncEventListener = (event: RealtimeSyncEvent) => void

/**
 * Configuration for realtime sync
 */
export interface RealtimeSyncConfig {
  /** Enable realtime sync (default: true) */
  enabled: boolean
  /** Auto-reconnect on connection loss (default: true) */
  autoReconnect: boolean
  /** Log debug information (default: false) */
  debug: boolean
}

const DEFAULT_CONFIG: RealtimeSyncConfig = {
  enabled: true,
  autoReconnect: true,
  debug: false,
}

/**
 * Realtime Sync Manager
 *
 * Manages Supabase Realtime subscriptions for cross-device progress synchronization.
 * Subscribes to postgres_changes events for competency_progress and skills_progress tables.
 */
export class RealtimeSyncManager {
  private config: RealtimeSyncConfig
  private userId: string | null = null
  private channel: RealtimeChannel | null = null
  private connectionStatus: RealtimeConnectionStatus = 'disconnected'
  private eventListeners: Set<RealtimeSyncEventListener> = new Set()
  private initialized: boolean = false

  constructor(config: Partial<RealtimeSyncConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config }
  }

  /**
   * Initialize realtime sync for a user
   *
   * @param userId - User UUID to subscribe to updates for
   */
  async initialize(userId: string): Promise<void> {
    if (this.initialized && this.userId === userId) {
      this.log('[RealtimeSync] Already initialized for this user')
      return
    }

    // Clean up existing subscription if any
    if (this.channel) {
      await this.destroy()
    }

    this.log('[RealtimeSync] Initializing for user:', userId)
    this.userId = userId

    if (!this.config.enabled) {
      this.log('[RealtimeSync] Realtime sync is disabled')
      return
    }

    try {
      // Create a channel for this user's progress updates
      const channelName = `progress-sync:${userId}`
      this.channel = supabase.channel(channelName)

      // Subscribe to competency_progress changes
      this.channel.on(
        'postgres_changes',
        {
          event: '*', // Listen to INSERT, UPDATE, DELETE
          schema: 'public',
          table: 'competency_progress',
          filter: `user_id=eq.${userId}`,
        },
        (payload: any) => this.handleCompetencyProgressChange(payload)
      )

      // Subscribe to skills_progress changes
      this.channel.on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'skills_progress',
          filter: `user_id=eq.${userId}`,
        },
        (payload: any) => this.handleSkillProgressChange(payload)
      )

      // Set up connection state listeners
      this.channel
        .on('system', { event: 'connected' }, () => {
          this.log('[RealtimeSync] Connected')
          this.setConnectionStatus('connected')
        })
        .on('system', { event: 'disconnected' }, () => {
          this.log('[RealtimeSync] Disconnected')
          this.setConnectionStatus('disconnected')
        })
        .on('system', { event: 'error' }, (err: any) => {
          console.error('[RealtimeSync] Channel error:', err)
          this.setConnectionStatus('error')
          this.emitEvent({ type: 'error', message: 'Realtime connection error' })
        })

      // Subscribe to the channel
      this.setConnectionStatus('connecting')
      const subscribeResult = await this.channel.subscribe((status: string) => {
        this.log('[RealtimeSync] Subscription status:', status)
        if (status === 'SUBSCRIBED') {
          this.setConnectionStatus('connected')
        } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
          this.setConnectionStatus('error')
        }
      })

      // Check for subscription errors (older Supabase versions may return error property)
      if (subscribeResult && typeof subscribeResult === 'object' && 'error' in subscribeResult && subscribeResult.error) {
        console.error('[RealtimeSync] Failed to subscribe:', subscribeResult.error)
        this.setConnectionStatus('error')
        throw subscribeResult.error
      }

      this.initialized = true
      this.log('[RealtimeSync] Initialized successfully')
    } catch (error) {
      console.error('[RealtimeSync] Initialization failed:', error)
      this.setConnectionStatus('error')
      this.emitEvent({
        type: 'error',
        message: error instanceof Error ? error.message : 'Initialization failed',
      })
      throw error
    }
  }

  /**
   * Destroy the realtime sync (cleanup)
   */
  async destroy(): Promise<void> {
    if (!this.channel) {
      return
    }

    this.log('[RealtimeSync] Destroying')

    try {
      // Unsubscribe from the channel
      await supabase.removeChannel(this.channel)
      this.channel = null
      this.userId = null
      this.initialized = false
      this.setConnectionStatus('disconnected')
      this.eventListeners.clear()

      this.log('[RealtimeSync] Destroyed successfully')
    } catch (error) {
      console.error('[RealtimeSync] Failed to destroy:', error)
    }
  }

  /**
   * Get current connection status
   */
  getConnectionStatus(): RealtimeConnectionStatus {
    return this.connectionStatus
  }

  /**
   * Check if realtime sync is connected
   */
  isConnected(): boolean {
    return this.connectionStatus === 'connected'
  }

  /**
   * Add event listener
   */
  addEventListener(listener: RealtimeSyncEventListener): void {
    this.eventListeners.add(listener)
  }

  /**
   * Remove event listener
   */
  removeEventListener(listener: RealtimeSyncEventListener): void {
    this.eventListeners.delete(listener)
  }

  /**
   * Handle competency progress change from Realtime
   */
  private handleCompetencyProgressChange(
    payload: RealtimePostgresChangesPayload<CompetencyProgressRow>
  ): void {
    this.log('[RealtimeSync] Competency progress change:', payload.eventType)

    try {
      if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
        const row = payload.new as CompetencyProgressRow

        // Convert database row to CompetencyProgress
        const progress: CompetencyProgress = {
          competencyAreaId: row.competency_area_id as CompetencyAreaId,
          gradeRange: row.grade_range as GradeRange,
          masteryLevel: row.mastery_level,
          totalAttempts: row.total_attempts,
          successRate: row.success_rate,
          lastPracticed: row.last_practiced_at ? new Date(row.last_practiced_at) : new Date(),
          achievedAt: row.achieved_at ? new Date(row.achieved_at) : undefined,
        }

        // Update cache
        const cache = $competencyProgressCache.get()
        const key = `${progress.competencyAreaId}-${progress.gradeRange}`
        cache.set(key, progress)
        $competencyProgressCache.set(new Map(cache))

        // Emit event
        this.emitEvent({ type: 'competency-update', progress })
      }
    } catch (error) {
      console.error('[RealtimeSync] Error handling competency progress change:', error)
      this.emitEvent({
        type: 'error',
        message: 'Failed to process competency progress update',
      })
    }
  }

  /**
   * Handle skill progress change from Realtime
   */
  private handleSkillProgressChange(
    payload: RealtimePostgresChangesPayload<SkillProgressRow>
  ): void {
    this.log('[RealtimeSync] Skill progress change:', payload.eventType)

    try {
      if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
        const row = payload.new as SkillProgressRow

        // Convert database row to SkillProgress
        const progress: SkillProgress = {
          skillId: row.skill_id,
          masteryLevel: row.mastery_level,
          attempts: row.attempts,
          successes: row.successes,
          avgResponseTime: row.avg_response_time_ms || 0,
          srsParams: {
            easeFactor: row.ease_factor,
            interval: row.interval_days,
            repetitionCount: row.repetition_count,
          },
          lastPracticed: row.last_practiced_at ? new Date(row.last_practiced_at) : new Date(),
          nextReview: row.next_review_at ? new Date(row.next_review_at) : new Date(),
        }

        // Update cache
        const cache = $skillProgressCache.get()
        cache.set(progress.skillId, progress)
        $skillProgressCache.set(new Map(cache))

        // Emit event
        this.emitEvent({ type: 'skill-update', progress })
      }
    } catch (error) {
      console.error('[RealtimeSync] Error handling skill progress change:', error)
      this.emitEvent({
        type: 'error',
        message: 'Failed to process skill progress update',
      })
    }
  }

  /**
   * Set connection status and emit event
   */
  private setConnectionStatus(status: RealtimeConnectionStatus): void {
    if (this.connectionStatus !== status) {
      this.connectionStatus = status
      this.emitEvent({ type: 'connection-change', status })
    }
  }

  /**
   * Emit event to all listeners
   */
  private emitEvent(event: RealtimeSyncEvent): void {
    for (const listener of this.eventListeners) {
      try {
        listener(event)
      } catch (error) {
        console.error('[RealtimeSync] Event listener error:', error)
      }
    }
  }

  /**
   * Log debug message if debug mode is enabled
   */
  private log(...args: any[]): void {
    if (this.config.debug) {
      console.log(...args)
    }
  }
}

/**
 * Singleton instance for application-wide use
 */
export const realtimeSyncManager = new RealtimeSyncManager({
  debug: import.meta.env.DEV, // Enable debug logging in development
})
