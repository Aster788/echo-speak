import { NextResponse } from "next/server";
import {
  createUserTopic,
  getTopicExpressionCounts,
  listTopicTree,
  listTopics,
} from "@/db/topics";
import { errorMessage, jsonError, jsonOk } from "@/lib/api-response";
import { getSupabaseAdmin } from "@/lib/supabase";

export async function GET() {
  try {
    const supabase = getSupabaseAdmin();
    const topics = await listTopics(supabase);
    const counts = await getTopicExpressionCounts(supabase);

    return jsonOk({
      tree: listTopicTree(topics),
      counts: Object.fromEntries(counts),
    });
  } catch (error) {
    return jsonError(errorMessage(error, "Failed to load topics."), 500);
  }
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      parentId?: string | null;
      name?: string;
    };

    if (!body.name?.trim()) {
      return jsonError("name is required.");
    }

    const supabase = getSupabaseAdmin();
    const topic = await createUserTopic(
      body.parentId ?? null,
      body.name,
      supabase
    );
    return jsonOk({ topic });
  } catch (error) {
    return jsonError(errorMessage(error, "Failed to create topic."), 400);
  }
}
