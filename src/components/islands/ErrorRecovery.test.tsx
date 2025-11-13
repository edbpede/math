/**
 * ErrorRecovery Component Tests
 *
 * Tests for error recovery action buttons including:
 * - Rendering recovery actions
 * - Action handler execution
 * - Loading states
 * - Disabled states
 * - Primary action styling
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@solidjs/testing-library";
import "@testing-library/jest-dom";
import ErrorRecovery, { type RecoveryAction } from "./ErrorRecovery";
import { atom } from "nanostores";

// Mock i18n with proper nanostore
vi.mock("@/lib/i18n", () => {
  const { atom } = require("nanostores");
  return {
    $t: atom((key: string) => key),
  };
});

describe("ErrorRecovery", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Rendering", () => {
    it("renders recovery action buttons", () => {
      const actions: RecoveryAction[] = [
        { type: "retry", handler: vi.fn() },
        { type: "goHome", handler: vi.fn() },
      ];

      render(() => <ErrorRecovery actions={actions} />);

      expect(
        screen.getByRole("button", { name: /errors\.recovery\.retry/i })
      ).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: /errors\.recovery\.goHome/i })
      ).toBeInTheDocument();
    });

    it("renders custom labels", () => {
      const actions: RecoveryAction[] = [
        { type: "retry", label: "Custom Retry", handler: vi.fn() },
      ];

      render(() => <ErrorRecovery actions={actions} />);

      expect(
        screen.getByRole("button", { name: "Custom Retry" })
      ).toBeInTheDocument();
    });

    it("applies primary styling to primary actions", () => {
      const actions: RecoveryAction[] = [
        { type: "retry", handler: vi.fn(), primary: true },
        { type: "goBack", handler: vi.fn(), primary: false },
      ];

      render(() => <ErrorRecovery actions={actions} />);

      const retryButton = screen.getByRole("button", {
        name: /errors\.recovery\.retry/i,
      });
      const goBackButton = screen.getByRole("button", {
        name: /errors\.recovery\.goBack/i,
      });

      expect(retryButton).toHaveClass("bg-blue-600");
      expect(goBackButton).toHaveClass("bg-white");
    });

    it("renders disabled actions", () => {
      const actions: RecoveryAction[] = [
        { type: "retry", handler: vi.fn(), disabled: true },
      ];

      render(() => <ErrorRecovery actions={actions} />);

      const button = screen.getByRole("button", {
        name: /errors\.recovery\.retry/i,
      });
      expect(button).toBeDisabled();
    });
  });

  describe("Action handling", () => {
    it("calls handler when action button is clicked", async () => {
      const handler = vi.fn();
      const actions: RecoveryAction[] = [{ type: "retry", handler }];

      render(() => <ErrorRecovery actions={actions} />);

      const button = screen.getByRole("button", {
        name: /errors\.recovery\.retry/i,
      });
      button.click();

      await waitFor(() => {
        expect(handler).toHaveBeenCalledTimes(1);
      });
    });

    it("handles async actions", async () => {
      const handler = vi.fn().mockResolvedValue(undefined);
      const actions: RecoveryAction[] = [{ type: "retry", handler }];

      render(() => <ErrorRecovery actions={actions} />);

      const button = screen.getByRole("button", {
        name: /errors\.recovery\.retry/i,
      });
      button.click();

      await waitFor(() => {
        expect(handler).toHaveBeenCalledTimes(1);
      });
    });

    it("does not call handler when action is disabled", () => {
      const handler = vi.fn();
      const actions: RecoveryAction[] = [
        { type: "retry", handler, disabled: true },
      ];

      render(() => <ErrorRecovery actions={actions} />);

      const button = screen.getByRole("button", {
        name: /errors\.recovery\.retry/i,
      });
      button.click();

      expect(handler).not.toHaveBeenCalled();
    });

    it("handles action errors gracefully", async () => {
      const consoleErrorSpy = vi
        .spyOn(console, "error")
        .mockImplementation(() => {});
      const handler = vi.fn().mockRejectedValue(new Error("Action failed"));
      const actions: RecoveryAction[] = [{ type: "retry", handler }];

      render(() => <ErrorRecovery actions={actions} />);

      const button = screen.getByRole("button", {
        name: /errors\.recovery\.retry/i,
      });
      button.click();

      await waitFor(() => {
        expect(consoleErrorSpy).toHaveBeenCalledWith(
          "Recovery action failed:",
          expect.any(Error)
        );
      });

      consoleErrorSpy.mockRestore();
    });
  });

  describe("Accessibility", () => {
    it("has role='group' with aria-label", () => {
      const actions: RecoveryAction[] = [{ type: "retry", handler: vi.fn() }];

      render(() => <ErrorRecovery actions={actions} />);

      const group = screen.getByRole("group", {
        name: "Error recovery actions",
      });
      expect(group).toBeInTheDocument();
    });

    it("sets aria-busy during loading", async () => {
      const handler = vi.fn(
        () => new Promise<void>((resolve) => setTimeout(resolve, 100))
      );
      const actions: RecoveryAction[] = [{ type: "retry", handler }];

      render(() => <ErrorRecovery actions={actions} />);

      const button = screen.getByRole("button", {
        name: /errors\.recovery\.retry/i,
      });

      expect(button).toHaveAttribute("aria-busy", "false");

      button.click();

      await waitFor(() => {
        expect(button).toHaveAttribute("aria-busy", "true");
      });
    });
  });
});

