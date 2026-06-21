import { getSupabase } from "@/lib/supabase";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Transcript } from "@/types/transcript";

export async function getTranscriptByContentHash(
  contentHash: string,
  client?: SupabaseClient
): Promise<Transcript | null> {
  const supabase = client ?? getSupabase();
  const { data, error } = await supabase
    .from("transcripts")
    .select("*")
    .eq("content_hash", contentHash)
    .maybeSingle();
  if (error) throw error;
  return (data as Transcript | null) ?? null;
}

export async function getLatestTranscriptForVideo(
  videoId: string,
  client?: SupabaseClient
): Promise<Transcript | null> {
  const supabase = client ?? getSupabase();
  const { data, error } = await supabase
    .from("transcripts")
    .select("*")
    .eq("video_id", videoId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return (data as Transcript | null) ?? null;
}

export async function createTranscript(
  input: Pick<Transcript, "video_id" | "raw_text" | "cleaned_text"> & {
    content_hash?: string | null;
  },
  client?: SupabaseClient
): Promise<Transcript> {
  const supabase = client ?? getSupabase();
  const { data, error } = await supabase
    .from("transcripts")
    .insert(input)
    .select()
    .single();
  if (error) throw error;
  return data as Transcript;
}

export async function getTranscript(
  id: string,
  client?: SupabaseClient
): Promise<Transcript | null> {
  const supabase = client ?? getSupabase();
  const { data, error } = await supabase
    .from("transcripts")
    .select("*")
    .eq("id", id)
    .single();
  if (error) return null;
  return data as Transcript;
}

export async function listTranscriptsWithCleanedText(
  client?: SupabaseClient
): Promise<Pick<Transcript, "id" | "video_id" | "cleaned_text">[]> {
  const supabase = client ?? getSupabase();
  const { data, error } = await supabase
    .from("transcripts")
    .select("id, video_id, cleaned_text")
    .not("cleaned_text", "is", null);
  if (error) throw error;

  return (data ?? []).filter(
    (row) => typeof row.cleaned_text === "string" && row.cleaned_text.trim()
  ) as Pick<Transcript, "id" | "video_id" | "cleaned_text">[];
}
