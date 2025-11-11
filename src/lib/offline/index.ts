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

// Service worker registration
export {
    registerServiceWorker,
    unregisterServiceWorker,
} from "./service-worker-registration";

// IndexedDB storage layer
export { offlineStorage, OfflineStorage, StorageError } from "./storage";

// Cache configuration
export { CACHE_CONFIG as cacheConfig } from "./cache-config";
export type { CacheConfig } from "./types";

// Cache utilities (for use in service worker)
export { shouldCache, getCacheStrategy } from "./cache-utils";

// Sync queue manager
export { syncManager, SyncManager } from "./sync-manager";
export type {
    SyncEvent,
    SyncEventType,
    SyncEventListener,
    SyncManagerConfig,
} from "./sync-manager";

// Sync operations
export {
    syncQueueItem,
    syncProgressUpdateWithConflictResolution,
} from "./sync-operations";

// Queue helpers
export {
    queueExerciseComplete,
    queueProgressUpdate,
    queueSessionEnd,
    getQueueStats,
    clearSyncQueue,
} from "./queue-helpers";

// Conflict resolution
export {
    mergeCompetencyProgress,
    mergeSkillProgress,
    isNewer,
    isSameCompetency,
    isSameSkill,
} from "./conflict-resolution";

// Type exports
export type {
    ServiceWorkerStatus,
    NetworkStatus,
    CacheStrategy,
    CacheEntry,
    ServiceWorkerMessage,
    AssetManifest,
    AssetManifestEntry,
    ExerciseCacheEntry,
    SyncQueueItem,
    SyncQueueItemType,
    ExerciseCompleteSyncItem,
    ProgressUpdateSyncItem,
    SessionEndSyncItem,
    ProgressCacheType,
    ProgressCacheEntry,
    PreferenceEntry,
    OfflineDatabase,
} from "./types";
