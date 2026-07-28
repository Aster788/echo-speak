import { describe, expect, it } from "vitest";
import {
  applyExpressionCorrection,
  prefillCorrectionValue,
} from "@/lib/expression-correction";

const base = {
  phrase: "rip the band-aid off",
  meaning: "痛快地做一件难事",
  example_en: "Just rip the band-aid off and tell them.",
  example_zh: "直接把话说开吧。",
  examples: null as
    | Array<{ en: string; zh: string | null }>
    | null,
};

describe("applyExpressionCorrection", () => {
  it("updates phrase and meaning", () => {
    expect(
      applyExpressionCorrection(base, {
        field: "phrase",
        value: "rip the Band-Aid off",
      }).phrase
    ).toBe("rip the Band-Aid off");

    expect(
      applyExpressionCorrection(base, {
        field: "meaning",
        value: "痛痛快快地了结",
      }).meaning
    ).toBe("痛痛快快地了结");
  });

  it("updates legacy single example_en and mirrors examples[0]", () => {
    const next = applyExpressionCorrection(base, {
      field: "example_en",
      value: "Just rip the Band-Aid off and tell them.",
      exampleIndex: 0,
    });
    expect(next.example_en).toBe(
      "Just rip the Band-Aid off and tell them."
    );
    expect(next.examples).toEqual([
      {
        en: "Just rip the Band-Aid off and tell them.",
        zh: "直接把话说开吧。",
      },
    ]);
  });

  it("updates a specific example when multiple exist", () => {
    const multi = {
      ...base,
      examples: [
        { en: "First example.", zh: "第一句。" },
        { en: "Secnd example.", zh: "第二句。" },
      ],
    };
    const next = applyExpressionCorrection(multi, {
      field: "example_en",
      value: "Second example.",
      exampleIndex: 1,
    });
    expect(next.examples?.[1]?.en).toBe("Second example.");
    expect(next.example_en).toBe("First example.");
    expect(next.examples?.[0]?.zh).toBe("第一句。");
  });

  it("updates example_zh and keeps example_en", () => {
    const next = applyExpressionCorrection(base, {
      field: "example_zh",
      value: "干脆把难事做了吧。",
      exampleIndex: 0,
    });
    expect(next.example_zh).toBe("干脆把难事做了吧。");
    expect(next.example_en).toBe(base.example_en);
  });

  it("rejects empty value and out-of-range index", () => {
    expect(() =>
      applyExpressionCorrection(base, { field: "phrase", value: "  " })
    ).toThrow(/empty/i);

    expect(() =>
      applyExpressionCorrection(base, {
        field: "example_en",
        value: "x",
        exampleIndex: 3,
      })
    ).toThrow(/out of range/i);
  });
});

describe("prefillCorrectionValue", () => {
  it("prefills phrase, meaning, and example fields", () => {
    expect(prefillCorrectionValue(base, "phrase")).toBe(base.phrase);
    expect(prefillCorrectionValue(base, "meaning")).toBe(base.meaning);
    expect(prefillCorrectionValue(base, "example_en", 0)).toBe(
      base.example_en
    );
    expect(prefillCorrectionValue(base, "example_zh", 0)).toBe(
      base.example_zh
    );
  });
});
