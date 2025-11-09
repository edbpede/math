/**
 * LanguageSelector Component Tests
 *
 * Tests for the language selector component including:
 * - Rendering with both language options
 * - Current language highlighting
 * - Language switching functionality
 * - Supabase persistence for authenticated users
 * - Error handling
 * - Keyboard navigation and accessibility
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@solidjs/testing-library';
import LanguageSelector from './LanguageSelector';
import * as i18n from '@/lib/i18n';
import * as auth from '@/lib/auth';

// Mock the i18n module
vi.mock('@/lib/i18n', async () => {
  const actual = await vi.importActual('@/lib/i18n');
  return {
    ...actual,
    changeLocale: vi.fn(),
  };
});

// Mock the auth module
vi.mock('@/lib/auth', async () => {
  const actual = await vi.importActual('@/lib/auth');
  return {
    ...actual,
    getCurrentUser: vi.fn(),
    updateUser: vi.fn(),
  };
});

describe('LanguageSelector', () => {
  
  beforeEach(async () => {
    vi.clearAllMocks();
    // Initialize i18n system and ensure English locale for consistent tests
    await i18n.initI18n();
    await i18n.changeLocale('en-US');
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Rendering', () => {
    it('should render both language options', async () => {
      render(() => <LanguageSelector />);

      // Check for Danish and English buttons
      const danishButton = await screen.findByLabelText(/dansk/i);
      const englishButton = await screen.findByLabelText(/english/i);

      expect(danishButton).toBeInTheDocument();
      expect(englishButton).toBeInTheDocument();
    });

    it('should render in compact mode without labels', async () => {
      const { container } = render(() => <LanguageSelector variant="compact" />);

      // In compact mode, labels should not be visible
      const labels = container.querySelectorAll('span.font-medium');
      expect(labels.length).toBe(0);
    });

    it('should render in full mode with labels', async () => {
      render(() => <LanguageSelector variant="full" />);

      // In full mode, both language labels should be visible
      const danishLabel = await screen.findByText('Dansk');
      const englishLabel = await screen.findByText('English');

      expect(danishLabel).toBeInTheDocument();
      expect(englishLabel).toBeInTheDocument();
    });

    it('should apply horizontal layout by default', async () => {
      const { container } = render(() => <LanguageSelector />);

      const selector = container.querySelector('.language-selector');
      expect(selector?.classList.contains('flex-row')).toBe(true);
    });

    it('should apply vertical layout when specified', async () => {
      const { container } = render(() => <LanguageSelector layout="vertical" />);

      const selector = container.querySelector('.language-selector');
      expect(selector?.classList.contains('flex-col')).toBe(true);
    });

    it('should apply custom CSS class', async () => {
      const { container } = render(() => <LanguageSelector class="custom-class" />);

      const selector = container.querySelector('.language-selector');
      expect(selector?.classList.contains('custom-class')).toBe(true);
    });
  });

  describe('Current Language Highlighting', () => {
    it('should highlight the current language', async () => {
      // Mock current locale as Danish
      vi.spyOn(i18n.$locale, 'get').mockReturnValue('da-DK');

      render(() => <LanguageSelector />);

      const danishButton = await screen.findByLabelText(/dansk/i);
      const englishButton = await screen.findByLabelText(/english/i);

      // Danish button should have active styling (bg-blue-600)
      expect(danishButton.classList.contains('bg-blue-600')).toBe(true);
      // English button should not have active styling
      expect(englishButton.classList.contains('bg-white')).toBe(true);
    });

    it('should set aria-pressed correctly for active language', async () => {
      vi.spyOn(i18n.$locale, 'get').mockReturnValue('en-US');

      render(() => <LanguageSelector />);

      const danishButton = await screen.findByLabelText(/dansk/i);
      const englishButton = await screen.findByLabelText(/english/i);

      expect(danishButton.getAttribute('aria-pressed')).toBe('false');
      expect(englishButton.getAttribute('aria-pressed')).toBe('true');
    });
  });

  describe('Language Switching', () => {
    it('should call changeLocale when clicking a different language', async () => {
      const changeLocaleMock = vi.mocked(i18n.changeLocale);
      const getCurrentUserMock = vi.mocked(auth.getCurrentUser);

      vi.spyOn(i18n.$locale, 'get').mockReturnValue('da-DK');
      getCurrentUserMock.mockResolvedValue(null); // Not authenticated

      render(() => <LanguageSelector />);

      const englishButton = await screen.findByLabelText(/english/i);
      fireEvent.click(englishButton);

      await waitFor(() => {
        expect(changeLocaleMock).toHaveBeenCalledWith('en-US');
      });
    });

    it('should not call changeLocale when clicking current language', async () => {
      const changeLocaleMock = vi.mocked(i18n.changeLocale);

      vi.spyOn(i18n.$locale, 'get').mockReturnValue('da-DK');

      render(() => <LanguageSelector />);

      const danishButton = await screen.findByLabelText(/dansk/i);
      fireEvent.click(danishButton);

      // Should not call changeLocale since it's already the active language
      expect(changeLocaleMock).not.toHaveBeenCalled();
    });

    it('should show loading state during language change', async () => {
      const changeLocaleMock = vi.mocked(i18n.changeLocale);
      const getCurrentUserMock = vi.mocked(auth.getCurrentUser);

      // Make changeLocale async and slow
      changeLocaleMock.mockImplementation(
        () => new Promise((resolve) => setTimeout(resolve, 100))
      );
      getCurrentUserMock.mockResolvedValue(null);

      vi.spyOn(i18n.$locale, 'get').mockReturnValue('da-DK');

      render(() => <LanguageSelector />);

      const englishButton = await screen.findByLabelText(/english/i);
      fireEvent.click(englishButton);

      // Should show loading indicator
      const loadingText = await screen.findByText(/changing language|skifter sprog/i);
      expect(loadingText).toBeInTheDocument();

      // Wait for loading to complete
      await waitFor(() => {
        expect(screen.queryByText(/changing language|skifter sprog/i)).not.toBeInTheDocument();
      });
    });
  });

  describe('Supabase Persistence', () => {
    it('should persist language preference for authenticated users', async () => {
      const changeLocaleMock = vi.mocked(i18n.changeLocale);
      const getCurrentUserMock = vi.mocked(auth.getCurrentUser);
      const updateUserMock = vi.mocked(auth.updateUser);

      const mockUser = {
        id: 'test-user-id',
        createdAt: new Date(),
        lastActiveAt: new Date(),
        gradeRange: '0-3' as const,
        locale: 'da-DK' as const,
        preferences: {},
      };

      changeLocaleMock.mockResolvedValue();
      getCurrentUserMock.mockResolvedValue(mockUser);
      updateUserMock.mockResolvedValue({ success: true, data: { user: mockUser } });

      vi.spyOn(i18n.$locale, 'get').mockReturnValue('da-DK');

      render(() => <LanguageSelector />);

      const englishButton = await screen.findByLabelText(/english/i);
      fireEvent.click(englishButton);

      await waitFor(() => {
        expect(updateUserMock).toHaveBeenCalledWith('test-user-id', {
          locale: 'en-US',
        });
      });
    });

    it('should not persist for non-authenticated users', async () => {
      const changeLocaleMock = vi.mocked(i18n.changeLocale);
      const getCurrentUserMock = vi.mocked(auth.getCurrentUser);
      const updateUserMock = vi.mocked(auth.updateUser);

      changeLocaleMock.mockResolvedValue();
      getCurrentUserMock.mockResolvedValue(null); // Not authenticated

      vi.spyOn(i18n.$locale, 'get').mockReturnValue('da-DK');

      render(() => <LanguageSelector />);

      const englishButton = await screen.findByLabelText(/english/i);
      fireEvent.click(englishButton);

      await waitFor(() => {
        expect(changeLocaleMock).toHaveBeenCalled();
      });

      // Should not attempt to update user
      expect(updateUserMock).not.toHaveBeenCalled();
    });

    it('should continue even if persistence fails', async () => {
      const changeLocaleMock = vi.mocked(i18n.changeLocale);
      const getCurrentUserMock = vi.mocked(auth.getCurrentUser);
      const updateUserMock = vi.mocked(auth.updateUser);

      const mockUser = {
        id: 'test-user-id',
        createdAt: new Date(),
        lastActiveAt: new Date(),
        gradeRange: '0-3' as const,
        locale: 'da-DK' as const,
        preferences: {},
      };

      changeLocaleMock.mockResolvedValue();
      getCurrentUserMock.mockResolvedValue(mockUser);
      updateUserMock.mockResolvedValue({
        success: false,
        error: 'Network error',
        code: 'UPDATE_FAILED',
      });

      vi.spyOn(i18n.$locale, 'get').mockReturnValue('da-DK');

      render(() => <LanguageSelector />);

      const englishButton = await screen.findByLabelText(/english/i);
      fireEvent.click(englishButton);

      await waitFor(() => {
        expect(changeLocaleMock).toHaveBeenCalled();
        expect(updateUserMock).toHaveBeenCalled();
      });

      // Should not show error to user - language change succeeded
      expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    it('should display error message if language change fails', async () => {
      const changeLocaleMock = vi.mocked(i18n.changeLocale);
      const getCurrentUserMock = vi.mocked(auth.getCurrentUser);

      changeLocaleMock.mockRejectedValue(new Error('Failed to load translations'));
      getCurrentUserMock.mockResolvedValue(null);

      vi.spyOn(i18n.$locale, 'get').mockReturnValue('da-DK');

      render(() => <LanguageSelector />);

      const englishButton = await screen.findByLabelText(/english/i);
      fireEvent.click(englishButton);

      // Should show error message
      const errorAlert = await screen.findByRole('alert');
      expect(errorAlert).toBeInTheDocument();
      expect(errorAlert.textContent).toContain('Failed to change language');
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels', async () => {
      render(() => <LanguageSelector />);

      const group = screen.getByRole('group');
      expect(group).toHaveAttribute('aria-label');

      const danishButton = await screen.findByLabelText(/dansk/i);
      const englishButton = await screen.findByLabelText(/english/i);

      expect(danishButton).toHaveAttribute('aria-label');
      expect(englishButton).toHaveAttribute('aria-label');
    });

    it('should be keyboard navigable', async () => {
      const changeLocaleMock = vi.mocked(i18n.changeLocale);
      const getCurrentUserMock = vi.mocked(auth.getCurrentUser);

      changeLocaleMock.mockResolvedValue();
      getCurrentUserMock.mockResolvedValue(null);

      vi.spyOn(i18n.$locale, 'get').mockReturnValue('da-DK');

      render(() => <LanguageSelector />);

      const englishButton = await screen.findByLabelText(/english/i);

      // Should be focusable
      englishButton.focus();
      expect(document.activeElement).toBe(englishButton);

      // Should trigger on Enter key
      fireEvent.keyDown(englishButton, { key: 'Enter', code: 'Enter' });

      // Note: fireEvent.keyDown doesn't trigger click automatically in testing-library
      // In real browsers, Enter key on a button triggers click
      fireEvent.click(englishButton);

      await waitFor(() => {
        expect(changeLocaleMock).toHaveBeenCalledWith('en-US');
      });
    });

    it('should disable buttons during loading', async () => {
      const changeLocaleMock = vi.mocked(i18n.changeLocale);
      const getCurrentUserMock = vi.mocked(auth.getCurrentUser);

      // Make changeLocale async and slow
      changeLocaleMock.mockImplementation(
        () => new Promise((resolve) => setTimeout(resolve, 100))
      );
      getCurrentUserMock.mockResolvedValue(null);

      vi.spyOn(i18n.$locale, 'get').mockReturnValue('da-DK');

      render(() => <LanguageSelector />);

      const englishButton = await screen.findByLabelText(/english/i);
      const danishButton = await screen.findByLabelText(/dansk/i);

      fireEvent.click(englishButton);

      // Both buttons should be disabled during loading
      await waitFor(() => {
        expect(englishButton).toBeDisabled();
        expect(danishButton).toBeDisabled();
      });
    });

    it('should have proper touch target sizes', async () => {
      render(() => <LanguageSelector />);

      const danishButton = await screen.findByLabelText(/dansk/i);
      const englishButton = await screen.findByLabelText(/english/i);

      // Check for min-h-44px and min-w-44px classes
      expect(danishButton.classList.contains('min-h-44px')).toBe(true);
      expect(danishButton.classList.contains('min-w-44px')).toBe(true);
      expect(englishButton.classList.contains('min-h-44px')).toBe(true);
      expect(englishButton.classList.contains('min-w-44px')).toBe(true);
    });
  });

  describe('Flag Icons', () => {
    it('should render flag SVG icons for both languages', async () => {
      const { container } = render(() => <LanguageSelector />);

      const flags = container.querySelectorAll('svg[viewBox="0 0 37 28"]');
      expect(flags.length).toBe(2); // Danish and English flags
    });

    it('should have aria-hidden on flag icons', async () => {
      const { container } = render(() => <LanguageSelector />);

      const flags = container.querySelectorAll('svg[viewBox="0 0 37 28"]');
      flags.forEach((flag) => {
        expect(flag.getAttribute('aria-hidden')).toBe('true');
      });
    });
  });
});

