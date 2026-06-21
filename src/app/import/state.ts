export type ImportActionState = {
  ok: boolean;
  message: string;
  videoId?: string;
  transcriptId?: string;
  duplicate?: boolean;
  reason?: "youtube_url" | "content_hash";
  videoTitle?: string;
};

export const importActionInitialState: ImportActionState = {
  ok: false,
  message: "",
};
