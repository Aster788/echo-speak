import { getSupabase } from "@/lib/supabase";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Transcript } from "@/types/transcript";

export async function createTranscript(
  input: Pick<Transcript, "video_id" | "raw_text" | "cleaned_text">,
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
