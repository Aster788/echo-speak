import { describe, expect, it, vi, beforeEach } from "vitest";

const llmMocks = vi.hoisted(() => ({
  hasLlmApiKey: vi.fn(() => true),
  createMock: vi.fn(),
}));

vi.mock("@/lib/llm", () => ({
  hasLlmApiKey: () => llmMocks.hasLlmApiKey(),
  getLlmModel: () => "deepseek-chat",
  getLlmClient: () => ({
    chat: {
      completions: {
        create: llmMocks.createMock,
      },
    },
  }),
}));

import { resolveExampleZh, translateExampleZh } from "@/services/example-zh";

describe("resolveExampleZh", () => {
  beforeEach(() => {
    llmMocks.hasLlmApiKey.mockReturnValue(true);
    llmMocks.createMock.mockReset();
  });

  it("always calls LLM translation", async () => {
    llmMocks.createMock.mockResolvedValue({
      choices: [{ message: { content: "你好世界。" } }],
    });

    await expect(resolveExampleZh("Hello world.")).resolves.toBe("你好世界。");
    expect(llmMocks.createMock).toHaveBeenCalledOnce();
  });

  it("returns null when translation fails", async () => {
    llmMocks.createMock.mockResolvedValue({
      choices: [{ message: { content: "" } }],
    });

    await expect(resolveExampleZh("Hello world.")).resolves.toBeNull();
  });
});

describe("translateExampleZh", () => {
  beforeEach(() => {
    llmMocks.createMock.mockReset();
  });

  it("returns null when LLM API key is missing", async () => {
    llmMocks.hasLlmApiKey.mockReturnValue(false);

    await expect(translateExampleZh("Hello world.")).resolves.toBeNull();
  });

  it("returns trimmed translation content", async () => {
    llmMocks.hasLlmApiKey.mockReturnValue(true);
    llmMocks.createMock.mockResolvedValue({
      choices: [{ message: { content: "  你好。 " } }],
    });

    await expect(translateExampleZh("Hi.")).resolves.toBe("你好。");
  });
});
