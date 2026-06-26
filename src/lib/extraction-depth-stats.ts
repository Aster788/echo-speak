import {
  DISMISS_REASON_LABELS,
  type DismissReason,
} from "@/types/dismiss-reason";
import type { SupabaseClient } from "@supabase/supabase-js";

export type Scheme2Row = {
  videoTitle: string;
  extracted: number;
  deleted: number;
  kept: number;
  cleanTextChars: number;
  notes: string;
};

/** Human notes on cap constants; appended by `formatScheme2Markdown` (survives `--write`). */
export const SCHEME2_CALIBRATION_NOTES = `## Calibration notes (2026-06-26)

Standard formula: \`selectCap = clamp(round(chunkChars / 1000), 6, 15)\` per chunk.

**Verdict:** Reasonable defaults for P1, slightly **tight** vs post-dismiss kept counts — acceptable trade-off (cleaner extract, not matching a personal keep-list; see \`docs/decisions.md\` 2026-06-26c).

| Constant | Assessment | Notes |
|----------|------------|-------|
| **÷1000** | Mostly OK, a bit tight | Old ~20/chunk ≈ 250 chars/slot; new ≈ 800 chars/slot at 5k chars. Delete rate was ~20% and mostly「已会」— noise was quality more than quantity. To align with historical *kept* counts, try **800** first. |
| **6 (floor)** | OK but conservative | Short clips (<3k) get 6 slots; 3–5 min vlogs often felt low after re-extract (e.g. 29 easy: kept 16 historically → cap 6). |
| **15 (ceiling)** | OK | Single chunk tops out ~12 at 12k chars; long Q&A uses **sum of per-chunk** caps (e.g. Getting Married ≈ 21). |

**vs Scheme 2 kept (old fixed-20 extract):** internship 14→cap 9; 29 easy 16→6; Getting Married 33→~21. Re-extract on 3 sample videos confirmed fewer, cleaner phrases (no clip inflection).

**If tuning later:** (1) \`STANDARD_CHARS_PER_SLOT\` 1000→800; (2) floor 6→5 only if still too many on short clips; (3) keep max 15 unless single chunks exceed 20k chars regularly. Use **Deep** mode or Feishu curation for per-video「want more」.`;

function topReasonNote(
  reasons: Map<DismissReason, number>
): string {
  const sorted = [...reasons.entries()].sort((a, b) => b[1] - a[1]);
  if (sorted.length === 0) {
    return "";
  }
  return sorted
    .slice(0, 2)
    .map(([reason, count]) => `${DISMISS_REASON_LABELS[reason]}×${count}`)
    .join("; ");
}

export async function buildScheme2Rows(
  client: SupabaseClient
): Promise<Scheme2Row[]> {
  const { data: videos, error: videosError } = await client
    .from("videos")
    .select("id, title")
    .order("title");
  if (videosError) throw videosError;

  const { data: keptRows, error: keptError } = await client
    .from("expressions")
    .select("video_id");
  if (keptError) throw keptError;

  const { data: dismissRows, error: dismissError } = await client
    .from("expression_dismissals")
    .select("video_id, reason");
  if (dismissError) throw dismissError;

  const { data: transcripts, error: transcriptError } = await client
    .from("transcripts")
    .select("video_id, cleaned_text");
  if (transcriptError) throw transcriptError;

  const keptByVideo = new Map<string, number>();
  for (const row of keptRows ?? []) {
    const id = row.video_id as string;
    keptByVideo.set(id, (keptByVideo.get(id) ?? 0) + 1);
  }

  const deletedByVideo = new Map<string, number>();
  const reasonsByVideo = new Map<string, Map<DismissReason, number>>();
  for (const row of dismissRows ?? []) {
    const id = row.video_id as string;
    deletedByVideo.set(id, (deletedByVideo.get(id) ?? 0) + 1);
    if (row.reason) {
      const reason = row.reason as DismissReason;
      const bucket = reasonsByVideo.get(id) ?? new Map();
      bucket.set(reason, (bucket.get(reason) ?? 0) + 1);
      reasonsByVideo.set(id, bucket);
    }
  }

  const charsByVideo = new Map<string, number>();
  for (const row of transcripts ?? []) {
    charsByVideo.set(
      row.video_id as string,
      (row.cleaned_text as string | null)?.length ?? 0
    );
  }

  return (videos ?? [])
    .map((video) => {
      const kept = keptByVideo.get(video.id) ?? 0;
      const deleted = deletedByVideo.get(video.id) ?? 0;
      const extracted = kept + deleted;
      return {
        videoTitle: video.title as string,
        extracted,
        deleted,
        kept,
        cleanTextChars: charsByVideo.get(video.id) ?? 0,
        notes: topReasonNote(reasonsByVideo.get(video.id) ?? new Map()),
      };
    })
    .filter((row) => row.extracted > 0)
    .sort((a, b) => a.videoTitle.localeCompare(b.videoTitle));
}

export function summarizeScheme2(rows: Scheme2Row[]): {
  medianDeleteRate: number;
  totalExtracted: number;
  totalDeleted: number;
  totalKept: number;
} {
  const withExtract = rows.filter((row) => row.extracted > 0);
  const rates = withExtract
    .map((row) => row.deleted / row.extracted)
    .sort((a, b) => a - b);
  const mid = Math.floor(rates.length / 2);
  const medianDeleteRate =
    rates.length === 0
      ? 0
      : rates.length % 2 === 1
        ? rates[mid]!
        : (rates[mid - 1]! + rates[mid]!) / 2;

  return {
    medianDeleteRate,
    totalExtracted: rows.reduce((sum, row) => sum + row.extracted, 0),
    totalDeleted: rows.reduce((sum, row) => sum + row.deleted, 0),
    totalKept: rows.reduce((sum, row) => sum + row.kept, 0),
  };
}

export function formatScheme2Markdown(rows: Scheme2Row[]): string {
  const summary = summarizeScheme2(rows);
  const lines = [
    "# Extraction depth calibration (Scheme 2)",
    "",
    `_Auto-generated ${new Date().toISOString().slice(0, 10)}._`,
    "",
    "## Summary",
    "",
    `- Videos: ${rows.length}`,
    `- Total extracted (kept + deleted): ${summary.totalExtracted}`,
    `- Total deleted: ${summary.totalDeleted}`,
    `- Total kept: ${summary.totalKept}`,
    `- Median delete rate: ${(summary.medianDeleteRate * 100).toFixed(1)}%`,
    "",
    "## Scheme 2 table",
    "",
    "| video_title | extracted | deleted | kept | clean_text_chars | notes |",
    "|-------------|-----------|---------|------|------------------|-------|",
  ];

  for (const row of rows) {
    const title = row.videoTitle.replace(/\|/g, "\\|");
    lines.push(
      `| ${title} | ${row.extracted} | ${row.deleted} | ${row.kept} | ${row.cleanTextChars} | ${row.notes || "—"} |`
    );
  }

  lines.push(
    "",
    "## Cap reference (Standard)",
    "",
    "Formula: `selectCap = clamp(round(chunkChars / 1000), 6, 15)` per chunk; video target = sum of chunk caps.",
    "",
    "Re-run: `npx tsx scripts/extraction-depth-stats.ts --write`",
    "",
    SCHEME2_CALIBRATION_NOTES,
    ""
  );

  return lines.join("\n");
}
