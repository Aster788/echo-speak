import { getSupabase } from "@/lib/supabase";
import type { SupabaseClient } from "@supabase/supabase-js";

export type GapStatus = "pending" | "accepted" | "ignored";

export type GapRow = {
  id: string;
  expression_id: string;
  reason: string;
  status: GapStatus;
  created_at: string;
};

export type PendingGapWithContext = GapRow & {
  phrase: string;
  meaning: string;
  video_id: string;
  video_title: string | null;
  video_creator: string | null;
};

export async function listGapsForVideo(
  videoId: string,
  client?: SupabaseClient
): Promise<GapRow[]> {
  const supabase = client ?? getSupabase();
  const { data: expressions, error: exprError } = await supabase
    .from("expressions")
    .select("id")
    .eq("video_id", videoId);
  if (exprError) throw exprError;

  const expressionIds = (expressions ?? []).map((row) => row.id as string);
  if (expressionIds.length === 0) return [];

  const { data, error } = await supabase
    .from("gaps")
    .select("*")
    .in("expression_id", expressionIds);
  if (error) throw error;
  return (data ?? []) as GapRow[];
}

export async function listPendingGapsWithContext(
  client?: SupabaseClient
): Promise<PendingGapWithContext[]> {
  const supabase = client ?? getSupabase();
  const { data, error } = await supabase
    .from("gaps")
    .select(
      `
      id,
      expression_id,
      reason,
      status,
      created_at,
      expressions!inner (
        phrase,
        meaning,
        video_id,
        videos (
          title,
          creator
        )
      )
    `
    )
    .eq("status", "pending")
    .order("created_at", { ascending: false });
  if (error) throw error;

  return (data ?? []).map((row) => {
    const expression = row.expressions as unknown as {
      phrase: string;
      meaning: string;
      video_id: string;
      videos:
        | { title: string | null; creator: string | null }
        | { title: string | null; creator: string | null }[]
        | null;
    };
    const video = Array.isArray(expression.videos)
      ? expression.videos[0] ?? null
      : expression.videos;

    return {
      id: row.id as string,
      expression_id: row.expression_id as string,
      reason: row.reason as string,
      status: row.status as GapStatus,
      created_at: row.created_at as string,
      phrase: expression.phrase,
      meaning: expression.meaning,
      video_id: expression.video_id,
      video_title: video?.title ?? null,
      video_creator: video?.creator ?? null,
    };
  });
}

export async function getGap(
  gapId: string,
  client?: SupabaseClient
): Promise<GapRow | null> {
  const supabase = client ?? getSupabase();
  const { data, error } = await supabase
    .from("gaps")
    .select("*")
    .eq("id", gapId)
    .maybeSingle();
  if (error) throw error;
  return (data as GapRow | null) ?? null;
}

export async function insertPendingGaps(
  expressionIds: string[],
  reason: string,
  client?: SupabaseClient
): Promise<void> {
  if (expressionIds.length === 0) return;
  const supabase = client ?? getSupabase();
  const rows = expressionIds.map((expression_id) => ({
    expression_id,
    reason,
    status: "pending" as const,
  }));
  const { error } = await supabase.from("gaps").insert(rows);
  if (error) throw error;
}

export async function setGapStatus(
  gapId: string,
  status: Exclude<GapStatus, "pending">,
  client?: SupabaseClient
): Promise<GapRow> {
  const supabase = client ?? getSupabase();
  const { data, error } = await supabase
    .from("gaps")
    .update({ status })
    .eq("id", gapId)
    .select("*")
    .single();
  if (error) throw error;
  return data as GapRow;
}

export async function deleteGapsByIds(
  gapIds: string[],
  client?: SupabaseClient
): Promise<void> {
  if (gapIds.length === 0) return;
  const supabase = client ?? getSupabase();
  const { error } = await supabase.from("gaps").delete().in("id", gapIds);
  if (error) throw error;
}

export async function listVideoIdsWithTranscriptExpressions(
  client?: SupabaseClient
): Promise<string[]> {
  const supabase = client ?? getSupabase();
  const { data, error } = await supabase
    .from("expressions")
    .select("video_id")
    .eq("source_type", "transcript");
  if (error) throw error;

  return [...new Set((data ?? []).map((row) => row.video_id as string))];
}
