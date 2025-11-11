/**
 * Conflict Resolution Tests
 *
 * Tests for conflict resolution logic between local and server progress data.
 */

import { describe, it, expect } from "vitest";
import {
    mergeCompetencyProgress,
    mergeSkillProgress,
    isNewer,
    isSameCompetency,
} from "./conflict-resolution";
import type { CompetencyProgress, SkillProgress } from "../mastery/types";

describe("Conflict Resolution", () => {
    describe("isNewer", () => {
        it("should return true when dateA is newer than dateB", () => {
            const dateA = new Date("2024-01-15");
            const dateB = new Date("2024-01-10");
            expect(isNewer(dateA, dateB)).toBe(true);
        });

        it("should return false when dateA is older than dateB", () => {
            const dateA = new Date("2024-01-10");
            const dateB = new Date("2024-01-15");
            expect(isNewer(dateA, dateB)).toBe(false);
        });

        it("should return false when dates are equal", () => {
            const date = new Date("2024-01-15");
            expect(isNewer(date, date)).toBe(false);
        });
    });

    describe("isSameCompetency", () => {
        it("should return true for matching competency area and grade range", () => {
            const a: CompetencyProgress = {
                competencyAreaId: "tal-og-algebra",
                gradeRange: "4-6",
                masteryLevel: 50,
                totalAttempts: 10,
                successRate: 80,
                lastPracticed: new Date(),
            };
            const b: CompetencyProgress = {
                ...a,
                masteryLevel: 60,
            };
            expect(isSameCompetency(a, b)).toBe(true);
        });

        it("should return false for different competency areas", () => {
            const a: CompetencyProgress = {
                competencyAreaId: "tal-og-algebra",
                gradeRange: "4-6",
                masteryLevel: 50,
                totalAttempts: 10,
                successRate: 80,
                lastPracticed: new Date(),
            };
            const b: CompetencyProgress = {
                ...a,
                competencyAreaId: "geometri-og-maling",
            };
            expect(isSameCompetency(a, b)).toBe(false);
        });

        it("should return false for different grade ranges", () => {
            const a: CompetencyProgress = {
                competencyAreaId: "tal-og-algebra",
                gradeRange: "4-6",
                masteryLevel: 50,
                totalAttempts: 10,
                successRate: 80,
                lastPracticed: new Date(),
            };
            const b: CompetencyProgress = {
                ...a,
                gradeRange: "7-9",
            };
            expect(isSameCompetency(a, b)).toBe(false);
        });
    });

    describe("mergeCompetencyProgress", () => {
        it("should use maximum mastery level", () => {
            const local: CompetencyProgress = {
                competencyAreaId: "tal-og-algebra",
                gradeRange: "4-6",
                masteryLevel: 75,
                totalAttempts: 10,
                successRate: 80,
                lastPracticed: new Date("2024-01-15"),
            };
            const server: CompetencyProgress = {
                competencyAreaId: "tal-og-algebra",
                gradeRange: "4-6",
                masteryLevel: 60,
                totalAttempts: 15,
                successRate: 70,
                lastPracticed: new Date("2024-01-10"),
            };

            const merged = mergeCompetencyProgress(local, server);

            expect(merged.masteryLevel).toBe(75); // Maximum of 75 and 60
        });

        it("should use latest lastPracticed timestamp", () => {
            const local: CompetencyProgress = {
                competencyAreaId: "tal-og-algebra",
                gradeRange: "4-6",
                masteryLevel: 50,
                totalAttempts: 10,
                successRate: 80,
                lastPracticed: new Date("2024-01-15"),
            };
            const server: CompetencyProgress = {
                competencyAreaId: "tal-og-algebra",
                gradeRange: "4-6",
                masteryLevel: 60,
                totalAttempts: 15,
                successRate: 70,
                lastPracticed: new Date("2024-01-10"),
            };

            const merged = mergeCompetencyProgress(local, server);

            expect(merged.lastPracticed).toEqual(new Date("2024-01-15"));
        });

        it("should sum total attempts", () => {
            const local: CompetencyProgress = {
                competencyAreaId: "tal-og-algebra",
                gradeRange: "4-6",
                masteryLevel: 50,
                totalAttempts: 10,
                successRate: 80,
                lastPracticed: new Date(),
            };
            const server: CompetencyProgress = {
                competencyAreaId: "tal-og-algebra",
                gradeRange: "4-6",
                masteryLevel: 60,
                totalAttempts: 15,
                successRate: 70,
                lastPracticed: new Date(),
            };

            const merged = mergeCompetencyProgress(local, server);

            expect(merged.totalAttempts).toBe(25); // 10 + 15
        });

        it("should recalculate success rate from merged data", () => {
            const local: CompetencyProgress = {
                competencyAreaId: "tal-og-algebra",
                gradeRange: "4-6",
                masteryLevel: 50,
                totalAttempts: 10,
                successRate: 80, // 8 successes
                lastPracticed: new Date(),
            };
            const server: CompetencyProgress = {
                competencyAreaId: "tal-og-algebra",
                gradeRange: "4-6",
                masteryLevel: 60,
                totalAttempts: 10,
                successRate: 60, // 6 successes
                lastPracticed: new Date(),
            };

            const merged = mergeCompetencyProgress(local, server);

            // Total successes: 8 + 6 = 14
            // Total attempts: 10 + 10 = 20
            // Success rate: 14/20 = 70%
            expect(merged.successRate).toBe(70);
        });

        it("should keep earliest achievedAt", () => {
            const local: CompetencyProgress = {
                competencyAreaId: "tal-og-algebra",
                gradeRange: "4-6",
                masteryLevel: 80,
                totalAttempts: 10,
                successRate: 80,
                lastPracticed: new Date(),
                achievedAt: new Date("2024-01-15"),
            };
            const server: CompetencyProgress = {
                competencyAreaId: "tal-og-algebra",
                gradeRange: "4-6",
                masteryLevel: 85,
                totalAttempts: 15,
                successRate: 85,
                lastPracticed: new Date(),
                achievedAt: new Date("2024-01-10"),
            };

            const merged = mergeCompetencyProgress(local, server);

            expect(merged.achievedAt).toEqual(new Date("2024-01-10"));
        });

        it("should throw error when merging different competency areas", () => {
            const local: CompetencyProgress = {
                competencyAreaId: "tal-og-algebra",
                gradeRange: "4-6",
                masteryLevel: 50,
                totalAttempts: 10,
                successRate: 80,
                lastPracticed: new Date(),
            };
            const server: CompetencyProgress = {
                competencyAreaId: "geometri-og-maling",
                gradeRange: "4-6",
                masteryLevel: 60,
                totalAttempts: 15,
                successRate: 70,
                lastPracticed: new Date(),
            };

            expect(() => mergeCompetencyProgress(local, server)).toThrow();
        });
    });

    describe("mergeSkillProgress", () => {
        it("should use maximum mastery level", () => {
            const local: SkillProgress = {
                skillId: "addition-two-digit",
                masteryLevel: 75,
                srsParams: { easeFactor: 2.5, interval: 7, repetitionCount: 3 },
                attempts: 10,
                successes: 8,
                avgResponseTime: 5000,
                lastPracticed: new Date("2024-01-15"),
                nextReview: new Date("2024-01-22"),
            };
            const server: SkillProgress = {
                skillId: "addition-two-digit",
                masteryLevel: 60,
                srsParams: { easeFactor: 2.3, interval: 5, repetitionCount: 2 },
                attempts: 15,
                successes: 10,
                avgResponseTime: 6000,
                lastPracticed: new Date("2024-01-10"),
                nextReview: new Date("2024-01-17"),
            };

            const merged = mergeSkillProgress(local, server);

            expect(merged.masteryLevel).toBe(75);
        });

        it("should use latest lastPracticed timestamp", () => {
            const local: SkillProgress = {
                skillId: "addition-two-digit",
                masteryLevel: 50,
                srsParams: { easeFactor: 2.5, interval: 7, repetitionCount: 3 },
                attempts: 10,
                successes: 8,
                avgResponseTime: 5000,
                lastPracticed: new Date("2024-01-15"),
                nextReview: new Date("2024-01-22"),
            };
            const server: SkillProgress = {
                skillId: "addition-two-digit",
                masteryLevel: 60,
                srsParams: { easeFactor: 2.3, interval: 5, repetitionCount: 2 },
                attempts: 15,
                successes: 10,
                avgResponseTime: 6000,
                lastPracticed: new Date("2024-01-10"),
                nextReview: new Date("2024-01-17"),
            };

            const merged = mergeSkillProgress(local, server);

            expect(merged.lastPracticed).toEqual(new Date("2024-01-15"));
        });

        it("should sum attempts and successes", () => {
            const local: SkillProgress = {
                skillId: "addition-two-digit",
                masteryLevel: 50,
                srsParams: { easeFactor: 2.5, interval: 7, repetitionCount: 3 },
                attempts: 10,
                successes: 8,
                avgResponseTime: 5000,
                lastPracticed: new Date(),
                nextReview: new Date(),
            };
            const server: SkillProgress = {
                skillId: "addition-two-digit",
                masteryLevel: 60,
                srsParams: { easeFactor: 2.3, interval: 5, repetitionCount: 2 },
                attempts: 15,
                successes: 10,
                avgResponseTime: 6000,
                lastPracticed: new Date(),
                nextReview: new Date(),
            };

            const merged = mergeSkillProgress(local, server);

            expect(merged.attempts).toBe(25); // 10 + 15
            expect(merged.successes).toBe(18); // 8 + 10
        });

        it("should calculate weighted average response time", () => {
            const local: SkillProgress = {
                skillId: "addition-two-digit",
                masteryLevel: 50,
                srsParams: { easeFactor: 2.5, interval: 7, repetitionCount: 3 },
                attempts: 10,
                successes: 8,
                avgResponseTime: 5000,
                lastPracticed: new Date(),
                nextReview: new Date(),
            };
            const server: SkillProgress = {
                skillId: "addition-two-digit",
                masteryLevel: 60,
                srsParams: { easeFactor: 2.3, interval: 5, repetitionCount: 2 },
                attempts: 10,
                successes: 10,
                avgResponseTime: 7000,
                lastPracticed: new Date(),
                nextReview: new Date(),
            };

            const merged = mergeSkillProgress(local, server);

            // (5000 * 10 + 7000 * 10) / 20 = 6000
            expect(merged.avgResponseTime).toBe(6000);
        });

        it("should use SRS params from higher repetition count", () => {
            const local: SkillProgress = {
                skillId: "addition-two-digit",
                masteryLevel: 50,
                srsParams: { easeFactor: 2.5, interval: 7, repetitionCount: 5 },
                attempts: 10,
                successes: 8,
                avgResponseTime: 5000,
                lastPracticed: new Date("2024-01-15"),
                nextReview: new Date("2024-01-22"),
            };
            const server: SkillProgress = {
                skillId: "addition-two-digit",
                masteryLevel: 60,
                srsParams: { easeFactor: 2.3, interval: 5, repetitionCount: 3 },
                attempts: 15,
                successes: 10,
                avgResponseTime: 6000,
                lastPracticed: new Date("2024-01-10"),
                nextReview: new Date("2024-01-17"),
            };

            const merged = mergeSkillProgress(local, server);

            expect(merged.srsParams).toEqual(local.srsParams);
            expect(merged.nextReview).toEqual(local.nextReview);
        });

        it("should use SRS params from newer practice when repetition counts are equal", () => {
            const local: SkillProgress = {
                skillId: "addition-two-digit",
                masteryLevel: 50,
                srsParams: { easeFactor: 2.5, interval: 7, repetitionCount: 3 },
                attempts: 10,
                successes: 8,
                avgResponseTime: 5000,
                lastPracticed: new Date("2024-01-15"),
                nextReview: new Date("2024-01-22"),
            };
            const server: SkillProgress = {
                skillId: "addition-two-digit",
                masteryLevel: 60,
                srsParams: { easeFactor: 2.3, interval: 5, repetitionCount: 3 },
                attempts: 15,
                successes: 10,
                avgResponseTime: 6000,
                lastPracticed: new Date("2024-01-10"),
                nextReview: new Date("2024-01-17"),
            };

            const merged = mergeSkillProgress(local, server);

            // Local has newer lastPracticed, so use local SRS params
            expect(merged.srsParams).toEqual(local.srsParams);
            expect(merged.nextReview).toEqual(local.nextReview);
        });

        it("should throw error when merging different skills", () => {
            const local: SkillProgress = {
                skillId: "addition-two-digit",
                masteryLevel: 50,
                srsParams: { easeFactor: 2.5, interval: 7, repetitionCount: 3 },
                attempts: 10,
                successes: 8,
                avgResponseTime: 5000,
                lastPracticed: new Date(),
                nextReview: new Date(),
            };
            const server: SkillProgress = {
                skillId: "subtraction-two-digit",
                masteryLevel: 60,
                srsParams: { easeFactor: 2.3, interval: 5, repetitionCount: 2 },
                attempts: 15,
                successes: 10,
                avgResponseTime: 6000,
                lastPracticed: new Date(),
                nextReview: new Date(),
            };

            expect(() => mergeSkillProgress(local, server)).toThrow();
        });
    });
});
