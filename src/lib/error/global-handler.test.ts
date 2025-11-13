/**
 * Global Error Handler Tests
 *
 * Tests global error handling functionality including:
 * - Window error handling
 * - Unhandled promise rejection handling
 * - Error categorization and filtering
 * - Toast integration
 * - Duplicate error prevention
 * - Initialization and cleanup
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  initializeGlobalErrorHandler,
  cleanupGlobalErrorHandler,
  isGlobalErrorHandlerInitialized,
} from "./global-handler";
import * as logger from "./logger";
import * as toastModule from "@/components/islands/ToastNotification";

// Mock the logger
vi.mock("./logger", () => ({
  logError: vi.fn(),
  wasErrorLoggedRecently: vi.fn(() => false),
  ErrorCategory: {
    NETWORK: "network",
    AUTH: "auth",
    EXERCISE: "exercise",
    DATA: "data",
    GENERAL: "general",
  },
  ErrorSeverity: {
    LOW: "low",
    MEDIUM: "medium",
    HIGH: "high",
    CRITICAL: "critical",
  },
}));

// Mock the toast
vi.mock("@/components/islands/ToastNotification", () => ({
  toast: {
    error: vi.fn(),
    success: vi.fn(),
    info: vi.fn(),
    warning: vi.fn(),
  },
}));

describe("Global Error Handler", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    cleanupGlobalErrorHandler();
  });

  afterEach(() => {
    cleanupGlobalErrorHandler();
  });

  describe("initializeGlobalErrorHandler", () => {
    it("should initialize global error handler", () => {
      expect(isGlobalErrorHandlerInitialized()).toBe(false);

      initializeGlobalErrorHandler();

      expect(isGlobalErrorHandlerInitialized()).toBe(true);
    });

    it("should return cleanup function", () => {
      const cleanup = initializeGlobalErrorHandler();

      expect(typeof cleanup).toBe("function");
      expect(isGlobalErrorHandlerInitialized()).toBe(true);

      cleanup();

      expect(isGlobalErrorHandlerInitialized()).toBe(false);
    });

    it("should prevent double initialization", () => {
      const consoleWarn = vi.spyOn(console, "warn").mockImplementation(() => {});

      initializeGlobalErrorHandler();
      initializeGlobalErrorHandler();

      expect(consoleWarn).toHaveBeenCalledWith(
        expect.stringContaining("Already initialized"),
      );

      consoleWarn.mockRestore();
    });

    it("should not initialize in non-browser environment", () => {
      const originalWindow = global.window;
      // @ts-expect-error - Testing SSR scenario
      delete global.window;

      const cleanup = initializeGlobalErrorHandler();

      expect(isGlobalErrorHandlerInitialized()).toBe(false);
      expect(cleanup).toBeInstanceOf(Function);

      global.window = originalWindow;
    });
  });

  describe("Window Error Handling", () => {
    it("should catch window errors", () => {
      initializeGlobalErrorHandler();

      const error = new Error("Test window error");
      const event = new ErrorEvent("error", {
        error,
        message: error.message,
      });

      window.dispatchEvent(event);

      expect(logger.logError).toHaveBeenCalledWith(
        expect.objectContaining({
          error,
          handled: false,
        }),
      );
    });

    it("should show toast for window errors", () => {
      initializeGlobalErrorHandler({ showToasts: true });

      const error = new Error("Test error");
      const event = new ErrorEvent("error", { error, message: error.message });

      window.dispatchEvent(event);

      expect(toastModule.toast.error).toHaveBeenCalledWith(
        expect.any(String),
        7000,
      );
    });

    it("should not show toast when showToasts is false", () => {
      initializeGlobalErrorHandler({ showToasts: false });

      const error = new Error("Test error");
      const event = new ErrorEvent("error", { error, message: error.message });

      window.dispatchEvent(event);

      expect(toastModule.toast.error).not.toHaveBeenCalled();
    });

    it("should use custom toast message generator", () => {
      initializeGlobalErrorHandler({
        getToastMessage: (error) => `Custom: ${error.message}`,
      });

      const error = new Error("Test error");
      const event = new ErrorEvent("error", { error, message: error.message });

      window.dispatchEvent(event);

      expect(toastModule.toast.error).toHaveBeenCalledWith(
        "Custom: Test error",
        7000,
      );
    });
  });

  describe("Unhandled Promise Rejection Handling", () => {
    it("should catch unhandled promise rejections", () => {
      initializeGlobalErrorHandler();

      const error = new Error("Test rejection");
      const event = new PromiseRejectionEvent("unhandledrejection", {
        promise: Promise.reject(error),
        reason: error,
      });

      window.dispatchEvent(event);

      expect(logger.logError).toHaveBeenCalledWith(
        expect.objectContaining({
          error,
          handled: false,
          context: expect.objectContaining({
            type: "UnhandledPromiseRejection",
          }),
        }),
      );
    });

    it("should handle non-Error rejection reasons", () => {
      initializeGlobalErrorHandler();

      const reason = "String rejection reason";
      const event = new PromiseRejectionEvent("unhandledrejection", {
        promise: Promise.reject(reason),
        reason,
      });

      window.dispatchEvent(event);

      expect(logger.logError).toHaveBeenCalledWith(
        expect.objectContaining({
          error: expect.objectContaining({
            message: reason,
          }),
        }),
      );
    });

    it("should show toast for promise rejections", () => {
      initializeGlobalErrorHandler({ showToasts: true });

      const error = new Error("Test rejection");
      const event = new PromiseRejectionEvent("unhandledrejection", {
        promise: Promise.reject(error),
        reason: error,
      });

      window.dispatchEvent(event);

      expect(toastModule.toast.error).toHaveBeenCalledWith(
        expect.any(String),
        7000,
      );
    });
  });

  describe("Error Categorization", () => {
    it("should categorize network errors", () => {
      initializeGlobalErrorHandler();

      const error = new Error("Network timeout");
      const event = new ErrorEvent("error", { error, message: error.message });

      window.dispatchEvent(event);

      expect(logger.logError).toHaveBeenCalledWith(
        expect.objectContaining({
          category: logger.ErrorCategory.NETWORK,
        }),
      );
    });

    it("should categorize auth errors", () => {
      initializeGlobalErrorHandler();

      const error = new Error("Unauthorized access");
      const event = new ErrorEvent("error", { error, message: error.message });

      window.dispatchEvent(event);

      expect(logger.logError).toHaveBeenCalledWith(
        expect.objectContaining({
          category: logger.ErrorCategory.AUTH,
        }),
      );
    });

    it("should categorize exercise errors", () => {
      initializeGlobalErrorHandler();

      const error = new Error("Exercise generation failed");
      const event = new ErrorEvent("error", { error, message: error.message });

      window.dispatchEvent(event);

      expect(logger.logError).toHaveBeenCalledWith(
        expect.objectContaining({
          category: logger.ErrorCategory.EXERCISE,
        }),
      );
    });

    it("should categorize data errors", () => {
      initializeGlobalErrorHandler();

      const error = new Error("Data load failed");
      const event = new ErrorEvent("error", { error, message: error.message });

      window.dispatchEvent(event);

      expect(logger.logError).toHaveBeenCalledWith(
        expect.objectContaining({
          category: logger.ErrorCategory.DATA,
        }),
      );
    });

    it("should default to general category", () => {
      initializeGlobalErrorHandler();

      const error = new Error("Unknown error");
      const event = new ErrorEvent("error", { error, message: error.message });

      window.dispatchEvent(event);

      expect(logger.logError).toHaveBeenCalledWith(
        expect.objectContaining({
          category: logger.ErrorCategory.GENERAL,
        }),
      );
    });
  });

  describe("Error Severity", () => {
    it("should detect critical errors", () => {
      initializeGlobalErrorHandler();

      const error = new Error("Critical system failure");
      const event = new ErrorEvent("error", { error, message: error.message });

      window.dispatchEvent(event);

      expect(logger.logError).toHaveBeenCalledWith(
        expect.objectContaining({
          severity: logger.ErrorSeverity.CRITICAL,
        }),
      );
    });

    it("should detect high severity errors", () => {
      initializeGlobalErrorHandler();

      const error = new Error("Unauthorized user");
      const event = new ErrorEvent("error", { error, message: error.message });

      window.dispatchEvent(event);

      expect(logger.logError).toHaveBeenCalledWith(
        expect.objectContaining({
          severity: logger.ErrorSeverity.HIGH,
        }),
      );
    });

    it("should detect low severity errors", () => {
      initializeGlobalErrorHandler();

      const error = new Error("Minor warning");
      const event = new ErrorEvent("error", { error, message: error.message });

      window.dispatchEvent(event);

      expect(logger.logError).toHaveBeenCalledWith(
        expect.objectContaining({
          severity: logger.ErrorSeverity.LOW,
        }),
      );
    });

    it("should default to medium severity", () => {
      initializeGlobalErrorHandler();

      const error = new Error("Standard error");
      const event = new ErrorEvent("error", { error, message: error.message });

      window.dispatchEvent(event);

      expect(logger.logError).toHaveBeenCalledWith(
        expect.objectContaining({
          severity: logger.ErrorSeverity.MEDIUM,
        }),
      );
    });
  });

  describe("Error Filtering", () => {
    it("should ignore ResizeObserver errors", () => {
      initializeGlobalErrorHandler();

      const error = new Error("ResizeObserver loop limit exceeded");
      const event = new ErrorEvent("error", { error, message: error.message });

      window.dispatchEvent(event);

      expect(logger.logError).not.toHaveBeenCalled();
      expect(toastModule.toast.error).not.toHaveBeenCalled();
    });

    it("should ignore browser extension errors", () => {
      initializeGlobalErrorHandler();

      const error = new Error("Chrome extension script error");
      const event = new ErrorEvent("error", { error, message: error.message });

      window.dispatchEvent(event);

      expect(logger.logError).not.toHaveBeenCalled();
    });

    it("should use custom error filter", () => {
      initializeGlobalErrorHandler({
        shouldHandleError: (error) => {
          return !(error as ErrorEvent).message?.includes("ignore");
        },
      });

      const error1 = new Error("Handle this error");
      const event1 = new ErrorEvent("error", {
        error: error1,
        message: error1.message,
      });

      window.dispatchEvent(event1);
      expect(logger.logError).toHaveBeenCalled();

      vi.clearAllMocks();

      const error2 = new Error("Please ignore this");
      const event2 = new ErrorEvent("error", {
        error: error2,
        message: error2.message,
      });

      window.dispatchEvent(event2);
      expect(logger.logError).not.toHaveBeenCalled();
    });

    it("should prevent duplicate error handling", () => {
      vi.mocked(logger.wasErrorLoggedRecently).mockReturnValue(true);

      initializeGlobalErrorHandler();

      const error = new Error("Duplicate error");
      const event = new ErrorEvent("error", { error, message: error.message });

      window.dispatchEvent(event);

      expect(logger.logError).not.toHaveBeenCalled();
      expect(toastModule.toast.error).not.toHaveBeenCalled();
    });
  });

  describe("cleanupGlobalErrorHandler", () => {
    it("should remove all error handlers", () => {
      initializeGlobalErrorHandler();
      expect(isGlobalErrorHandlerInitialized()).toBe(true);

      cleanupGlobalErrorHandler();
      expect(isGlobalErrorHandlerInitialized()).toBe(false);

      const error = new Error("After cleanup");
      const event = new ErrorEvent("error", { error, message: error.message });

      window.dispatchEvent(event);

      // Should not be logged after cleanup
      expect(logger.logError).not.toHaveBeenCalled();
    });

    it("should handle multiple cleanup calls", () => {
      initializeGlobalErrorHandler();

      cleanupGlobalErrorHandler();
      cleanupGlobalErrorHandler();
      cleanupGlobalErrorHandler();

      expect(isGlobalErrorHandlerInitialized()).toBe(false);
    });
  });

  describe("Context Capture", () => {
    it("should capture error context", () => {
      initializeGlobalErrorHandler();

      const error = new Error("Test error");
      const event = new ErrorEvent("error", {
        error,
        message: error.message,
        filename: "test.js",
        lineno: 42,
        colno: 10,
      });

      window.dispatchEvent(event);

      expect(logger.logError).toHaveBeenCalledWith(
        expect.objectContaining({
          context: expect.objectContaining({
            component: "GlobalErrorHandler",
            url: expect.any(String),
            filename: "test.js",
            lineno: 42,
            colno: 10,
          }),
        }),
      );
    });
  });
});
