import { NextResponse } from "next/server";
import {
  deleteUserTopic,
  getTopic,
  renameUserTopic,
} from "@/db/topics";
import { errorMessage, jsonError, jsonOk } from "@/lib/api-response";
import { getSupabaseAdmin } from "@/lib/supabase";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const body = (await request.json()) as { name?: string };
    if (!body.name?.trim()) {
      return jsonError("name is required.");
    }

    const supabase = getSupabaseAdmin();
    const topic = await renameUserTopic(id, body.name, supabase);
    return jsonOk({ topic });
  } catch (error) {
    return jsonError(errorMessage(error, "Failed to rename topic."), 400);
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const supabase = getSupabaseAdmin();
    await deleteUserTopic(id, supabase);
    return jsonOk({});
  } catch (error) {
    return jsonError(errorMessage(error, "Failed to delete topic."), 400);
  }
}

export async function GET(_request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const supabase = getSupabaseAdmin();
    const topic = await getTopic(id, supabase);
    if (!topic) {
      return jsonError("Topic not found.", 404);
    }
    return jsonOk({ topic });
  } catch (error) {
    return jsonError(errorMessage(error, "Failed to load topic."), 500);
  }
}
