/**
 * Convert Feishu Docx block tree into Markdown suitable for `parseFeishuDoc`.
 * Preserves heading hyperlinks and table cell text that `raw_content` strips.
 */

export type FeishuTextElement = {
  text_run?: {
    content?: string;
    text_element_style?: {
      link?: { url?: string };
    };
  };
};

export type FeishuTextContainer = {
  elements?: FeishuTextElement[];
};

export type FeishuDocBlock = {
  block_id: string;
  block_type: number;
  parent_id?: string;
  children?: string[];
  page?: FeishuTextContainer;
  text?: FeishuTextContainer;
  heading1?: FeishuTextContainer;
  heading2?: FeishuTextContainer;
  heading3?: FeishuTextContainer;
  bullet?: FeishuTextContainer;
  ordered?: FeishuTextContainer;
  table?: {
    cells?: string[];
    property?: {
      column_size?: number;
      row_size?: number;
    };
  };
  table_cell?: Record<string, unknown>;
  grid?: { column_size?: number };
  column?: Record<string, unknown>;
  divider?: Record<string, unknown>;
};

const BLOCK_PAGE = 1;
const BLOCK_TEXT = 2;
const BLOCK_HEADING1 = 3;
const BLOCK_HEADING2 = 4;
const BLOCK_HEADING3 = 5;
const BLOCK_BULLET = 12;
const BLOCK_ORDERED = 13;
const BLOCK_DIVIDER = 22;
const BLOCK_GRID = 24;
const BLOCK_COLUMN = 25;
const BLOCK_TABLE = 31;
const BLOCK_TABLE_CELL = 32;

export function elementsToMarkdown(elements: FeishuTextElement[] | undefined): string {
  if (!elements?.length) return "";
  let out = "";
  for (const element of elements) {
    const run = element.text_run;
    if (!run) continue;
    const content = run.content ?? "";
    const encoded = run.text_element_style?.link?.url;
    if (encoded) {
      let url = encoded;
      try {
        url = decodeURIComponent(encoded);
      } catch {
        // keep encoded
      }
      out += `[${content}](${url})`;
    } else {
      out += content;
    }
  }
  return out;
}

function cellPlainText(
  cellId: string,
  byId: Map<string, FeishuDocBlock>
): string {
  const cell = byId.get(cellId);
  if (!cell) return "";
  const parts: string[] = [];
  for (const childId of cell.children ?? []) {
    const child = byId.get(childId);
    if (!child) continue;
    if (child.block_type === BLOCK_TEXT) {
      parts.push(elementsToMarkdown(child.text?.elements));
    } else if (child.block_type === BLOCK_BULLET) {
      parts.push(elementsToMarkdown(child.bullet?.elements));
    }
  }
  return parts.join(" ").trim();
}

function tableToMarkdown(
  block: FeishuDocBlock,
  byId: Map<string, FeishuDocBlock>
): string[] {
  const cells = block.table?.cells ?? [];
  const cols = block.table?.property?.column_size ?? 0;
  if (cols <= 0 || cells.length === 0) return [];

  const rows: string[][] = [];
  for (let i = 0; i < cells.length; i += cols) {
    rows.push(
      cells.slice(i, i + cols).map((cellId) => cellPlainText(cellId, byId))
    );
  }
  if (rows.length === 0) return [];

  const lines: string[] = [];
  lines.push(`| ${rows[0]!.map((c) => c || " ").join(" | ")} |`);
  lines.push(`| ${rows[0]!.map(() => "---").join(" | ")} |`);
  for (const row of rows.slice(1)) {
    lines.push(`| ${row.map((c) => c || " ").join(" | ")} |`);
  }
  lines.push("");
  return lines;
}

function emitBlock(
  blockId: string,
  byId: Map<string, FeishuDocBlock>,
  lines: string[]
): void {
  const block = byId.get(blockId);
  if (!block) return;

  switch (block.block_type) {
    case BLOCK_PAGE: {
      for (const childId of block.children ?? []) {
        emitBlock(childId, byId, lines);
      }
      return;
    }
    case BLOCK_HEADING1: {
      const text = elementsToMarkdown(block.heading1?.elements).trim();
      if (text) lines.push(`# ${text}`, "");
      return;
    }
    case BLOCK_HEADING2: {
      const text = elementsToMarkdown(block.heading2?.elements).trim();
      if (text) lines.push(`## ${text}`, "");
      return;
    }
    case BLOCK_HEADING3: {
      const text = elementsToMarkdown(block.heading3?.elements).trim();
      if (text) lines.push(`### ${text}`, "");
      return;
    }
    case BLOCK_TEXT: {
      const text = elementsToMarkdown(block.text?.elements).trim();
      if (text) lines.push(text, "");
      return;
    }
    case BLOCK_BULLET: {
      const text = elementsToMarkdown(block.bullet?.elements).trim();
      if (text) lines.push(`- ${text}`);
      return;
    }
    case BLOCK_ORDERED: {
      const text = elementsToMarkdown(block.ordered?.elements).trim();
      if (text) lines.push(`- ${text}`);
      return;
    }
    case BLOCK_TABLE: {
      lines.push(...tableToMarkdown(block, byId));
      return;
    }
    case BLOCK_GRID:
    case BLOCK_COLUMN: {
      for (const childId of block.children ?? []) {
        emitBlock(childId, byId, lines);
      }
      return;
    }
    case BLOCK_DIVIDER:
    case BLOCK_TABLE_CELL:
      return;
    default: {
      for (const childId of block.children ?? []) {
        emitBlock(childId, byId, lines);
      }
    }
  }
}

/** Convert a flat Feishu blocks list into Markdown for `parseFeishuDoc`. */
export function feishuBlocksToMarkdown(blocks: FeishuDocBlock[]): string {
  const byId = new Map(blocks.map((block) => [block.block_id, block]));
  const page =
    blocks.find((block) => block.block_type === BLOCK_PAGE) ?? blocks[0];
  if (!page) return "";

  const lines: string[] = [];
  emitBlock(page.block_id, byId, lines);
  return lines.join("\n").trim() + "\n";
}
