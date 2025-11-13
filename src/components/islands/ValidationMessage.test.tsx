/**
 * ValidationMessage Component Tests
 *
 * Tests for inline validation message component including:
 * - Rendering different message types
 * - Visibility control
 * - Dismissible functionality
 * - Accessibility features (ARIA attributes)
 */

import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@solidjs/testing-library";
import "@testing-library/jest-dom";
import ValidationMessage from "./ValidationMessage";

describe("ValidationMessage", () => {
  describe("Rendering", () => {
    it("renders error message", () => {
      render(() => (
        <ValidationMessage type="error" message="This is an error" />
      ));

      expect(screen.getByRole("alert")).toBeInTheDocument();
      expect(screen.getByText("This is an error")).toBeInTheDocument();
    });

    it("renders warning message", () => {
      render(() => (
        <ValidationMessage type="warning" message="This is a warning" />
      ));

      expect(screen.getByText("This is a warning")).toBeInTheDocument();
    });

    it("renders success message", () => {
      render(() => (
        <ValidationMessage type="success" message="Success!" />
      ));

      expect(screen.getByText("Success!")).toBeInTheDocument();
    });

    it("renders info message", () => {
      render(() => (
        <ValidationMessage type="info" message="Information" />
      ));

      expect(screen.getByText("Information")).toBeInTheDocument();
    });

    it("does not render when visible is false", () => {
      render(() => (
        <ValidationMessage
          type="error"
          message="Hidden message"
          visible={false}
        />
      ));

      expect(screen.queryByText("Hidden message")).not.toBeInTheDocument();
    });

    it("renders with custom ID", () => {
      render(() => (
        <ValidationMessage
          type="error"
          message="Error"
          id="custom-error-id"
        />
      ));

      const alert = screen.getByRole("alert");
      expect(alert).toHaveAttribute("id", "custom-error-id");
    });

    it("renders with custom class", () => {
      render(() => (
        <ValidationMessage
          type="error"
          message="Error"
          class="custom-class"
        />
      ));

      const alert = screen.getByRole("alert");
      expect(alert).toHaveClass("custom-class");
    });
  });

  describe("Accessibility", () => {
    it("has role='alert'", () => {
      render(() => <ValidationMessage type="error" message="Error" />);

      expect(screen.getByRole("alert")).toBeInTheDocument();
    });

    it("has aria-live='polite'", () => {
      render(() => <ValidationMessage type="error" message="Error" />);

      const alert = screen.getByRole("alert");
      expect(alert).toHaveAttribute("aria-live", "polite");
    });

    it("has aria-atomic='true'", () => {
      render(() => <ValidationMessage type="error" message="Error" />);

      const alert = screen.getByRole("alert");
      expect(alert).toHaveAttribute("aria-atomic", "true");
    });

    it("icon has aria-hidden='true'", () => {
      render(() => <ValidationMessage type="error" message="Error" />);

      const svg = screen.getByRole("alert").querySelector("svg");
      expect(svg).toHaveAttribute("aria-hidden", "true");
    });
  });

  describe("Dismissible functionality", () => {
    it("does not show dismiss button when not dismissible", () => {
      render(() => (
        <ValidationMessage type="error" message="Error" dismissible={false} />
      ));

      expect(
        screen.queryByRole("button", { name: /dismiss/i })
      ).not.toBeInTheDocument();
    });

    it("shows dismiss button when dismissible", () => {
      const onDismiss = vi.fn();
      render(() => (
        <ValidationMessage
          type="error"
          message="Error"
          dismissible={true}
          onDismiss={onDismiss}
        />
      ));

      expect(
        screen.getByRole("button", { name: /dismiss/i })
      ).toBeInTheDocument();
    });

    it("calls onDismiss when dismiss button is clicked", async () => {
      const onDismiss = vi.fn();
      render(() => (
        <ValidationMessage
          type="error"
          message="Error"
          dismissible={true}
          onDismiss={onDismiss}
        />
      ));

      const dismissButton = screen.getByRole("button", { name: /dismiss/i });
      dismissButton.click();

      expect(onDismiss).toHaveBeenCalledTimes(1);
    });
  });
});

