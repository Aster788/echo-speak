import { describe, expect, it } from "vitest";
import {
  parseSrt,
  parseTranscriptFile,
  parseTxt,
} from "@/lib/transcript-parse";

describe("transcript-parse", () => {
  it("parseTxt trims content", () => {
    expect(parseTxt("  Hello world  \n")).toBe("Hello world");
  });

  it("parseSrt extracts cue text", () => {
    const srt = `1
00:00:01,000 --> 00:00:04,000
Hello there.

2
00:00:05,000 --> 00:00:08,000
General Kenobi.`;

    expect(parseSrt(srt)).toBe("Hello there.\n\nGeneral Kenobi.");
  });

  it("parseTranscriptFile handles txt buffer", () => {
    const buffer = Buffer.from("Plain transcript line", "utf-8");
    expect(parseTranscriptFile(buffer, "notes.txt")).toBe(
      "Plain transcript line"
    );
  });

  it("parseSrt handles cues without blank lines between blocks", () => {
    const srt = `1
00:00:00,000 --> 00:00:02,500
Hello everyone.
2
00:00:03,000 --> 00:00:06,000
Second line.`;

    expect(parseSrt(srt)).toBe("Hello everyone.\n\nSecond line.");
  });

  it("parseTranscriptFile throws on empty srt", () => {
    const buffer = Buffer.from("1\n00:00:00,000 --> 00:00:01,000\n", "utf-8");
    expect(() => parseTranscriptFile(buffer, "empty.srt")).toThrow(
      /Could not extract text/
    );
  });

  it("parseTranscriptFile handles srt buffer", () => {
    const srt = `1
00:00:00,000 --> 00:00:02,000
First line.`;
    const buffer = Buffer.from(srt, "utf-8");
    expect(parseTranscriptFile(buffer, "video.srt")).toBe("First line.");
  });
});
