export function parseTxt(content: string): string {
  return content.replace(/^\uFEFF/, "").trim();
}

export function parseSrt(content: string): string {
  const lines = content.replace(/^\uFEFF/, "").split(/\r?\n/);
  const cues: string[] = [];
  let current: string[] = [];

  const flush = () => {
    if (current.length > 0) {
      cues.push(current.join("\n"));
      current = [];
    }
  };

  for (const rawLine of lines) {
    const line = rawLine.trim();

    if (!line) {
      flush();
      continue;
    }

    if (line === "WEBVTT" || line.startsWith("NOTE") || line.startsWith("STYLE")) {
      continue;
    }

    if (/^\d+$/.test(line)) {
      continue;
    }

    if (/^\d{2}:\d{2}:\d{2}[,.]\d{3}\s*-->/.test(line)) {
      flush();
      continue;
    }

    current.push(line);
  }

  flush();
  return cues.join("\n\n").trim();
}

export function parseTranscriptFile(
  buffer: Buffer | Uint8Array,
  filename: string
): string {
  const text = Buffer.from(buffer).toString("utf-8");
  const ext = filename.toLowerCase().split(".").pop();

  if (ext === "srt") {
    const parsed = parseSrt(text);
    if (!parsed) {
      throw new Error(
        "Could not extract text from SRT file. Check the file format."
      );
    }
    return parsed;
  }

  const parsed = parseTxt(text);
  if (!parsed) {
    throw new Error("Uploaded file is empty.");
  }
  return parsed;
}
