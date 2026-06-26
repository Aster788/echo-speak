import { NextResponse } from "next/server";
import { extractExpressionsForTranscript } from "@/services/expression-pipeline";
import { resolveExtractionDepth } from "@/lib/extraction-depth";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function POST(request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const body = (await request.json().catch(() => ({}))) as {
      depth?: string;
    };
    const result = await extractExpressionsForTranscript(id, {
      depth: resolveExtractionDepth(body.depth),
    });

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
