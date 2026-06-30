import { getLatestTranscriptForVideo } from "@/db/transcripts";
import { extractExpressionsForTranscript } from "@/services/expression-pipeline";
import { errorMessage, jsonError, jsonOk } from "@/lib/api-response";
import { getSupabaseAdmin } from "@/lib/supabase";
import type { ExtractionDepth } from "@/lib/extraction-depth";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function POST(request: Request, context: RouteContext) {
  try {
    const { id: videoId } = await context.params;
    const body = (await request.json().catch(() => ({}))) as {
      depth?: string;
    };
    const depth =
      body.depth === "deep" || body.depth === "standard"
        ? (body.depth as ExtractionDepth)
        : undefined;

    const supabase = getSupabaseAdmin();
    const transcript = await getLatestTranscriptForVideo(videoId, supabase);
    if (!transcript) {
      return jsonError("No transcript found for this video.", 404);
    }

    const result = await extractExpressionsForTranscript(transcript.id, {
      supabase,
      depth,
    });

    return jsonOk({
      videoId: result.videoId,
      transcriptId: result.transcriptId,
      expressionCount: result.expressionCount,
    });
  } catch (error) {
    return jsonError(errorMessage(error, "Failed to re-extract expressions."), 500);
  }
}
