import { getSupabase } from "@/lib/supabase";
import type { Transcript } from "@/types/transcript";

export async function createTranscript(
  input: Pick<Transcript, "video_id" | "raw_text" | "cleaned_text">
): Promise<Transcript> {
  const { data, error } = await getSupabase()
    .from("transcripts")
    .insert(input)
    .select()
    .single();
  if (error) throw error;
  return data as Transcript;
}

export async function getTranscript(id: string): Promise<Transcript | null> {
  const { data, error } = await getSupabase()
    .from("transcripts")
    .select("*")
    .eq("id", id)
    .single();
  if (error) return null;
  return data as Transcript;
}
