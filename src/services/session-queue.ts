export const UNSURE_REINSERT_MIN_GAP = 4;
export const UNSURE_REINSERT_MAX_GAP = 8;
export const MAX_UNSURE_REINSERTS_PER_SESSION = 3;

export function unsureReinsertGap(random = Math.random): number {
  const span = UNSURE_REINSERT_MAX_GAP - UNSURE_REINSERT_MIN_GAP + 1;
  return UNSURE_REINSERT_MIN_GAP + Math.floor(random() * span);
}

export function shouldReinsertUnsure(
  reinsertCount: number
): boolean {
  return reinsertCount < MAX_UNSURE_REINSERTS_PER_SESSION;
}

/**
 * Insert card copy at index + gap (clamped to deck end).
 */
export function insertCardAtGap<T>(
  deck: T[],
  currentIndex: number,
  card: T,
  gap: number
): T[] {
  const insertAt = Math.min(currentIndex + gap + 1, deck.length);
  const next = [...deck];
  next.splice(insertAt, 0, card);
  return next;
}
