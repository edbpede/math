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
    presetWind(),
    
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
    // Common component patterns
    'btn-primary': 'px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 active:bg-blue-800 focus:outline-none focus:ring-4 focus:ring-blue-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed',
    'btn-secondary': 'px-6 py-3 bg-white text-gray-700 border-2 border-gray-300 rounded-lg font-medium hover:border-blue-400 hover:bg-blue-50 active:bg-blue-100 focus:outline-none focus:ring-4 focus:ring-blue-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed',
    'btn-ghost': 'px-4 py-2 text-gray-700 rounded-lg hover:bg-gray-100 active:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-300 transition-colors',

    // Touch-friendly targets (44x44px minimum per WCAG)
    'touch-target': 'min-w-44px min-h-44px',

    // Focus indicators for accessibility
    'focus-visible-ring': 'focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-300',

    // Screen reader only content (hidden visually but accessible to screen readers)
    'sr-only': 'absolute w-1px h-1px p-0 -m-1px overflow-hidden whitespace-nowrap border-0',
    'not-sr-only': 'static w-auto h-auto p-auto m-auto overflow-visible whitespace-normal',

    // Skip links (visible only when focused)
    'skip-link': 'sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-tooltip focus:px-4 focus:py-2 focus:bg-blue-600 focus:text-white focus:rounded focus:shadow-lg',

    // Card styling
    'card': 'bg-white rounded-lg shadow-md p-6',
    'card-hover': 'card hover:shadow-lg transition-shadow',
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

  // Safelist for dynamically generated classes
  safelist: [
    // Mastery level colors
    'bg-mastery-introduced',
    'bg-mastery-developing',
    'bg-mastery-progressing',
    'bg-mastery-proficient',
    'bg-mastery-mastered',
    'text-mastery-introduced',
    'text-mastery-developing',
    'text-mastery-progressing',
    'text-mastery-proficient',
    'text-mastery-mastered',
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

