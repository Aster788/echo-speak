import { normalizePhraseKey } from "@/lib/merge-expressions";
import { fetchAllRows } from "@/lib/supabase-fetch-all";
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
  const rows = await fetchAllRows<{ video_id: string; phrase_key: string }>(
    (from, to) =>
      client
        .from("expression_dismissals")
        .select("video_id, phrase_key")
        .order("id", { ascending: true })
        .range(from, to)
  );

  const map = new Map<string, Set<string>>();
  for (const row of rows) {
    const videoId = row.video_id;
    const phraseKey = row.phrase_key;
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

type ExpressionDismissalRow = {
  id: string;
  video_id: string;
  phrase: string;
};

async function listExpressionDismissalRows(
  client: SupabaseClient
): Promise<ExpressionDismissalRow[]> {
  return fetchAllRows<ExpressionDismissalRow>((from, to) =>
    client
      .from("expressions")
      .select("id, video_id, phrase")
      .order("id", { ascending: true })
      .range(from, to)
  );
}

async function listDismissedExpressionIds(
  client: SupabaseClient
): Promise<Set<string>> {
  const dismissed = await listDismissedKeysByVideo(client);
  const rows = await listExpressionDismissalRows(client);

  return new Set(
    rows
      .filter((row) =>
        isExpressionDismissed(row.video_id, row.phrase, dismissed)
      )
      .map((row) => row.id)
  );
}

export async function listDueExpressionIds(
  now: Date = new Date(),
  client?: SupabaseClient
): Promise<string[]> {
  const supabase = client ?? getSupabase();
  const dismissed = await listDismissedExpressionIds(supabase);
  const data = await fetchAllRows<{ expression_id: string }>((from, to) =>
    supabase
      .from("review_queue")
      .select("expression_id, due_at, first_reviewed_at")
      .lte("due_at", now.toISOString())
      .not("first_reviewed_at", "is", null)
      .order("due_at", { ascending: true })
      .order("expression_id", { ascending: true })
      .range(from, to)
  );

  return data
    .map((row) => row.expression_id)
    .filter((id) => !dismissed.has(id));
}

export async function listNewExpressionCandidates(
  client?: SupabaseClient
): Promise<NewExpressionCandidate[]> {
  const supabase = client ?? getSupabase();

  const [dismissedByVideo, reviewed, expressions] = await Promise.all([
    listDismissedKeysByVideo(supabase),
    fetchAllRows<{ expression_id: string }>((from, to) =>
      supabase
        .from("review_queue")
        .select("expression_id")
        .not("first_reviewed_at", "is", null)
        .order("expression_id", { ascending: true })
        .range(from, to)
    ),
    fetchAllRows<{
      id: string;
      video_id: string;
      topic_id: string | null;
      created_at: string;
      phrase: string;
    }>((from, to) =>
      supabase
        .from("expressions")
        .select("id, video_id, topic_id, created_at, phrase")
        .order("id", { ascending: true })
        .range(from, to)
    ),
  ]);

  const reviewedIds = new Set(reviewed.map((row) => row.expression_id));

  return expressions
    .filter(
      (row) =>
        !reviewedIds.has(row.id) &&
        !isExpressionDismissed(row.video_id, row.phrase, dismissedByVideo)
    )
    .map((row) => ({
      id: row.id,
      video_id: row.video_id,
      topic_id: row.topic_id,
      created_at: row.created_at,
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

  const data = await fetchAllRows<{ expression_id: string }>((from, to) =>
    supabase
      .from("review_history")
      .select("expression_id")
      .gte("reviewed_at", start.toISOString())
      .order("id", { ascending: true })
      .range(from, to)
  );

  return new Set(data.map((row) => row.expression_id));
}
