import { deleteExpression, nextAcceptedWeight } from "@/db/expressions";
import { recordDismissal } from "@/db/expression-dismissals";
import {
  getPendingGapWithExpression,
  setGapStatus,
  type GapRow,
} from "@/db/gaps";
import { getSupabaseAdmin } from "@/lib/supabase";
import type { SupabaseClient } from "@supabase/supabase-js";

export async function acceptGap(
  gapId: string,
  client?: SupabaseClient
): Promise<GapRow> {
  const supabase = client ?? getSupabaseAdmin();
  const gap = await getPendingGapWithExpression(gapId, supabase);
  if (!gap) {
    throw new Error("Gap not found.");
  }
  if (gap.status !== "pending") {
    throw new Error("Only pending gaps can be accepted.");
  }

  const weight = nextAcceptedWeight(gap.expression.weight);
  const [, updated] = await Promise.all([
    supabase
      .from("expressions")
      .update({ weight, topic_locked: true })
      .eq("id", gap.expression_id)
      .then(({ error }) => {
        if (error) throw error;
      }),
    setGapStatus(gapId, "accepted", supabase),
  ]);

  return updated;
}

export async function ignoreGap(
  gapId: string,
  options: { userId?: string | null; client?: SupabaseClient } = {}
): Promise<{ expressionId: string }> {
  const supabase = options.client ?? getSupabaseAdmin();
  const gap = await getPendingGapWithExpression(gapId, supabase);
  if (!gap) {
    throw new Error("Gap not found.");
  }
  if (gap.status !== "pending") {
    throw new Error("Only pending gaps can be ignored.");
  }

  const expressionId = gap.expression_id;
  await recordDismissal(
    {
      videoId: gap.expression.video_id,
      phrase: gap.expression.phrase,
      reason: "gap_ignore",
      topicId: gap.expression.topic_id,
      userId: options.userId ?? null,
    },
    supabase
  );
  await deleteExpression(expressionId, supabase);
  // gaps row removed via ON DELETE CASCADE on expression_id
  return { expressionId };
}
