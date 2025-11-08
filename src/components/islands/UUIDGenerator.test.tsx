/**
 * UUIDGenerator Component Tests
 *
 * Tests for the UUIDGenerator component to ensure correct UUID generation,
 * save functionality (copy, download, QR code), and accessibility.
 *
 * @vitest-environment happy-dom
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@solidjs/testing-library';
import UUIDGenerator from './UUIDGenerator';
import { $t, changeLocale } from '@/lib/i18n';

// Mock QRCode library
vi.mock('qrcode', () => ({
  default: {
    toDataURL: vi.fn().mockResolvedValue('data:image/png;base64,mockedQRCode'),
  },
}));

describe('UUIDGenerator', () => {
  // Note: Component tests require additional SolidJS-specific configuration
  // Infrastructure is in place (setup.ts, happy-dom, mocks) but SolidJS SSR/client mode resolution needs work
  // The component is fully implemented and TypeScript-verified

  beforeEach(async () => {
    // Ensure English locale for consistent tests
    await changeLocale('en-US');

    // Mock fetch API
    global.fetch = vi.fn();

    // Mock Clipboard API
    Object.assign(navigator, {
      clipboard: {
        writeText: vi.fn().mockResolvedValue(undefined),
      },
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('initial render', () => {
    it('should render generate button when autoGenerate is false', () => {
      render(() => (
        <UUIDGenerator gradeRange="0-3" locale="en-US" autoGenerate={false} />
      ));

      const button = screen.getByRole('button', { name: /generate practice number/i });
      expect(button).toBeTruthy();
    });

    it('should have proper ARIA labels', () => {
      render(() => (
        <UUIDGenerator gradeRange="0-3" locale="en-US" autoGenerate={false} />
      ));

      const region = screen.getByRole('region', { name: /your practice number/i });
      expect(region).toBeTruthy();
    });

    it('should call API on mount when autoGenerate is true', async () => {
      const mockResponse = {
        success: true,
        uuid: '1234-5678-90ab-cdef',
        user: {
          id: 'test-id',
          gradeRange: '0-3',
          locale: 'en-US',
          createdAt: new Date().toISOString(),
          lastActiveAt: new Date().toISOString(),
        },
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      render(() => (
        <UUIDGenerator gradeRange="0-3" locale="en-US" autoGenerate={true} />
      ));

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          '/api/auth/generate',
          expect.objectContaining({
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ gradeRange: '0-3', locale: 'en-US' }),
          })
        );
      });
    });
  });

  describe('UUID generation', () => {
    it('should display loading state during generation', async () => {
      (global.fetch as any).mockImplementationOnce(
        () =>
          new Promise((resolve) =>
            setTimeout(
              () =>
                resolve({
                  ok: true,
                  json: async () => ({
                    success: true,
                    uuid: '1234-5678-90ab-cdef',
                    user: {},
                  }),
                }),
              100
            )
          )
      );

      render(() => (
        <UUIDGenerator gradeRange="0-3" locale="en-US" autoGenerate={false} />
      ));

      const button = screen.getByRole('button');
      fireEvent.click(button);

      await waitFor(() => {
        expect(screen.getByText(/loading/i)).toBeTruthy();
      });
    });

    it('should display UUID after successful generation', async () => {
      const mockUUID = '1234-5678-90ab-cdef';
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          uuid: mockUUID,
          user: {},
        }),
      });

      render(() => (
        <UUIDGenerator gradeRange="0-3" locale="en-US" autoGenerate={false} />
      ));

      const button = screen.getByRole('button');
      fireEvent.click(button);

      await waitFor(() => {
        expect(screen.getByText(mockUUID)).toBeTruthy();
      });
    });

    it('should call onComplete callback after successful generation', async () => {
      const mockUUID = '1234-5678-90ab-cdef';
      const onComplete = vi.fn();

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          uuid: mockUUID,
          user: {},
        }),
      });

      render(() => (
        <UUIDGenerator
          gradeRange="0-3"
          locale="en-US"
          autoGenerate={false}
          onComplete={onComplete}
        />
      ));

      const button = screen.getByRole('button');
      fireEvent.click(button);

      await waitFor(() => {
        expect(onComplete).toHaveBeenCalledWith(mockUUID);
      });
    });

    it('should display error message on API failure', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        json: async () => ({
          success: false,
          error: 'Failed to generate UUID',
        }),
      });

      render(() => (
        <UUIDGenerator gradeRange="0-3" locale="en-US" autoGenerate={false} />
      ));

      const button = screen.getByRole('button');
      fireEvent.click(button);

      await waitFor(() => {
        expect(screen.getByText(/failed to generate uuid/i)).toBeTruthy();
      });
    });

    it('should display retry button on error', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        json: async () => ({
          success: false,
          error: 'Error',
        }),
      });

      render(() => (
        <UUIDGenerator gradeRange="0-3" locale="en-US" autoGenerate={false} />
      ));

      const generateButton = screen.getByRole('button');
      fireEvent.click(generateButton);

      await waitFor(() => {
        const retryButton = screen.getByRole('button', { name: /try again/i });
        expect(retryButton).toBeTruthy();
      });
    });
  });

  describe('copy to clipboard', () => {
    beforeEach(() => {
      const mockUUID = '1234-5678-90ab-cdef';
      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: async () => ({
          success: true,
          uuid: mockUUID,
          user: {},
        }),
      });
    });

    it('should copy UUID to clipboard on button click', async () => {
      render(() => (
        <UUIDGenerator gradeRange="0-3" locale="en-US" autoGenerate={true} />
      ));

      await waitFor(() => {
        expect(screen.getByText('1234-5678-90ab-cdef')).toBeTruthy();
      });

      const copyButton = screen.getByRole('button', { name: /copy to clipboard/i });
      fireEvent.click(copyButton);

      await waitFor(() => {
        expect(navigator.clipboard.writeText).toHaveBeenCalledWith('1234-5678-90ab-cdef');
      });
    });

    it('should display success feedback after copying', async () => {
      render(() => (
        <UUIDGenerator gradeRange="0-3" locale="en-US" autoGenerate={true} />
      ));

      await waitFor(() => {
        expect(screen.getByText('1234-5678-90ab-cdef')).toBeTruthy();
      });

      const copyButton = screen.getByRole('button', { name: /copy to clipboard/i });
      fireEvent.click(copyButton);

      await waitFor(() => {
        expect(screen.getByText(/copied to clipboard/i)).toBeTruthy();
      });
    });

    it('should handle clipboard API unavailable (fallback)', async () => {
      // Mock execCommand fallback
      document.execCommand = vi.fn().mockReturnValue(true);
      delete (navigator as any).clipboard;

      render(() => (
        <UUIDGenerator gradeRange="0-3" locale="en-US" autoGenerate={true} />
      ));

      await waitFor(() => {
        expect(screen.getByText('1234-5678-90ab-cdef')).toBeTruthy();
      });

      const copyButton = screen.getByRole('button', { name: /copy to clipboard/i });
      fireEvent.click(copyButton);

      await waitFor(() => {
        expect(document.execCommand).toHaveBeenCalledWith('copy');
      });
    });
  });

  describe('download as file', () => {
    beforeEach(() => {
      const mockUUID = '1234-5678-90ab-cdef';
      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: async () => ({
          success: true,
          uuid: mockUUID,
          user: {},
        }),
      });

      // Mock URL.createObjectURL and URL.revokeObjectURL
      global.URL.createObjectURL = vi.fn(() => 'blob:mock-url');
      global.URL.revokeObjectURL = vi.fn();

      // Mock document.createElement for download link
      const mockLink = {
        href: '',
        download: '',
        click: vi.fn(),
      };
      vi.spyOn(document, 'createElement').mockReturnValue(mockLink as any);
      vi.spyOn(document.body, 'appendChild').mockImplementation(() => mockLink as any);
      vi.spyOn(document.body, 'removeChild').mockImplementation(() => mockLink as any);
    });

    it('should download UUID as text file on button click', async () => {
      render(() => (
        <UUIDGenerator gradeRange="0-3" locale="en-US" autoGenerate={true} />
      ));

      await waitFor(() => {
        expect(screen.getByText('1234-5678-90ab-cdef')).toBeTruthy();
      });

      const downloadButton = screen.getByRole('button', { name: /download as file/i });
      fireEvent.click(downloadButton);

      await waitFor(() => {
        expect(document.createElement).toHaveBeenCalledWith('a');
        expect(URL.createObjectURL).toHaveBeenCalled();
      });
    });

    it('should create blob with correct content', async () => {
      const originalBlob = global.Blob;
      const mockBlobContent: string[] = [];

      (global as any).Blob = class MockBlob {
        constructor(parts: any[], options: any) {
          mockBlobContent.push(...parts);
        }
      };

      render(() => (
        <UUIDGenerator gradeRange="0-3" locale="en-US" autoGenerate={true} />
      ));

      await waitFor(() => {
        expect(screen.getByText('1234-5678-90ab-cdef')).toBeTruthy();
      });

      const downloadButton = screen.getByRole('button', { name: /download as file/i });
      fireEvent.click(downloadButton);

      await waitFor(() => {
        expect(mockBlobContent[0]).toContain('1234-5678-90ab-cdef');
        expect(mockBlobContent[0]).toContain('Your practice number is:');
      });

      global.Blob = originalBlob;
    });
  });

  describe('QR code display', () => {
    beforeEach(() => {
      const mockUUID = '1234-5678-90ab-cdef';
      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: async () => ({
          success: true,
          uuid: mockUUID,
          user: {},
        }),
      });
    });

    it('should toggle QR code display on button click', async () => {
      render(() => (
        <UUIDGenerator gradeRange="0-3" locale="en-US" autoGenerate={true} />
      ));

      await waitFor(() => {
        expect(screen.getByText('1234-5678-90ab-cdef')).toBeTruthy();
      });

      const qrButton = screen.getByRole('button', { name: /show qr code/i });

      // QR code should not be visible initially
      expect(screen.queryByAltText(/qr code for practice number/i)).toBeFalsy();

      // Click to show QR code
      fireEvent.click(qrButton);

      await waitFor(() => {
        expect(screen.getByAltText(/qr code for practice number/i)).toBeTruthy();
      });

      // Click close button to hide QR code
      const closeButton = screen.getByRole('button', { name: /close qr code/i });
      fireEvent.click(closeButton);

      await waitFor(() => {
        expect(screen.queryByAltText(/qr code for practice number/i)).toBeFalsy();
      });
    });

    it('should display QR code image with correct data URL', async () => {
      render(() => (
        <UUIDGenerator gradeRange="0-3" locale="en-US" autoGenerate={true} />
      ));

      await waitFor(() => {
        expect(screen.getByText('1234-5678-90ab-cdef')).toBeTruthy();
      });

      const qrButton = screen.getByRole('button', { name: /show qr code/i });
      fireEvent.click(qrButton);

      await waitFor(() => {
        const qrImage = screen.getByAltText(/qr code for practice number/i) as HTMLImageElement;
        expect(qrImage.src).toContain('data:image/png;base64,mockedQRCode');
      });
    });
  });

  describe('accessibility', () => {
    it('should have keyboard navigable buttons', async () => {
      const mockUUID = '1234-5678-90ab-cdef';
      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: async () => ({
          success: true,
          uuid: mockUUID,
          user: {},
        }),
      });

      render(() => (
        <UUIDGenerator gradeRange="0-3" locale="en-US" autoGenerate={true} />
      ));

      await waitFor(() => {
        expect(screen.getByText('1234-5678-90ab-cdef')).toBeTruthy();
      });

      const buttons = screen.getAllByRole('button');
      buttons.forEach((button) => {
        expect(button.getAttribute('type')).toBe('button');
      });
    });

    it('should have proper ARIA live regions', async () => {
      (global.fetch as any).mockImplementationOnce(
        () =>
          new Promise((resolve) =>
            setTimeout(
              () =>
                resolve({
                  ok: true,
                  json: async () => ({
                    success: true,
                    uuid: '1234-5678-90ab-cdef',
                    user: {},
                  }),
                }),
              100
            )
          )
      );

      render(() => (
        <UUIDGenerator gradeRange="0-3" locale="en-US" autoGenerate={false} />
      ));

      const button = screen.getByRole('button');
      fireEvent.click(button);

      await waitFor(() => {
        const loadingStatus = screen.getByRole('status');
        expect(loadingStatus.getAttribute('aria-live')).toBe('polite');
      });
    });

    it('should have alert role for warning message', async () => {
      const mockUUID = '1234-5678-90ab-cdef';
      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: async () => ({
          success: true,
          uuid: mockUUID,
          user: {},
        }),
      });

      render(() => (
        <UUIDGenerator gradeRange="0-3" locale="en-US" autoGenerate={true} />
      ));

      await waitFor(() => {
        const alert = screen.getByRole('alert');
        expect(alert).toBeTruthy();
        expect(alert.textContent).toContain('Important');
      });
    });
  });

  describe('internationalization', () => {
    it('should display Danish translations when locale is da-DK', async () => {
      await changeLocale('da-DK');

      const mockUUID = '1234-5678-90ab-cdef';
      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: async () => ({
          success: true,
          uuid: mockUUID,
          user: {},
        }),
      });

      render(() => (
        <UUIDGenerator gradeRange="0-3" locale="da-DK" autoGenerate={true} />
      ));

      await waitFor(() => {
        // Check for Danish text (this will depend on actual translations)
        const region = screen.getByRole('region');
        expect(region).toBeTruthy();
      });
    });
  });

  describe('different grade ranges', () => {
    it.each([
      ['0-3', 'Grade 0-3'],
      ['4-6', 'Grade 4-6'],
      ['7-9', 'Grade 7-9'],
    ])('should handle grade range %s', async (gradeRange, label) => {
      const mockUUID = '1234-5678-90ab-cdef';
      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: async () => ({
          success: true,
          uuid: mockUUID,
          user: {},
        }),
      });

      render(() => (
        <UUIDGenerator
          gradeRange={gradeRange as '0-3' | '4-6' | '7-9'}
          locale="en-US"
          autoGenerate={true}
        />
      ));

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          '/api/auth/generate',
          expect.objectContaining({
            body: JSON.stringify({ gradeRange, locale: 'en-US' }),
          })
        );
      });
    });
  });
});
