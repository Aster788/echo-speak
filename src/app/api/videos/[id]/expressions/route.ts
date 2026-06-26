import { listExpressionsByVideo } from "@/db/expressions";
import { getSupabaseAdmin } from "@/lib/supabase";
import { errorMessage, jsonError, jsonOk } from "@/lib/api-response";
import { listVideos } from "@/db/videos";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(_request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const supabase = getSupabaseAdmin();
    const videos = await listVideos(supabase);
    const video = videos.find((item) => item.id === id);
    if (!video) {
      return jsonError("Video not found.", 404);
    }

    const expressions = await listExpressionsByVideo(id, supabase);
    return jsonOk({ video, expressions });
  } catch (error) {
    return jsonError(errorMessage(error, "Failed to load expressions."), 500);
  }
}
