import {
  createExpressions,
  deleteUnlockedExpressionsByVideoAndSource,
  listExpressions,
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
import {
  extractExpressions,
  type ExtractExpressionsOptions as ExtractorOptions,
} from "@/services/expression-extractor";
import { resolveExampleZh } from "@/services/example-zh";
import type { ExtractionDepth } from "@/lib/extraction-depth";

export type ExtractExpressionsResult = {
  videoId: string;
  transcriptId: string;
  expressionCount: number;
  expressions: Expression[];
};

export type ExtractExpressionsPipelineOptions = {
  supabase?: SupabaseClient;
  extractFn?: (
    cleanedText: string,
    options?: ExtractorOptions
  ) => Promise<ExtractedExpression[]>;
  resolveExampleZhFn?: typeof resolveExampleZh;
  depth?: ExtractionDepth;
};

export async function extractExpressionsForTranscript(
  transcriptId: string,
  options: ExtractExpressionsPipelineOptions = {}
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
    await extractFn(cleanedText, { depth: options.depth }),
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
      example_zh: await resolveExampleZhFn(item.example),
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
  resolveExampleZhFn: typeof resolveExampleZh = resolveExampleZh
): Promise<string | null> {
  if (expression.example_zh?.trim()) {
    return expression.example_zh;
  }

  const exampleZh = await resolveExampleZhFn(expression.example_en);
  if (exampleZh) {
    await updateExpressionExampleZh(expression.id, exampleZh);
  }
  return exampleZh;
}

export type BackfillExampleZhOptions = {
  client?: SupabaseClient;
  force?: boolean;
  resolveExampleZhFn?: typeof resolveExampleZh;
};

export async function backfillMissingExampleZh(
  options: BackfillExampleZhOptions = {}
): Promise<{ updated: number; skipped: number; unchanged: number }> {
  const supabase = options.client ?? getSupabaseAdmin();
  const resolveExampleZhFn = options.resolveExampleZhFn ?? resolveExampleZh;
  const expressions = options.force
    ? await listExpressions(supabase)
    : await listExpressionsMissingExampleZh(supabase);

  let updated = 0;
  let skipped = 0;
  let unchanged = 0;

  for (const expression of expressions) {
    if (!options.force && expression.example_zh?.trim()) {
      unchanged += 1;
      continue;
    }

    const exampleZh = await resolveExampleZhFn(expression.example_en);

    if (!exampleZh) {
      skipped += 1;
      continue;
    }

    if (exampleZh === expression.example_zh) {
      unchanged += 1;
      continue;
    }

    await updateExpressionExampleZh(expression.id, exampleZh, supabase);
    updated += 1;
  }

  return { updated, skipped, unchanged };
}
