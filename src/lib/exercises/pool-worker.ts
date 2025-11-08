/**
 * Exercise Pool Web Worker
 *
 * Background worker for generating exercise instances without blocking
 * the main thread. Receives generation requests via postMessage and
 * returns generated instances.
 *
 * Requirements:
 * - 13.3: Generate exercise pool in background (Web Worker)
 * - 11.4: Generate 20-30 instances in batch <200ms
 */

import { generateBatch, generateInstance } from './generator';
import type { TemplateSelectionCriteria } from './template-registry';
import type { ExerciseInstance } from './types';
import type { Locale } from '../i18n/types';

/**
 * Worker message types
 */
export type WorkerMessage =
  | {
      type: 'generate-batch';
      id: string;
      criteria: TemplateSelectionCriteria;
      count: number;
      locale?: Locale;
      startSeed?: number;
    }
  | {
      type: 'generate-single';
      id: string;
      templateId: string;
      seed: number;
      locale?: Locale;
    };

/**
 * Worker response types
 */
export type WorkerResponse =
  | {
      type: 'batch-complete';
      id: string;
      instances: ExerciseInstance[];
      duration: number;
    }
  | {
      type: 'single-complete';
      id: string;
      instance: ExerciseInstance;
      duration: number;
    }
  | {
      type: 'error';
      id: string;
      error: string;
      stack?: string;
    };

/**
 * Worker message handler
 *
 * Processes generation requests and posts results back to main thread.
 */
self.addEventListener('message', async (event: MessageEvent<WorkerMessage>) => {
  const message = event.data;
  const startTime = performance.now();

  try {
    if (message.type === 'generate-batch') {
      // Generate batch of exercises
      const instances = await generateBatch(
        message.criteria,
        message.count,
        {
          locale: message.locale || 'da-DK',
          startSeed: message.startSeed || Date.now(),
        }
      );

      const duration = performance.now() - startTime;

      const response: WorkerResponse = {
        type: 'batch-complete',
        id: message.id,
        instances,
        duration,
      };

      self.postMessage(response);
    } else if (message.type === 'generate-single') {
      // Generate single exercise
      const instance = await generateInstance(
        message.templateId,
        message.seed,
        {
          locale: message.locale || 'da-DK',
        }
      );

      const duration = performance.now() - startTime;

      const response: WorkerResponse = {
        type: 'single-complete',
        id: message.id,
        instance,
        duration,
      };

      self.postMessage(response);
    }
  } catch (error) {
    // Send error response
    const response: WorkerResponse = {
      type: 'error',
      id: message.id,
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    };

    self.postMessage(response);
  }
});

// Signal that worker is ready
self.postMessage({ type: 'ready' });

