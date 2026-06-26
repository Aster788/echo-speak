import { listVideoExpressionCounts } from "@/db/expressions";
import { listVideos } from "@/db/videos";
import { sortVideosByTitle } from "@/lib/sort-collections";
import { errorMessage, jsonError, jsonOk } from "@/lib/api-response";
import { getSupabaseAdmin } from "@/lib/supabase";

export async function GET() {
  try {
    const supabase = getSupabaseAdmin();
    const [videos, counts] = await Promise.all([
      listVideos(supabase),
      listVideoExpressionCounts(supabase),
    ]);

    const items = sortVideosByTitle(videos)
      .map((video) => ({
        id: video.id,
        title: video.title,
        expressionCount: counts.get(video.id) ?? 0,
      }))
      .filter((video) => video.expressionCount > 0);

    return jsonOk({ videos: items });
  } catch (error) {
    return jsonError(errorMessage(error, "Failed to load videos."), 500);
  }
}
