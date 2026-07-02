import type { Expression } from "@/types/expression";

export type NewExpressionCandidate = Pick<
  Expression,
  "id" | "video_id" | "topic_id" | "created_at"
>;

const RECENCY_HALF_LIFE_DAYS = 14;
const ANTI_STARVATION_FLOOR = 0.15;
const SAME_SOURCE_PENALTY = 0.35;

function daysSince(iso: string, now: Date): number {
  return Math.max(
    0,
    (now.getTime() - new Date(iso).getTime()) / (1000 * 60 * 60 * 24)
  );
}

function recencyWeight(createdAt: string, now: Date): number {
  const age = daysSince(createdAt, now);
  return 0.5 + 0.5 * Math.exp(-age / RECENCY_HALF_LIFE_DAYS);
}

function starvationWeight(createdAt: string, now: Date): number {
  const age = daysSince(createdAt, now);
  return ANTI_STARVATION_FLOOR + Math.min(1, age / 90);
}

export function computeNewExpressionWeight(
  candidate: NewExpressionCandidate,
  previous: Pick<NewExpressionCandidate, "video_id" | "topic_id"> | null,
  now: Date = new Date()
): number {
  let weight = recencyWeight(candidate.created_at, now) * starvationWeight(
    candidate.created_at,
    now
  );

  if (previous) {
    if (previous.video_id === candidate.video_id) {
      weight *= SAME_SOURCE_PENALTY;
    }
    if (previous.topic_id === candidate.topic_id) {
      weight *= SAME_SOURCE_PENALTY;
    }
  }

  return Math.max(weight, 0.001);
}

export function weightedPickNewExpression(
  candidates: NewExpressionCandidate[],
  previous: Pick<NewExpressionCandidate, "video_id" | "topic_id"> | null,
  random = Math.random
): NewExpressionCandidate | null {
  if (candidates.length === 0) return null;

  const now = new Date();
  const weights = candidates.map((candidate) =>
    computeNewExpressionWeight(candidate, previous, now)
  );
  const total = weights.reduce((sum, w) => sum + w, 0);
  let roll = random() * total;

  for (let i = 0; i < candidates.length; i += 1) {
    roll -= weights[i]!;
    if (roll <= 0) return candidates[i]!;
  }

  return candidates[candidates.length - 1]!;
}

export function selectNewExpressions(
  candidates: NewExpressionCandidate[],
  count: number,
  random = Math.random
): NewExpressionCandidate[] {
  const pool = [...candidates];
  const selected: NewExpressionCandidate[] = [];
  let previous: Pick<NewExpressionCandidate, "video_id" | "topic_id"> | null =
    null;

  while (selected.length < count && pool.length > 0) {
    const pick = weightedPickNewExpression(pool, previous, random);
    if (!pick) break;
    selected.push(pick);
    previous = pick;
    const idx = pool.findIndex((item) => item.id === pick.id);
    if (idx >= 0) pool.splice(idx, 1);
  }

  return selected;
}

export function buildTodaysReviewIds(
  dueIds: string[],
  newCandidates: NewExpressionCandidate[],
  budget: number | null,
  excludeIds: Set<string> = new Set()
): { ids: string[]; dueCount: number; newCount: number } {
  const dueFiltered = dueIds.filter((id) => !excludeIds.has(id));
  const cap = budget ?? Number.POSITIVE_INFINITY;

  const dueSlice = dueFiltered.slice(0, cap);
  const remaining = cap - dueSlice.length;

  const newPool = newCandidates.filter((item) => !excludeIds.has(item.id));
  const newPicks =
    remaining > 0 ? selectNewExpressions(newPool, remaining) : [];

  return {
    ids: [...dueSlice, ...newPicks.map((item) => item.id)],
    dueCount: dueSlice.length,
    newCount: newPicks.length,
  };
}

export function shuffleArray<T>(items: T[], random = Math.random): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(random() * (i + 1));
    [copy[i], copy[j]] = [copy[j]!, copy[i]!];
  }
  return copy;
}
