import { afterEach, describe, expect, it } from "vitest";
import {
  getLlmApiKey,
  getLlmBaseUrl,
  getLlmModel,
  hasLlmApiKey,
} from "@/lib/llm";

const originalEnv = { ...process.env };

afterEach(() => {
  process.env = { ...originalEnv };
});

describe("llm config", () => {
  it("reads LLM_* env vars", () => {
    process.env.LLM_API_KEY = "test-key";
    process.env.LLM_BASE_URL = "https://api.deepseek.com";
    process.env.LLM_MODEL = "deepseek-chat";

    expect(getLlmApiKey()).toBe("test-key");
    expect(getLlmBaseUrl()).toBe("https://api.deepseek.com");
    expect(getLlmModel()).toBe("deepseek-chat");
    expect(hasLlmApiKey()).toBe(true);
  });

  it("falls back to legacy OPENAI_* env vars", () => {
    delete process.env.LLM_API_KEY;
    delete process.env.LLM_BASE_URL;
    delete process.env.LLM_MODEL;
    process.env.OPENAI_API_KEY = "legacy-key";
    process.env.OPENAI_BASE_URL = "https://legacy.example";
    process.env.OPENAI_MODEL = "legacy-model";

    expect(getLlmApiKey()).toBe("legacy-key");
    expect(getLlmBaseUrl()).toBe("https://legacy.example");
    expect(getLlmModel()).toBe("legacy-model");
  });

  it("defaults model to deepseek-chat", () => {
    delete process.env.LLM_MODEL;
    delete process.env.OPENAI_MODEL;
    expect(getLlmModel()).toBe("deepseek-chat");
  });
});
