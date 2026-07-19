/**
 * Split Feishu table English cells that append IPA after (or inside) the lemma.
 * Examples: ginormous /…/, be bombarded /…/ by, croissant […] ,
 * and starred slash IPA wrappers from Feishu markdown.
 */

export type PhrasePhoneticParts = {
  lemma: string;
  phonetic: string | null;
};

/** IPA-ish content: stress marks, length, or non-ASCII latin phonetic letters. */
const IPA_INNER_RE = /[ˈˌːɑæəɛɪɔʊʌθðʃʒŋɡɒɜɾᵻᵿ]|[a-z]*[ɑæəɛɪɔʊʌθðʃʒŋ][a-z]*/i;

// Match slash/bracket IPA tokens (not plain alternates like get to/gotta).
const PHONETIC_TOKEN_RE =
  /(\*\/[^/\n]+?\/\*|(?<![A-Za-z])\/[^/\n]+?\/(?![A-Za-z])|(?<![A-Za-z])\[[^\]\n]+?\])/g;

function looksLikeIpa(inner: string): boolean {
  const trimmed = inner.trim();
  if (!trimmed) return false;
  if (IPA_INNER_RE.test(trimmed)) return true;
  // ASCII-only transcriptions that still use typical IPA letter combos
  return /[aeiouy].*[aeiouy]/i.test(trimmed) && /[ˈˌː.]/.test(trimmed);
}

function normalizeToken(raw: string): string {
  let t = raw.trim();
  if (t.startsWith("*/") && t.endsWith("/*")) {
    t = `/${t.slice(2, -2)}/`;
  }
  return t;
}

function tokenInner(token: string): string {
  const t = normalizeToken(token);
  if (t.startsWith("/") && t.endsWith("/")) return t.slice(1, -1);
  if (t.startsWith("[") && t.endsWith("]")) return t.slice(1, -1);
  return t;
}

/**
 * Peel IPA out of `phrase` for display; prefer stored `phonetic` when set.
 */
export function splitPhraseAndPhonetic(
  phrase: string,
  phonetic?: string | null
): PhrasePhoneticParts {
  const embedded = splitEmbeddedPhonetic(phrase);
  const stored = phonetic?.trim();
  return {
    lemma: embedded.lemma,
    phonetic: stored || embedded.phonetic,
  };
}

export function splitEmbeddedPhonetic(text: string): PhrasePhoneticParts {
  const input = text.trim();
  if (!input) return { lemma: "", phonetic: null };

  const phonetics: string[] = [];
  const lemma = input
    .replace(PHONETIC_TOKEN_RE, (match) => {
      const inner = tokenInner(match);
      if (!looksLikeIpa(inner)) return match;
      phonetics.push(normalizeToken(match));
      return " ";
    })
    .replace(/\s+/g, " ")
    .trim();

  if (phonetics.length === 0) {
    return { lemma: input, phonetic: null };
  }

  return {
    lemma: lemma || input,
    phonetic: phonetics.join(" "),
  };
}
