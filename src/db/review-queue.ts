/**
 * Data-access stub for the review_queue table.
 *
 * Schema and migrations are in place; enqueue/scheduling logic is deferred to
 * Phase 5 (Spaced Repetition). This module exists so Phase 5 can fill in the
 * scheduling behavior without re-creating the data layer.
 */

import { getSupabase } from "@/lib/supabase";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { ReviewQueueEntry } from "@/types/review";

export async function listDueReviewEntries(
  _now: Date = new Date(),
  client?: SupabaseClient
): Promise<ReviewQueueEntry[]> {
  const supabase = client ?? getSupabase();
  const { data, error } = await supabase
    .from("review_queue")
    .select("*")
    .lte("due_at", _now.toISOString())
    .order("due_at", { ascending: true });
  if (error) throw error;
  return (data ?? []) as ReviewQueueEntry[];
}
