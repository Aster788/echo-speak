import { describe, expect, it } from "vitest";
import {
  buildScheme2Rows,
  formatScheme2Markdown,
  summarizeScheme2,
  type Scheme2Row,
} from "@/lib/extraction-depth-stats";

describe("extraction-depth-stats", () => {
  it("summarizes median delete rate", () => {
    const rows: Scheme2Row[] = [
      {
        videoTitle: "A",
        extracted: 20,
        deleted: 3,
        kept: 17,
        cleanTextChars: 8000,
        notes: "",
      },
      {
        videoTitle: "B",
        extracted: 20,
        deleted: 5,
        kept: 15,
        cleanTextChars: 9000,
        notes: "",
      },
    ];
    const summary = summarizeScheme2(rows);
    expect(summary.totalExtracted).toBe(40);
    expect(summary.totalDeleted).toBe(8);
    expect(summary.medianDeleteRate).toBeCloseTo(0.2);
  });

  it("formats markdown table", () => {
    const md = formatScheme2Markdown([
      {
        videoTitle: "Test video",
        extracted: 20,
        deleted: 2,
        kept: 18,
        cleanTextChars: 5000,
        notes: "已会×2",
      },
    ]);
    expect(md).toContain("| Test video | 20 | 2 | 18 | 5000 |");
    expect(md).toContain("Median delete rate");
  });
});
