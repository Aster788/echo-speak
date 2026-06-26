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
    "Re-run: `npx tsx scripts/extraction-depth-stats.ts`",
    ""
  );

  return lines.join("\n");
}
