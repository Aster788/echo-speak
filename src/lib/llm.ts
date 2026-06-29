import OpenAI from "openai";
import { getLlmOverrides } from "@/lib/llm-context";

let defaultClient: OpenAI | null = null;

function resolveApiKey(): string | undefined {
  const overrides = getLlmOverrides();
  if (overrides !== undefined) {
    return overrides.apiKey?.trim() || undefined;
  }
  return (
    process.env.LLM_API_KEY ||
    process.env.OPENAI_API_KEY
  );
}

function resolveBaseUrl(): string | undefined {
  const overrides = getLlmOverrides();
  if (overrides !== undefined) {
    return overrides.baseUrl?.trim() || undefined;
  }
  return (
    process.env.LLM_BASE_URL ||
    process.env.OPENAI_BASE_URL
  );
}

function resolveModel(): string {
  const overrides = getLlmOverrides();
  if (overrides !== undefined) {
    return overrides.model?.trim() || "deepseek-chat";
  }
  return (
    process.env.LLM_MODEL ||
    process.env.OPENAI_MODEL ||
    "deepseek-chat"
  );
}

export function getLlmApiKey(): string | undefined {
  return resolveApiKey();
}

export function getLlmBaseUrl(): string | undefined {
  return resolveBaseUrl();
}

export function getLlmModel(): string {
  return resolveModel();
}

export function hasLlmApiKey(): boolean {
  return Boolean(getLlmApiKey()?.trim());
}

export function getLlmClient(): OpenAI {
  const overrides = getLlmOverrides();
  if (!overrides) {
    if (!defaultClient) {
      const apiKey = getLlmApiKey();
      if (!apiKey) {
        throw new Error("LLM_API_KEY is not set");
      }
      const baseURL = getLlmBaseUrl();
      defaultClient = new OpenAI({
        apiKey,
        ...(baseURL ? { baseURL } : {}),
      });
    }
    return defaultClient;
  }

  const apiKey = getLlmApiKey();
  if (!apiKey) {
    throw new Error("LLM_API_KEY is not set");
  }
  const baseURL = getLlmBaseUrl();
  return new OpenAI({
    apiKey,
    ...(baseURL ? { baseURL } : {}),
  });
}

export async function loadPrompt(name: string): Promise<string> {
  const fs = await import("fs/promises");
  const path = await import("path");
  const filePath = path.join(process.cwd(), "prompts", `${name}.md`);
  return fs.readFile(filePath, "utf-8");
}
