/**
 * Toast Notification Component
 *
 * Global notification system for displaying non-blocking messages to users.
 * Supports error, success, info, and warning message types with automatic
 * or manual dismissal.
 *
 * Requirements:
 * - 8.1: User feedback for errors and actions
 * - 9.1: Screen reader accessibility with ARIA live regions
 *
 * Features:
 * - Multiple toast types (error, success, info, warning)
 * - Auto-dismiss with configurable timeout
 * - Manual dismiss option
 * - Stacking support for multiple toasts
 * - Slide-in animations
 * - Accessible (ARIA live regions, keyboard support)
 * - SSR-compatible
 *
 * @example
 * ```tsx
 * import { showToast } from '@/components/islands/ToastNotification'
 *
 * showToast({
 *   type: 'success',
 *   message: 'Changes saved!',
 *   duration: 3000
 * })
 * ```
 */

import {
  createSignal,
  For,
  Show,
  onMount,
  type Component,
} from "solid-js";
import { useStore } from "@nanostores/solid";
import { $t } from "@/lib/i18n";
import { announce } from "@/lib/accessibility/announcer";

/**
 * Toast notification type
 */
export type ToastType = "success" | "error" | "info" | "warning";

/**
 * Toast notification data
 */
export interface Toast {
  /** Unique identifier */
  id: string;
  /** Toast type */
  type: ToastType;
  /** Message to display */
  message: string;
  /** Duration in milliseconds (0 = no auto-dismiss) */
  duration?: number;
  /** Whether toast can be manually dismissed */
  dismissible?: boolean;
  /** Timestamp when toast was created */
  timestamp: number;
}

/**
 * Options for showing a toast
 */
export interface ShowToastOptions {
  /** Toast type (default: 'info') */
  type?: ToastType;
  /** Message to display */
  message: string;
  /** Duration in milliseconds (default: 5000, 0 = no auto-dismiss) */
  duration?: number;
  /** Whether toast can be manually dismissed (default: true) */
  dismissible?: boolean;
  /** Whether to announce to screen readers (default: true) */
  announce?: boolean;
}

/**
 * Global toast store
 */
const [toasts, setToasts] = createSignal<Toast[]>([]);

/**
 * Generate unique toast ID
 */
let toastIdCounter = 0;
function generateToastId(): string {
  return `toast-${Date.now()}-${++toastIdCounter}`;
}

/**
 * Show a toast notification
 *
 * @param options - Toast options
 * @returns Toast ID for manual dismissal
 */
export function showToast(options: ShowToastOptions): string {
  const {
    type = "info",
    message,
    duration = 5000,
    dismissible = true,
    announce: shouldAnnounce = true,
  } = options;

  const id = generateToastId();

  const toast: Toast = {
    id,
    type,
    message,
    duration,
    dismissible,
    timestamp: Date.now(),
  };

  setToasts((prev) => [...prev, toast]);

  // Announce to screen readers
  if (shouldAnnounce) {
    const priority = type === "error" ? "assertive" : "polite";
    announce(message, { priority });
  }

  // Auto-dismiss after duration
  if (duration > 0) {
    setTimeout(() => {
      dismissToast(id);
    }, duration);
  }

  return id;
}

/**
 * Dismiss a specific toast
 *
 * @param id - Toast ID to dismiss
 */
export function dismissToast(id: string): void {
  setToasts((prev) => prev.filter((toast) => toast.id !== id));
}

/**
 * Dismiss all toasts
 */
export function dismissAllToasts(): void {
  setToasts([]);
}

/**
 * Toast notification item component
 */
const ToastItem: Component<{
  toast: Toast;
  onDismiss: () => void;
}> = (props) => {
  const t = useStore($t);
  let containerRef: HTMLDivElement | undefined;

  // Auto-focus on mount for keyboard access
  onMount(() => {
    if (containerRef && props.toast.dismissible) {
      const button = containerRef.querySelector("button");
      button?.focus();
    }
  });

  const getIcon = () => {
    switch (props.toast.type) {
      case "success":
        return (
          <svg
            class="h-6 w-6"
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
              d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        );
      case "error":
        return (
          <svg
            class="h-6 w-6"
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
              d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        );
      case "warning":
        return (
          <svg
            class="h-6 w-6"
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
        );
      case "info":
      default:
        return (
          <svg
            class="h-6 w-6"
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
              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        );
    }
  };

  const getColorClasses = () => {
    switch (props.toast.type) {
      case "success":
        return "bg-green-50 border-green-200 text-green-900";
      case "error":
        return "bg-red-50 border-red-200 text-red-900";
      case "warning":
        return "bg-yellow-50 border-yellow-200 text-yellow-900";
      case "info":
      default:
        return "bg-blue-50 border-blue-200 text-blue-900";
    }
  };

  const getIconColorClass = () => {
    switch (props.toast.type) {
      case "success":
        return "text-green-600";
      case "error":
        return "text-red-600";
      case "warning":
        return "text-yellow-600";
      case "info":
      default:
        return "text-blue-600";
    }
  };

  const getButtonColorClass = () => {
    switch (props.toast.type) {
      case "success":
        return "text-green-600 hover:bg-green-100";
      case "error":
        return "text-red-600 hover:bg-red-100";
      case "warning":
        return "text-yellow-600 hover:bg-yellow-100";
      case "info":
      default:
        return "text-blue-600 hover:bg-blue-100";
    }
  };

  return (
    <div
      ref={containerRef}
      class={`pointer-events-auto flex w-full max-w-md rounded-lg border-2 shadow-lg animate-slide-in-top ${getColorClasses()}`}
      role="status"
      aria-live={props.toast.type === "error" ? "assertive" : "polite"}
      aria-atomic="true"
    >
      <div class="flex flex-1 items-start p-4">
        <div class={`flex-shrink-0 ${getIconColorClass()}`}>{getIcon()}</div>
        <div class="ml-3 flex-1">
          <p class="text-sm font-medium">{props.toast.message}</p>
        </div>
        <Show when={props.toast.dismissible}>
          <button
            onClick={props.onDismiss}
            class={`ml-4 inline-flex flex-shrink-0 rounded-md p-1.5 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 ${getButtonColorClass()}`}
            aria-label={t()("common.actions.dismiss")}
          >
            <span class="sr-only">{t()("common.actions.dismiss")}</span>
            <svg
              class="h-5 w-5"
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
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </Show>
      </div>
    </div>
  );
};

/**
 * Toast Container Component
 *
 * Displays all active toast notifications in a fixed container.
 * Should be placed once in MainLayout.
 *
 * @example
 * ```tsx
 * <ToastContainer />
 * ```
 */
export const ToastContainer: Component = () => {
  if (typeof window === "undefined") {
    // SSR: Don't render toasts server-side
    return null;
  }

  return (
    <div
      class="pointer-events-none fixed top-0 right-0 z-50 flex flex-col items-end gap-3 p-4 w-full max-w-md"
      aria-live="polite"
      aria-atomic="false"
    >
      <For each={toasts()}>
        {(toast) => (
          <ToastItem toast={toast} onDismiss={() => dismissToast(toast.id)} />
        )}
      </For>
    </div>
  );
};

/**
 * Convenience functions for specific toast types
 */
export const toast = {
  success: (message: string, duration?: number) =>
    showToast({ type: "success", message, duration }),

  error: (message: string, duration?: number) =>
    showToast({ type: "error", message, duration }),

  info: (message: string, duration?: number) =>
    showToast({ type: "info", message, duration }),

  warning: (message: string, duration?: number) =>
    showToast({ type: "warning", message, duration }),

  dismiss: dismissToast,

  dismissAll: dismissAllToasts,
};

export default ToastContainer;
