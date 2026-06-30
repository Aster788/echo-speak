import { describe, expect, it } from "vitest";
import { canonicalKey, pickDisplayPhrase } from "@/lib/phrase-canonical";

describe("canonicalKey", () => {
  it("exact duplicate collapses (case + whitespace)", () => {
    expect(canonicalKey("Behind the Scenes")).toBe("behind the scenes");
    expect(canonicalKey("behind the scenes")).toBe("behind the scenes");
    expect(canonicalKey("  behind   the  scenes ")).toBe("behind the scenes");
  });

  it("pronoun placeholder dropped (trailing something)", () => {
    expect(canonicalKey("let go of something")).toBe("let go of");
    expect(canonicalKey("let go of")).toBe("let go of");
  });

  it("reflexive normalized to oneself", () => {
    expect(canonicalKey("treat yourself")).toBe("treat oneself");
    expect(canonicalKey("treat oneself")).toBe("treat oneself");
    expect(canonicalKey("treat themselves")).toBe("treat oneself");
    expect(canonicalKey("treat myself")).toBe("treat oneself");
  });

  it("mid-phrase things → something", () => {
    expect(canonicalKey("try things on")).toBe("try something on");
    expect(canonicalKey("try something on")).toBe("try something on");
  });

  it("trailing it/them/sb/sth dropped", () => {
    expect(canonicalKey("ask sb")).toBe("ask");
    expect(canonicalKey("ask sth")).toBe("ask");
    // mid-phrase it/them are kept (spec: only trailing dropped)
    expect(canonicalKey("figure it out")).toBe("figure it out");
  });

  it("trailing preposition kept after placeholder removal", () => {
    // "rely on it" → drop "it" → "rely on" (on kept)
    expect(canonicalKey("rely on it")).toBe("rely on");
    expect(canonicalKey("rely on")).toBe("rely on");
  });

  it("empty phrase yields empty key", () => {
    expect(canonicalKey("")).toBe("");
    expect(canonicalKey("   ")).toBe("");
  });

  it("deterministic across calls", () => {
    const a = canonicalKey("Let Go Of Something");
    const b = canonicalKey("let go of something");
    expect(a).toBe(b);
  });
});

describe("pickDisplayPhrase", () => {
  it("prefers the form with no trailing placeholder", () => {
    expect(pickDisplayPhrase(["let go of something", "let go of"])).toBe(
      "let go of"
    );
    expect(pickDisplayPhrase(["let go of", "let go of something"])).toBe(
      "let go of"
    );
  });

  it("reflexive: prefers oneself form", () => {
    expect(pickDisplayPhrase(["treat yourself", "treat oneself"])).toBe(
      "treat oneself"
    );
  });

  it("tiebreak by shortest length", () => {
    expect(pickDisplayPhrase(["behind the scenes", "behind the scenes!"])).toBe(
      "behind the scenes"
    );
  });

  it("single phrase returns itself", () => {
    expect(pickDisplayPhrase(["iced latte"])).toBe("iced latte");
  });

  it("empty list returns empty", () => {
    expect(pickDisplayPhrase([])).toBe("");
  });
});
