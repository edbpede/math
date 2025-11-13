/**
 * Error Boundary Component
 *
 * Reusable error boundary wrapper for SolidJS island components.
 * Provides fallback UI, error logging, and screen reader announcements.
 *
 * Requirements:
 * - 8.1: Error handling with user feedback
 * - 8.2: Accessible error messages
 * - 9.1: Screen reader support
 *
 * Features:
 * - Customizable fallback UI
 * - Error logging with context
 * - Screen reader announcements
 * - Reset functionality
 * - SSR-compatible
 *
 * @example
 * ```tsx
 * <ErrorBoundaryWrapper
 *   componentName="ExercisePractice"
 *   onError={(error) => console.log('Error:', error)}
 * >
 *   <YourComponent />
 * </ErrorBoundaryWrapper>
 * ```
 */

import {
  ErrorBoundary as SolidErrorBoundary,
  type Component,
  type JSX,
  createSignal,
} from "solid-js";
import { useStore } from "@nanostores/solid";
import { $t } from "@/lib/i18n";
import { announce } from "@/lib/accessibility/announcer";
import { logError } from "@/lib/error/logger";

/**
 * Props for ErrorBoundaryWrapper component
 */
export interface ErrorBoundaryWrapperProps {
  /** Child components to protect */
  children: JSX.Element;
  /** Component name for error logging */
  componentName?: string;
  /** Custom fallback UI (receives error and reset function) */
  fallback?: (error: Error, reset: () => void) => JSX.Element;
  /** Callback when error occurs */
  onError?: (error: Error, reset: () => void) => void;
  /** Whether to announce errors to screen readers (default: true) */
  announceErrors?: boolean;
  /** Custom error message key for translations */
  errorMessageKey?: string;
}

/**
 * Default error fallback UI
 *
 * Displays a user-friendly error message with retry button.
 * Fully accessible with ARIA attributes and keyboard support.
 */
const DefaultErrorFallback: Component<{
  error: Error;
  reset: () => void;
  componentName?: string;
  errorMessageKey?: string;
}> = (props) => {
  const t = useStore($t);

  const getMessage = () => {
    if (props.errorMessageKey) {
      return t()(props.errorMessageKey);
    }
    return t()("errors.general.unexpected");
  };

  const handleReset = () => {
    // Announce reset attempt to screen readers
    announce(t()("errors.general.tryAgain"), { priority: "polite" });
    props.reset();
  };

  return (
    <div
      class="rounded-lg border-2 border-red-200 bg-red-50 p-6 text-center"
      role="alert"
      aria-live="assertive"
    >
      <div class="mx-auto max-w-md">
        {/* Error Icon */}
        <div class="mb-4 flex justify-center">
          <svg
            class="h-12 w-12 text-red-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
        </div>

        {/* Error Message */}
        <h2 class="text-lg font-semibold text-red-900 mb-2">
          {getMessage()}
        </h2>

        {/* Component Context (dev mode only) */}
        {import.meta.env.DEV && props.componentName && (
          <p class="text-sm text-red-700 mb-2">
            Component: {props.componentName}
          </p>
        )}

        {/* Technical Details (dev mode only) */}
        {import.meta.env.DEV && (
          <details class="mt-3 text-left">
            <summary class="cursor-pointer text-sm font-medium text-red-800 hover:text-red-900">
              Technical details
            </summary>
            <pre class="mt-2 overflow-auto rounded bg-red-100 p-2 text-xs text-red-900">
              {props.error.message}
              {props.error.stack && `\n\n${props.error.stack}`}
            </pre>
          </details>
        )}

        {/* Action Buttons */}
        <div class="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <button
            onClick={handleReset}
            class="touch-target inline-flex items-center justify-center rounded-md bg-red-600 px-6 py-3 text-base font-medium text-white transition-colors hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
            aria-label={t()("errors.general.tryAgain")}
          >
            <svg
              class="mr-2 h-5 w-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
              aria-hidden="true"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
            {t()("errors.general.tryAgain")}
          </button>

          <button
            onClick={() => window.location.reload()}
            class="touch-target inline-flex items-center justify-center rounded-md border-2 border-red-300 bg-white px-6 py-3 text-base font-medium text-red-700 transition-colors hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
            aria-label="Genindlæs siden"
          >
            Genindlæs siden
          </button>
        </div>

        {/* Support Message */}
        <p class="mt-4 text-sm text-red-600">
          {t()("errors.general.contactSupport")}
        </p>
      </div>
    </div>
  );
};

/**
 * Error Boundary Wrapper Component
 *
 * Wraps SolidJS ErrorBoundary with additional features:
 * - Error logging with context
 * - Screen reader announcements
 * - Customizable fallback UI
 * - Reset state management
 *
 * @example
 * ```tsx
 * // Basic usage
 * <ErrorBoundaryWrapper componentName="MyComponent">
 *   <MyComponent />
 * </ErrorBoundaryWrapper>
 *
 * // With custom fallback
 * <ErrorBoundaryWrapper
 *   componentName="MyComponent"
 *   fallback={(error, reset) => <CustomErrorUI error={error} onReset={reset} />}
 * >
 *   <MyComponent />
 * </ErrorBoundaryWrapper>
 *
 * // With error callback
 * <ErrorBoundaryWrapper
 *   componentName="MyComponent"
 *   onError={(error) => trackError(error)}
 * >
 *   <MyComponent />
 * </ErrorBoundaryWrapper>
 * ```
 */
export const ErrorBoundaryWrapper: Component<ErrorBoundaryWrapperProps> = (
  props,
) => {
  const t = useStore($t);
  const [resetKey, setResetKey] = createSignal(0);

  const handleError = (error: Error) => {
    // Log error with context
    logError({
      error,
      context: {
        component: props.componentName || "Unknown",
        timestamp: new Date().toISOString(),
      },
    });

    // Announce error to screen readers
    if (props.announceErrors !== false) {
      const message = props.errorMessageKey
        ? t()(props.errorMessageKey)
        : t()("errors.general.unexpected");
      announce(message, { priority: "assertive", clearQueue: true });
    }

    // Call custom error handler
    if (props.onError) {
      props.onError(error, reset);
    }
  };

  const reset = () => {
    setResetKey((k) => k + 1);
  };

  return (
    <SolidErrorBoundary
      fallback={(error: Error) => {
        handleError(error);

        if (props.fallback) {
          return props.fallback(error, reset);
        }

        return (
          <DefaultErrorFallback
            error={error}
            reset={reset}
            componentName={props.componentName}
            errorMessageKey={props.errorMessageKey}
          />
        );
      }}
    >
      {/* Key forces remount on reset */}
      <div data-reset-key={resetKey()}>{props.children}</div>
    </SolidErrorBoundary>
  );
};

export default ErrorBoundaryWrapper;
