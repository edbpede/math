#!/usr/bin/env bun
/**
 * Uninstall Service Worker
 *
 * Development utility to unregister all service workers and clear all caches.
 * Useful when debugging service worker issues or testing fresh installations.
 *
 * Usage: bun run scripts/uninstall-sw.ts
 *
 * Note: This script provides instructions for manual cleanup since it cannot
 * directly access the browser's service worker API.
 */

console.log('🧹 Service Worker Cleanup Instructions')
console.log('=' .repeat(60))
console.log()
console.log('To uninstall the service worker and clear caches:')
console.log()
console.log('1. Open your browser DevTools (F12)')
console.log('2. Go to the Application tab (Chrome) or Storage tab (Firefox)')
console.log('3. Select "Service Workers" from the left sidebar')
console.log('4. Click "Unregister" next to each service worker')
console.log('5. Select "Cache Storage" from the left sidebar')
console.log('6. Right-click each cache and select "Delete"')
console.log('7. Reload the page (Ctrl+Shift+R or Cmd+Shift+R)')
console.log()
console.log('Alternative (Chrome):')
console.log('- Right-click the reload button → "Empty Cache and Hard Reload"')
console.log()
console.log('Alternative (Firefox):')
console.log('- Ctrl+Shift+Delete → Check "Cache" → Clear Now')
console.log()
console.log('=' .repeat(60))
console.log()
console.log('💡 Development tip:')
console.log('   In Chrome DevTools > Application > Service Workers,')
console.log('   check "Update on reload" to bypass cache during development.')
console.log()

