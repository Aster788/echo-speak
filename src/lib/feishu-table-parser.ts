export type TableVocabItem = {
  phrase: string;
  meaning: string;
  example_en: string;
};

function stripMarkdownEscapes(text: string): string {
  return text.replace(/\\([._\-])/g, "$1").trim();
}

export function parseVocabTableRows(rows: string[][]): TableVocabItem[] {
  const items: TableVocabItem[] = [];

  for (const row of rows) {
    const cells = row.map(stripMarkdownEscapes).filter(Boolean);
    for (let i = 0; i + 1 < cells.length; i += 2) {
      const en = cells[i];
      const zh = cells[i + 1];
      if (!en || !zh) continue;
      if (/^[-:]+$/.test(en) || /^[-:]+$/.test(zh)) continue;
      items.push({
        phrase: en,
        meaning: zh,
        example_en: en,
      });
    }
  }

  return items;
}
