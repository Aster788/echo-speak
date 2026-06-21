import { normalizePhraseKey } from "@/lib/merge-expressions";
import { getSupabase } from "@/lib/supabase";
import type { SupabaseClient } from "@supabase/supabase-js";

export type ExpressionDismissal = {
  id: string;
  video_id: string;
  phrase_key: string;
  dismissed_at: string;
};

export async function recordDismissal(
  videoId: string,
  phrase: string,
  client?: SupabaseClient
): Promise<void> {
  const supabase = client ?? getSupabase();
  const phrase_key = normalizePhraseKey(phrase);
  if (!phrase_key) {
    throw new Error("Cannot dismiss expression with empty phrase.");
  }

  const { error } = await supabase.from("expression_dismissals").upsert(
    {
      video_id: videoId,
      phrase_key,
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
