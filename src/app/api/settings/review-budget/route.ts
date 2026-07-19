import { NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth-server";
import { getUserSettings } from "@/db/user-settings";
import {
  DEFAULT_DAILY_REVIEW_BUDGET,
  formatBudgetLabel,
  isValidDailyReviewBudget,
} from "@/lib/daily-review-budget";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function GET() {
  const user = await getAuthenticatedUser();
  if (!user) {
    return NextResponse.json({
      budget: DEFAULT_DAILY_REVIEW_BUDGET,
      label: formatBudgetLabel(DEFAULT_DAILY_REVIEW_BUDGET),
      canSave: false,
    });
  }

  const supabase = await createSupabaseServerClient();
  const settings = await getUserSettings(user.id, supabase);
  const budget = settings?.daily_review_budget ?? DEFAULT_DAILY_REVIEW_BUDGET;

  return NextResponse.json({
    budget,
    label: formatBudgetLabel(budget),
    canSave: true,
  });
}

export async function POST(request: Request) {
  const user = await getAuthenticatedUser();
  if (!user) {
    return NextResponse.json(
      { ok: false, error: "Sign in to save review budget." },
      { status: 401 }
    );
  }

  const body = (await request.json()) as { budget?: number };
  const budget = body.budget;
  if (typeof budget !== "number" || !isValidDailyReviewBudget(budget)) {
    return NextResponse.json(
      { ok: false, error: "Invalid daily review budget." },
      { status: 400 }
    );
  }

  const supabase = await createSupabaseServerClient();
  const existing = await getUserSettings(user.id, supabase);
  const { error } = await supabase.from("user_settings").upsert(
    {
      user_id: user.id,
      llm_api_key: existing?.llm_api_key ?? null,
      llm_base_url: existing?.llm_base_url ?? null,
      llm_model: existing?.llm_model ?? null,
      supabase_url: existing?.supabase_url ?? null,
      supabase_anon_key: existing?.supabase_anon_key ?? null,
      feishu_app_id: existing?.feishu_app_id ?? null,
      feishu_app_secret: existing?.feishu_app_secret ?? null,
      feishu_document_urls: existing?.feishu_document_urls ?? null,
      last_feishu_sync_at: existing?.last_feishu_sync_at ?? null,
      daily_review_budget: budget,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id" }
  );

  if (error) {
    return NextResponse.json(
      { ok: false, error: error.message },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true, budget });
}
