import type { ExtractedExpression } from "@/types/expression";

export function normalizePhraseKey(phrase: string): string {
  return phrase.toLowerCase().replace(/\s+/g, " ").trim();
}

export function filterDismissedExpressions(
  expressions: ExtractedExpression[],
  dismissedKeys: Set<string>
): ExtractedExpression[] {
  return expressions.filter(
    (item) => !dismissedKeys.has(normalizePhraseKey(item.phrase))
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
