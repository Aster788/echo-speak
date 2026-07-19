"use server";

import { getExpression, listExpressionsMergedByCanonicalKey, listExpressionsByVideo } from "@/db/expressions";
import {
  insertReviewRating,
  isReviewRating,
  listRecentRatingsForExpression,
} from "@/db/review-history";
import {
  getQueueRow,
  listDueExpressionIds,
  listExpressionIdsReviewedToday,
  listNewExpressionCandidates,
  upsertReviewQueue,
} from "@/db/review-queue";
import { getUserSettings } from "@/db/user-settings";
import { getTopic, listTopicSubtreeIds, listTopics } from "@/db/topics";
import { listVideos } from "@/db/videos";
import { getAuthenticatedUser } from "@/lib/auth-server";
import {
  DEFAULT_DAILY_REVIEW_BUDGET,
  effectiveBudgetCap,
} from "@/lib/daily-review-budget";
import { sortVideosByTitle } from "@/lib/sort-collections";
import { getSupabaseAdmin } from "@/lib/supabase";
import {
  scheduleAfterRating,
  scheduleDeferredUnsure,
} from "@/services/srs-scheduler";
import {
  buildTodaysReviewIds,
  shuffleArray,
} from "@/services/todays-review-selection";
import type {
  ReviewDeckCard,
  ReviewMode,
  ReviewRating,
  ReviewScopeOption,
  TodaysReviewSummary,
  NewExpressionCandidate,
} from "@/types/review";

import { TODAYS_REVIEW_SCOPE_ID } from "@/lib/review-constants";

function formatDisplayLabel(
  sliceSize: number,
  budget: number,
  dueEligible: number,
  newEligible: number
): string {
  const cap = effectiveBudgetCap(budget);
  const eligible = dueEligible + newEligible;

  if (cap !== null && dueEligible > cap) {
    return `${Math.min(sliceSize || cap, cap)} / ${dueEligible}`;
  }
  if (cap !== null && eligible > cap) {
    return `${sliceSize || Math.min(eligible, cap)} / ${eligible}`;
  }
  const denominator = cap ?? Math.max(sliceSize, eligible);
  return `${sliceSize} / ${denominator}`;
}

function buildSummary(
  budget: number,
  cap: number | null,
  dueIds: string[],
  newCandidates: NewExpressionCandidate[],
  exclude: Set<string>,
  reviewedToday: Set<string>
): TodaysReviewSummary {
  const dueEligible = dueIds.filter((id) => !exclude.has(id)).length;
  const newEligible = newCandidates.filter((item) => !exclude.has(item.id)).length;
  const totalEligible = dueEligible + newEligible;

  const { ids: sliceIds } = buildTodaysReviewIds(
    dueIds,
    newCandidates,
    cap,
    exclude
  );

  const sliceSize = sliceIds.length;
  const isCaughtUp = sliceSize === 0 && totalEligible === 0;
  const canContinueToday =
    !isCaughtUp &&
    (dueEligible + newEligible > exclude.size ||
      reviewedToday.size > 0);

  return {
    budget,
    sliceSize,
    dueEligible,
    newEligible,
    totalEligible,
    displayLabel: formatDisplayLabel(sliceSize, budget, dueEligible, newEligible),
    canContinueToday: canContinueToday && totalEligible > 0,
    isCaughtUp,
  };
}

async function resolveDailyReviewBudget(): Promise<number> {
  const user = await getAuthenticatedUser();
  if (!user) return DEFAULT_DAILY_REVIEW_BUDGET;
  const settings = await getUserSettings(user.id, getSupabaseAdmin());
  return settings?.daily_review_budget ?? DEFAULT_DAILY_REVIEW_BUDGET;
}

function enrichDeckCards(
  expressions: Awaited<ReturnType<typeof listExpressionsByVideo>>,
  videos: Awaited<ReturnType<typeof listVideos>>,
  topics: Awaited<ReturnType<typeof listTopics>>
): ReviewDeckCard[] {
  const videoById = new Map(videos.map((video) => [video.id, video]));
  const topicById = new Map(topics.map((topic) => [topic.id, topic]));

  return expressions.map((expression) => {
    const videoTitle =
      videoById.get(expression.video_id)?.title ?? "Unknown video";

    return {
      ...expression,
      videoTitle,
      topicName: expression.topic_id
        ? (topicById.get(expression.topic_id)?.name ?? "Unknown topic")
        : videoTitle,
    };
  });
}

async function loadExpressionsByIds(
  ids: string[],
  client = getSupabaseAdmin()
): Promise<ReviewDeckCard[]> {
  if (ids.length === 0) return [];

  const [videos, topics] = await Promise.all([
    listVideos(client),
    listTopics(client),
  ]);

  const expressions = await Promise.all(ids.map((id) => getExpression(id, client)));
  const found = expressions.filter((item): item is NonNullable<typeof item> =>
    Boolean(item)
  );

  const order = new Map(ids.map((id, index) => [id, index]));
  found.sort((a, b) => (order.get(a.id) ?? 0) - (order.get(b.id) ?? 0));

  return enrichDeckCards(found, videos, topics);
}

export async function getTodaysReviewSummary(
  excludeIds: string[] = []
): Promise<TodaysReviewSummary> {
  const supabase = getSupabaseAdmin();
  const budget = await resolveDailyReviewBudget();
  const cap = effectiveBudgetCap(budget);
  const exclude = new Set(excludeIds);

  const [dueIds, newCandidates, reviewedToday] = await Promise.all([
    listDueExpressionIds(new Date(), supabase),
    listNewExpressionCandidates(supabase),
    listExpressionIdsReviewedToday(supabase),
  ]);

  return buildSummary(
    budget,
    cap,
    dueIds,
    newCandidates,
    exclude,
    reviewedToday
  );
}

export async function buildTodaysReviewDeck(
  excludeIds: string[] = []
): Promise<{ cards: ReviewDeckCard[]; summary: TodaysReviewSummary }> {
  const supabase = getSupabaseAdmin();
  const budget = await resolveDailyReviewBudget();
  const cap = effectiveBudgetCap(budget);
  const exclude = new Set(excludeIds);

  const [dueIds, newCandidates] = await Promise.all([
    listDueExpressionIds(new Date(), supabase),
    listNewExpressionCandidates(supabase),
  ]);

  const { ids } = buildTodaysReviewIds(dueIds, newCandidates, cap, exclude);
  const cards = await loadExpressionsByIds(ids, supabase);
  const summary = await getTodaysReviewSummary(excludeIds);

  return { cards, summary };
}

export async function loadReviewDeck(
  mode: ReviewMode,
  scopeId: string
): Promise<{ cards: ReviewDeckCard[]; scopeLabel: string }> {
  if (mode === "todays_review") {
    const { cards } = await buildTodaysReviewDeck();
    return { cards, scopeLabel: "Today's Review" };
  }

  const supabase = getSupabaseAdmin();
  const [expressions, videos, topics] = await Promise.all([
    mode === "video"
      ? listExpressionsByVideo(scopeId, supabase)
      : listExpressionsMergedByCanonicalKey(
          { kind: "topic", topicId: scopeId },
          supabase
        ),
    listVideos(supabase),
    listTopics(supabase),
  ]);

  let scopeLabel = "Review";
  if (mode === "video") {
    scopeLabel = videos.find((video) => video.id === scopeId)?.title ?? scopeLabel;
  } else {
    scopeLabel = (await getTopic(scopeId, supabase))?.name ?? scopeLabel;
  }

  const cards = shuffleArray(enrichDeckCards(expressions, videos, topics));

  return { cards, scopeLabel };
}

export async function submitReviewRating(
  expressionId: string,
  rating: string,
  mode: ReviewMode,
  scopeId: string,
  options?: { deferSchedule?: boolean }
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (!isReviewRating(rating)) {
    return { ok: false, error: "Invalid rating." };
  }

  const supabase = getSupabaseAdmin();

  try {
    await insertReviewRating(
      { expressionId, rating, mode, scopeId },
      supabase
    );

    if (options?.deferSchedule && rating === "unsure") {
      return { ok: true };
    }

    const [queueRow, recentRatings] = await Promise.all([
      getQueueRow(expressionId, supabase),
      listRecentRatingsForExpression(expressionId, 2, supabase),
    ]);

    const priorRatings = recentRatings.slice(1);

    const schedule = scheduleAfterRating({
      rating,
      reviewedAt: new Date(),
      queueRow,
      recentRatings: priorRatings,
    });

    await upsertReviewQueue(
      {
        expressionId,
        dueAt: schedule.dueAt,
        memoryState: schedule.memoryState,
        intervalDays: schedule.intervalDays,
        lastReviewedAt: schedule.lastReviewedAt,
        firstReviewedAt: schedule.firstReviewedAt,
      },
      supabase
    );

    return { ok: true };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to save rating.";
    return { ok: false, error: message };
  }
}

export async function flushDeferredUnsureSchedules(
  expressionIds: string[]
): Promise<void> {
  const supabase = getSupabaseAdmin();
  const now = new Date();

  for (const expressionId of expressionIds) {
    const queueRow = await getQueueRow(expressionId, supabase);
    const schedule = scheduleDeferredUnsure(now, queueRow);
    await upsertReviewQueue(
      {
        expressionId,
        dueAt: schedule.dueAt,
        memoryState: schedule.memoryState,
        intervalDays: schedule.intervalDays,
        lastReviewedAt: schedule.lastReviewedAt,
        firstReviewedAt: schedule.firstReviewedAt,
      },
      supabase
    );
  }
}

export async function listReviewVideoScopes(): Promise<ReviewScopeOption[]> {
  const supabase = getSupabaseAdmin();
  const [videos, counts] = await Promise.all([
    listVideos(supabase),
    import("@/db/expressions").then((mod) => mod.listVideoExpressionCounts(supabase)),
  ]);

  return sortVideosByTitle(videos)
    .map((video) => ({
      id: video.id,
      label: video.title,
      count: counts.get(video.id) ?? 0,
    }))
    .filter((item) => item.count > 0);
}

export async function listReviewTopicScopes(): Promise<ReviewScopeOption[]> {
  const supabase = getSupabaseAdmin();
  const topics = await listTopics(supabase);
  const expressions = await import("@/db/expressions").then((mod) =>
    mod.listExpressions(supabase)
  );

  const countsByTopic = new Map<string, number>();
  for (const expression of expressions) {
    if (!expression.topic_id) continue;
    countsByTopic.set(
      expression.topic_id,
      (countsByTopic.get(expression.topic_id) ?? 0) + 1
    );
  }

  return topics
    .map((topic) => {
      const subtreeIds = listTopicSubtreeIds(topic.id, topics);
      const count = subtreeIds.reduce(
        (sum, id) => sum + (countsByTopic.get(id) ?? 0),
        0
      );
      return {
        id: topic.id,
        label: topic.name,
        count,
      };
    })
    .filter((item) => item.count > 0)
    .sort((a, b) => a.label.localeCompare(b.label));
}
