import { describe, expect, it } from "vitest";
import {
  classifyMagicLinkVerifyError,
  magicLinkAuthErrorMessage,
  MAGIC_LINK_EXPIRY_LABEL,
  parseMagicLinkAuthReason,
} from "@/lib/auth-magic-link";

describe("magic link copy", () => {
  it("labels expiry as 5 minutes", () => {
    expect(MAGIC_LINK_EXPIRY_LABEL).toBe("5 minutes");
    expect(magicLinkAuthErrorMessage("expired")).toContain("5 minutes");
  });

  it("classifies verify errors", () => {
    expect(classifyMagicLinkVerifyError("Email link is invalid or has expired")).toBe(
      "expired"
    );
    expect(classifyMagicLinkVerifyError("OTP already used")).toBe("used");
  });

  it("parses auth reason query values", () => {
    expect(parseMagicLinkAuthReason("expired")).toBe("expired");
    expect(parseMagicLinkAuthReason(undefined)).toBeNull();
  });
});
