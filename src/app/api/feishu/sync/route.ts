import { NextResponse } from "next/server";
import { runFeishuSyncManual } from "@/app/feishu/actions";

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as {
    mode?: "incremental" | "full";
  };
  const result = await runFeishuSyncManual(body.mode ?? "incremental");
  if (!result.ok) {
    const status = result.error.includes("Sign in") ? 401 : 400;
    return NextResponse.json({ error: result.error }, { status });
  }
  return NextResponse.json({ summary: result.summary });
}
