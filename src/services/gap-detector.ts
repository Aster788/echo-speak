import { getLlmClient, getLlmModel, loadPrompt } from "@/lib/llm";

export interface Gap {
  phrase: string;
  reason: string;
  evidence: string;
  priority: "high" | "medium" | "low";
}

export async function detectGaps(
  knownPhrases: { phrase: string; score: number }[],
  newText: string
): Promise<Gap[]> {
  const systemPrompt = await loadPrompt("gap-detection");
  const openai = getLlmClient();
  const response = await openai.chat.completions.create({
    model: getLlmModel(),
    messages: [
      { role: "system", content: systemPrompt },
      {
        role: "user",
        content: JSON.stringify({ knownPhrases, newText }),
      },
    ],
    response_format: { type: "json_object" },
    temperature: 0.3,
  });
  const content = response.choices[0]?.message?.content ?? "{}";
  const parsed = JSON.parse(content) as { gaps?: Gap[] };
  return parsed.gaps ?? [];
}
