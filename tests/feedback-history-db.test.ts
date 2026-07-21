import { describe, expect, it } from "vitest";
import { listAcceptedGapPreferenceRecords } from "@/db/gaps";
import { listDismissalPreferenceRecords } from "@/db/expression-dismissals";
import type { SupabaseClient } from "@supabase/supabase-js";

function queryClient(
  table: string,
  rows: unknown[],
  observed: Array<[string, unknown]>,
  userIds = ["user-1"]
): SupabaseClient {
  return {
    auth: {
      admin: {
        listUsers: async () => ({
          data: { users: userIds.map((id) => ({ id })) },
          error: null,
        }),
      },
    },
    from(requestedTable: string) {
      if (requestedTable !== table) {
        throw new Error(`Unexpected table: ${requestedTable}`);
      }
      return {
        select() {
          const query = {
            eq(column: string, value: unknown) {
              observed.push([column, value]);
              return query;
            },
            order: async () => ({ data: rows, error: null }),
          };
          return query;
        },
      };
    },
  } as unknown as SupabaseClient;
}

describe("feedback history data access", () => {
  it("returns only accepted-gap expressions and skips invalid joined rows", async () => {
    const observed: Array<[string, unknown]> = [];
    const client = queryClient(
      "gaps",
      [
        {
          created_at: "2026-07-19T12:00:00Z",
          expressions: {
            phrase: "keep track of",
            meaning: "记录",
            topic_id: "work-id",
            weight: 2,
            topics: { slug: "work" },
          },
        },
        {
          created_at: "2026-07-18T12:00:00Z",
          expressions: null,
        },
      ],
      observed
    );

    const records = await listAcceptedGapPreferenceRecords("user-1", client);

    expect(observed).toContainEqual(["status", "accepted"]);
    expect(records).toEqual([
      {
        phrase: "keep track of",
        meaning: "记录",
        topicId: "work-id",
        topicSlug: "work",
        weight: 2,
        feedbackAt: "2026-07-19T12:00:00Z",
      },
    ]);
  });

  it("scopes dismissal history by user and keeps gap_ignore", async () => {
    const observed: Array<[string, unknown]> = [];
    const client = queryClient(
      "expression_dismissals",
      [
        {
          phrase: "feel stuck",
          phrase_key: "feel stuck",
          reason: "gap_ignore",
          topic_id: null,
          dismissed_at: "2026-07-19T12:00:00Z",
          topics: null,
        },
        {
          phrase: null,
          phrase_key: "invalid",
          reason: "fragment",
          topic_id: null,
          dismissed_at: "2026-07-18T12:00:00Z",
          topics: null,
        },
      ],
      observed
    );

    const records = await listDismissalPreferenceRecords("user-1", client);

    expect(observed).toContainEqual(["user_id", "user-1"]);
    expect(records).toEqual([
      {
        phrase: "feel stuck",
        phraseKey: "feel stuck",
        reason: "gap_ignore",
        topicId: null,
        topicSlug: null,
        dismissedAt: "2026-07-19T12:00:00Z",
      },
    ]);
  });

  it("returns empty histories without errors", async () => {
    await expect(
      listAcceptedGapPreferenceRecords(
        "user-1",
        queryClient("gaps", [], [])
      )
    ).resolves.toEqual([]);
    await expect(
      listDismissalPreferenceRecords(
        "user-1",
        queryClient("expression_dismissals", [], [])
      )
    ).resolves.toEqual([]);
  });

  it("fails closed for accepted feedback when more than one user exists", async () => {
    const observed: Array<[string, unknown]> = [];
    const client = queryClient(
      "gaps",
      [
        {
          created_at: "2026-07-19T12:00:00Z",
          expressions: {
            phrase: "private preference",
            meaning: "私密偏好",
            topic_id: "work-id",
            weight: 3,
            topics: { slug: "work" },
          },
        },
      ],
      observed,
      ["user-1", "user-2"]
    );

    await expect(
      listAcceptedGapPreferenceRecords("user-1", client)
    ).resolves.toEqual([]);
    expect(observed).not.toContainEqual(["status", "accepted"]);
  });
});
