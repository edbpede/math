/**
 * ErrorRecovery Component
 *
 * Provides actionable recovery options for error scenarios.
 * Displays contextual action buttons based on error type.
 *
 * Requirements:
 * - 8.2: Actionable guidance for error recovery
 * - 9.1: WCAG 2.1 AA compliance (keyboard navigation, touch targets)
 *
 * Features:
 * - Predefined recovery actions (reload, retry, go back, etc.)
 * - Custom action support
 * - Accessible button styling
 * - Loading states
 *
 * @example
 * ```tsx
 * <ErrorRecovery
 *   actions={['retry', 'goHome']}
 *   onRetry={() => retryOperation()}
 *   onGoHome={() => navigate('/')}
 * />
 * ```
 */

import { For, Show, createSignal, type Component } from "solid-js";
import { useStore } from "@nanostores/solid";
import { $t } from "@/lib/i18n";

/**
 * Predefined recovery action types
 */
export type RecoveryActionType =
  | "reload"
  | "retry"
  | "goBack"
  | "goHome"
  | "contactSupport"
  | "clearCache"
  | "syncNow";

/**
 * Recovery action configuration
 */
export interface RecoveryAction {
  /** Action type (for predefined actions) or custom label */
  type: RecoveryActionType | string;
  
  /** Custom label (overrides default translation) */
  label?: string;
  
  /** Handler function */
  handler: () => void | Promise<void>;
  
  /** Whether this is the primary action (emphasized styling) */
  primary?: boolean;
  
  /** Whether the action is disabled */
  disabled?: boolean;
}

/**
 * Props for ErrorRecovery component
 */
export interface ErrorRecoveryProps {
  /** List of recovery actions to display */
  actions: RecoveryAction[];
  
  /** Optional CSS class */
  class?: string;
}

/**
 * Get translation key for predefined action type
 */
function getActionTranslationKey(type: RecoveryActionType | string): string {
  const predefinedTypes: RecoveryActionType[] = [
    "reload",
    "retry",
    "goBack",
    "goHome",
    "contactSupport",
    "clearCache",
    "syncNow",
  ];

  if (predefinedTypes.includes(type as RecoveryActionType)) {
    return `errors.recovery.${type}`;
  }

  return type; // Return as-is for custom labels
}

/**
 * ErrorRecovery - Recovery action buttons component
 *
 * Displays a set of action buttons for error recovery scenarios.
 */
const ErrorRecovery: Component<ErrorRecoveryProps> = (props) => {
  const t = useStore($t);
  const [loadingAction, setLoadingAction] = createSignal<string | null>(null);

  /**
   * Handle action click with loading state
   */
  const handleAction = async (action: RecoveryAction, index: number) => {
    if (action.disabled || loadingAction() !== null) {
      return;
    }

    const actionKey = `${action.type}-${index}`;
    setLoadingAction(actionKey);

    try {
      await action.handler();
    } catch (error) {
      console.error("Recovery action failed:", error);
    } finally {
      setLoadingAction(null);
    }
  };

  return (
    <div
      class={`error-recovery flex flex-wrap gap-3 ${props.class || ""}`}
      role="group"
      aria-label="Error recovery actions"
    >
      <For each={props.actions}>
        {(action, index) => {
          const actionKey = `${action.type}-${index()}`;
          const isLoading = () => loadingAction() === actionKey;
          const label = () =>
            action.label || t()(getActionTranslationKey(action.type));

          return (
            <button
              type="button"
              onClick={() => handleAction(action, index())}
              disabled={action.disabled || isLoading()}
              class={`
                px-4 py-2 rounded-lg font-medium transition-all
                focus:outline-none focus:ring-4 focus:ring-blue-300
                disabled:opacity-60 disabled:cursor-not-allowed
                touch-target
                ${
                  action.primary
                    ? "bg-blue-600 text-white hover:bg-blue-700 shadow-md"
                    : "bg-white text-gray-700 border-2 border-gray-300 hover:bg-gray-50"
                }
              `}
              aria-busy={isLoading()}
            >
              <Show
                when={!isLoading()}
                fallback={
                  <span class="flex items-center gap-2">
                    <svg
                      class="animate-spin h-4 w-4"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        class="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        stroke-width="4"
                      />
                      <path
                        class="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      />
                    </svg>
                    <span>{label()}</span>
                  </span>
                }
              >
                {label()}
              </Show>
            </button>
          );
        }}
      </For>
    </div>
  );
};

export default ErrorRecovery;

