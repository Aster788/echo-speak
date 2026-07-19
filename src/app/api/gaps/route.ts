import { listPendingGapsWithContext } from "@/db/gaps";
import { errorMessage, jsonError, jsonOk } from "@/lib/api-response";
import { getSupabaseAdmin } from "@/lib/supabase";

export async function GET() {
  try {
    const gaps = await listPendingGapsWithContext(getSupabaseAdmin());
    return jsonOk({ gaps });
  } catch (error) {
    return jsonError(errorMessage(error, "Failed to list gaps."), 500);
  }
}
