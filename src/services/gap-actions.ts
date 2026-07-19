import {
  acceptExpressionKeepSignal,
  dismissExpression,
} from "@/db/expressions";
import { getGap, setGapStatus, type GapRow } from "@/db/gaps";
import { getSupabaseAdmin } from "@/lib/supabase";
import type { SupabaseClient } from "@supabase/supabase-js";

export async function acceptGap(
  gapId: string,
  client?: SupabaseClient
): Promise<GapRow> {
  const supabase = client ?? getSupabaseAdmin();
  const gap = await getGap(gapId, supabase);
  if (!gap) {
    throw new Error("Gap not found.");
  }
  if (gap.status !== "pending") {
    throw new Error("Only pending gaps can be accepted.");
  }

  await acceptExpressionKeepSignal(gap.expression_id, supabase);
  return setGapStatus(gapId, "accepted", supabase);
}

export async function ignoreGap(
  gapId: string,
  options: { userId?: string | null; client?: SupabaseClient } = {}
): Promise<{ expressionId: string }> {
  const supabase = options.client ?? getSupabaseAdmin();
  const gap = await getGap(gapId, supabase);
  if (!gap) {
    throw new Error("Gap not found.");
  }
  if (gap.status !== "pending") {
    throw new Error("Only pending gaps can be ignored.");
  }

  const expressionId = gap.expression_id;
  await dismissExpression(expressionId, {
    reason: "gap_ignore",
    userId: options.userId ?? null,
    client: supabase,
  });
  // gaps row removed via ON DELETE CASCADE on expression_id
  return { expressionId };
}
