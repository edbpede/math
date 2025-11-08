/**
 * Focus Trap Utility
 *
 * Reusable focus trap implementation for modals, drawers, and overlays.
 * Based on the pattern from MobileNav component.
 *
 * Requirements:
 * - 9.1: Keyboard navigation for all functionality
 * - 9.1: Focus management for modals and overlays
 *
 * @example
 * ```tsx
 * import { createFocusTrap } from '@/lib/accessibility/focus-trap'
 *
 * const MyModal = () => {
 *   const [isOpen, setIsOpen] = createSignal(false)
 *   let containerRef: HTMLElement | undefined
 *
 *   const focusTrap = createFocusTrap(() => containerRef, {
 *     preventScroll: true,
 *     onDeactivate: () => setIsOpen(false)
 *   })
 *
 *   createEffect(() => {
 *     if (isOpen()) {
 *       focusTrap.activate()
 *     } else {
 *       focusTrap.deactivate()
 *     }
 *   })
 *
 *   return <div ref={containerRef}>...</div>
 * }
 * ```
 */

import { createSignal, onCleanup, type Accessor } from 'solid-js'
import type { FocusTrap, FocusTrapOptions } from './types'
import { FOCUSABLE_SELECTOR } from './types'

/**
 * Create a focus trap for a container element
 *
 * @param containerRef - Accessor or function returning the container element
 * @param options - Focus trap options
 * @returns Focus trap control object
 */
export function createFocusTrap(
  containerRef: Accessor<HTMLElement | undefined> | (() => HTMLElement | undefined),
  options: FocusTrapOptions = {}
): FocusTrap {
  const [isActive, setIsActive] = createSignal(false)
  let previousActiveElement: HTMLElement | null = null

  const {
    initialFocus,
    returnFocus,
    onActivate,
    onDeactivate,
    allowEscape = false,
    preventScroll = false,
  } = options

  /**
   * Get all focusable elements within the container
   */
  const getFocusableElements = (): HTMLElement[] => {
    const container = typeof containerRef === 'function' ? containerRef() : undefined
    if (!container) return []

    const elements = container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)
    return Array.from(elements).filter((el) => {
      // Filter out elements that are not visible or have display: none
      return el.offsetParent !== null || el === document.activeElement
    })
  }

  /**
   * Handle Tab key navigation to trap focus
   */
  const handleKeyDown = (event: KeyboardEvent) => {
    if (!isActive()) return

    if (event.key === 'Tab') {
      const focusableElements = getFocusableElements()
      if (focusableElements.length === 0) {
        event.preventDefault()
        return
      }

      const firstElement = focusableElements[0]
      const lastElement = focusableElements[focusableElements.length - 1]

      if (event.shiftKey) {
        // Shift + Tab: Moving backwards
        if (document.activeElement === firstElement) {
          event.preventDefault()
          lastElement?.focus()
        }
      } else {
        // Tab: Moving forwards
        if (document.activeElement === lastElement) {
          event.preventDefault()
          firstElement?.focus()
        }
      }
    } else if (event.key === 'Escape' && allowEscape) {
      // Allow Escape to deactivate if allowEscape is true
      event.preventDefault()
      deactivate()
    }
  }

  /**
   * Handle focus events to keep focus within container
   */
  const handleFocusIn = (event: FocusEvent) => {
    if (!isActive()) return

    const container = typeof containerRef === 'function' ? containerRef() : undefined
    if (!container) return

    const target = event.target as Node

    // If focus moves outside container, redirect it back
    if (!container.contains(target)) {
      event.preventDefault()
      const focusableElements = getFocusableElements()
      if (focusableElements.length > 0) {
        focusableElements[0].focus()
      }
    }
  }

  /**
   * Activate the focus trap
   */
  const activate = () => {
    if (isActive()) return
    if (typeof document === 'undefined') return

    const container = typeof containerRef === 'function' ? containerRef() : undefined
    if (!container) {
      console.warn('[FocusTrap] Cannot activate: container not found')
      return
    }

    // Store current active element for restoration
    previousActiveElement = document.activeElement as HTMLElement

    // Prevent body scroll if requested
    if (preventScroll) {
      document.body.style.overflow = 'hidden'
    }

    setIsActive(true)

    // Add event listeners
    document.addEventListener('keydown', handleKeyDown)
    document.addEventListener('focusin', handleFocusIn)

    // Focus initial element
    setTimeout(() => {
      let elementToFocus: HTMLElement | null | undefined

      if (initialFocus) {
        elementToFocus = typeof initialFocus === 'function' ? initialFocus() : initialFocus
      }

      if (!elementToFocus) {
        const focusableElements = getFocusableElements()
        elementToFocus = focusableElements[0]
      }

      elementToFocus?.focus()
    }, 10) // Small delay to ensure container is rendered

    onActivate?.()
  }

  /**
   * Deactivate the focus trap
   */
  const deactivate = () => {
    if (!isActive()) return
    if (typeof document === 'undefined') return

    setIsActive(false)

    // Remove event listeners
    document.removeEventListener('keydown', handleKeyDown)
    document.removeEventListener('focusin', handleFocusIn)

    // Restore body scroll
    if (preventScroll) {
      document.body.style.overflow = ''
    }

    // Restore focus to previous element
    setTimeout(() => {
      let elementToFocus: HTMLElement | null | undefined

      if (returnFocus) {
        elementToFocus = typeof returnFocus === 'function' ? returnFocus() : returnFocus
      }

      if (!elementToFocus && previousActiveElement) {
        elementToFocus = previousActiveElement
      }

      elementToFocus?.focus()
      previousActiveElement = null
    }, 10)

    onDeactivate?.()
  }

  // Cleanup on component unmount
  onCleanup(() => {
    if (isActive()) {
      deactivate()
    }
  })

  return {
    activate,
    deactivate,
    isActive,
  }
}

/**
 * Get the first focusable element within a container
 *
 * @param container - Container element
 * @returns First focusable element or null
 */
export function getFirstFocusable(container: HTMLElement): HTMLElement | null {
  const elements = container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)
  for (const element of Array.from(elements)) {
    if (element.offsetParent !== null || element === document.activeElement) {
      return element
    }
  }
  return null
}

/**
 * Get the last focusable element within a container
 *
 * @param container - Container element
 * @returns Last focusable element or null
 */
export function getLastFocusable(container: HTMLElement): HTMLElement | null {
  const elements = container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)
  const visibleElements = Array.from(elements).filter(
    (el) => el.offsetParent !== null || el === document.activeElement
  )
  return visibleElements[visibleElements.length - 1] || null
}

/**
 * Check if an element is focusable
 *
 * @param element - Element to check
 * @returns True if element is focusable
 */
export function isFocusable(element: HTMLElement): boolean {
  if (element.offsetParent === null && element !== document.activeElement) {
    return false
  }

  const tabindex = element.getAttribute('tabindex')
  if (tabindex === '-1') {
    return false
  }

  return element.matches(FOCUSABLE_SELECTOR)
}
