import { afterEach, describe, expect, it } from "vitest";
import { getLlmApiKey, getLlmModel } from "@/lib/llm";
import { runWithLlmOverrides } from "@/lib/llm-context";

const originalEnv = { ...process.env };

afterEach(() => {
  process.env = { ...originalEnv };
});

describe("llm overrides context", () => {
  it("uses request overrides over env", () => {
    process.env.LLM_API_KEY = "env-key";
    process.env.LLM_MODEL = "env-model";

    runWithLlmOverrides(
      { apiKey: "user-key", model: "user-model" },
      () => {
        expect(getLlmApiKey()).toBe("user-key");
        expect(getLlmModel()).toBe("user-model");
      }
    );

    expect(getLlmApiKey()).toBe("env-key");
    expect(getLlmModel()).toBe("env-model");
  });

  it("does not fall back to env when overrides context is set but empty", () => {
    process.env.LLM_API_KEY = "env-key";
    process.env.LLM_MODEL = "env-model";

    runWithLlmOverrides({}, () => {
      expect(getLlmApiKey()).toBeUndefined();
      expect(getLlmModel()).toBe("deepseek-chat");
    });
  });
});
