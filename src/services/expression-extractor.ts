import {
  getChunkExtractCap,
  getVideoExpressionTarget,
  resolveExtractionDepth,
  type ExtractionDepth,
} from "@/lib/extraction-depth";
import { filterLowQualityExpressions } from "@/lib/filter-expressions";
import { getLlmClient, getLlmModel, loadPrompt } from "@/lib/llm";
import {
  filterDismissedExpressions,
  mergeExtractedExpressions,
} from "@/lib/merge-expressions";
import {
  formatTopicTreeForPrompt,
  listLeafTopicSlugs,
} from "@/lib/topic-seeds";
import {
  chunkTranscriptForExtraction,
  MAX_EXTRACTION_TOTAL_LENGTH,
} from "@/lib/transcript-chunks";
import { rankExtractedExpressions } from "@/services/expression-ranker";
import {
  formatExtractionPreferenceContext,
  selectPreferenceExamples,
} from "@/services/extraction-preference-context";
import type { ExtractedExpression } from "@/types/expression";
import type { ExtractionPreferenceContext } from "@/types/extraction-preference";
import type { Topic } from "@/types/topic";
import type OpenAI from "openai";

export type ExtractionFeedbackDiagnostics = {
  totalAccepted: number;
  totalDismissed: number;
  positiveSampleCount: number;
  negativeSampleCount: number;
  rawCandidateCount: number;
  hardBlockedCount: number;
  selectedCount: number;
};

export type ExtractExpressionsOptions = {
  depth?: ExtractionDepth;
  /** Set false to skip second LLM rank pass (direction D). */
  rankPass?: boolean;
  /** Live topics from the DB; when provided the prompt reflects user curation. */
  topics?: Topic[];
  preferenceContext?: ExtractionPreferenceContext;
  dismissedKeys?: Set<string>;
  onDiagnostics?: (diagnostics: ExtractionFeedbackDiagnostics) => void;
  openai?: OpenAI;
};

export { MAX_EXTRACTION_TOTAL_LENGTH as MAX_EXTRACTION_LENGTH };

export function validateExtractionInput(cleanedText: string): void {
  if (!cleanedText.trim()) {
    throw new Error("Cleaned transcript text is empty.");
  }
  if (cleanedText.length > MAX_EXTRACTION_TOTAL_LENGTH) {
    throw new Error(
      `Transcript exceeds maximum extraction length of ${MAX_EXTRACTION_TOTAL_LENGTH.toLocaleString()} characters.`
    );
  }
}

export function parseExtractResponse(content: string): ExtractedExpression[] {
  let parsed: unknown;
  try {
    parsed = JSON.parse(content);
  } catch {
    throw new Error("Expression extractor returned invalid JSON.");
  }

  const payload = parsed as {
    expressions?: ExtractedExpression[];
  };

  const expressions = Array.isArray(payload.expressions)
    ? payload.expressions
    : Array.isArray(parsed)
      ? (parsed as ExtractedExpression[])
      : [];

  const normalized = expressions
    .filter(
      (item) =>
        item?.phrase?.trim() &&
        item?.definition?.trim() &&
        item?.example?.trim() &&
        item?.topic_slug?.trim()
    )
    .map((item) => ({
      phrase: item.phrase.trim(),
      definition: item.definition.trim(),
      example: item.example.trim(),
      topic_slug: item.topic_slug.trim().toLowerCase(),
    }));

  return filterLowQualityExpressions(normalized);
}

export async function buildSystemPrompt(
  maxExpressions: number,
  topics?: Topic[],
  preferenceContext?: ExtractionPreferenceContext
): Promise<string> {
  const template = await loadPrompt("extract-expressions");
  const topicTree = formatTopicTreeForPrompt(topics);
  const leafSlugs = listLeafTopicSlugs(topics).join(", ");
  const preferenceText = preferenceContext
    ? formatExtractionPreferenceContext(preferenceContext)
    : "";

  return template
    .replace("{{TOPIC_TREE}}", topicTree)
    .replace("{{LEAF_SLUGS}}", leafSlugs)
    .replace("{{MAX_EXPRESSIONS}}", String(maxExpressions))
    .replace("{{PREFERENCE_CONTEXT}}", preferenceText)
    .replace("{{DISMISSAL_HINTS}}", "");
}

export function filterCandidatesBeforeRanking(
  expressions: ExtractedExpression[],
  dismissedKeys: Set<string>
): { expressions: ExtractedExpression[]; hardBlockedCount: number } {
  const filtered = filterDismissedExpressions(expressions, dismissedKeys);
  return {
    expressions: filtered,
    hardBlockedCount: expressions.length - filtered.length,
  };
}

async function extractExpressionsFromChunk(
  chunk: string,
  systemPrompt: string,
  openai: OpenAI
): Promise<ExtractedExpression[]> {
  const response = await openai.chat.completions.create({
    model: getLlmModel(),
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: chunk },
    ],
    response_format: { type: "json_object" },
    temperature: 0.3,
  });

  const content = response.choices[0]?.message?.content ?? "{}";
  return parseExtractResponse(content);
}

export async function extractExpressions(
  cleanedText: string,
  options: ExtractExpressionsOptions = {}
): Promise<ExtractedExpression[]> {
  validateExtractionInput(cleanedText);

  const depth = resolveExtractionDepth(options.depth);
  const rankPass =
    options.rankPass ??
    process.env.EXTRACTION_RANK_PASS?.toLowerCase() !== "0";
  const openai = options.openai ?? getLlmClient();
  const chunks = chunkTranscriptForExtraction(cleanedText);

  const batches: ExtractedExpression[][] = [];
  for (const chunk of chunks) {
    const extractCap = getChunkExtractCap(chunk.length, depth);
    const systemPrompt = await buildSystemPrompt(
      extractCap,
      options.topics,
      options.preferenceContext
    );
    const batch = await extractExpressionsFromChunk(chunk, systemPrompt, openai);
    if (batch.length > 0) {
      batches.push(batch);
    }
  }

  let expressions = mergeExtractedExpressions(batches);
  const rawCandidateCount = expressions.length;
  const earlyFilter = filterCandidatesBeforeRanking(
    expressions,
    options.dismissedKeys ?? new Set()
  );
  expressions = earlyFilter.expressions;
  const targetCount = getVideoExpressionTarget(cleanedText, depth);

  if (rankPass && expressions.length > targetCount) {
    expressions = await rankExtractedExpressions(
      expressions,
      targetCount,
      cleanedText,
      openai,
      options.preferenceContext
    );
  }

  const preferenceSamples = options.preferenceContext
    ? selectPreferenceExamples(options.preferenceContext)
    : { accepted: [], dismissed: [] };
  options.onDiagnostics?.({
    totalAccepted: options.preferenceContext?.totalAccepted ?? 0,
    totalDismissed: options.preferenceContext?.totalDismissed ?? 0,
    positiveSampleCount: preferenceSamples.accepted.length,
    negativeSampleCount: preferenceSamples.dismissed.length,
    rawCandidateCount,
    hardBlockedCount: earlyFilter.hardBlockedCount,
    selectedCount: expressions.length,
  });

  if (expressions.length === 0) {
    throw new Error("Expression extractor returned no valid expressions.");
  }

  return expressions;
}
