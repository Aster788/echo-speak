import { describe, expect, it } from "vitest";
import {
  isPrimarilyChineseLine,
  keepEnglishLinesOnly,
} from "@/lib/english-lines";

describe("english-lines", () => {
  it("detects Chinese-dominant lines", () => {
    expect(isPrimarilyChineseLine("如果你觉得时间不够用")).toBe(true);
    expect(isPrimarilyChineseLine("Hello world")).toBe(false);
  });

  it("keeps English lines from bilingual blocks", () => {
    const bilingual = `If you feel like you're running out of time
如果你觉得时间不够用
and other people are moving faster
和其他人比起来你动作更慢`;

    expect(keepEnglishLinesOnly(bilingual)).toBe(
      "If you feel like you're running out of time\nand other people are moving faster"
    );
  });

  it("preserves English-only text", () => {
    const text = "Hello there.\nGeneral Kenobi.";
    expect(keepEnglishLinesOnly(text)).toBe(text);
  });
});
