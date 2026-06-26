import { describe, expect, it } from "vitest";
import { slugifyName, uniqueTopicSlug } from "@/lib/slugify";
import { aggregateTopicExpressionCounts } from "@/db/topics";
import {
  filterDismissedExpressions,
  normalizePhraseKey,
} from "@/lib/merge-expressions";
import type { Topic } from "@/types/topic";

describe("slugifyName", () => {
  it("creates URL-safe slugs", () => {
    expect(slugifyName("Meal Prep")).toBe("meal-prep");
    expect(slugifyName("  Dining Out! ")).toBe("dining-out");
  });
});

describe("uniqueTopicSlug", () => {
  it("appends suffix when slug exists", async () => {
    const existing = new Set(["meal-prep"]);
    const slug = await uniqueTopicSlug("meal-prep", async (candidate) =>
      existing.has(candidate)
    );
    expect(slug).toBe("meal-prep-2");
  });
});

describe("filterDismissedExpressions", () => {
  it("removes dismissed phrase keys", () => {
    const dismissed = new Set([normalizePhraseKey("feel stuck")]);
    const filtered = filterDismissedExpressions(
      [
        {
          phrase: "feel stuck",
          definition: "a",
          example: "b",
          topic_slug: "daily",
        },
        {
          phrase: "on paper",
          definition: "c",
          example: "d",
          topic_slug: "daily",
        },
      ],
      dismissed
    );

    expect(filtered).toHaveLength(1);
    expect(filtered[0]?.phrase).toBe("on paper");
  });
});

describe("aggregateTopicExpressionCounts", () => {
  it("rolls child expression counts up to parent topics", () => {
    const topics = [
      topic({ id: "food", name: "Food", slug: "food", parent_id: null }),
      topic({
        id: "cooking",
        name: "Cooking",
        slug: "cooking",
        parent_id: "food",
      }),
      topic({
        id: "meal-prep",
        name: "Meal Prep",
        slug: "meal-prep",
        parent_id: "cooking",
      }),
    ];

    const counts = aggregateTopicExpressionCounts(
      topics,
      new Map([
        ["cooking", 2],
        ["meal-prep", 3],
      ])
    );

    expect(counts.get("food")).toBe(5);
    expect(counts.get("cooking")).toBe(5);
    expect(counts.get("meal-prep")).toBe(3);
  });
});

function topic(overrides: Partial<Topic> & Pick<Topic, "id" | "name" | "slug">): Topic {
  return {
    parent_id: null,
    is_system: false,
    merged_into_id: null,
    created_at: "2026-01-01",
    ...overrides,
  };
}
