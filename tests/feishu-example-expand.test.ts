import { describe, expect, it } from "vitest";
import { expandExampleFromNote } from "@/lib/feishu-example-expand";

describe("expandExampleFromNote", () => {
  it("replaces short example sentence with longest containing note line", () => {
    const phrase = "give and take";
    const short = "relationships are give and take";
    const longer =
      "We do follow her as she comes to these realizations that relationships are give and take";
    const other = "relationships are give and take in life";
    expect(
      expandExampleFromNote(short, [short, longer, other], { phrase })
    ).toBe(longer);
  });

  it("does not invent an example when short equals the lemma/phrase", () => {
    const long =
      "I feel like when we have so many choices, it can actually cause us to freeze up.";
    expect(
      expandExampleFromNote("freeze up", [long], { phrase: "freeze up" })
    ).toBe("freeze up");
  });

  it("returns original when no longer container exists", () => {
    expect(
      expandExampleFromNote("I like coffee in the morning", ["manipulative"], {
        phrase: "coffee",
      })
    ).toBe("I like coffee in the morning");
  });

  it("requires whole-word containment of the short example", () => {
    expect(
      expandExampleFromNote("in", ["interesting weather today"], {
        phrase: "weather",
      })
    ).toBe("in");
  });
});
