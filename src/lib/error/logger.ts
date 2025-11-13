/**
 * Error Logging Utility
 *
 * Provides structured error logging with context capture for client-side errors.
 * Privacy-preserving: No PII collection (UUID is okay as it's not PII).
 *
 * Requirements:
 * - 8.1: Error handling and logging
 * - Privacy-first: No sensitive data collection
 *
 * Features:
 * - Structured error logging
 * - Context capture (component, timestamp, user state)
 * - Client-side error aggregation
 * - Development vs production behavior
 * - Privacy-preserving (no PII)
 *
 * @example
 * ```typescript
 * import { logError, ErrorCategory } from '@/lib/error/logger'
 *
 * logError({
 *   error: new Error('Failed to load data'),
 *   category: ErrorCategory.DATA,
 *   context: { component: 'ProgressDashboard' }
 * })
 * ```
 */

/**
 * Error category for classification
 */
export enum ErrorCategory {
  /** Network-related errors (fetch, timeout, offline) */
  NETWORK = "network",
  /** Authentication and authorization errors */
  AUTH = "auth",
  /** Exercise generation and validation errors */
  EXERCISE = "exercise",
  /** Data loading and saving errors */
  DATA = "data",
  /** UI component errors */
  COMPONENT = "component",
  /** General/uncategorized errors */
  GENERAL = "general",
}

/**
 * Error severity level
 */
export enum ErrorSeverity {
  /** Low severity - doesn't affect core functionality */
  LOW = "low",
  /** Medium severity - affects some functionality */
  MEDIUM = "medium",
  /** High severity - affects core functionality */
  HIGH = "high",
  /** Critical severity - app unusable */
  CRITICAL = "critical",
}

/**
 * Error context information
 */
export interface ErrorContext {
  /** Component where error occurred */
  component?: string;
  /** User ID (UUID is okay, not PII) */
  userId?: string;
  /** URL/route where error occurred */
  url?: string;
  /** User agent string */
  userAgent?: string;
  /** Timestamp */
  timestamp?: string;
  /** Additional custom context */
  [key: string]: unknown;
}

/**
 * Structured error log entry
 */
export interface ErrorLogEntry {
  /** Error object */
  error: Error;
  /** Error category */
  category?: ErrorCategory;
  /** Error severity */
  severity?: ErrorSeverity;
  /** Additional context */
  context?: ErrorContext;
  /** Whether error was handled */
  handled?: boolean;
}

/**
 * Error log storage (in-memory)
 */
const errorLog: ErrorLogEntry[] = [];
const MAX_LOG_SIZE = 100; // Keep last 100 errors

/**
 * Log an error with structured information
 *
 * Captures error details and context for debugging.
 * In development: Logs to console with full details
 * In production: Stores in memory for later analysis
 *
 * @param entry - Error log entry
 */
export function logError(entry: ErrorLogEntry): void {
  const timestamp = new Date().toISOString();

  // Enrich context with automatic data
  const enrichedContext: ErrorContext = {
    timestamp,
    url: typeof window !== "undefined" ? window.location.href : undefined,
    userAgent: typeof navigator !== "undefined" ? navigator.userAgent : undefined,
    ...entry.context,
  };

  // Create full log entry
  const logEntry: ErrorLogEntry = {
    ...entry,
    context: enrichedContext,
    handled: entry.handled ?? true,
  };

  // Add to in-memory log (FIFO)
  errorLog.push(logEntry);
  if (errorLog.length > MAX_LOG_SIZE) {
    errorLog.shift();
  }

  // Development logging (detailed)
  if (import.meta.env.DEV) {
    console.group(
      `🔴 Error [${entry.category || "GENERAL"}] - ${entry.error.message}`,
    );
    console.error("Error:", entry.error);
    console.log("Category:", entry.category || ErrorCategory.GENERAL);
    console.log("Severity:", entry.severity || ErrorSeverity.MEDIUM);
    console.log("Context:", enrichedContext);
    if (entry.error.stack) {
      console.log("Stack trace:", entry.error.stack);
    }
    console.groupEnd();
  } else {
    // Production logging (minimal)
    console.error(
      `[${entry.category || "GENERAL"}] ${entry.error.message}`,
      {
        component: enrichedContext.component,
        timestamp: enrichedContext.timestamp,
      },
    );
  }

  // Future: Send to error tracking service
  // This is where you'd integrate with Sentry, LogRocket, etc.
  // Note: Always ensure privacy compliance (no PII)
}

/**
 * Get all logged errors
 *
 * Returns a copy of the error log for analysis.
 * Useful for debugging or sending batch reports.
 *
 * @returns Array of error log entries
 */
export function getErrorLog(): ErrorLogEntry[] {
  return [...errorLog];
}

/**
 * Clear the error log
 *
 * Removes all stored error entries.
 */
export function clearErrorLog(): void {
  errorLog.length = 0;
}

/**
 * Get error log summary statistics
 *
 * Returns aggregated statistics about logged errors.
 *
 * @returns Error log summary
 */
export function getErrorLogSummary(): {
  total: number;
  byCategory: Record<ErrorCategory, number>;
  bySeverity: Record<ErrorSeverity, number>;
  recent: ErrorLogEntry[];
} {
  const byCategory: Record<ErrorCategory, number> = {
    [ErrorCategory.NETWORK]: 0,
    [ErrorCategory.AUTH]: 0,
    [ErrorCategory.EXERCISE]: 0,
    [ErrorCategory.DATA]: 0,
    [ErrorCategory.COMPONENT]: 0,
    [ErrorCategory.GENERAL]: 0,
  };

  const bySeverity: Record<ErrorSeverity, number> = {
    [ErrorSeverity.LOW]: 0,
    [ErrorSeverity.MEDIUM]: 0,
    [ErrorSeverity.HIGH]: 0,
    [ErrorSeverity.CRITICAL]: 0,
  };

  for (const entry of errorLog) {
    const category = entry.category || ErrorCategory.GENERAL;
    const severity = entry.severity || ErrorSeverity.MEDIUM;

    byCategory[category]++;
    bySeverity[severity]++;
  }

  return {
    total: errorLog.length,
    byCategory,
    bySeverity,
    recent: errorLog.slice(-10), // Last 10 errors
  };
}

/**
 * Filter error log by category
 *
 * @param category - Error category to filter by
 * @returns Filtered error log entries
 */
export function getErrorsByCategory(
  category: ErrorCategory,
): ErrorLogEntry[] {
  return errorLog.filter((entry) => entry.category === category);
}

/**
 * Filter error log by severity
 *
 * @param severity - Error severity to filter by
 * @returns Filtered error log entries
 */
export function getErrorsBySeverity(
  severity: ErrorSeverity,
): ErrorLogEntry[] {
  return errorLog.filter((entry) => entry.severity === severity);
}

/**
 * Check if a specific error has been logged recently
 *
 * Useful for preventing duplicate error logs.
 *
 * @param errorMessage - Error message to check
 * @param withinMs - Time window in milliseconds (default: 5000ms)
 * @returns Whether error was logged recently
 */
export function wasErrorLoggedRecently(
  errorMessage: string,
  withinMs: number = 5000,
): boolean {
  const now = Date.now();
  const threshold = now - withinMs;

  return errorLog.some((entry) => {
    const entryTime = entry.context?.timestamp
      ? new Date(entry.context.timestamp).getTime()
      : 0;
    return entry.error.message === errorMessage && entryTime > threshold;
  });
}
