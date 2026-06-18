/**
 * Mastery score adjustments based on review rating (1–5).
 */
export function adjustScore(currentScore: number, rating: number): number {
  const delta = (rating - 3) * 0.1;
  return Math.min(1, Math.max(0, currentScore + delta));
}

export function initialScore(): number {
  return 0.2;
}
