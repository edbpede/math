/**
 * UUIDLogin Component
 *
 * SolidJS island component for UUID-based login with anonymous authentication.
 * Features real-time formatting, validation, "remember device", and rate limiting.
 *
 * Requirements:
 * - 1.4: UUID entry for returning users with validation
 * - 15.3: Cross-device "Remember this device" option
 * - 7.4: Rate limiting display (5 attempts per minute)
 */

import { createSignal, Show, onMount } from 'solid-js';
import { useStore } from '@nanostores/solid';
import { $t } from '@/lib/i18n';
import { validateUUID, formatUUID } from '@/lib/auth/uuid';

// LocalStorage key for remembered UUIDs
const REMEMBER_UUID_KEY = 'math-remember-uuid';

// Rate limiting configuration
const MAX_ATTEMPTS = 5;
const RATE_LIMIT_WINDOW_MS = 60000; // 1 minute

// Discriminated union for component state
type LoginState =
  | { status: 'idle' }
  | { status: 'validating' }
  | { status: 'submitting' }
  | { status: 'error'; message: string; code: string }
  | { status: 'rateLimited'; remainingSeconds: number; attemptsRemaining: number };

// API response types
interface SignInSuccessResponse {
  success: true;
  user: {
    id: string;
    gradeRange: string;
    locale: string;
    createdAt: string;
    lastActiveAt: string;
  };
}

interface SignInErrorResponse {
  success: false;
  error: string;
  code: string;
}

type SignInResponse = SignInSuccessResponse | SignInErrorResponse;

export interface UUIDLoginProps {
  /** Redirect URL after successful login (defaults to /dashboard) */
  redirectTo?: string;
  /** Optional CSS class for styling */
  class?: string;
}

/**
 * UUIDLogin - Login form with UUID input, formatting, and validation
 *
 * Provides a secure login form for returning users with:
 * - Real-time UUID formatting as user types
 * - Client-side validation before submission
 * - "Remember this device" option with localStorage
 * - Rate limiting display with attempts counter
 * - Comprehensive error messaging
 * - Full keyboard navigation and screen reader support
 *
 * @example
 * ```tsx
 * <UUIDLogin
 *   redirectTo="/dashboard"
 *   class="max-w-md mx-auto"
 * />
 * ```
 */
export default function UUIDLogin(props: UUIDLoginProps) {
  const t = useStore($t);
  const [state, setState] = createSignal<LoginState>({ status: 'idle' });
  const [uuidInput, setUuidInput] = createSignal('');
  const [rememberDevice, setRememberDevice] = createSignal(false);
  const [validationError, setValidationError] = createSignal<string | null>(null);

  // Rate limiting tracking
  const [attemptCount, setAttemptCount] = createSignal(0);
  const [rateLimitResetTime, setRateLimitResetTime] = createSignal<number | null>(null);

  /**
   * Check localStorage for remembered UUID on mount
   */
  onMount(() => {
    try {
      const rememberedUUID = localStorage.getItem(REMEMBER_UUID_KEY);
      if (rememberedUUID && validateUUID(rememberedUUID)) {
        setUuidInput(rememberedUUID);
        setRememberDevice(true);
      }
    } catch (error) {
      console.error('Error reading from localStorage:', error);
    }
  });

  /**
   * Format UUID input in real-time as user types
   * Transforms input to XXXX-XXXX-XXXX-XXXX format automatically
   */
  const handleInputChange = (value: string) => {
    // Clear validation error when user starts typing
    setValidationError(null);

    // Remove all non-alphanumeric characters
    const cleaned = value.replace(/[^0-9a-fA-F]/g, '');

    // Limit to 16 characters (64 bits)
    const limited = cleaned.substring(0, 16);

    // Format with dashes: XXXX-XXXX-XXXX-XXXX
    let formatted = '';
    for (let i = 0; i < limited.length; i++) {
      if (i > 0 && i % 4 === 0) {
        formatted += '-';
      }
      formatted += limited[i];
    }

    setUuidInput(formatted);
  };

  /**
   * Handle input paste events
   * Strips existing formatting and reformats
   */
  const handlePaste = (event: ClipboardEvent) => {
    event.preventDefault();
    const pastedText = event.clipboardData?.getData('text') || '';
    handleInputChange(pastedText);
  };

  /**
   * Validate UUID format on blur
   */
  const handleBlur = () => {
    const uuid = uuidInput().trim();
    if (uuid && !validateUUID(uuid)) {
      setValidationError(t()('auth.login.invalidFormat'));
    }
  };

  /**
   * Track failed attempts for rate limiting
   */
  const recordFailedAttempt = () => {
    const now = Date.now();
    const resetTime = rateLimitResetTime();

    // Reset counter if rate limit window has passed
    if (resetTime && now > resetTime) {
      setAttemptCount(1);
      setRateLimitResetTime(now + RATE_LIMIT_WINDOW_MS);
    } else {
      const newCount = attemptCount() + 1;
      setAttemptCount(newCount);

      if (!resetTime) {
        setRateLimitResetTime(now + RATE_LIMIT_WINDOW_MS);
      }

      // Check if rate limit exceeded
      if (newCount >= MAX_ATTEMPTS) {
        const remainingMs = (rateLimitResetTime() || now) - now;
        const remainingSeconds = Math.ceil(remainingMs / 1000);
        setState({
          status: 'rateLimited',
          remainingSeconds,
          attemptsRemaining: 0,
        });

        // Start countdown timer
        startRateLimitCountdown();
      }
    }
  };

  /**
   * Start countdown timer for rate limit
   */
  const startRateLimitCountdown = () => {
    const interval = setInterval(() => {
      const now = Date.now();
      const resetTime = rateLimitResetTime();

      if (!resetTime || now > resetTime) {
        // Rate limit expired, reset state
        setAttemptCount(0);
        setRateLimitResetTime(null);
        setState({ status: 'idle' });
        clearInterval(interval);
      } else {
        // Update remaining seconds
        const remainingMs = resetTime - now;
        const remainingSeconds = Math.ceil(remainingMs / 1000);
        setState({
          status: 'rateLimited',
          remainingSeconds,
          attemptsRemaining: 0,
        });
      }
    }, 1000);
  };

  /**
   * Handle form submission
   */
  const handleSubmit = async (event: Event) => {
    event.preventDefault();

    // Don't submit if rate limited
    const currentState = state();
    if (currentState.status === 'rateLimited') {
      return;
    }

    const uuid = uuidInput().trim();

    // Validate UUID format
    if (!uuid) {
      setValidationError(t()('auth.login.invalidFormat'));
      return;
    }

    if (!validateUUID(uuid)) {
      setValidationError(t()('auth.login.invalidFormat'));
      return;
    }

    // Clear validation error
    setValidationError(null);
    setState({ status: 'submitting' });

    try {
      const response = await fetch('/api/auth/signin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ uuid }),
      });

      const data: SignInResponse = await response.json();

      if (!data.success) {
        // Record failed attempt for rate limiting
        recordFailedAttempt();

        // Map error codes to user-friendly messages
        let errorMessage = data.error;
        if (data.code === 'INVALID_UUID_FORMAT') {
          errorMessage = t()('auth.login.invalidFormat');
        } else if (data.code === 'UUID_NOT_FOUND') {
          errorMessage = t()('auth.login.notFound');
        }

        setState({
          status: 'error',
          message: errorMessage,
          code: data.code,
        });
        return;
      }

      // Success! Handle "remember device" option
      if (rememberDevice()) {
        try {
          localStorage.setItem(REMEMBER_UUID_KEY, uuid);
        } catch (error) {
          console.error('Error saving to localStorage:', error);
        }
      } else {
        // Clear remembered UUID if checkbox is unchecked
        try {
          localStorage.removeItem(REMEMBER_UUID_KEY);
        } catch (error) {
          console.error('Error removing from localStorage:', error);
        }
      }

      // Redirect to specified page or dashboard
      const redirectUrl = props.redirectTo || '/dashboard';
      window.location.href = redirectUrl;
    } catch (error) {
      console.error('Error during login:', error);
      setState({
        status: 'error',
        message: t()('common.errors.unexpected'),
        code: 'UNEXPECTED_ERROR',
      });
    }
  };

  /**
   * Get attempts remaining for display
   */
  const getAttemptsRemaining = () => {
    const resetTime = rateLimitResetTime();
    if (!resetTime || Date.now() > resetTime) {
      return MAX_ATTEMPTS;
    }
    return Math.max(0, MAX_ATTEMPTS - attemptCount());
  };

  /**
   * Check if submit button should be disabled
   */
  const isSubmitDisabled = () => {
    const currentState = state();
    return (
      currentState.status === 'submitting' ||
      currentState.status === 'rateLimited' ||
      !uuidInput().trim()
    );
  };

  return (
    <div
      class={`uuid-login ${props.class || ''}`}
      role="region"
      aria-label={t()('auth.login.title')}
    >
      <div class="login-container max-w-md mx-auto">
        {/* Header */}
        <div class="text-center mb-6">
          <h2 class="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
            {t()('auth.login.title')}
          </h2>
          <p class="text-base text-gray-600">
            {t()('auth.login.subtitle')}
          </p>
        </div>

        {/* Login Form */}
        <form onSubmit={handleSubmit} novalidate>
          {/* UUID Input Field */}
          <div class="form-group mb-4">
            <label
              for="uuid-input"
              class="block text-sm font-medium text-gray-700 mb-2"
            >
              {t()('auth.uuid.title')}
            </label>
            <input
              type="text"
              id="uuid-input"
              value={uuidInput()}
              onInput={(e) => handleInputChange(e.currentTarget.value)}
              onPaste={handlePaste}
              onBlur={handleBlur}
              placeholder={t()('auth.login.placeholder')}
              aria-label={t()('auth.uuid.title')}
              aria-invalid={!!validationError()}
              aria-describedby={validationError() ? 'uuid-error' : undefined}
              autocomplete="off"
              autocorrect="off"
              autocapitalize="off"
              spellcheck={false}
              maxlength="19"
              disabled={state().status === 'submitting' || state().status === 'rateLimited'}
              class={`
                w-full px-4 py-3 text-lg font-mono tracking-wider text-center
                border-2 rounded-lg shadow-sm
                focus:outline-none focus:ring-4 focus:ring-blue-300
                transition-all duration-200
                min-h-44px
                ${validationError() || state().status === 'error'
                  ? 'border-red-400 bg-red-50 text-red-900'
                  : 'border-gray-300 bg-white text-gray-900 hover:border-blue-400'
                }
                ${state().status === 'submitting' || state().status === 'rateLimited'
                  ? 'opacity-60 cursor-not-allowed'
                  : ''
                }
              `}
            />

            {/* Validation Error */}
            <Show when={validationError()}>
              <div
                id="uuid-error"
                class="mt-2 text-sm text-red-700"
                role="alert"
                aria-live="polite"
              >
                {validationError()}
              </div>
            </Show>
          </div>

          {/* Remember Device Checkbox */}
          <div class="form-group mb-6">
            <label class="flex items-center gap-3 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={rememberDevice()}
                onChange={(e) => setRememberDevice(e.currentTarget.checked)}
                disabled={state().status === 'submitting' || state().status === 'rateLimited'}
                aria-label={t()('auth.login.rememberDevice')}
                class="w-5 h-5 min-w-44px min-h-44px text-blue-600 border-2 border-gray-300 rounded focus:ring-4 focus:ring-blue-300 cursor-pointer"
              />
              <span class="text-sm font-medium text-gray-700">
                {t()('auth.login.rememberDevice')}
              </span>
            </label>
          </div>

          {/* Error Message Display */}
          <Show when={state().status === 'error'}>
            {(errorState) => (
              <div
                class="error-banner mb-4 p-4 bg-red-100 border-2 border-red-400 rounded-lg"
                role="alert"
                aria-live="assertive"
              >
                <div class="flex items-start gap-3">
                  <svg
                    class="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  <div class="flex-1">
                    <div class="text-sm font-medium text-red-900">
                      {errorState().message}
                    </div>
                    {/* Show attempts remaining if not at limit */}
                    <Show when={getAttemptsRemaining() > 0 && getAttemptsRemaining() < MAX_ATTEMPTS}>
                      <div class="mt-1 text-xs text-red-800">
                        {t()('auth.login.attemptsRemaining', { count: getAttemptsRemaining() })}
                      </div>
                    </Show>
                  </div>
                </div>
              </div>
            )}
          </Show>

          {/* Rate Limit Message */}
          <Show when={state().status === 'rateLimited'}>
            {(rateLimitState) => (
              <div
                class="rate-limit-banner mb-4 p-4 bg-orange-100 border-2 border-orange-400 rounded-lg"
                role="alert"
                aria-live="assertive"
              >
                <div class="flex items-start gap-3">
                  <svg
                    class="w-6 h-6 text-orange-600 flex-shrink-0 mt-0.5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  <div class="flex-1">
                    <div class="text-sm font-medium text-orange-900">
                      {t()('auth.login.rateLimitExceeded', {
                        seconds: rateLimitState().remainingSeconds,
                      })}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </Show>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isSubmitDisabled()}
            class={`
              w-full px-6 py-4 text-lg font-bold rounded-lg shadow-lg
              transition-all duration-200
              focus:outline-none focus:ring-4 focus:ring-blue-300
              min-h-44px
              ${isSubmitDisabled()
                ? 'bg-gray-400 text-gray-600 cursor-not-allowed opacity-60'
                : 'bg-blue-600 text-white hover:bg-blue-700 active:bg-blue-800'
              }
            `}
            aria-label={state().status === 'submitting'
              ? t()('common.status.loading')
              : t()('auth.login.submit')
            }
          >
            <Show
              when={state().status === 'submitting'}
              fallback={t()('auth.login.submit')}
            >
              <div class="flex items-center justify-center gap-3">
                <div
                  class="w-5 h-5 border-3 border-white border-t-transparent rounded-full animate-spin"
                  aria-hidden="true"
                />
                <span>{t()('common.status.loading')}</span>
              </div>
            </Show>
          </button>
        </form>

        {/* New User Link */}
        <div class="mt-6 text-center text-sm text-gray-600">
          <span>{t()('auth.login.newUser').split('{{link}}')[0]}</span>
          <a
            href="/generate"
            class="text-blue-600 hover:text-blue-700 font-medium underline focus:outline-none focus:ring-2 focus:ring-blue-300 rounded"
          >
            {t()('auth.login.newUserLink')}
          </a>
          <span>{t()('auth.login.newUser').split('{{link}}')[1] || ''}</span>
        </div>
      </div>
    </div>
  );
}
