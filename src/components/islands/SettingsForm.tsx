/**
 * SettingsForm Component
 *
 * SolidJS island component for managing user settings including grade level
 * and display preferences. Features automatic save with debouncing, optimistic
 * UI updates, and comprehensive accessibility support.
 *
 * Requirements:
 * - 9.1: WCAG 2.1 AA accessibility (keyboard navigation, ARIA labels)
 * - 9.2: Display preferences (theme, font size, dyslexia font, high contrast)
 */

import { createSignal, Show, For } from "solid-js";
import { useStore } from "@nanostores/solid";
import { $t } from "@/lib/i18n";
import { updateUser } from "@/lib/auth";
import type { UserPreferences } from "@/lib/types/preferences";
import { validatePreferences } from "@/lib/types/preferences";
import { $preferences, updatePreferences } from "@/lib/preferences";

export interface SettingsFormProps {
  /** Current user ID */
  userId: string;
  /** Current grade range */
  initialGradeRange: "0-3" | "4-6" | "7-9";
  /** Current user preferences */
  initialPreferences: UserPreferences | Record<string, unknown>;
  /** Optional CSS class */
  class?: string;
}

// Discriminated union for form state
type FormState =
  | { status: "idle" }
  | { status: "saving" }
  | { status: "saved" }
  | { status: "error"; message: string };

// Debounce timeout handle
let saveTimeout: ReturnType<typeof setTimeout> | null = null;
const DEBOUNCE_MS = 1000;

/**
 * SettingsForm - Interactive form for user settings
 *
 * Features:
 * - Grade level selection with radio buttons
 * - Display preferences (theme, font size, dyslexia font, high contrast)
 * - Automatic save with debouncing (1 second after last change)
 * - Optimistic UI updates with error rollback
 * - Full keyboard navigation and ARIA support
 * - Loading states and error handling
 *
 * @example
 * ```tsx
 * <SettingsForm
 *   userId={user.id}
 *   initialGradeRange={user.gradeRange}
 *   initialPreferences={user.preferences}
 * />
 * ```
 */
export default function SettingsForm(props: SettingsFormProps) {
  const t = useStore($t);
  const preferences = useStore($preferences);

  // Form state
  const [gradeRange, setGradeRange] = createSignal(props.initialGradeRange);
  const [state, setState] = createSignal<FormState>({ status: "idle" });
  const [hasUnsavedChanges, setHasUnsavedChanges] = createSignal(false);

  // Previous values for rollback on error
  let previousGradeRange = props.initialGradeRange;
  let previousPreferences = preferences();

  /**
   * Save settings to Supabase with debouncing
   */
  const saveSettings = async () => {
    // Cancel any pending save
    if (saveTimeout) {
      clearTimeout(saveTimeout);
      saveTimeout = null;
    }

    setState({ status: "saving" });
    setHasUnsavedChanges(false);

    const newPreferences = preferences();

    // Validate preferences
    if (!validatePreferences(newPreferences)) {
      setState({
        status: "error",
        message: t()("settings.messages.saveError"),
      });
      return;
    }

    // Save current values for potential rollback
    const currentGradeRange = gradeRange();
    const currentPreferences = newPreferences;

    try {
      const result = await updateUser(props.userId, {
        gradeRange: currentGradeRange,
        preferences: newPreferences,
      });

      if (!result.success) {
        // Rollback on error
        setGradeRange(previousGradeRange);
        updatePreferences(previousPreferences);

        setState({
          status: "error",
          message: result.error || t()("settings.messages.saveError"),
        });
        return;
      }

      // Update previous values for next save
      previousGradeRange = currentGradeRange;
      previousPreferences = currentPreferences;

      setState({ status: "saved" });

      // Clear saved status after 3 seconds
      setTimeout(() => {
        setState((current) =>
          current.status === "saved" ? { status: "idle" } : current,
        );
      }, 3000);

      // Note: DOM updates are handled automatically by the preferences manager
      // via the store subscription in init.ts
    } catch (error) {
      console.error("Error saving settings:", error);

      // Rollback on error
      setGradeRange(previousGradeRange);
      updatePreferences(previousPreferences);

      setState({
        status: "error",
        message: t()("settings.messages.saveError"),
      });
    }
  };

  /**
   * Debounced save triggered by any settings change
   */
  const debouncedSave = () => {
    setHasUnsavedChanges(true);

    if (saveTimeout) {
      clearTimeout(saveTimeout);
    }

    saveTimeout = setTimeout(() => {
      saveSettings();
    }, DEBOUNCE_MS);
  };

  // Note: Preferences are automatically applied to DOM by the preferences manager
  // via the subscription in init.ts, so we don't need a local applyPreferencesToDOM

  // Grade range options
  const gradeOptions = [
    {
      value: "0-3",
      labelKey: "settings.gradeLevel.options.0-3.label",
      descKey: "settings.gradeLevel.options.0-3.description",
    },
    {
      value: "4-6",
      labelKey: "settings.gradeLevel.options.4-6.label",
      descKey: "settings.gradeLevel.options.4-6.description",
    },
    {
      value: "7-9",
      labelKey: "settings.gradeLevel.options.7-9.label",
      descKey: "settings.gradeLevel.options.7-9.description",
    },
  ] as const;

  // Theme options
  const themeOptions = [
    { value: "light", labelKey: "settings.display.theme.options.light" },
    { value: "dark", labelKey: "settings.display.theme.options.dark" },
    { value: "system", labelKey: "settings.display.theme.options.system" },
  ] as const;

  // Font size options
  const fontSizeOptions = [
    { value: "small", labelKey: "settings.display.fontSize.options.small" },
    { value: "medium", labelKey: "settings.display.fontSize.options.medium" },
    { value: "large", labelKey: "settings.display.fontSize.options.large" },
  ] as const;

  return (
    <div class={`settings-form ${props.class || ""}`}>
      {/* Status message */}
      <Show when={state().status !== "idle"}>
        <div
          class={`
            mb-6 rounded-lg border p-4
            ${
              state().status === "saving"
                ? "border-blue-300 bg-blue-50 text-blue-800"
                : state().status === "saved"
                  ? "border-green-300 bg-green-50 text-green-800"
                  : "border-red-300 bg-red-50 text-red-800"
            }
          `}
          role="status"
          aria-live="polite"
        >
          <Show when={state().status === "saving"}>
            <div class="flex items-center gap-2">
              <div class="h-4 w-4 animate-spin rounded-full border-2 border-blue-800 border-t-transparent" />
              <span>{t()("settings.display.autoSave")}</span>
            </div>
          </Show>
          <Show when={state().status === "saved"}>
            <div class="flex items-center gap-2">
              <svg class="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fill-rule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clip-rule="evenodd"
                />
              </svg>
              <span>{t()("settings.display.saved")}</span>
            </div>
          </Show>
          <Show when={state().status === "error"}>
            <div class="flex items-center gap-2">
              <svg class="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fill-rule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                  clip-rule="evenodd"
                />
              </svg>
              <span>
                {(state() as { status: "error"; message: string }).message}
              </span>
            </div>
          </Show>
        </div>
      </Show>

      {/* Grade Level Section */}
      <section class="mb-8">
        <h3 class="mb-2 text-lg font-semibold text-gray-900">
          {t()("settings.sections.gradeLevel.title")}
        </h3>
        <p class="mb-4 text-sm text-gray-600">
          {t()("settings.sections.gradeLevel.description")}
        </p>

        <fieldset class="space-y-3">
          <legend class="sr-only">{t()("settings.gradeLevel.label")}</legend>
          <For each={gradeOptions}>
            {(option) => (
              <label
                class={`
                  flex cursor-pointer items-start gap-3 rounded-lg border-2 p-4
                  transition-all duration-200
                  ${
                    gradeRange() === option.value
                      ? "border-blue-500 bg-blue-50"
                      : "border-gray-200 bg-white hover:border-blue-300"
                  }
                `}
              >
                <input
                  type="radio"
                  name="gradeRange"
                  value={option.value}
                  checked={gradeRange() === option.value}
                  onChange={() => {
                    setGradeRange(option.value);
                    debouncedSave();
                  }}
                  class="mt-1 h-5 w-5 cursor-pointer text-blue-600 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                />
                <div class="flex-1">
                  <div class="font-medium text-gray-900">
                    {t()(option.labelKey)}
                  </div>
                  <div class="text-sm text-gray-600">{t()(option.descKey)}</div>
                </div>
              </label>
            )}
          </For>
        </fieldset>
      </section>

      {/* Display Preferences Section */}
      <section class="mb-8">
        <h3 class="mb-2 text-lg font-semibold text-gray-900">
          {t()("settings.sections.display.title")}
        </h3>
        <p class="mb-4 text-sm text-gray-600">
          {t()("settings.sections.display.description")}
        </p>

        <div class="space-y-6">
          {/* Theme Selection */}
          <div>
            <label class="mb-2 block text-sm font-medium text-gray-700">
              {t()("settings.display.theme.label")}
            </label>
            <p class="mb-3 text-sm text-gray-600">
              {t()("settings.display.theme.description")}
            </p>
            <div class="grid grid-cols-3 gap-3">
              <For each={themeOptions}>
                {(option) => (
                  <button
                    type="button"
                    onClick={() => {
                      updatePreferences({ theme: option.value });
                      debouncedSave();
                    }}
                    class={`
                      rounded-lg border-2 px-4 py-3 text-sm font-medium
                      transition-all duration-200
                      focus:outline-none focus:ring-4 focus:ring-blue-300
                      touch-target
                      ${
                        preferences().theme === option.value
                          ? "border-blue-500 bg-blue-50 text-blue-700"
                          : "border-gray-200 bg-white text-gray-700 hover:border-blue-300"
                      }
                    `}
                    aria-pressed={preferences().theme === option.value}
                  >
                    {t()(option.labelKey)}
                  </button>
                )}
              </For>
            </div>
          </div>

          {/* Font Size Selection */}
          <div>
            <label class="mb-2 block text-sm font-medium text-gray-700">
              {t()("settings.display.fontSize.label")}
            </label>
            <p class="mb-3 text-sm text-gray-600">
              {t()("settings.display.fontSize.description")}
            </p>
            <div class="grid grid-cols-3 gap-3">
              <For each={fontSizeOptions}>
                {(option) => (
                  <button
                    type="button"
                    onClick={() => {
                      updatePreferences({ fontSize: option.value });
                      debouncedSave();
                    }}
                    class={`
                      rounded-lg border-2 px-4 py-3 text-sm font-medium
                      transition-all duration-200
                      focus:outline-none focus:ring-4 focus:ring-blue-300
                      touch-target
                      ${
                        preferences().fontSize === option.value
                          ? "border-blue-500 bg-blue-50 text-blue-700"
                          : "border-gray-200 bg-white text-gray-700 hover:border-blue-300"
                      }
                    `}
                    aria-pressed={preferences().fontSize === option.value}
                  >
                    {t()(option.labelKey)}
                  </button>
                )}
              </For>
            </div>
          </div>

          {/* Dyslexia Font Toggle */}
          <div class="flex items-start gap-4 rounded-lg border border-gray-200 p-4">
            <input
              type="checkbox"
              id="dyslexia-font"
              checked={preferences().dyslexiaFont}
              onChange={(e) => {
                updatePreferences({ dyslexiaFont: e.currentTarget.checked });
                debouncedSave();
              }}
              class="mt-1 h-5 w-5 cursor-pointer rounded border-gray-300 text-blue-600 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            />
            <div class="flex-1">
              <label
                for="dyslexia-font"
                class="block cursor-pointer font-medium text-gray-900"
              >
                {t()("settings.display.dyslexiaFont.label")}
              </label>
              <p class="mt-1 text-sm text-gray-600">
                {t()("settings.display.dyslexiaFont.description")}
              </p>
            </div>
          </div>

          {/* High Contrast Toggle */}
          <div class="flex items-start gap-4 rounded-lg border border-gray-200 p-4">
            <input
              type="checkbox"
              id="high-contrast"
              checked={preferences().highContrast}
              onChange={(e) => {
                updatePreferences({ highContrast: e.currentTarget.checked });
                debouncedSave();
              }}
              class="mt-1 h-5 w-5 cursor-pointer rounded border-gray-300 text-blue-600 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            />
            <div class="flex-1">
              <label
                for="high-contrast"
                class="block cursor-pointer font-medium text-gray-900"
              >
                {t()("settings.display.highContrast.label")}
              </label>
              <p class="mt-1 text-sm text-gray-600">
                {t()("settings.display.highContrast.description")}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Unsaved changes indicator */}
      <Show when={hasUnsavedChanges()}>
        <div class="text-sm text-gray-600" role="status" aria-live="polite">
          {t()("settings.display.autoSave")}
        </div>
      </Show>
    </div>
  );
}
