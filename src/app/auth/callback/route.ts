import { NextResponse } from "next/server";
import type { EmailOtpType } from "@supabase/supabase-js";
import { classifyMagicLinkVerifyError } from "@/lib/auth-magic-link";
import { createSupabaseServerClient } from "@/lib/supabase/server";

function authErrorRedirect(origin: string, reason: string) {
  return NextResponse.redirect(
    `${origin}/settings?auth=error&reason=${encodeURIComponent(reason)}`
  );
}

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const next = searchParams.get("next") ?? "/settings";
  const safeNext = next.startsWith("/") ? next : "/settings";

  const supabase = await createSupabaseServerClient();
  let lastErrorMessage = "Sign-in link missing or invalid.";

  const code = searchParams.get("code");
  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${origin}${safeNext}`);
    }
    lastErrorMessage = error.message;
  }

  const token_hash = searchParams.get("token_hash");
  const type = searchParams.get("type");
  if (token_hash && type) {
    const { error } = await supabase.auth.verifyOtp({
      token_hash,
      type: type as EmailOtpType,
    });
    if (!error) {
      return NextResponse.redirect(`${origin}${safeNext}`);
    }
    lastErrorMessage = error.message;
  }

  return authErrorRedirect(origin, classifyMagicLinkVerifyError(lastErrorMessage));
}
