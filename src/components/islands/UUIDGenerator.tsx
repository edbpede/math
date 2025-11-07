/**
 * UUIDGenerator Component
 *
 * SolidJS island component for generating and displaying UUIDs for anonymous authentication.
 * Provides multiple save options: copy to clipboard, download as text file, and QR code.
 *
 * Requirements:
 * - 1.2: Display UUID prominently with save instructions
 * - 1.3: Provide copy, download, and QR code export options
 * - 14.2: Generate UUID on "Start Practice" flow
 */

import { createSignal, Show, createEffect, onMount } from 'solid-js';
import { useStore } from '@nanostores/solid';
import { $t } from '@/lib/i18n';
import QRCode from 'qrcode';

// Discriminated union for component state
type GeneratorState =
  | { status: 'idle' }
  | { status: 'generating' }
  | { status: 'generated'; uuid: string; qrCodeDataUrl: string }
  | { status: 'error'; message: string };

export interface UUIDGeneratorProps {
  /** Grade range for the user account */
  gradeRange: '0-3' | '4-6' | '7-9';
  /** Locale for the user account */
  locale: 'da-DK' | 'en-US';
  /** Whether to auto-generate on mount */
  autoGenerate?: boolean;
  /** Callback when UUID is successfully generated */
  onComplete?: (uuid: string) => void;
  /** Optional CSS class for styling */
  class?: string;
}

/**
 * UUIDGenerator - Generates and displays UUID with multiple save options
 *
 * Creates a new anonymous user account and displays the UUID prominently
 * with copy, download, and QR code save options. Follows privacy-first
 * design principles with clear user instructions.
 *
 * @example
 * ```tsx
 * <UUIDGenerator
 *   gradeRange="0-3"
 *   locale="da-DK"
 *   autoGenerate={true}
 *   onComplete={(uuid) => console.log('Generated:', uuid)}
 * />
 * ```
 */
export default function UUIDGenerator(props: UUIDGeneratorProps) {
  const t = useStore($t);
  const [state, setState] = createSignal<GeneratorState>({ status: 'idle' });
  const [copied, setCopied] = createSignal(false);
  const [showQR, setShowQR] = createSignal(false);

  // Auto-generate on mount if requested
  onMount(() => {
    if (props.autoGenerate) {
      generateUUID();
    }
  });

  /**
   * Generates a new UUID by calling the API endpoint
   */
  const generateUUID = async () => {
    setState({ status: 'generating' });

    try {
      const response = await fetch('/api/auth/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          gradeRange: props.gradeRange,
          locale: props.locale,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        setState({
          status: 'error',
          message: data.error || 'Failed to generate UUID',
        });
        return;
      }

      // Generate QR code from UUID
      const qrCodeDataUrl = await QRCode.toDataURL(data.uuid, {
        width: 256,
        margin: 2,
        color: {
          dark: '#1a1a1a',
          light: '#ffffff',
        },
      });

      setState({
        status: 'generated',
        uuid: data.uuid,
        qrCodeDataUrl,
      });

      // Call onComplete callback if provided
      if (props.onComplete) {
        props.onComplete(data.uuid);
      }
    } catch (error) {
      console.error('Error generating UUID:', error);
      setState({
        status: 'error',
        message: 'An unexpected error occurred. Please try again.',
      });
    }
  };

  /**
   * Copies UUID to clipboard
   */
  const copyToClipboard = async () => {
    const currentState = state();
    if (currentState.status !== 'generated') return;

    try {
      // Modern Clipboard API
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(currentState.uuid);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
        return;
      }

      // Fallback for older browsers
      const textarea = document.createElement('textarea');
      textarea.value = currentState.uuid;
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.select();
      const success = document.execCommand('copy');
      document.body.removeChild(textarea);

      if (success) {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
    }
  };

  /**
   * Downloads UUID as a text file
   */
  const downloadAsFile = () => {
    const currentState = state();
    if (currentState.status !== 'generated') return;

    const content = `${t()('auth.uuid.yourNumber')}

${currentState.uuid}

${t()('auth.uuid.important')}

${t()('auth.uuid.description')}

---
Generated: ${new Date().toLocaleString(props.locale)}
Grade Range: ${props.gradeRange}
`;

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const date = new Date().toISOString().split('T')[0];
    link.href = url;
    link.download = `practice-number-${date}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div
      class={`uuid-generator ${props.class || ''}`}
      role="region"
      aria-label={t()('auth.uuid.title')}
    >
      {/* Idle State: Generate Button */}
      <Show when={state().status === 'idle'}>
        <div class="text-center py-8">
          <button
            type="button"
            onClick={generateUUID}
            class="px-8 py-4 bg-blue-600 text-white font-bold text-lg rounded-lg shadow-lg hover:bg-blue-700 active:bg-blue-800 transition-colors duration-200 focus:outline-none focus:ring-4 focus:ring-blue-300 min-w-44px min-h-44px"
            aria-label={t()('auth.uuid.generate')}
          >
            {t()('auth.uuid.generate')}
          </button>
        </div>
      </Show>

      {/* Generating State: Loading Spinner */}
      <Show when={state().status === 'generating'}>
        <div class="text-center py-12" role="status" aria-live="polite">
          <div class="inline-block w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" aria-hidden="true"></div>
          <div class="mt-4 text-gray-600 font-medium">
            {t()('common.status.loading')}
          </div>
        </div>
      </Show>

      {/* Generated State: UUID Display with Save Options */}
      <Show when={state().status === 'generated'}>
        {(generatedState) => (
          <div class="generated-container space-y-6">
            {/* Important Warning */}
            <div class="warning-banner p-4 bg-orange-100 border-2 border-orange-400 rounded-lg" role="alert">
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
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  />
                </svg>
                <div class="flex-1">
                  <div class="font-bold text-orange-900 mb-1">
                    {t()('auth.uuid.save.title')}
                  </div>
                  <div class="text-sm text-orange-800">
                    {t()('auth.uuid.important')}
                  </div>
                </div>
              </div>
            </div>

            {/* UUID Display */}
            <div class="uuid-display-container">
              <label class="block text-sm font-medium text-gray-700 mb-2">
                {t()('auth.uuid.yourNumber')}
              </label>
              <div class="uuid-display p-6 bg-gradient-to-r from-blue-50 to-blue-100 border-2 border-blue-300 rounded-lg shadow-md">
                <div
                  class="text-center text-3xl md:text-4xl font-mono font-bold text-blue-900 tracking-wider select-all"
                  aria-label={`${t()('auth.uuid.yourNumber')} ${generatedState().uuid}`}
                  tabindex="0"
                >
                  {generatedState().uuid}
                </div>
              </div>
            </div>

            {/* Save Options */}
            <div class="save-options">
              <div class="text-sm font-medium text-gray-700 mb-3">
                {t()('auth.uuid.save.instructions')}
              </div>
              <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* Copy to Clipboard */}
                <button
                  type="button"
                  onClick={copyToClipboard}
                  class="save-button flex flex-col items-center justify-center gap-2 p-4 bg-white border-2 border-gray-300 rounded-lg shadow hover:border-blue-400 hover:bg-blue-50 active:bg-blue-100 transition-all duration-200 focus:outline-none focus:ring-4 focus:ring-blue-300 min-h-44px"
                  aria-label={t()('auth.uuid.save.copy')}
                >
                  <Show
                    when={!copied()}
                    fallback={
                      <svg
                        class="w-6 h-6 text-green-600"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        aria-hidden="true"
                      >
                        <path
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          stroke-width="2"
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                    }
                  >
                    <svg
                      class="w-6 h-6 text-gray-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      aria-hidden="true"
                    >
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                      />
                    </svg>
                  </Show>
                  <span class="text-sm font-medium text-gray-900">
                    <Show when={copied()} fallback={t()('auth.uuid.save.copy')}>
                      {t()('auth.uuid.copied')}
                    </Show>
                  </span>
                </button>

                {/* Download as File */}
                <button
                  type="button"
                  onClick={downloadAsFile}
                  class="save-button flex flex-col items-center justify-center gap-2 p-4 bg-white border-2 border-gray-300 rounded-lg shadow hover:border-blue-400 hover:bg-blue-50 active:bg-blue-100 transition-all duration-200 focus:outline-none focus:ring-4 focus:ring-blue-300 min-h-44px"
                  aria-label={t()('auth.uuid.save.download')}
                >
                  <svg
                    class="w-6 h-6 text-gray-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                  <span class="text-sm font-medium text-gray-900">
                    {t()('auth.uuid.save.download')}
                  </span>
                </button>

                {/* Show QR Code */}
                <button
                  type="button"
                  onClick={() => setShowQR(!showQR())}
                  class="save-button flex flex-col items-center justify-center gap-2 p-4 bg-white border-2 border-gray-300 rounded-lg shadow hover:border-blue-400 hover:bg-blue-50 active:bg-blue-100 transition-all duration-200 focus:outline-none focus:ring-4 focus:ring-blue-300 min-h-44px"
                  aria-label={t()('auth.uuid.save.qrCode')}
                  aria-expanded={showQR()}
                >
                  <svg
                    class="w-6 h-6 text-gray-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z"
                    />
                  </svg>
                  <span class="text-sm font-medium text-gray-900">
                    {t()('auth.uuid.save.qrCode')}
                  </span>
                </button>
              </div>

              {/* Additional Option: Write Down */}
              <div class="mt-3 p-3 bg-gray-50 border border-gray-200 rounded-lg">
                <div class="flex items-center gap-2 text-sm text-gray-700">
                  <svg
                    class="w-5 h-5 text-gray-500 flex-shrink-0"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                    />
                  </svg>
                  <span>{t()('auth.uuid.save.writeDown')}</span>
                </div>
              </div>
            </div>

            {/* QR Code Display (Expandable) */}
            <Show when={showQR()}>
              <div
                class="qr-code-container p-6 bg-white border-2 border-blue-300 rounded-lg shadow-lg animate-fadeIn"
                role="dialog"
                aria-label={t()('auth.uuid.save.qrCode')}
              >
                <div class="flex flex-col items-center gap-4">
                  <div class="text-center">
                    <h3 class="text-lg font-bold text-gray-900 mb-2">
                      {t()('auth.uuid.save.qrCode')}
                    </h3>
                    <p class="text-sm text-gray-600">
                      Scan this QR code with your mobile device
                    </p>
                  </div>
                  <img
                    src={generatedState().qrCodeDataUrl}
                    alt={`QR code for practice number ${generatedState().uuid}`}
                    class="w-64 h-64 border-4 border-gray-200 rounded-lg shadow-md"
                    width="256"
                    height="256"
                  />
                  <button
                    type="button"
                    onClick={() => setShowQR(false)}
                    class="px-4 py-2 text-sm text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 active:bg-gray-300 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-gray-400"
                    aria-label="Close QR code"
                  >
                    Close
                  </button>
                </div>
              </div>
            </Show>
          </div>
        )}
      </Show>

      {/* Error State */}
      <Show when={state().status === 'error'}>
        {(errorState) => (
          <div class="error-container text-center py-8" role="alert" aria-live="assertive">
            <div class="mb-4 p-4 bg-red-100 border-2 border-red-400 rounded-lg inline-block">
              <div class="flex items-center gap-3">
                <svg
                  class="w-8 h-8 text-red-600"
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
                <div class="text-left">
                  <div class="font-bold text-red-900 mb-1">Error</div>
                  <div class="text-sm text-red-800">{errorState().message}</div>
                </div>
              </div>
            </div>
            <div>
              <button
                type="button"
                onClick={generateUUID}
                class="px-6 py-3 bg-blue-600 text-white font-medium rounded-lg shadow hover:bg-blue-700 active:bg-blue-800 transition-colors duration-200 focus:outline-none focus:ring-4 focus:ring-blue-300"
                aria-label="Try again"
              >
                Try Again
              </button>
            </div>
          </div>
        )}
      </Show>
    </div>
  );
}
