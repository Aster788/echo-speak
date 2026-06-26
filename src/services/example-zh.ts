import { getLlmClient, getLlmModel, hasLlmApiKey } from "@/lib/llm";

export { isPlausibleAlignment } from "@/services/example-zh-alignment";

export async function translateExampleZh(
  exampleEn: string
): Promise<string | null> {
  if (!hasLlmApiKey()) return null;

  const client = getLlmClient();
  const response = await client.chat.completions.create({
    model: getLlmModel(),
    messages: [
      {
        role: "system",
        content:
          "Translate the English sentence into natural Simplified Chinese. Return only the translation with no quotes or explanation.",
      },
      { role: "user", content: exampleEn.trim() },
    ],
    temperature: 0.2,
  });

  const content = response.choices[0]?.message?.content?.trim();
  return content || null;
}

/** Always LLM: translate `example_en` to Simplified Chinese for Review card front. */
export async function resolveExampleZh(
  exampleEn: string
): Promise<string | null> {
  return translateExampleZh(exampleEn);
}
