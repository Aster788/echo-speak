export type IngestedPhraseText = {
  phrase: string;
  example_en: string | null;
};

function escapeRegex(word: string): string {
  return word.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function isWholeWordContained(
  word: string,
  text: string
): boolean {
  const normalized = word.trim();
  if (!normalized) return false;
  const pattern = new RegExp(`\\b${escapeRegex(normalized)}\\b`, "i");
  return pattern.test(text);
}

export function filterSubsumedTableVocab<T extends { phrase: string }>(
  tableItems: T[],
  ingested: IngestedPhraseText[]
): T[] {
  const corpus = ingested
    .flatMap((item) => [item.phrase, item.example_en])
    .filter(Boolean)
    .join("\n");

  return tableItems.filter(
    (item) => !isWholeWordContained(item.phrase, corpus)
  );
}
