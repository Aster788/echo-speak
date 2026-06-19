/** True when a line is mostly Chinese (translation), not primary English content. */
export function isPrimarilyChineseLine(line: string): boolean {
  const trimmed = line.trim();
  if (!trimmed) return false;

  const cjk = (trimmed.match(/[\u4e00-\u9fff\u3400-\u4dbf]/g) ?? []).length;
  const latin = (trimmed.match(/[a-zA-Z]/g) ?? []).length;

  if (cjk === 0) return false;
  if (latin === 0) return true;

  return cjk >= latin;
}

/** Drop translation lines from bilingual SRT/TXT/paste; keep English lines. */
export function keepEnglishLinesOnly(text: string): string {
  return text
    .split(/\r?\n/)
    .filter((line) => {
      const trimmed = line.trim();
      if (!trimmed) return false;
      return !isPrimarilyChineseLine(trimmed);
    })
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}
