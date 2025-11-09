/**
 * MobileNav Component Tests
 * 
 * Tests the mobile navigation drawer component.
 *
 * TODO: Fix tests to properly mock auth dependencies and client-only APIs
 * These tests are temporarily skipped pending proper test environment setup.
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen } from '@solidjs/testing-library'
import MobileNav from './MobileNav'

describe('MobileNav', () => {
  beforeEach(async () => {
    // Initialize i18n for tests
    const { initI18n } = await import('@/lib/i18n')
    await initI18n()
  })

  it('renders drawer with navigation items', async () => {
    render(() => <MobileNav />)
    
    // Drawer should be present but hidden initially
    const drawer = screen.getByRole('dialog')
    expect(drawer).toBeInTheDocument()
  })

  it('has proper ARIA attributes for accessibility', () => {
    render(() => <MobileNav />)
    
    const drawer = screen.getByRole('dialog')
    expect(drawer).toHaveAttribute('aria-modal', 'true')
  })

  it('includes close button', () => {
    render(() => <MobileNav />)
    
    const closeButton = screen.getByLabelText(/close/i)
    expect(closeButton).toBeInTheDocument()
  })

  it('marks current page as active', () => {
    render(() => <MobileNav currentPath="/dashboard" />)
    
    const activeLink = screen.getByRole('link', { current: 'page' })
    expect(activeLink).toBeInTheDocument()
  })

  it('includes language selector', () => {
    const { container } = render(() => <MobileNav />)
    
    // Language selector should be in the drawer
    const languageSelector = container.querySelector('.language-selector')
    expect(languageSelector).toBeInTheDocument()
  })
})

