import { describe, expect, it } from "vitest";
import {
  isResumableTodaysReviewSession,
  localDateKey,
  mapDeckIdsToCards,
  parseTodaysReviewSession,
  resumeIndexAfterMissingCards,
  type PersistedTodaysReviewSession,
} from "@/lib/todays-review-session";

describe("todays review session persistence", () => {
  const base: PersistedTodaysReviewSession = {
    dateKey: "2026-07-28",
    deckIds: ["a", "b", "c", "b"],
    index: 2,
    shownIds: ["a", "b", "c"],
    deferredUnsureIds: ["b"],
    unsureReinsertCounts: { b: 1 },
  };

  it("formats local date key as YYYY-MM-DD", () => {
    expect(localDateKey(new Date(2026, 6, 28))).toBe("2026-07-28");
  });

  it("parses a valid persisted session", () => {
    expect(parseTodaysReviewSession(JSON.stringify(base))).toEqual(base);
  });

  it("rejects malformed JSON / shapes", () => {
    expect(parseTodaysReviewSession(null)).toBeNull();
    expect(parseTodaysReviewSession("{")).toBeNull();
    expect(parseTodaysReviewSession(JSON.stringify({ dateKey: "x" }))).toBeNull();
  });

  it("is resumable only for today with remaining cards", () => {
    expect(isResumableTodaysReviewSession(base, "2026-07-28")).toBe(true);
    expect(isResumableTodaysReviewSession(base, "2026-07-29")).toBe(false);
    expect(
      isResumableTodaysReviewSession({ ...base, index: 4 }, "2026-07-28")
    ).toBe(false);
    expect(isResumableTodaysReviewSession(null, "2026-07-28")).toBe(false);
  });

  it("maps deck ids including reinsert duplicates", () => {
    const byId = new Map([
      ["a", { id: "a" }],
      ["b", { id: "b" }],
      ["c", { id: "c" }],
    ]);
    expect(mapDeckIdsToCards(["a", "b", "c", "b"], byId).map((c) => c.id)).toEqual([
      "a",
      "b",
      "c",
      "b",
    ]);
  });

  it("adjusts resume index when earlier cards are missing", () => {
    const available = new Set(["b", "c"]);
    expect(resumeIndexAfterMissingCards(["a", "b", "c"], 2, available)).toBe(1);
    expect(resumeIndexAfterMissingCards(["a", "b", "c"], 0, available)).toBe(0);
  });
});
