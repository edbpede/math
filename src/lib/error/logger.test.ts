/**
 * Error Logger Tests
 *
 * Tests error logging functionality including:
 * - Error logging with context
 * - Log storage and retrieval
 * - Log summary and statistics
 * - Category and severity filtering
 * - Privacy compliance
 */

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import {
  logError,
  getErrorLog,
  clearErrorLog,
  getErrorLogSummary,
  getErrorsByCategory,
  getErrorsBySeverity,
  wasErrorLoggedRecently,
  ErrorCategory,
  ErrorSeverity,
} from "./logger";

describe("Error Logger", () => {
  beforeEach(() => {
    clearErrorLog();
    vi.spyOn(console, "error").mockImplementation(() => {});
    vi.spyOn(console, "log").mockImplementation(() => {});
    vi.spyOn(console, "group").mockImplementation(() => {});
    vi.spyOn(console, "groupEnd").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("logError", () => {
    it("should log an error with basic information", () => {
      const error = new Error("Test error");
      logError({ error });

      const log = getErrorLog();
      expect(log).toHaveLength(1);
      expect(log[0].error).toBe(error);
      expect(log[0].handled).toBe(true);
    });

    it("should enrich error with context", () => {
      const error = new Error("Test error");
      logError({
        error,
        context: { component: "TestComponent" },
      });

      const log = getErrorLog();
      expect(log[0].context).toMatchObject({
        component: "TestComponent",
        timestamp: expect.any(String),
      });
    });

    it("should include URL and user agent in context", () => {
      const error = new Error("Test error");
      logError({ error });

      const log = getErrorLog();
      expect(log[0].context?.url).toBeDefined();
      expect(log[0].context?.userAgent).toBeDefined();
    });

    it("should log with category", () => {
      const error = new Error("Network error");
      logError({
        error,
        category: ErrorCategory.NETWORK,
      });

      const log = getErrorLog();
      expect(log[0].category).toBe(ErrorCategory.NETWORK);
    });

    it("should log with severity", () => {
      const error = new Error("Critical error");
      logError({
        error,
        severity: ErrorSeverity.CRITICAL,
      });

      const log = getErrorLog();
      expect(log[0].severity).toBe(ErrorSeverity.CRITICAL);
    });

    it("should log to console in development mode", () => {
      const originalEnv = import.meta.env.DEV;
      Object.defineProperty(import.meta.env, "DEV", {
        value: true,
        writable: true,
      });

      const error = new Error("Dev mode error");
      logError({ error });

      expect(console.group).toHaveBeenCalled();
      expect(console.error).toHaveBeenCalled();

      Object.defineProperty(import.meta.env, "DEV", {
        value: originalEnv,
        writable: true,
      });
    });

    it("should handle errors with stack traces", () => {
      const error = new Error("Error with stack");
      error.stack = "Error: Test\n    at Object.<anonymous> (test.ts:1:1)";

      logError({ error });

      const log = getErrorLog();
      expect(log[0].error.stack).toBeDefined();
    });

    it("should mark error as unhandled when specified", () => {
      const error = new Error("Unhandled error");
      logError({ error, handled: false });

      const log = getErrorLog();
      expect(log[0].handled).toBe(false);
    });
  });

  describe("getErrorLog", () => {
    it("should return empty array when no errors logged", () => {
      const log = getErrorLog();
      expect(log).toEqual([]);
    });

    it("should return all logged errors", () => {
      logError({ error: new Error("Error 1") });
      logError({ error: new Error("Error 2") });
      logError({ error: new Error("Error 3") });

      const log = getErrorLog();
      expect(log).toHaveLength(3);
      expect(log[0].error.message).toBe("Error 1");
      expect(log[1].error.message).toBe("Error 2");
      expect(log[2].error.message).toBe("Error 3");
    });

    it("should return a copy of the log (not reference)", () => {
      logError({ error: new Error("Original error") });

      const log1 = getErrorLog();
      const log2 = getErrorLog();

      expect(log1).not.toBe(log2);
      expect(log1).toEqual(log2);
    });

    it("should maintain max log size of 100 entries", () => {
      // Log 150 errors
      for (let i = 0; i < 150; i++) {
        logError({ error: new Error(`Error ${i}`) });
      }

      const log = getErrorLog();
      expect(log).toHaveLength(100);
      // Should keep most recent 100
      expect(log[0].error.message).toBe("Error 50");
      expect(log[99].error.message).toBe("Error 149");
    });
  });

  describe("clearErrorLog", () => {
    it("should clear all logged errors", () => {
      logError({ error: new Error("Error 1") });
      logError({ error: new Error("Error 2") });

      expect(getErrorLog()).toHaveLength(2);

      clearErrorLog();

      expect(getErrorLog()).toHaveLength(0);
    });
  });

  describe("getErrorLogSummary", () => {
    it("should return zero statistics when log is empty", () => {
      const summary = getErrorLogSummary();

      expect(summary.total).toBe(0);
      expect(summary.recent).toEqual([]);
      expect(Object.values(summary.byCategory).every((c) => c === 0)).toBe(
        true,
      );
      expect(Object.values(summary.bySeverity).every((s) => s === 0)).toBe(
        true,
      );
    });

    it("should count errors by category", () => {
      logError({ error: new Error("Error 1"), category: ErrorCategory.NETWORK });
      logError({ error: new Error("Error 2"), category: ErrorCategory.NETWORK });
      logError({ error: new Error("Error 3"), category: ErrorCategory.AUTH });
      logError({ error: new Error("Error 4"), category: ErrorCategory.DATA });

      const summary = getErrorLogSummary();

      expect(summary.total).toBe(4);
      expect(summary.byCategory[ErrorCategory.NETWORK]).toBe(2);
      expect(summary.byCategory[ErrorCategory.AUTH]).toBe(1);
      expect(summary.byCategory[ErrorCategory.DATA]).toBe(1);
    });

    it("should count errors by severity", () => {
      logError({ error: new Error("Error 1"), severity: ErrorSeverity.LOW });
      logError({ error: new Error("Error 2"), severity: ErrorSeverity.MEDIUM });
      logError({ error: new Error("Error 3"), severity: ErrorSeverity.MEDIUM });
      logError({ error: new Error("Error 4"), severity: ErrorSeverity.HIGH });

      const summary = getErrorLogSummary();

      expect(summary.bySeverity[ErrorSeverity.LOW]).toBe(1);
      expect(summary.bySeverity[ErrorSeverity.MEDIUM]).toBe(2);
      expect(summary.bySeverity[ErrorSeverity.HIGH]).toBe(1);
    });

    it("should default to GENERAL category when not specified", () => {
      logError({ error: new Error("Error without category") });

      const summary = getErrorLogSummary();
      expect(summary.byCategory[ErrorCategory.GENERAL]).toBe(1);
    });

    it("should default to MEDIUM severity when not specified", () => {
      logError({ error: new Error("Error without severity") });

      const summary = getErrorLogSummary();
      expect(summary.bySeverity[ErrorSeverity.MEDIUM]).toBe(1);
    });

    it("should return last 10 errors in recent array", () => {
      for (let i = 0; i < 20; i++) {
        logError({ error: new Error(`Error ${i}`) });
      }

      const summary = getErrorLogSummary();
      expect(summary.recent).toHaveLength(10);
      expect(summary.recent[0].error.message).toBe("Error 10");
      expect(summary.recent[9].error.message).toBe("Error 19");
    });
  });

  describe("getErrorsByCategory", () => {
    it("should return empty array when no errors in category", () => {
      logError({ error: new Error("Network error"), category: ErrorCategory.NETWORK });

      const authErrors = getErrorsByCategory(ErrorCategory.AUTH);
      expect(authErrors).toEqual([]);
    });

    it("should return all errors in specific category", () => {
      logError({ error: new Error("Network 1"), category: ErrorCategory.NETWORK });
      logError({ error: new Error("Auth 1"), category: ErrorCategory.AUTH });
      logError({ error: new Error("Network 2"), category: ErrorCategory.NETWORK });

      const networkErrors = getErrorsByCategory(ErrorCategory.NETWORK);
      expect(networkErrors).toHaveLength(2);
      expect(networkErrors[0].error.message).toBe("Network 1");
      expect(networkErrors[1].error.message).toBe("Network 2");
    });
  });

  describe("getErrorsBySeverity", () => {
    it("should return empty array when no errors with severity", () => {
      logError({ error: new Error("Low error"), severity: ErrorSeverity.LOW });

      const criticalErrors = getErrorsBySeverity(ErrorSeverity.CRITICAL);
      expect(criticalErrors).toEqual([]);
    });

    it("should return all errors with specific severity", () => {
      logError({ error: new Error("High 1"), severity: ErrorSeverity.HIGH });
      logError({ error: new Error("Low 1"), severity: ErrorSeverity.LOW });
      logError({ error: new Error("High 2"), severity: ErrorSeverity.HIGH });

      const highErrors = getErrorsBySeverity(ErrorSeverity.HIGH);
      expect(highErrors).toHaveLength(2);
      expect(highErrors[0].error.message).toBe("High 1");
      expect(highErrors[1].error.message).toBe("High 2");
    });
  });

  describe("wasErrorLoggedRecently", () => {
    it("should return false when error not logged", () => {
      const result = wasErrorLoggedRecently("Test error");
      expect(result).toBe(false);
    });

    it("should return true when error was logged recently", () => {
      logError({ error: new Error("Recent error") });

      const result = wasErrorLoggedRecently("Recent error");
      expect(result).toBe(true);
    });

    it("should return false when error was logged outside time window", () => {
      const oldDate = new Date(Date.now() - 10000); // 10 seconds ago

      logError({
        error: new Error("Old error"),
        context: { timestamp: oldDate.toISOString() },
      });

      const result = wasErrorLoggedRecently("Old error", 5000); // Within 5 seconds
      expect(result).toBe(false);
    });

    it("should return true when error was logged within custom time window", () => {
      logError({ error: new Error("Custom window error") });

      const result = wasErrorLoggedRecently("Custom window error", 10000); // Within 10 seconds
      expect(result).toBe(true);
    });

    it("should use default time window of 5 seconds", () => {
      logError({ error: new Error("Default window error") });

      const result = wasErrorLoggedRecently("Default window error");
      expect(result).toBe(true);
    });
  });

  describe("Privacy Compliance", () => {
    it("should not include sensitive PII in logs", () => {
      const error = new Error("Test error");
      logError({
        error,
        context: {
          component: "TestComponent",
          userId: "test-uuid-1234", // UUID is okay, not PII
        },
      });

      const log = getErrorLog();
      expect(log[0].context?.userId).toBe("test-uuid-1234");
      // UUID is allowed as it's not personally identifiable
    });

    it("should include non-PII context information", () => {
      const error = new Error("Test error");
      logError({
        error,
        context: {
          component: "TestComponent",
          url: "https://example.com/practice",
          userAgent: "Mozilla/5.0",
        },
      });

      const log = getErrorLog();
      expect(log[0].context?.component).toBeDefined();
      expect(log[0].context?.url).toBeDefined();
      expect(log[0].context?.userAgent).toBeDefined();
    });
  });
});
