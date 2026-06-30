import { describe, expect, it, vi } from "vitest";
import {
  listExpressionsMergedByCanonicalKey,
  mergeExpressions,
} from "@/db/expressions";
import type { Expression, ExpressionExample } from "@/types/expression";
import type { SupabaseClient } from "@supabase/supabase-js";

function expr(overrides: Partial<Expression> & Pick<Expression, "id" | "phrase">): Expression {
  return {
    video_id: overrides.video_id ?? "v1",
    meaning: "",
    example_en: "",
    example_zh: null,
    examples: null,
    topic_id: "t1",
    source_type: "transcript",
    weight: 1,
    topic_locked: false,
    created_at: "2026-01-01",
    ...overrides,
  };
}

function mockMergeSupabase(
  source: Expression,
  target: Expression
): SupabaseClient {
  const store = new Map<string, Expression>([
    [source.id, source],
    [target.id, target],
  ]);

  return {
    from(table: string) {
      if (table === "expressions") {
        return {
          select() {
            return {
              eq(_col: string, val: string) {
                return {
                  single: async () => ({
                    data: store.get(val) ?? null,
                    error: null,
                  }),
                };
              },
              order: async () => ({
                data: [...store.values()],
                error: null,
              }),
              in(_col: string, ids: string[]) {
                return { data: ids.map((id) => store.get(id)), error: null };
              },
            };
          },
          update(payload: Partial<Expression>) {
            return {
              eq(_col: string, id: string) {
                return {
                  select() {
                    return {
                      single: async () => {
                        const row = store.get(id);
                        if (row) {
                          const updated = { ...row, ...payload };
                          store.set(id, updated);
                          return { data: updated, error: null };
                        }
                        return { data: null, error: { message: "not found" } };
                      },
                    };
                  },
                };
              },
            };
          },
          delete() {
            return {
              in(_col: string, ids: string[]) {
                for (const id of ids) store.delete(id);
                return Promise.resolve({ error: null });
              },
              eq(_col: string, id: string) {
                store.delete(id);
                return Promise.resolve({ error: null });
              },
            };
          },
        };
      }
      throw new Error(`Unexpected table: ${table}`);
    },
  } as unknown as SupabaseClient;
}

describe("mergeExpressions", () => {
  it("combines examples, picks general phrase, deletes source", async () => {
    const source = expr({
      id: "src",
      phrase: "treat yourself",
      example_en: "Treat yourself today.",
      example_zh: "今天犒劳自己。",
      video_id: "v1",
    });
    const target = expr({
      id: "tgt",
      phrase: "treat oneself",
      example_en: "Treat oneself sometimes.",
      example_zh: null,
      video_id: "v1",
    });
    const supabase = mockMergeSupabase(source, target);

    const result = await mergeExpressions("src", "tgt", supabase);

    // general form (oneself, no trailing placeholder) wins
    expect(result.phrase).toBe("treat oneself");
    expect(result.examples).toHaveLength(2);
    // examples[0] is target's, examples[1] is source's
    expect(result.examples?.[0]?.en).toBe("Treat oneself sometimes.");
    expect(result.examples?.[1]?.en).toBe("Treat yourself today.");
    // non-null zh wins for examples[0]
    expect(result.examples?.[0]?.zh).toBe("今天犒劳自己。");
  });

  it("preserves topic_locked from either row (locked wins)", async () => {
    const source = expr({
      id: "src",
      phrase: "behind the scenes",
      topic_locked: true,
      topic_id: "locked-topic",
    });
    const target = expr({
      id: "tgt",
      phrase: "Behind the Scenes",
      topic_locked: false,
      topic_id: "other-topic",
    });
    const supabase = mockMergeSupabase(source, target);

    const result = await mergeExpressions("src", "tgt", supabase);
    expect(result.topic_locked).toBe(true);
    expect(result.topic_id).toBe("locked-topic");
  });

  it("rejects merging an expression into itself", async () => {
    const supabase = mockMergeSupabase(
      expr({ id: "a", phrase: "x" }),
      expr({ id: "a", phrase: "x" })
    );
    await expect(mergeExpressions("a", "a", supabase)).rejects.toThrow(
      /itself/
    );
  });
});

describe("listExpressionsMergedByCanonicalKey", () => {
  function mockListSupabase(rows: Expression[]): SupabaseClient {
    const result = { data: rows, error: null };
    return {
      from(table: string) {
        if (table === "expressions") {
          const chainable = {
            eq: async () => result,
            in: async () => result,
            order: async () => result,
            then: (resolve: (v: typeof result) => void) => resolve(result),
          };
          return {
            select: () => chainable,
          };
        }
        if (table === "topics") {
          return {
            select: () => ({
              order: async () => ({ data: [], error: null }),
            }),
          };
        }
        throw new Error(`Unexpected table: ${table}`);
      },
    } as unknown as SupabaseClient;
  }

  it("All view merges same phrase across two videos into one virtual row", async () => {
    const rows = [
      expr({ id: "1", phrase: "behind the scenes", video_id: "vx", example_en: "A", example_zh: "a" }),
      expr({ id: "2", phrase: "Behind the Scenes", video_id: "vy", example_en: "B", example_zh: "b" }),
      expr({ id: "3", phrase: "iced latte", video_id: "vx", example_en: "C", example_zh: "c" }),
    ];
    const supabase = mockListSupabase(rows);

    const merged = await listExpressionsMergedByCanonicalKey(
      { kind: "all" },
      supabase
    );

    expect(merged).toHaveLength(2);
    const bts = merged.find((m) => m.phrase === "behind the scenes");
    expect(bts?.examples).toHaveLength(2);
    const latte = merged.find((m) => m.phrase === "iced latte");
    expect(latte?.examples).toHaveLength(1);
  });

  it("near-duplicates collapse to general display phrase", async () => {
    const rows = [
      expr({ id: "1", phrase: "let go of something", video_id: "vx", example_en: "A", example_zh: null }),
      expr({ id: "2", phrase: "let go of", video_id: "vy", example_en: "B", example_zh: "b" }),
    ];
    const supabase = mockListSupabase(rows);

    const merged = await listExpressionsMergedByCanonicalKey(
      { kind: "all" },
      supabase
    );

    expect(merged).toHaveLength(1);
    expect(merged[0]?.phrase).toBe("let go of");
    expect(merged[0]?.examples).toHaveLength(2);
  });

  it("is idempotent: merging already-merged rows is a no-op", async () => {
    // A single row already has examples = 2; merging it with itself yields one row.
    const rows = [
      expr({
        id: "1",
        phrase: "behind the scenes",
        video_id: "vx",
        examples: [
          { en: "A", zh: "a" },
          { en: "B", zh: "b" },
        ] as ExpressionExample[],
      }),
    ];
    const supabase = mockListSupabase(rows);

    const merged = await listExpressionsMergedByCanonicalKey(
      { kind: "all" },
      supabase
    );

    expect(merged).toHaveLength(1);
    expect(merged[0]?.examples).toHaveLength(2);
    expect(merged[0]?.phrase).toBe("behind the scenes");
  });
});
