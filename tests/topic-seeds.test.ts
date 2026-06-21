import { describe, expect, it } from "vitest";
import {
  flattenTopicSeeds,
  formatTopicTreeForPrompt,
  listLeafTopicSlugs,
  TOPIC_SEEDS,
} from "@/lib/topic-seeds";

describe("topic-seeds", () => {
  it("includes food children without running", () => {
    const food = TOPIC_SEEDS.find((seed) => seed.slug === "food");
    expect(food?.children?.map((child) => child.slug)).toEqual([
      "drinks",
      "cooking",
      "dining-out",
      "grocery",
    ]);
  });

  it("flattens seeds with parent slugs", () => {
    const rows = flattenTopicSeeds();
    expect(rows.find((row) => row.slug === "drinks")?.parentSlug).toBe("food");
    expect(rows.find((row) => row.slug === "shopping")?.parentSlug).toBeNull();
  });

  it("lists leaf slugs for prompt", () => {
    const leaves = listLeafTopicSlugs();
    expect(leaves).toContain("drinks");
    expect(leaves).toContain("shopping");
    expect(leaves).not.toContain("food");
  });

  it("formats topic tree for prompt", () => {
    const tree = formatTopicTreeForPrompt();
    expect(tree).toContain("food (Food)");
    expect(tree).toContain("drinks (Drinks)");
  });
});
