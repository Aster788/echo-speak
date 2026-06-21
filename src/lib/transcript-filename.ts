export function titleFromTranscriptFilename(filename: string): string {
  return filename
    .replace(/\.(txt|srt)$/i, "")
    .replace(/[-_]+/g, " ")
    .trim();
}
