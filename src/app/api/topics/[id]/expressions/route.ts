import { listExpressionsByTopicId } from "@/db/expressions";
import { getTopic } from "@/db/topics";
import { errorMessage, jsonError, jsonOk } from "@/lib/api-response";
import { getSupabaseAdmin } from "@/lib/supabase";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(_request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const supabase = getSupabaseAdmin();
    const topic = await getTopic(id, supabase);
    if (!topic) {
      return jsonError("Topic not found.", 404);
    }

    const expressions = await listExpressionsByTopicId(id, supabase);
    return jsonOk({ topic, expressions });
  } catch (error) {
    return jsonError(errorMessage(error, "Failed to load expressions."), 500);
  }
}
