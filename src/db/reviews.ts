import { getSupabase } from "@/lib/supabase";
import type { Review } from "@/types/review";

export async function listDueReviews(before: Date = new Date()): Promise<Review[]> {
  const { data, error } = await getSupabase()
    .from("reviews")
    .select("*")
    .lte("due_at", before.toISOString())
    .is("completed_at", null);
  if (error) throw error;
  return (data ?? []) as Review[];
}

export async function completeReview(
  id: string,
  rating: number
): Promise<void> {
  const { error } = await getSupabase()
    .from("reviews")
    .update({ completed_at: new Date().toISOString(), rating })
    .eq("id", id);
  if (error) throw error;
}
