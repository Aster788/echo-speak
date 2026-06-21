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
import type { ExtractedExpression } from "@/types/expression";
import type OpenAI from "openai";

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

  return expressions
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
}

async function buildSystemPrompt(): Promise<string> {
  const template = await loadPrompt("extract-expressions");
  const topicTree = formatTopicTreeForPrompt();
  const leafSlugs = listLeafTopicSlugs().join(", ");
  return template
    .replace("{{TOPIC_TREE}}", topicTree)
    .replace("{{LEAF_SLUGS}}", leafSlugs);
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
  cleanedText: string
): Promise<ExtractedExpression[]> {
  validateExtractionInput(cleanedText);

  const systemPrompt = await buildSystemPrompt();
  const openai = getLlmClient();
  const chunks = chunkTranscriptForExtraction(cleanedText);

  const batches: ExtractedExpression[][] = [];
  for (const chunk of chunks) {
    const batch = await extractExpressionsFromChunk(chunk, systemPrompt, openai);
    if (batch.length > 0) {
      batches.push(batch);
    }
  }

  const expressions = mergeExtractedExpressions(batches);
  if (expressions.length === 0) {
    throw new Error("Expression extractor returned no valid expressions.");
  }

  return expressions;
}
