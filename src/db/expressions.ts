import { recordDismissal } from "@/db/expression-dismissals";
import { getSupabase } from "@/lib/supabase";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { CreateExpressionInput, Expression } from "@/types/expression";
import { listTopicSubtreeIds, listTopics } from "@/db/topics";

export async function listExpressions(
  client?: SupabaseClient
): Promise<Expression[]> {
  const supabase = client ?? getSupabase();
  const { data, error } = await supabase.from("expressions").select("*");
  if (error) throw error;
  return (data ?? []) as Expression[];
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
  return (data ?? []) as Expression[];
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
  return (data ?? []) as Expression[];
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
  return (data ?? []) as Expression[];
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

export async function dismissExpression(
  expressionId: string,
  client?: SupabaseClient
): Promise<void> {
  const supabase = client ?? getSupabase();
  const expression = await getExpression(expressionId, supabase);
  if (!expression) {
    throw new Error("Expression not found.");
  }

  await recordDismissal(expression.video_id, expression.phrase, supabase);
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
  const rows = inputs.map((input) => ({
    video_id: input.video_id,
    phrase: input.phrase,
    meaning: input.meaning,
    example: input.example,
    topic_id: input.topic_id,
    source_type: input.source_type ?? "transcript",
    weight: input.weight ?? 1.0,
  }));

  const { data, error } = await supabase
    .from("expressions")
    .insert(rows)
    .select();
  if (error) throw error;
  return (data ?? []) as Expression[];
}

/** @deprecated Use createExpressions */
export async function createExpression(
  input: CreateExpressionInput,
  client?: SupabaseClient
): Promise<Expression> {
  const [expression] = await createExpressions([input], client);
  return expression;
}
