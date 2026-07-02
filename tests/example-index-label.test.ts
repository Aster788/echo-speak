import { describe, expect, it } from "vitest";
import { formatExampleIndexLabel } from "@/lib/example-index-label";

describe("formatExampleIndexLabel", () => {
  it("zero-pads single-digit indices", () => {
    expect(formatExampleIndexLabel(0)).toBe("01");
    expect(formatExampleIndexLabel(8)).toBe("09");
  });

  it("does not pad past nine", () => {
    expect(formatExampleIndexLabel(9)).toBe("10");
    expect(formatExampleIndexLabel(10)).toBe("11");
  });
});
