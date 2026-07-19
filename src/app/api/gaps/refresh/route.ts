import { errorMessage, jsonError, jsonOk } from "@/lib/api-response";
import { getSupabaseAdmin } from "@/lib/supabase";
import { refreshGapsForVideosWithTranscripts } from "@/services/gap-detector";

export async function POST() {
  try {
    const result = await refreshGapsForVideosWithTranscripts(getSupabaseAdmin());
    const inserted = result.results.reduce((sum, row) => sum + row.inserted, 0);
    const deletedPending = result.results.reduce(
      (sum, row) => sum + row.deletedPending,
      0
    );
    return jsonOk({
      videoCount: result.videoCount,
      inserted,
      deletedPending,
    });
  } catch (error) {
    return jsonError(errorMessage(error, "Failed to refresh gaps."), 500);
  }
}
