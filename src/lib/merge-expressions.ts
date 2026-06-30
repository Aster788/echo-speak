import { canonicalKey } from "@/lib/phrase-canonical";
import type { ExtractedExpression } from "@/types/expression";

export function normalizePhraseKey(phrase: string): string {
  return phrase.toLowerCase().replace(/\s+/g, " ").trim();
}

export function filterDismissedExpressions(
  expressions: ExtractedExpression[],
  dismissedKeys: Set<string>
): ExtractedExpression[] {
  // Canonicalize dismissed keys so near-duplicates (e.g. "let go of something"
  // vs "let go of") are also blocked, matching the canonical dedup logic.
  const canonicalDismissed = new Set<string>();
  for (const key of dismissedKeys) {
    const c = canonicalKey(key);
    canonicalDismissed.add(c || key);
  }
  return expressions.filter(
    (item) => !canonicalDismissed.has(canonicalKey(item.phrase))
  );
}

export function mergeExtractedExpressions(
  batches: ExtractedExpression[][]
): ExtractedExpression[] {
  const seen = new Set<string>();
  const merged: ExtractedExpression[] = [];

  for (const batch of batches) {
    for (const item of batch) {
      const key = normalizePhraseKey(item.phrase);
      if (!key || seen.has(key)) {
        continue;
      }
      seen.add(key);
      merged.push(item);
    }
  }

  return merged;
}
