import { splitEmbeddedPhonetic } from "@/lib/feishu-phonetic";

export type TableVocabItem = {
  phrase: string;
  meaning: string;
  example_en: string;
  phonetic: string | null;
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
      const { lemma, phonetic } = splitEmbeddedPhonetic(en);
      items.push({
        phrase: lemma,
        meaning: zh,
        example_en: lemma,
        phonetic,
      });
    }
  }

  return items;
}
