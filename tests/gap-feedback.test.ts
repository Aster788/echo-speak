import { describe, expect, it } from "vitest";
import { nextAcceptedWeight } from "@/db/expressions";
import { acceptGap, ignoreGap } from "@/services/gap-actions";
import type { SupabaseClient } from "@supabase/supabase-js";

describe("nextAcceptedWeight", () => {
  it("bumps by 0.5", () => {
    expect(nextAcceptedWeight(1.0)).toBe(1.5);
  });

  it("caps at 3.0", () => {
    expect(nextAcceptedWeight(2.8)).toBe(3.0);
    expect(nextAcceptedWeight(3.0)).toBe(3.0);
  });
});

describe("acceptGap / ignoreGap", () => {
  it("acceptGap bumps weight, locks topic, sets accepted", async () => {
    const expression = {
      id: "expr-1",
      phrase: "feel stuck",
      meaning: "感到卡住",
      weight: 1.0,
      video_id: "video-1",
      topic_id: "topic-1",
    };
    const gap = {
      id: "gap-1",
      expression_id: "expr-1",
      reason: "in_transcript_not_in_feishu",
      status: "pending" as const,
      created_at: "2026-07-19T00:00:00Z",
      expressions: expression,
    };

    let expressionUpdate: Record<string, unknown> | null = null;
    let gapUpdate: Record<string, unknown> | null = null;

    const supabase = {
      from(table: string) {
        if (table === "gaps") {
          return {
            select() {
              return {
                eq() {
                  return {
                    maybeSingle: async () => ({ data: gap, error: null }),
                    single: async () => ({
                      data: { ...gap, ...gapUpdate, status: "accepted" },
                      error: null,
                    }),
                  };
                },
              };
            },
            update(payload: Record<string, unknown>) {
              gapUpdate = payload;
              return {
                eq() {
                  return {
                    select() {
                      return {
                        single: async () => ({
                          data: {
                            id: gap.id,
                            expression_id: gap.expression_id,
                            reason: gap.reason,
                            created_at: gap.created_at,
                            ...payload,
                          },
                          error: null,
                        }),
                      };
                    },
                  };
                },
              };
            },
          };
        }

        if (table === "expressions") {
          return {
            update(payload: Record<string, unknown>) {
              expressionUpdate = payload;
              return {
                eq() {
                  return Promise.resolve({ error: null });
                },
              };
            },
          };
        }

        throw new Error(`Unexpected table ${table}`);
      },
    } as unknown as SupabaseClient;

    const result = await acceptGap("gap-1", supabase);
    expect(expressionUpdate).toEqual({ weight: 1.5, topic_locked: true });
    expect(result.status).toBe("accepted");
  });

  it("ignoreGap dismisses with gap_ignore and deletes expression", async () => {
    const expression = {
      id: "expr-1",
      phrase: "Feel Stuck",
      meaning: "感到卡住",
      weight: 1.0,
      video_id: "video-1",
      topic_id: "topic-1",
    };
    const gap = {
      id: "gap-1",
      expression_id: "expr-1",
      reason: "in_transcript_not_in_feishu",
      status: "pending" as const,
      created_at: "2026-07-19T00:00:00Z",
      expressions: expression,
    };

    const dismissalUpserts: Record<string, unknown>[] = [];
    const deletedExpressionIds: string[] = [];

    const supabase = {
      from(table: string) {
        if (table === "gaps") {
          return {
            select() {
              return {
                eq() {
                  return {
                    maybeSingle: async () => ({ data: gap, error: null }),
                  };
                },
              };
            },
          };
        }

        if (table === "expressions") {
          return {
            delete() {
              return {
                eq(_col: string, id: string) {
                  deletedExpressionIds.push(id);
                  return Promise.resolve({ error: null });
                },
              };
            },
          };
        }

        if (table === "expression_dismissals") {
          return {
            upsert(payload: Record<string, unknown>) {
              dismissalUpserts.push(payload);
              return Promise.resolve({ error: null });
            },
          };
        }

        throw new Error(`Unexpected table ${table}`);
      },
    } as unknown as SupabaseClient;

    const result = await ignoreGap("gap-1", {
      userId: "user-1",
      client: supabase,
    });

    expect(result.expressionId).toBe("expr-1");
    expect(deletedExpressionIds).toEqual(["expr-1"]);
    expect(dismissalUpserts[0]).toMatchObject({
      video_id: "video-1",
      reason: "gap_ignore",
      user_id: "user-1",
      phrase: "Feel Stuck",
    });
  });

  it("ignoreGap rejects non-pending gaps", async () => {
    const supabase = {
      from() {
        return {
          select() {
            return {
              eq() {
                return {
                  maybeSingle: async () => ({
                    data: {
                      id: "gap-1",
                      expression_id: "expr-1",
                      reason: "in_transcript_not_in_feishu",
                      status: "accepted",
                      created_at: "2026-07-19T00:00:00Z",
                      expressions: {
                        id: "expr-1",
                        phrase: "feel stuck",
                        meaning: "",
                        weight: 1,
                        video_id: "video-1",
                        topic_id: null,
                      },
                    },
                    error: null,
                  }),
                };
              },
            };
          },
        };
      },
    } as unknown as SupabaseClient;

    await expect(ignoreGap("gap-1", { client: supabase })).rejects.toThrow(
      /pending/i
    );
  });
});
