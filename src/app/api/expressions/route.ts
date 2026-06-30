import {
  listExpressionsMergedByCanonicalKey,
  listVideoExpressionCounts,
} from "@/db/expressions";
import { errorMessage, jsonError, jsonOk } from "@/lib/api-response";
import { getSupabaseAdmin } from "@/lib/supabase";

export async function GET() {
  try {
    const supabase = getSupabaseAdmin();
    const [expressions, videoCounts] = await Promise.all([
      listExpressionsMergedByCanonicalKey({ kind: "all" }, supabase),
      listVideoExpressionCounts(supabase),
    ]);

    return jsonOk({
      expressions,
      videoCount: videoCounts.size,
      expressionCount: expressions.length,
    });
  } catch (error) {
    return jsonError(errorMessage(error, "Failed to load expressions."), 500);
  }
}
