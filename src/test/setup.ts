/**
 * Vitest Base Test Setup File
 *
 * Global test configuration that runs for all test environments (node and browser).
 * Provides environment variables and IndexedDB mocking.
 *
 * Browser-specific setup is handled in setup-browser.ts, which runs only
 * for browser environments (happy-dom/jsdom).
 */

import { vi } from 'vitest';
import 'fake-indexeddb/auto';

// Mock environment variables for tests (must be done before any imports that use them)
vi.stubEnv('PUBLIC_SUPABASE_URL', 'https://test.supabase.co');
vi.stubEnv('PUBLIC_SUPABASE_ANON_KEY', 'test-anon-key');
