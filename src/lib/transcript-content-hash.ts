import { createHash } from "crypto";

export function normalizeTranscriptForHash(text: string): string {
  return text.replace(/\r\n/g, "\n").trim();
}

export function hashTranscriptContent(text: string): string {
  return createHash("sha256")
    .update(normalizeTranscriptForHash(text))
    .digest("hex");
}
