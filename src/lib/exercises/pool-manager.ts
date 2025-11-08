/**
 * Exercise Pool Manager
 *
 * Manages a pool of pre-generated exercises in IndexedDB for optimal
 * performance and offline capability. Uses Web Worker for background
 * generation without blocking the main thread.
 *
 * Requirements:
 * - 13.3: Implement exercise pool pre-generation in background
 * - 6.2: Store exercises in IndexedDB for offline access
 * - 11.4: Generate 20-30 instances in batch <200ms
 */

import type { ExerciseInstance } from './types';
import type { TemplateSelectionCriteria } from './template-registry';
import type { Locale } from '../i18n/types';
import { offlineStorage } from '../offline/storage';
import type { WorkerMessage, WorkerResponse } from './pool-worker';

/**
 * Pool configuration
 */
const POOL_CONFIG = {
  MIN_BUFFER_SIZE: 20, // Minimum exercises to keep in pool
  MAX_BUFFER_SIZE: 30, // Maximum exercises in pool
  BATCH_SIZE: 25, // Number to generate per batch
  CLEANUP_AGE_DAYS: 7, // Remove exercises older than this
} as const;

/**
 * Pool manager error
 */
export class PoolManagerError extends Error {
  constructor(
    message: string,
    public operation: string,
    public cause?: unknown
  ) {
    super(`Pool manager error during ${operation}: ${message}`);
    this.name = 'PoolManagerError';
  }
}

/**
 * Pool statistics
 */
export interface PoolStats {
  totalExercises: number;
  unusedExercises: number;
  usedExercises: number;
  oldestExerciseAge: number | null;
  workerActive: boolean;
}

/**
 * Generation request
 */
interface GenerationRequest {
  id: string;
  criteria: TemplateSelectionCriteria;
  locale: Locale;
  resolve: (instances: ExerciseInstance[]) => void;
  reject: (error: Error) => void;
}

/**
 * Exercise Pool Manager
 *
 * Singleton class that manages the exercise pool with background generation.
 */
export class ExercisePoolManager {
  private worker: Worker | null = null;
  private workerReady = false;
  private pendingRequests = new Map<string, GenerationRequest>();
  private generationInProgress = false;
  private initialized = false;

  /**
   * Initialize the pool manager
   *
   * Sets up the Web Worker and IndexedDB storage.
   */
  async initialize(): Promise<void> {
    if (this.initialized) {
      return;
    }

    try {
      // Initialize storage
      await offlineStorage.init();

      // Initialize Web Worker
      if (typeof Worker !== 'undefined') {
        this.initializeWorker();
      } else {
        console.warn('[PoolManager] Web Workers not supported, falling back to main thread');
      }

      this.initialized = true;

      // Start initial fill if pool is empty
      const stats = await this.getStats();
      if (stats.unusedExercises < POOL_CONFIG.MIN_BUFFER_SIZE) {
        // Don't await - let it fill in background
        this.fillPool({ gradeRange: '4-6' }, 'da-DK').catch(console.error);
      }
    } catch (error) {
      throw new PoolManagerError(
        'Failed to initialize pool manager',
        'initialize',
        error
      );
    }
  }

  /**
   * Initialize the Web Worker
   */
  private initializeWorker(): void {
    try {
      // Create worker from inline code to avoid build issues
      const workerCode = `
        // Import statements will be resolved by bundler
        importScripts('/src/lib/exercises/pool-worker.ts');
      `;

      const blob = new Blob([workerCode], { type: 'application/javascript' });
      const workerUrl = URL.createObjectURL(blob);
      
      this.worker = new Worker(workerUrl, { type: 'module' });

      this.worker.addEventListener('message', (event: MessageEvent<WorkerResponse>) => {
        this.handleWorkerMessage(event.data);
      });

      this.worker.addEventListener('error', (error) => {
        console.error('[PoolManager] Worker error:', error);
        this.workerReady = false;
      });
    } catch (error) {
      console.error('[PoolManager] Failed to create worker:', error);
      this.worker = null;
    }
  }

  /**
   * Handle worker message
   */
  private handleWorkerMessage(response: WorkerResponse): void {
    if ('type' in response && response.type === 'ready') {
      this.workerReady = true;
      console.log('[PoolManager] Worker ready');
      return;
    }

    const request = this.pendingRequests.get(response.id);
    if (!request) {
      console.warn('[PoolManager] Received response for unknown request:', response.id);
      return;
    }

    this.pendingRequests.delete(response.id);

    if (response.type === 'batch-complete') {
      console.log(`[PoolManager] Batch generated in ${response.duration.toFixed(2)}ms`);
      request.resolve(response.instances);
    } else if (response.type === 'error') {
      const error = new PoolManagerError(
        response.error,
        'worker-generation',
        response.stack
      );
      request.reject(error);
    }
  }

  /**
   * Get unused exercises from pool
   *
   * @param count - Number of exercises to retrieve
   * @param criteria - Optional criteria for filtering
   * @returns Array of unused exercises
   */
  async getExercises(
    count: number,
    criteria?: Partial<TemplateSelectionCriteria>
  ): Promise<ExerciseInstance[]> {
    try {
      const exercises = await offlineStorage.getUnusedExercises(count);

      // Mark exercises as used
      await Promise.all(
        exercises.map((ex) => offlineStorage.markExerciseUsed(ex.id))
      );

      // Check if we need to refill pool
      const stats = await this.getStats();
      if (stats.unusedExercises < POOL_CONFIG.MIN_BUFFER_SIZE && !this.generationInProgress) {
        // Refill in background
        const fillCriteria: TemplateSelectionCriteria = {
          gradeRange: criteria?.gradeRange || '4-6',
          competencyAreaId: criteria?.competencyAreaId,
          difficulty: criteria?.difficulty,
        };
        this.fillPool(fillCriteria, 'da-DK').catch(console.error);
      }

      return exercises;
    } catch (error) {
      throw new PoolManagerError(
        'Failed to get exercises from pool',
        'getExercises',
        error
      );
    }
  }

  /**
   * Fill the pool with new exercises
   *
   * @param criteria - Selection criteria for exercises
   * @param locale - Locale for generation
   * @returns Generated exercises
   */
  async fillPool(
    criteria: TemplateSelectionCriteria,
    locale: Locale = 'da-DK'
  ): Promise<ExerciseInstance[]> {
    if (this.generationInProgress) {
      console.log('[PoolManager] Generation already in progress, skipping');
      return [];
    }

    this.generationInProgress = true;

    try {
      // Calculate how many we need
      const stats = await this.getStats();
      const needed = POOL_CONFIG.MAX_BUFFER_SIZE - stats.unusedExercises;

      if (needed <= 0) {
        console.log('[PoolManager] Pool is full, skipping generation');
        return [];
      }

      const count = Math.min(needed, POOL_CONFIG.BATCH_SIZE);
      console.log(`[PoolManager] Generating ${count} exercises to fill pool`);

      // Generate exercises (worker or main thread)
      const instances = await this.generateBatch(criteria, count, locale);

      // Store in IndexedDB
      await offlineStorage.storeExercisePool(instances);

      console.log(`[PoolManager] Stored ${instances.length} exercises in pool`);

      return instances;
    } catch (error) {
      console.error('[PoolManager] Failed to fill pool:', error);
      throw new PoolManagerError('Failed to fill pool', 'fillPool', error);
    } finally {
      this.generationInProgress = false;
    }
  }

  /**
   * Generate batch of exercises
   *
   * Uses Web Worker if available, otherwise falls back to main thread.
   */
  private async generateBatch(
    criteria: TemplateSelectionCriteria,
    count: number,
    locale: Locale
  ): Promise<ExerciseInstance[]> {
    if (this.worker && this.workerReady) {
      return this.generateBatchWithWorker(criteria, count, locale);
    } else {
      return this.generateBatchMainThread(criteria, count, locale);
    }
  }

  /**
   * Generate batch using Web Worker
   */
  private generateBatchWithWorker(
    criteria: TemplateSelectionCriteria,
    count: number,
    locale: Locale
  ): Promise<ExerciseInstance[]> {
    return new Promise((resolve, reject) => {
      const id = `batch-${Date.now()}-${Math.random()}`;

      this.pendingRequests.set(id, {
        id,
        criteria,
        locale,
        resolve,
        reject,
      });

      const message: WorkerMessage = {
        type: 'generate-batch',
        id,
        criteria,
        count,
        locale,
        startSeed: Date.now(),
      };

      this.worker!.postMessage(message);
    });
  }

  /**
   * Generate batch on main thread (fallback)
   */
  private async generateBatchMainThread(
    criteria: TemplateSelectionCriteria,
    count: number,
    locale: Locale
  ): Promise<ExerciseInstance[]> {
    // Dynamic import to avoid loading generator on initial page load
    const { generateBatch } = await import('./generator');

    return generateBatch(criteria, count, {
      locale,
      startSeed: Date.now(),
    });
  }

  /**
   * Get pool statistics
   */
  async getStats(): Promise<PoolStats> {
    try {
      const stats = await offlineStorage.getExercisePoolStats();

      return {
        totalExercises: stats.total,
        unusedExercises: stats.unused,
        usedExercises: stats.used,
        oldestExerciseAge: stats.oldestAge,
        workerActive: this.workerReady,
      };
    } catch (error) {
      throw new PoolManagerError('Failed to get stats', 'getStats', error);
    }
  }

  /**
   * Clean up old exercises
   *
   * Removes exercises older than CLEANUP_AGE_DAYS.
   */
  async cleanup(): Promise<number> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - POOL_CONFIG.CLEANUP_AGE_DAYS);

      const removed = await offlineStorage.cleanupOldExercises(cutoffDate);
      console.log(`[PoolManager] Cleaned up ${removed} old exercises`);

      return removed;
    } catch (error) {
      throw new PoolManagerError('Failed to cleanup', 'cleanup', error);
    }
  }

  /**
   * Clear the entire pool
   */
  async clear(): Promise<void> {
    try {
      await offlineStorage.clearExercisePool();
      console.log('[PoolManager] Pool cleared');
    } catch (error) {
      throw new PoolManagerError('Failed to clear pool', 'clear', error);
    }
  }

  /**
   * Terminate the worker
   */
  terminate(): void {
    if (this.worker) {
      this.worker.terminate();
      this.worker = null;
      this.workerReady = false;
      console.log('[PoolManager] Worker terminated');
    }
  }
}

/**
 * Singleton instance
 */
export const poolManager = new ExercisePoolManager();

/**
 * Initialize pool manager on module load (async)
 */
if (typeof window !== 'undefined') {
  poolManager.initialize().catch((error) => {
    console.error('[PoolManager] Failed to initialize:', error);
  });
}

