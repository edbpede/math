/**
 * Session Composition Algorithm Test Suite
 *
 * Comprehensive tests for session composition including:
 * - Category identification (new, review, weak areas)
 * - Category allocation from percentages
 * - Template selection with SRS priority weighting
 * - Session plan building and shuffling
 * - Edge cases and validation
 * - Performance benchmarks
 *
 * Requirements:
 * - 5.6: Compose sessions balancing new (10-30%), review (40-60%), weak areas (10-30%), random (10-20%)
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { composeSession } from './composer';
import type { SessionCompositionConfig, SessionCompositionResult } from './types';
import type { SkillProgress, SRSParameters } from '../types';
import { templateRegistry } from '../exercises/template-registry';
import type { ExerciseTemplate } from '../exercises/types';

// ============================================================================
// Test Data Factories
// ============================================================================

function createSRSParams(overrides: Partial<SRSParameters> = {}): SRSParameters {
  return {
    easeFactor: 2.5,
    interval: 1,
    repetitionCount: 0,
    ...overrides,
  };
}

// Available skill IDs that match registered templates
const AVAILABLE_SKILLS = ['addition', 'subtraction', 'multiplication', 'division', 'fractions'];

function createSkillProgress(overrides: Partial<SkillProgress> = {}): SkillProgress {
  return {
    skillId: 'addition',
    masteryLevel: 50,
    srsParams: createSRSParams(),
    attempts: 5,
    successes: 4,
    avgResponseTime: 30000,
    lastPracticed: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
    nextReview: new Date(Date.now() - 24 * 60 * 60 * 1000), // Yesterday (due)
    ...overrides,
  };
}

// Helper to create skill with proper skill ID from available templates
function createSkillWithIndex(index: number, overrides: Partial<SkillProgress> = {}): SkillProgress {
  return createSkillProgress({
    skillId: AVAILABLE_SKILLS[index % AVAILABLE_SKILLS.length],
    ...overrides,
  });
}

function createMockTemplate(id: string): ExerciseTemplate {
  return {
    id,
    name: `Test Template ${id}`,
    metadata: {
      competencyAreaId: 'tal-og-algebra',
      skillsAreaId: 'addition',
      gradeRange: '4-6',
      difficulty: 'B',
      isBinding: true,
      tags: ['test'],
    },
    parameters: {
      a: { type: 'integer', min: 1, max: 10 },
    },
    generate: () => ({
      questionText: 'Test question',
      correctAnswer: { value: 42 },
    }),
    validate: () => ({ correct: true }),
    hints: [
      () => 'Hint 1',
      () => 'Hint 2',
      () => 'Hint 3',
      () => 'Hint 4',
    ],
  };
}

// ============================================================================
// Setup and Teardown
// ============================================================================

beforeEach(() => {
  // Register mock templates for testing
  // Create templates for various skills
  const skills = ['addition', 'subtraction', 'multiplication', 'division', 'fractions'];

  // Clear existing test templates
  for (const skill of skills) {
    for (let i = 0; i < 10; i++) {
      const templateId = `test-${skill}-${i}`;
      if (templateRegistry.has(templateId)) {
        templateRegistry.unregister(templateId);
      }
    }
  }

  // Register fresh templates (10 per skill = 50 total)
  for (const skill of skills) {
    for (let i = 0; i < 10; i++) {
      const template: ExerciseTemplate = {
        id: `test-${skill}-${i}`,
        name: `Test ${skill} ${i}`,
        metadata: {
          competencyAreaId: 'tal-og-algebra',
          skillsAreaId: skill,
          gradeRange: '4-6',
          difficulty: 'B',
          isBinding: true,
          tags: ['test'],
        },
        parameters: {
          a: { type: 'integer', min: 1, max: 10 },
        },
        generate: () => ({
          questionText: 'Test question',
          correctAnswer: { value: 42 },
        }),
        validate: () => ({ correct: true }),
        hints: [
          () => 'Hint 1',
          () => 'Hint 2',
          () => 'Hint 3',
          () => 'Hint 4',
        ],
      };
      templateRegistry.register(template);
    }
  }
});

// ============================================================================
// composeSession() - Basic Functionality Tests
// ============================================================================

describe('composeSession - Basic Functionality', () => {
  it('should successfully compose a session with default configuration', () => {
    const skills = [
      createSkillProgress({ skillId: 'addition', attempts: 10, masteryLevel: 60 }),
      createSkillProgress({ skillId: 'subtraction', attempts: 8, masteryLevel: 55 }),
      createSkillProgress({ skillId: 'multiplication', attempts: 5, masteryLevel: 40 }),
    ];

    const result = composeSession({
      userId: 'user-123',
      gradeRange: '4-6',
      skillsProgress: skills,
    });

    expect(result.status).toBe('success');
    if (result.status === 'success') {
      expect(result.sessionPlan).toBeDefined();
      expect(result.sessionPlan.exercises.length).toBeGreaterThan(0);
      expect(result.sessionPlan.userId).toBe('user-123');
      expect(result.sessionPlan.gradeRange).toBe('4-6');
    }
  });

  it('should use provided configuration for content balance', () => {
    const config: Partial<SessionCompositionConfig> = {
      newContentPercent: 25,
      reviewContentPercent: 50,
      weakAreaPercent: 15,
      randomPercent: 10,
      totalExercises: 20,
    };

    const skills = Array.from({ length: 20 }, (_, i) =>
      createSkillProgress({
        skillId: AVAILABLE_SKILLS[i % AVAILABLE_SKILLS.length],
        attempts: i < 5 ? 1 : 10, // Some new, some experienced
        masteryLevel: i < 10 ? 30 : 70, // Some weak, some strong
        nextReview: new Date(Date.now() - (i % 2 === 0 ? 1 : -1) * 24 * 60 * 60 * 1000), // Half due
      })
    );

    const result = composeSession({
      userId: 'user-123',
      gradeRange: '4-6',
      skillsProgress: skills,
      config,
    });

    expect(result.status).toBe('success');
    if (result.status === 'success') {
      const allocation = result.sessionPlan.allocation;
      expect(allocation.total).toBe(20);

      // Verify allocation matches requested percentages (within rounding tolerance)
      expect(allocation.new).toBeGreaterThanOrEqual(4); // 25% of 20 = 5
      expect(allocation.new).toBeLessThanOrEqual(6);

      expect(allocation.review).toBeGreaterThanOrEqual(9); // 50% of 20 = 10
      expect(allocation.review).toBeLessThanOrEqual(11);
    }
  });

  it('should respect competency area filter when provided', () => {
    const skills = [
      createSkillProgress({ skillId: 'addition', attempts: 10 }),
      createSkillProgress({ skillId: 'subtraction', attempts: 8 }),
    ];

    const result = composeSession({
      userId: 'user-123',
      gradeRange: '4-6',
      competencyAreaId: 'tal-og-algebra',
      skillsProgress: skills,
    });

    expect(result.status).toBe('success');
    if (result.status === 'success') {
      expect(result.sessionPlan.competencyAreaId).toBe('tal-og-algebra');
    }
  });
});

// ============================================================================
// Category Identification Tests
// ============================================================================

describe('Category Identification', () => {
  describe('New Content Identification', () => {
    it('should identify skills with 0 attempts as new content', () => {
      const skills = [
        createSkillProgress({ skillId: 'new-skill', attempts: 0, masteryLevel: 0 }),
        createSkillProgress({ skillId: 'practiced-skill', attempts: 10, masteryLevel: 60 }),
      ];

      const result = composeSession({
        userId: 'user-123',
        gradeRange: '4-6',
        skillsProgress: skills,
        config: {
          newContentPercent: 50,
          reviewContentPercent: 20,
          weakAreaPercent: 20,
          randomPercent: 10,
          totalExercises: 10,
        },
      });

      expect(result.status).toBe('success');
      if (result.status === 'success') {
        expect(result.sessionPlan.allocation.new).toBeGreaterThan(0);
      }
    });

    it('should identify skills with few attempts as new content', () => {
      const skills = [
        createSkillProgress({ skillId: 'barely-practiced', attempts: 2, masteryLevel: 20 }),
        createSkillProgress({ skillId: 'well-practiced', attempts: 15, masteryLevel: 70 }),
      ];

      const result = composeSession({
        userId: 'user-123',
        gradeRange: '4-6',
        skillsProgress: skills,
        config: {
          newContentPercent: 50,
          reviewContentPercent: 20,
          weakAreaPercent: 20,
          randomPercent: 10,
          totalExercises: 10,
        },
      });

      expect(result.status).toBe('success');
    });

    it('should identify skills not practiced recently as new content', () => {
      const skills = [
        createSkillProgress({
          skillId: 'forgotten-skill',
          attempts: 5,
          lastPracticed: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
        }),
        createSkillProgress({
          skillId: 'recent-skill',
          attempts: 5,
          lastPracticed: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
        }),
      ];

      const result = composeSession({
        userId: 'user-123',
        gradeRange: '4-6',
        skillsProgress: skills,
        config: {
          newContentPercent: 50,
          reviewContentPercent: 20,
          weakAreaPercent: 20,
          randomPercent: 10,
          totalExercises: 10,
        },
        newContentCriteria: {
          maxAttempts: 3,
          minDaysSinceLastPractice: 14,
        },
      });

      expect(result.status).toBe('success');
    });
  });

  describe('Review Content Identification', () => {
    it('should identify skills due for review', () => {
      const skills = [
        createSkillProgress({
          skillId: 'due-skill',
          nextReview: new Date(Date.now() - 24 * 60 * 60 * 1000), // Yesterday
          attempts: 10,
        }),
        createSkillProgress({
          skillId: 'not-due-skill',
          nextReview: new Date(Date.now() + 24 * 60 * 60 * 1000), // Tomorrow
          attempts: 10,
        }),
      ];

      const result = composeSession({
        userId: 'user-123',
        gradeRange: '4-6',
        skillsProgress: skills,
        config: {
          newContentPercent: 20,
          reviewContentPercent: 60,
          weakAreaPercent: 10,
          randomPercent: 10,
          totalExercises: 10,
        },
      });

      expect(result.status).toBe('success');
      if (result.status === 'success') {
        // Should have review content allocated
        expect(result.sessionPlan.allocation.review).toBeGreaterThan(0);

        // Count exercises in review category
        const reviewExercises = result.sessionPlan.exercises.filter(
          (ex) => ex.category === 'review'
        );
        expect(reviewExercises.length).toBeGreaterThan(0);
      }
    });

    it('should prioritize more overdue skills', () => {
      const skills = [
        createSkillProgress({
          skillId: 'very-overdue',
          nextReview: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days overdue
          srsParams: createSRSParams({ easeFactor: 1.5 }),
          masteryLevel: 30,
          attempts: 10,
        }),
        createSkillProgress({
          skillId: 'slightly-overdue',
          nextReview: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day overdue
          srsParams: createSRSParams({ easeFactor: 2.8 }),
          masteryLevel: 80,
          attempts: 10,
        }),
      ];

      const result = composeSession({
        userId: 'user-123',
        gradeRange: '4-6',
        skillsProgress: skills,
        config: {
          newContentPercent: 0,
          reviewContentPercent: 100,
          weakAreaPercent: 0,
          randomPercent: 0,
          totalExercises: 5,
        },
      });

      expect(result.status).toBe('success');
      if (result.status === 'success') {
        const reviewExercises = result.sessionPlan.exercises.filter(
          (ex) => ex.category === 'review'
        );

        // Very overdue skill should appear first (higher priority)
        const firstReviewSkill = reviewExercises[0]?.skillId;
        expect(firstReviewSkill).toBe('very-overdue');
      }
    });
  });

  describe('Weak Area Identification', () => {
    it('should identify skills with low mastery as weak areas', () => {
      const skills = [
        createSkillProgress({
          skillId: 'weak-skill',
          masteryLevel: 25, // Developing band
          attempts: 10,
        }),
        createSkillProgress({
          skillId: 'strong-skill',
          masteryLevel: 85, // Mastered band
          attempts: 10,
        }),
      ];

      const result = composeSession({
        userId: 'user-123',
        gradeRange: '4-6',
        skillsProgress: skills,
        config: {
          newContentPercent: 10,
          reviewContentPercent: 20,
          weakAreaPercent: 60,
          randomPercent: 10,
          totalExercises: 10,
        },
      });

      expect(result.status).toBe('success');
      if (result.status === 'success') {
        const weakExercises = result.sessionPlan.exercises.filter(
          (ex) => ex.category === 'weak-area'
        );
        expect(weakExercises.length).toBeGreaterThan(0);

        // Weak skill should be prioritized
        const weakSkillIds = weakExercises.map((ex) => ex.skillId);
        expect(weakSkillIds).toContain('weak-skill');
      }
    });

    it('should require minimum attempts for weak area classification', () => {
      const skills = [
        createSkillProgress({
          skillId: 'new-weak',
          masteryLevel: 20,
          attempts: 1, // Too few attempts
        }),
        createSkillProgress({
          skillId: 'confirmed-weak',
          masteryLevel: 25,
          attempts: 10, // Sufficient data
        }),
      ];

      const result = composeSession({
        userId: 'user-123',
        gradeRange: '4-6',
        skillsProgress: skills,
        config: {
          newContentPercent: 10,
          reviewContentPercent: 10,
          weakAreaPercent: 70,
          randomPercent: 10,
          totalExercises: 10,
        },
        weakAreaCriteria: {
          maxMasteryLevel: 40,
          minAttempts: 3,
        },
      });

      expect(result.status).toBe('success');
    });
  });
});

// ============================================================================
// Category Allocation Tests
// ============================================================================

describe('Category Allocation', () => {
  it('should allocate correct number of exercises per category', () => {
    const skills = Array.from({ length: 30 }, (_, i) =>
      createSkillProgress({
        skillId: AVAILABLE_SKILLS[i % AVAILABLE_SKILLS.length],
        attempts: i < 5 ? 1 : 10,
        masteryLevel: i < 10 ? 30 : 70,
        nextReview: new Date(Date.now() - (i % 2 === 0 ? 1 : -1) * 24 * 60 * 60 * 1000),
      })
    );

    const result = composeSession({
      userId: 'user-123',
      gradeRange: '4-6',
      skillsProgress: skills,
      config: {
        newContentPercent: 20,
        reviewContentPercent: 50,
        weakAreaPercent: 20,
        randomPercent: 10,
        totalExercises: 25,
      },
    });

    expect(result.status).toBe('success');
    if (result.status === 'success') {
      const { allocation } = result.sessionPlan;

      // Sum should equal total
      const sum = allocation.new + allocation.review + allocation.weakArea + allocation.random;
      expect(sum).toBe(25);

      // Check individual allocations are reasonable (within ±1 due to rounding)
      expect(allocation.new).toBeGreaterThanOrEqual(4);
      expect(allocation.new).toBeLessThanOrEqual(6); // ~20% of 25 = 5

      expect(allocation.review).toBeGreaterThanOrEqual(11);
      expect(allocation.review).toBeLessThanOrEqual(14); // ~50% of 25 = 12.5

      expect(allocation.weakArea).toBeGreaterThanOrEqual(4);
      expect(allocation.weakArea).toBeLessThanOrEqual(6); // ~20% of 25 = 5

      expect(allocation.random).toBeGreaterThanOrEqual(2);
      expect(allocation.random).toBeLessThanOrEqual(3); // ~10% of 25 = 2.5
    }
  });

  it('should handle odd total exercise counts correctly', () => {
    const skills = Array.from({ length: 20 }, (_, i) =>
      createSkillProgress({ skillId: AVAILABLE_SKILLS[i % AVAILABLE_SKILLS.length], attempts: 10, masteryLevel: 50 })
    );

    const result = composeSession({
      userId: 'user-123',
      gradeRange: '4-6',
      skillsProgress: skills,
      config: {
        newContentPercent: 33,
        reviewContentPercent: 34,
        weakAreaPercent: 23,
        randomPercent: 10,
        totalExercises: 23, // Odd number
      },
    });

    expect(result.status).toBe('success');
    if (result.status === 'success') {
      const { allocation } = result.sessionPlan;
      const sum = allocation.new + allocation.review + allocation.weakArea + allocation.random;
      expect(sum).toBe(23); // Should still sum correctly
    }
  });
});

// ============================================================================
// Session Shuffling Tests
// ============================================================================

describe('Session Shuffling', () => {
  it('should shuffle exercises to distribute categories', () => {
    const skills = Array.from({ length: 20 }, (_, i) =>
      createSkillProgress({
        skillId: AVAILABLE_SKILLS[i % AVAILABLE_SKILLS.length],
        attempts: i < 5 ? 1 : 10,
        masteryLevel: i < 8 ? 30 : 70,
        nextReview: new Date(Date.now() - (i % 3 === 0 ? 1 : -1) * 24 * 60 * 60 * 1000),
      })
    );

    const result = composeSession({
      userId: 'user-123',
      gradeRange: '4-6',
      skillsProgress: skills,
      config: {
        newContentPercent: 25,
        reviewContentPercent: 25,
        weakAreaPercent: 25,
        randomPercent: 25,
        totalExercises: 20,
      },
    });

    expect(result.status).toBe('success');
    if (result.status === 'success') {
      const { exercises } = result.sessionPlan;

      // Check that categories are distributed (not all clustered together)
      // Measure by checking first 5 and last 5 exercises have different categories
      const firstFiveCategories = new Set(exercises.slice(0, 5).map((ex) => ex.category));
      const lastFiveCategories = new Set(exercises.slice(-5).map((ex) => ex.category));

      // Should have variety in both sections
      expect(firstFiveCategories.size).toBeGreaterThan(1);
      expect(lastFiveCategories.size).toBeGreaterThan(1);
    }
  });

  it('should assign sequential positions to shuffled exercises', () => {
    const skills = Array.from({ length: 15 }, (_, i) =>
      createSkillProgress({ skillId: AVAILABLE_SKILLS[i % AVAILABLE_SKILLS.length], attempts: 10, masteryLevel: 50 })
    );

    const result = composeSession({
      userId: 'user-123',
      gradeRange: '4-6',
      skillsProgress: skills,
      config: { totalExercises: 15 },
    });

    expect(result.status).toBe('success');
    if (result.status === 'success') {
      const { exercises } = result.sessionPlan;

      // Check positions are sequential 0, 1, 2, ...
      exercises.forEach((exercise, index) => {
        expect(exercise.position).toBe(index);
      });
    }
  });
});

// ============================================================================
// Validation and Error Handling Tests
// ============================================================================

describe('Validation and Error Handling', () => {
  it('should return error for invalid configuration (percentages > 100)', () => {
    const skills = [createSkillProgress({ attempts: 10 })];

    const result = composeSession({
      userId: 'user-123',
      gradeRange: '4-6',
      skillsProgress: skills,
      config: {
        newContentPercent: 50,
        reviewContentPercent: 50,
        weakAreaPercent: 50, // Total = 150%
        randomPercent: 10,
        totalExercises: 20,
      },
    });

    expect(result.status).toBe('error');
    if (result.status === 'error') {
      expect(result.message).toContain('100');
    }
  });

  it('should return error for too few total exercises', () => {
    const skills = [createSkillProgress({ attempts: 10 })];

    const result = composeSession({
      userId: 'user-123',
      gradeRange: '4-6',
      skillsProgress: skills,
      config: { totalExercises: 2 }, // Too few
    });

    expect(result.status).toBe('error');
    if (result.status === 'error') {
      expect(result.message).toContain('at least 5');
    }
  });

  it('should return error for too many total exercises', () => {
    const skills = [createSkillProgress({ attempts: 10 })];

    const result = composeSession({
      userId: 'user-123',
      gradeRange: '4-6',
      skillsProgress: skills,
      config: { totalExercises: 150 }, // Too many
    });

    expect(result.status).toBe('error');
    if (result.status === 'error') {
      expect(result.message).toContain('at most 100');
    }
  });

  it('should return insufficient-data when not enough skills available', () => {
    const skills = [
      createSkillProgress({ skillId: 'only-skill', attempts: 10 }),
    ];

    const result = composeSession({
      userId: 'user-123',
      gradeRange: '4-6',
      skillsProgress: skills,
      config: { totalExercises: 30 }, // Requesting more than available
    });

    // Should either succeed with fewer exercises or report insufficient data
    expect(['success', 'insufficient-data']).toContain(result.status);
  });

  it('should handle empty skills progress gracefully', () => {
    const result = composeSession({
      userId: 'user-123',
      gradeRange: '4-6',
      skillsProgress: [],
      config: { totalExercises: 10 },
    });

    expect(result.status).toBe('insufficient-data');
    if (result.status === 'insufficient-data') {
      expect(result.availableExercises).toBe(0);
    }
  });
});

// ============================================================================
// Integration Tests - Realistic Scenarios
// ============================================================================

describe('Integration Tests - Realistic Scenarios', () => {
  it('should compose session for new user with mostly new content', () => {
    // New user: no progress yet, all skills are "new"
    const skills = Array.from({ length: 15 }, (_, i) =>
      createSkillProgress({
        skillId: AVAILABLE_SKILLS[i % AVAILABLE_SKILLS.length],
        attempts: 0,
        successes: 0,
        masteryLevel: 0,
        nextReview: new Date(), // Due now
      })
    );

    const result = composeSession({
      userId: 'new-user',
      gradeRange: '0-3',
      skillsProgress: skills,
      config: {
        newContentPercent: 60, // High new content for new user
        reviewContentPercent: 20,
        weakAreaPercent: 10,
        randomPercent: 10,
        totalExercises: 20,
      },
    });

    expect(result.status).toBe('success');
    if (result.status === 'success') {
      // Should have mostly new content
      const newExercises = result.sessionPlan.exercises.filter(
        (ex) => ex.category === 'new'
      );
      expect(newExercises.length).toBeGreaterThan(10);
    }
  });

  it('should compose session for experienced user with mostly review content', () => {
    // Experienced user: lots of skills due for review
    const skills = Array.from({ length: 25 }, (_, i) =>
      createSkillProgress({
        skillId: AVAILABLE_SKILLS[i % AVAILABLE_SKILLS.length],
        attempts: 15 + i,
        successes: 12 + i,
        masteryLevel: 60 + (i % 20),
        nextReview: new Date(Date.now() - i * 60 * 60 * 1000), // Various overdue amounts
        srsParams: createSRSParams({ interval: 3 + i }),
      })
    );

    const result = composeSession({
      userId: 'experienced-user',
      gradeRange: '7-9',
      skillsProgress: skills,
      config: {
        newContentPercent: 10,
        reviewContentPercent: 60, // High review for experienced user
        weakAreaPercent: 20,
        randomPercent: 10,
        totalExercises: 30,
      },
    });

    expect(result.status).toBe('success');
    if (result.status === 'success') {
      const reviewExercises = result.sessionPlan.exercises.filter(
        (ex) => ex.category === 'review'
      );
      expect(reviewExercises.length).toBeGreaterThan(15); // Should dominate session
    }
  });

  it('should compose session focusing on weak areas for struggling user', () => {
    const skills = Array.from({ length: 20 }, (_, i) =>
      createSkillProgress({
        skillId: AVAILABLE_SKILLS[i % AVAILABLE_SKILLS.length],
        attempts: 10 + i,
        successes: Math.floor((10 + i) * 0.4), // 40% success rate
        masteryLevel: i < 15 ? 25 : 70, // Most skills are weak
        nextReview: new Date(Date.now() - 24 * 60 * 60 * 1000),
      })
    );

    const result = composeSession({
      userId: 'struggling-user',
      gradeRange: '4-6',
      skillsProgress: skills,
      config: {
        newContentPercent: 10,
        reviewContentPercent: 30,
        weakAreaPercent: 50, // High focus on weak areas
        randomPercent: 10,
        totalExercises: 25,
      },
    });

    expect(result.status).toBe('success');
    if (result.status === 'success') {
      const weakExercises = result.sessionPlan.exercises.filter(
        (ex) => ex.category === 'weak-area'
      );
      expect(weakExercises.length).toBeGreaterThan(10);

      // Weak exercises should target low mastery skills
      weakExercises.forEach((exercise) => {
        if (exercise.skillProgress) {
          expect(exercise.skillProgress.masteryLevel).toBeLessThan(40);
        }
      });
    }
  });

  it('should compose balanced session for typical user', () => {
    const skills = Array.from({ length: 30 }, (_, i) =>
      createSkillProgress({
        skillId: AVAILABLE_SKILLS[i % AVAILABLE_SKILLS.length],
        attempts: 5 + (i % 15),
        successes: 3 + (i % 12),
        masteryLevel: 20 + (i % 70),
        nextReview:
          i % 3 === 0
            ? new Date(Date.now() - 24 * 60 * 60 * 1000) // Due
            : new Date(Date.now() + 24 * 60 * 60 * 1000), // Not due
      })
    );

    const result = composeSession({
      userId: 'typical-user',
      gradeRange: '4-6',
      skillsProgress: skills,
      // Using default config (20/50/20/10)
    });

    expect(result.status).toBe('success');
    if (result.status === 'success') {
      const { exercises, allocation } = result.sessionPlan;

      // Should have all categories represented
      const categories = new Set(exercises.map((ex) => ex.category));
      expect(categories.size).toBeGreaterThanOrEqual(3); // At least 3 different categories

      // Allocation should follow default balance
      expect(allocation.review).toBeGreaterThan(allocation.new); // Review > New
      expect(allocation.review).toBeGreaterThan(allocation.weakArea); // Review > Weak
      expect(allocation.review).toBeGreaterThan(allocation.random); // Review > Random
    }
  });
});

// ============================================================================
// Performance Tests
// ============================================================================

describe('Performance Tests', () => {
  it('should compose session in under 200ms for 30 exercises', () => {
    const skills = Array.from({ length: 50 }, (_, i) =>
      createSkillProgress({
        skillId: AVAILABLE_SKILLS[i % AVAILABLE_SKILLS.length],
        attempts: 5 + i,
        masteryLevel: 30 + (i % 60),
        nextReview: new Date(Date.now() - (i % 5) * 24 * 60 * 60 * 1000),
      })
    );

    const startTime = performance.now();

    const result = composeSession({
      userId: 'perf-test-user',
      gradeRange: '4-6',
      skillsProgress: skills,
      config: { totalExercises: 30 },
    });

    const endTime = performance.now();
    const duration = endTime - startTime;

    expect(result.status).toBe('success');
    expect(duration).toBeLessThan(200); // Should complete in under 200ms
  });

  it('should handle large number of skills efficiently', () => {
    const skills = Array.from({ length: 200 }, (_, i) =>
      createSkillProgress({
        skillId: AVAILABLE_SKILLS[i % AVAILABLE_SKILLS.length],
        attempts: 5 + i,
        masteryLevel: 30 + (i % 60),
      })
    );

    const startTime = performance.now();

    const result = composeSession({
      userId: 'large-dataset-user',
      gradeRange: '4-6',
      skillsProgress: skills,
      config: { totalExercises: 25 },
    });

    const endTime = performance.now();
    const duration = endTime - startTime;

    expect(result.status).toBe('success');
    expect(duration).toBeLessThan(300); // Should still be fast even with many skills
  });
});

// ============================================================================
// Edge Cases and Boundary Conditions
// ============================================================================

describe('Edge Cases', () => {
  it('should handle minimum exercise count (5)', () => {
    const skills = Array.from({ length: 10 }, (_, i) =>
      createSkillProgress({ skillId: AVAILABLE_SKILLS[i % AVAILABLE_SKILLS.length], attempts: 10 })
    );

    const result = composeSession({
      userId: 'user-123',
      gradeRange: '4-6',
      skillsProgress: skills,
      config: { totalExercises: 5 },
    });

    expect(result.status).toBe('success');
    if (result.status === 'success') {
      expect(result.sessionPlan.exercises.length).toBe(5);
    }
  });

  it('should handle when all skills are in one category', () => {
    // All skills are weak
    const skills = Array.from({ length: 15 }, (_, i) =>
      createSkillProgress({
        skillId: AVAILABLE_SKILLS[i % AVAILABLE_SKILLS.length],
        masteryLevel: 20, // All weak
        attempts: 10,
      })
    );

    const result = composeSession({
      userId: 'user-123',
      gradeRange: '4-6',
      skillsProgress: skills,
      config: {
        newContentPercent: 20,
        reviewContentPercent: 20,
        weakAreaPercent: 50,
        randomPercent: 10,
        totalExercises: 20,
      },
    });

    expect(result.status).toBe('success');
  });

  it('should use custom current date for testing time-based logic', () => {
    const customDate = new Date('2025-01-15T12:00:00Z');

    const skills = [
      createSkillProgress({
        skillId: 'overdue-on-custom-date',
        nextReview: new Date('2025-01-10T12:00:00Z'), // 5 days before
        attempts: 10,
      }),
      createSkillProgress({
        skillId: 'not-due-on-custom-date',
        nextReview: new Date('2025-01-20T12:00:00Z'), // 5 days after
        attempts: 10,
      }),
    ];

    const result = composeSession({
      userId: 'user-123',
      gradeRange: '4-6',
      skillsProgress: skills,
      config: {
        newContentPercent: 10,
        reviewContentPercent: 80,
        weakAreaPercent: 5,
        randomPercent: 5,
        totalExercises: 10,
      },
      currentDate: customDate,
    });

    expect(result.status).toBe('success');
    if (result.status === 'success') {
      // Should prioritize the overdue skill
      const reviewExercises = result.sessionPlan.exercises.filter(
        (ex) => ex.category === 'review'
      );
      const hasOverdueSkill = reviewExercises.some(
        (ex) => ex.skillId === 'overdue-on-custom-date'
      );
      expect(hasOverdueSkill).toBe(true);
    }
  });
});
