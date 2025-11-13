/**
 * Global Error Handler
 *
 * Catches unhandled errors and promise rejections at the window level.
 * Integrates with toast notification system for user feedback and
 * error logging for debugging.
 *
 * Requirements:
 * - 8.1: Error handling and user feedback
 * - 17.1: Global error handler for unhandled rejections
 *
 * Features:
 * - Window error event handler
 * - Unhandled promise rejection handler
 * - Integration with toast notification system
 * - Integration with error logger
 * - Error categorization and filtering
 * - Development vs production behavior
 * - Prevents error loops with duplicate detection
 *
 * @example
 * ```typescript
 * import { initializeGlobalErrorHandler } from '@/lib/error/global-handler'
 *
 * // In your app initialization (e.g., MainLayout)
 * initializeGlobalErrorHandler()
 * ```
 */

import { toast } from "@/components/islands/ToastNotification";
import {
  logError,
  ErrorCategory,
  ErrorSeverity,
  wasErrorLoggedRecently,
} from "./logger";

/**
 * Options for global error handler
 */
export interface GlobalErrorHandlerOptions {
  /** Whether to show toast notifications for errors (default: true) */
  showToasts?: boolean;
  /** Whether to log errors to console (default: true in dev, false in prod) */
  logToConsole?: boolean;
  /** Custom error filter function (return false to ignore error) */
  shouldHandleError?: (error: Error | ErrorEvent) => boolean;
  /** Custom toast message generator */
  getToastMessage?: (error: Error) => string;
}

/**
 * Default options
 */
const defaultOptions: GlobalErrorHandlerOptions = {
  showToasts: true,
  logToConsole: import.meta.env.DEV,
  shouldHandleError: () => true,
  getToastMessage: () => "Noget gik galt. Prøv venligst igen.", // Danish default
};

/**
 * Track whether handler is initialized to prevent duplicate handlers
 */
let isInitialized = false;

/**
 * Store cleanup functions
 */
let cleanupFunctions: (() => void)[] = [];

/**
 * Categorize error based on message and type
 *
 * @param error - Error to categorize
 * @returns Error category
 */
function categorizeError(error: Error): ErrorCategory {
  const message = error.message.toLowerCase();

  if (
    message.includes("network") ||
    message.includes("fetch") ||
    message.includes("timeout") ||
    message.includes("offline")
  ) {
    return ErrorCategory.NETWORK;
  }

  if (
    message.includes("auth") ||
    message.includes("unauthorized") ||
    message.includes("token") ||
    message.includes("session")
  ) {
    return ErrorCategory.AUTH;
  }

  if (
    message.includes("exercise") ||
    message.includes("template") ||
    message.includes("generation")
  ) {
    return ErrorCategory.EXERCISE;
  }

  if (
    message.includes("data") ||
    message.includes("load") ||
    message.includes("save") ||
    message.includes("sync")
  ) {
    return ErrorCategory.DATA;
  }

  return ErrorCategory.GENERAL;
}

/**
 * Determine error severity based on error type and message
 *
 * @param error - Error to assess
 * @returns Error severity
 */
function determineErrorSeverity(error: Error): ErrorSeverity {
  const message = error.message.toLowerCase();

  // Critical errors
  if (
    message.includes("critical") ||
    message.includes("fatal") ||
    message.includes("crash")
  ) {
    return ErrorSeverity.CRITICAL;
  }

  // High severity errors
  if (
    message.includes("auth") ||
    message.includes("unauthorized") ||
    message.includes("data loss")
  ) {
    return ErrorSeverity.HIGH;
  }

  // Low severity errors
  if (
    message.includes("warning") ||
    message.includes("minor") ||
    message.includes("cosmetic")
  ) {
    return ErrorSeverity.LOW;
  }

  // Default to medium
  return ErrorSeverity.MEDIUM;
}

/**
 * Check if error should be ignored
 *
 * Some errors are expected or not actionable, so we filter them out.
 *
 * @param error - Error to check
 * @returns Whether error should be ignored
 */
function shouldIgnoreError(error: Error): boolean {
  const message = error.message.toLowerCase();

  // Ignore ResizeObserver errors (browser quirk, harmless)
  if (message.includes("resizeobserver")) {
    return true;
  }

  // Ignore script loading errors from browser extensions
  if (message.includes("extension") && message.includes("script")) {
    return true;
  }

  // Ignore network errors when offline (handled by offline manager)
  if (message.includes("failed to fetch") && !navigator.onLine) {
    return true;
  }

  return false;
}

/**
 * Handle window error event
 *
 * @param event - Error event
 * @param options - Handler options
 */
function handleWindowError(
  event: ErrorEvent,
  options: GlobalErrorHandlerOptions,
): void {
  const error = event.error || new Error(event.message);

  // Check if we should ignore this error
  if (shouldIgnoreError(error)) {
    return;
  }

  // Check custom filter
  if (options.shouldHandleError && !options.shouldHandleError(event)) {
    return;
  }

  // Prevent duplicate handling (within 1 second)
  if (wasErrorLoggedRecently(error.message, 1000)) {
    return;
  }

  // Categorize and log error
  const category = categorizeError(error);
  const severity = determineErrorSeverity(error);

  logError({
    error,
    category,
    severity,
    handled: false,
    context: {
      component: "GlobalErrorHandler",
      url: window.location.href,
      filename: event.filename,
      lineno: event.lineno,
      colno: event.colno,
    },
  });

  // Show toast notification
  if (options.showToasts) {
    const message = options.getToastMessage
      ? options.getToastMessage(error)
      : defaultOptions.getToastMessage!(error);

    toast.error(message, 7000);
  }

  // Prevent default browser error handling in development
  if (import.meta.env.DEV) {
    event.preventDefault();
  }
}

/**
 * Handle unhandled promise rejection
 *
 * @param event - Promise rejection event
 * @param options - Handler options
 */
function handleUnhandledRejection(
  event: PromiseRejectionEvent,
  options: GlobalErrorHandlerOptions,
): void {
  // Convert rejection reason to Error
  const error =
    event.reason instanceof Error
      ? event.reason
      : new Error(String(event.reason));

  // Check if we should ignore this error
  if (shouldIgnoreError(error)) {
    return;
  }

  // Check custom filter
  if (
    options.shouldHandleError &&
    !options.shouldHandleError(error)
  ) {
    return;
  }

  // Prevent duplicate handling (within 1 second)
  if (wasErrorLoggedRecently(error.message, 1000)) {
    return;
  }

  // Categorize and log error
  const category = categorizeError(error);
  const severity = determineErrorSeverity(error);

  logError({
    error,
    category,
    severity,
    handled: false,
    context: {
      component: "GlobalErrorHandler",
      type: "UnhandledPromiseRejection",
      url: window.location.href,
    },
  });

  // Show toast notification
  if (options.showToasts) {
    const message = options.getToastMessage
      ? options.getToastMessage(error)
      : defaultOptions.getToastMessage!(error);

    toast.error(message, 7000);
  }

  // Prevent default handling in development
  if (import.meta.env.DEV) {
    event.preventDefault();
  }
}

/**
 * Initialize global error handler
 *
 * Sets up window-level error handlers for uncaught errors and
 * unhandled promise rejections. Should be called once during
 * app initialization.
 *
 * @param options - Handler options
 * @returns Cleanup function to remove handlers
 *
 * @example
 * ```typescript
 * // Basic usage
 * initializeGlobalErrorHandler()
 *
 * // With custom options
 * initializeGlobalErrorHandler({
 *   showToasts: true,
 *   shouldHandleError: (error) => {
 *     // Don't handle errors from third-party scripts
 *     return !error.filename?.includes('third-party')
 *   },
 *   getToastMessage: (error) => {
 *     if (error.message.includes('network')) {
 *       return 'Netværksfejl. Tjek din forbindelse.'
 *     }
 *     return 'Der opstod en fejl.'
 *   }
 * })
 * ```
 */
export function initializeGlobalErrorHandler(
  options: GlobalErrorHandlerOptions = {},
): () => void {
  // Prevent double initialization
  if (isInitialized) {
    console.warn(
      "[GlobalErrorHandler] Already initialized. Call cleanup() first if you want to reinitialize.",
    );
    return () => {};
  }

  // Only initialize in browser environment
  if (typeof window === "undefined") {
    return () => {};
  }

  // Merge with default options
  const mergedOptions = { ...defaultOptions, ...options };

  // Create error handler with merged options
  const errorHandler = (event: ErrorEvent) =>
    handleWindowError(event, mergedOptions);

  // Create rejection handler with merged options
  const rejectionHandler = (event: PromiseRejectionEvent) =>
    handleUnhandledRejection(event, mergedOptions);

  // Add event listeners
  window.addEventListener("error", errorHandler);
  window.addEventListener("unhandledrejection", rejectionHandler);

  // Mark as initialized
  isInitialized = true;

  // Create cleanup function
  const cleanup = () => {
    window.removeEventListener("error", errorHandler);
    window.removeEventListener("unhandledrejection", rejectionHandler);
    isInitialized = false;

    // Remove from cleanup functions array
    cleanupFunctions = cleanupFunctions.filter((fn) => fn !== cleanup);
  };

  // Store cleanup function
  cleanupFunctions.push(cleanup);

  // Log initialization in development
  if (import.meta.env.DEV) {
    console.log(
      "[GlobalErrorHandler] Initialized with options:",
      mergedOptions,
    );
  }

  return cleanup;
}

/**
 * Cleanup all global error handlers
 *
 * Removes all registered error handlers. Useful for testing
 * or when unmounting the app.
 */
export function cleanupGlobalErrorHandler(): void {
  cleanupFunctions.forEach((cleanup) => cleanup());
  cleanupFunctions = [];
}

/**
 * Check if global error handler is initialized
 *
 * @returns Whether handler is initialized
 */
export function isGlobalErrorHandlerInitialized(): boolean {
  return isInitialized;
}
