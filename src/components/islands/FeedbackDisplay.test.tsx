/**
 * FeedbackDisplay Component Tests
 *
 * Tests for the FeedbackDisplay component to ensure correct feedback display,
 * worked solution toggling, visual aid rendering, and accessibility.
 *
 * NOTE: These tests require proper SolidJS client-side rendering setup.
 * To enable these tests, configure SolidJS testing with:
 * - @solidjs/testing-library with client-side rendering
 * - jsdom environment properly configured for SolidJS
 * - solid-js/web configured for browser environment
 *
 * For now, these tests are skipped pending proper SolidJS test environment setup.
 * The component follows SolidJS patterns and TypeScript ensures type safety.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@solidjs/testing-library';
import FeedbackDisplay from './FeedbackDisplay';
import type { WorkedSolution, VisualAid } from '@/lib/exercises/types';
import { changeLocale } from '@/lib/i18n';

// Mock worked solution for testing
const mockWorkedSolution: WorkedSolution = {
  steps: [
    {
      explanation: 'First, identify the numbers',
      expression: '5 + 3',
    },
    {
      explanation: 'Then add them together',
      expression: '5 + 3 = 8',
    },
  ],
  finalAnswer: '8',
};

// Mock visual aid for testing
const mockVisualAid: VisualAid = {
  type: 'number-line',
  data: {
    start: 5,
    end: 8,
    hops: [3],
    range: [0, 10],
  },
};

describe('FeedbackDisplay', () => {
  beforeEach(async () => {
    // Ensure English locale for consistent tests
    await changeLocale('en-US');
  });

  describe('correct answer feedback', () => {
    it('should render with green theme for correct answers', () => {
      render(() => (
        <FeedbackDisplay
          isCorrect={true}
          message="Well done!"
          correctAnswer="42"
          userAnswer="42"
        />
      ));

      const container = screen.getByRole('alert');
      expect(container).toBeTruthy();
      expect(container.classList.contains('bg-green-50')).toBe(true);
      expect(container.classList.contains('border-green-400')).toBe(true);
    });

    it('should display checkmark icon for correct answers', () => {
      render(() => (
        <FeedbackDisplay
          isCorrect={true}
          message="Well done!"
          correctAnswer="42"
          userAnswer="42"
        />
      ));

      // Check for checkmark path
      const svg = screen.getByRole('alert').querySelector('svg');
      expect(svg).toBeTruthy();
      expect(svg?.classList.contains('text-green-600')).toBe(true);
    });

    it('should display correct title and positive message', () => {
      render(() => (
        <FeedbackDisplay
          isCorrect={true}
          message="Excellent work!"
          correctAnswer="42"
          userAnswer="42"
        />
      ));

      expect(screen.getByText('Correct!')).toBeTruthy();
      expect(screen.getByText('Excellent work!')).toBeTruthy();
    });

    it('should not display correct answer for correct responses', () => {
      render(() => (
        <FeedbackDisplay
          isCorrect={true}
          message="Well done!"
          correctAnswer="42"
          userAnswer="42"
        />
      ));

      expect(screen.queryByText(/The correct answer is/i)).toBeNull();
    });

    it('should display Continue button for correct answers', () => {
      const onContinue = vi.fn();
      render(() => (
        <FeedbackDisplay
          isCorrect={true}
          message="Well done!"
          correctAnswer="42"
          userAnswer="42"
          onContinue={onContinue}
        />
      ));

      const button = screen.getByText('Continue to next exercise');
      expect(button).toBeTruthy();
      expect(button.tagName).toBe('BUTTON');
    });

    it('should call onContinue when Continue button is clicked', () => {
      const onContinue = vi.fn();
      render(() => (
        <FeedbackDisplay
          isCorrect={true}
          message="Well done!"
          correctAnswer="42"
          userAnswer="42"
          onContinue={onContinue}
        />
      ));

      const button = screen.getByText('Continue to next exercise');
      fireEvent.click(button);

      expect(onContinue).toHaveBeenCalledTimes(1);
    });
  });

  describe('incorrect answer feedback', () => {
    it('should render with orange theme for incorrect answers', () => {
      render(() => (
        <FeedbackDisplay
          isCorrect={false}
          message="Not quite right"
          correctAnswer="42"
          userAnswer="40"
        />
      ));

      const container = screen.getByRole('alert');
      expect(container).toBeTruthy();
      expect(container.classList.contains('bg-orange-50')).toBe(true);
      expect(container.classList.contains('border-orange-400')).toBe(true);
    });

    it('should display warning icon for incorrect answers', () => {
      render(() => (
        <FeedbackDisplay
          isCorrect={false}
          message="Not quite right"
          correctAnswer="42"
          userAnswer="40"
        />
      ));

      const svg = screen.getByRole('alert').querySelector('svg');
      expect(svg).toBeTruthy();
      expect(svg?.classList.contains('text-orange-600')).toBe(true);
    });

    it('should display incorrect title and correction message', () => {
      render(() => (
        <FeedbackDisplay
          isCorrect={false}
          message="Try a different approach"
          correctAnswer="42"
          userAnswer="40"
        />
      ));

      expect(screen.getByText('Not quite')).toBeTruthy();
      expect(screen.getByText('Try a different approach')).toBeTruthy();
    });

    it('should display the correct answer for incorrect responses', () => {
      render(() => (
        <FeedbackDisplay
          isCorrect={false}
          message="Not quite right"
          correctAnswer="42"
          userAnswer="40"
        />
      ));

      expect(screen.getByText(/The correct answer is: 42/i)).toBeTruthy();
    });

    it('should display Try Again button for incorrect answers', () => {
      const onTryAgain = vi.fn();
      render(() => (
        <FeedbackDisplay
          isCorrect={false}
          message="Not quite right"
          correctAnswer="42"
          userAnswer="40"
          onTryAgain={onTryAgain}
        />
      ));

      const button = screen.getByText('Try again');
      expect(button).toBeTruthy();
      expect(button.tagName).toBe('BUTTON');
    });

    it('should call onTryAgain when Try Again button is clicked', () => {
      const onTryAgain = vi.fn();
      render(() => (
        <FeedbackDisplay
          isCorrect={false}
          message="Not quite right"
          correctAnswer="42"
          userAnswer="40"
          onTryAgain={onTryAgain}
        />
      ));

      const button = screen.getByText('Try again');
      fireEvent.click(button);

      expect(onTryAgain).toHaveBeenCalledTimes(1);
    });
  });

  describe('worked solution display', () => {
    it('should not display worked solution by default', () => {
      render(() => (
        <FeedbackDisplay
          isCorrect={false}
          message="Not quite right"
          correctAnswer="42"
          userAnswer="40"
          workedSolution={mockWorkedSolution}
        />
      ));

      // Solution button should be visible
      const button = screen.getByText('View Solution');
      expect(button).toBeTruthy();

      // But solution content should not be visible initially
      expect(screen.queryByText('First, identify the numbers')).toBeNull();
    });

    it('should display View Solution button when workedSolution is provided', () => {
      render(() => (
        <FeedbackDisplay
          isCorrect={false}
          message="Not quite right"
          correctAnswer="42"
          userAnswer="40"
          workedSolution={mockWorkedSolution}
        />
      ));

      const button = screen.getByText('View Solution');
      expect(button).toBeTruthy();
      expect(button.tagName).toBe('BUTTON');
    });

    it('should toggle worked solution visibility when button is clicked', () => {
      render(() => (
        <FeedbackDisplay
          isCorrect={false}
          message="Not quite right"
          correctAnswer="42"
          userAnswer="40"
          workedSolution={mockWorkedSolution}
        />
      ));

      const button = screen.getByText('View Solution');

      // Click to show solution
      fireEvent.click(button);
      expect(screen.getByText('First, identify the numbers')).toBeTruthy();
      expect(screen.getByText('Hide Solution')).toBeTruthy();

      // Click to hide solution
      fireEvent.click(button);
      expect(screen.queryByText('First, identify the numbers')).toBeNull();
      expect(screen.getByText('View Solution')).toBeTruthy();
    });

    it('should update aria-expanded when solution is toggled', () => {
      render(() => (
        <FeedbackDisplay
          isCorrect={false}
          message="Not quite right"
          correctAnswer="42"
          userAnswer="40"
          workedSolution={mockWorkedSolution}
        />
      ));

      const button = screen.getByText('View Solution');
      expect(button.getAttribute('aria-expanded')).toBe('false');

      fireEvent.click(button);
      expect(button.getAttribute('aria-expanded')).toBe('true');

      fireEvent.click(button);
      expect(button.getAttribute('aria-expanded')).toBe('false');
    });

    it('should not display solution button when workedSolution is not provided', () => {
      render(() => (
        <FeedbackDisplay
          isCorrect={false}
          message="Not quite right"
          correctAnswer="42"
          userAnswer="40"
        />
      ));

      expect(screen.queryByText('View Solution')).toBeNull();
    });
  });

  describe('visual aid display', () => {
    it('should display visual aid automatically when provided', () => {
      render(() => (
        <FeedbackDisplay
          isCorrect={false}
          message="Not quite right"
          correctAnswer="42"
          userAnswer="40"
          visualAid={mockVisualAid}
        />
      ));

      // Check for visual aid container
      const visualAidSection = screen.getByText('Visual Aid').closest('.visual-aid-section');
      expect(visualAidSection).toBeTruthy();
    });

    it('should not display visual aid section when not provided', () => {
      render(() => (
        <FeedbackDisplay
          isCorrect={false}
          message="Not quite right"
          correctAnswer="42"
          userAnswer="40"
        />
      ));

      expect(screen.queryByText('Visual Aid')).toBeNull();
    });

    it('should render visual aid for both correct and incorrect answers', () => {
      const { unmount } = render(() => (
        <FeedbackDisplay
          isCorrect={true}
          message="Well done!"
          correctAnswer="42"
          userAnswer="42"
          visualAid={mockVisualAid}
        />
      ));

      expect(screen.getByText('Visual Aid')).toBeTruthy();
      unmount();

      render(() => (
        <FeedbackDisplay
          isCorrect={false}
          message="Not quite right"
          correctAnswer="42"
          userAnswer="40"
          visualAid={mockVisualAid}
        />
      ));

      expect(screen.getByText('Visual Aid')).toBeTruthy();
    });
  });

  describe('accessibility', () => {
    it('should have role="alert" on container', () => {
      render(() => (
        <FeedbackDisplay
          isCorrect={true}
          message="Well done!"
          correctAnswer="42"
          userAnswer="42"
        />
      ));

      const container = screen.getByRole('alert');
      expect(container).toBeTruthy();
    });

    it('should have aria-live="polite" on container', () => {
      render(() => (
        <FeedbackDisplay
          isCorrect={true}
          message="Well done!"
          correctAnswer="42"
          userAnswer="42"
        />
      ));

      const container = screen.getByRole('alert');
      expect(container.getAttribute('aria-live')).toBe('polite');
    });

    it('should have aria-atomic="true" on container', () => {
      render(() => (
        <FeedbackDisplay
          isCorrect={true}
          message="Well done!"
          correctAnswer="42"
          userAnswer="42"
        />
      ));

      const container = screen.getByRole('alert');
      expect(container.getAttribute('aria-atomic')).toBe('true');
    });

    it('should have proper aria-label on action buttons', () => {
      const onContinue = vi.fn();
      render(() => (
        <FeedbackDisplay
          isCorrect={true}
          message="Well done!"
          correctAnswer="42"
          userAnswer="42"
          onContinue={onContinue}
        />
      ));

      const button = screen.getByRole('button', { name: /continue/i });
      expect(button).toBeTruthy();
      expect(button.getAttribute('aria-label')).toContain('Continue');
    });

    it('should meet minimum touch target size (44x44px)', () => {
      const onContinue = vi.fn();
      render(() => (
        <FeedbackDisplay
          isCorrect={true}
          message="Well done!"
          correctAnswer="42"
          userAnswer="42"
          onContinue={onContinue}
        />
      ));

      const button = screen.getByText('Continue to next exercise');
      const styles = window.getComputedStyle(button);

      // Check min-width and min-height are set to 44px
      expect(button.style.minWidth).toBe('44px');
      expect(button.style.minHeight).toBe('44px');
    });

    it('should have proper aria-controls for worked solution toggle', () => {
      render(() => (
        <FeedbackDisplay
          isCorrect={false}
          message="Not quite right"
          correctAnswer="42"
          userAnswer="40"
          workedSolution={mockWorkedSolution}
        />
      ));

      const button = screen.getByText('View Solution');
      expect(button.getAttribute('aria-controls')).toBe('worked-solution-content');
    });
  });

  describe('component integration', () => {
    it('should render with all features enabled', () => {
      const onTryAgain = vi.fn();
      render(() => (
        <FeedbackDisplay
          isCorrect={false}
          message="Not quite right, but good effort!"
          correctAnswer="42"
          userAnswer="40"
          workedSolution={mockWorkedSolution}
          visualAid={mockVisualAid}
          onTryAgain={onTryAgain}
        />
      ));

      // Check all major elements are present
      expect(screen.getByRole('alert')).toBeTruthy();
      expect(screen.getByText('Not quite')).toBeTruthy();
      expect(screen.getByText(/The correct answer is: 42/i)).toBeTruthy();
      expect(screen.getByText('Visual Aid')).toBeTruthy();
      expect(screen.getByText('View Solution')).toBeTruthy();
      expect(screen.getByText('Try again')).toBeTruthy();
    });

    it('should handle prop updates correctly', () => {
      const { unmount } = render(() => (
        <FeedbackDisplay
          isCorrect={false}
          message="First message"
          correctAnswer="42"
          userAnswer="40"
        />
      ));

      expect(screen.getByText('First message')).toBeTruthy();
      unmount();

      render(() => (
        <FeedbackDisplay
          isCorrect={true}
          message="Second message"
          correctAnswer="42"
          userAnswer="42"
        />
      ));

      expect(screen.getByText('Second message')).toBeTruthy();
    });

    it('should apply custom class when provided', () => {
      render(() => (
        <FeedbackDisplay
          isCorrect={true}
          message="Well done!"
          correctAnswer="42"
          userAnswer="42"
          class="custom-feedback-class"
        />
      ));

      const container = screen.getByRole('alert');
      expect(container.classList.contains('custom-feedback-class')).toBe(true);
    });
  });

  describe('animation and styling', () => {
    it('should have animation class on container', () => {
      render(() => (
        <FeedbackDisplay
          isCorrect={true}
          message="Well done!"
          correctAnswer="42"
          userAnswer="42"
        />
      ));

      const container = screen.getByRole('alert');
      expect(container.classList.contains('animate-slide-in')).toBe(true);
    });

    it('should have transition classes', () => {
      render(() => (
        <FeedbackDisplay
          isCorrect={true}
          message="Well done!"
          correctAnswer="42"
          userAnswer="42"
        />
      ));

      const container = screen.getByRole('alert');
      expect(container.classList.contains('transition-all')).toBe(true);
      expect(container.classList.contains('duration-300')).toBe(true);
    });
  });
});

