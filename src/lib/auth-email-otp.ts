/** Must match `otp_expiry` in supabase/config.toml (and cloud Auth settings). */
export const EMAIL_OTP_EXPIRY_SECONDS = 300;

export const EMAIL_OTP_EXPIRY_LABEL = "5 minutes";

export const EMAIL_OTP_LENGTH = 6;

export function emailOtpSentMessage(email: string): string {
  return `Code sent to ${email}.\nEnter the ${EMAIL_OTP_LENGTH}-digit code within ${EMAIL_OTP_EXPIRY_LABEL}.`;
}

export function emailOtpHelperText(): string {
  return `Enter your email above to receive a ${EMAIL_OTP_LENGTH}-digit sign-in code.`;
}

export function emailOtpCodeHelperText(email: string): string {
  return `Enter the ${EMAIL_OTP_LENGTH}-digit code from your email to sign in.`;
}

export type EmailOtpAuthReason = "expired" | "invalid" | "failed";

export function emailOtpAuthErrorMessage(
  reason: EmailOtpAuthReason | null | undefined
): string {
  switch (reason) {
    case "expired":
      return `That code has expired (codes last ${EMAIL_OTP_EXPIRY_LABEL}). Send a new one below.`;
    case "invalid":
      return "That code is incorrect or already used. Check the email and try again, or send a new code.";
    default:
      return `We could not sign you in. Send a fresh code below (valid for ${EMAIL_OTP_EXPIRY_LABEL}).`;
  }
}

export function parseEmailOtpAuthReason(
  value: string | undefined
): EmailOtpAuthReason | null {
  if (value === "expired" || value === "invalid" || value === "failed") {
    return value;
  }
  return value ? "failed" : null;
}

export function classifyEmailOtpVerifyError(message: string): EmailOtpAuthReason {
  const lower = message.toLowerCase();
  if (lower.includes("expired")) {
    return "expired";
  }
  if (
    lower.includes("invalid") ||
    lower.includes("incorrect") ||
    lower.includes("already") ||
    lower.includes("used")
  ) {
    return "invalid";
  }
  return "failed";
}

export function normalizeEmailOtpCode(raw: string): string {
  return raw.replace(/\D/g, "").slice(0, EMAIL_OTP_LENGTH);
}

export function isValidEmailOtpCode(code: string): boolean {
  return new RegExp(`^\\d{${EMAIL_OTP_LENGTH}}$`).test(code);
}
