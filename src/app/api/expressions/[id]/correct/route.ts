import { correctExpressionFields } from "@/db/expressions";
import { errorMessage, jsonError, jsonOk } from "@/lib/api-response";
import { getSupabaseAdmin } from "@/lib/supabase";
import {
  isExpressionCorrectionField,
  type ExpressionCorrectionInput,
} from "@/types/expression-correction";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function POST(request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const body = (await request.json()) as {
      field?: string;
      value?: string;
      exampleIndex?: number;
    };

    if (!body.field || !isExpressionCorrectionField(body.field)) {
      return jsonError(
        "field must be phrase, meaning, example_en, or example_zh."
      );
    }
    if (typeof body.value !== "string") {
      return jsonError("value is required.");
    }

    const input: ExpressionCorrectionInput = {
      field: body.field,
      value: body.value,
      exampleIndex: body.exampleIndex,
    };

    const expression = await correctExpressionFields(
      id,
      input,
      getSupabaseAdmin()
    );
    return jsonOk({ expression });
  } catch (error) {
    const message = errorMessage(error, "Failed to correct expression.");
    const status = /not found/i.test(message) ? 404 : 400;
    return jsonError(message, status);
  }
}
