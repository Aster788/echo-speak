import { getLlmClient, getLlmModel, loadPrompt } from "@/lib/llm";
import { keepEnglishLinesOnly } from "@/lib/english-lines";

export async function cleanTranscript(rawText: string): Promise<string> {
  const systemPrompt = await loadPrompt("transcript-cleaner");
  const openai = getLlmClient();
  const response = await openai.chat.completions.create({
    model: getLlmModel(),
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: rawText },
    ],
    temperature: 0.2,
  });
  return keepEnglishLinesOnly(
    response.choices[0]?.message?.content?.trim() ?? ""
  );
}

/** Local fallback for tests without API */
export function cleanTranscriptSync(rawText: string): string {
  return keepEnglishLinesOnly(
    rawText
      .replace(/\[\d{1,2}:\d{2}(:\d{2})?\]/g, "")
      .replace(/^(Speaker \d+|Host):\s*/gim, "")
      .replace(/\n{3,}/g, "\n\n")
      .trim()
  );
}
