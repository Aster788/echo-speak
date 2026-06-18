import { getOpenAIClient, loadPrompt } from "@/lib/openai";
import type { ExtractedExpression } from "@/types/expression";

export async function extractExpressions(
  cleanedText: string
): Promise<ExtractedExpression[]> {
  const systemPrompt = await loadPrompt("extract-expressions");
  const openai = getOpenAIClient();
  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: cleanedText },
    ],
    response_format: { type: "json_object" },
    temperature: 0.3,
  });
  const content = response.choices[0]?.message?.content ?? "{}";
  const parsed = JSON.parse(content) as { expressions?: ExtractedExpression[] };
  return parsed.expressions ?? (Array.isArray(parsed) ? parsed : []);
}
