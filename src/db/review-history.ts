import { getSupabase } from "@/lib/supabase";
import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  ReviewHistoryEntry,
  ReviewMode,
  ReviewRating,
} from "@/types/review";

const VALID_RATINGS: ReviewRating[] = ["mastered", "again", "unsure"];

export function isReviewRating(value: string): value is ReviewRating {
  return VALID_RATINGS.includes(value as ReviewRating);
}

export async function insertReviewRating(
  input: {
    expressionId: string;
    rating: ReviewRating;
    mode: ReviewMode;
    scopeId: string;
  },
  client?: SupabaseClient
): Promise<ReviewHistoryEntry> {
  const supabase = client ?? getSupabase();
  const { data, error } = await supabase
    .from("review_history")
    .insert({
      expression_id: input.expressionId,
      rating: input.rating,
      mode: input.mode,
      scope_id: input.scopeId,
    })
    .select()
    .single();
  if (error) throw error;
  return data as ReviewHistoryEntry;
}

export async function listRecentRatingsForExpression(
  expressionId: string,
  limit = 5,
  client?: SupabaseClient
): Promise<ReviewRating[]> {
  const supabase = client ?? getSupabase();
  const { data, error } = await supabase
    .from("review_history")
    .select("rating")
    .eq("expression_id", expressionId)
    .order("reviewed_at", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return (data ?? [])
    .map((row) => row.rating as string)
    .filter(isReviewRating);
}

export async function listReviewHistoryForExpression(
  expressionId: string,
  client?: SupabaseClient
): Promise<ReviewHistoryEntry[]> {
  const supabase = client ?? getSupabase();
  const { data, error } = await supabase
    .from("review_history")
    .select("*")
    .eq("expression_id", expressionId)
    .order("reviewed_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as ReviewHistoryEntry[];
}
