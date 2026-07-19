import { isWholeWordContained } from "@/lib/feishu-vocab-filter";

function stripLightMarkdown(text: string): string {
  return text
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/\*([^*]+)\*/g, "$1")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeComparable(text: string): string {
  return text.trim().toLowerCase().replace(/\s+/g, " ");
}

/**
 * Replace a short *example sentence* with a longer note line that contains it.
 *
 * Does **not** invent examples for bare lemmas: if `short` equals `phrase`
 * (or is empty), the input is returned unchanged.
 */
export function expandExampleFromNote(
  short: string,
  candidateLines: string[],
  options?: { phrase?: string | null }
): string {
  const needle = short.trim();
  if (!needle) return short;

  const phrase = options?.phrase?.trim();
  if (phrase && normalizeComparable(needle) === normalizeComparable(phrase)) {
    return short;
  }

  let best: string | null = null;
  for (const raw of candidateLines) {
    const line = stripLightMarkdown(raw);
    if (!line || line.length <= needle.length) continue;
    if (normalizeComparable(line) === normalizeComparable(needle)) continue;
    if (!isWholeWordContained(needle, line)) continue;
    if (!best || line.length > best.length) {
      best = line;
    }
  }

  return best ?? short;
}
