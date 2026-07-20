import { describe, expect, it, vi } from "vitest";
import {
  buildSystemPrompt,
  extractExpressions,
  filterCandidatesBeforeRanking,
  MAX_EXTRACTION_LENGTH,
  parseExtractResponse,
  validateExtractionInput,
} from "@/services/expression-extractor";
import { buildExtractionPreferenceContextFromHistory } from "@/services/extraction-preference-context";

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

  it("injects positive and negative preferences into extraction prompt", async () => {
    const context = buildExtractionPreferenceContextFromHistory({
      accepted: [
        {
          phrase: "keep track of",
          meaning: "记录",
          topicId: "work-id",
          topicSlug: "work",
          weight: 2,
          feedbackAt: "2026-07-01T00:00:00Z",
        },
      ],
      dismissed: [
        {
          phrase: "feel stuck",
          phraseKey: "feel stuck",
          reason: "gap_ignore",
          topicId: null,
          topicSlug: null,
          dismissedAt: "2026-07-02T00:00:00Z",
        },
      ],
    });

    const prompt = await buildSystemPrompt(8, undefined, context);

    expect(prompt).toContain('"keep track of"');
    expect(prompt).toContain('"feel stuck"');
    expect(prompt).not.toContain("{{PREFERENCE_CONTEXT}}");
    expect(prompt).not.toContain("{{DISMISSAL_HINTS}}");
  });

  it("removes canonical hard blocks before ranking and counts them", () => {
    const result = filterCandidatesBeforeRanking(
      [
        {
          phrase: "let go of something",
          definition: "放下",
          example: "Let go of something old.",
          topic_slug: "daily",
        },
        {
          phrase: "keep track of",
          definition: "记录",
          example: "Keep track of it.",
          topic_slug: "work",
        },
      ],
      new Set(["let go of"])
    );

    expect(result.expressions.map((item) => item.phrase)).toEqual([
      "keep track of",
    ]);
    expect(result.hardBlockedCount).toBe(1);
  });

  it("applies hard blocks before deciding whether the rank pass is needed", async () => {
    const expressions = [
      "feel stuck",
      "keep track of",
      "take a step back",
      "make someone's day",
      "look no further",
      "behind the scenes",
      "on the right track",
    ].map((phrase) => ({
      phrase,
      definition: `${phrase} 的意思`,
      example: `Example using ${phrase}.`,
      topic_slug: "daily",
    }));
    const openai = {
      chat: {
        completions: {
          create: vi.fn().mockResolvedValue({
            choices: [
              {
                message: {
                  content: JSON.stringify({ expressions }),
                },
              },
            ],
          }),
        },
      },
    };
    const diagnostics = vi.fn();

    const result = await extractExpressions("A short cleaned transcript.", {
      openai: openai as never,
      dismissedKeys: new Set(["feel stuck"]),
      onDiagnostics: diagnostics,
    });

    expect(result).toHaveLength(6);
    expect(openai.chat.completions.create).toHaveBeenCalledTimes(1);
    expect(diagnostics).toHaveBeenCalledWith(
      expect.objectContaining({
        rawCandidateCount: 7,
        hardBlockedCount: 1,
        selectedCount: 6,
      })
    );
  });
});
