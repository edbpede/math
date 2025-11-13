/**
 * ValidationMessage Component
 *
 * Reusable inline validation message component for displaying
 * validation errors, warnings, and success messages next to form inputs.
 *
 * Requirements:
 * - 8.2: Clear, actionable error messages
 * - 9.1: WCAG 2.1 AA compliance (ARIA live regions, screen reader support)
 *
 * Features:
 * - Multiple message types (error, warning, success, info)
 * - ARIA live regions for screen reader announcements
 * - Accessible color contrast
 * - Icon support
 * - Dismissible option
 *
 * @example
 * ```tsx
 * <ValidationMessage
 *   type="error"
 *   message="This field is required"
 *   visible={showError()}
 * />
 * ```
 */

import { Show, type Component } from "solid-js";

/**
 * Validation message type
 */
export type ValidationMessageType = "error" | "warning" | "success" | "info";

/**
 * Props for ValidationMessage component
 */
export interface ValidationMessageProps {
  /** Message type (determines color and icon) */
  type: ValidationMessageType;
  
  /** Message text to display */
  message: string;
  
  /** Whether the message is visible */
  visible?: boolean;
  
  /** Whether the message can be dismissed */
  dismissible?: boolean;
  
  /** Callback when message is dismissed */
  onDismiss?: () => void;
  
  /** Optional CSS class */
  class?: string;
  
  /** Optional ID for aria-describedby linking */
  id?: string;
}

/**
 * Get icon SVG path for message type
 */
function getIconPath(type: ValidationMessageType): string {
  switch (type) {
    case "error":
      // Exclamation circle
      return "M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z";
    case "warning":
      // Exclamation triangle
      return "M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z";
    case "success":
      // Check circle
      return "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z";
    case "info":
      // Information circle
      return "M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z";
  }
}

/**
 * Get CSS classes for message type
 */
function getTypeClasses(type: ValidationMessageType): string {
  switch (type) {
    case "error":
      return "text-red-700 bg-red-50 border-red-200 dark:text-red-400 dark:bg-red-900/20 dark:border-red-800";
    case "warning":
      return "text-orange-700 bg-orange-50 border-orange-200 dark:text-orange-400 dark:bg-orange-900/20 dark:border-orange-800";
    case "success":
      return "text-green-700 bg-green-50 border-green-200 dark:text-green-400 dark:bg-green-900/20 dark:border-green-800";
    case "info":
      return "text-blue-700 bg-blue-50 border-blue-200 dark:text-blue-400 dark:bg-blue-900/20 dark:border-blue-800";
  }
}

/**
 * Get icon color classes for message type
 */
function getIconColorClasses(type: ValidationMessageType): string {
  switch (type) {
    case "error":
      return "text-red-600 dark:text-red-400";
    case "warning":
      return "text-orange-600 dark:text-orange-400";
    case "success":
      return "text-green-600 dark:text-green-400";
    case "info":
      return "text-blue-600 dark:text-blue-400";
  }
}

/**
 * ValidationMessage - Inline validation message component
 *
 * Displays validation messages with appropriate styling and accessibility features.
 */
const ValidationMessage: Component<ValidationMessageProps> = (props) => {
  return (
    <Show when={props.visible !== false}>
      <div
        id={props.id}
        role="alert"
        aria-live="polite"
        aria-atomic="true"
        class={`
          flex items-start gap-2 p-3 mt-2 text-sm rounded-lg border
          ${getTypeClasses(props.type)}
          ${props.class || ""}
        `}
      >
        {/* Icon */}
        <svg
          class={`flex-shrink-0 w-5 h-5 ${getIconColorClasses(props.type)}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d={getIconPath(props.type)}
          />
        </svg>

        {/* Message text */}
        <span class="flex-1">{props.message}</span>

        {/* Dismiss button (optional) */}
        <Show when={props.dismissible && props.onDismiss}>
          <button
            type="button"
            onClick={props.onDismiss}
            class="flex-shrink-0 ml-2 p-1 rounded hover:bg-black/5 focus:outline-none focus:ring-2 focus:ring-current"
            aria-label="Dismiss message"
          >
            <svg
              class="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
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
    </Show>
  );
};

export default ValidationMessage;

