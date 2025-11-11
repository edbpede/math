/**
 * IndexedDB Storage Layer Tests
 *
 * Comprehensive test suite for offline storage functionality.
 */

import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { OfflineStorage, StorageError } from "./storage";
import type { ExerciseInstance } from "../exercises/types";
import type { ExerciseAttempt } from "../mastery/types";
import type { SyncQueueItem } from "./types";

describe("OfflineStorage", () => {
    let storage: OfflineStorage;

    beforeEach(async () => {
        storage = new OfflineStorage();
        await storage.init();
    });

    afterEach(async () => {
        await storage.clearAll();
        await storage.close();
    });

    describe("Database Initialization", () => {
        it("should initialize database successfully", async () => {
            expect(storage).toBeDefined();
        });

        it("should be available in supported environments", () => {
            expect(OfflineStorage.isAvailable()).toBe(true);
        });

        it("should handle multiple init calls gracefully", async () => {
            await storage.init();
            await storage.init(); // Should not throw
            expect(storage).toBeDefined();
        });

        it("should clear all stores", async () => {
            // Add some data
            await storage.setPreference("test", "value");
            await storage.clearAll();

            // Verify all cleared
            const pref = await storage.getPreference("test");
            expect(pref).toBeUndefined();
        });
    });

    describe("Exercise Cache Store", () => {
        const createMockExercise = (id: string): ExerciseInstance => ({
            id,
            templateId: "test-template",
            questionText: "Test question",
            correctAnswer: { value: 42 },
            hints: [],
            metadata: {
                competencyAreaId: "tal-og-algebra",
                skillsAreaId: "addition",
                gradeRange: "0-3",
                difficulty: "A",
                isBinding: true,
                tags: [],
            },
            context: {
                names: ["Alice"],
                places: ["School"],
                locale: "da-DK" as const,
            },
            seed: 12345,
        });

        it("should add an exercise to cache", async () => {
            const exercise = createMockExercise("ex-1");
            await storage.addExercise(exercise);

            const retrieved = await storage.getExercise("ex-1");
            expect(retrieved).toBeDefined();
            expect(retrieved?.instance.id).toBe("ex-1");
            expect(retrieved?.used).toBe(false);
        });

        it("should retrieve exercise by ID", async () => {
            const exercise = createMockExercise("ex-2");
            await storage.addExercise(exercise);

            const retrieved = await storage.getExercise("ex-2");
            expect(retrieved?.instance.questionText).toBe("Test question");
        });

        it("should return undefined for non-existent exercise", async () => {
            const retrieved = await storage.getExercise("non-existent");
            expect(retrieved).toBeUndefined();
        });

        it("should get all unused exercises", async () => {
            const ex1 = createMockExercise("ex-1");
            const ex2 = createMockExercise("ex-2");
            const ex3 = createMockExercise("ex-3");

            await storage.addExercise(ex1);
            await storage.addExercise(ex2);
            await storage.addExercise(ex3);

            // Mark one as used
            await storage.markExerciseUsed("ex-2");

            const unused = await storage.getUnusedExercises();
            expect(unused).toHaveLength(2);
            expect(unused.map((e) => e.id).sort()).toEqual(["ex-1", "ex-3"]);
        });

        it("should mark exercise as used", async () => {
            const exercise = createMockExercise("ex-1");
            await storage.addExercise(exercise);

            await storage.markExerciseUsed("ex-1");

            const retrieved = await storage.getExercise("ex-1");
            expect(retrieved?.used).toBe(true);
        });

        it("should handle marking non-existent exercise as used", async () => {
            // Should not throw
            await storage.markExerciseUsed("non-existent");
        });

        it("should get exercise count", async () => {
            const ex1 = createMockExercise("ex-1");
            const ex2 = createMockExercise("ex-2");
            const ex3 = createMockExercise("ex-3");

            await storage.addExercise(ex1);
            await storage.addExercise(ex2);
            await storage.addExercise(ex3);

            await storage.markExerciseUsed("ex-2");

            const count = await storage.getExerciseCount();
            expect(count.total).toBe(3);
            expect(count.unused).toBe(2);
        });

        it("should clear all exercises", async () => {
            const ex1 = createMockExercise("ex-1");
            const ex2 = createMockExercise("ex-2");

            await storage.addExercise(ex1);
            await storage.addExercise(ex2);

            await storage.clearExercises();

            const count = await storage.getExerciseCount();
            expect(count.total).toBe(0);
        });

        it("should update exercise if adding with same ID", async () => {
            const exercise = createMockExercise("ex-1");
            await storage.addExercise(exercise);

            // Mark as used
            await storage.markExerciseUsed("ex-1");

            // Add again (update)
            await storage.addExercise(exercise);

            // Should be marked as unused (new entry)
            const retrieved = await storage.getExercise("ex-1");
            expect(retrieved?.used).toBe(false);
        });
    });

    describe("Sync Queue Store", () => {
        const createMockExerciseAttempt = (): ExerciseAttempt => ({
            id: "attempt-1",
            userId: "user-123",
            sessionId: "session-1",
            templateId: "test-template",
            competencyAreaId: "tal-og-algebra",
            skillId: "addition-basic",
            difficulty: "A",
            isBinding: true,
            correct: true,
            timeSpentSeconds: 30,
            hintsUsed: 0,
            userAnswer: "42",
            createdAt: new Date(),
        });

        it("should add item to sync queue", async () => {
            const item: Omit<SyncQueueItem, "id"> = {
                type: "exercise_complete",
                data: createMockExerciseAttempt(),
                timestamp: new Date(),
                retries: 0,
            };

            const id = await storage.addToSyncQueue(item);
            expect(id).toBeGreaterThan(0);
        });

        it("should get all sync queue items", async () => {
            const item1: Omit<SyncQueueItem, "id"> = {
                type: "exercise_complete",
                data: createMockExerciseAttempt(),
                timestamp: new Date(),
                retries: 0,
            };

            const item2: Omit<SyncQueueItem, "id"> = {
                type: "progress_update",
                data: {
                    userId: "user-123",
                    competencyProgress: [],
                    skillsProgress: [],
                },
                timestamp: new Date(),
                retries: 0,
            };

            await storage.addToSyncQueue(item1);
            await storage.addToSyncQueue(item2);

            const items = await storage.getAllSyncQueue();
            expect(items).toHaveLength(2);
        });

        it("should get sync queue items by type", async () => {
            const exerciseItem: Omit<SyncQueueItem, "id"> = {
                type: "exercise_complete",
                data: createMockExerciseAttempt(),
                timestamp: new Date(),
                retries: 0,
            };

            const progressItem: Omit<SyncQueueItem, "id"> = {
                type: "progress_update",
                data: {
                    userId: "user-123",
                    competencyProgress: [],
                    skillsProgress: [],
                },
                timestamp: new Date(),
                retries: 0,
            };

            const sessionItem: Omit<SyncQueueItem, "id"> = {
                type: "session_end",
                data: {
                    sessionId: "session-1",
                    endedAt: new Date(),
                    totalExercises: 10,
                    correctCount: 8,
                    avgTimePerExerciseSeconds: 45,
                },
                timestamp: new Date(),
                retries: 0,
            };

            await storage.addToSyncQueue(exerciseItem);
            await storage.addToSyncQueue(progressItem);
            await storage.addToSyncQueue(sessionItem);

            const exerciseItems =
                await storage.getSyncQueueByType("exercise_complete");
            const progressItems =
                await storage.getSyncQueueByType("progress_update");
            const sessionItems =
                await storage.getSyncQueueByType("session_end");

            expect(exerciseItems).toHaveLength(1);
            expect(progressItems).toHaveLength(1);
            expect(sessionItems).toHaveLength(1);
        });

        it("should remove item from sync queue", async () => {
            const item: Omit<SyncQueueItem, "id"> = {
                type: "exercise_complete",
                data: createMockExerciseAttempt(),
                timestamp: new Date(),
                retries: 0,
            };

            const id = await storage.addToSyncQueue(item);
            await storage.removeFromSyncQueue(id);

            const items = await storage.getAllSyncQueue();
            expect(items).toHaveLength(0);
        });

        it("should increment retry count", async () => {
            const item: Omit<SyncQueueItem, "id"> = {
                type: "exercise_complete",
                data: createMockExerciseAttempt(),
                timestamp: new Date(),
                retries: 0,
            };

            const id = await storage.addToSyncQueue(item);

            await storage.incrementSyncRetries(id);
            await storage.incrementSyncRetries(id);

            const items = await storage.getAllSyncQueue();
            const updated = items.find((i) => i.id === id);
            expect(updated?.retries).toBe(2);
        });

        it("should handle incrementing non-existent item", async () => {
            // Should not throw
            await storage.incrementSyncRetries(999);
        });

        it("should get sync queue count", async () => {
            const item: Omit<SyncQueueItem, "id"> = {
                type: "exercise_complete",
                data: createMockExerciseAttempt(),
                timestamp: new Date(),
                retries: 0,
            };

            await storage.addToSyncQueue(item);
            await storage.addToSyncQueue(item);

            const count = await storage.getSyncQueueCount();
            expect(count).toBe(2);
        });

        it("should clear sync queue", async () => {
            const item: Omit<SyncQueueItem, "id"> = {
                type: "exercise_complete",
                data: createMockExerciseAttempt(),
                timestamp: new Date(),
                retries: 0,
            };

            await storage.addToSyncQueue(item);
            await storage.addToSyncQueue(item);

            await storage.clearSyncQueue();

            const count = await storage.getSyncQueueCount();
            expect(count).toBe(0);
        });

        it("should auto-increment IDs", async () => {
            const item: Omit<SyncQueueItem, "id"> = {
                type: "exercise_complete",
                data: createMockExerciseAttempt(),
                timestamp: new Date(),
                retries: 0,
            };

            const id1 = await storage.addToSyncQueue(item);
            const id2 = await storage.addToSyncQueue(item);
            const id3 = await storage.addToSyncQueue(item);

            expect(id2).toBeGreaterThan(id1);
            expect(id3).toBeGreaterThan(id2);
        });
    });

    describe("Progress Cache Store", () => {
        it("should set and get progress cache", async () => {
            const data = { test: "data" };
            await storage.setProgressCache("competency", data, 60);

            const entry = await storage.getProgressCache("competency");
            expect(entry).toBeDefined();
            expect(entry?.data).toEqual(data);
        });

        it("should set cache with expiration", async () => {
            const data = { test: "data" };
            await storage.setProgressCache("skills", data, 60);

            const entry = await storage.getProgressCache("skills");
            expect(entry?.expiresAt).toBeInstanceOf(Date);
            expect(entry!.expiresAt.getTime()).toBeGreaterThan(Date.now());
        });

        it("should detect expired cache", async () => {
            const data = { test: "data" };
            // Set with 0 minutes TTL (already expired)
            await storage.setProgressCache("history", data, -1);

            const isExpired = await storage.isProgressCacheExpired("history");
            expect(isExpired).toBe(true);
        });

        it("should detect non-expired cache", async () => {
            const data = { test: "data" };
            await storage.setProgressCache("competency", data, 60);

            const isExpired =
                await storage.isProgressCacheExpired("competency");
            expect(isExpired).toBe(false);
        });

        it("should treat non-existent cache as expired", async () => {
            const isExpired =
                await storage.isProgressCacheExpired("competency");
            expect(isExpired).toBe(true);
        });

        it("should get valid cache data", async () => {
            const data = { test: "data" };
            await storage.setProgressCache("competency", data, 60);

            const cached = await storage.getValidProgressCache("competency");
            expect(cached).toEqual(data);
        });

        it("should return null for expired cache", async () => {
            const data = { test: "data" };
            await storage.setProgressCache("skills", data, -1);

            const cached = await storage.getValidProgressCache("skills");
            expect(cached).toBeNull();
        });

        it("should return null for non-existent cache", async () => {
            const cached = await storage.getValidProgressCache("history");
            expect(cached).toBeNull();
        });

        it("should clear specific progress cache", async () => {
            await storage.setProgressCache("competency", { test: "data" }, 60);
            await storage.setProgressCache("skills", { test: "data" }, 60);

            await storage.clearProgressCache("competency");

            const comp = await storage.getProgressCache("competency");
            const skills = await storage.getProgressCache("skills");

            expect(comp).toBeUndefined();
            expect(skills).toBeDefined();
        });

        it("should clear all progress cache", async () => {
            await storage.setProgressCache("competency", { test: "data" }, 60);
            await storage.setProgressCache("skills", { test: "data" }, 60);
            await storage.setProgressCache("history", { test: "data" }, 60);

            await storage.clearAllProgressCache();

            const comp = await storage.getProgressCache("competency");
            const skills = await storage.getProgressCache("skills");
            const history = await storage.getProgressCache("history");

            expect(comp).toBeUndefined();
            expect(skills).toBeUndefined();
            expect(history).toBeUndefined();
        });

        it("should handle different data types", async () => {
            const stringData = "test string";
            const numberData = 42;
            const objectData = { nested: { value: 123 } };
            const arrayData = [1, 2, 3];

            await storage.setProgressCache("competency", stringData, 60);
            expect(await storage.getValidProgressCache("competency")).toBe(
                stringData,
            );

            await storage.setProgressCache("skills", numberData, 60);
            expect(await storage.getValidProgressCache("skills")).toBe(
                numberData,
            );

            await storage.setProgressCache("history", objectData, 60);
            expect(await storage.getValidProgressCache("history")).toEqual(
                objectData,
            );

            await storage.setProgressCache("competency", arrayData, 60);
            expect(await storage.getValidProgressCache("competency")).toEqual(
                arrayData,
            );
        });
    });

    describe("Preferences Store", () => {
        it("should set and get preference", async () => {
            await storage.setPreference("theme", "dark");

            const value = await storage.getPreference("theme");
            expect(value).toBe("dark");
        });

        it("should return undefined for non-existent preference", async () => {
            const value = await storage.getPreference("non-existent");
            expect(value).toBeUndefined();
        });

        it("should update existing preference", async () => {
            await storage.setPreference("theme", "dark");
            await storage.setPreference("theme", "light");

            const value = await storage.getPreference("theme");
            expect(value).toBe("light");
        });

        it("should store different data types", async () => {
            await storage.setPreference("string", "value");
            await storage.setPreference("number", 42);
            await storage.setPreference("boolean", true);
            await storage.setPreference("object", { nested: "value" });
            await storage.setPreference("array", [1, 2, 3]);

            expect(await storage.getPreference("string")).toBe("value");
            expect(await storage.getPreference("number")).toBe(42);
            expect(await storage.getPreference("boolean")).toBe(true);
            expect(await storage.getPreference("object")).toEqual({
                nested: "value",
            });
            expect(await storage.getPreference("array")).toEqual([1, 2, 3]);
        });

        it("should get all preferences", async () => {
            await storage.setPreference("theme", "dark");
            await storage.setPreference("fontSize", 16);
            await storage.setPreference("dyslexiaFont", false);

            const prefs = await storage.getAllPreferences();
            expect(prefs).toEqual({
                theme: "dark",
                fontSize: 16,
                dyslexiaFont: false,
            });
        });

        it("should remove preference", async () => {
            await storage.setPreference("theme", "dark");
            await storage.removePreference("theme");

            const value = await storage.getPreference("theme");
            expect(value).toBeUndefined();
        });

        it("should handle removing non-existent preference", async () => {
            // Should not throw
            await storage.removePreference("non-existent");
        });

        it("should clear all preferences", async () => {
            await storage.setPreference("theme", "dark");
            await storage.setPreference("fontSize", 16);
            await storage.setPreference("dyslexiaFont", false);

            await storage.clearPreferences();

            const prefs = await storage.getAllPreferences();
            expect(Object.keys(prefs)).toHaveLength(0);
        });
    });

    describe("Error Handling", () => {
        it("should have StorageError class defined", () => {
            const error = new StorageError(
                "Test error",
                "testOperation",
                new Error("cause"),
            );
            expect(error).toBeInstanceOf(StorageError);
            expect(error.operation).toBe("testOperation");
            expect(error.message).toContain("testOperation");
            expect(error.message).toContain("Test error");
        });

        it("should include cause in StorageError", () => {
            const cause = new Error("Original error");
            const error = new StorageError(
                "Test error",
                "testOperation",
                cause,
            );
            expect(error.cause).toBe(cause);
        });
    });

    describe("Singleton Instance", () => {
        it("should export singleton instance", async () => {
            const { offlineStorage } = await import("./storage");
            expect(offlineStorage).toBeInstanceOf(OfflineStorage);
        });
    });
});
