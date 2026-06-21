export class DuplicateImportError extends Error {
  readonly reason: "youtube_url" | "content_hash";
  readonly videoId: string;
  readonly transcriptId: string | null;
  readonly videoTitle: string | null;

  constructor(options: {
    message: string;
    reason: "youtube_url" | "content_hash";
    videoId: string;
    transcriptId?: string | null;
    videoTitle?: string | null;
  }) {
    super(options.message);
    this.name = "DuplicateImportError";
    this.reason = options.reason;
    this.videoId = options.videoId;
    this.transcriptId = options.transcriptId ?? null;
    this.videoTitle = options.videoTitle ?? null;
  }
}

export function isDuplicateImportError(
  error: unknown
): error is DuplicateImportError {
  return error instanceof DuplicateImportError;
}
