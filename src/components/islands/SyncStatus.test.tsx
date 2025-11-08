/**
 * SyncStatus Component Tests
 * 
 * Tests the sync status indicator component for offline-capable PWA.
 * 
 * @vitest-environment happy-dom
 * 
 * TODO: Fix tests to work with client-only APIs (onMount, etc.)
 * These tests are temporarily skipped pending proper test environment setup.
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen } from '@solidjs/testing-library'
import SyncStatus from './SyncStatus'

describe('SyncStatus', () => {
  beforeEach(async () => {
    // Initialize i18n for tests
    const { initI18n } = await import('@/lib/i18n')
    await initI18n()
  })

  it('renders online status by default', () => {
    render(() => <SyncStatus />)
    
    // Should show "Online" or translated equivalent
    expect(screen.getByRole('status')).toBeInTheDocument()
  })

  it('has accessible ARIA attributes', () => {
    render(() => <SyncStatus />)
    
    const status = screen.getByRole('status')
    expect(status).toHaveAttribute('aria-live', 'polite')
    expect(status).toHaveAttribute('aria-atomic', 'true')
  })

  it('shows sync button when showSyncButton prop is true', () => {
    render(() => <SyncStatus showSyncButton={true} />)
    
    const button = screen.queryByRole('button')
    expect(button).toBeInTheDocument()
  })

  it('hides sync button when showSyncButton prop is false', () => {
    render(() => <SyncStatus showSyncButton={false} />)
    
    const button = screen.queryByRole('button')
    expect(button).not.toBeInTheDocument()
  })

  it('applies custom CSS class', () => {
    const { container } = render(() => <SyncStatus class="custom-class" />)
    
    const statusDiv = container.querySelector('.sync-status')
    expect(statusDiv).toHaveClass('custom-class')
  })
})

