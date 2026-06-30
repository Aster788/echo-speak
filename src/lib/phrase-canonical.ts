/**
 * Canonical phrase key derivation for expression deduplication.
 *
 * Rules (applied in order):
 *  1. lowercase
 *  2. collapse internal whitespace, trim
 *  3. mid-phrase `things` → `something`
 *  4. reflexive variants (yourself, themselves, myself, himself, herself)
 *     → `oneself`
 *  5. drop trailing pronoun/placeholder tokens when they are the final token
 *     or follow a trailing preposition:
 *     something, sb, sth, oneself, yourself, themselves, things, it, them
 */

const TRAILING_DROPPABLE = new Set([
  "something",
  "sb",
  "sth",
  "things",
  "it",
  "them",
]);

const REFLEXIVE_MAP: Record<string, string> = {
  yourself: "oneself",
  themselves: "oneself",
  myself: "oneself",
  himself: "oneself",
  herself: "oneself",
};

function normalizeTokens(tokens: string[]): string[] {
  const out: string[] = [];
  for (const token of tokens) {
    let t = token;
    // mid-phrase things → something
    if (t === "things") t = "something";
    // reflexive normalization
    if (REFLEXIVE_MAP[t]) t = REFLEXIVE_MAP[t];
    out.push(t);
  }
  return out;
}

function dropTrailingPlaceholders(tokens: string[]): string[] {
  // Drop trailing droppable tokens. A placeholder that follows a preposition
  // (e.g. "let go of something") is also trailing once we reach it; the
  // preposition itself is kept.
  let end = tokens.length;
  while (end > 0) {
    const last = tokens[end - 1];
    if (TRAILING_DROPPABLE.has(last)) {
      end -= 1;
      continue;
    }
    break;
  }
  return tokens.slice(0, end);
}

export function canonicalKey(phrase: string): string {
  const cleaned = phrase
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
  if (!cleaned) return "";

  const tokens = normalizeTokens(cleaned.split(" "));
  const trimmed = dropTrailingPlaceholders(tokens);
  return trimmed.join(" ").trim();
}

const REFLEXIVE_VARIANTS = new Set([
  "yourself",
  "themselves",
  "myself",
  "himself",
  "herself",
]);

/**
 * Choose the most general display phrase from a set of variants sharing a
 * canonical key. Preference order:
 *   1. form with no trailing droppable/reflexive token (most general;
 *      `oneself` counts as general, `yourself`/`themselves` do not)
 *   2. shortest length
 *   3. earliest in the input list (stable tiebreak, mirrors created_at order
 *      when callers preserve it)
 */
export function pickDisplayPhrase(phrases: string[]): string {
  if (phrases.length === 0) return "";
  if (phrases.length === 1) return phrases[0];

  const scored = phrases.map((phrase, index) => {
    const tokens = phrase.toLowerCase().replace(/\s+/g, " ").trim().split(" ");
    const last = tokens[tokens.length - 1] ?? "";
    const hasTrailingPlaceholder =
      TRAILING_DROPPABLE.has(last) || REFLEXIVE_VARIANTS.has(last);
    return {
      phrase,
      hasTrailingPlaceholder,
      length: phrase.length,
      index,
    };
  });

  scored.sort((a, b) => {
    if (a.hasTrailingPlaceholder !== b.hasTrailingPlaceholder) {
      return a.hasTrailingPlaceholder ? 1 : -1;
    }
    if (a.length !== b.length) return a.length - b.length;
    return a.index - b.index;
  });

  return scored[0].phrase;
}
