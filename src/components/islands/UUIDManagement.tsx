/**
 * UUIDManagement Component
 *
 * SolidJS island component for managing UUID and account. Features UUID display
 * with show/hide toggle, copy to clipboard, export as file, QR code display,
 * and account deletion with confirmation modal.
 *
 * Requirements:
 * - 1.3: Provide copy, download, and QR code export options
 * - 7.5: User-initiated data deletion (delete account functionality)
 * - 9.1: WCAG 2.1 AA accessibility
 */

import { createSignal, createEffect, Show, onMount } from 'solid-js'
import { useStore } from '@nanostores/solid'
import { $t } from '@/lib/i18n'
import { formatUUID } from '@/lib/auth/uuid'
import { deleteUser } from '@/lib/auth'
import { createFocusTrap } from '@/lib/accessibility'
import QRCode from 'qrcode'

export interface UUIDManagementProps {
  /** User's UUID */
  uuid: string
  /** Optional CSS class */
  class?: string
}

// Discriminated union for component state
type ComponentState =
  | { status: 'idle' }
  | { status: 'loading-qr' }
  | { status: 'deleting' }
  | { status: 'error'; message: string }

/**
 * UUIDManagement - Display and manage user UUID and account
 *
 * Features:
 * - Masked UUID display with show/hide toggle
 * - Copy to clipboard with visual feedback
 * - Export UUID as text file
 * - QR code generation and display
 * - Account deletion with confirmation modal
 * - Full keyboard navigation and ARIA support
 *
 * @example
 * ```tsx
 * <UUIDManagement uuid={user.id} />
 * ```
 */
export default function UUIDManagement(props: UUIDManagementProps) {
  const t = useStore($t)

  const [state, setState] = createSignal<ComponentState>({ status: 'idle' })
  const [showUUID, setShowUUID] = createSignal(false)
  const [copied, setCopied] = createSignal(false)
  const [showQR, setShowQR] = createSignal(false)
  const [qrCodeDataUrl, setQrCodeDataUrl] = createSignal<string | null>(null)
  const [showDeleteModal, setShowDeleteModal] = createSignal(false)

  // Modal ref and focus trap
  let modalRef: HTMLDivElement | undefined
  const focusTrap = createFocusTrap(
    () => modalRef,
    {
      preventScroll: true,
      allowEscape: true,
      onDeactivate: () => setShowDeleteModal(false),
    }
  )

  // Activate/deactivate focus trap based on modal visibility
  createEffect(() => {
    if (showDeleteModal()) {
      focusTrap.activate()
    } else {
      focusTrap.deactivate()
    }
  })

  // Format the UUID for display
  const formattedUUID = () => formatUUID(props.uuid)
  
  // Masked UUID (shows asterisks)
  const maskedUUID = () => '****-****-****-****'

  /**
   * Copy UUID to clipboard
   */
  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(formattedUUID())
      setCopied(true)
      setTimeout(() => setCopied(false), 3000)
    } catch (error) {
      console.error('Failed to copy UUID:', error)
      setState({
        status: 'error',
        message: t()('settings.uuid.copyError'),
      })
      setTimeout(() => setState({ status: 'idle' }), 3000)
    }
  }

  /**
   * Export UUID as text file
   */
  const exportAsFile = () => {
    const content = `Your Practice Number: ${formattedUUID()}\n\nKeep this number safe. You need it to log in and access your progress.`
    const blob = new Blob([content], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `practice-number-${formattedUUID()}.txt`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  /**
   * Generate and show QR code
   */
  const toggleQRCode = async () => {
    if (showQR()) {
      setShowQR(false)
      return
    }

    // Generate QR code if not already generated
    if (!qrCodeDataUrl()) {
      setState({ status: 'loading-qr' })
      try {
        const dataUrl = await QRCode.toDataURL(formattedUUID(), {
          width: 256,
          margin: 2,
          color: {
            dark: '#000000',
            light: '#FFFFFF',
          },
        })
        setQrCodeDataUrl(dataUrl)
        setState({ status: 'idle' })
      } catch (error) {
        console.error('Failed to generate QR code:', error)
        setState({
          status: 'error',
          message: t()('settings.uuid.copyError'),
        })
        return
      }
    }

    setShowQR(true)
  }

  /**
   * Handle account deletion
   */
  const handleDeleteAccount = async () => {
    setState({ status: 'deleting' })

    try {
      const result = await deleteUser(props.uuid)

      if (!result.success) {
        setState({
          status: 'error',
          message: result.error || t()('settings.deleteAccount.error'),
        })
        setShowDeleteModal(false)
        return
      }

      // Account deleted successfully - redirect to home
      window.location.href = '/'
    } catch (error) {
      console.error('Error deleting account:', error)
      setState({
        status: 'error',
        message: t()('settings.deleteAccount.error'),
      })
      setShowDeleteModal(false)
    }
  }

  return (
    <div class={`uuid-management ${props.class || ''}`}>
      {/* Error message */}
      <Show when={state().status === 'error'}>
        <div
          class="mb-4 rounded-lg border border-red-300 bg-red-50 p-4 text-red-800"
          role="alert"
        >
          {(state() as { status: 'error'; message: string }).message}
        </div>
      </Show>

      {/* UUID Display Section */}
      <section class="mb-8 rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
        <h3 class="mb-2 text-lg font-semibold text-gray-900">
          {t()('settings.uuid.title')}
        </h3>
        <p class="mb-4 text-sm text-gray-600">
          {t()('settings.uuid.description')}
        </p>

        {/* Warning box */}
        <div class="mb-4 rounded-lg border border-amber-300 bg-amber-50 p-4">
          <div class="flex items-start gap-3">
            <svg
              class="mt-0.5 h-5 w-5 flex-shrink-0 text-amber-600"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fill-rule="evenodd"
                d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                clip-rule="evenodd"
              />
            </svg>
            <div>
              <p class="font-medium text-amber-900">
                {t()('settings.uuid.warning.title')}
              </p>
              <p class="mt-1 text-sm text-amber-800">
                {t()('settings.uuid.warning.message')}
              </p>
            </div>
          </div>
        </div>

        {/* UUID display with show/hide */}
        <div class="mb-4">
          <label class="mb-2 block text-sm font-medium text-gray-700">
            {t()('settings.uuid.label')}
          </label>
          <div class="flex items-center gap-3">
            <div
              class="flex-1 rounded-lg border border-gray-300 bg-gray-50 px-4 py-3 font-mono text-lg tracking-wider"
              aria-live="polite"
            >
              {showUUID() ? formattedUUID() : maskedUUID()}
            </div>
            <button
              type="button"
              onClick={() => setShowUUID(!showUUID())}
              class="rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 focus:outline-none focus:ring-4 focus:ring-blue-300"
              aria-label={showUUID() ? t()('settings.uuid.hide') : t()('settings.uuid.show')}
            >
              {showUUID() ? t()('settings.uuid.hide') : t()('settings.uuid.show')}
            </button>
          </div>
        </div>

        {/* Action buttons */}
        <div class="flex flex-wrap gap-3">
          {/* Copy button */}
          <button
            type="button"
            onClick={copyToClipboard}
            class="flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 focus:outline-none focus:ring-4 focus:ring-blue-300"
            aria-label={t()('settings.uuid.copy')}
          >
            <Show
              when={copied()}
              fallback={
                <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                  />
                </svg>
              }
            >
              <svg class="h-5 w-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fill-rule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clip-rule="evenodd"
                />
              </svg>
            </Show>
            <span>{copied() ? t()('settings.uuid.copied') : t()('settings.uuid.copy')}</span>
          </button>

          {/* Export button */}
          <button
            type="button"
            onClick={exportAsFile}
            class="flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 focus:outline-none focus:ring-4 focus:ring-blue-300"
            aria-label={t()('settings.uuid.export')}
          >
            <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            <span>{t()('settings.uuid.export')}</span>
          </button>

          {/* QR code button */}
          <button
            type="button"
            onClick={toggleQRCode}
            class="flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 focus:outline-none focus:ring-4 focus:ring-blue-300"
            aria-label={showQR() ? t()('settings.uuid.hideQR') : t()('settings.uuid.showQR')}
            aria-expanded={showQR()}
            disabled={state().status === 'loading-qr'}
          >
            <Show
              when={state().status !== 'loading-qr'}
              fallback={
                <div class="h-5 w-5 animate-spin rounded-full border-2 border-gray-700 border-t-transparent" />
              }
            >
              <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z"
                />
              </svg>
            </Show>
            <span>{showQR() ? t()('settings.uuid.hideQR') : t()('settings.uuid.showQR')}</span>
          </button>
        </div>

        {/* QR Code Display */}
        <Show when={showQR() && qrCodeDataUrl()}>
          <div class="mt-4 rounded-lg border border-gray-200 bg-gray-50 p-6">
            <p class="mb-4 text-center text-sm text-gray-600">
              {t()('settings.uuid.qrDescription')}
            </p>
            <div class="flex justify-center">
              <img
                src={qrCodeDataUrl()!}
                alt={`QR code for practice number ${formattedUUID()}`}
                class="rounded-lg border-4 border-white shadow-lg"
                width="256"
                height="256"
              />
            </div>
          </div>
        </Show>
      </section>

      {/* Danger Zone Section */}
      <section class="rounded-lg border-2 border-red-200 bg-red-50 p-6">
        <h3 class="mb-2 text-lg font-semibold text-red-900">
          {t()('settings.sections.dangerZone.title')}
        </h3>
        <p class="mb-4 text-sm text-red-800">
          {t()('settings.sections.dangerZone.description')}
        </p>

        <div class="rounded-lg border border-red-300 bg-white p-4">
          <h4 class="mb-2 font-semibold text-gray-900">
            {t()('settings.deleteAccount.title')}
          </h4>
          <p class="mb-4 text-sm text-gray-600">
            {t()('settings.deleteAccount.description')}
          </p>
          <button
            type="button"
            onClick={() => setShowDeleteModal(true)}
            class="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-red-700 focus:outline-none focus:ring-4 focus:ring-red-300"
          >
            {t()('settings.deleteAccount.button')}
          </button>
        </div>
      </section>

      {/* Delete Confirmation Modal */}
      <Show when={showDeleteModal()}>
        <div
          class="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4"
          role="dialog"
          aria-labelledby="delete-modal-title"
          aria-describedby="delete-modal-description"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowDeleteModal(false)
            }
          }}
        >
          <div ref={modalRef} class="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
            <h3
              id="delete-modal-title"
              class="mb-4 text-xl font-bold text-gray-900"
            >
              {t()('settings.deleteAccount.confirm.title')}
            </h3>
            <p
              id="delete-modal-description"
              class="mb-4 text-gray-700"
            >
              {t()('settings.deleteAccount.confirm.message')}
            </p>

            <div class="mb-6 rounded-lg border border-red-200 bg-red-50 p-4">
              <p class="mb-2 font-semibold text-red-900">
                {t()('settings.deleteAccount.confirm.warning')}
              </p>
              <ul class="list-inside list-disc space-y-1 text-sm text-red-800">
                <li>{t()('settings.deleteAccount.confirm.items.0')}</li>
                <li>{t()('settings.deleteAccount.confirm.items.1')}</li>
                <li>{t()('settings.deleteAccount.confirm.items.2')}</li>
                <li>{t()('settings.deleteAccount.confirm.items.3')}</li>
              </ul>
            </div>

            <div class="flex gap-3">
              <button
                type="button"
                onClick={() => setShowDeleteModal(false)}
                disabled={state().status === 'deleting'}
                class="flex-1 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 focus:outline-none focus:ring-4 focus:ring-gray-300 disabled:opacity-50"
              >
                {t()('settings.deleteAccount.confirm.cancelButton')}
              </button>
              <button
                type="button"
                onClick={handleDeleteAccount}
                disabled={state().status === 'deleting'}
                class="flex flex-1 items-center justify-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-red-700 focus:outline-none focus:ring-4 focus:ring-red-300 disabled:opacity-50"
              >
                <Show when={state().status === 'deleting'}>
                  <div class="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                </Show>
                <span>
                  {state().status === 'deleting'
                    ? t()('settings.deleteAccount.deleting')
                    : t()('settings.deleteAccount.confirm.confirmButton')}
                </span>
              </button>
            </div>
          </div>
        </div>
      </Show>
    </div>
  )
}

