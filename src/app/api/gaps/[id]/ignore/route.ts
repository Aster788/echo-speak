import { setGapStatus } from "@/db/gaps";
import { errorMessage, jsonError, jsonOk } from "@/lib/api-response";
import { getSupabaseAdmin } from "@/lib/supabase";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function POST(_request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const gap = await setGapStatus(id, "ignored", getSupabaseAdmin());
    return jsonOk({ gap });
  } catch (error) {
    return jsonError(errorMessage(error, "Failed to ignore gap."), 400);
  }
}
