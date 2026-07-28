/**
 * Client-side persistence for an in-progress Today's Review deck.
 * Survives Chrome tab/process restarts within the same local calendar day.
 */

export const TODAYS_REVIEW_SESSION_KEY = "echo-speak:todays-review-session";

export type PersistedTodaysReviewSession = {
  dateKey: string;
  deckIds: string[];
  index: number;
  shownIds: string[];
  deferredUnsureIds: string[];
  unsureReinsertCounts: Record<string, number>;
};

export function localDateKey(date: Date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function isResumableTodaysReviewSession(
  session: PersistedTodaysReviewSession | null,
  todayKey: string = localDateKey()
): session is PersistedTodaysReviewSession {
  if (!session) return false;
  if (session.dateKey !== todayKey) return false;
  if (session.deckIds.length === 0) return false;
  return session.index < session.deckIds.length;
}

export function parseTodaysReviewSession(
  raw: string | null
): PersistedTodaysReviewSession | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as Partial<PersistedTodaysReviewSession>;
    if (
      typeof parsed.dateKey !== "string" ||
      !Array.isArray(parsed.deckIds) ||
      typeof parsed.index !== "number" ||
      !Array.isArray(parsed.shownIds) ||
      !Array.isArray(parsed.deferredUnsureIds) ||
      typeof parsed.unsureReinsertCounts !== "object" ||
      parsed.unsureReinsertCounts === null
    ) {
      return null;
    }

    const deckIds = parsed.deckIds.filter(
      (id): id is string => typeof id === "string"
    );
    const shownIds = parsed.shownIds.filter(
      (id): id is string => typeof id === "string"
    );
    const deferredUnsureIds = parsed.deferredUnsureIds.filter(
      (id): id is string => typeof id === "string"
    );
    const unsureReinsertCounts: Record<string, number> = {};
    for (const [key, value] of Object.entries(parsed.unsureReinsertCounts)) {
      if (typeof value === "number" && Number.isFinite(value)) {
        unsureReinsertCounts[key] = value;
      }
    }

    return {
      dateKey: parsed.dateKey,
      deckIds,
      index: Math.max(0, Math.floor(parsed.index)),
      shownIds,
      deferredUnsureIds,
      unsureReinsertCounts,
    };
  } catch {
    return null;
  }
}

export function loadTodaysReviewSession(): PersistedTodaysReviewSession | null {
  if (typeof window === "undefined") return null;
  try {
    return parseTodaysReviewSession(
      window.localStorage.getItem(TODAYS_REVIEW_SESSION_KEY)
    );
  } catch {
    return null;
  }
}

export function saveTodaysReviewSession(
  session: PersistedTodaysReviewSession
): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(
      TODAYS_REVIEW_SESSION_KEY,
      JSON.stringify(session)
    );
  } catch {
    // Quota / private mode — resume is best-effort.
  }
}

export function clearTodaysReviewSession(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(TODAYS_REVIEW_SESSION_KEY);
  } catch {
    // ignore
  }
}

/** Rebuild a deck that may contain reinserted (duplicate) ids. */
export function mapDeckIdsToCards<T extends { id: string }>(
  deckIds: string[],
  cardsById: Map<string, T>
): T[] {
  const cards: T[] = [];
  for (const id of deckIds) {
    const card = cardsById.get(id);
    if (card) cards.push(card);
  }
  return cards;
}

/** Adjust resume index when some earlier cards were deleted from the DB. */
export function resumeIndexAfterMissingCards(
  deckIds: string[],
  index: number,
  availableIds: Set<string>
): number {
  const survivingBefore = deckIds
    .slice(0, Math.max(0, index))
    .filter((id) => availableIds.has(id)).length;
  const survivingTotal = deckIds.filter((id) => availableIds.has(id)).length;
  return Math.min(survivingBefore, survivingTotal);
}
