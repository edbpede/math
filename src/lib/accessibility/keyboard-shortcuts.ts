/**
 * Keyboard Shortcuts Utility
 *
 * Centralized keyboard shortcut management system.
 * Provides a registry for component-level and global shortcuts.
 *
 * Requirements:
 * - 9.1: Keyboard navigation for all functionality
 * - 9.1: Keyboard shortcuts for common actions
 *
 * @example
 * ```tsx
 * import { createKeyboardShortcuts } from '@/lib/accessibility/keyboard-shortcuts'
 *
 * const MyComponent = () => {
 *   const shortcuts = createKeyboardShortcuts()
 *
 *   shortcuts.register('hint', {
 *     key: 'h',
 *     description: 'Show hint',
 *     handler: () => showHint(),
 *     condition: () => !hintVisible()
 *   })
 *
 *   return <div>...</div>
 * }
 * ```
 */

import { createSignal, onCleanup, type Accessor } from 'solid-js'
import type {
  KeyboardShortcut,
  KeyboardShortcutOptions,
  KeyboardShortcutsRegistry,
} from './types'

/**
 * Parse keyboard shortcut key string
 * Supports formats like: 'h', 'ctrl+s', 'shift+?', 'meta+k'
 */
function parseShortcutKey(keyString: string): {
  key: string
  ctrl: boolean
  alt: boolean
  shift: boolean
  meta: boolean
} {
  const parts = keyString.toLowerCase().split('+')
  const modifiers = {
    ctrl: parts.includes('ctrl') || parts.includes('control'),
    alt: parts.includes('alt'),
    shift: parts.includes('shift'),
    meta: parts.includes('meta') || parts.includes('cmd') || parts.includes('command'),
  }

  // The last part is always the key
  const key = parts[parts.length - 1]

  return {
    key,
    ...modifiers,
  }
}

/**
 * Check if keyboard event matches shortcut definition
 */
function matchesShortcut(event: KeyboardEvent, shortcut: KeyboardShortcut): boolean {
  const parsed = parseShortcutKey(shortcut.key)

  // Check if key matches (case-insensitive)
  if (event.key.toLowerCase() !== parsed.key.toLowerCase()) {
    return false
  }

  // Check modifiers
  if (parsed.ctrl && !event.ctrlKey) return false
  if (!parsed.ctrl && event.ctrlKey) return false

  if (parsed.alt && !event.altKey) return false
  if (!parsed.alt && event.altKey) return false

  if (parsed.shift && !event.shiftKey) return false
  if (!parsed.shift && event.shiftKey) return false

  if (parsed.meta && !event.metaKey) return false
  if (!parsed.meta && event.metaKey) return false

  return true
}

/**
 * Check if we should ignore the shortcut due to focus on input elements
 */
function shouldIgnoreEvent(event: KeyboardEvent, shortcut: KeyboardShortcut): boolean {
  const target = event.target as HTMLElement

  // If shortcut has specific scope, check if it matches
  if (shortcut.scope) {
    const scopeElement = typeof shortcut.scope === 'function' ? shortcut.scope() : shortcut.scope
    if (scopeElement && !scopeElement.contains(target)) {
      return true
    }
  }

  // Check if user is typing in an input, textarea, or contenteditable
  const tagName = target.tagName.toLowerCase()
  const isEditable = target.isContentEditable

  if (tagName === 'input' || tagName === 'textarea' || isEditable) {
    // Allow Escape key even in input fields
    if (event.key === 'Escape') {
      return false
    }
    return true
  }

  return false
}

/**
 * Create a keyboard shortcuts registry for a component
 *
 * @param options - Keyboard shortcut options
 * @returns Keyboard shortcuts registry
 */
export function createKeyboardShortcuts(
  options: KeyboardShortcutOptions = {}
): KeyboardShortcutsRegistry {
  const [enabled, setEnabled] = createSignal(options.enabled ?? true)
  const shortcuts = new Map<string, KeyboardShortcut>()
  const debug = options.debug ?? false

  /**
   * Handle keyboard events
   */
  const handleKeyDown = (event: KeyboardEvent) => {
    if (!enabled()) return

    for (const [id, shortcut] of shortcuts.entries()) {
      // Check if event matches shortcut
      if (!matchesShortcut(event, shortcut)) {
        continue
      }

      // Check if we should ignore this event
      if (shouldIgnoreEvent(event, shortcut)) {
        continue
      }

      // Check condition if provided
      if (shortcut.condition && !shortcut.condition()) {
        continue
      }

      // Prevent default if requested
      if (shortcut.preventDefault !== false) {
        event.preventDefault()
      }

      // Stop propagation if requested
      if (shortcut.stopPropagation) {
        event.stopPropagation()
      }

      // Debug logging
      if (debug) {
        console.log(`[KeyboardShortcuts] Triggered: ${id} (${shortcut.key})`)
      }

      // Execute handler
      shortcut.handler(event)

      // Break after first match to avoid multiple handlers
      break
    }
  }

  /**
   * Register a keyboard shortcut
   */
  const register = (id: string, shortcut: KeyboardShortcut) => {
    if (shortcuts.has(id)) {
      console.warn(`[KeyboardShortcuts] Shortcut '${id}' already registered, overwriting`)
    }
    shortcuts.set(id, shortcut)

    if (debug) {
      console.log(`[KeyboardShortcuts] Registered: ${id} (${shortcut.key})`)
    }
  }

  /**
   * Unregister a keyboard shortcut
   */
  const unregister = (id: string) => {
    const removed = shortcuts.delete(id)
    if (debug && removed) {
      console.log(`[KeyboardShortcuts] Unregistered: ${id}`)
    }
  }

  /**
   * Get all registered shortcuts
   */
  const getAll = () => new Map(shortcuts)

  // Set up event listener
  if (typeof document !== 'undefined') {
    document.addEventListener('keydown', handleKeyDown)

    onCleanup(() => {
      document.removeEventListener('keydown', handleKeyDown)
    })
  }

  return {
    register,
    unregister,
    getAll,
    setEnabled,
    isEnabled: enabled,
  }
}

/**
 * Format shortcut key for display
 * Converts 'ctrl+s' to 'Ctrl+S', handles platform differences
 *
 * @param keyString - Shortcut key string
 * @returns Formatted display string
 */
export function formatShortcutKey(keyString: string): string {
  const parts = keyString.split('+')
  const formatted = parts.map((part) => {
    const lower = part.toLowerCase()

    // Handle special cases
    if (lower === 'ctrl' || lower === 'control') return 'Ctrl'
    if (lower === 'alt') return 'Alt'
    if (lower === 'shift') return 'Shift'
    if (lower === 'meta' || lower === 'cmd' || lower === 'command') {
      // Use ⌘ on Mac, Ctrl on other platforms
      if (typeof navigator !== 'undefined' && navigator.platform.includes('Mac')) {
        return '⌘'
      }
      return 'Ctrl'
    }

    // Handle special keys
    if (lower === 'escape' || lower === 'esc') return 'Esc'
    if (lower === 'enter' || lower === 'return') return 'Enter'
    if (lower === 'space') return 'Space'
    if (lower === 'arrowup') return '↑'
    if (lower === 'arrowdown') return '↓'
    if (lower === 'arrowleft') return '←'
    if (lower === 'arrowright') return '→'

    // Capitalize first letter
    return part.charAt(0).toUpperCase() + part.slice(1)
  })

  return formatted.join('+')
}

/**
 * Create a simple keyboard shortcut hook for a single shortcut
 * Simpler API for components that only need one shortcut
 *
 * @param key - Shortcut key string
 * @param handler - Handler function
 * @param condition - Optional condition to enable shortcut
 */
export function createKeyboardShortcut(
  key: Accessor<string> | string,
  handler: (event: KeyboardEvent) => void,
  condition?: Accessor<boolean> | (() => boolean)
) {
  const shortcuts = createKeyboardShortcuts()

  const keyValue = typeof key === 'function' ? key() : key
  const conditionFn = typeof condition === 'function' ? condition : undefined

  shortcuts.register('shortcut', {
    key: keyValue,
    handler,
    condition: conditionFn,
  })

  return shortcuts
}
