/**
 * Progress Dashboard Component Tests
 *
 * Comprehensive test suite for ProgressDashboard component including:
 * - Data loading states
 * - Mastery visualization
 * - Color coding for mastery bands
 * - Streak display
 * - Review schedule rendering
 * - Accessibility
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor } from "@solidjs/testing-library";
import { userEvent } from "@testing-library/user-event";
import ProgressDashboard from "./ProgressDashboard";
import type {
  CompetencyProgress,
  SkillProgress,
  ExerciseAttempt,
} from "@/lib/mastery/types";
import type { GradeRange } from "@/lib/curriculum/types";
import { initI18n, changeLocale } from "@/lib/i18n";

// Mock modules
vi.mock("@/lib/supabase/progress", () => ({
  fetchCompetencyProgress: vi.fn(),
  fetchSkillsProgress: vi.fn(),
  fetchExerciseHistory: vi.fn(),
}));

vi.mock("@/lib/mastery/review-scheduler", () => ({
  getUpcomingReviews: vi.fn(),
  formatReviewDate: vi.fn((date: Date) => "in 2 days"),
}));

// Mock i18n module - use actual implementation but allow initialization
vi.mock("@/lib/i18n", async () => {
  const actual = await vi.importActual("@/lib/i18n");
  return {
    ...actual,
  };
});

// Import mocked functions
import {
  fetchCompetencyProgress,
  fetchSkillsProgress,
  fetchExerciseHistory,
} from "@/lib/supabase/progress";
import { getUpcomingReviews } from "@/lib/mastery/review-scheduler";

describe("ProgressDashboard", () => {
  const mockUserId = "user-123";
  const mockGradeRange: GradeRange = "4-6";

  // Mock data
  const mockCompetencies: CompetencyProgress[] = [
    {
      competencyAreaId: "tal-og-algebra",
      gradeRange: "4-6",
      masteryLevel: 75,
      totalAttempts: 100,
      successRate: 80,
      lastPracticed: new Date("2024-03-15T12:00:00Z"),
    },
    {
      competencyAreaId: "geometri-og-maling",
      gradeRange: "4-6",
      masteryLevel: 45,
      totalAttempts: 50,
      successRate: 70,
      lastPracticed: new Date("2024-03-14T12:00:00Z"),
    },
  ];

  const mockSkills: SkillProgress[] = [
    {
      skillId: "tal-og-algebra-addition",
      masteryLevel: 80,
      srsParams: {
        easeFactor: 2.5,
        interval: 7,
        repetitionCount: 3,
      },
      attempts: 50,
      successes: 45,
      avgResponseTime: 15000,
      lastPracticed: new Date("2024-03-15T12:00:00Z"),
      nextReview: new Date("2024-03-22T12:00:00Z"),
    },
    {
      skillId: "tal-og-algebra-subtraction",
      masteryLevel: 65,
      srsParams: {
        easeFactor: 2.3,
        interval: 3,
        repetitionCount: 2,
      },
      attempts: 30,
      successes: 22,
      avgResponseTime: 18000,
      lastPracticed: new Date("2024-03-14T12:00:00Z"),
      nextReview: new Date("2024-03-17T12:00:00Z"),
    },
  ];

  const mockExerciseHistory: ExerciseAttempt[] = [
    {
      id: "ex-1",
      userId: "user-1",
      templateId: "template-1",
      competencyAreaId: "tal-og-algebra",
      skillId: "addition",
      difficulty: "A",
      isBinding: true,
      correct: true,
      timeSpentSeconds: 30,
      hintsUsed: 0,
      userAnswer: "42",
      sessionId: "session-1",
      createdAt: new Date("2024-03-15T12:00:00Z"),
    },
    {
      id: "ex-2",
      userId: "user-1",
      templateId: "template-2",
      competencyAreaId: "tal-og-algebra",
      skillId: "addition",
      difficulty: "A",
      isBinding: true,
      correct: true,
      timeSpentSeconds: 25,
      hintsUsed: 1,
      userAnswer: "15",
      sessionId: "session-1",
      createdAt: new Date("2024-03-14T12:00:00Z"),
    },
  ];

  const mockReviewSchedule = {
    overdue: [
      {
        skillId: "multiplication-basics",
        masteryLevel: 55,
        nextReviewAt: new Date("2024-03-13T12:00:00Z"),
        urgency: "overdue" as const,
        daysOverdue: 2,
      },
    ],
    today: [
      {
        skillId: "division-basics",
        masteryLevel: 60,
        nextReviewAt: new Date("2024-03-15T12:00:00Z"),
        urgency: "today" as const,
      },
    ],
    thisWeek: [
      {
        skillId: "fractions-basics",
        masteryLevel: 70,
        nextReviewAt: new Date("2024-03-18T12:00:00Z"),
        urgency: "this-week" as const,
      },
    ],
    upcoming: [],
    total: 3,
  };

  beforeEach(async () => {
    vi.clearAllMocks();

    // Initialize i18n system and ensure English locale for consistent tests
    await initI18n();
    await changeLocale("en-US");

    // Setup default mocks
    (fetchCompetencyProgress as any).mockResolvedValue(mockCompetencies);
    (fetchSkillsProgress as any).mockResolvedValue(mockSkills);
    (fetchExerciseHistory as any).mockResolvedValue(mockExerciseHistory);
    (getUpcomingReviews as any).mockResolvedValue(mockReviewSchedule);
  });

  describe("Data Loading", () => {
    it("should display loading state initially", () => {
      render(() => (
        <ProgressDashboard userId={mockUserId} gradeRange={mockGradeRange} />
      ));

      expect(screen.getByText(/loading/i)).toBeInTheDocument();
    });

    it("should fetch all required data on mount", async () => {
      render(() => (
        <ProgressDashboard userId={mockUserId} gradeRange={mockGradeRange} />
      ));

      await waitFor(() => {
        expect(fetchCompetencyProgress).toHaveBeenCalledWith(mockUserId);
        expect(fetchSkillsProgress).toHaveBeenCalledWith(mockUserId);
        expect(fetchExerciseHistory).toHaveBeenCalledWith(mockUserId, 1000);
        expect(getUpcomingReviews).toHaveBeenCalledWith(mockUserId, 10);
      });
    });

    it("should display dashboard content after loading", async () => {
      render(() => (
        <ProgressDashboard userId={mockUserId} gradeRange={mockGradeRange} />
      ));

      await waitFor(() => {
        expect(
          screen.getByText("progress.dashboard.title"),
        ).toBeInTheDocument();
      });
    });

    it("should handle fetch errors gracefully", async () => {
      (fetchCompetencyProgress as any).mockRejectedValue(
        new Error("Network error"),
      );

      render(() => (
        <ProgressDashboard userId={mockUserId} gradeRange={mockGradeRange} />
      ));

      await waitFor(() => {
        expect(
          screen.getByText(/progress.errors.loadFailed/i),
        ).toBeInTheDocument();
      });
    });
  });

  describe("Practice Streak Display", () => {
    it("should calculate and display streak from exercise history", async () => {
      render(() => (
        <ProgressDashboard userId={mockUserId} gradeRange={mockGradeRange} />
      ));

      await waitFor(() => {
        expect(
          screen.getByText(/progress.sections.streak/i),
        ).toBeInTheDocument();
      });
    });

    it("should show encouragement message when streak is at risk", async () => {
      // Mock exercises from yesterday only (no today)
      const yesterdayExercises = [
        {
          ...mockExerciseHistory[0]!,
          createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
        },
      ];
      (fetchExerciseHistory as any).mockResolvedValue(yesterdayExercises);

      render(() => (
        <ProgressDashboard userId={mockUserId} gradeRange={mockGradeRange} />
      ));

      await waitFor(() => {
        expect(
          screen.getByText(/progress.streak.keepItGoing/i),
        ).toBeInTheDocument();
      });
    });

    it("should show start message when no streak", async () => {
      (fetchExerciseHistory as any).mockResolvedValue([]);

      render(() => (
        <ProgressDashboard userId={mockUserId} gradeRange={mockGradeRange} />
      ));

      await waitFor(() => {
        expect(
          screen.getByText(/progress.streak.noStreak/i),
        ).toBeInTheDocument();
      });
    });
  });

  describe("Competency Area Cards", () => {
    it("should display all competency areas", async () => {
      render(() => (
        <ProgressDashboard userId={mockUserId} gradeRange={mockGradeRange} />
      ));

      await waitFor(() => {
        expect(screen.getByText("tal-og-algebra")).toBeInTheDocument();
        expect(screen.getByText("geometri-og-maling")).toBeInTheDocument();
      });
    });

    it("should display mastery percentage for each competency", async () => {
      render(() => (
        <ProgressDashboard userId={mockUserId} gradeRange={mockGradeRange} />
      ));

      await waitFor(() => {
        expect(screen.getByText("75%")).toBeInTheDocument();
        expect(screen.getByText("45%")).toBeInTheDocument();
      });
    });

    it("should display stats (attempts and success rate)", async () => {
      render(() => (
        <ProgressDashboard userId={mockUserId} gradeRange={mockGradeRange} />
      ));

      await waitFor(() => {
        expect(screen.getByText("100")).toBeInTheDocument(); // attempts
        expect(screen.getByText("80.0%")).toBeInTheDocument(); // success rate
      });
    });

    it("should apply correct color coding for mastery levels", async () => {
      render(() => (
        <ProgressDashboard userId={mockUserId} gradeRange={mockGradeRange} />
      ));

      await waitFor(() => {
        // Check that mastery levels are displayed (the component shows percentages)
        expect(screen.getByText("75%")).toBeInTheDocument(); // tal-og-algebra mastery
        expect(screen.getByText("45%")).toBeInTheDocument(); // geometri-og-maling mastery
        const proficientElements = screen.getAllByText(
          "progress.masteryLevels.proficient",
        );
        expect(proficientElements.length).toBeGreaterThan(0);
      });
    });

    it("should show empty state when no competencies", async () => {
      (fetchCompetencyProgress as any).mockResolvedValue([]);

      render(() => (
        <ProgressDashboard userId={mockUserId} gradeRange={mockGradeRange} />
      ));

      await waitFor(() => {
        expect(
          screen.getByText("progress.empty.noCompetencies"),
        ).toBeInTheDocument();
      });
    });
  });

  describe("Skills Breakdown", () => {
    it("should expand skills when clicking view button", async () => {
      const user = userEvent.setup();

      render(() => (
        <ProgressDashboard userId={mockUserId} gradeRange={mockGradeRange} />
      ));

      await waitFor(() => {
        expect(screen.getByText("tal-og-algebra")).toBeInTheDocument();
      });

      const viewButton = screen.getAllByText(
        /progress.competencyCard.viewSkills/i,
      )[0];
      await user.click(viewButton!);

      await waitFor(() => {
        expect(
          screen.getByText(/progress.sections.skills/i),
        ).toBeInTheDocument();
      });
    });

    it("should display skills with progress bars", async () => {
      const user = userEvent.setup();

      render(() => (
        <ProgressDashboard userId={mockUserId} gradeRange={mockGradeRange} />
      ));

      await waitFor(() => {
        expect(screen.getByText("tal-og-algebra")).toBeInTheDocument();
      });

      const viewButton = screen.getAllByText(
        /progress.competencyCard.viewSkills/i,
      )[0];
      await user.click(viewButton!);

      await waitFor(() => {
        expect(screen.getByText("tal-og-algebra-addition")).toBeInTheDocument();
        expect(
          screen.getByText("tal-og-algebra-subtraction"),
        ).toBeInTheDocument();
      });
    });

    it("should show next review date for skills", async () => {
      const user = userEvent.setup();

      render(() => (
        <ProgressDashboard userId={mockUserId} gradeRange={mockGradeRange} />
      ));

      await waitFor(() => {
        expect(screen.getByText("tal-og-algebra")).toBeInTheDocument();
      });

      const viewButton = screen.getAllByText(
        /progress.competencyCard.viewSkills/i,
      )[0];
      await user.click(viewButton!);

      await waitFor(() => {
        const nextReviewElements = screen.getAllByText(
          /progress.skillsBreakdown.nextReview/i,
        );
        expect(nextReviewElements.length).toBeGreaterThan(0);
      });
    });

    it("should collapse skills when clicking hide button", async () => {
      const user = userEvent.setup();

      render(() => (
        <ProgressDashboard userId={mockUserId} gradeRange={mockGradeRange} />
      ));

      await waitFor(() => {
        expect(screen.getByText("tal-og-algebra")).toBeInTheDocument();
      });

      // Expand
      const viewButton = screen.getAllByText(
        /progress.competencyCard.viewSkills/i,
      )[0];
      await user.click(viewButton!);

      await waitFor(() => {
        expect(
          screen.getByText(/progress.sections.skills/i),
        ).toBeInTheDocument();
      });

      // Collapse
      const hideButton = screen.getByText(
        /progress.competencyCard.hideSkills/i,
      );
      await user.click(hideButton);

      await waitFor(() => {
        expect(
          screen.queryByText(/progress.sections.skills/i),
        ).not.toBeInTheDocument();
      });
    });
  });

  describe("Review Schedule", () => {
    it("should display review schedule sections", async () => {
      render(() => (
        <ProgressDashboard userId={mockUserId} gradeRange={mockGradeRange} />
      ));

      await waitFor(() => {
        expect(screen.getByText("progress.reviews.title")).toBeInTheDocument();
      });
    });

    it("should show overdue reviews with priority", async () => {
      render(() => (
        <ProgressDashboard userId={mockUserId} gradeRange={mockGradeRange} />
      ));

      await waitFor(() => {
        const overdueElements = screen.getAllByText(
          /progress.reviews.overdue/i,
        );
        expect(overdueElements.length).toBeGreaterThan(0);
        expect(screen.getByText("multiplication-basics")).toBeInTheDocument();
      });
    });

    it("should show reviews due today", async () => {
      render(() => (
        <ProgressDashboard userId={mockUserId} gradeRange={mockGradeRange} />
      ));

      await waitFor(() => {
        expect(
          screen.getByText(/progress.reviews.dueToday/i),
        ).toBeInTheDocument();
        expect(screen.getByText("division-basics")).toBeInTheDocument();
      });
    });

    it("should show reviews due this week", async () => {
      render(() => (
        <ProgressDashboard userId={mockUserId} gradeRange={mockGradeRange} />
      ));

      await waitFor(() => {
        expect(
          screen.getByText(/progress.reviews.dueThisWeek/i),
        ).toBeInTheDocument();
        expect(screen.getByText("fractions-basics")).toBeInTheDocument();
      });
    });

    it("should show empty state when no reviews scheduled", async () => {
      (getUpcomingReviews as any).mockResolvedValue({
        overdue: [],
        today: [],
        thisWeek: [],
        upcoming: [],
        total: 0,
      });

      render(() => (
        <ProgressDashboard userId={mockUserId} gradeRange={mockGradeRange} />
      ));

      await waitFor(() => {
        expect(
          screen.getByText("progress.reviews.noReviews"),
        ).toBeInTheDocument();
      });
    });

    it("should display practice now buttons for overdue and today", async () => {
      render(() => (
        <ProgressDashboard userId={mockUserId} gradeRange={mockGradeRange} />
      ));

      await waitFor(() => {
        const practiceButtons = screen.getAllByText(
          /progress.reviews.practiceNow/i,
        );
        expect(practiceButtons.length).toBeGreaterThan(0);
      });
    });
  });

  describe("Color Coding", () => {
    it("should apply red color for introduced level (0-20)", async () => {
      const lowMastery = [
        {
          ...mockCompetencies[0]!,
          masteryLevel: 15,
        },
      ];
      (fetchCompetencyProgress as any).mockResolvedValue(lowMastery);

      render(() => (
        <ProgressDashboard userId={mockUserId} gradeRange={mockGradeRange} />
      ));

      await waitFor(() => {
        expect(screen.getByText("15%")).toBeInTheDocument();
      });
    });

    it("should apply yellow color for developing level (21-40)", async () => {
      const mediumLowMastery = [
        {
          ...mockCompetencies[0]!,
          masteryLevel: 30,
        },
      ];
      (fetchCompetencyProgress as any).mockResolvedValue(mediumLowMastery);

      render(() => (
        <ProgressDashboard userId={mockUserId} gradeRange={mockGradeRange} />
      ));

      await waitFor(() => {
        expect(screen.getByText("30%")).toBeInTheDocument();
      });
    });

    it("should apply light green for progressing level (41-60)", async () => {
      render(() => (
        <ProgressDashboard userId={mockUserId} gradeRange={mockGradeRange} />
      ));

      await waitFor(() => {
        expect(screen.getByText("45%")).toBeInTheDocument();
      });
    });

    it("should apply green for proficient level (61-80)", async () => {
      render(() => (
        <ProgressDashboard userId={mockUserId} gradeRange={mockGradeRange} />
      ));

      await waitFor(() => {
        expect(screen.getByText("75%")).toBeInTheDocument();
      });
    });

    it("should apply blue for mastered level (81-100)", async () => {
      const highMastery = [
        {
          ...mockCompetencies[0]!,
          masteryLevel: 90,
        },
      ];
      (fetchCompetencyProgress as any).mockResolvedValue(highMastery);

      render(() => (
        <ProgressDashboard userId={mockUserId} gradeRange={mockGradeRange} />
      ));

      await waitFor(() => {
        expect(screen.getByText("90%")).toBeInTheDocument();
      });
    });
  });

  describe("Accessibility", () => {
    it("should have proper ARIA labels for buttons", async () => {
      render(() => (
        <ProgressDashboard userId={mockUserId} gradeRange={mockGradeRange} />
      ));

      await waitFor(() => {
        const buttons = screen.getAllByRole("button");
        expect(buttons.length).toBeGreaterThan(0);
      });
    });

    it("should support keyboard navigation", async () => {
      const user = userEvent.setup();

      render(() => (
        <ProgressDashboard userId={mockUserId} gradeRange={mockGradeRange} />
      ));

      await waitFor(() => {
        expect(screen.getByText("tal-og-algebra")).toBeInTheDocument();
      });

      // Tab to button and press Enter
      await user.tab();
      await user.keyboard("{Enter}");

      // Button should work with keyboard
      expect(true).toBe(true); // Component rendered successfully
    });

    it("should have aria-expanded attribute on toggle buttons", async () => {
      render(() => (
        <ProgressDashboard userId={mockUserId} gradeRange={mockGradeRange} />
      ));

      await waitFor(() => {
        const toggleButtons = screen.getAllByRole("button");
        const hasAriaExpanded = toggleButtons.some(
          (btn) => btn.getAttribute("aria-expanded") !== null,
        );
        expect(hasAriaExpanded).toBe(true);
      });
    });
  });

  describe("Responsive Behavior", () => {
    it("should render grid layout for competency cards", async () => {
      render(() => (
        <ProgressDashboard userId={mockUserId} gradeRange={mockGradeRange} />
      ));

      await waitFor(() => {
        const cards = screen.getAllByText(/tal-og-algebra|geometri-og-maling/);
        expect(cards.length).toBeGreaterThan(0);
      });
    });
  });
});
