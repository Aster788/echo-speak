import { describe, expect, it } from "vitest";
import { isDistinctExample } from "@/lib/example-distinct";

describe("isDistinctExample", () => {
  it("rejects empty and lemma copies", () => {
    expect(isDistinctExample(null, "give up on")).toBe(false);
    expect(isDistinctExample("give up on", "give up on")).toBe(false);
    expect(isDistinctExample("Give up on...", "give up on")).toBe(false);
  });

  it("accepts real usage sentences", () => {
    expect(
      isDistinctExample(
        "It's kind of clunky but it does the job.",
        "do the job"
      )
    ).toBe(true);
  });
});
