import { normalizePhraseKey } from "@/lib/merge-expressions";
import { getSupabase } from "@/lib/supabase";
import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  NewExpressionCandidate,
  ReviewQueueRow,
  ReviewQueueUpsert,
} from "@/types/review";

export async function getQueueRow(
  expressionId: string,
  client?: SupabaseClient
): Promise<ReviewQueueRow | null> {
  const supabase = client ?? getSupabase();
  const { data, error } = await supabase
    .from("review_queue")
    .select("*")
    .eq("expression_id", expressionId)
    .maybeSingle();
  if (error) throw error;
  return (data as ReviewQueueRow | null) ?? null;
}

export async function upsertReviewQueue(
  input: ReviewQueueUpsert,
  client?: SupabaseClient
): Promise<ReviewQueueRow> {
  const supabase = client ?? getSupabase();
  const { data, error } = await supabase
    .from("review_queue")
    .upsert(
      {
        expression_id: input.expressionId,
        due_at: input.dueAt.toISOString(),
        memory_state: input.memoryState,
        interval_days: input.intervalDays,
        last_reviewed_at: input.lastReviewedAt,
        first_reviewed_at: input.firstReviewedAt,
        source: input.source ?? "transcript",
      },
      { onConflict: "expression_id" }
    )
    .select("*")
    .single();
  if (error) throw error;
  return data as ReviewQueueRow;
}

async function listDismissedKeysByVideo(
  client: SupabaseClient
): Promise<Map<string, Set<string>>> {
  const { data, error } = await client
    .from("expression_dismissals")
    .select("video_id, phrase_key");
  if (error) throw error;

  const map = new Map<string, Set<string>>();
  for (const row of data ?? []) {
    const videoId = row.video_id as string;
    const phraseKey = row.phrase_key as string;
    if (!map.has(videoId)) map.set(videoId, new Set());
    map.get(videoId)!.add(phraseKey);
  }
  return map;
}

function isExpressionDismissed(
  videoId: string,
  phrase: string,
  dismissed: Map<string, Set<string>>
): boolean {
  const keys = dismissed.get(videoId);
  if (!keys) return false;
  const phraseKey = normalizePhraseKey(phrase);
  return phraseKey ? keys.has(phraseKey) : false;
}

async function listDismissedExpressionIds(
  client: SupabaseClient
): Promise<Set<string>> {
  const dismissed = await listDismissedKeysByVideo(client);
  const { data, error } = await client.from("expressions").select("id, video_id, phrase");
  if (error) throw error;

  return new Set(
    (data ?? [])
      .filter((row) =>
        isExpressionDismissed(
          row.video_id as string,
          row.phrase as string,
          dismissed
        )
      )
      .map((row) => row.id as string)
  );
}

export async function listDueExpressionIds(
  now: Date = new Date(),
  client?: SupabaseClient
): Promise<string[]> {
  const supabase = client ?? getSupabase();
  const dismissed = await listDismissedExpressionIds(supabase);
  const { data, error } = await supabase
    .from("review_queue")
    .select("expression_id, due_at, first_reviewed_at")
    .lte("due_at", now.toISOString())
    .not("first_reviewed_at", "is", null)
    .order("due_at", { ascending: true });
  if (error) throw error;

  return (data ?? [])
    .map((row) => row.expression_id as string)
    .filter((id) => !dismissed.has(id));
}

export async function listNewExpressionCandidates(
  client?: SupabaseClient
): Promise<NewExpressionCandidate[]> {
  const supabase = client ?? getSupabase();
  const dismissed = await listDismissedExpressionIds(supabase);

  const { data: reviewed, error: reviewedError } = await supabase
    .from("review_queue")
    .select("expression_id")
    .not("first_reviewed_at", "is", null);
  if (reviewedError) throw reviewedError;

  const reviewedIds = new Set(
    (reviewed ?? []).map((row) => row.expression_id as string)
  );

  const { data, error } = await supabase
    .from("expressions")
    .select("id, video_id, topic_id, created_at, phrase");
  if (error) throw error;

  const dismissedByVideo = await listDismissedKeysByVideo(supabase);

  return (data ?? [])
    .filter(
      (row) =>
        !reviewedIds.has(row.id as string) &&
        !isExpressionDismissed(
          row.video_id as string,
          row.phrase as string,
          dismissedByVideo
        )
    )
    .map((row) => ({
      id: row.id as string,
      video_id: row.video_id as string,
      topic_id: row.topic_id as string,
      created_at: row.created_at as string,
    }));
}

export async function countDueExpressions(
  now: Date = new Date(),
  client?: SupabaseClient
): Promise<number> {
  const ids = await listDueExpressionIds(now, client);
  return ids.length;
}

export async function countNewExpressions(
  client?: SupabaseClient
): Promise<number> {
  const candidates = await listNewExpressionCandidates(client);
  return candidates.length;
}

export async function listExpressionIdsReviewedToday(
  client?: SupabaseClient
): Promise<Set<string>> {
  const supabase = client ?? getSupabase();
  const start = new Date();
  start.setHours(0, 0, 0, 0);

  const { data, error } = await supabase
    .from("review_history")
    .select("expression_id")
    .gte("reviewed_at", start.toISOString());
  if (error) throw error;

  return new Set((data ?? []).map((row) => row.expression_id as string));
}
