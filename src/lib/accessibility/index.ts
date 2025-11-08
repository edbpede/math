/**
 * Accessibility Utilities
 *
 * Central export point for all accessibility utilities.
 *
 * Requirements:
 * - 9.1: WCAG 2.1 AA compliance with keyboard navigation and screen reader support
 */

// Focus trap
export { createFocusTrap, getFirstFocusable, getLastFocusable, isFocusable } from './focus-trap'

// Keyboard shortcuts
export {
  createKeyboardShortcuts,
  createKeyboardShortcut,
  formatShortcutKey,
} from './keyboard-shortcuts'

// Screen reader announcer
export { createAnnouncer, getGlobalAnnouncer, announce } from './announcer'

// Types
export type {
  FocusTrap,
  FocusTrapOptions,
  KeyboardShortcut,
  KeyboardShortcutHandler,
  KeyboardShortcutOptions,
  KeyboardShortcutsRegistry,
  Announcer,
  AnnouncementOptions,
  AnnouncementPriority,
} from './types'

export { FOCUSABLE_SELECTOR, Keys, Modifiers } from './types'
