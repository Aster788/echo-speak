import type { MemoryState, ReviewRating } from "@/types/review";

export const MIN_INTERVAL_DAYS = 1;
export const MAX_INTERVAL_DAYS = 365;

const MASTERED_SRS_SCORE = 4;

export function ratingToIntervalDays(
  rating: ReviewRating,
  priorIntervalDays: number
): number {
  if (rating === "unsure" || rating === "again") {
    return rating === "unsure" ? MIN_INTERVAL_DAYS : 2;
  }

  const ease = 1 + (MASTERED_SRS_SCORE - 3) * 0.25;
  return Math.min(
    MAX_INTERVAL_DAYS,
    Math.max(MIN_INTERVAL_DAYS, Math.round(priorIntervalDays * ease))
  );
}

export function addDays(from: Date, days: number): Date {
  const due = new Date(from);
  due.setDate(due.getDate() + days);
  return due;
}

export function priorIntervalDays(
  queueDueAt: string | null,
  reviewedAt: Date
): number {
  if (!queueDueAt) {
    return defaultIntervalDays();
  }
  const dueMs = new Date(queueDueAt).getTime();
  const reviewedMs = reviewedAt.getTime();
  const days = Math.round((reviewedMs - dueMs) / (1000 * 60 * 60 * 24));
  return Math.max(MIN_INTERVAL_DAYS, days);
}

export function defaultIntervalDays(): number {
  return MIN_INTERVAL_DAYS;
}

export function memoryStateAfterRating(
  rating: ReviewRating,
  consecutiveMastered: number
): MemoryState {
  if (rating === "mastered" && consecutiveMastered >= 2) {
    return "reviewing";
  }
  return "learning";
}

export function countConsecutiveMastered(
  ratings: ReviewRating[],
  latestFirst = true
): number {
  const ordered = latestFirst ? ratings : [...ratings].reverse();
  let count = 0;
  for (const rating of ordered) {
    if (rating !== "mastered") break;
    count += 1;
  }
  return count;
}

/** @deprecated Use ratingToIntervalDays for Phase 5 */
export function nextDueDate(
  lastIntervalDays: number,
  rating: number,
  now: Date = new Date()
): Date {
  let interval: number;
  if (rating < 3) {
    interval = MIN_INTERVAL_DAYS;
  } else {
    const ease = 1 + (rating - 3) * 0.25;
    interval = Math.min(
      MAX_INTERVAL_DAYS,
      Math.max(MIN_INTERVAL_DAYS, Math.round(lastIntervalDays * ease))
    );
  }
  return addDays(now, interval);
}
