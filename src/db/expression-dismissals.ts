import { normalizePhraseKey } from "@/lib/merge-expressions";
import { getSupabase } from "@/lib/supabase";
import type { DismissReason } from "@/types/dismiss-reason";
import type { SupabaseClient } from "@supabase/supabase-js";

export type ExpressionDismissal = {
  id: string;
  video_id: string;
  phrase_key: string;
  phrase: string | null;
  reason: DismissReason | null;
  topic_id: string | null;
  dismissed_at: string;
};

export type RecordDismissalInput = {
  videoId: string;
  phrase: string;
  reason?: DismissReason | null;
  topicId?: string | null;
};

export async function recordDismissal(
  input: RecordDismissalInput,
  client?: SupabaseClient
): Promise<void> {
  const supabase = client ?? getSupabase();
  const phrase_key = normalizePhraseKey(input.phrase);
  if (!phrase_key) {
    throw new Error("Cannot dismiss expression with empty phrase.");
  }

  const { error } = await supabase.from("expression_dismissals").upsert(
    {
      video_id: input.videoId,
      phrase_key,
      phrase: input.phrase.trim(),
      reason: input.reason ?? null,
      topic_id: input.topicId ?? null,
      dismissed_at: new Date().toISOString(),
    },
    { onConflict: "video_id,phrase_key" }
  );
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
