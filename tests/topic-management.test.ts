import { describe, expect, it } from "vitest";
import { slugifyName, uniqueTopicSlug } from "@/lib/slugify";
import {
  filterDismissedExpressions,
  normalizePhraseKey,
} from "@/lib/merge-expressions";

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
