import { createTranscript } from "@/db/transcripts";
import { createVideo } from "@/db/videos";
import { resolveImportTitle } from "@/lib/youtube-oembed";
import { getSupabaseAdmin } from "@/lib/supabase";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Transcript, Video } from "@/types/transcript";
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
    !process.env.OPENAI_API_KEY
  ) {
    return cleanTranscriptSync(rawText);
  }

  try {
    return await cleanTranscript(rawText);
  } catch {
    return cleanTranscriptSync(rawText);
  }
}

export async function importTranscript(
  input: ImportTranscriptInput,
  options: ImportTranscriptOptions = {}
): Promise<ImportTranscriptResult> {
  const rawText = input.rawText.trim();
  validateTranscriptLength(rawText);

  const youtube_url = input.youtube_url?.trim() || null;
  const title = await resolveImportTitle(input.title, youtube_url);
  const source = youtube_url ? "youtube" : "manual";
  const supabase = options.supabase ?? getSupabaseAdmin();
  const cleanFn = options.cleanFn ?? cleanTranscriptForImport;

  const video = await createVideo(
    { title, youtube_url, source },
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
    },
    supabase
  );

  return { video, transcript };
}
