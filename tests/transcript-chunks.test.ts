import { describe, expect, it } from "vitest";
import {
  MAX_CHUNK_CHARACTERS,
  MAX_EXTRACTION_TOTAL_LENGTH,
  chunkTranscriptForExtraction,
} from "@/lib/transcript-chunks";
import { mergeExtractedExpressions } from "@/lib/merge-expressions";

describe("transcript-chunks", () => {
  it("returns single chunk for short text", () => {
    const text = "Hello world.\n\nSecond paragraph.";
    expect(chunkTranscriptForExtraction(text)).toEqual([text]);
  });

  it("splits on paragraph boundaries", () => {
    const paraA = "a".repeat(MAX_CHUNK_CHARACTERS - 10);
    const paraB = "b".repeat(100);
    const text = `${paraA}\n\n${paraB}`;

    const chunks = chunkTranscriptForExtraction(text);
    expect(chunks.length).toBe(2);
    expect(chunks[0]).toBe(paraA);
    expect(chunks[1]).toBe(paraB);
  });

  it("splits oversized paragraph by sentences", () => {
    const sentence = "Word. ".repeat(2500).trim();
    const chunks = chunkTranscriptForExtraction(sentence);
    expect(chunks.length).toBeGreaterThan(1);
    for (const chunk of chunks) {
      expect(chunk.length).toBeLessThanOrEqual(MAX_CHUNK_CHARACTERS);
    }
  });

  it("handles text up to total extraction limit as multiple chunks", () => {
    const paragraph = "Learning phrase. ".repeat(500).trim();
    const text = Array.from({ length: 8 }, () => paragraph).join("\n\n");
    expect(text.length).toBeLessThanOrEqual(MAX_EXTRACTION_TOTAL_LENGTH);

    const chunks = chunkTranscriptForExtraction(text);
    expect(chunks.length).toBeGreaterThan(1);
  });
});

describe("merge-expressions", () => {
  it("deduplicates phrases case-insensitively", () => {
    const merged = mergeExtractedExpressions([
      [
        {
          phrase: "By The Way",
          definition: "顺便",
          example: "By the way...",
          topic_slug: "daily",
        },
      ],
      [
        {
          phrase: "by the way",
          definition: "顺便说一句",
          example: "By the way, hi.",
          topic_slug: "social",
        },
      ],
    ]);

    expect(merged).toHaveLength(1);
    expect(merged[0]?.definition).toBe("顺便");
  });
});
