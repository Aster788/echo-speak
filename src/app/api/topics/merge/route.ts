import { mergeTopics } from "@/db/topics";
import { errorMessage, jsonError, jsonOk } from "@/lib/api-response";
import { getSupabaseAdmin } from "@/lib/supabase";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      sourceId?: string;
      targetId?: string;
    };

    if (!body.sourceId || !body.targetId) {
      return jsonError("sourceId and targetId are required.");
    }

    const supabase = getSupabaseAdmin();
    const result = await mergeTopics(body.sourceId, body.targetId, supabase);
    return jsonOk(result);
  } catch (error) {
    return jsonError(errorMessage(error, "Failed to merge topics."), 400);
  }
}
