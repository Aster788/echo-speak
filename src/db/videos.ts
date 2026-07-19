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

export async function getVideoByYoutubeUrl(
  youtubeUrl: string,
  client?: SupabaseClient
): Promise<Video | null> {
  const supabase = client ?? getSupabase();
  const { data, error } = await supabase
    .from("videos")
    .select("*")
    .eq("youtube_url", youtubeUrl)
    .maybeSingle();
  if (error) throw error;
  return (data as Video | null) ?? null;
}

export async function getVideoByTitle(
  title: string,
  client?: SupabaseClient
): Promise<Video | null> {
  const supabase = client ?? getSupabase();
  const { data, error } = await supabase
    .from("videos")
    .select("*")
    .eq("title", title)
    .eq("source", "feishu")
    .maybeSingle();
  if (error) throw error;
  return (data as Video | null) ?? null;
}

export type CreateVideoInput = Pick<Video, "title" | "youtube_url" | "source"> & {
  creator?: string | null;
};

export async function createVideo(
  input: CreateVideoInput,
  client?: SupabaseClient
): Promise<Video> {
  const supabase = client ?? getSupabase();
  const { data, error } = await supabase
    .from("videos")
    .insert({
      title: input.title,
      youtube_url: input.youtube_url,
      source: input.source,
      creator: input.creator ?? null,
    })
    .select()
    .single();
  if (error) throw error;
  return data as Video;
}

export async function updateVideoMetadata(
  videoId: string,
  patch: Partial<Pick<Video, "title" | "creator">>,
  client?: SupabaseClient
): Promise<Video> {
  const supabase = client ?? getSupabase();
  const { data, error } = await supabase
    .from("videos")
    .update(patch)
    .eq("id", videoId)
    .select()
    .single();
  if (error) throw error;
  return data as Video;
}

export type FeishuVideoSectionInput = {
  videoTitle: string;
  youtubeUrl: string | null;
  creatorName: string | null;
};

export async function resolveVideoForFeishuSection(
  section: FeishuVideoSectionInput,
  client?: SupabaseClient
): Promise<Video> {
  const supabase = client ?? getSupabase();

  if (section.youtubeUrl) {
    const existing = await getVideoByYoutubeUrl(section.youtubeUrl, supabase);
    if (existing) {
      if (section.creatorName && !existing.creator) {
        return updateVideoMetadata(
          existing.id,
          { creator: section.creatorName },
          supabase
        );
      }
      return existing;
    }
    return createVideo(
      {
        title: section.videoTitle,
        youtube_url: section.youtubeUrl,
        source: "feishu",
        creator: section.creatorName,
      },
      supabase
    );
  }

  const byTitle = await getVideoByTitle(section.videoTitle, supabase);
  if (byTitle) {
    if (section.creatorName && !byTitle.creator) {
      return updateVideoMetadata(
        byTitle.id,
        { creator: section.creatorName },
        supabase
      );
    }
    return byTitle;
  }

  return createVideo(
    {
      title: section.videoTitle,
      youtube_url: null,
      source: "feishu",
      creator: section.creatorName,
    },
    supabase
  );
}
