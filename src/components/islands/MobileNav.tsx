/**
 * MobileNav Component
 *
 * Mobile navigation drawer that slides in from the left with backdrop overlay.
 * Provides touch-friendly navigation menu for screens < 768px.
 *
 * Requirements:
 * - 9.1: Keyboard navigation for all functionality
 * - 9.3: Touch targets minimum 44x44 pixels
 * - 9.4: ARIA labels and landmarks for screen readers
 */

import {
  createSignal,
  createEffect,
  onMount,
  onCleanup,
  Show,
  For,
} from "solid-js";
import { useStore } from "@nanostores/solid";
import { $t, $locale } from "@/lib/i18n";
import LanguageSelector from "./LanguageSelector";

export interface MobileNavProps {
  /** Current page path for active state */
  currentPath?: string;
}

interface NavItem {
  label: string;
  href: string;
  icon: string;
}

/**
 * MobileNav - Slide-in navigation drawer for mobile devices
 *
 * Features:
 * - Slide-in from left with smooth animation
 * - Backdrop overlay with click-to-close
 * - Focus trap when open
 * - Close on Escape key
 * - Touch-friendly targets (44x44px minimum)
 * - Full language selector integration
 * - Accessible with ARIA attributes
 *
 * @example
 * ```tsx
 * <MobileNav currentPath="/dashboard" />
 * ```
 */
export default function MobileNav(props: MobileNavProps) {
  const t = useStore($t);
  const locale = useStore($locale);
  const [isOpen, setIsOpen] = createSignal(false);
  let drawerRef: HTMLDivElement | undefined;
  let firstFocusableRef: HTMLButtonElement | undefined;

  /**
   * Navigation items with i18n labels
   */
  const navItems = (): NavItem[] => {
    const translations = t();
    return [
      { label: translations("navigation.menu.home"), href: "/", icon: "home" },
      {
        label: translations("navigation.menu.dashboard"),
        href: "/dashboard",
        icon: "dashboard",
      },
      {
        label: translations("navigation.menu.practice"),
        href: "/practice",
        icon: "practice",
      },
      {
        label: translations("navigation.menu.progress"),
        href: "/progress",
        icon: "progress",
      },
      {
        label: translations("navigation.menu.settings"),
        href: "/settings",
        icon: "settings",
      },
      {
        label: translations("navigation.menu.help"),
        href: "/help",
        icon: "help",
      },
    ];
  };

  /**
   * Check if nav item is active
   */
  const isActive = (href: string): boolean => {
    const currentPath =
      props.currentPath ||
      (typeof window !== "undefined" ? window.location.pathname : "/");
    if (href === "/") {
      return currentPath === "/";
    }
    return currentPath.startsWith(href);
  };

  /**
   * Open drawer
   */
  const openDrawer = () => {
    setIsOpen(true);
    // Prevent body scroll when drawer is open
    if (typeof document !== "undefined") {
      document.body.style.overflow = "hidden";
    }

    // Focus first element when opened
    setTimeout(() => {
      firstFocusableRef?.focus();
    }, 100);
  };

  /**
   * Close drawer
   */
  const closeDrawer = () => {
    setIsOpen(false);
    if (typeof document !== "undefined") {
      document.body.style.overflow = "";
    }
  };

  /**
   * Handle backdrop click
   */
  const handleBackdropClick = (e: MouseEvent) => {
    if (e.target === e.currentTarget) {
      closeDrawer();
    }
  };

  /**
   * Handle Escape key
   */
  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === "Escape" && isOpen()) {
      closeDrawer();
    }
  };

  /**
   * Handle focus trap within drawer
   */
  const handleFocusTrap = (e: KeyboardEvent) => {
    if (!isOpen() || !drawerRef || typeof document === "undefined") return;

    // Only trap focus on Tab key
    if (e.key !== "Tab") return;

    const focusableElements = drawerRef.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
    );

    const firstElement = focusableElements[0] as HTMLElement;
    const lastElement = focusableElements[
      focusableElements.length - 1
    ] as HTMLElement;

    if (e.shiftKey && document.activeElement === firstElement) {
      e.preventDefault();
      lastElement?.focus();
    } else if (!e.shiftKey && document.activeElement === lastElement) {
      e.preventDefault();
      firstElement?.focus();
    }
  };

  onMount(() => {
    if (typeof window === "undefined") {
      return;
    }

    // Listen for custom open event from hamburger button
    const handleOpenEvent = () => openDrawer();
    window.addEventListener("mobile-nav:open", handleOpenEvent);

    // Cleanup
    onCleanup(() => {
      if (typeof window !== "undefined") {
        window.removeEventListener("mobile-nav:open", handleOpenEvent);
      }
      if (typeof document !== "undefined") {
        document.body.style.overflow = "";
      }
    });
  });

  createEffect(() => {
    if (typeof document === "undefined") {
      return;
    }

    if (isOpen()) {
      document.addEventListener("keydown", handleKeyDown);
      document.addEventListener("focusin", handleFocusTrap);
    } else {
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("focusin", handleFocusTrap);
    }
  });

  return (
    <>
      {/* Backdrop overlay */}
      <Show when={isOpen()}>
        <div
          class="fixed inset-0 bg-black bg-opacity-50 z-backdrop transition-opacity md:hidden"
          onClick={handleBackdropClick}
          aria-hidden="true"
        />
      </Show>

      {/* Drawer */}
      <div
        ref={drawerRef}
        class={`
          fixed top-0 left-0 h-full w-80 max-w-[85vw]
          bg-white shadow-2xl z-drawer
          transform transition-transform duration-300 ease-in-out
          md:hidden overflow-y-auto
          ${isOpen() ? "translate-x-0" : "-translate-x-full"}
        `}
        role="dialog"
        aria-modal="true"
        aria-label={t()("navigation.menu.home")}
      >
        {/* Header with close button */}
        <div class="flex items-center justify-between p-4 border-b border-gray-200">
          <h2 class="text-xl font-bold text-gray-900">
            {t()("common.app.title")}
          </h2>
          <button
            ref={firstFocusableRef}
            type="button"
            onClick={closeDrawer}
            class="touch-target p-2 rounded-lg hover:bg-gray-100 focus-visible-ring"
            aria-label={t()("common.actions.close")}
          >
            {/* Close X icon */}
            <svg
              class="w-6 h-6 text-gray-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              aria-hidden="true"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Navigation menu */}
        <nav class="py-4" aria-label={t()("navigation.menu.home")}>
          <ul class="space-y-1">
            <For each={navItems()}>
              {(item) => (
                <li>
                  <a
                    href={item.href}
                    class={`
                      flex items-center gap-3 px-4 py-3 touch-target
                      text-base font-medium transition-colors
                      focus-visible-ring rounded-lg mx-2
                      ${
                        isActive(item.href)
                          ? "bg-blue-50 text-blue-700"
                          : "text-gray-700 hover:bg-gray-100"
                      }
                    `}
                    aria-current={isActive(item.href) ? "page" : undefined}
                  >
                    {/* Nav icon */}
                    <span class="flex-shrink-0 w-6 h-6" aria-hidden="true">
                      {getNavIcon(item.icon)}
                    </span>
                    <span>{item.label}</span>
                  </a>
                </li>
              )}
            </For>
          </ul>
        </nav>

        {/* Language selector */}
        <div class="px-4 py-6 border-t border-gray-200">
          <h3 class="text-sm font-medium text-gray-700 mb-3">
            {t()("common.language.selector.title")}
          </h3>
          <LanguageSelector variant="full" layout="vertical" />
        </div>
      </div>
    </>
  );
}

/**
 * Get SVG icon for navigation item
 */
function getNavIcon(icon: string) {
  switch (icon) {
    case "home":
      return (
        <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
          />
        </svg>
      );
    case "dashboard":
      return (
        <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
          />
        </svg>
      );
    case "practice":
      return (
        <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
          />
        </svg>
      );
    case "progress":
      return (
        <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
          />
        </svg>
      );
    case "settings":
      return (
        <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
          />
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
          />
        </svg>
      );
    case "help":
      return (
        <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      );
    default:
      return <span />;
  }
}
