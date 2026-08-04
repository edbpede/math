/**
 * Accessibility Utilities
 *
 * Central export point for all accessibility utilities.
 *
 * Requirements:
 * - 9.1: WCAG 2.1 AA compliance with keyboard navigation and screen reader support
 */

// Screen reader announcer
export { announce, createAnnouncer, getGlobalAnnouncer } from "./announcer";
// Focus trap
export { createFocusTrap, getFirstFocusable, getLastFocusable, isFocusable } from "./focus-trap";
// Keyboard shortcuts
export {
  createKeyboardShortcut,
  createKeyboardShortcuts,
  formatShortcutKey,
} from "./keyboard-shortcuts";

// Types
export type {
  AnnouncementOptions,
  AnnouncementPriority,
  Announcer,
  FocusTrap,
  FocusTrapOptions,
  KeyboardShortcut,
  KeyboardShortcutHandler,
  KeyboardShortcutOptions,
  KeyboardShortcutsRegistry,
} from "./types";

export { FOCUSABLE_SELECTOR, Keys, Modifiers } from "./types";
