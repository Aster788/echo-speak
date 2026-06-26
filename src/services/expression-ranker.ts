import { getLlmClient, getLlmModel, loadPrompt } from "@/lib/llm";
import { filterLowQualityExpressions } from "@/lib/filter-expressions";
import { parseExtractResponse } from "@/services/expression-extractor";
import type { ExtractedExpression } from "@/types/expression";
import type OpenAI from "openai";

async function buildSelectPrompt(targetCount: number): Promise<string> {
  const template = await loadPrompt("select-expressions");
  return template.replaceAll("{{TARGET_COUNT}}", String(targetCount));
}

function buildSelectUserMessage(
  transcriptContext: string,
  candidates: ExtractedExpression[]
): string {
  return JSON.stringify(
    {
      transcript_excerpt: transcriptContext.slice(0, 4_000),
      target_count: candidates.length,
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
  openai?: OpenAI
): Promise<ExtractedExpression[]> {
  if (candidates.length <= targetCount) {
    return candidates;
  }

  const client = openai ?? getLlmClient();
  const systemPrompt = await buildSelectPrompt(targetCount);
  const response = await client.chat.completions.create({
    model: getLlmModel(),
    messages: [
      { role: "system", content: systemPrompt },
      {
        role: "user",
        content: buildSelectUserMessage(transcriptContext, candidates),
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
