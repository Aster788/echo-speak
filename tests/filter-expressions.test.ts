import { describe, expect, it } from "vitest";
import {
  filterLowQualityExpressions,
  isTrivialPhrase,
} from "@/lib/filter-expressions";
import type { ExtractedExpression } from "@/types/expression";

function expr(
  phrase: string,
  example = `Example with ${phrase}.`
): ExtractedExpression {
  return {
    phrase,
    definition: "定义",
    example,
    topic_slug: "uncategorized",
  };
}

describe("filter-expressions", () => {
  it("rejects single words and stopword-only phrases", () => {
    expect(isTrivialPhrase("track")).toBe(true);
    expect(isTrivialPhrase("to the")).toBe(true);
    expect(isTrivialPhrase("by the way")).toBe(false);
  });

  it("drops trivial rows and keeps collocations", () => {
    const filtered = filterLowQualityExpressions([
      expr("track"),
      expr("by the way"),
      expr("keep track of"),
    ]);

    expect(filtered.map((item) => item.phrase)).toEqual([
      "by the way",
      "keep track of",
    ]);
  });

  it("keeps longer phrase when one subsumes another", () => {
    const filtered = filterLowQualityExpressions([
      expr("make day", "It made my day."),
      expr("make someone's day", "It made my day."),
    ]);

    expect(filtered).toHaveLength(1);
    expect(filtered[0]?.phrase).toBe("make someone's day");
  });

  it("rejects clip-inflected phrase forms", () => {
    expect(
      filterLowQualityExpressions([
        expr("takes a step back"),
        expr("take a step back"),
      ]).map((item) => item.phrase)
    ).toEqual(["take a step back"]);
  });

  it("keeps one item per duplicate example sentence", () => {
    const example = "Cheers to everyone who showed up.";
    const filtered = filterLowQualityExpressions([
      expr("cheers to", example),
      expr("cheers to everyone", example),
    ]);

    expect(filtered).toHaveLength(1);
    expect(filtered[0]?.phrase).toBe("cheers to everyone");
  });
});
