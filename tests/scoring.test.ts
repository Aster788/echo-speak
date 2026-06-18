import { describe, expect, it } from "vitest";
import { adjustScore, initialScore } from "@/lib/scoring";

describe("scoring", () => {
  it("returns initial score of 0.2", () => {
    expect(initialScore()).toBe(0.2);
  });

  it("increases score on good rating", () => {
    expect(adjustScore(0.5, 5)).toBeGreaterThan(0.5);
  });

  it("decreases score on poor rating", () => {
    expect(adjustScore(0.5, 1)).toBeLessThan(0.5);
  });

  it("clamps score between 0 and 1", () => {
    expect(adjustScore(0.95, 5)).toBeLessThanOrEqual(1);
    expect(adjustScore(0.05, 1)).toBeGreaterThanOrEqual(0);
  });
});
