import { describe, expect, it } from "vitest";
import {
  MAX_EXTRACTION_LENGTH,
  parseExtractResponse,
  validateExtractionInput,
} from "@/services/expression-extractor";

describe("expression-extractor", () => {
  it("rejects empty cleaned text", () => {
    expect(() => validateExtractionInput("   ")).toThrow(/empty/i);
  });

  it("rejects text over max extraction length", () => {
    expect(() =>
      validateExtractionInput("a".repeat(MAX_EXTRACTION_LENGTH + 1))
    ).toThrow(/maximum extraction length/i);
  });

  it("allows text within total limit for chunked extraction", () => {
    expect(() =>
      validateExtractionInput("a".repeat(60_000))
    ).not.toThrow();
  });

  it("parses expressions array from json object", () => {
    const parsed = parseExtractResponse(
      JSON.stringify({
        expressions: [
          {
            phrase: "by the way",
            definition: "顺便说一句",
            example: "By the way, I loved that cafe.",
            topic_slug: "Drinks",
          },
        ],
      })
    );

    expect(parsed).toEqual([
      {
        phrase: "by the way",
        definition: "顺便说一句",
        example: "By the way, I loved that cafe.",
        topic_slug: "drinks",
      },
    ]);
  });

  it("filters invalid expression rows and trivial phrases", () => {
    const parsed = parseExtractResponse(
      JSON.stringify({
        expressions: [
          { phrase: "", definition: "x", example: "y", topic_slug: "food" },
          {
            phrase: "track",
            definition: "跟踪",
            example: "Keep track of it.",
            topic_slug: "uncategorized",
          },
          {
            phrase: "meal prep",
            definition: "备餐",
            example: "I do meal prep on Sundays.",
            topic_slug: "cooking",
          },
        ],
      })
    );

    expect(parsed).toHaveLength(1);
    expect(parsed[0]?.topic_slug).toBe("cooking");
  });

  it("throws on invalid json", () => {
    expect(() => parseExtractResponse("not-json")).toThrow(/invalid json/i);
  });
});
