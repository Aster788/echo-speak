export const MAX_EXTRACTION_TOTAL_LENGTH = 100_000;
export const MAX_CHUNK_CHARACTERS = 12_000;

export function chunkTranscriptForExtraction(text: string): string[] {
  const normalized = text.trim();
  if (!normalized) {
    return [];
  }

  if (normalized.length <= MAX_CHUNK_CHARACTERS) {
    return [normalized];
  }

  const paragraphs = normalized
    .split(/\n\s*\n+/)
    .map((part) => part.trim())
    .filter(Boolean);

  const sourceParagraphs = paragraphs.length > 0 ? paragraphs : [normalized];
  const chunks: string[] = [];
  let current = "";

  for (const paragraph of sourceParagraphs) {
    if (paragraph.length > MAX_CHUNK_CHARACTERS) {
      if (current) {
        chunks.push(current.trim());
        current = "";
      }
      chunks.push(...splitOversizedParagraph(paragraph));
      continue;
    }

    const candidate = current ? `${current}\n\n${paragraph}` : paragraph;
    if (candidate.length > MAX_CHUNK_CHARACTERS) {
      chunks.push(current.trim());
      current = paragraph;
    } else {
      current = candidate;
    }
  }

  if (current.trim()) {
    chunks.push(current.trim());
  }

  return chunks;
}

function splitOversizedParagraph(paragraph: string): string[] {
  const sentences =
    paragraph.match(/[^.!?]+[.!?]+(?:\s+|$)|[^.!?]+$/g) ??
    [paragraph];

  const chunks: string[] = [];
  let current = "";

  for (const sentence of sentences) {
    const trimmed = sentence.trim();
    if (!trimmed) {
      continue;
    }

    if (trimmed.length > MAX_CHUNK_CHARACTERS) {
      if (current) {
        chunks.push(current.trim());
        current = "";
      }
      chunks.push(...hardSplit(trimmed));
      continue;
    }

    const candidate = current ? `${current} ${trimmed}` : trimmed;
    if (candidate.length > MAX_CHUNK_CHARACTERS) {
      chunks.push(current.trim());
      current = trimmed;
    } else {
      current = candidate;
    }
  }

  if (current.trim()) {
    chunks.push(current.trim());
  }

  return chunks;
}

function hardSplit(text: string): string[] {
  const parts: string[] = [];
  for (let i = 0; i < text.length; i += MAX_CHUNK_CHARACTERS) {
    parts.push(text.slice(i, i + MAX_CHUNK_CHARACTERS).trim());
  }
  return parts.filter(Boolean);
}
