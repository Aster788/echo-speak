import { describe, expect, it } from "vitest";
import {
  isRecoverableClientError,
  shouldAutoReloadNow,
} from "@/lib/client-recovery";

describe("isRecoverableClientError", () => {
  it("matches chunk load failures after iOS tab freeze", () => {
    expect(
      isRecoverableClientError("Loading chunk 123 failed", "ChunkLoadError")
    ).toBe(true);
    expect(
      isRecoverableClientError(
        "Failed to fetch dynamically imported module"
      )
    ).toBe(true);
    expect(isRecoverableClientError("The operation was aborted", "AbortError")).toBe(
      true
    );
    expect(isRecoverableClientError("Failed to fetch")).toBe(true);
  });

  it("ignores unrelated app bugs", () => {
    expect(isRecoverableClientError("Cannot read properties of null")).toBe(
      false
    );
    expect(isRecoverableClientError(null, null)).toBe(false);
  });
});

describe("shouldAutoReloadNow", () => {
  it("allows first reload and enforces cooldown", () => {
    expect(shouldAutoReloadNow(1000, null)).toBe(true);
    expect(shouldAutoReloadNow(1000, 500)).toBe(false);
    expect(shouldAutoReloadNow(20_000, 1000)).toBe(true);
  });
});
