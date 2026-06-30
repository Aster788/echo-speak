export type ImportActionState = {
  ok: boolean;
  message: string;
  videoId?: string;
  transcriptId?: string;
  duplicate?: boolean;
  reason?: "youtube_url" | "content_hash";
  videoTitle?: string;
  /** Present on duplicate import — how many expressions already exist for this video. */
  expressionCount?: number;
};

export const importActionInitialState: ImportActionState = {
  ok: false,
  message: "",
};
