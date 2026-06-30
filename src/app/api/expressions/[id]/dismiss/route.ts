import { dismissExpression } from "@/db/expressions";
import { getAuthenticatedUser } from "@/lib/auth-server";
import { errorMessage, jsonError, jsonOk } from "@/lib/api-response";
import { getSupabaseAdmin } from "@/lib/supabase";
import { isDismissReason } from "@/types/dismiss-reason";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function POST(request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const body = (await request.json().catch(() => ({}))) as {
      reason?: string;
    };
    const reason =
      body.reason && isDismissReason(body.reason) ? body.reason : null;

    const user = await getAuthenticatedUser();
    const supabase = getSupabaseAdmin();
    await dismissExpression(id, {
      reason,
      client: supabase,
      userId: user?.id ?? null,
    });
    return jsonOk({});
  } catch (error) {
    return jsonError(errorMessage(error, "Failed to dismiss expression."), 400);
  }
}
