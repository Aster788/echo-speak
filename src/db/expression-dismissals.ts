import { normalizePhraseKey } from "@/lib/merge-expressions";
import { fetchAllRows } from "@/lib/supabase-fetch-all";
import { getSupabase } from "@/lib/supabase";
import type { DismissReason } from "@/types/dismiss-reason";
import type { DismissedPreferenceRecord } from "@/types/extraction-preference";
import type { SupabaseClient } from "@supabase/supabase-js";

export type ExpressionDismissal = {
  id: string;
  video_id: string;
  phrase_key: string;
  phrase: string | null;
  reason: DismissReason | null;
  topic_id: string | null;
  user_id: string | null;
  dismissed_at: string;
};

export type RecordDismissalInput = {
  videoId: string;
  phrase: string;
  reason?: DismissReason | null;
  topicId?: string | null;
  userId?: string | null;
};

type DismissalPreferenceRow = {
  phrase: string | null;
  phrase_key: string;
  reason: DismissReason | null;
  topic_id: string | null;
  dismissed_at: string;
  topics: { slug: string } | { slug: string }[] | null;
};

export async function listDismissalPreferenceRecords(
  userId: string,
  client?: SupabaseClient
): Promise<DismissedPreferenceRecord[]> {
  const supabase = client ?? getSupabase();
  const data = await fetchAllRows<DismissalPreferenceRow>((from, to) =>
    supabase
      .from("expression_dismissals")
      .select(
        `
      phrase,
      phrase_key,
      reason,
      topic_id,
      dismissed_at,
      topics (slug)
    `
      )
      .eq("user_id", userId)
      .order("dismissed_at", { ascending: false })
      .order("id", { ascending: true })
      .range(from, to)
  );

  return data.flatMap((row) => {
    if (!row.phrase?.trim() || !row.phrase_key?.trim()) return [];
    const topic = Array.isArray(row.topics)
      ? row.topics[0] ?? null
      : row.topics;
    return [
      {
        phrase: row.phrase.trim(),
        phraseKey: row.phrase_key,
        reason: row.reason,
        topicId: row.topic_id,
        topicSlug: topic?.slug ?? null,
        dismissedAt: row.dismissed_at,
      },
    ];
  });
}

export async function recordDismissal(
  input: RecordDismissalInput,
  client?: SupabaseClient
): Promise<void> {
  const supabase = client ?? getSupabase();
  const phrase_key = normalizePhraseKey(input.phrase);
  if (!phrase_key) {
    throw new Error("Cannot dismiss expression with empty phrase.");
  }

  const dismissed_at = new Date().toISOString();
  const extended = {
    video_id: input.videoId,
    phrase_key,
    phrase: input.phrase.trim(),
    reason: input.reason ?? null,
    topic_id: input.topicId ?? null,
    user_id: input.userId ?? null,
    dismissed_at,
  };

  let { error } = await supabase
    .from("expression_dismissals")
    .upsert(extended, { onConflict: "video_id,phrase_key" });

  // Cloud may lag repo migrations (phrase/reason/topic_id/user_id columns).
  if (error && /phrase|reason|topic_id|user_id/i.test(error.message)) {
    ({ error } = await supabase.from("expression_dismissals").upsert(
      {
        video_id: input.videoId,
        phrase_key,
        dismissed_at,
      },
      { onConflict: "video_id,phrase_key" }
    ));
  }

  if (error) throw error;
}

export async function listDismissedPhraseKeysForVideo(
  videoId: string,
  client?: SupabaseClient
): Promise<Set<string>> {
  const supabase = client ?? getSupabase();
  const { data, error } = await supabase
    .from("expression_dismissals")
    .select("phrase_key")
    .eq("video_id", videoId);
  if (error) throw error;

  return new Set((data ?? []).map((row) => row.phrase_key as string));
}

export async function listGlobalDismissedPhraseKeys(
  userId: string,
  client?: SupabaseClient
): Promise<Set<string>> {
  const supabase = client ?? getSupabase();
  const data = await fetchAllRows<{ phrase_key: string }>((from, to) =>
    supabase
      .from("expression_dismissals")
      .select("phrase_key")
      .eq("user_id", userId)
      .order("id", { ascending: true })
      .range(from, to)
  );

  return new Set(data.map((row) => row.phrase_key));
}
