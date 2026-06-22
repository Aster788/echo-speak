import {
  createExpressions,
  deleteUnlockedExpressionsByVideoAndSource,
  listExpressionsMissingExampleZh,
  updateExpressionExampleZh,
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
import { resolveExampleZh } from "@/services/example-zh";

export type ExtractExpressionsResult = {
  videoId: string;
  transcriptId: string;
  expressionCount: number;
  expressions: Expression[];
};

export type ExtractExpressionsOptions = {
  supabase?: SupabaseClient;
  extractFn?: (cleanedText: string) => Promise<ExtractedExpression[]>;
  resolveExampleZhFn?: typeof resolveExampleZh;
};

export async function extractExpressionsForTranscript(
  transcriptId: string,
  options: ExtractExpressionsOptions = {}
): Promise<ExtractExpressionsResult> {
  const supabase = options.supabase ?? getSupabaseAdmin();
  const extractFn = options.extractFn ?? extractExpressions;
  const resolveExampleZhFn = options.resolveExampleZhFn ?? resolveExampleZh;

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

  const rows = await Promise.all(
    extracted.map(async (item) => ({
      video_id: transcript.video_id,
      phrase: item.phrase,
      meaning: item.definition,
      example_en: item.example,
      example_zh: await resolveExampleZhFn(transcript.raw_text, item.example),
      topic_id: resolveTopicSlug(item.topic_slug, topicIndex),
      source_type: "transcript" as const,
      weight: 1.0,
    }))
  );

  const expressions = await createExpressions(rows, supabase);

  return {
    videoId: transcript.video_id,
    transcriptId: transcript.id,
    expressionCount: expressions.length,
    expressions,
  };
}

export async function backfillExampleZhForExpression(
  expression: Expression,
  rawText: string | null,
  resolveExampleZhFn: typeof resolveExampleZh = resolveExampleZh
): Promise<string | null> {
  if (expression.example_zh?.trim()) {
    return expression.example_zh;
  }

  const exampleZh = await resolveExampleZhFn(rawText, expression.example_en);
  if (exampleZh) {
    await updateExpressionExampleZh(expression.id, exampleZh);
  }
  return exampleZh;
}

export async function backfillMissingExampleZh(
  client?: SupabaseClient
): Promise<{ updated: number; skipped: number }> {
  const supabase = client ?? getSupabaseAdmin();
  const expressions = await listExpressionsMissingExampleZh(supabase);
  const rawTextByVideo = new Map<string, string | null>();

  let updated = 0;
  let skipped = 0;

  for (const expression of expressions) {
    if (!rawTextByVideo.has(expression.video_id)) {
      const { data } = await supabase
        .from("transcripts")
        .select("raw_text")
        .eq("video_id", expression.video_id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      rawTextByVideo.set(expression.video_id, data?.raw_text ?? null);
    }

    const exampleZh = await resolveExampleZh(
      rawTextByVideo.get(expression.video_id),
      expression.example_en
    );

    if (exampleZh) {
      await updateExpressionExampleZh(expression.id, exampleZh, supabase);
      updated += 1;
    } else {
      skipped += 1;
    }
  }

  return { updated, skipped };
}
