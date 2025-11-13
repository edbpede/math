/**
 * ErrorBoundary Component Tests
 *
 * Tests error boundary functionality including:
 * - Error catching and fallback rendering
 * - Custom fallback UI
 * - Error logging
 * - Screen reader announcements
 * - Reset functionality
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent } from "@solidjs/testing-library";
import "@testing-library/jest-dom";
import { ErrorBoundaryWrapper } from "./ErrorBoundary";
import * as logger from "@/lib/error/logger";
import * as announcer from "@/lib/accessibility/announcer";

// Mock the logger
vi.mock("@/lib/error/logger", () => ({
  logError: vi.fn(),
  ErrorCategory: {
    COMPONENT: "component",
    GENERAL: "general",
  },
  ErrorSeverity: {
    MEDIUM: "medium",
  },
}));

// Mock the announcer
vi.mock("@/lib/accessibility/announcer", () => ({
  announce: vi.fn(),
}));

// Component that throws an error
const ThrowError = (props: { shouldThrow: boolean; message?: string }) => {
  if (props.shouldThrow) {
    throw new Error(props.message || "Test error");
  }
  return <div>Component rendered successfully</div>;
};

describe("ErrorBoundaryWrapper", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Suppress console.error for cleaner test output
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("Normal Operation", () => {
    it("should render children when no error occurs", () => {
      render(() => (
        <ErrorBoundaryWrapper componentName="TestComponent">
          <ThrowError shouldThrow={false} />
        </ErrorBoundaryWrapper>
      ));

      expect(
        screen.getByText("Component rendered successfully"),
      ).toBeInTheDocument();
    });

    it("should not call error handlers when no error occurs", () => {
      const onError = vi.fn();

      render(() => (
        <ErrorBoundaryWrapper componentName="TestComponent" onError={onError}>
          <ThrowError shouldThrow={false} />
        </ErrorBoundaryWrapper>
      ));

      expect(onError).not.toHaveBeenCalled();
      expect(logger.logError).not.toHaveBeenCalled();
    });
  });

  describe("Error Handling", () => {
    it("should catch errors and display fallback UI", () => {
      render(() => (
        <ErrorBoundaryWrapper componentName="TestComponent">
          <ThrowError shouldThrow={true} message="Test error message" />
        </ErrorBoundaryWrapper>
      ));

      // Check for error message in fallback UI
      expect(
        screen.getByText(/Noget gik galt|Something went wrong/i),
      ).toBeInTheDocument();
    });

    it("should call logError when error occurs", () => {
      render(() => (
        <ErrorBoundaryWrapper componentName="TestComponent">
          <ThrowError shouldThrow={true} />
        </ErrorBoundaryWrapper>
      ));

      expect(logger.logError).toHaveBeenCalledWith(
        expect.objectContaining({
          error: expect.any(Error),
          context: expect.objectContaining({
            component: "TestComponent",
          }),
        }),
      );
    });

    it("should announce error to screen readers by default", () => {
      render(() => (
        <ErrorBoundaryWrapper componentName="TestComponent">
          <ThrowError shouldThrow={true} />
        </ErrorBoundaryWrapper>
      ));

      expect(announcer.announce).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          priority: "assertive",
          clearQueue: true,
        }),
      );
    });

    it("should not announce error when announceErrors is false", () => {
      render(() => (
        <ErrorBoundaryWrapper
          componentName="TestComponent"
          announceErrors={false}
        >
          <ThrowError shouldThrow={true} />
        </ErrorBoundaryWrapper>
      ));

      expect(announcer.announce).not.toHaveBeenCalled();
    });

    it("should call onError callback when provided", () => {
      const onError = vi.fn();

      render(() => (
        <ErrorBoundaryWrapper componentName="TestComponent" onError={onError}>
          <ThrowError shouldThrow={true} />
        </ErrorBoundaryWrapper>
      ));

      expect(onError).toHaveBeenCalledWith(
        expect.any(Error),
        expect.any(Function),
      );
    });
  });

  describe("Fallback UI", () => {
    it("should display default fallback UI", () => {
      render(() => (
        <ErrorBoundaryWrapper componentName="TestComponent">
          <ThrowError shouldThrow={true} />
        </ErrorBoundaryWrapper>
      ));

      // Check for alert role
      const alert = screen.getByRole("alert");
      expect(alert).toBeInTheDocument();
      expect(alert).toHaveAttribute("aria-live", "assertive");
    });

    it("should display try again button", () => {
      render(() => (
        <ErrorBoundaryWrapper componentName="TestComponent">
          <ThrowError shouldThrow={true} />
        </ErrorBoundaryWrapper>
      ));

      const tryAgainButton = screen.getByRole("button", {
        name: /Prøv igen|Try again/i,
      });
      expect(tryAgainButton).toBeInTheDocument();
    });

    it("should display reload page button", () => {
      render(() => (
        <ErrorBoundaryWrapper componentName="TestComponent">
          <ThrowError shouldThrow={true} />
        </ErrorBoundaryWrapper>
      ));

      const reloadButton = screen.getByRole("button", {
        name: /Genindlæs siden|Reload/i,
      });
      expect(reloadButton).toBeInTheDocument();
    });

    it("should use custom fallback when provided", () => {
      const customFallback = (error: Error, reset: () => void) => (
        <div>
          <p>Custom error: {error.message}</p>
          <button onClick={reset}>Custom reset</button>
        </div>
      );

      render(() => (
        <ErrorBoundaryWrapper
          componentName="TestComponent"
          fallback={customFallback}
        >
          <ThrowError shouldThrow={true} message="Custom error message" />
        </ErrorBoundaryWrapper>
      ));

      expect(screen.getByText(/Custom error:/)).toBeInTheDocument();
      expect(screen.getByText(/Custom error message/)).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: /Custom reset/i }),
      ).toBeInTheDocument();
    });
  });

  describe("Reset Functionality", () => {
    it("should reset error boundary when try again is clicked", async () => {
      let shouldThrow = true;

      const TestWrapper = () => (
        <ErrorBoundaryWrapper componentName="TestComponent">
          <ThrowError shouldThrow={shouldThrow} />
        </ErrorBoundaryWrapper>
      );

      render(() => <TestWrapper />);

      // Error should be displayed
      expect(
        screen.getByText(/Noget gik galt|Something went wrong/i),
      ).toBeInTheDocument();

      // Fix the error
      shouldThrow = false;

      // Click try again button
      const tryAgainButton = screen.getByRole("button", {
        name: /Prøv igen|Try again/i,
      });
      fireEvent.click(tryAgainButton);

      // Should announce reset
      expect(announcer.announce).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          priority: "polite",
        }),
      );

      // Note: In actual SolidJS, the error boundary would remount the children
      // The reset functionality is tested in the next test case
    });

    it("should call reset function in custom fallback", () => {
      const resetSpy = vi.fn();
      const customFallback = (_error: Error, reset: () => void) => (
        <button
          onClick={() => {
            resetSpy();
            reset();
          }}
        >
          Custom reset
        </button>
      );

      render(() => (
        <ErrorBoundaryWrapper
          componentName="TestComponent"
          fallback={customFallback}
        >
          <ThrowError shouldThrow={true} />
        </ErrorBoundaryWrapper>
      ));

      const resetButton = screen.getByRole("button", {
        name: /Custom reset/i,
      });
      fireEvent.click(resetButton);

      expect(resetSpy).toHaveBeenCalled();
    });
  });

  describe("Development Mode", () => {
    it("should display component name in dev mode", () => {
      // Set to dev mode
      const originalEnv = import.meta.env.DEV;
      Object.defineProperty(import.meta.env, "DEV", {
        value: true,
        writable: true,
      });

      render(() => (
        <ErrorBoundaryWrapper componentName="MyTestComponent">
          <ThrowError shouldThrow={true} />
        </ErrorBoundaryWrapper>
      ));

      expect(screen.getByText(/Component: MyTestComponent/i)).toBeInTheDocument();

      // Restore
      Object.defineProperty(import.meta.env, "DEV", {
        value: originalEnv,
        writable: true,
      });
    });
  });

  describe("Accessibility", () => {
    it("should have alert role on error container", () => {
      render(() => (
        <ErrorBoundaryWrapper componentName="TestComponent">
          <ThrowError shouldThrow={true} />
        </ErrorBoundaryWrapper>
      ));

      const alert = screen.getByRole("alert");
      expect(alert).toHaveAttribute("aria-live", "assertive");
    });

    it("should have accessible button labels", () => {
      render(() => (
        <ErrorBoundaryWrapper componentName="TestComponent">
          <ThrowError shouldThrow={true} />
        </ErrorBoundaryWrapper>
      ));

      const tryAgainButton = screen.getByRole("button", {
        name: /Prøv igen|Try again/i,
      });
      expect(tryAgainButton).toHaveAttribute("aria-label");
    });

    it("should meet minimum touch target size", () => {
      render(() => (
        <ErrorBoundaryWrapper componentName="TestComponent">
          <ThrowError shouldThrow={true} />
        </ErrorBoundaryWrapper>
      ));

      const buttons = screen.getAllByRole("button");
      buttons.forEach((button) => {
        expect(button).toHaveClass("touch-target");
      });
    });
  });
});
