import { getOpenAIClient, loadPrompt } from "@/lib/openai";
import type { ReviewCard } from "@/types/review";

export async function generateReviewCard(expression: {
  phrase: string;
  definition: string;
  example: string;
}): Promise<ReviewCard> {
  const systemPrompt = await loadPrompt("review-generator");
  const openai = getOpenAIClient();
  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: JSON.stringify(expression) },
    ],
    response_format: { type: "json_object" },
    temperature: 0.5,
  });
  const content = response.choices[0]?.message?.content ?? "{}";
  const raw = JSON.parse(content) as Record<string, string>;
  return {
    prompt: raw.prompt,
    answer: raw.answer,
    hint: raw.hint,
    cardType: (raw.card_type ?? raw.cardType ?? "phrase_to_meaning") as ReviewCard["cardType"],
  };
}
