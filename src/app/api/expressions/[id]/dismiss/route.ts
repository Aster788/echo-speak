import { dismissExpression } from "@/db/expressions";
import { errorMessage, jsonError, jsonOk } from "@/lib/api-response";
import { getSupabaseAdmin } from "@/lib/supabase";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function POST(_request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const supabase = getSupabaseAdmin();
    await dismissExpression(id, supabase);
    return jsonOk({});
  } catch (error) {
    return jsonError(errorMessage(error, "Failed to dismiss expression."), 400);
  }
}
