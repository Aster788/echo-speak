import { describe, expect, it } from "vitest";
import {
  alignExampleZhFromRawText,
  findAlignedZhFromPairs,
  isPlausibleAlignment,
  parseBilingualBlocks,
  parseEnZhPairs,
} from "@/services/example-zh-alignment";

const COOL_PERSON_RAW = [
  "When you want to take a seat but there's",
  "no more room and someone scooches over for",
  "当你想要坐下却发现",
  "没有空位时，有人会为你挪动位置；那些",
  "you",
  "真正说出他们",
  "对你美好想法的人。",
  "People who actually say the nice things they",
  "think about you.",
  "真正说出他们",
  "对你美好想法的人。",
  "That one person who stops and waits for you",
  "while you tie your shoe",
  "停下来等你的人致敬！向那些会为",
].join("\n");

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

describe("parseEnZhPairs", () => {
  it("pairs each english block with the next chinese block", () => {
    const raw = [
      "Hello world.",
      "你好世界。",
      "Second line.",
      "第二行。",
    ].join("\n");

    expect(parseEnZhPairs(raw)).toEqual([
      { en: "Hello world.", zh: "你好世界。" },
      { en: "Second line.", zh: "第二行。" },
    ]);
  });
});

describe("isPlausibleAlignment", () => {
  it("rejects fragmented chinese without sentence punctuation for long examples", () => {
    expect(
      isPlausibleAlignment(
        "I literally listened to all kinds of Chinese music all day long.",
        "听各种各样的中文歌曲，就为了"
      )
    ).toBe(false);
  });

  it("rejects incomplete chinese tails from fragmented subtitles", () => {
    expect(
      isPlausibleAlignment(
        "That one person who stops and waits for you while you tie your shoe.",
        "停下来等你的人致敬！向那些会为"
      )
    ).toBe(false);
  });

  it("accepts short complete chinese sentences", () => {
    expect(
      isPlausibleAlignment("I'll see you next time.", "下次见。")
    ).toBe(true);
  });

  it("accepts complete chinese sentences", () => {
    expect(
      isPlausibleAlignment(
        "People who actually say the nice things they think about you.",
        "真正说出他们对你美好想法的人。"
      )
    ).toBe(true);
  });

  it("rejects english copied into example_zh", () => {
    expect(
      isPlausibleAlignment(
        "First we got to start the day off right with a good breakfast.",
        "First we got to start the day off right with a good breakfast."
      )
    ).toBe(false);
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

  it("aligns exact transcript sentence pairs from fragmented bilingual paste", () => {
    expect(
      alignExampleZhFromRawText(
        COOL_PERSON_RAW,
        "People who actually say the nice things they think about you."
      )
    ).toBe("真正说出他们对你美好想法的人。");
  });

  it("rejects loose partial matches that previously polluted unrelated cards", () => {
    expect(
      alignExampleZhFromRawText(
        COOL_PERSON_RAW,
        "When someone asks you to text them when you get home safe."
      )
    ).toBeNull();
  });

  it("returns null when no chinese pair exists", () => {
    expect(
      alignExampleZhFromRawText("Only English here.", "Only English here.")
    ).toBeNull();
  });
});

describe("findAlignedZhFromPairs", () => {
  it("prefers tight windows over broad accidental matches", () => {
    const pairs = parseEnZhPairs(COOL_PERSON_RAW);
    const aligned = findAlignedZhFromPairs(
      pairs,
      "If you're looking for a wholesome as hell video, look no further."
    );

    expect(aligned).toBeNull();
  });
});
