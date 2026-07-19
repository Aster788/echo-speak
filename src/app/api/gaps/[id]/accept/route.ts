import { errorMessage, jsonError, jsonOk } from "@/lib/api-response";
import { getSupabaseAdmin } from "@/lib/supabase";
import { acceptGap } from "@/services/gap-actions";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function POST(_request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const gap = await acceptGap(id, getSupabaseAdmin());
    return jsonOk({ gap });
  } catch (error) {
    return jsonError(errorMessage(error, "Failed to accept gap."), 400);
  }
}
