import { describe, expect, it } from "vitest";
import {
  alignExampleZhFromRawText,
  parseBilingualBlocks,
  resolveExampleZh,
} from "@/services/example-zh";

describe("parseBilingualBlocks", () => {
  it("groups alternating english and chinese blocks", () => {
    const raw = [
      "I grabbed an iced latte on the way.",
      "我顺路买了一杯冰拿铁。",
      "The cafe was packed.",
      "咖啡馆里人很多。",
    ].join("\n");

    expect(parseBilingualBlocks(raw)).toEqual([
      { lang: "en", text: "I grabbed an iced latte on the way." },
      { lang: "zh", text: "我顺路买了一杯冰拿铁。" },
      { lang: "en", text: "The cafe was packed." },
      { lang: "zh", text: "咖啡馆里人很多。" },
    ]);
  });
});

describe("alignExampleZhFromRawText", () => {
  it("returns paired chinese block for matching english example", () => {
    const raw = [
      "I grabbed an iced latte on the way.",
      "我顺路买了一杯冰拿铁。",
    ].join("\n");

    expect(
      alignExampleZhFromRawText(raw, "I grabbed an iced latte on the way.")
    ).toBe("我顺路买了一杯冰拿铁。");
  });

  it("returns null when no chinese pair exists", () => {
    expect(
      alignExampleZhFromRawText("Only English here.", "Only English here.")
    ).toBeNull();
  });
});

describe("resolveExampleZh", () => {
  it("uses alignment before calling translation", async () => {
    const raw = ["Hello world.", "你好世界。"].join("\n");
    await expect(resolveExampleZh(raw, "Hello world.")).resolves.toBe(
      "你好世界。"
    );
  });
});
