import { getLlmClient, getLlmModel, loadPrompt } from "@/lib/llm";
import { filterLowQualityExpressions } from "@/lib/filter-expressions";
import { parseExtractResponse } from "@/services/expression-extractor";
import type { ExtractedExpression } from "@/types/expression";
import type { ExtractionPreferenceContext } from "@/types/extraction-preference";
import { formatExtractionPreferenceContext } from "@/services/extraction-preference-context";
import type OpenAI from "openai";

async function buildSelectPrompt(
  targetCount: number,
  preferenceContext?: ExtractionPreferenceContext,
  preferredTopicSlugs?: ReadonlySet<string>
): Promise<string> {
  const template = await loadPrompt("select-expressions");
  const preferenceText = preferenceContext
    ? formatExtractionPreferenceContext(
        preferenceContext,
        preferredTopicSlugs
      )
    : "";
  return template
    .replaceAll("{{TARGET_COUNT}}", String(targetCount))
    .replace("{{PREFERENCE_CONTEXT}}", preferenceText);
}

function buildSelectUserMessage(
  transcriptContext: string,
  candidates: ExtractedExpression[],
  targetCount: number
): string {
  return JSON.stringify(
    {
      transcript_excerpt: transcriptContext.slice(0, 4_000),
      target_count: targetCount,
      candidates,
    },
    null,
    2
  );
}

export async function rankExtractedExpressions(
  candidates: ExtractedExpression[],
  targetCount: number,
  transcriptContext: string,
  openai?: OpenAI,
  preferenceContext?: ExtractionPreferenceContext
): Promise<ExtractedExpression[]> {
  if (candidates.length <= targetCount) {
    return candidates;
  }

  const client = openai ?? getLlmClient();
  const preferredTopicSlugs = new Set(
    candidates.map((candidate) => candidate.topic_slug).filter(Boolean)
  );
  const systemPrompt = await buildSelectPrompt(
    targetCount,
    preferenceContext,
    preferredTopicSlugs
  );
  const response = await client.chat.completions.create({
    model: getLlmModel(),
    messages: [
      { role: "system", content: systemPrompt },
      {
        role: "user",
        content: buildSelectUserMessage(
          transcriptContext,
          candidates,
          targetCount
        ),
      },
    ],
    response_format: { type: "json_object" },
    temperature: 0.2,
  });

  const content = response.choices[0]?.message?.content ?? "{}";
  const candidateKeys = new Set(
    candidates.map((item) => item.phrase.toLowerCase())
  );

  const ranked = parseExtractResponse(content).filter((item) =>
    candidateKeys.has(item.phrase.toLowerCase())
  );

  if (ranked.length === 0) {
    return candidates.slice(0, targetCount);
  }

  return filterLowQualityExpressions(ranked).slice(0, targetCount);
}
