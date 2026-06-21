import { describe, expect, it } from "vitest";
import { resolveTopicSlug } from "@/lib/topic-resolve";
import type { TopicIndexEntry } from "@/types/topic";

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

describe("topic-resolve", () => {
  const index = buildIndex([
    ["food", "food-id", 2],
    ["drinks", "drinks-id", 0],
    ["cooking", "cooking-id", 0],
    ["shopping", "shopping-id", 0],
    ["uncategorized", "uncategorized-id", 0],
  ]);

  it("resolves leaf slug to topic id", () => {
    expect(resolveTopicSlug("drinks", index)).toBe("drinks-id");
  });

  it("coerces parent with children to uncategorized", () => {
    expect(resolveTopicSlug("food", index)).toBe("uncategorized-id");
  });

  it("allows leaf root without children", () => {
    expect(resolveTopicSlug("shopping", index)).toBe("shopping-id");
  });

  it("coerces unknown slug to uncategorized", () => {
    expect(resolveTopicSlug("unknown-topic", index)).toBe("uncategorized-id");
  });
});
