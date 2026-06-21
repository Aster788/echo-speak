import { NextResponse } from "next/server";
import { extractExpressionsForTranscript } from "@/services/expression-pipeline";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function POST(_request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const result = await extractExpressionsForTranscript(id);

    return NextResponse.json({
      ok: true,
      expressionCount: result.expressionCount,
      videoId: result.videoId,
      transcriptId: result.transcriptId,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Expression extraction failed.";

    const status = /not found/i.test(message) ? 404 : 500;
    return NextResponse.json({ ok: false, message }, { status });
  }
}
