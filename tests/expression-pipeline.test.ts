import { describe, expect, it, vi } from "vitest";
import { listTopicSubtreeIds } from "@/db/topics";

vi.mock("@/lib/auth-server", () => ({
  getAuthenticatedUser: vi.fn(async () => null),
}));

import { extractExpressionsForTranscript } from "@/services/expression-pipeline";
import { getAuthenticatedUser } from "@/lib/auth-server";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Topic } from "@/types/topic";
import type { Expression } from "@/types/expression";

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

function mockSupabase(
  perVideoDismissed: string[] = [],
  globalDismissed: string[] = [],
  existingExpressions: Expression[] = []
): SupabaseClient {
  const transcript = {
    id: "transcript-1",
    video_id: "video-1",
    raw_text: "raw",
    cleaned_text: "I grabbed an iced latte on the way.",
    created_at: "2026-01-01T00:00:00Z",
  };

  let deleted = false;
  let rows = [...existingExpressions];

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
              eq(column: string) {
                const keys =
                  column === "user_id" ? globalDismissed : perVideoDismissed;
                return Promise.resolve({
                  data: keys.map((phrase_key) => ({ phrase_key })),
                  error: null,
                });
              },
            };
          },
        };
      }

      if (table === "expressions") {
        return {
          delete() {
            deleted = true;
            return {
              eq(column: string, value: unknown) {
                if (column === "video_id") {
                  const videoId = value as string;
                  return {
                    eq(col2: string, val2: unknown) {
                      if (col2 === "source_type") {
                        const sourceType = val2 as string;
                        return {
                          eq: async (col3: string, val3: unknown) => {
                            if (col3 === "topic_locked" && val3 === false) {
                              rows = rows.filter(
                                (row) =>
                                  !(
                                    row.video_id === videoId &&
                                    row.source_type === sourceType &&
                                    row.topic_locked === false
                                  )
                              );
                            }
                            return { error: null };
                          },
                        };
                      }
                      return { eq: async () => ({ error: null }) };
                    },
                  };
                }
                return {
                  eq() {
                    return { eq: async () => ({ error: null }) };
                  },
                };
              },
            };
          },
          select() {
            return {
              eq(column: string, value: unknown) {
                if (column === "video_id") {
                  const videoId = value as string;
                  return {
                    order: async () => ({
                      data: rows.filter((row) => row.video_id === videoId),
                      error: null,
                    }),
                  };
                }
                throw new Error(`Unexpected select eq: ${column}`);
              },
            };
          },
          insert(insertRows: unknown[]) {
            const created = (insertRows as Record<string, unknown>[]).map(
              (row, index) => ({
                id: `expr-${rows.length + index + 1}`,
                topic_locked: false,
                created_at: "2026-01-01T00:00:00Z",
                ...row,
              })
            ) as Expression[];
            rows.push(...created);
            return {
              select: async () => ({
                data: created,
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
    vi.mocked(getAuthenticatedUser).mockResolvedValueOnce(null);
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
      resolveExampleZhFn: async () => "示例中文",
    });

    expect(extractFn).toHaveBeenCalled();
    expect((supabase as unknown as { _deleted: () => boolean })._deleted()).toBe(true);
    expect(result.expressionCount).toBe(2);
    expect(result.expressions[0]?.topic_id).toBe("drinks-id");
    expect(result.expressions[1]?.topic_id).toBe("uncategorized-id");
  });

  it("skips dismissed phrases on re-extract (per-video)", async () => {
    vi.mocked(getAuthenticatedUser).mockResolvedValueOnce(null);
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
      resolveExampleZhFn: async () => "示例中文",
    });

    expect(result.expressionCount).toBe(1);
    expect(result.expressions[0]?.phrase).toBe("iced latte");
  });

  it("skips globally dismissed phrases on a different video", async () => {
    vi.mocked(getAuthenticatedUser).mockResolvedValueOnce({
      id: "user-1",
    } as never);
    // Global blocklist has "feel stuck"; per-video has nothing.
    const supabase = mockSupabase([], ["feel stuck"]);
    const extractFn = async () => [
      {
        phrase: "feel stuck",
        definition: "感觉卡住",
        example: "I feel stuck on this problem.",
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
      resolveExampleZhFn: async () => "示例中文",
    });

    expect(result.expressionCount).toBe(1);
    expect(result.expressions[0]?.phrase).toBe("iced latte");
  });

  it("per-video and global blocklists are both respected (union)", async () => {
    vi.mocked(getAuthenticatedUser).mockResolvedValueOnce({
      id: "user-1",
    } as never);
    // Per-video blocks "on the way"; global blocks "feel stuck".
    const supabase = mockSupabase(["on the way"], ["feel stuck"]);
    const extractFn = async () => [
      { phrase: "on the way", definition: "在路上", example: "x", topic_slug: "daily" },
      { phrase: "feel stuck", definition: "卡住", example: "y", topic_slug: "daily" },
      { phrase: "iced latte", definition: "冰拿铁", example: "z", topic_slug: "drinks" },
    ];

    const result = await extractExpressionsForTranscript("transcript-1", {
      supabase,
      extractFn,
      resolveExampleZhFn: async () => "示例中文",
    });

    expect(result.expressionCount).toBe(1);
    expect(result.expressions[0]?.phrase).toBe("iced latte");
  });

  it("merges same phrase twice in one batch into one row with 2 examples", async () => {
    vi.mocked(getAuthenticatedUser).mockResolvedValueOnce(null);
    const supabase = mockSupabase();
    const extractFn = async () => [
      { phrase: "behind the scenes", definition: "幕后", example: "A example", topic_slug: "daily" },
      { phrase: "Behind the Scenes", definition: "幕后", example: "B example", topic_slug: "daily" },
    ];

    const result = await extractExpressionsForTranscript("transcript-1", {
      supabase,
      extractFn,
      resolveExampleZhFn: async () => "示例中文",
    });

    expect(result.expressionCount).toBe(1);
    const row = result.expressions[0];
    expect(row?.phrase).toBe("behind the scenes");
    expect(row?.examples).toHaveLength(2);
    expect(row?.examples?.[0]?.en).toBe("A example");
    expect(row?.examples?.[1]?.en).toBe("B example");
  });

  it("merges near-duplicates into one row with general display phrase", async () => {
    vi.mocked(getAuthenticatedUser).mockResolvedValueOnce(null);
    const supabase = mockSupabase();
    const extractFn = async () => [
      { phrase: "let go of something", definition: "放下", example: "ex1", topic_slug: "daily" },
      { phrase: "let go of", definition: "放下", example: "ex2", topic_slug: "daily" },
    ];

    const result = await extractExpressionsForTranscript("transcript-1", {
      supabase,
      extractFn,
      resolveExampleZhFn: async () => "示例中文",
    });

    expect(result.expressionCount).toBe(1);
    expect(result.expressions[0]?.phrase).toBe("let go of");
    expect(result.expressions[0]?.examples).toHaveLength(2);
  });

  it("canonical key blocked by global dismissal → no insert", async () => {
    vi.mocked(getAuthenticatedUser).mockResolvedValueOnce({
      id: "user-1",
    } as never);
    // Global dismissal of "let go of" canonicalizes to "let go of".
    // The near-dup "let go of something" also canonicalizes to "let go of"
    // and is therefore blocked.
    const supabase = mockSupabase([], ["let go of"]);
    const extractFn = async () => [
      { phrase: "let go of something", definition: "放下", example: "ex1", topic_slug: "daily" },
      { phrase: "iced latte", definition: "冰拿铁", example: "ex2", topic_slug: "drinks" },
    ];

    const result = await extractExpressionsForTranscript("transcript-1", {
      supabase,
      extractFn,
      resolveExampleZhFn: async () => "示例中文",
    });

    expect(result.expressionCount).toBe(1);
    expect(result.expressions[0]?.phrase).toBe("iced latte");
  });

  it("skips insert when canonical key already exists on video (locked row kept)", async () => {
    vi.mocked(getAuthenticatedUser).mockResolvedValueOnce(null);
    const locked: Expression = {
      id: "locked-1",
      video_id: "video-1",
      phrase: "a spark of passion",
      meaning: "一丝激情",
      example_en: "First there's curiosity, then maybe there's a spark of passion.",
      example_zh: "先有好奇心，然后也许有一丝激情。",
      examples: null,
      topic_id: "uncategorized-id",
      source_type: "transcript",
      weight: 1,
      topic_locked: true,
      created_at: "2026-01-01T00:00:00Z",
    };
    const supabase = mockSupabase([], [], [locked]);
    const extractFn = async () => [
      {
        phrase: "a spark of passion",
        definition: "激情的火花",
        example: "First there's curiosity, then maybe there's a spark of passion.",
        topic_slug: "daily",
      },
      {
        phrase: "at the very end",
        definition: "在最后",
        example: "At the very end there's joy like nothing else.",
        topic_slug: "daily",
      },
    ];

    const result = await extractExpressionsForTranscript("transcript-1", {
      supabase,
      extractFn,
      resolveExampleZhFn: async () => "示例中文",
    });

    expect(result.expressionCount).toBe(1);
    expect(result.expressions[0]?.phrase).toBe("at the very end");
  });
});

describe("topics subtree", () => {
  it("includes descendants when querying food subtree", () => {
    const subtree = listTopicSubtreeIds("food-id", topics);
    expect(subtree).toEqual(["food-id", "drinks-id"]);
  });
});
