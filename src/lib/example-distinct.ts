/** True when example is a real usage sentence, not a copy of the lemma/phrase. */
export function isDistinctExample(
  example: string | null | undefined,
  phrase: string | null | undefined
): boolean {
  const exampleText = example?.trim() ?? "";
  const phraseText = phrase?.trim() ?? "";
  if (!exampleText) return false;
  if (!phraseText) return true;

  const normalize = (value: string) =>
    value
      .toLowerCase()
      .replace(/[.…,;:!?]+$/g, "")
      .replace(/\s+/g, " ")
      .trim();

  return normalize(exampleText) !== normalize(phraseText);
}
