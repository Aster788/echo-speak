import { NextResponse } from "next/server";
import {
  classifyEmailOtpVerifyError,
  isValidEmailOtpCode,
  normalizeEmailOtpCode,
} from "@/lib/auth-email-otp";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { email?: string; code?: string };
    const trimmedEmail = body.email?.trim() ?? "";
    const code = normalizeEmailOtpCode(body.code ?? "");

    if (!trimmedEmail) {
      return NextResponse.json(
        { ok: false, error: "Enter your email address.", reason: "failed" },
        { status: 400 }
      );
    }

    if (!isValidEmailOtpCode(code)) {
      return NextResponse.json(
        { ok: false, error: "Enter the 6-digit code from your email.", reason: "invalid" },
        { status: 400 }
      );
    }

    const supabase = await createSupabaseServerClient();

    const { error } = await supabase.auth.verifyOtp({
      email: trimmedEmail,
      token: code,
      type: "email",
    });

    if (error) {
      const reason = classifyEmailOtpVerifyError(error.message);
      return NextResponse.json(
        { ok: false, error: error.message, reason },
        { status: 400 }
      );
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Could not verify sign-in code.",
        reason: "failed",
      },
      { status: 500 }
    );
  }
}
