/**
 * LanguageSelector Component
 *
 * SolidJS island component for switching between supported languages (Danish and English).
 * Provides instant language switching without page reload and persists preference to Supabase.
 *
 * Requirements:
 * - 2.3: Language selector accessible from all pages with immediate switching without reload
 * - 2.4: Store language preference in Supabase user record and synchronize across devices
 */

import { createSignal, Show, onMount } from 'solid-js';
import { useStore } from '@nanostores/solid';
import { $t, $locale, changeLocale, type Locale } from '@/lib/i18n';
import { getCurrentUser, updateUser } from '@/lib/auth';

export interface LanguageSelectorProps {
  /** Display variant: 'compact' shows flags only, 'full' shows flags with labels */
  variant?: 'compact' | 'full';
  /** Layout direction */
  layout?: 'horizontal' | 'vertical';
  /** Optional CSS class for styling */
  class?: string;
}

/**
 * LanguageSelector - Allows instant switching between supported languages
 *
 * Features:
 * - Instant language switching without page reload
 * - Visual feedback for current language
 * - Persistence to Supabase for authenticated users
 * - Falls back to localStorage for non-authenticated users
 * - Keyboard accessible with ARIA support
 * - Flag icons for visual language identification
 *
 * @example
 * ```tsx
 * <LanguageSelector variant="full" layout="horizontal" />
 * ```
 */
export default function LanguageSelector(props: LanguageSelectorProps) {
  const t = useStore($t);
  const locale = useStore($locale);
  const [isChanging, setIsChanging] = createSignal(false);
  const [error, setError] = createSignal<string | null>(null);

  const variant = () => props.variant || 'full';
  const layout = () => props.layout || 'horizontal';

  /**
   * Handles language change
   * Changes locale immediately in UI, then persists to Supabase if user is authenticated
   */
  const handleLanguageChange = async (newLocale: Locale) => {
    if (locale() === newLocale) {
      return; // Already selected
    }

    setIsChanging(true);
    setError(null);

    try {
      // Change locale immediately for instant UI update
      await changeLocale(newLocale);

      // Persist to Supabase if user is authenticated
      try {
        const user = await getCurrentUser();
        if (user) {
          const result = await updateUser(user.id, { locale: newLocale });
          if (!result.success) {
            console.warn('Failed to persist language preference to Supabase:', result.error);
            // Don't show error to user - locale change still succeeded in UI
          }
        }
      } catch (persistError) {
        // Log but don't fail - the language has already changed in the UI
        console.warn('Error persisting language preference:', persistError);
      }
    } catch (changeError) {
      console.error('Error changing language:', changeError);
      setError('Failed to change language');
    } finally {
      setIsChanging(false);
    }
  };

  const isActive = (targetLocale: Locale) => locale() === targetLocale;

  const baseButtonClass = () => {
    const common =
      'flex items-center gap-2 p-3 rounded-lg transition-all duration-200 focus:outline-none focus:ring-4 focus:ring-blue-300 min-w-44px min-h-44px disabled:opacity-50 disabled:cursor-not-allowed';

    if (variant() === 'compact') {
      return `${common} justify-center`;
    }
    return common;
  };

  const buttonClass = (targetLocale: Locale) => {
    const base = baseButtonClass();
    const active = isActive(targetLocale);

    if (active) {
      return `${base} bg-blue-600 text-white shadow-md hover:bg-blue-700 active:bg-blue-800`;
    }
    return `${base} bg-white text-gray-700 border-2 border-gray-300 hover:border-blue-400 hover:bg-blue-50 active:bg-blue-100`;
  };

  const containerClass = () => {
    const base = 'language-selector';
    const layoutClass = layout() === 'horizontal' ? 'flex flex-row gap-2' : 'flex flex-col gap-2';
    return `${base} ${layoutClass} ${props.class || ''}`;
  };

  return (
    <div
      class={containerClass()}
      role="group"
      aria-label={t()('common.language.selector.title')}
    >
      {/* Danish Button */}
      <button
        type="button"
        onClick={() => handleLanguageChange('da-DK')}
        disabled={isChanging()}
        class={buttonClass('da-DK')}
        aria-label={t()('common.language.selector.danish')}
        aria-pressed={isActive('da-DK')}
        title={t()('common.language.selector.danish')}
      >
        {/* Danish Flag SVG */}
        <svg
          class="w-6 h-6 flex-shrink-0"
          viewBox="0 0 37 28"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
        >
          {/* Red background */}
          <rect width="37" height="28" fill="#C8102E" />
          {/* White cross */}
          <rect x="12" width="4" height="28" fill="white" />
          <rect y="12" width="37" height="4" fill="white" />
        </svg>

        <Show when={variant() === 'full'}>
          <span class="font-medium">{t()('common.language.selector.danish')}</span>
        </Show>

        {/* Active indicator for compact mode */}
        <Show when={variant() === 'compact' && isActive('da-DK')}>
          <span class="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white" aria-hidden="true"></span>
        </Show>
      </button>

      {/* English Button */}
      <button
        type="button"
        onClick={() => handleLanguageChange('en-US')}
        disabled={isChanging()}
        class={buttonClass('en-US')}
        aria-label={t()('common.language.selector.english')}
        aria-pressed={isActive('en-US')}
        title={t()('common.language.selector.english')}
      >
        {/* US Flag SVG (simplified) */}
        <svg
          class="w-6 h-6 flex-shrink-0"
          viewBox="0 0 37 28"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
        >
          {/* Red stripes */}
          <rect width="37" height="28" fill="#B22234" />
          <rect y="4" width="37" height="2" fill="white" />
          <rect y="8" width="37" height="2" fill="white" />
          <rect y="12" width="37" height="2" fill="white" />
          <rect y="16" width="37" height="2" fill="white" />
          <rect y="20" width="37" height="2" fill="white" />
          <rect y="24" width="37" height="2" fill="white" />
          {/* Blue canton */}
          <rect width="15" height="12" fill="#3C3B6E" />
        </svg>

        <Show when={variant() === 'full'}>
          <span class="font-medium">{t()('common.language.selector.english')}</span>
        </Show>

        {/* Active indicator for compact mode */}
        <Show when={variant() === 'compact' && isActive('en-US')}>
          <span class="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white" aria-hidden="true"></span>
        </Show>
      </button>

      {/* Loading indicator */}
      <Show when={isChanging()}>
        <div
          class="flex items-center text-sm text-gray-600"
          role="status"
          aria-live="polite"
        >
          <svg
            class="w-4 h-4 mr-2 animate-spin"
            fill="none"
            viewBox="0 0 24 24"
            aria-hidden="true"
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
          <span>{t()('common.language.selector.changingLanguage')}</span>
        </div>
      </Show>

      {/* Error message */}
      <Show when={error()}>
        <div
          class="text-sm text-red-600 px-2"
          role="alert"
          aria-live="assertive"
        >
          {error()}
        </div>
      </Show>
    </div>
  );
}

