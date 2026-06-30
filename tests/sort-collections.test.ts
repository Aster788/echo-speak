import { describe, expect, it } from "vitest";
import {
  sortExpressionsByPhrase,
  sortTopicsByName,
  sortVideosByTitle,
} from "@/lib/sort-collections";
import type { Expression } from "@/types/expression";

function expression(
  overrides: Partial<Expression> & Pick<Expression, "id" | "phrase">
): Expression {
  return {
    video_id: "v1",
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

describe("sort-collections", () => {
  it("sorts expressions by phrase a→z with id tie-break", () => {
    const sorted = sortExpressionsByPhrase([
      expression({ id: "b", phrase: "zebra" }),
      expression({ id: "a", phrase: "Apple" }),
      expression({ id: "c", phrase: "apple" }),
    ]);

    expect(sorted.map((item) => item.id)).toEqual(["a", "c", "b"]);
  });

  it("sorts topics by name case-insensitively", () => {
    const sorted = sortTopicsByName([
      { id: "2", name: "Travel" },
      { id: "1", name: "daily" },
      { id: "3", name: "Food" },
    ]);

    expect(sorted.map((item) => item.name)).toEqual(["daily", "Food", "Travel"]);
  });

  it("sorts videos by title", () => {
    const sorted = sortVideosByTitle([
      { id: "2", title: "Zebra vlog", youtube_url: "", source: "youtube", created_at: "2026-01-01" },
      { id: "1", title: "Alpha clip", youtube_url: "", source: "youtube", created_at: "2026-01-01" },
    ]);

    expect(sorted.map((item) => item.title)).toEqual([
      "Alpha clip",
      "Zebra vlog",
    ]);
  });
});
