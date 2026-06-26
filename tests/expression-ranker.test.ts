import { describe, expect, it, vi } from "vitest";
import { rankExtractedExpressions } from "@/services/expression-ranker";
import type { ExtractedExpression } from "@/types/expression";

const candidates: ExtractedExpression[] = [
  {
    phrase: "by the way",
    definition: "顺便",
    example: "By the way, I loved it.",
    topic_slug: "uncategorized",
  },
  {
    phrase: "track",
    definition: "跟踪",
    example: "Keep track of it.",
    topic_slug: "uncategorized",
  },
  {
    phrase: "keep track of",
    definition: "记录",
    example: "Keep track of your spending.",
    topic_slug: "uncategorized",
  },
];

describe("expression-ranker", () => {
  it("returns input when already within target", async () => {
    const result = await rankExtractedExpressions(candidates, 5, "context");
    expect(result).toEqual(candidates);
  });

  it("keeps only ranked phrases present in candidates", async () => {
    const openai = {
      chat: {
        completions: {
          create: vi.fn().mockResolvedValue({
            choices: [
              {
                message: {
                  content: JSON.stringify({
                    expressions: [
                      candidates[0],
                      candidates[2],
                    ],
                  }),
                },
              },
            ],
          }),
        },
      },
    };

    const result = await rankExtractedExpressions(
      candidates,
      2,
      "Some transcript text.",
      openai as never
    );

    expect(result).toHaveLength(2);
    expect(result.map((item) => item.phrase)).toEqual([
      "by the way",
      "keep track of",
    ]);
  });
});
