import { unlockExpressionTopic } from "@/db/expressions";
import { errorMessage, jsonError, jsonOk } from "@/lib/api-response";
import { getSupabaseAdmin } from "@/lib/supabase";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function POST(_request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const supabase = getSupabaseAdmin();
    const expression = await unlockExpressionTopic(id, supabase);
    return jsonOk({ expression });
  } catch (error) {
    return jsonError(errorMessage(error, "Failed to unlock expression."), 400);
  }
}
