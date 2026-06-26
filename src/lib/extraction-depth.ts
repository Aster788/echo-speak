import { chunkTranscriptForExtraction } from "@/lib/transcript-chunks";

export type ExtractionDepth = "standard" | "deep";

/** Final per-chunk target after rank pass (Standard). */
const STANDARD_CAP_MAX = 15;
const STANDARD_CAP_MIN = 6;

/** Final per-chunk target after rank pass (Deep). */
const DEEP_CAP_MAX = 30;
const DEEP_CAP_MIN = 12;

/** Chars per expression slot — higher divisor ⇒ fewer items for same length. */
const STANDARD_CHARS_PER_SLOT = 1_000;
const DEEP_CHARS_PER_SLOT = 600;

const STANDARD_OVERFETCH = 5;
const DEEP_OVERFETCH = 8;

export function resolveExtractionDepth(
  override?: ExtractionDepth | string | null
): ExtractionDepth {
  const raw =
    override?.toString().toLowerCase() ??
    process.env.EXTRACTION_DEPTH?.toLowerCase() ??
    "standard";
  return raw === "deep" ? "deep" : "standard";
}

/**
 * Per-chunk **selection** cap (direction B).
 *
 * Formula: clamp(round(chars / charsPerSlot), min, max)
 * - Short chunk (4k chars) → ~6 (Standard) vs old fixed floor 10
 * - Full single chunk (12k) → 12–15 (Standard), 20–24 (Deep)
 * - Multi-chunk videos: target total = sum of per-chunk caps (see getVideoExpressionTarget)
 */
export function getChunkExpressionCap(
  chunkChars: number,
  depth: ExtractionDepth = "standard"
): number {
  if (depth === "deep") {
    const elastic = Math.round(chunkChars / DEEP_CHARS_PER_SLOT);
    return Math.min(DEEP_CAP_MAX, Math.max(DEEP_CAP_MIN, elastic));
  }

  const elastic = Math.round(chunkChars / STANDARD_CHARS_PER_SLOT);
  return Math.min(STANDARD_CAP_MAX, Math.max(STANDARD_CAP_MIN, elastic));
}

/** First-pass prompt cap — overfetch so rank pass (direction D) has room to cut. */
export function getChunkExtractCap(
  chunkChars: number,
  depth: ExtractionDepth = "standard"
): number {
  const selectCap = getChunkExpressionCap(chunkChars, depth);
  const overfetch = depth === "deep" ? DEEP_OVERFETCH : STANDARD_OVERFETCH;
  const boosted = selectCap + overfetch;
  const ceiling = Math.round(selectCap * 1.75);
  return Math.max(selectCap, Math.min(boosted, ceiling));
}

/** Whole-video target after merging chunks (used by rank pass). */
export function getVideoExpressionTarget(
  cleanedText: string,
  depth: ExtractionDepth = "standard"
): number {
  const chunks = chunkTranscriptForExtraction(cleanedText);
  if (chunks.length === 0) {
    return 0;
  }
  return chunks.reduce(
    (sum, chunk) => sum + getChunkExpressionCap(chunk.length, depth),
    0
  );
}

/** Reference table for calibration docs / debugging. */
export function sampleChunkCaps(
  chunkCharsList: number[],
  depth: ExtractionDepth = "standard"
): Array<{
  chunkChars: number;
  selectCap: number;
  extractCap: number;
}> {
  return chunkCharsList.map((chunkChars) => ({
    chunkChars,
    selectCap: getChunkExpressionCap(chunkChars, depth),
    extractCap: getChunkExtractCap(chunkChars, depth),
  }));
}
