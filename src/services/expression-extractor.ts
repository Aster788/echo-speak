import {
  getChunkExtractCap,
  getVideoExpressionTarget,
  resolveExtractionDepth,
  type ExtractionDepth,
} from "@/lib/extraction-depth";
import { formatDismissalHintsForPrompt } from "@/lib/dismissal-hints";
import { filterLowQualityExpressions } from "@/lib/filter-expressions";
import { getLlmClient, getLlmModel, loadPrompt } from "@/lib/llm";
import { mergeExtractedExpressions } from "@/lib/merge-expressions";
import {
  formatTopicTreeForPrompt,
  listLeafTopicSlugs,
} from "@/lib/topic-seeds";
import {
  chunkTranscriptForExtraction,
  MAX_EXTRACTION_TOTAL_LENGTH,
} from "@/lib/transcript-chunks";
import { rankExtractedExpressions } from "@/services/expression-ranker";
import type { ExtractedExpression } from "@/types/expression";
import type { Topic } from "@/types/topic";
import type OpenAI from "openai";

export type ExtractExpressionsOptions = {
  depth?: ExtractionDepth;
  /** Set false to skip second LLM rank pass (direction D). */
  rankPass?: boolean;
  /** Live topics from the DB; when provided the prompt reflects user curation. */
  topics?: Topic[];
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

async function buildSystemPrompt(
  maxExpressions: number,
  topics?: Topic[]
): Promise<string> {
  const template = await loadPrompt("extract-expressions");
  const topicTree = formatTopicTreeForPrompt(topics);
  const leafSlugs = listLeafTopicSlugs(topics).join(", ");
  const dismissalHints = await formatDismissalHintsForPrompt().catch(
    () => ""
  );
  const dismissalSection = dismissalHints
    ? `\n${dismissalHints}\n`
    : "";

  return template
    .replace("{{TOPIC_TREE}}", topicTree)
    .replace("{{LEAF_SLUGS}}", leafSlugs)
    .replace("{{MAX_EXPRESSIONS}}", String(maxExpressions))
    .replace("{{DISMISSAL_HINTS}}", dismissalSection);
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
  const openai = getLlmClient();
  const chunks = chunkTranscriptForExtraction(cleanedText);

  const batches: ExtractedExpression[][] = [];
  for (const chunk of chunks) {
    const extractCap = getChunkExtractCap(chunk.length, depth);
    const systemPrompt = await buildSystemPrompt(extractCap, options.topics);
    const batch = await extractExpressionsFromChunk(chunk, systemPrompt, openai);
    if (batch.length > 0) {
      batches.push(batch);
    }
  }

  let expressions = mergeExtractedExpressions(batches);
  const targetCount = getVideoExpressionTarget(cleanedText, depth);

  if (rankPass && expressions.length > targetCount) {
    expressions = await rankExtractedExpressions(
      expressions,
      targetCount,
      cleanedText,
      openai
    );
  }

  if (expressions.length === 0) {
    throw new Error("Expression extractor returned no valid expressions.");
  }

  return expressions;
}
