import { describe, expect, it, vi } from "vitest";
import { listTopicSubtreeIds } from "@/db/topics";
import { extractExpressionsForTranscript } from "@/services/expression-pipeline";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Topic } from "@/types/topic";

const topics: Topic[] = [
  {
    id: "food-id",
    name: "Food",
    slug: "food",
    parent_id: null,
    is_system: true,
    merged_into_id: null,
    created_at: "2026-01-01T00:00:00Z",
  },
  {
    id: "drinks-id",
    name: "Drinks",
    slug: "drinks",
    parent_id: "food-id",
    is_system: true,
    merged_into_id: null,
    created_at: "2026-01-01T00:00:00Z",
  },
  {
    id: "uncategorized-id",
    name: "Uncategorized",
    slug: "uncategorized",
    parent_id: null,
    is_system: true,
    merged_into_id: null,
    created_at: "2026-01-01T00:00:00Z",
  },
];

function mockSupabase(dismissedKeys: string[] = []): SupabaseClient {
  const transcript = {
    id: "transcript-1",
    video_id: "video-1",
    raw_text: "raw",
    cleaned_text: "I grabbed an iced latte on the way.",
    created_at: "2026-01-01T00:00:00Z",
  };

  let deleted = false;

  return {
    from(table: string) {
      if (table === "transcripts") {
        return {
          select() {
            return {
              eq() {
                return {
                  single: async () => ({ data: transcript, error: null }),
                };
              },
            };
          },
        };
      }

      if (table === "topics") {
        return {
          select() {
            return {
              order: async () => ({ data: topics, error: null }),
            };
          },
        };
      }

      if (table === "expression_dismissals") {
        return {
          select() {
            return {
              eq: async () => ({
                data: dismissedKeys.map((phrase_key) => ({ phrase_key })),
                error: null,
              }),
            };
          },
        };
      }

      if (table === "expressions") {
        return {
          delete() {
            deleted = true;
            return {
              eq() {
                return {
                  eq() {
                    return {
                      eq: async () => ({ error: null }),
                    };
                  },
                };
              },
            };
          },
          insert(rows: unknown[]) {
            return {
              select: async () => ({
                data: (rows as Record<string, unknown>[]).map((row, index) => ({
                  id: `expr-${index + 1}`,
                  topic_locked: false,
                  ...row,
                  created_at: "2026-01-01T00:00:00Z",
                })),
                error: null,
              }),
            };
          },
        };
      }

      throw new Error(`Unexpected table: ${table}`);
    },
    _deleted: () => deleted,
  } as unknown as SupabaseClient & { _deleted: () => boolean };
}

describe("expression-pipeline", () => {
  it("extracts, resolves topics, replaces prior unlocked transcript expressions", async () => {
    const supabase = mockSupabase();
    const extractFn = vi.fn(async () => [
      {
        phrase: "iced latte",
        definition: "冰拿铁",
        example: "I grabbed an iced latte on the way.",
        topic_slug: "drinks",
      },
      {
        phrase: "on the way",
        definition: "在路上",
        example: "I grabbed an iced latte on the way.",
        topic_slug: "food",
      },
    ]);

    const result = await extractExpressionsForTranscript("transcript-1", {
      supabase,
      extractFn,
    });

    expect(extractFn).toHaveBeenCalled();
    expect((supabase as { _deleted: () => boolean })._deleted()).toBe(true);
    expect(result.expressionCount).toBe(2);
    expect(result.expressions[0]?.topic_id).toBe("drinks-id");
    expect(result.expressions[1]?.topic_id).toBe("uncategorized-id");
  });

  it("skips dismissed phrases on re-extract", async () => {
    const supabase = mockSupabase(["on the way"]);
    const extractFn = async () => [
      {
        phrase: "on the way",
        definition: "在路上",
        example: "I grabbed an iced latte on the way.",
        topic_slug: "daily",
      },
      {
        phrase: "iced latte",
        definition: "冰拿铁",
        example: "I grabbed an iced latte on the way.",
        topic_slug: "drinks",
      },
    ];

    const result = await extractExpressionsForTranscript("transcript-1", {
      supabase,
      extractFn,
    });

    expect(result.expressionCount).toBe(1);
    expect(result.expressions[0]?.phrase).toBe("iced latte");
  });
});

describe("topics subtree", () => {
  it("includes descendants when querying food subtree", () => {
    const subtree = listTopicSubtreeIds("food-id", topics);
    expect(subtree).toEqual(["food-id", "drinks-id"]);
  });
});
