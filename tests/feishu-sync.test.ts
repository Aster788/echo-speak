import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import {
  parseCreatorFromH1,
  parseFeishuDoc,
  parseH3Heading,
} from "@/lib/feishu-doc-parser";
import { parseVocabTableRows } from "@/lib/feishu-table-parser";
import {
  filterSubsumedTableVocab,
  isWholeWordContained,
} from "@/lib/feishu-vocab-filter";
import {
  formatFeishuSyncStatusLabel,
  isFeishuSyncStale,
} from "@/lib/feishu-sync-policy";

const fixture = readFileSync(
  resolve("tests/fixtures/feishu-learning-english-from-vlog.md"),
  "utf8"
);

describe("parseCreatorFromH1", () => {
  it("extracts creator from markdown link", () => {
    expect(
      parseCreatorFromH1("# 🌟 [Leah's Diary 莉雅老师](https://www.youtube.com/@Leah)")
    ).toBe("Leah's Diary 莉雅老师");
  });
});

describe("parseH3Heading", () => {
  it("extracts title and youtube url", () => {
    const parsed = parseH3Heading(
      "### 🍊 [没有安排的一天，反而过得最舒服](https://www.youtube.com/watch?v=QOFhaDA3X3Q)"
    );
    expect(parsed?.videoTitle).toBe("没有安排的一天，反而过得最舒服");
    expect(parsed?.youtubeUrl).toBe(
      "https://www.youtube.com/watch?v=QOFhaDA3X3Q"
    );
  });
});

describe("parseFeishuDoc", () => {
  it("splits fixture into H3 video sections with sections and tables", () => {
    const sections = parseFeishuDoc(fixture);
    expect(sections.length).toBeGreaterThanOrEqual(1);
    const first = sections[0];
    expect(first.creatorName).toContain("Leah");
    expect(first.videoTitle).toContain("没有安排的一天");
    expect(first.youtubeUrl).toBe(
      "https://www.youtube.com/watch?v=QOFhaDA3X3Q"
    );
    expect(first.blocks.some((block) => block.type === "table")).toBe(true);
    expect(first.blocks.some((block) => block.type === "section")).toBe(true);
    expect(first.blocks.some((block) => block.type === "bullet")).toBe(true);
  });
});

describe("parseVocabTableRows", () => {
  it("pairs english and chinese cells", () => {
    const items = parseVocabTableRows([
      ["sew", "缝", "loose", "松动的", "wiggly", "不平整的"],
    ]);
    expect(items).toEqual([
      { phrase: "sew", meaning: "缝", example_en: null, phonetic: null },
      { phrase: "loose", meaning: "松动的", example_en: null, phonetic: null },
      {
        phrase: "wiggly",
        meaning: "不平整的",
        example_en: null,
        phonetic: null,
      },
    ]);
  });

  it("strips IPA into phonetic on English cells", () => {
    const items = parseVocabTableRows([
      ["ginormous /dʒaɪˈnɔːrməs/", "巨大的"],
    ]);
    expect(items).toEqual([
      {
        phrase: "ginormous",
        meaning: "巨大的",
        example_en: null,
        phonetic: "/dʒaɪˈnɔːrməs/",
      },
    ]);
  });
});

describe("feishu vocab filter", () => {
  it("detects whole word containment", () => {
    expect(isWholeWordContained("crochet", "working on a crochet project")).toBe(
      true
    );
    expect(isWholeWordContained("in", "interesting")).toBe(false);
  });

  it("filters table words covered by ingested phrases", () => {
    const filtered = filterSubsumedTableVocab(
      [
        { phrase: "crochet", meaning: "钩针" },
        { phrase: "sew", meaning: "缝" },
      ],
      [{ phrase: "crochet project", example_en: "a crochet project" }]
    );
    expect(filtered.map((item) => item.phrase)).toEqual(["sew"]);
  });
});

describe("feishu sync policy", () => {
  it("marks stale after 6 hours", () => {
    const now = new Date("2026-07-03T18:00:00Z");
    const last = new Date("2026-07-03T10:00:00Z").toISOString();
    expect(isFeishuSyncStale(last, now)).toBe(true);
    expect(isFeishuSyncStale(null, now)).toBe(true);
  });

  it("formats status label", () => {
    const now = new Date("2026-07-03T18:00:00Z");
    const twoHoursAgo = new Date("2026-07-03T16:00:00Z").toISOString();
    expect(formatFeishuSyncStatusLabel(twoHoursAgo, now)).toBe(
      "Feishu ✓ Synced 2 hours ago"
    );
    expect(formatFeishuSyncStatusLabel(null, now)).toBe("Feishu · Not synced yet");
  });
});
