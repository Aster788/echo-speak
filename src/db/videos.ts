import { getSupabase } from "@/lib/supabase";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Video } from "@/types/transcript";

export async function listVideos(
  client?: SupabaseClient
): Promise<Video[]> {
  const supabase = client ?? getSupabase();
  const { data, error } = await supabase.from("videos").select("*");
  if (error) throw error;
  return (data ?? []) as Video[];
}

export async function createVideo(
  input: Pick<Video, "title" | "youtube_url" | "source">,
  client?: SupabaseClient
): Promise<Video> {
  const supabase = client ?? getSupabase();
  const { data, error } = await supabase
    .from("videos")
    .insert(input)
    .select()
    .single();
  if (error) throw error;
  return data as Video;
}
