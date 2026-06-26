import { describe, expect, it } from "vitest";
import {
  getChunkExpressionCap,
  getChunkExtractCap,
  getVideoExpressionTarget,
  resolveExtractionDepth,
  sampleChunkCaps,
} from "@/lib/extraction-depth";

describe("extraction-depth", () => {
  it("defaults to standard depth", () => {
    expect(resolveExtractionDepth()).toBe("standard");
    expect(resolveExtractionDepth("deep")).toBe("deep");
  });

  it("standard caps scale with chunk length (6–15)", () => {
    expect(getChunkExpressionCap(3_000, "standard")).toBe(6);
    expect(getChunkExpressionCap(8_000, "standard")).toBe(8);
    expect(getChunkExpressionCap(12_000, "standard")).toBe(12);
    expect(getChunkExpressionCap(20_000, "standard")).toBe(15);
  });

  it("deep caps scale higher (12–30)", () => {
    expect(getChunkExpressionCap(6_000, "deep")).toBe(12);
    expect(getChunkExpressionCap(12_000, "deep")).toBe(20);
    expect(getChunkExpressionCap(20_000, "deep")).toBe(30);
  });

  it("extract cap overfetches for rank pass", () => {
    expect(getChunkExtractCap(12_000, "standard")).toBeGreaterThan(
      getChunkExpressionCap(12_000, "standard")
    );
  });

  it("video target sums per-chunk caps", () => {
    const partA = "a".repeat(8_000);
    const partB = "b".repeat(8_000);
    const text = `${partA}\n\n${partB}`;
    const target = getVideoExpressionTarget(text, "standard");
    expect(target).toBe(
      getChunkExpressionCap(partA.length, "standard") +
        getChunkExpressionCap(partB.length, "standard")
    );
  });

  it("sample table for calibration docs", () => {
    const rows = sampleChunkCaps([4_000, 8_000, 12_000], "standard");
    expect(rows[0]?.selectCap).toBe(6);
    expect(rows[2]?.selectCap).toBe(12);
  });
});
