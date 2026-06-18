import { getOpenAIClient, loadPrompt } from "@/lib/openai";

export async function cleanTranscript(rawText: string): Promise<string> {
  const systemPrompt = await loadPrompt("transcript-cleaner");
  const openai = getOpenAIClient();
  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: rawText },
    ],
    temperature: 0.2,
  });
  return response.choices[0]?.message?.content?.trim() ?? "";
}

/** Local fallback for tests without API */
export function cleanTranscriptSync(rawText: string): string {
  return rawText
    .replace(/\[\d{1,2}:\d{2}(:\d{2})?\]/g, "")
    .replace(/^(Speaker \d+|Host):\s*/gim, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}
