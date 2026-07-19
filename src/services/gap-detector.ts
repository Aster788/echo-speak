import {
  deleteGapsByIds,
  insertPendingGaps,
  listGapsForVideo,
  listVideoIdsWithTranscriptExpressions,
  type GapRow,
  type GapStatus,
} from "@/db/gaps";
import { listExpressionsByVideo } from "@/db/expressions";
import { canonicalKey } from "@/lib/phrase-canonical";
import { getSupabaseAdmin } from "@/lib/supabase";
import type { SupabaseClient } from "@supabase/supabase-js";

export const GAP_REASON_TRANSCRIPT_NOT_IN_FEISHU =
  "in_transcript_not_in_feishu" as const;

export type GapRefreshResult = {
  videoId: string;
  inserted: number;
  deletedPending: number;
  candidateCount: number;
};

export type GapExpressionInput = {
  id: string;
  phrase: string;
  source_type: "transcript" | "feishu" | string;
};

export type ExistingGapInput = {
  id: string;
  expression_id: string;
  status: GapStatus;
};

/** Transcript expression ids whose canonical key is absent from Feishu on the same set. */
export function computeGapCandidateIds(
  expressions: GapExpressionInput[]
): string[] {
  const feishuKeys = new Set<string>();
  for (const expression of expressions) {
    if (expression.source_type !== "feishu") continue;
    const key = canonicalKey(expression.phrase);
    if (key) feishuKeys.add(key);
  }

  const candidates: string[] = [];
  for (const expression of expressions) {
    if (expression.source_type !== "transcript") continue;
    const key = canonicalKey(expression.phrase);
    if (!key) continue;
    if (!feishuKeys.has(key)) {
      candidates.push(expression.id);
    }
  }
  return candidates;
}

/**
 * Plan inserts (new candidates with no gap row) and deletes (stale pending).
 * Ignored and accepted rows are left unchanged even if still candidates.
 */
export function planGapRefresh(
  candidateExpressionIds: string[],
  existingGaps: ExistingGapInput[]
): { insertExpressionIds: string[]; deleteGapIds: string[] } {
  const candidateSet = new Set(candidateExpressionIds);
  const byExpression = new Map(
    existingGaps.map((gap) => [gap.expression_id, gap])
  );

  const insertExpressionIds: string[] = [];
  for (const expressionId of candidateExpressionIds) {
    if (!byExpression.has(expressionId)) {
      insertExpressionIds.push(expressionId);
    }
  }

  const deleteGapIds: string[] = [];
  for (const gap of existingGaps) {
    if (gap.status === "pending" && !candidateSet.has(gap.expression_id)) {
      deleteGapIds.push(gap.id);
    }
  }

  return { insertExpressionIds, deleteGapIds };
}

export async function refreshGapsForVideo(
  videoId: string,
  client?: SupabaseClient
): Promise<GapRefreshResult> {
  const supabase = client ?? getSupabaseAdmin();
  const expressions = await listExpressionsByVideo(videoId, supabase);
  const existing = await listGapsForVideo(videoId, supabase);

  const candidates = computeGapCandidateIds(expressions);
  const { insertExpressionIds, deleteGapIds } = planGapRefresh(
    candidates,
    existing as GapRow[]
  );

  await deleteGapsByIds(deleteGapIds, supabase);
  await insertPendingGaps(
    insertExpressionIds,
    GAP_REASON_TRANSCRIPT_NOT_IN_FEISHU,
    supabase
  );

  return {
    videoId,
    inserted: insertExpressionIds.length,
    deletedPending: deleteGapIds.length,
    candidateCount: candidates.length,
  };
}

/** One-shot backfill: refresh every video that has transcript expressions. */
export async function refreshGapsForVideosWithTranscripts(
  client?: SupabaseClient
): Promise<{ videoCount: number; results: GapRefreshResult[] }> {
  const supabase = client ?? getSupabaseAdmin();
  const videoIds = await listVideoIdsWithTranscriptExpressions(supabase);
  const results: GapRefreshResult[] = [];
  for (const videoId of videoIds) {
    results.push(await refreshGapsForVideo(videoId, supabase));
  }
  return { videoCount: videoIds.length, results };
}
