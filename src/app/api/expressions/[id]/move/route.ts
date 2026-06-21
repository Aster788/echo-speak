import { updateExpressionTopic } from "@/db/expressions";
import { getTopic } from "@/db/topics";
import { errorMessage, jsonError, jsonOk } from "@/lib/api-response";
import { getSupabaseAdmin } from "@/lib/supabase";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function POST(request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const body = (await request.json()) as { topicId?: string };
    if (!body.topicId) {
      return jsonError("topicId is required.");
    }

    const supabase = getSupabaseAdmin();
    const topic = await getTopic(body.topicId, supabase);
    if (!topic) {
      return jsonError("Topic not found.", 404);
    }

    const expression = await updateExpressionTopic(id, body.topicId, supabase);
    return jsonOk({ expression });
  } catch (error) {
    return jsonError(errorMessage(error, "Failed to move expression."), 400);
  }
}
