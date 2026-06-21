import {
  createExpressions,
  deleteUnlockedExpressionsByVideoAndSource,
} from "@/db/expressions";
import { listDismissedPhraseKeysForVideo } from "@/db/expression-dismissals";
import { getTranscript } from "@/db/transcripts";
import { buildTopicIndex, listTopics } from "@/db/topics";
import { filterDismissedExpressions } from "@/lib/merge-expressions";
import { resolveTopicSlug } from "@/lib/topic-resolve";
import { getSupabaseAdmin } from "@/lib/supabase";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Expression } from "@/types/expression";
import type { ExtractedExpression } from "@/types/expression";
import { extractExpressions } from "@/services/expression-extractor";

export type ExtractExpressionsResult = {
  videoId: string;
  transcriptId: string;
  expressionCount: number;
  expressions: Expression[];
};

export type ExtractExpressionsOptions = {
  supabase?: SupabaseClient;
  extractFn?: (cleanedText: string) => Promise<ExtractedExpression[]>;
};

export async function extractExpressionsForTranscript(
  transcriptId: string,
  options: ExtractExpressionsOptions = {}
): Promise<ExtractExpressionsResult> {
  const supabase = options.supabase ?? getSupabaseAdmin();
  const extractFn = options.extractFn ?? extractExpressions;

  const transcript = await getTranscript(transcriptId, supabase);
  if (!transcript) {
    throw new Error(`Transcript not found: ${transcriptId}`);
  }

  const cleanedText = transcript.cleaned_text?.trim();
  if (!cleanedText) {
    throw new Error("Transcript has no cleaned text to extract from.");
  }

  const topics = await listTopics(supabase);
  const topicIndex = buildTopicIndex(topics);
  const dismissedKeys = await listDismissedPhraseKeysForVideo(
    transcript.video_id,
    supabase
  );

  const extracted = filterDismissedExpressions(
    await extractFn(cleanedText),
    dismissedKeys
  );

  await deleteUnlockedExpressionsByVideoAndSource(
    transcript.video_id,
    "transcript",
    supabase
  );

  const expressions = await createExpressions(
    extracted.map((item) => ({
      video_id: transcript.video_id,
      phrase: item.phrase,
      meaning: item.definition,
      example: item.example,
      topic_id: resolveTopicSlug(item.topic_slug, topicIndex),
      source_type: "transcript",
      weight: 1.0,
    })),
    supabase
  );

  return {
    videoId: transcript.video_id,
    transcriptId: transcript.id,
    expressionCount: expressions.length,
    expressions,
  };
}
