import { extractYoutubeVideoId, normalizeYoutubeWatchUrl } from "@/lib/youtube-oembed";

export type FeishuBlock =
  | { type: "table"; rows: string[][] }
  | { type: "section"; label: string }
  | { type: "bullet"; text: string; section: string | null }
  | { type: "phrase"; text: string; section: string | null };

export type FeishuDocVideoSection = {
  creatorName: string | null;
  videoTitle: string;
  youtubeUrl: string | null;
  blocks: FeishuBlock[];
};

const H1_RE = /^#\s+(?!#)(.+)$/;
const H3_RE = /^###\s+(.+)$/;
const SECTION_RE = /^【(.+?)】\s*$/;
const BULLET_RE = /^-\s+(.+)$/;
const TABLE_SEP_RE = /^\|?[\s:-]+\|[\s|:-]+$/;

export function parseCreatorFromH1(line: string): string | null {
  const match = line.match(H1_RE);
  if (!match) return null;
  const raw = match[1].trim();
  const linkMatch = raw.match(/\[([^\]]+)\]/);
  if (linkMatch) {
    return linkMatch[1].trim() || null;
  }
  return raw.replace(/^[\p{Emoji_Presentation}\p{Extended_Pictographic}\s]+/u, "").trim() || null;
}

export function parseH3Heading(line: string): {
  videoTitle: string;
  youtubeUrl: string | null;
} | null {
  const match = line.match(H3_RE);
  if (!match) return null;
  const raw = match[1].trim();
  const linkMatch = raw.match(/\[([^\]]+)\]\(([^)]+)\)/);
  if (linkMatch) {
    const title = linkMatch[1].trim();
    const url = normalizeYoutubeWatchUrl(linkMatch[2].trim());
    return { videoTitle: title, youtubeUrl: url };
  }
  const title = raw.replace(/^[\p{Emoji_Presentation}\p{Extended_Pictographic}\s]+/u, "").trim();
  const urlMatch = raw.match(/https?:\/\/[^\s)]+/);
  const youtubeUrl = urlMatch ? normalizeYoutubeWatchUrl(urlMatch[0]) : null;
  return { videoTitle: title, youtubeUrl };
}

function parseTableRow(line: string): string[] {
  const trimmed = line.trim();
  if (!trimmed.includes("|")) return [];
  const inner = trimmed.replace(/^\|/, "").replace(/\|$/, "");
  return inner.split("|").map((cell) => cell.trim());
}

function isTableSeparator(line: string): boolean {
  return TABLE_SEP_RE.test(line.trim());
}

export function parseFeishuDoc(markdown: string): FeishuDocVideoSection[] {
  const lines = markdown.split(/\r?\n/);
  const sections: FeishuDocVideoSection[] = [];
  let creatorName: string | null = null;
  let currentSection: string | null = null;
  let inTable = false;
  let tableRows: string[][] = [];

  function activeVideo(): FeishuDocVideoSection | undefined {
    return sections.at(-1);
  }

  function flushTable() {
    const video = activeVideo();
    if (tableRows.length > 0 && video) {
      video.blocks.push({ type: "table", rows: tableRows });
    }
    tableRows = [];
    inTable = false;
  }

  function startVideo(h3: { videoTitle: string; youtubeUrl: string | null }) {
    flushTable();
    sections.push({
      creatorName,
      videoTitle: h3.videoTitle,
      youtubeUrl: h3.youtubeUrl,
      blocks: [],
    });
    currentSection = null;
  }

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed === "---") {
      if (inTable) flushTable();
      continue;
    }

    if (H1_RE.test(trimmed) && !H3_RE.test(trimmed)) {
      if (inTable) flushTable();
      creatorName = parseCreatorFromH1(trimmed);
      continue;
    }

    const h3 = parseH3Heading(trimmed);
    if (h3) {
      startVideo(h3);
      continue;
    }

    const video = activeVideo();
    if (!video) continue;

    const sectionMatch = trimmed.match(SECTION_RE);
    if (sectionMatch) {
      if (inTable) flushTable();
      currentSection = sectionMatch[1].trim();
      video.blocks.push({ type: "section", label: currentSection });
      continue;
    }

    if (trimmed.startsWith("|")) {
      if (isTableSeparator(trimmed)) {
        inTable = true;
        continue;
      }
      const row = parseTableRow(trimmed);
      if (row.length >= 2) {
        inTable = true;
        tableRows.push(row);
      }
      continue;
    }

    if (inTable) flushTable();

    const bulletMatch = trimmed.match(BULLET_RE);
    if (bulletMatch) {
      video.blocks.push({
        type: "bullet",
        text: bulletMatch[1],
        section: currentSection,
      });
      continue;
    }

    video.blocks.push({
      type: "phrase",
      text: trimmed,
      section: currentSection,
    });
  }

  if (inTable) flushTable();
  return sections;
}

export function extractYoutubeUrlFromText(text: string): string | null {
  const match = text.match(/https?:\/\/[^\s)]+/);
  if (!match) return null;
  const id = extractYoutubeVideoId(match[0]);
  return id ? normalizeYoutubeWatchUrl(match[0]) : null;
}
