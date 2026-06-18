const MIN_INTERVAL_DAYS = 1;
const MAX_INTERVAL_DAYS = 180;

/**
 * Simple SM-2 inspired interval calculation.
 * rating: 1 (forgot) – 5 (perfect recall)
 */
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
  const due = new Date(now);
  due.setDate(due.getDate() + interval);
  return due;
}

export function defaultIntervalDays(): number {
  return MIN_INTERVAL_DAYS;
}
