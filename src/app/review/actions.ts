"use server";

import { listExpressionsByTopicSubtree, listExpressionsByVideo } from "@/db/expressions";
import { insertReviewRating, isReviewRating } from "@/db/review-history";
import { getTopic, listTopicSubtreeIds, listTopics } from "@/db/topics";
import { listVideos } from "@/db/videos";
import { getSupabaseAdmin } from "@/lib/supabase";
import type { ReviewDeckCard, ReviewMode, ReviewScopeOption } from "@/types/review";

function enrichDeckCards(
  expressions: Awaited<ReturnType<typeof listExpressionsByVideo>>,
  videos: Awaited<ReturnType<typeof listVideos>>,
  topics: Awaited<ReturnType<typeof listTopics>>
): ReviewDeckCard[] {
  const videoById = new Map(videos.map((video) => [video.id, video]));
  const topicById = new Map(topics.map((topic) => [topic.id, topic]));

  return expressions.map((expression) => ({
    ...expression,
    videoTitle: videoById.get(expression.video_id)?.title ?? "Unknown video",
    topicName: topicById.get(expression.topic_id)?.name ?? "Unknown topic",
  }));
}

export async function loadReviewDeck(
  mode: ReviewMode,
  scopeId: string
): Promise<{ cards: ReviewDeckCard[]; scopeLabel: string }> {
  const supabase = getSupabaseAdmin();
  const [expressions, videos, topics] = await Promise.all([
    mode === "video"
      ? listExpressionsByVideo(scopeId, supabase)
      : listExpressionsByTopicSubtree(scopeId, supabase),
    listVideos(supabase),
    listTopics(supabase),
  ]);

  let scopeLabel = "Review";
  if (mode === "video") {
    scopeLabel = videos.find((video) => video.id === scopeId)?.title ?? scopeLabel;
  } else {
    scopeLabel = (await getTopic(scopeId, supabase))?.name ?? scopeLabel;
  }

  return {
    cards: enrichDeckCards(expressions, videos, topics),
    scopeLabel,
  };
}

export async function submitReviewRating(
  expressionId: string,
  rating: string,
  mode: ReviewMode,
  scopeId: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (!isReviewRating(rating)) {
    return { ok: false, error: "Invalid rating." };
  }

  try {
    await insertReviewRating(
      { expressionId, rating, mode, scopeId },
      getSupabaseAdmin()
    );
    return { ok: true };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to save rating.";
    return { ok: false, error: message };
  }
}

export async function listReviewVideoScopes(): Promise<ReviewScopeOption[]> {
  const supabase = getSupabaseAdmin();
  const [videos, counts] = await Promise.all([
    listVideos(supabase),
    import("@/db/expressions").then((mod) => mod.listVideoExpressionCounts(supabase)),
  ]);

  return videos
    .map((video) => ({
      id: video.id,
      label: video.title,
      count: counts.get(video.id) ?? 0,
    }))
    .filter((item) => item.count > 0)
    .sort((a, b) => a.label.localeCompare(b.label));
}

export async function listReviewTopicScopes(): Promise<ReviewScopeOption[]> {
  const supabase = getSupabaseAdmin();
  const topics = await listTopics(supabase);
  const expressions = await import("@/db/expressions").then((mod) =>
    mod.listExpressions(supabase)
  );

  const countsByTopic = new Map<string, number>();
  for (const expression of expressions) {
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
