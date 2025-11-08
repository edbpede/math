/**
 * UUIDLogin Component Tests
 *
 * Tests for the UUIDLogin component to ensure correct login flow,
 * real-time formatting, validation, "remember device" functionality,
 * rate limiting, and accessibility.
 *
 * @vitest-environment happy-dom
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@solidjs/testing-library';
import UUIDLogin from './UUIDLogin';
import { $t, changeLocale, initI18n } from '@/lib/i18n';

describe('UUIDLogin', () => {

  beforeEach(async () => {
    // Initialize i18n system and ensure English locale for consistent tests
    await initI18n();
    await changeLocale('en-US');

    // Mock fetch API
    global.fetch = vi.fn();

    // Mock localStorage
    const localStorageMock = (() => {
      let store: Record<string, string> = {};
      return {
        getItem: vi.fn((key: string) => store[key] || null),
        setItem: vi.fn((key: string, value: string) => {
          store[key] = value;
        }),
        removeItem: vi.fn((key: string) => {
          delete store[key];
        }),
        clear: vi.fn(() => {
          store = {};
        }),
      };
    })();

    Object.defineProperty(window, 'localStorage', {
      value: localStorageMock,
      writable: true,
    });

    // Mock window.location.href
    delete (window as any).location;
    (window as any).location = { href: '' };
  });

  afterEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  describe('initial render', () => {
    it('should render login form with all required elements', () => {
      render(() => <UUIDLogin />);

      // Check for title and subtitle
      expect(screen.getByText(/log in with practice number/i)).toBeTruthy();
      expect(screen.getByText(/enter your practice number to continue/i)).toBeTruthy();

      // Check for UUID input field
      const input = screen.getByLabelText(/your practice number/i);
      expect(input).toBeTruthy();
      expect(input.getAttribute('type')).toBe('text');
      expect(input.getAttribute('maxlength')).toBe('19');

      // Check for remember device checkbox
      const checkbox = screen.getByLabelText(/remember this device/i);
      expect(checkbox).toBeTruthy();
      expect(checkbox.getAttribute('type')).toBe('checkbox');

      // Check for submit button
      const button = screen.getByRole('button', { name: /log in/i });
      expect(button).toBeTruthy();
    });

    it('should have proper ARIA labels and roles', () => {
      render(() => <UUIDLogin />);

      const region = screen.getByRole('region', { name: /log in with practice number/i });
      expect(region).toBeTruthy();

      const form = screen.getByRole('form');
      expect(form).toBeTruthy();
    });

    it('should load remembered UUID from localStorage on mount', () => {
      const rememberedUUID = '1234-5678-90ab-cdef';
      localStorage.setItem('math-remember-uuid', rememberedUUID);

      render(() => <UUIDLogin />);

      const input = screen.getByLabelText(/your practice number/i) as HTMLInputElement;
      expect(input.value).toBe(rememberedUUID);

      const checkbox = screen.getByLabelText(/remember this device/i) as HTMLInputElement;
      expect(checkbox.checked).toBe(true);
    });

    it('should not load invalid UUID from localStorage', () => {
      localStorage.setItem('math-remember-uuid', 'invalid-uuid');

      render(() => <UUIDLogin />);

      const input = screen.getByLabelText(/your practice number/i) as HTMLInputElement;
      expect(input.value).toBe('');
    });

    it('should have submit button disabled when input is empty', () => {
      render(() => <UUIDLogin />);

      const button = screen.getByRole('button', { name: /log in/i }) as HTMLButtonElement;
      expect(button.disabled).toBe(true);
    });
  });

  describe('real-time UUID formatting', () => {
    it('should format UUID as user types', () => {
      render(() => <UUIDLogin />);

      const input = screen.getByLabelText(/your practice number/i) as HTMLInputElement;

      // Type characters one by one
      fireEvent.input(input, { target: { value: '1' } });
      expect(input.value).toBe('1');

      fireEvent.input(input, { target: { value: '12' } });
      expect(input.value).toBe('12');

      fireEvent.input(input, { target: { value: '1234' } });
      expect(input.value).toBe('1234');

      // Should add dash after 4 characters
      fireEvent.input(input, { target: { value: '12345' } });
      expect(input.value).toBe('1234-5');

      fireEvent.input(input, { target: { value: '12345678' } });
      expect(input.value).toBe('1234-5678');

      // Should add second dash
      fireEvent.input(input, { target: { value: '123456789' } });
      expect(input.value).toBe('1234-5678-9');

      // Complete formatting
      fireEvent.input(input, { target: { value: '1234567890abcdef' } });
      expect(input.value).toBe('1234-5678-90ab-cdef');
    });

    it('should remove non-alphanumeric characters', () => {
      render(() => <UUIDLogin />);

      const input = screen.getByLabelText(/your practice number/i) as HTMLInputElement;

      fireEvent.input(input, { target: { value: '12!@#34$%^56' } });
      expect(input.value).toBe('1234-56');
    });

    it('should limit input to 16 characters (excluding dashes)', () => {
      render(() => <UUIDLogin />);

      const input = screen.getByLabelText(/your practice number/i) as HTMLInputElement;

      fireEvent.input(input, { target: { value: '1234567890abcdefEXTRA' } });
      expect(input.value).toBe('1234-5678-90ab-cdef');
    });

    it('should handle paste events with proper formatting', () => {
      render(() => <UUIDLogin />);

      const input = screen.getByLabelText(/your practice number/i);

      // Paste with existing formatting
      const pasteEvent = new ClipboardEvent('paste', {
        clipboardData: new DataTransfer(),
      });
      pasteEvent.clipboardData?.setData('text', '1234-5678-90ab-cdef');

      fireEvent(input, pasteEvent);

      expect((input as HTMLInputElement).value).toBe('1234-5678-90ab-cdef');
    });

    it('should handle paste of standard UUID format', () => {
      render(() => <UUIDLogin />);

      const input = screen.getByLabelText(/your practice number/i);

      const pasteEvent = new ClipboardEvent('paste', {
        clipboardData: new DataTransfer(),
      });
      pasteEvent.clipboardData?.setData('text', '12345678-90ab-cdef-1234-567890abcdef');

      fireEvent(input, pasteEvent);

      // Should extract first 16 characters and format
      expect((input as HTMLInputElement).value).toBe('1234-5678-90ab-cdef');
    });

    it('should clear validation error when user starts typing', () => {
      render(() => <UUIDLogin />);

      const input = screen.getByLabelText(/your practice number/i) as HTMLInputElement;

      // Enter invalid UUID and blur to trigger validation
      fireEvent.input(input, { target: { value: 'invalid' } });
      fireEvent.blur(input);

      // Should show validation error
      expect(screen.getByText(/invalid format/i)).toBeTruthy();

      // Start typing again
      fireEvent.input(input, { target: { value: '1234' } });

      // Error should be cleared
      expect(screen.queryByText(/invalid format/i)).toBeFalsy();
    });
  });

  describe('validation', () => {
    it('should validate UUID format on blur', () => {
      render(() => <UUIDLogin />);

      const input = screen.getByLabelText(/your practice number/i);

      // Enter invalid UUID
      fireEvent.input(input, { target: { value: 'invalid' } });
      fireEvent.blur(input);

      expect(screen.getByText(/invalid format/i)).toBeTruthy();
      expect(input.getAttribute('aria-invalid')).toBe('true');
    });

    it('should not show validation error for valid UUID on blur', () => {
      render(() => <UUIDLogin />);

      const input = screen.getByLabelText(/your practice number/i);

      fireEvent.input(input, { target: { value: '1234567890abcdef' } });
      fireEvent.blur(input);

      expect(screen.queryByText(/invalid format/i)).toBeFalsy();
    });

    it('should validate UUID before submission', async () => {
      render(() => <UUIDLogin />);

      const input = screen.getByLabelText(/your practice number/i);
      const form = screen.getByRole('form');

      fireEvent.input(input, { target: { value: 'invalid' } });
      fireEvent.submit(form);

      // Should show validation error without calling API
      expect(screen.getByText(/invalid format/i)).toBeTruthy();
      expect(global.fetch).not.toHaveBeenCalled();
    });
  });

  describe('remember device functionality', () => {
    it('should save UUID to localStorage when checkbox is checked', async () => {
      const mockUUID = '1234-5678-90ab-cdef';
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          user: {
            id: 'test-id',
            gradeRange: '0-3',
            locale: 'en-US',
            createdAt: new Date().toISOString(),
            lastActiveAt: new Date().toISOString(),
          },
        }),
      });

      render(() => <UUIDLogin />);

      const input = screen.getByLabelText(/your practice number/i);
      const checkbox = screen.getByLabelText(/remember this device/i);
      const form = screen.getByRole('form');

      fireEvent.input(input, { target: { value: mockUUID } });
      fireEvent.click(checkbox);
      fireEvent.submit(form);

      await waitFor(() => {
        expect(localStorage.setItem).toHaveBeenCalledWith('math-remember-uuid', mockUUID);
      });
    });

    it('should not save UUID when checkbox is unchecked', async () => {
      const mockUUID = '1234-5678-90ab-cdef';
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          user: { id: 'test-id', gradeRange: '0-3', locale: 'en-US' },
        }),
      });

      render(() => <UUIDLogin />);

      const input = screen.getByLabelText(/your practice number/i);
      const form = screen.getByRole('form');

      fireEvent.input(input, { target: { value: mockUUID } });
      fireEvent.submit(form);

      await waitFor(() => {
        expect(localStorage.setItem).not.toHaveBeenCalled();
      });
    });

    it('should remove UUID from localStorage when unchecked on login', async () => {
      localStorage.setItem('math-remember-uuid', '1234-5678-90ab-cdef');

      const mockUUID = '9999-8888-7777-6666';
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          user: { id: 'test-id', gradeRange: '0-3', locale: 'en-US' },
        }),
      });

      render(() => <UUIDLogin />);

      // Uncheck the checkbox
      const checkbox = screen.getByLabelText(/remember this device/i) as HTMLInputElement;
      fireEvent.click(checkbox);

      // Change UUID and submit
      const input = screen.getByLabelText(/your practice number/i);
      fireEvent.input(input, { target: { value: mockUUID } });

      const form = screen.getByRole('form');
      fireEvent.submit(form);

      await waitFor(() => {
        expect(localStorage.removeItem).toHaveBeenCalledWith('math-remember-uuid');
      });
    });
  });

  describe('API integration', () => {
    it('should call signin API with correct UUID', async () => {
      const mockUUID = '1234-5678-90ab-cdef';
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          user: { id: 'test-id', gradeRange: '0-3', locale: 'en-US' },
        }),
      });

      render(() => <UUIDLogin />);

      const input = screen.getByLabelText(/your practice number/i);
      const form = screen.getByRole('form');

      fireEvent.input(input, { target: { value: mockUUID } });
      fireEvent.submit(form);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          '/api/auth/signin',
          expect.objectContaining({
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ uuid: mockUUID }),
          })
        );
      });
    });

    it('should display loading state during submission', async () => {
      (global.fetch as any).mockImplementationOnce(
        () =>
          new Promise((resolve) =>
            setTimeout(
              () =>
                resolve({
                  ok: true,
                  json: async () => ({
                    success: true,
                    user: { id: 'test-id' },
                  }),
                }),
              100
            )
          )
      );

      render(() => <UUIDLogin />);

      const input = screen.getByLabelText(/your practice number/i);
      const form = screen.getByRole('form');

      fireEvent.input(input, { target: { value: '1234-5678-90ab-cdef' } });
      fireEvent.submit(form);

      await waitFor(() => {
        expect(screen.getByText(/loading/i)).toBeTruthy();
      });
    });

    it('should redirect to dashboard on successful login', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          user: { id: 'test-id', gradeRange: '0-3', locale: 'en-US' },
        }),
      });

      render(() => <UUIDLogin />);

      const input = screen.getByLabelText(/your practice number/i);
      const form = screen.getByRole('form');

      fireEvent.input(input, { target: { value: '1234-5678-90ab-cdef' } });
      fireEvent.submit(form);

      await waitFor(() => {
        expect(window.location.href).toBe('/dashboard');
      });
    });

    it('should redirect to custom URL when provided', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          user: { id: 'test-id' },
        }),
      });

      render(() => <UUIDLogin redirectTo="/practice" />);

      const input = screen.getByLabelText(/your practice number/i);
      const form = screen.getByRole('form');

      fireEvent.input(input, { target: { value: '1234-5678-90ab-cdef' } });
      fireEvent.submit(form);

      await waitFor(() => {
        expect(window.location.href).toBe('/practice');
      });
    });

    it('should display error message for UUID not found', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 404,
        json: async () => ({
          success: false,
          error: 'UUID not found',
          code: 'UUID_NOT_FOUND',
        }),
      });

      render(() => <UUIDLogin />);

      const input = screen.getByLabelText(/your practice number/i);
      const form = screen.getByRole('form');

      fireEvent.input(input, { target: { value: '1234-5678-90ab-cdef' } });
      fireEvent.submit(form);

      await waitFor(() => {
        expect(screen.getByText(/does not exist/i)).toBeTruthy();
      });
    });

    it('should display error message for invalid format from API', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => ({
          success: false,
          error: 'Invalid UUID format',
          code: 'INVALID_UUID_FORMAT',
        }),
      });

      render(() => <UUIDLogin />);

      const input = screen.getByLabelText(/your practice number/i);
      const form = screen.getByRole('form');

      fireEvent.input(input, { target: { value: '1234-5678-90ab-cdef' } });
      fireEvent.submit(form);

      await waitFor(() => {
        expect(screen.getByText(/invalid format/i)).toBeTruthy();
      });
    });

    it('should handle unexpected errors gracefully', async () => {
      (global.fetch as any).mockRejectedValueOnce(new Error('Network error'));

      render(() => <UUIDLogin />);

      const input = screen.getByLabelText(/your practice number/i);
      const form = screen.getByRole('form');

      fireEvent.input(input, { target: { value: '1234-5678-90ab-cdef' } });
      fireEvent.submit(form);

      await waitFor(() => {
        expect(screen.getByRole('alert')).toBeTruthy();
      });
    });
  });

  describe('rate limiting', () => {
    it('should track failed login attempts', async () => {
      (global.fetch as any).mockResolvedValue({
        ok: false,
        status: 404,
        json: async () => ({
          success: false,
          error: 'UUID not found',
          code: 'UUID_NOT_FOUND',
        }),
      });

      render(() => <UUIDLogin />);

      const input = screen.getByLabelText(/your practice number/i);
      const form = screen.getByRole('form');

      // First failed attempt
      fireEvent.input(input, { target: { value: '1234-5678-90ab-cdef' } });
      fireEvent.submit(form);

      await waitFor(() => {
        expect(screen.getByText(/4 attempts remaining/i)).toBeTruthy();
      });
    });

    it('should display rate limit message after max attempts', async () => {
      (global.fetch as any).mockResolvedValue({
        ok: false,
        status: 404,
        json: async () => ({
          success: false,
          error: 'UUID not found',
          code: 'UUID_NOT_FOUND',
        }),
      });

      render(() => <UUIDLogin />);

      const input = screen.getByLabelText(/your practice number/i);
      const form = screen.getByRole('form');

      // Submit 5 failed attempts
      for (let i = 0; i < 5; i++) {
        fireEvent.input(input, { target: { value: '1234-5678-90ab-cdef' } });
        fireEvent.submit(form);
        await waitFor(() => expect(global.fetch).toHaveBeenCalled());
      }

      await waitFor(() => {
        expect(screen.getByText(/too many attempts/i)).toBeTruthy();
        expect(screen.getByText(/wait.*seconds/i)).toBeTruthy();
      });
    });

    it('should disable submit button when rate limited', async () => {
      (global.fetch as any).mockResolvedValue({
        ok: false,
        status: 404,
        json: async () => ({
          success: false,
          error: 'UUID not found',
          code: 'UUID_NOT_FOUND',
        }),
      });

      render(() => <UUIDLogin />);

      const input = screen.getByLabelText(/your practice number/i);
      const form = screen.getByRole('form');
      const button = screen.getByRole('button', { name: /log in/i }) as HTMLButtonElement;

      // Submit 5 failed attempts
      for (let i = 0; i < 5; i++) {
        fireEvent.input(input, { target: { value: '1234-5678-90ab-cdef' } });
        fireEvent.submit(form);
        await waitFor(() => expect(global.fetch).toHaveBeenCalled());
      }

      await waitFor(() => {
        expect(button.disabled).toBe(true);
      });
    });

    it('should handle server-side 429 rate limit response', async () => {
      const retryAfter = 60;
      const resetAt = Date.now() + retryAfter * 1000;

      (global.fetch as any).mockResolvedValue({
        ok: false,
        status: 429,
        json: async () => ({
          success: false,
          error: 'Too many login attempts. Please try again later.',
          code: 'RATE_LIMIT_EXCEEDED',
          retryAfter,
          resetAt,
        }),
      });

      render(() => <UUIDLogin />);

      const input = screen.getByLabelText(/your practice number/i);
      const form = screen.getByRole('form');
      const button = screen.getByRole('button', { name: /log in/i }) as HTMLButtonElement;

      // Submit login attempt
      fireEvent.input(input, { target: { value: '1234-5678-90ab-cdef' } });
      fireEvent.submit(form);

      // Should display rate limit message with countdown
      await waitFor(() => {
        expect(screen.getByText(/too many attempts/i)).toBeTruthy();
        expect(screen.getByText(/wait.*seconds/i)).toBeTruthy();
      });

      // Should disable submit button
      await waitFor(() => {
        expect(button.disabled).toBe(true);
      });
    });

    it('should sync client rate limit with server 429 response', async () => {
      const retryAfter = 45;
      const resetAt = Date.now() + retryAfter * 1000;

      (global.fetch as any).mockResolvedValue({
        ok: false,
        status: 429,
        json: async () => ({
          success: false,
          error: 'Too many login attempts. Please try again later.',
          code: 'RATE_LIMIT_EXCEEDED',
          retryAfter,
          resetAt,
        }),
      });

      render(() => <UUIDLogin />);

      const input = screen.getByLabelText(/your practice number/i);
      const form = screen.getByRole('form');

      // Submit login attempt that triggers server rate limit
      fireEvent.input(input, { target: { value: '1234-5678-90ab-cdef' } });
      fireEvent.submit(form);

      // Should display server-provided countdown time
      await waitFor(() => {
        expect(screen.getByText(/wait.*45.*seconds/i)).toBeTruthy();
      });
    });
  });

  describe('accessibility', () => {
    it('should have keyboard navigable form elements', () => {
      render(() => <UUIDLogin />);

      const input = screen.getByLabelText(/your practice number/i);
      const checkbox = screen.getByLabelText(/remember this device/i);
      const button = screen.getByRole('button', { name: /log in/i });

      expect(input.getAttribute('type')).toBe('text');
      expect(checkbox.getAttribute('type')).toBe('checkbox');
      expect(button.getAttribute('type')).toBe('submit');
    });

    it('should have proper ARIA attributes for validation errors', () => {
      render(() => <UUIDLogin />);

      const input = screen.getByLabelText(/your practice number/i);

      fireEvent.input(input, { target: { value: 'invalid' } });
      fireEvent.blur(input);

      expect(input.getAttribute('aria-invalid')).toBe('true');
      expect(input.getAttribute('aria-describedby')).toBe('uuid-error');
    });

    it('should have aria-live region for error messages', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 404,
        json: async () => ({
          success: false,
          error: 'UUID not found',
          code: 'UUID_NOT_FOUND',
        }),
      });

      render(() => <UUIDLogin />);

      const input = screen.getByLabelText(/your practice number/i);
      const form = screen.getByRole('form');

      fireEvent.input(input, { target: { value: '1234-5678-90ab-cdef' } });
      fireEvent.submit(form);

      await waitFor(() => {
        const alert = screen.getByRole('alert');
        expect(alert.getAttribute('aria-live')).toBe('assertive');
      });
    });

    it('should have minimum 44x44px touch targets', () => {
      render(() => <UUIDLogin />);

      const button = screen.getByRole('button', { name: /log in/i });
      const checkbox = screen.getByLabelText(/remember this device/i);

      expect(button.classList.contains('min-h-44px')).toBe(true);
      expect(checkbox.classList.contains('min-w-44px')).toBe(true);
      expect(checkbox.classList.contains('min-h-44px')).toBe(true);
    });
  });

  describe('internationalization', () => {
    it('should display Danish translations when locale is da-DK', async () => {
      await changeLocale('da-DK');

      render(() => <UUIDLogin />);

      // Check for Danish text
      expect(screen.getByText(/log ind med/i)).toBeTruthy();
    });

    it('should display English translations when locale is en-US', async () => {
      await changeLocale('en-US');

      render(() => <UUIDLogin />);

      expect(screen.getByText(/log in with/i)).toBeTruthy();
    });
  });
});
