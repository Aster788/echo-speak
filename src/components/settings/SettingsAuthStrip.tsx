"use client";

import { useState, useTransition, type FormEvent } from "react";
import { SettingsFrame } from "@/components/settings/SettingsFrame";
import { pageHintFont } from "@/lib/page-hint-font";
import {
  magicLinkAuthErrorMessage,
  magicLinkHelperText,
  magicLinkSentMessage,
  type MagicLinkAuthReason,
} from "@/lib/auth-magic-link";

type SettingsAuthStripProps = {
  isAuthenticated: boolean;
  email: string | null;
  authReason?: MagicLinkAuthReason | null;
  onAuthChange: () => void;
};

export function SettingsAuthStrip({
  isAuthenticated,
  email,
  authReason,
  onAuthChange,
}: SettingsAuthStripProps) {
  const [loginEmail, setLoginEmail] = useState("");
  const [message, setMessage] = useState(
    authReason ? magicLinkAuthErrorMessage(authReason) : ""
  );
  const [pending, startTransition] = useTransition();

  function handleLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    startTransition(async () => {
      try {
        const response = await fetch("/api/auth/magic-link", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: loginEmail }),
        });
        const data = (await response.json()) as { ok: boolean; error?: string };
        if (data.ok) {
          setMessage(magicLinkSentMessage());
        } else {
          setMessage(data.error ?? "Could not send magic link.");
        }
      } catch {
        setMessage("Could not send magic link.");
      }
    });
  }

  if (isAuthenticated) {
    return (
      <div className="flex items-center justify-between gap-2 text-[0.75rem] text-[#222222]/80">
        <span className="truncate">Signed in as {email}</span>
        <button
          type="button"
          disabled={pending}
          onClick={() =>
            startTransition(async () => {
              await fetch("/api/auth/sign-out", { method: "POST" });
              onAuthChange();
            })
          }
          className="shrink-0 underline decoration-[#222222]/30 underline-offset-2 disabled:opacity-50"
        >
          Sign out
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleLogin} className="flex flex-col gap-2">
      <div className="flex items-center gap-2">
        <div className="min-w-0 flex-1">
          <SettingsFrame>
            <label htmlFor="settings-login-email" className="sr-only">
              Email for magic link
            </label>
            <input
              id="settings-login-email"
              type="email"
              value={loginEmail}
              onChange={(event) => setLoginEmail(event.target.value)}
              placeholder="you@example.com"
              autoComplete="email"
              className="block w-full bg-transparent text-[0.8125rem] text-[#222222] outline-none placeholder:text-[#222222]/35"
            />
          </SettingsFrame>
        </div>
        <button
          type="submit"
          disabled={pending}
          className={`${pageHintFont.className} shrink-0 text-[0.8125rem] text-[#222222] underline decoration-[#222222]/30 underline-offset-[3px] disabled:opacity-50`}
        >
          Send magic link
        </button>
      </div>
      {message ? (
        <p className="text-[0.75rem] leading-snug text-[#222222]/80">{message}</p>
      ) : (
        <p className="text-[0.75rem] leading-snug text-[#222222]/80">
          {magicLinkHelperText()}
        </p>
      )}
    </form>
  );
}
