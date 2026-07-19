import { describe, expect, it } from "vitest";
import { resolveFeishuSectionTopicId } from "@/lib/feishu-section-topic-map";
import type { Topic, TopicIndexEntry } from "@/types/topic";

function topic(
  overrides: Partial<Topic> & Pick<Topic, "id" | "name" | "slug">
): Topic {
  return {
    parent_id: null,
    is_system: true,
    merged_into_id: null,
    created_at: "2026-01-01T00:00:00Z",
    ...overrides,
  };
}

function buildIndex(
  entries: Array<[string, string, number]>
): Map<string, TopicIndexEntry> {
  const index = new Map<string, TopicIndexEntry>();
  for (const [slug, id, childCount] of entries) {
    index.set(slug, {
      id,
      slug,
      parent_id: null,
      childCount,
    });
  }
  return index;
}

describe("resolveFeishuSectionTopicId", () => {
  const topics: Topic[] = [
    topic({ id: "food-id", name: "Food", slug: "food", parent_id: null }),
    topic({ id: "drinks-id", name: "Drinks", slug: "drinks", parent_id: "food-id" }),
    topic({ id: "work-id", name: "Work", slug: "work" }),
    topic({ id: "travel-id", name: "Travel", slug: "travel" }),
  ];

  const index = buildIndex([
    ["food", "food-id", 1],
    ["drinks", "drinks-id", 0],
    ["work", "work-id", 0],
    ["travel", "travel-id", 0],
  ]);

  it("maps section label to leaf topic slug (case-insensitive)", () => {
    expect(resolveFeishuSectionTopicId("work", index, topics)).toBe("work-id");
    expect(resolveFeishuSectionTopicId("Work", index, topics)).toBe("work-id");
    expect(resolveFeishuSectionTopicId("travel", index, topics)).toBe(
      "travel-id"
    );
  });

  it("maps section label to topic name when it matches exactly", () => {
    expect(resolveFeishuSectionTopicId("Drinks", index, topics)).toBe(
      "drinks-id"
    );
  });

  it("returns null for parent topics with children", () => {
    expect(resolveFeishuSectionTopicId("food", index, topics)).toBeNull();
    expect(resolveFeishuSectionTopicId("Food", index, topics)).toBeNull();
  });

  it("returns null for unmapped narrative sections", () => {
    expect(resolveFeishuSectionTopicId("观点", index, topics)).toBeNull();
    expect(resolveFeishuSectionTopicId("闲逛", index, topics)).toBeNull();
  });

  it("returns null for empty section", () => {
    expect(resolveFeishuSectionTopicId(null, index, topics)).toBeNull();
    expect(resolveFeishuSectionTopicId("  ", index, topics)).toBeNull();
  });
});
