/**
 * ToastNotification Component Tests
 *
 * Tests toast notification functionality including:
 * - Toast display and dismissal
 * - Multiple toast types
 * - Auto-dismiss functionality
 * - Manual dismissal
 * - Screen reader announcements
 * - Accessibility features
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@solidjs/testing-library";
import "@testing-library/jest-dom";
import {
  ToastContainer,
  showToast,
  dismissToast,
  dismissAllToasts,
  toast,
} from "./ToastNotification";
import * as announcer from "@/lib/accessibility/announcer";

// Mock the announcer
vi.mock("@/lib/accessibility/announcer", () => ({
  announce: vi.fn(),
}));

describe("ToastNotification", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    dismissAllToasts();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  describe("ToastContainer", () => {
    it("should render without toasts initially", () => {
      render(() => <ToastContainer />);
      expect(screen.queryByRole("status")).not.toBeInTheDocument();
    });

    it("should display a toast when showToast is called", () => {
      render(() => <ToastContainer />);

      showToast({ message: "Test message" });

      expect(screen.getByText("Test message")).toBeInTheDocument();
    });

    it("should display multiple toasts", () => {
      render(() => <ToastContainer />);

      showToast({ message: "Toast 1" });
      showToast({ message: "Toast 2" });
      showToast({ message: "Toast 3" });

      expect(screen.getByText("Toast 1")).toBeInTheDocument();
      expect(screen.getByText("Toast 2")).toBeInTheDocument();
      expect(screen.getByText("Toast 3")).toBeInTheDocument();
    });
  });

  describe("showToast", () => {
    it("should return a unique ID", () => {
      const id1 = showToast({ message: "Toast 1" });
      const id2 = showToast({ message: "Toast 2" });

      expect(id1).toBeTruthy();
      expect(id2).toBeTruthy();
      expect(id1).not.toBe(id2);
    });

    it("should announce toast to screen readers by default", () => {
      showToast({ message: "Test message" });

      expect(announcer.announce).toHaveBeenCalledWith(
        "Test message",
        expect.objectContaining({ priority: "polite" }),
      );
    });

    it("should announce error toasts with assertive priority", () => {
      showToast({ type: "error", message: "Error message" });

      expect(announcer.announce).toHaveBeenCalledWith(
        "Error message",
        expect.objectContaining({ priority: "assertive" }),
      );
    });

    it("should not announce when announce option is false", () => {
      showToast({ message: "Test message", announce: false });

      expect(announcer.announce).not.toHaveBeenCalled();
    });

    it("should auto-dismiss after duration", async () => {
      render(() => <ToastContainer />);

      showToast({ message: "Auto dismiss", duration: 3000 });

      expect(screen.getByText("Auto dismiss")).toBeInTheDocument();

      // Fast-forward time
      vi.advanceTimersByTime(3000);

      await waitFor(() => {
        expect(screen.queryByText("Auto dismiss")).not.toBeInTheDocument();
      });
    });

    it("should not auto-dismiss when duration is 0", () => {
      render(() => <ToastContainer />);

      showToast({ message: "No auto dismiss", duration: 0 });

      expect(screen.getByText("No auto dismiss")).toBeInTheDocument();

      // Fast-forward time
      vi.advanceTimersByTime(10000);

      expect(screen.getByText("No auto dismiss")).toBeInTheDocument();
    });

    it("should use default duration of 5000ms", async () => {
      render(() => <ToastContainer />);

      showToast({ message: "Default duration" });

      expect(screen.getByText("Default duration")).toBeInTheDocument();

      // Fast-forward to just before default duration
      vi.advanceTimersByTime(4999);
      expect(screen.getByText("Default duration")).toBeInTheDocument();

      // Fast-forward past default duration
      vi.advanceTimersByTime(1);

      await waitFor(() => {
        expect(screen.queryByText("Default duration")).not.toBeInTheDocument();
      });
    });
  });

  describe("Toast Types", () => {
    it("should display success toast with correct styling", () => {
      render(() => <ToastContainer />);

      showToast({ type: "success", message: "Success message" });

      const toastElement = screen.getByText("Success message").closest("div");
      expect(toastElement).toHaveClass("bg-green-50");
    });

    it("should display error toast with correct styling", () => {
      render(() => <ToastContainer />);

      showToast({ type: "error", message: "Error message" });

      const toastElement = screen.getByText("Error message").closest("div");
      expect(toastElement).toHaveClass("bg-red-50");
    });

    it("should display warning toast with correct styling", () => {
      render(() => <ToastContainer />);

      showToast({ type: "warning", message: "Warning message" });

      const toastElement = screen.getByText("Warning message").closest("div");
      expect(toastElement).toHaveClass("bg-yellow-50");
    });

    it("should display info toast with correct styling", () => {
      render(() => <ToastContainer />);

      showToast({ type: "info", message: "Info message" });

      const toastElement = screen.getByText("Info message").closest("div");
      expect(toastElement).toHaveClass("bg-blue-50");
    });
  });

  describe("dismissToast", () => {
    it("should dismiss specific toast by ID", async () => {
      render(() => <ToastContainer />);

      const id1 = showToast({ message: "Toast 1", duration: 0 });
      showToast({ message: "Toast 2", duration: 0 });

      expect(screen.getByText("Toast 1")).toBeInTheDocument();
      expect(screen.getByText("Toast 2")).toBeInTheDocument();

      dismissToast(id1);

      await waitFor(() => {
        expect(screen.queryByText("Toast 1")).not.toBeInTheDocument();
      });
      expect(screen.getByText("Toast 2")).toBeInTheDocument();
    });

    it("should allow manual dismissal when dismissible is true", async () => {
      render(() => <ToastContainer />);

      showToast({ message: "Dismissible toast", dismissible: true, duration: 0 });

      const dismissButton = screen.getByLabelText(/dismiss|luk/i);
      expect(dismissButton).toBeInTheDocument();

      fireEvent.click(dismissButton);

      await waitFor(() => {
        expect(screen.queryByText("Dismissible toast")).not.toBeInTheDocument();
      });
    });

    it("should not show dismiss button when dismissible is false", () => {
      render(() => <ToastContainer />);

      showToast({
        message: "Non-dismissible toast",
        dismissible: false,
        duration: 0,
      });

      expect(screen.queryByLabelText(/dismiss|luk/i)).not.toBeInTheDocument();
    });
  });

  describe("dismissAllToasts", () => {
    it("should dismiss all toasts", async () => {
      render(() => <ToastContainer />);

      showToast({ message: "Toast 1", duration: 0 });
      showToast({ message: "Toast 2", duration: 0 });
      showToast({ message: "Toast 3", duration: 0 });

      expect(screen.getByText("Toast 1")).toBeInTheDocument();
      expect(screen.getByText("Toast 2")).toBeInTheDocument();
      expect(screen.getByText("Toast 3")).toBeInTheDocument();

      dismissAllToasts();

      await waitFor(() => {
        expect(screen.queryByText("Toast 1")).not.toBeInTheDocument();
        expect(screen.queryByText("Toast 2")).not.toBeInTheDocument();
        expect(screen.queryByText("Toast 3")).not.toBeInTheDocument();
      });
    });
  });

  describe("Convenience Functions", () => {
    it("should show success toast using toast.success", () => {
      render(() => <ToastContainer />);

      toast.success("Success!");

      expect(screen.getByText("Success!")).toBeInTheDocument();
      const toastElement = screen.getByText("Success!").closest("div");
      expect(toastElement).toHaveClass("bg-green-50");
    });

    it("should show error toast using toast.error", () => {
      render(() => <ToastContainer />);

      toast.error("Error!");

      expect(screen.getByText("Error!")).toBeInTheDocument();
      const toastElement = screen.getByText("Error!").closest("div");
      expect(toastElement).toHaveClass("bg-red-50");
    });

    it("should show info toast using toast.info", () => {
      render(() => <ToastContainer />);

      toast.info("Info!");

      expect(screen.getByText("Info!")).toBeInTheDocument();
      const toastElement = screen.getByText("Info!").closest("div");
      expect(toastElement).toHaveClass("bg-blue-50");
    });

    it("should show warning toast using toast.warning", () => {
      render(() => <ToastContainer />);

      toast.warning("Warning!");

      expect(screen.getByText("Warning!")).toBeInTheDocument();
      const toastElement = screen.getByText("Warning!").closest("div");
      expect(toastElement).toHaveClass("bg-yellow-50");
    });

    it("should dismiss toast using toast.dismiss", async () => {
      render(() => <ToastContainer />);

      const id = toast.info("Dismiss me", 0);

      expect(screen.getByText("Dismiss me")).toBeInTheDocument();

      toast.dismiss(id);

      await waitFor(() => {
        expect(screen.queryByText("Dismiss me")).not.toBeInTheDocument();
      });
    });

    it("should dismiss all toasts using toast.dismissAll", async () => {
      render(() => <ToastContainer />);

      toast.success("Toast 1", 0);
      toast.error("Toast 2", 0);
      toast.info("Toast 3", 0);

      expect(screen.getByText("Toast 1")).toBeInTheDocument();
      expect(screen.getByText("Toast 2")).toBeInTheDocument();
      expect(screen.getByText("Toast 3")).toBeInTheDocument();

      toast.dismissAll();

      await waitFor(() => {
        expect(screen.queryByText("Toast 1")).not.toBeInTheDocument();
        expect(screen.queryByText("Toast 2")).not.toBeInTheDocument();
        expect(screen.queryByText("Toast 3")).not.toBeInTheDocument();
      });
    });
  });

  describe("Accessibility", () => {
    it("should have role='status' on toast items", () => {
      render(() => <ToastContainer />);

      showToast({ message: "Accessible toast" });

      const toast = screen.getByRole("status");
      expect(toast).toBeInTheDocument();
    });

    it("should have aria-live='polite' for info toasts", () => {
      render(() => <ToastContainer />);

      showToast({ type: "info", message: "Info toast" });

      const toast = screen.getByRole("status");
      expect(toast).toHaveAttribute("aria-live", "polite");
    });

    it("should have aria-live='assertive' for error toasts", () => {
      render(() => <ToastContainer />);

      showToast({ type: "error", message: "Error toast" });

      const toast = screen.getByRole("status");
      expect(toast).toHaveAttribute("aria-live", "assertive");
    });

    it("should have aria-atomic='true' on toast items", () => {
      render(() => <ToastContainer />);

      showToast({ message: "Atomic toast" });

      const toast = screen.getByRole("status");
      expect(toast).toHaveAttribute("aria-atomic", "true");
    });

    it("should have accessible dismiss button label", () => {
      render(() => <ToastContainer />);

      showToast({ message: "Dismissible toast", dismissible: true });

      const dismissButton = screen.getByLabelText(/dismiss|luk/i);
      expect(dismissButton).toHaveAttribute("aria-label");
    });

    it("should hide icons from screen readers", () => {
      render(() => <ToastContainer />);

      showToast({ message: "Toast with icon" });

      const svgs = screen.getAllByRole("status")[0].querySelectorAll("svg");
      svgs.forEach((svg) => {
        expect(svg).toHaveAttribute("aria-hidden", "true");
      });
    });
  });

  describe("Animations", () => {
    it("should apply slide-in animation class", () => {
      render(() => <ToastContainer />);

      showToast({ message: "Animated toast" });

      const toastElement = screen.getByText("Animated toast").closest("div");
      expect(toastElement).toHaveClass("animate-slide-in-top");
    });
  });

  describe("SSR Compatibility", () => {
    it("should not render on server-side", () => {
      // Mock server environment
      const originalWindow = global.window;
      // @ts-expect-error - Testing SSR scenario
      delete global.window;

      const { container } = render(() => <ToastContainer />);

      expect(container.firstChild).toBeNull();

      // Restore
      global.window = originalWindow;
    });
  });
});
