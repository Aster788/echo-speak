import { recordDismissal } from "@/db/expression-dismissals";
import { listTopicSubtreeIds, listTopics } from "@/db/topics";
import { applyExpressionCorrection } from "@/lib/expression-correction";
import { canonicalKey, pickDisplayPhrase } from "@/lib/phrase-canonical";
import { sortExpressionsByPhrase } from "@/lib/sort-collections";
import { getSupabase } from "@/lib/supabase";
import type { ExpressionCorrectionInput } from "@/types/expression-correction";
import type {
  CreateExpressionInput,
  Expression,
  ExpressionExample,
} from "@/types/expression";
import type { SupabaseClient } from "@supabase/supabase-js";

export async function listExpressions(
  client?: SupabaseClient
): Promise<Expression[]> {
  const supabase = client ?? getSupabase();
  const { data, error } = await supabase.from("expressions").select("*");
  if (error) throw error;
  return sortExpressionsByPhrase((data ?? []) as Expression[]);
}

export async function getExpression(
  id: string,
  client?: SupabaseClient
): Promise<Expression | null> {
  const supabase = client ?? getSupabase();
  const { data, error } = await supabase
    .from("expressions")
    .select("*")
    .eq("id", id)
    .single();
  if (error) return null;
  return data as Expression;
}

export async function listExpressionsByIds(
  ids: string[],
  client?: SupabaseClient
): Promise<Expression[]> {
  if (ids.length === 0) return [];
  const supabase = client ?? getSupabase();
  const { data, error } = await supabase
    .from("expressions")
    .select("*")
    .in("id", ids);
  if (error) throw error;
  return (data ?? []) as Expression[];
}

export async function countExpressionsByVideo(
  videoId: string,
  client?: SupabaseClient
): Promise<number> {
  const supabase = client ?? getSupabase();
  const { count, error } = await supabase
    .from("expressions")
    .select("*", { count: "exact", head: true })
    .eq("video_id", videoId);
  if (error) throw error;
  return count ?? 0;
}

export async function listExpressionsByVideo(
  videoId: string,
  client?: SupabaseClient
): Promise<Expression[]> {
  const supabase = client ?? getSupabase();
  const { data, error } = await supabase
    .from("expressions")
    .select("*")
    .eq("video_id", videoId)
    .order("created_at", { ascending: true });
  if (error) throw error;
  return sortExpressionsByPhrase((data ?? []) as Expression[]);
}

export async function listExpressionsByTopicSubtree(
  topicId: string,
  client?: SupabaseClient
): Promise<Expression[]> {
  const supabase = client ?? getSupabase();
  const topics = await listTopics(supabase);
  const subtreeIds = listTopicSubtreeIds(topicId, topics);
  if (subtreeIds.length === 0) {
    return [];
  }

  const { data, error } = await supabase
    .from("expressions")
    .select("*")
    .in("topic_id", subtreeIds)
    .order("created_at", { ascending: true });
  if (error) throw error;
  return sortExpressionsByPhrase((data ?? []) as Expression[]);
}

export async function listExpressionsByTopicId(
  topicId: string,
  client?: SupabaseClient
): Promise<Expression[]> {
  const supabase = client ?? getSupabase();
  const { data, error } = await supabase
    .from("expressions")
    .select("*")
    .eq("topic_id", topicId)
    .order("created_at", { ascending: true });
  if (error) throw error;
  return sortExpressionsByPhrase((data ?? []) as Expression[]);
}

export async function deleteUnlockedExpressionsByVideoAndSource(
  videoId: string,
  sourceType: Expression["source_type"],
  client?: SupabaseClient
): Promise<void> {
  const supabase = client ?? getSupabase();
  const { error } = await supabase
    .from("expressions")
    .delete()
    .eq("video_id", videoId)
    .eq("source_type", sourceType)
    .eq("topic_locked", false);
  if (error) throw error;
}

/** @deprecated Use deleteUnlockedExpressionsByVideoAndSource */
export async function deleteExpressionsByVideoAndSource(
  videoId: string,
  sourceType: Expression["source_type"],
  client?: SupabaseClient
): Promise<void> {
  return deleteUnlockedExpressionsByVideoAndSource(
    videoId,
    sourceType,
    client
  );
}

export async function updateExpressionTopic(
  expressionId: string,
  topicId: string,
  client?: SupabaseClient
): Promise<Expression> {
  const supabase = client ?? getSupabase();
  const { data, error } = await supabase
    .from("expressions")
    .update({ topic_id: topicId, topic_locked: true })
    .eq("id", expressionId)
    .select()
    .single();
  if (error) throw error;
  return data as Expression;
}

export async function unlockExpressionTopic(
  expressionId: string,
  client?: SupabaseClient
): Promise<Expression> {
  const supabase = client ?? getSupabase();
  const { data, error } = await supabase
    .from("expressions")
    .update({ topic_locked: false })
    .eq("id", expressionId)
    .select()
    .single();
  if (error) throw error;
  return data as Expression;
}

export async function deleteExpression(
  expressionId: string,
  client?: SupabaseClient
): Promise<void> {
  const supabase = client ?? getSupabase();
  const { error } = await supabase
    .from("expressions")
    .delete()
    .eq("id", expressionId);
  if (error) throw error;
}

/** Gaps Accept: bump weight (Feishu-style cap) and lock against re-extract wipe. */
export async function acceptExpressionKeepSignal(
  expressionId: string,
  client?: SupabaseClient
): Promise<Expression> {
  const supabase = client ?? getSupabase();
  const expression = await getExpression(expressionId, supabase);
  if (!expression) {
    throw new Error("Expression not found.");
  }

  const weight = Math.min(expression.weight + 0.5, 3.0);
  const { data, error } = await supabase
    .from("expressions")
    .update({ weight, topic_locked: true })
    .eq("id", expressionId)
    .select()
    .single();
  if (error) throw error;
  return data as Expression;
}

/** Pure helper for tests / shared cap math. */
export function nextAcceptedWeight(current: number): number {
  return Math.min(current + 0.5, 3.0);
}

import type { DismissReason } from "@/types/dismiss-reason";

export async function dismissExpression(
  expressionId: string,
  options: {
    reason?: DismissReason | null;
    client?: SupabaseClient;
    userId?: string | null;
  } = {}
): Promise<void> {
  const supabase = options.client ?? getSupabase();
  const expression = await getExpression(expressionId, supabase);
  if (!expression) {
    throw new Error("Expression not found.");
  }

  await recordDismissal(
    {
      videoId: expression.video_id,
      phrase: expression.phrase,
      reason: options.reason ?? null,
      topicId: expression.topic_id,
      userId: options.userId ?? null,
    },
    supabase
  );
  await deleteExpression(expressionId, supabase);
}

export async function createExpressions(
  inputs: CreateExpressionInput[],
  client?: SupabaseClient
): Promise<Expression[]> {
  if (inputs.length === 0) {
    return [];
  }

  const supabase = client ?? getSupabase();
  const rows = inputs.map((input) => {
    const examples =
      input.examples ??
      (input.example_en
        ? [{ en: input.example_en, zh: input.example_zh ?? null }]
        : null);
    return {
      video_id: input.video_id,
      phrase: input.phrase,
      meaning: input.meaning,
      example_en: input.example_en,
      example_zh: input.example_zh ?? null,
      examples,
      topic_id: input.topic_id,
      source_type: input.source_type ?? "transcript",
      weight: input.weight ?? 1.0,
      feishu_section: input.feishu_section ?? null,
      phonetic: input.phonetic ?? null,
    };
  });

  const { data, error } = await supabase
    .from("expressions")
    .insert(rows)
    .select();
  if (error) throw error;
  return (data ?? []) as Expression[];
}

export async function updateExpressionExampleZh(
  expressionId: string,
  exampleZh: string,
  client?: SupabaseClient
): Promise<void> {
  const supabase = client ?? getSupabase();
  const { error } = await supabase
    .from("expressions")
    .update({ example_zh: exampleZh })
    .eq("id", expressionId);
  if (error) throw error;
}

/** Persist a Review-card field correction (phrase / meaning / example). */
export async function correctExpressionFields(
  expressionId: string,
  input: ExpressionCorrectionInput,
  client?: SupabaseClient
): Promise<Expression> {
  const supabase = client ?? getSupabase();
  const existing = await getExpression(expressionId, supabase);
  if (!existing) {
    throw new Error(`Expression not found: ${expressionId}`);
  }

  const next = applyExpressionCorrection(
    {
      phrase: existing.phrase,
      meaning: existing.meaning,
      example_en: existing.example_en,
      example_zh: existing.example_zh,
      examples: existing.examples,
    },
    input
  );

  const { data, error } = await supabase
    .from("expressions")
    .update({
      phrase: next.phrase,
      meaning: next.meaning,
      example_en: next.example_en,
      example_zh: next.example_zh,
      examples: next.examples,
    })
    .eq("id", expressionId)
    .select()
    .single();
  if (error) throw error;
  return data as Expression;
}

export async function listExpressionsMissingExampleZh(
  client?: SupabaseClient
): Promise<Expression[]> {
  const supabase = client ?? getSupabase();
  const { data, error } = await supabase
    .from("expressions")
    .select("*")
    .is("example_zh", null);
  if (error) throw error;
  return (data ?? []) as Expression[];
}

export async function listVideoExpressionCounts(
  client?: SupabaseClient
): Promise<Map<string, number>> {
  const supabase = client ?? getSupabase();
  const { data, error } = await supabase.rpc("expression_counts_by_video");
  if (error) throw error;

  const counts = new Map<string, number>();
  for (const row of (data ?? []) as Array<{
    video_id: string;
    expression_count: number | string;
  }>) {
    counts.set(row.video_id, Number(row.expression_count));
  }
  return counts;
}

/** @deprecated Use createExpressions */
export async function createExpression(
  input: CreateExpressionInput,
  client?: SupabaseClient
): Promise<Expression> {
  const [expression] = await createExpressions([input], client);
  return expression;
}

function rowExamples(expr: Expression): ExpressionExample[] {
  if (expr.examples && expr.examples.length > 0) {
    return expr.examples.filter((example) => example.en?.trim());
  }
  if (expr.example_en?.trim()) {
    return [{ en: expr.example_en, zh: expr.example_zh }];
  }
  return [];
}

/**
 * Merge source expression into target: combine `examples`, pick the most
 * general display phrase, preserve `topic_locked` (locked wins), and delete
 * the source row. Returns the updated target expression.
 */
export async function mergeExpressions(
  sourceId: string,
  targetId: string,
  client?: SupabaseClient
): Promise<Expression> {
  if (sourceId === targetId) {
    throw new Error("Cannot merge an expression into itself.");
  }
  const supabase = client ?? getSupabase();
  const [source, target] = await Promise.all([
    getExpression(sourceId, supabase),
    getExpression(targetId, supabase),
  ]);
  if (!source) throw new Error(`Source expression not found: ${sourceId}`);
  if (!target) throw new Error(`Target expression not found: ${targetId}`);

  const combinedExamples = [...rowExamples(target), ...rowExamples(source)];
  // non-null zh wins for examples[0]
  if (combinedExamples[0] && !combinedExamples[0].zh) {
    const zhWinner = combinedExamples.find((e) => e.zh);
    if (zhWinner) combinedExamples[0] = { ...combinedExamples[0], zh: zhWinner.zh };
  }
  const displayPhrase = pickDisplayPhrase([target.phrase, source.phrase]);
  const topicLocked = target.topic_locked || source.topic_locked;
  const topicId = source.topic_locked ? source.topic_id : target.topic_id;

  const { data, error } = await supabase
    .from("expressions")
    .update({
      phrase: displayPhrase,
      example_en: combinedExamples[0]?.en ?? target.example_en,
      example_zh: combinedExamples[0]?.zh ?? target.example_zh,
      examples: combinedExamples,
      topic_locked: topicLocked,
      topic_id: topicId,
    })
    .eq("id", targetId)
    .select()
    .single();
  if (error) throw error;

  await deleteExpression(sourceId, supabase);
  return data as Expression;
}

/**
 * Group expression rows by canonical key across all videos (or within a topic
 * subtree), concatenating their `examples` arrays into one virtual row per
 * canonical key. Used by the All and Topic views; Video view stays unmerged.
 */
export async function listExpressionsMergedByCanonicalKey(
  scope: { kind: "all" } | { kind: "topic"; topicId: string },
  client?: SupabaseClient
): Promise<Expression[]> {
  const supabase = client ?? getSupabase();
  const rows =
    scope.kind === "all"
      ? await listExpressions(supabase)
      : await listExpressionsByTopicSubtree(scope.topicId, supabase);

  const groups = new Map<string, Expression[]>();
  for (const row of rows) {
    const key = canonicalKey(row.phrase) || row.phrase.toLowerCase();
    const list = groups.get(key) ?? [];
    list.push(row);
    groups.set(key, list);
  }

  const merged: Expression[] = [];
  for (const group of groups.values()) {
    const examples = group.flatMap(rowExamples);
    const displayPhrase = pickDisplayPhrase(group.map((g) => g.phrase));
    const lockedRow = group.find((g) => g.topic_locked);
    const base = lockedRow ?? group[0];
    merged.push({
      ...base,
      id: base.id,
      phrase: displayPhrase,
      example_en: examples[0]?.en ?? base.example_en,
      example_zh: examples[0]?.zh ?? base.example_zh,
      examples,
      topic_locked: group.some((g) => g.topic_locked),
      topic_id: lockedRow?.topic_id ?? base.topic_id,
    });
  }

  return sortExpressionsByPhrase(merged);
}
