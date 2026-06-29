import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getAppOrigin, settingsAuthCallbackUrl } from "@/lib/app-origin";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { email?: string };
    const trimmed = body.email?.trim() ?? "";

    if (!trimmed) {
      return NextResponse.json(
        { ok: false, error: "Enter your email address." },
        { status: 400 }
      );
    }

    const supabase = await createSupabaseServerClient();
    const origin = await getAppOrigin(request);

    const { error } = await supabase.auth.signInWithOtp({
      email: trimmed,
      options: {
        emailRedirectTo: settingsAuthCallbackUrl(origin),
      },
    });

    if (error) {
      return NextResponse.json({ ok: false, error: error.message }, { status: 400 });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Could not send magic link.",
      },
      { status: 500 }
    );
  }
}
