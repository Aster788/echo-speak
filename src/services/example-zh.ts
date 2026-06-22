import { isPrimarilyChineseLine } from "@/lib/english-lines";
import { getLlmClient, getLlmModel, hasLlmApiKey } from "@/lib/llm";

export type BilingualBlock = {
  lang: "en" | "zh";
  text: string;
};

export function parseBilingualBlocks(rawText: string): BilingualBlock[] {
  const blocks: BilingualBlock[] = [];
  let current: BilingualBlock | null = null;

  for (const line of rawText.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    const lang = isPrimarilyChineseLine(trimmed) ? "zh" : "en";
    if (!current || current.lang !== lang) {
      current = { lang, text: trimmed };
      blocks.push(current);
    } else {
      current.text = `${current.text}\n${trimmed}`;
    }
  }

  return blocks;
}

function normalizeForMatch(text: string): string {
  return text.toLowerCase().replace(/\s+/g, " ").trim();
}

export function alignExampleZhFromRawText(
  rawText: string,
  exampleEn: string
): string | null {
  const example = exampleEn.trim();
  if (!example) return null;

  const blocks = parseBilingualBlocks(rawText);
  const normalizedExample = normalizeForMatch(example);

  for (let i = 0; i < blocks.length; i += 1) {
    const block = blocks[i];
    if (block.lang !== "en") continue;

    const normalizedBlock = normalizeForMatch(block.text);
    const matches =
      normalizedBlock.includes(normalizedExample) ||
      normalizedExample.includes(normalizedBlock);

    if (!matches) continue;

    for (let j = i + 1; j < blocks.length; j += 1) {
      if (blocks[j].lang === "zh") {
        return blocks[j].text.trim();
      }
      if (blocks[j].lang === "en") break;
    }
  }

  return null;
}

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

export async function resolveExampleZh(
  rawText: string | null | undefined,
  exampleEn: string
): Promise<string | null> {
  if (rawText?.trim()) {
    const aligned = alignExampleZhFromRawText(rawText, exampleEn);
    if (aligned) return aligned;
  }

  return translateExampleZh(exampleEn);
}
