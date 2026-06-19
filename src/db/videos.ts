import { getSupabase } from "@/lib/supabase";
import type { Video } from "@/types/transcript";

export async function listVideos(): Promise<Video[]> {
  const { data, error } = await getSupabase().from("videos").select("*");
  if (error) throw error;
  return (data ?? []) as Video[];
}

export async function createVideo(
  input: Pick<Video, "title" | "youtube_url" | "source">
): Promise<Video> {
  const { data, error } = await getSupabase()
    .from("videos")
    .insert(input)
    .select()
    .single();
  if (error) throw error;
  return data as Video;
}
