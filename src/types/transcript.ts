export interface Transcript {
  id: string;
  video_id: string;
  raw_text: string;
  cleaned_text: string | null;
  content_hash: string | null;
  created_at: string;
}

export interface Video {
  id: string;
  title: string;
  youtube_url: string | null;
  source: "youtube" | "manual";
  created_at: string;
}
