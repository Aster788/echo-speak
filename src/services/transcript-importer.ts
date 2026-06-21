import {
  createTranscript,
  getLatestTranscriptForVideo,
  getTranscriptByContentHash,
} from "@/db/transcripts";
import { createVideo, getVideoByYoutubeUrl } from "@/db/videos";
import { hashTranscriptContent } from "@/lib/transcript-content-hash";
import {
  normalizeYoutubeWatchUrl,
  resolveImportTitle,
} from "@/lib/youtube-oembed";
import { getSupabaseAdmin } from "@/lib/supabase";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Transcript, Video } from "@/types/transcript";
import { DuplicateImportError } from "@/services/import-duplicate-error";
import { hasLlmApiKey } from "@/lib/llm";
import {
  cleanTranscript,
  cleanTranscriptSync,
} from "@/services/transcript-cleaner";

export const MAX_TRANSCRIPT_LENGTH = 100_000;

export type ImportTranscriptInput = {
  title: string;
  rawText: string;
  youtube_url?: string | null;
};

export type ImportTranscriptResult = {
  video: Video;
  transcript: Transcript;
};

export type ImportTranscriptOptions = {
  supabase?: SupabaseClient;
  cleanFn?: (rawText: string) => Promise<string>;
};

export function validateTranscriptLength(rawText: string): void {
  if (rawText.length > MAX_TRANSCRIPT_LENGTH) {
    throw new Error(
      `Transcript exceeds maximum length of ${MAX_TRANSCRIPT_LENGTH.toLocaleString()} characters.`
    );
  }
  if (!rawText.trim()) {
    throw new Error("Transcript text is empty.");
  }
}

export async function cleanTranscriptForImport(
  rawText: string
): Promise<string> {
  if (
    process.env.IMPORT_USE_SYNC_CLEANER === "1" ||
    !hasLlmApiKey()
  ) {
    return cleanTranscriptSync(rawText);
  }

  try {
    return await cleanTranscript(rawText);
  } catch {
    return cleanTranscriptSync(rawText);
  }
}

async function assertNotDuplicateImport(
  rawText: string,
  youtube_url: string | null,
  supabase: SupabaseClient
): Promise<void> {
  const contentHash = hashTranscriptContent(rawText);
  const existingByHash = await getTranscriptByContentHash(contentHash, supabase);

  if (existingByHash) {
    throw new DuplicateImportError({
      reason: "content_hash",
      message:
        "This transcript text was already imported. Open the existing video instead of importing again.",
      videoId: existingByHash.video_id,
      transcriptId: existingByHash.id,
    });
  }

  if (!youtube_url) {
    return;
  }

  const existingVideo = await getVideoByYoutubeUrl(youtube_url, supabase);
  if (!existingVideo) {
    return;
  }

  const latestTranscript = await getLatestTranscriptForVideo(
    existingVideo.id,
    supabase
  );

  throw new DuplicateImportError({
    reason: "youtube_url",
    message: `This YouTube video was already imported${existingVideo.title ? `: "${existingVideo.title}"` : ""}.`,
    videoId: existingVideo.id,
    transcriptId: latestTranscript?.id ?? null,
    videoTitle: existingVideo.title,
  });
}

export async function importTranscript(
  input: ImportTranscriptInput,
  options: ImportTranscriptOptions = {}
): Promise<ImportTranscriptResult> {
  const rawText = input.rawText.trim();
  validateTranscriptLength(rawText);

  const normalizedYoutubeUrl =
    normalizeYoutubeWatchUrl(input.youtube_url?.trim() ?? "") ?? null;
  const supabase = options.supabase ?? getSupabaseAdmin();
  const cleanFn = options.cleanFn ?? cleanTranscriptForImport;

  await assertNotDuplicateImport(rawText, normalizedYoutubeUrl, supabase);

  const title = await resolveImportTitle(input.title, normalizedYoutubeUrl);
  const source = normalizedYoutubeUrl ? "youtube" : "manual";
  const contentHash = hashTranscriptContent(rawText);

  const video = await createVideo(
    { title, youtube_url: normalizedYoutubeUrl, source },
    supabase
  );

  const cleaned_text = (await cleanFn(rawText)).trim();
  if (!cleaned_text) {
    throw new Error("Cleaner returned empty text.");
  }

  const transcript = await createTranscript(
    {
      video_id: video.id,
      raw_text: rawText,
      cleaned_text,
      content_hash: contentHash,
    },
    supabase
  );

  return { video, transcript };
}
