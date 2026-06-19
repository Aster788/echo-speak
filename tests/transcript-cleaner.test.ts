import { describe, expect, it } from "vitest";
import { cleanTranscriptSync } from "@/services/transcript-cleaner";

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
