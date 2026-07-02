import {
  addDays,
  defaultIntervalDays,
  memoryStateAfterRating,
  priorIntervalDays,
  ratingToIntervalDays,
} from "@/lib/srs";
import type { MemoryState, ReviewQueueRow, ReviewRating } from "@/types/review";

export type ScheduleAfterRatingInput = {
  rating: ReviewRating;
  reviewedAt: Date;
  queueRow: ReviewQueueRow | null;
  recentRatings: ReviewRating[];
};

export type ScheduleAfterRatingResult = {
  dueAt: Date;
  intervalDays: number;
  memoryState: MemoryState;
  firstReviewedAt: string;
  lastReviewedAt: string;
};

export function scheduleAfterRating(
  input: ScheduleAfterRatingInput
): ScheduleAfterRatingResult {
  const { rating, reviewedAt, queueRow, recentRatings } = input;
  const reviewedIso = reviewedAt.toISOString();

  const priorDays = queueRow?.due_at
    ? priorIntervalDays(queueRow.due_at, reviewedAt)
    : queueRow?.interval_days ?? defaultIntervalDays();

  const intervalDays = ratingToIntervalDays(rating, priorDays);
  const dueAt = addDays(reviewedAt, intervalDays);

  const consecutiveMastered =
    rating === "mastered" && recentRatings[0] === "mastered" ? 2 : rating === "mastered" ? 1 : 0;

  const memoryState = memoryStateAfterRating(rating, consecutiveMastered);

  const firstReviewedAt =
    queueRow?.first_reviewed_at ?? reviewedIso;

  return {
    dueAt,
    intervalDays,
    memoryState,
    firstReviewedAt,
    lastReviewedAt: reviewedIso,
  };
}

/** Flush deferred unsure rating at session end */
export function scheduleDeferredUnsure(
  reviewedAt: Date,
  queueRow: ReviewQueueRow | null
): ScheduleAfterRatingResult {
  return scheduleAfterRating({
    rating: "unsure",
    reviewedAt,
    queueRow,
    recentRatings: ["unsure"],
  });
}
