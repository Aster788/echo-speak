import { describe, expect, it, vi } from "vitest";
import { rankExtractedExpressions } from "@/services/expression-ranker";
import { buildExtractionPreferenceContextFromHistory } from "@/services/extraction-preference-context";
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

  it("adds topic-aware accepted and dismissed preferences to rank prompt", async () => {
    const openai = {
      chat: {
        completions: {
          create: vi.fn().mockResolvedValue({
            choices: [
              {
                message: {
                  content: JSON.stringify({
                    expressions: [candidates[2]],
                  }),
                },
              },
            ],
          }),
        },
      },
    };
    const preferenceContext = buildExtractionPreferenceContextFromHistory({
      accepted: [
        {
          phrase: "work preferred",
          meaning: "偏好",
          topicId: "work-id",
          topicSlug: "work",
          weight: 2,
          feedbackAt: "2026-07-02T00:00:00Z",
        },
        {
          phrase: "daily preferred",
          meaning: "偏好",
          topicId: "daily-id",
          topicSlug: "daily",
          weight: 3,
          feedbackAt: "2026-07-03T00:00:00Z",
        },
      ],
      dismissed: [
        {
          phrase: "feel stuck",
          phraseKey: "feel stuck",
          reason: "gap_ignore",
          topicId: null,
          topicSlug: null,
          dismissedAt: "2026-07-03T00:00:00Z",
        },
      ],
    });
    const workCandidates = candidates.map((candidate) => ({
      ...candidate,
      topic_slug: "work",
    }));

    await rankExtractedExpressions(
      workCandidates,
      2,
      "Some transcript text.",
      openai as never,
      preferenceContext
    );

    const request = openai.chat.completions.create.mock.calls[0]?.[0];
    const systemPrompt = request?.messages[0]?.content as string;
    const userPayload = JSON.parse(
      request?.messages[1]?.content as string
    ) as { target_count: number };
    expect(userPayload.target_count).toBe(2);
    expect(systemPrompt).toContain('"work preferred"');
    expect(systemPrompt).toContain('"daily preferred"');
    expect(systemPrompt.indexOf('"work preferred"')).toBeLessThan(
      systemPrompt.indexOf('"daily preferred"')
    );
    expect(systemPrompt).toContain('"feel stuck"');
    expect(systemPrompt).toContain("return fewer");
  });
});
