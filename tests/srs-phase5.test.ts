import { describe, expect, it } from "vitest";
import {
  MAX_INTERVAL_DAYS,
  memoryStateAfterRating,
  ratingToIntervalDays,
} from "@/lib/srs";
import { scheduleAfterRating } from "@/services/srs-scheduler";
import {
  buildTodaysReviewIds,
  selectNewExpressions,
} from "@/services/todays-review-selection";
import {
  insertCardAtGap,
  shouldReinsertUnsure,
  unsureReinsertGap,
} from "@/services/session-queue";

describe("srs rating rules", () => {
  it("unsure schedules 1 day", () => {
    expect(ratingToIntervalDays("unsure", 30)).toBe(1);
  });

  it("again schedules 2 days", () => {
    expect(ratingToIntervalDays("again", 30)).toBe(2);
  });

  it("mastered grows interval up to cap", () => {
    expect(ratingToIntervalDays("mastered", 300)).toBe(MAX_INTERVAL_DAYS);
  });

  it("promotes to reviewing after two consecutive mastered", () => {
    expect(memoryStateAfterRating("mastered", 2)).toBe("reviewing");
    expect(memoryStateAfterRating("mastered", 1)).toBe("learning");
  });
});

describe("scheduleAfterRating", () => {
  it("sets first_reviewed_at on first review", () => {
    const result = scheduleAfterRating({
      rating: "again",
      reviewedAt: new Date("2026-07-02T12:00:00Z"),
      queueRow: null,
      recentRatings: [],
    });
    expect(result.firstReviewedAt).toBe("2026-07-02T12:00:00.000Z");
    expect(result.memoryState).toBe("learning");
  });
});

describe("todays review selection", () => {
  const newCandidates = [
    {
      id: "n1",
      video_id: "v1",
      topic_id: "t1",
      created_at: "2026-06-01T00:00:00Z",
    },
    {
      id: "n2",
      video_id: "v2",
      topic_id: "t2",
      created_at: "2026-07-01T00:00:00Z",
    },
  ];

  it("fills due before new", () => {
    const result = buildTodaysReviewIds(
      ["d1", "d2", "d3"],
      newCandidates,
      5
    );
    expect(result.dueCount).toBe(3);
    expect(result.newCount).toBe(2);
    expect(result.ids.slice(0, 3)).toEqual(["d1", "d2", "d3"]);
  });

  it("caps due at budget", () => {
    const due = Array.from({ length: 120 }, (_, i) => `d${i}`);
    const result = buildTodaysReviewIds(due, newCandidates, 40);
    expect(result.dueCount).toBe(40);
    expect(result.newCount).toBe(0);
  });

  it("weighted new avoids starvation", () => {
    const picks = selectNewExpressions(newCandidates, 2, () => 0.1);
    expect(picks).toHaveLength(2);
  });
});

describe("session queue", () => {
  it("unsure gap is between 4 and 8", () => {
    for (let i = 0; i < 20; i += 1) {
      const gap = unsureReinsertGap();
      expect(gap).toBeGreaterThanOrEqual(4);
      expect(gap).toBeLessThanOrEqual(8);
    }
  });

  it("allows up to 3 unsure reinserts", () => {
    expect(shouldReinsertUnsure(0)).toBe(true);
    expect(shouldReinsertUnsure(2)).toBe(true);
    expect(shouldReinsertUnsure(3)).toBe(false);
  });

  it("inserts card after gap", () => {
    const deck = ["a", "b", "c", "d"];
    const next = insertCardAtGap(deck, 1, "x", 2);
    expect(next).toEqual(["a", "b", "c", "d", "x"]);
  });
});
