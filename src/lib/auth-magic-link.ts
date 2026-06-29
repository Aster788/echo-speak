/** Must match `otp_expiry` in supabase/config.toml (and cloud Auth settings). */
export const MAGIC_LINK_OTP_EXPIRY_SECONDS = 300;

export const MAGIC_LINK_EXPIRY_LABEL = "5 minutes";

export function magicLinkSentMessage(): string {
  return `Email sent. Open the link within ${MAGIC_LINK_EXPIRY_LABEL} — each link works only once.`;
}

export function magicLinkHelperText(): string {
  return `We email a one-time link. It expires in ${MAGIC_LINK_EXPIRY_LABEL}, works once, and should be opened on this device. No code to type.`;
}

export type MagicLinkAuthReason = "expired" | "used" | "failed";

export function magicLinkAuthErrorMessage(
  reason: MagicLinkAuthReason | null | undefined
): string {
  switch (reason) {
    case "expired":
      return `That sign-in link has expired (links last ${MAGIC_LINK_EXPIRY_LABEL}). Send a new one below.`;
    case "used":
      return "That link was already used or is invalid. Each link works once — send a new one below.";
    default:
      return `We could not sign you in. Send a fresh link below (valid for ${MAGIC_LINK_EXPIRY_LABEL}, one use only).`;
  }
}

export function parseMagicLinkAuthReason(
  value: string | undefined
): MagicLinkAuthReason | null {
  if (value === "expired" || value === "used" || value === "failed") {
    return value;
  }
  return value ? "failed" : null;
}

export function classifyMagicLinkVerifyError(message: string): MagicLinkAuthReason {
  const lower = message.toLowerCase();
  if (lower.includes("expired")) {
    return "expired";
  }
  if (
    lower.includes("invalid") ||
    lower.includes("already") ||
    lower.includes("used")
  ) {
    return "used";
  }
  return "failed";
}
