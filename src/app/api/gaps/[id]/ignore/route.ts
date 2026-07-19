import { errorMessage, jsonError, jsonOk } from "@/lib/api-response";
import { getAuthenticatedUser } from "@/lib/auth-server";
import { getSupabaseAdmin } from "@/lib/supabase";
import { ignoreGap } from "@/services/gap-actions";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function POST(_request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const user = await getAuthenticatedUser();
    const result = await ignoreGap(id, {
      userId: user?.id ?? null,
      client: getSupabaseAdmin(),
    });
    return jsonOk(result);
  } catch (error) {
    return jsonError(errorMessage(error, "Failed to ignore gap."), 400);
  }
}
