/**
 * Offline Functionality Module
 *
 * Central export point for offline-related functionality:
 * - Service worker registration and management
 * - IndexedDB storage layer
 * - Cache configuration and utilities
 * - Sync queue manager
 * - Queue helper functions
 * - Conflict resolution
 * - Offline data types
 */

// Cache configuration
export { CACHE_CONFIG as cacheConfig } from "./cache-config";
// Cache utilities (for use in service worker)
export { getCacheStrategy, shouldCache } from "./cache-utils";
// Conflict resolution
export {
  isNewer,
  isSameCompetency,
  isSameSkill,
  mergeCompetencyProgress,
  mergeSkillProgress,
} from "./conflict-resolution";
// Queue helpers
export {
  clearSyncQueue,
  getQueueStats,
  queueExerciseComplete,
  queueProgressUpdate,
  queueSessionEnd,
} from "./queue-helpers";
// Service worker registration
export {
  registerServiceWorker,
  unregisterServiceWorker,
} from "./service-worker-registration";
// IndexedDB storage layer
export { OfflineStorage, offlineStorage, StorageError } from "./storage";
export type {
  SyncEvent,
  SyncEventListener,
  SyncEventType,
  SyncManagerConfig,
} from "./sync-manager";
// Sync queue manager
export { SyncManager, syncManager } from "./sync-manager";
// Sync operations
export {
  syncProgressUpdateWithConflictResolution,
  syncQueueItem,
} from "./sync-operations";
// Type exports
export type {
  AssetManifest,
  AssetManifestEntry,
  CacheConfig,
  CacheEntry,
  CacheStrategy,
  ExerciseCacheEntry,
  ExerciseCompleteSyncItem,
  NetworkStatus,
  OfflineDatabase,
  PreferenceEntry,
  ProgressCacheEntry,
  ProgressCacheType,
  ProgressUpdateSyncItem,
  ServiceWorkerMessage,
  ServiceWorkerStatus,
  SessionEndSyncItem,
  SyncQueueItem,
  SyncQueueItemType,
} from "./types";
