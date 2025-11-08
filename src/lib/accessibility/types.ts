/**
 * Accessibility Types
 *
 * TypeScript types and interfaces for accessibility utilities
 *
 * Requirements:
 * - 9.1: WCAG 2.1 AA compliance with keyboard navigation and ARIA
 */

/**
 * Options for focus trap behavior
 */
export interface FocusTrapOptions {
  /** Element to receive focus when trap is activated */
  initialFocus?: HTMLElement | (() => HTMLElement | undefined)
  /** Element to receive focus when trap is deactivated */
  returnFocus?: HTMLElement | (() => HTMLElement | undefined)
  /** Callback when focus trap is activated */
  onActivate?: () => void
  /** Callback when focus trap is deactivated */
  onDeactivate?: () => void
  /** Allow focus to escape the trap (default: false) */
  allowEscape?: boolean
  /** Prevent body scroll when trap is active (default: false) */
  preventScroll?: boolean
}

/**
 * Focus trap return object
 */
export interface FocusTrap {
  /** Activate the focus trap */
  activate: () => void
  /** Deactivate the focus trap */
  deactivate: () => void
  /** Whether the focus trap is currently active */
  isActive: () => boolean
}

/**
 * Keyboard shortcut handler function
 */
export type KeyboardShortcutHandler = (event: KeyboardEvent) => void

/**
 * Keyboard shortcut definition
 */
export interface KeyboardShortcut {
  /** Key or key combination (e.g., 'h', 'ctrl+s', 'shift+?') */
  key: string
  /** Handler function to execute */
  handler: KeyboardShortcutHandler
  /** Description for help/documentation */
  description?: string
  /** Only trigger when specific element has focus */
  scope?: HTMLElement | (() => HTMLElement | undefined)
  /** Prevent default browser behavior (default: true) */
  preventDefault?: boolean
  /** Stop event propagation (default: false) */
  stopPropagation?: boolean
  /** Only trigger when this condition is true */
  condition?: () => boolean
}

/**
 * Options for keyboard shortcut system
 */
export interface KeyboardShortcutOptions {
  /** Enable/disable all shortcuts (default: true) */
  enabled?: boolean
  /** Log shortcut activations to console (default: false) */
  debug?: boolean
}

/**
 * Keyboard shortcuts registry return object
 */
export interface KeyboardShortcutsRegistry {
  /** Register a new shortcut */
  register: (id: string, shortcut: KeyboardShortcut) => void
  /** Unregister a shortcut */
  unregister: (id: string) => void
  /** Get all registered shortcuts */
  getAll: () => Map<string, KeyboardShortcut>
  /** Enable/disable shortcuts */
  setEnabled: (enabled: boolean) => void
  /** Check if shortcuts are enabled */
  isEnabled: () => boolean
}

/**
 * Screen reader announcement priority
 */
export type AnnouncementPriority = 'polite' | 'assertive'

/**
 * Screen reader announcement options
 */
export interface AnnouncementOptions {
  /** Priority level (default: 'polite') */
  priority?: AnnouncementPriority
  /** Delay before announcement in milliseconds (default: 0) */
  delay?: number
  /** Clear previous announcements before this one (default: false) */
  clearQueue?: boolean
}

/**
 * Screen reader announcer return object
 */
export interface Announcer {
  /** Announce a message to screen readers */
  announce: (message: string, options?: AnnouncementOptions) => void
  /** Clear all pending announcements */
  clear: () => void
  /** Destroy the announcer and remove from DOM */
  destroy: () => void
}

/**
 * Focusable element selector
 * Used to query all focusable elements within a container
 */
export const FOCUSABLE_SELECTOR = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
  'audio[controls]',
  'video[controls]',
  '[contenteditable]:not([contenteditable="false"])',
].join(', ')

/**
 * Key codes for common keyboard shortcuts
 */
export const Keys = {
  ESCAPE: 'Escape',
  ENTER: 'Enter',
  SPACE: ' ',
  TAB: 'Tab',
  ARROW_UP: 'ArrowUp',
  ARROW_DOWN: 'ArrowDown',
  ARROW_LEFT: 'ArrowLeft',
  ARROW_RIGHT: 'ArrowRight',
  HOME: 'Home',
  END: 'End',
  PAGE_UP: 'PageUp',
  PAGE_DOWN: 'PageDown',
} as const

/**
 * Modifier keys
 */
export const Modifiers = {
  CTRL: 'ctrlKey',
  ALT: 'altKey',
  SHIFT: 'shiftKey',
  META: 'metaKey', // Command on Mac, Windows key on PC
} as const
