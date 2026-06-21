import { describe, expect, it } from "vitest";
import { hashTranscriptContent } from "@/lib/transcript-content-hash";
import { titleFromTranscriptFilename } from "@/lib/transcript-filename";

describe("titleFromTranscriptFilename", () => {
  it("strips extension and replaces separators", () => {
    expect(titleFromTranscriptFilename("a-normal-day.srt")).toBe("a normal day");
    expect(titleFromTranscriptFilename("my_vlog.txt")).toBe("my vlog");
  });
});

describe("hashTranscriptContent", () => {
  it("matches identical text with different line endings", () => {
    const a = hashTranscriptContent("Hello\r\nWorld");
    const b = hashTranscriptContent("Hello\nWorld");
    expect(a).toBe(b);
  });

  it("differs when transcript content differs", () => {
    const a = hashTranscriptContent("Hello world");
    const b = hashTranscriptContent("Hello world!");
    expect(a).not.toBe(b);
  });
});
