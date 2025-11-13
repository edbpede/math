/**
 * UnoCSS Configuration
 * 
 * Provides atomic CSS utilities with Tailwind compatibility, custom breakpoints,
 * and theme configuration for the Arithmetic Practice Portal.
 * 
 * Following .claude/astro-solid-stack.md guidelines:
 * - presetWind for Tailwind compatibility (200x faster generation)
 * - presetAttributify for complex component styling
 * - Custom breakpoints for mobile-first responsive design
 * - Theme tokens for consistent design system
 */

import {
  defineConfig,
  presetWind,
  presetAttributify,
  presetIcons,
  transformerDirectives,
  transformerVariantGroup,
} from 'unocss'

export default defineConfig({
  presets: [
    // Tailwind-compatible utilities with 200x faster generation
    presetWind({
      // Enable dark mode with class strategy (html.dark-theme)
      dark: 'class',
    }),

    // Attributify mode for better readability in complex components
    presetAttributify(),

    // Pure CSS icons for minimal bundle size
    presetIcons({
      scale: 1.2,
      warn: true,
    }),
  ],

  transformers: [
    // Enable @apply, @screen directives
    transformerDirectives(),
    
    // Enable variant groups like hover:(bg-gray-400 font-medium)
    transformerVariantGroup(),
  ],

  shortcuts: {
    // =============================================================================
    // BUTTON STYLES - Supporting Requirements 8.2, 8.3
    // =============================================================================

    // Base button (common properties)
    'btn-base': 'inline-flex items-center justify-center font-medium rounded-lg transition-all focus:outline-none focus:ring-4 disabled:opacity-50 disabled:cursor-not-allowed touch-target',

    // Primary action buttons (submit, continue)
    'btn-primary': 'btn-base px-6 py-3 bg-blue-600 text-white hover:bg-blue-700 active:bg-blue-800 focus:ring-blue-300',
    'btn-primary-sm': 'btn-base px-4 py-2 text-sm bg-blue-600 text-white hover:bg-blue-700 active:bg-blue-800 focus:ring-blue-300',
    'btn-primary-lg': 'btn-base px-8 py-4 text-lg bg-blue-600 text-white hover:bg-blue-700 active:bg-blue-800 focus:ring-blue-300',

    // Success/positive buttons (Requirement 8.2 - Positive Feedback)
    'btn-success': 'btn-base px-6 py-3 bg-green-600 text-white hover:bg-green-700 active:bg-green-800 focus:ring-green-300',
    'btn-success-sm': 'btn-base px-4 py-2 text-sm bg-green-600 text-white hover:bg-green-700 active:bg-green-800 focus:ring-green-300',

    // Warning/gentle correction buttons (Requirement 8.3 - Gentle Correction)
    'btn-warning': 'btn-base px-6 py-3 bg-orange-500 text-white hover:bg-orange-600 active:bg-orange-700 focus:ring-orange-300',
    'btn-warning-sm': 'btn-base px-4 py-2 text-sm bg-orange-500 text-white hover:bg-orange-600 active:bg-orange-700 focus:ring-orange-300',

    // Secondary buttons (cancel, skip)
    'btn-secondary': 'btn-base px-6 py-3 bg-white text-gray-700 border-2 border-gray-300 hover:border-blue-400 hover:bg-blue-50 active:bg-blue-100 focus:ring-blue-300',
    'btn-secondary-sm': 'btn-base px-4 py-2 text-sm bg-white text-gray-700 border-2 border-gray-300 hover:border-blue-400 hover:bg-blue-50 active:bg-blue-100 focus:ring-blue-300',
    'btn-secondary-lg': 'btn-base px-8 py-4 text-lg bg-white text-gray-700 border-2 border-gray-300 hover:border-blue-400 hover:bg-blue-50 active:bg-blue-100 focus:ring-blue-300',

    // Ghost/text buttons (hints, solutions, less emphasis)
    'btn-ghost': 'btn-base px-4 py-2 text-gray-700 hover:bg-gray-100 active:bg-gray-200 focus:ring-gray-300',
    'btn-ghost-sm': 'btn-base px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-100 active:bg-gray-200 focus:ring-gray-300',

    // Icon-only buttons (close, expand, navigation)
    'btn-icon': 'touch-target flex items-center justify-center rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 hover:bg-gray-100 active:bg-gray-200',
    'btn-icon-sm': 'min-w-36px min-h-36px flex items-center justify-center rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 hover:bg-gray-100 active:bg-gray-200',
    'btn-icon-primary': 'touch-target flex items-center justify-center rounded-lg bg-blue-600 text-white hover:bg-blue-700 active:bg-blue-800 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-300 focus:ring-offset-2',

    // Loading state button
    'btn-loading': 'btn-base px-6 py-3 bg-blue-600 text-white cursor-wait opacity-75',

    // =============================================================================
    // CARD STYLES - Supporting Requirements 5.7, 8.2, 8.3
    // =============================================================================

    // Base card styles
    'card': 'bg-white rounded-lg shadow-md p-6 dark:bg-gray-800 dark:text-gray-100',
    'card-sm': 'bg-white rounded-lg shadow-md p-4 dark:bg-gray-800 dark:text-gray-100',
    'card-lg': 'bg-white rounded-xl shadow-lg p-8 dark:bg-gray-800 dark:text-gray-100',

    // Interactive cards (clickable, hoverable)
    'card-hover': 'card hover:shadow-lg hover:scale-102 transition-all cursor-pointer',
    'card-interactive': 'card hover:shadow-xl hover:border-blue-500 border-2 border-transparent transition-all cursor-pointer focus:outline-none focus:ring-4 focus:ring-blue-300',

    // Competency area cards with accent colors (Requirement 5.7)
    'card-competency': 'card-interactive border-l-4',
    'card-competency-primary': 'card-competency border-l-blue-500',
    'card-competency-success': 'card-competency border-l-green-500',
    'card-competency-warning': 'card-competency border-l-orange-500',
    'card-competency-info': 'card-competency border-l-purple-500',

    // Feedback cards (Requirement 8.2, 8.3)
    'card-success': 'card bg-green-50 border-2 border-green-200 dark:bg-green-900/20 dark:border-green-700',
    'card-warning': 'card bg-orange-50 border-2 border-orange-200 dark:bg-orange-900/20 dark:border-orange-700',
    'card-error': 'card bg-red-50 border-2 border-red-200 dark:bg-red-900/20 dark:border-red-700',
    'card-info': 'card bg-blue-50 border-2 border-blue-200 dark:bg-blue-900/20 dark:border-blue-700',

    // Mastery level cards (Requirement 5.7)
    'card-mastery-introduced': 'card border-l-4 border-l-mastery-introduced',
    'card-mastery-developing': 'card border-l-4 border-l-mastery-developing',
    'card-mastery-progressing': 'card border-l-4 border-l-mastery-progressing',
    'card-mastery-proficient': 'card border-l-4 border-l-mastery-proficient',
    'card-mastery-mastered': 'card border-l-4 border-l-mastery-mastered',

    // =============================================================================
    // FORM INPUT STYLES
    // =============================================================================

    // Base input (text, number, email, etc.)
    'input-base': 'w-full px-4 py-3 rounded-lg border-2 border-gray-300 bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-200 transition-colors touch-target dark:bg-gray-800 dark:border-gray-600 dark:text-gray-100',
    'input': 'input-base',
    'input-sm': 'w-full px-3 py-2 text-sm rounded-lg border-2 border-gray-300 bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-200 transition-colors dark:bg-gray-800 dark:border-gray-600 dark:text-gray-100',
    'input-lg': 'w-full px-5 py-4 text-lg rounded-lg border-2 border-gray-300 bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-200 transition-colors touch-target dark:bg-gray-800 dark:border-gray-600 dark:text-gray-100',

    // Input validation states
    'input-error': 'input-base border-red-500 focus:border-red-600 focus:ring-red-200',
    'input-success': 'input-base border-green-500 focus:border-green-600 focus:ring-green-200',
    'input-disabled': 'input-base opacity-60 cursor-not-allowed bg-gray-100 dark:bg-gray-900',

    // Select dropdown
    'select': 'input-base appearance-none bg-no-repeat bg-right pr-10 cursor-pointer',
    'select-sm': 'input-sm appearance-none bg-no-repeat bg-right pr-8 cursor-pointer',

    // Textarea
    'textarea': 'input-base min-h-32 resize-vertical',

    // Input labels
    'label': 'block text-sm font-medium text-gray-700 mb-2 dark:text-gray-300',
    'label-required': 'label after:content-["*"] after:ml-1 after:text-red-500',

    // Input helper text
    'input-help': 'mt-2 text-sm text-gray-600 dark:text-gray-400',
    'input-error-text': 'mt-2 text-sm text-red-600 dark:text-red-400',
    'input-success-text': 'mt-2 text-sm text-green-600 dark:text-green-400',

    // Form groups
    'form-group': 'mb-6',
    'form-row': 'flex flex-wrap gap-4',

    // =============================================================================
    // PROGRESS BAR STYLES - Supporting Requirement 5.7 (Mastery Tracking)
    // =============================================================================

    // Linear progress bar container
    'progress-container': 'w-full h-3 bg-gray-200 rounded-full overflow-hidden dark:bg-gray-700',
    'progress-container-sm': 'w-full h-2 bg-gray-200 rounded-full overflow-hidden dark:bg-gray-700',
    'progress-container-lg': 'w-full h-4 bg-gray-200 rounded-full overflow-hidden dark:bg-gray-700',

    // Progress bar fill (base)
    'progress-bar': 'h-full rounded-full transition-all duration-300',

    // Progress bar with mastery colors (Requirement 5.7)
    'progress-introduced': 'progress-bar bg-mastery-introduced',
    'progress-developing': 'progress-bar bg-mastery-developing',
    'progress-progressing': 'progress-bar bg-mastery-progressing',
    'progress-proficient': 'progress-bar bg-mastery-proficient',
    'progress-mastered': 'progress-bar bg-mastery-mastered',

    // Progress bar with status colors
    'progress-success': 'progress-bar bg-green-500',
    'progress-warning': 'progress-bar bg-orange-500',
    'progress-error': 'progress-bar bg-red-500',
    'progress-info': 'progress-bar bg-blue-500',

    // Circular progress wrapper
    'progress-circle': 'relative inline-flex items-center justify-center',

    // Progress text/percentage
    'progress-text': 'text-sm font-medium text-gray-700 dark:text-gray-300',
    'progress-label': 'text-xs text-gray-600 dark:text-gray-400',

    // =============================================================================
    // BADGE AND INDICATOR STYLES - Supporting Requirement 5.7
    // =============================================================================

    // Base badge
    'badge-base': 'inline-flex items-center px-3 py-1 rounded-full text-sm font-medium',
    'badge-sm': 'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium',
    'badge-lg': 'inline-flex items-center px-4 py-1.5 rounded-full text-base font-medium',

    // Mastery level badges (Requirement 5.7)
    'badge-mastery-introduced': 'badge-base bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
    'badge-mastery-developing': 'badge-base bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
    'badge-mastery-progressing': 'badge-base bg-lime-100 text-lime-800 dark:bg-lime-900/30 dark:text-lime-300',
    'badge-mastery-proficient': 'badge-base bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
    'badge-mastery-mastered': 'badge-base bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',

    // Status badges
    'badge-success': 'badge-base bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
    'badge-warning': 'badge-base bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300',
    'badge-error': 'badge-base bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
    'badge-info': 'badge-base bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
    'badge-neutral': 'badge-base bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300',

    // Notification/count badges
    'badge-count': 'inline-flex items-center justify-center min-w-5 h-5 px-1.5 rounded-full bg-red-500 text-white text-xs font-bold',
    'badge-count-sm': 'inline-flex items-center justify-center min-w-4 h-4 px-1 rounded-full bg-red-500 text-white text-2xs font-bold',

    // Dot indicators (online/offline, syncing)
    'indicator-dot': 'inline-block w-2 h-2 rounded-full',
    'indicator-dot-lg': 'inline-block w-3 h-3 rounded-full',
    'indicator-online': 'indicator-dot bg-green-500',
    'indicator-offline': 'indicator-dot bg-gray-400',
    'indicator-syncing': 'indicator-dot bg-blue-500 animate-pulse',
    'indicator-error': 'indicator-dot bg-red-500',

    // Difficulty indicators (A, B, C)
    'badge-difficulty-a': 'badge-base bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
    'badge-difficulty-b': 'badge-base bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
    'badge-difficulty-c': 'badge-base bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300',

    // =============================================================================
    // ACCESSIBILITY UTILITIES - Supporting Requirement 9
    // =============================================================================

    // Touch-friendly targets (44x44px minimum per WCAG 2.1 AA - Requirement 9.3)
    'touch-target': 'min-w-44px min-h-44px',
    'touch-target-generous': 'min-w-48px min-h-48px p-3',
    'touch-spacing': 'gap-2',

    // Interactive elements with touch targets
    'link-touch': 'touch-target inline-flex items-center',

    // Focus indicators for accessibility
    'focus-visible-ring': 'focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-300',

    // Screen reader only content (hidden visually but accessible to screen readers)
    'sr-only': 'absolute w-1px h-1px p-0 -m-1px overflow-hidden whitespace-nowrap border-0',
    'not-sr-only': 'static w-auto h-auto p-auto m-auto overflow-visible whitespace-normal',

    // Skip links (visible only when focused)
    'skip-link': 'sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-tooltip focus:px-4 focus:py-2 focus:bg-blue-600 focus:text-white focus:rounded focus:shadow-lg',
  },

  theme: {
    breakpoints: {
      // Mobile-first breakpoints
      'sm': '640px',
      'md': '768px',   // Tablet and above
      'lg': '1024px',  // Desktop
      'xl': '1280px',
      '2xl': '1536px',
    },

    // Font families with dyslexia-friendly option
    fontFamily: {
      sans: ['system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      serif: ['Georgia', 'Cambria', 'Times New Roman', 'Times', 'serif'],
      mono: ['Menlo', 'Monaco', 'Courier New', 'monospace'],
      dyslexic: ['OpenDyslexic', 'Comic Sans MS', 'sans-serif'],
    },

    colors: {
      // Primary brand colors
      primary: {
        50: '#eff6ff',
        100: '#dbeafe',
        200: '#bfdbfe',
        300: '#93c5fd',
        400: '#60a5fa',
        500: '#3b82f6',
        600: '#2563eb',
        700: '#1d4ed8',
        800: '#1e40af',
        900: '#1e3a8a',
      },
      
      // Mastery level colors (Requirement 5.7)
      mastery: {
        'introduced': '#ef4444',    // red: 0-20
        'developing': '#f59e0b',    // yellow: 21-40
        'progressing': '#84cc16',   // light green: 41-60
        'proficient': '#22c55e',    // green: 61-80
        'mastered': '#3b82f6',      // blue: 81-100
      },
      
      // Status colors
      success: '#22c55e',
      warning: '#f59e0b',
      error: '#ef4444',
      info: '#3b82f6',
      
      // Neutral grays
      gray: {
        50: '#f9fafb',
        100: '#f3f4f6',
        200: '#e5e7eb',
        300: '#d1d5db',
        400: '#9ca3af',
        500: '#6b7280',
        600: '#4b5563',
        700: '#374151',
        800: '#1f2937',
        900: '#111827',
      },
    },
    
    // Z-index layers for proper stacking
    zIndex: {
      'base': '0',
      'dropdown': '1000',
      'sticky': '1020',
      'fixed': '1030',
      'drawer': '1040',
      'backdrop': '1050',
      'modal': '1060',
      'popover': '1070',
      'tooltip': '1080',
    },
    
    // Typography scale
    fontSize: {
      'xs': ['0.75rem', { 'line-height': '1rem' }],
      'sm': ['0.875rem', { 'line-height': '1.25rem' }],
      'base': ['1rem', { 'line-height': '1.5rem' }],
      'lg': ['1.125rem', { 'line-height': '1.75rem' }],
      'xl': ['1.25rem', { 'line-height': '1.75rem' }],
      '2xl': ['1.5rem', { 'line-height': '2rem' }],
      '3xl': ['1.875rem', { 'line-height': '2.25rem' }],
      '4xl': ['2.25rem', { 'line-height': '2.5rem' }],
      '5xl': ['3rem', { 'line-height': '1' }],
    },
    
    // Animation durations
    transitionDuration: {
      'fast': '150ms',
      'normal': '200ms',
      'slow': '300ms',
    },
  },

  // Safelist for dynamically generated classes that static analysis cannot detect
  safelist: [
    // =============================================================================
    // MASTERY LEVEL COLORS - Supporting Requirement 5.7
    // =============================================================================

    // Background colors for mastery levels
    'bg-mastery-introduced',
    'bg-mastery-developing',
    'bg-mastery-progressing',
    'bg-mastery-proficient',
    'bg-mastery-mastered',

    // Text colors for mastery levels
    'text-mastery-introduced',
    'text-mastery-developing',
    'text-mastery-progressing',
    'text-mastery-proficient',
    'text-mastery-mastered',

    // Border colors for mastery levels
    'border-mastery-introduced',
    'border-mastery-developing',
    'border-mastery-progressing',
    'border-mastery-proficient',
    'border-mastery-mastered',
    'border-l-mastery-introduced',
    'border-l-mastery-developing',
    'border-l-mastery-progressing',
    'border-l-mastery-proficient',
    'border-l-mastery-mastered',

    // =============================================================================
    // FORM VALIDATION STATES
    // =============================================================================

    // Input states
    'input-error',
    'input-success',
    'input-disabled',

    // Border colors for validation
    'border-red-500',
    'border-green-500',
    'border-orange-500',
    'focus:border-red-600',
    'focus:border-green-600',
    'focus:ring-red-200',
    'focus:ring-green-200',
    'focus:ring-orange-200',

    // =============================================================================
    // PROGRESS BAR VARIANTS
    // =============================================================================

    // Progress bar classes with mastery colors
    'progress-introduced',
    'progress-developing',
    'progress-progressing',
    'progress-proficient',
    'progress-mastered',

    // Progress bar with status colors
    'progress-success',
    'progress-warning',
    'progress-error',
    'progress-info',

    // =============================================================================
    // BADGE VARIANTS
    // =============================================================================

    // Mastery level badges
    'badge-mastery-introduced',
    'badge-mastery-developing',
    'badge-mastery-progressing',
    'badge-mastery-proficient',
    'badge-mastery-mastered',

    // Status badges
    'badge-success',
    'badge-warning',
    'badge-error',
    'badge-info',
    'badge-neutral',

    // Difficulty badges
    'badge-difficulty-a',
    'badge-difficulty-b',
    'badge-difficulty-c',

    // =============================================================================
    // CARD VARIANTS
    // =============================================================================

    // Feedback cards (Requirements 8.2, 8.3)
    'card-success',
    'card-warning',
    'card-error',
    'card-info',

    // Mastery level cards
    'card-mastery-introduced',
    'card-mastery-developing',
    'card-mastery-progressing',
    'card-mastery-proficient',
    'card-mastery-mastered',

    // Competency cards
    'card-competency-primary',
    'card-competency-success',
    'card-competency-warning',
    'card-competency-info',

    // =============================================================================
    // BUTTON VARIANTS
    // =============================================================================

    // Button sizes
    'btn-primary-sm',
    'btn-primary-lg',
    'btn-secondary-sm',
    'btn-secondary-lg',
    'btn-success',
    'btn-success-sm',
    'btn-warning',
    'btn-warning-sm',
    'btn-ghost-sm',
    'btn-icon-sm',
    'btn-loading',

    // =============================================================================
    // INDICATOR VARIANTS
    // =============================================================================

    // Dot indicators
    'indicator-online',
    'indicator-offline',
    'indicator-syncing',
    'indicator-error',

    // =============================================================================
    // DARK MODE VARIANTS
    // =============================================================================

    // Common dark mode elements
    'dark:bg-gray-700',
    'dark:bg-gray-800',
    'dark:bg-gray-900',
    'dark:text-gray-100',
    'dark:text-gray-200',
    'dark:text-gray-300',
    'dark:text-gray-400',
    'dark:border-gray-600',
    'dark:border-gray-700',

    // Dark mode feedback colors
    'dark:bg-green-900/20',
    'dark:bg-orange-900/20',
    'dark:bg-red-900/20',
    'dark:bg-blue-900/20',
    'dark:border-green-700',
    'dark:border-orange-700',
    'dark:border-red-700',
    'dark:border-blue-700',

    // Dark mode mastery badges
    'dark:bg-red-900/30',
    'dark:bg-yellow-900/30',
    'dark:bg-lime-900/30',
    'dark:bg-green-900/30',
    'dark:bg-blue-900/30',
    'dark:text-red-300',
    'dark:text-yellow-300',
    'dark:text-lime-300',
    'dark:text-green-300',
    'dark:text-blue-300',

    // =============================================================================
    // HIGH CONTRAST MODE - Supporting Requirement 9.2
    // =============================================================================

    'high-contrast:border-2',
    'high-contrast:border-black',
    'high-contrast:border-white',
    'high-contrast:text-black',
    'high-contrast:bg-white',
  ],

  // Rules for custom utilities
  rules: [
    // Custom safe area utilities for iOS notch/home indicator
    ['safe-top', { 'padding-top': 'env(safe-area-inset-top)' }],
    ['safe-bottom', { 'padding-bottom': 'env(safe-area-inset-bottom)' }],
    ['safe-left', { 'padding-left': 'env(safe-area-inset-left)' }],
    ['safe-right', { 'padding-right': 'env(safe-area-inset-right)' }],
  ],
})

