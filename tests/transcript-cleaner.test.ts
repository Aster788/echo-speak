import { describe, expect, it, vi, afterEach } from "vitest";
import { cleanTranscriptSync } from "@/services/transcript-cleaner";
import { cleanTranscriptForImport } from "@/services/transcript-importer";

describe("transcript-cleaner", () => {
  it("removes timestamps", () => {
    const raw = "[00:12] Hello world";
    expect(cleanTranscriptSync(raw)).toBe("Hello world");
  });

  it("removes speaker labels", () => {
    const raw = "Speaker 1: Hello there";
    expect(cleanTranscriptSync(raw)).toBe("Hello there");
  });

  it("removes Chinese translation lines", () => {
    const raw = `Hello world
你好世界`;
    expect(cleanTranscriptSync(raw)).toBe("Hello world");
  });
});

describe("cleanTranscriptForImport", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    delete process.env.IMPORT_USE_LLM_CLEANER;
    delete process.env.LLM_API_KEY;
  });

  it("uses sync cleaner by default", async () => {
    process.env.LLM_API_KEY = "test-key";
    const raw = "Hello world\n你好世界";
    await expect(cleanTranscriptForImport(raw)).resolves.toBe("Hello world");
  });

  it("uses LLM cleaner when IMPORT_USE_LLM_CLEANER=1", async () => {
    process.env.LLM_API_KEY = "test-key";
    process.env.IMPORT_USE_LLM_CLEANER = "1";

    const cleaner = await import("@/services/transcript-cleaner");
    vi.spyOn(cleaner, "cleanTranscript").mockResolvedValue("LLM cleaned");

    await expect(cleanTranscriptForImport("raw")).resolves.toBe("LLM cleaned");
  });
});
