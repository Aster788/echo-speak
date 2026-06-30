import { describe, expect, it } from "vitest";
import {
  formatTopicTreeForPrompt,
  listLeafTopicSlugs,
  topicsToSeeds,
  TOPIC_SEEDS,
} from "@/lib/topic-seeds";
import type { Topic } from "@/types/topic";

const dbTopics: Topic[] = [
  { id: "food-id", name: "Food", slug: "food", parent_id: null, is_system: true, merged_into_id: null, created_at: "2026-01-01T00:00:00Z" },
  { id: "drinks-id", name: "Drinks", slug: "drinks", parent_id: "food-id", is_system: true, merged_into_id: null, created_at: "2026-01-01T00:00:00Z" },
  { id: "coffee-id", name: "Coffee", slug: "coffee", parent_id: "drinks-id", is_system: false, merged_into_id: null, created_at: "2026-01-02T00:00:00Z" },
  // user-created leaf
  { id: "coding-id", name: "Coding", slug: "coding", parent_id: null, is_system: false, merged_into_id: null, created_at: "2026-01-03T00:00:00Z" },
  // merged-away topic (should be skipped)
  { id: "old-id", name: "Old", slug: "old-topic", parent_id: null, is_system: false, merged_into_id: "coding-id", created_at: "2026-01-01T00:00:00Z" },
];

describe("topic-seeds dynamic (DB rows)", () => {
  it("topicsToSeeds builds nested tree from flat rows via parent_id", () => {
    const seeds = topicsToSeeds(dbTopics);
    const food = seeds.find((s) => s.slug === "food");
    expect(food).toBeDefined();
    expect(food?.children?.find((c) => c.slug === "drinks")).toBeDefined();
    // nested grandchild
    const drinks = food?.children?.find((c) => c.slug === "drinks");
    expect(drinks?.children?.find((c) => c.slug === "coffee")).toBeDefined();
  });

  it("topicsToSeeds skips merged-away topics", () => {
    const seeds = topicsToSeeds(dbTopics);
    expect(seeds.find((s) => s.slug === "old-topic")).toBeUndefined();
  });

  it("formatTopicTreeForPrompt(topics) includes a user-created topic slug", () => {
    const tree = formatTopicTreeForPrompt(dbTopics);
    expect(tree).toContain("coding (Coding)");
  });

  it("formatTopicTreeForPrompt(topics) renders nested children indented", () => {
    const tree = formatTopicTreeForPrompt(dbTopics);
    expect(tree).toContain("- food (Food)");
    expect(tree).toContain("  - drinks (Drinks)");
    expect(tree).toContain("    - coffee (Coffee)");
  });

  it("listLeafTopicSlugs(topics) includes only leaves (coding, coffee), not parents", () => {
    const leaves = listLeafTopicSlugs(dbTopics);
    expect(leaves).toContain("coding");
    expect(leaves).toContain("coffee");
    expect(leaves).not.toContain("food");
    expect(leaves).not.toContain("drinks");
    // merged-away topic absent
    expect(leaves).not.toContain("old-topic");
  });

  it("deleted topic is absent from prompt (only present topics appear)", () => {
    const subset = dbTopics.filter((t) => t.slug !== "coding");
    const tree = formatTopicTreeForPrompt(subset);
    expect(tree).not.toContain("coding");
  });

  it("renamed slug is reflected in prompt", () => {
    const renamed = dbTopics.map((t) =>
      t.slug === "coding" ? { ...t, slug: "programming" } : t
    );
    const tree = formatTopicTreeForPrompt(renamed);
    expect(tree).toContain("programming (Coding)");
    expect(tree).not.toContain("- coding");
  });

  it("no-arg overload (TOPIC_SEEDS) still works for unit tests", () => {
    const tree = formatTopicTreeForPrompt();
    expect(tree).toContain("food (Food)");
    expect(tree).toContain("drinks (Drinks)");
    const leaves = listLeafTopicSlugs();
    expect(leaves).toContain("drinks");
    expect(leaves).not.toContain("food");
    // TOPIC_SEEDS still exported for fixtures
    expect(TOPIC_SEEDS.length).toBeGreaterThan(0);
  });
});
