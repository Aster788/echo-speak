import OpenAI from "openai";

let client: OpenAI | null = null;

export function getLlmApiKey(): string | undefined {
  return process.env.LLM_API_KEY ?? process.env.OPENAI_API_KEY;
}

export function getLlmBaseUrl(): string | undefined {
  return process.env.LLM_BASE_URL ?? process.env.OPENAI_BASE_URL;
}

export function getLlmModel(): string {
  return (
    process.env.LLM_MODEL ?? process.env.OPENAI_MODEL ?? "deepseek-chat"
  );
}

export function hasLlmApiKey(): boolean {
  return Boolean(getLlmApiKey()?.trim());
}

export function getLlmClient(): OpenAI {
  if (!client) {
    const apiKey = getLlmApiKey();
    if (!apiKey) {
      throw new Error("LLM_API_KEY is not set");
    }

    const baseURL = getLlmBaseUrl();
    client = new OpenAI({
      apiKey,
      ...(baseURL ? { baseURL } : {}),
    });
  }
  return client;
}

export async function loadPrompt(name: string): Promise<string> {
  const fs = await import("fs/promises");
  const path = await import("path");
  const filePath = path.join(process.cwd(), "prompts", `${name}.md`);
  return fs.readFile(filePath, "utf-8");
}
