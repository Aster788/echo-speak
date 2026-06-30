import { mergeExpressions } from "@/db/expressions";
import { errorMessage, jsonError, jsonOk } from "@/lib/api-response";
import { getSupabaseAdmin } from "@/lib/supabase";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function POST(request: Request, context: RouteContext) {
  try {
    const { id: sourceId } = await context.params;
    const body = (await request.json()) as { targetId?: string };
    if (!body.targetId) {
      return jsonError("targetId is required.");
    }

    const supabase = getSupabaseAdmin();
    const expression = await mergeExpressions(sourceId, body.targetId, supabase);
    return jsonOk({ expression });
  } catch (error) {
    return jsonError(errorMessage(error, "Failed to merge expressions."), 400);
  }
}
