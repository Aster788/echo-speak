import { describe, expect, it } from "vitest";
import {
  classifyEmailOtpVerifyError,
  emailOtpAuthErrorMessage,
  EMAIL_OTP_EXPIRY_LABEL,
  EMAIL_OTP_LENGTH,
  isValidEmailOtpCode,
  normalizeEmailOtpCode,
  parseEmailOtpAuthReason,
} from "@/lib/auth-email-otp";

describe("email OTP auth copy", () => {
  it("labels expiry as 5 minutes", () => {
    expect(EMAIL_OTP_EXPIRY_LABEL).toBe("5 minutes");
    expect(emailOtpAuthErrorMessage("expired")).toContain("5 minutes");
  });

  it("classifies verify errors", () => {
    expect(classifyEmailOtpVerifyError("Email link is invalid or has expired")).toBe(
      "expired"
    );
    expect(classifyEmailOtpVerifyError("OTP already used")).toBe("invalid");
  });

  it("parses auth reason query values", () => {
    expect(parseEmailOtpAuthReason("expired")).toBe("expired");
    expect(parseEmailOtpAuthReason(undefined)).toBeNull();
  });

  it("normalizes and validates codes", () => {
    expect(normalizeEmailOtpCode("12 34-56")).toBe("123456");
    expect(isValidEmailOtpCode("123456")).toBe(true);
    expect(isValidEmailOtpCode("12345")).toBe(false);
    expect(EMAIL_OTP_LENGTH).toBe(6);
  });
});
