import { normalizePhraseKey } from "@/lib/merge-expressions";
import type { ExtractedExpression } from "@/types/expression";

const STOPWORDS = new Set([
  "a",
  "an",
  "the",
  "to",
  "of",
  "in",
  "on",
  "at",
  "for",
  "and",
  "or",
  "but",
  "is",
  "are",
  "was",
  "were",
  "be",
  "been",
  "being",
  "have",
  "has",
  "had",
  "do",
  "does",
  "did",
  "will",
  "would",
  "could",
  "should",
  "may",
  "might",
  "must",
  "shall",
  "can",
  "it",
  "its",
  "i",
  "you",
  "he",
  "she",
  "we",
  "they",
  "me",
  "him",
  "her",
  "us",
  "them",
  "my",
  "your",
  "his",
  "our",
  "their",
  "this",
  "that",
  "these",
  "those",
  "with",
  "from",
  "by",
  "as",
  "so",
  "if",
  "not",
  "no",
  "up",
  "out",
  "about",
  "into",
  "over",
  "after",
  "before",
  "than",
  "then",
  "when",
  "what",
  "which",
  "who",
  "how",
  "why",
  "where",
  "there",
  "here",
  "just",
  "very",
  "too",
  "also",
  "all",
  "some",
  "any",
  "each",
  "every",
  "both",
  "few",
  "more",
  "most",
  "other",
  "such",
  "only",
  "own",
  "same",
]);

function tokenizePhrase(phrase: string): string[] {
  return phrase
    .toLowerCase()
    .replace(/[^a-z'\s-]/g, " ")
    .split(/\s+/)
    .filter(Boolean);
}

export function isTrivialPhrase(phrase: string): boolean {
  const trimmed = phrase.trim();
  if (!trimmed || trimmed.length < 3) {
    return true;
  }

  const tokens = tokenizePhrase(trimmed);
  if (tokens.length < 2) {
    return true;
  }

  if (tokens.every((token) => STOPWORDS.has(token))) {
    return true;
  }

  return false;
}

/** Reject clip-tense fragments the prompt asks to normalize (e.g. takes → take). */
export function looksClipInflected(phrase: string): boolean {
  const trimmed = phrase.trim();
  if (
    /^(takes|blocks|makes|gets|goes|does|has|comes|includes|notices|stands|keeps)\s/i.test(
      trimmed
    )
  ) {
    return true;
  }
  if (
    /^(spending|blocking|taking|making|getting|going|doing|being|having|standing|including|noticing|learning|keeping)\s/i.test(
      trimmed
    )
  ) {
    return true;
  }
  return false;
}

function normalizeExampleKey(example: string): string {
  return example.toLowerCase().replace(/\s+/g, " ").trim();
}

function isSubstringPhrase(shorter: string, longer: string): boolean {
  if (shorter === longer) {
    return true;
  }
  const shortTokens = tokenizePhrase(shorter);
  const longTokens = tokenizePhrase(longer);
  if (shortTokens.length >= longTokens.length) {
    return false;
  }

  for (let i = 0; i <= longTokens.length - shortTokens.length; i += 1) {
    if (shortTokens.every((token, index) => token === longTokens[i + index])) {
      return true;
    }
  }

  return false;
}

function dedupeOverlappingPhrases(
  expressions: ExtractedExpression[]
): ExtractedExpression[] {
  const sorted = [...expressions].sort(
    (a, b) => tokenizePhrase(b.phrase).length - tokenizePhrase(a.phrase).length
  );
  const kept: ExtractedExpression[] = [];

  for (const item of sorted) {
    const key = normalizePhraseKey(item.phrase);
    const overlaps = kept.some((existing) => {
      const existingKey = normalizePhraseKey(existing.phrase);
      return (
        existingKey === key ||
        isSubstringPhrase(key, existingKey) ||
        isSubstringPhrase(existingKey, key)
      );
    });
    if (!overlaps) {
      kept.push(item);
    }
  }

  return kept;
}

function dedupeSameExample(
  expressions: ExtractedExpression[]
): ExtractedExpression[] {
  const byExample = new Map<string, ExtractedExpression>();

  for (const item of expressions) {
    const exampleKey = normalizeExampleKey(item.example);
    const existing = byExample.get(exampleKey);
    if (!existing) {
      byExample.set(exampleKey, item);
      continue;
    }

    if (tokenizePhrase(item.phrase).length > tokenizePhrase(existing.phrase).length) {
      byExample.set(exampleKey, item);
    }
  }

  return [...byExample.values()];
}

/** Code-level quality filter after LLM parse (direction C). */
export function filterLowQualityExpressions(
  expressions: ExtractedExpression[]
): ExtractedExpression[] {
  const nonTrivial = expressions.filter(
    (item) =>
      !isTrivialPhrase(item.phrase) && !looksClipInflected(item.phrase)
  );
  return dedupeSameExample(dedupeOverlappingPhrases(nonTrivial));
}
