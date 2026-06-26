import { getSupabaseAdmin } from "@/lib/supabase";
import {
  DISMISS_REASON_LABELS,
  type DismissReason,
} from "@/types/dismiss-reason";
import type { SupabaseClient } from "@supabase/supabase-js";

export type DismissalReasonCount = {
  reason: DismissReason;
  count: number;
};

export type DismissalPhraseSample = {
  phrase: string;
  reason: DismissReason;
};

export async function listDismissalReasonCounts(
  client?: SupabaseClient
): Promise<DismissalReasonCount[]> {
  const supabase = client ?? getSupabaseAdmin();
  const { data, error } = await supabase
    .from("expression_dismissals")
    .select("reason")
    .not("reason", "is", null);
  if (error) throw error;

  const counts = new Map<DismissReason, number>();
  for (const row of data ?? []) {
    const reason = row.reason as DismissReason;
    counts.set(reason, (counts.get(reason) ?? 0) + 1);
  }

  return [...counts.entries()]
    .map(([reason, count]) => ({ reason, count }))
    .sort((a, b) => b.count - a.count);
}

export async function listRecentDismissalSamples(
  limit = 8,
  client?: SupabaseClient
): Promise<DismissalPhraseSample[]> {
  const supabase = client ?? getSupabaseAdmin();
  const { data, error } = await supabase
    .from("expression_dismissals")
    .select("phrase, reason")
    .not("reason", "is", null)
    .not("phrase", "is", null)
    .order("dismissed_at", { ascending: false })
    .limit(limit);
  if (error) throw error;

  return (data ?? [])
    .filter((row) => row.phrase && row.reason)
    .map((row) => ({
      phrase: row.phrase as string,
      reason: row.reason as DismissReason,
    }));
}

export async function formatDismissalHintsForPrompt(
  client?: SupabaseClient
): Promise<string> {
  const counts = await listDismissalReasonCounts(client);
  if (counts.length === 0) {
    return "";
  }

  const lines = counts.map(
    ({ reason, count }) =>
      `- ${DISMISS_REASON_LABELS[reason]} (${reason}): ${count} dismissals`
  );

  const samples = await listRecentDismissalSamples(6, client);
  const sampleLines = samples.map(
    (item) =>
      `- "${item.phrase}" → ${DISMISS_REASON_LABELS[item.reason]}`
  );

  return [
    "## Learner dismiss patterns (avoid similar items)",
    "",
    ...lines,
    "",
    "Recent dismissed phrases:",
    ...sampleLines,
  ].join("\n");
}
