"use client";

import { useState, useTransition, type FormEvent } from "react";
import { SettingsFrame } from "@/components/settings/SettingsFrame";
import { pageHintFont } from "@/lib/page-hint-font";
import {
  emailOtpAuthErrorMessage,
  emailOtpCodeHelperText,
  emailOtpHelperText,
  emailOtpSentMessage,
  normalizeEmailOtpCode,
  type EmailOtpAuthReason,
} from "@/lib/auth-email-otp";

type SettingsAuthStripProps = {
  isAuthenticated: boolean;
  email: string | null;
  authReason?: EmailOtpAuthReason | null;
  onAuthChange: () => void;
};

type AuthStep = "email" | "code";

const settingsAuthButtonClassName = `${pageHintFont.className} shrink-0 rounded-[0.625rem] border border-[#222222]/25 bg-[#222222]/5 px-3 py-1 text-[0.8125rem] text-[#222222] transition-colors duration-150 hover:bg-[#222222]/10 disabled:opacity-50`;

export function SettingsAuthStrip({
  isAuthenticated,
  email,
  authReason,
  onAuthChange,
}: SettingsAuthStripProps) {
  const [step, setStep] = useState<AuthStep>("email");
  const [loginEmail, setLoginEmail] = useState("");
  const [code, setCode] = useState("");
  const [message, setMessage] = useState(
    authReason ? emailOtpAuthErrorMessage(authReason) : ""
  );
  const [pending, startTransition] = useTransition();

  function handleSendCode(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    startTransition(async () => {
      try {
        const response = await fetch("/api/auth/otp/send", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: loginEmail }),
        });
        const data = (await response.json()) as { ok: boolean; error?: string };
        if (data.ok) {
          setStep("code");
          setCode("");
          setMessage(emailOtpSentMessage(loginEmail.trim()));
        } else {
          setMessage(data.error ?? "Could not send sign-in code.");
        }
      } catch {
        setMessage("Could not send sign-in code.");
      }
    });
  }

  function handleVerifyCode(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    startTransition(async () => {
      try {
        const response = await fetch("/api/auth/otp/verify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: loginEmail.trim(), code }),
        });
        const data = (await response.json()) as {
          ok: boolean;
          error?: string;
          reason?: EmailOtpAuthReason;
        };
        if (data.ok) {
          onAuthChange();
          return;
        }
        setMessage(
          data.reason
            ? emailOtpAuthErrorMessage(data.reason)
            : (data.error ?? "Could not verify sign-in code.")
        );
      } catch {
        setMessage("Could not verify sign-in code.");
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

  if (step === "code") {
    return (
      <form onSubmit={handleVerifyCode} className="flex flex-col gap-4">
        <div className="mx-auto w-full max-w-[20.5rem] min-w-0">
          <SettingsFrame>
            <label htmlFor="settings-login-code" className="sr-only">
              Sign-in code
            </label>
            <input
              id="settings-login-code"
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              value={code}
              onChange={(event) => setCode(normalizeEmailOtpCode(event.target.value))}
              placeholder="000000"
              maxLength={6}
              className="block w-full bg-transparent text-center text-[0.9375rem] tracking-[0.35em] text-[#222222] outline-none placeholder:text-[#222222]/25"
            />
          </SettingsFrame>
        </div>
        <div className="flex justify-center">
          <button
            type="submit"
            disabled={pending || code.length !== 6}
            className={settingsAuthButtonClassName}
          >
            Sign in
          </button>
        </div>
        {message ? (
          <p className="whitespace-pre-line text-center text-[0.75rem] leading-snug text-[#222222]/80">
            {message}
          </p>
        ) : (
          <p className="text-center text-[0.75rem] leading-snug text-[#222222]/80">
            {emailOtpCodeHelperText(loginEmail.trim())}
          </p>
        )}
        <div className="flex flex-col items-center gap-2">
          <button
            type="button"
            disabled={pending}
            onClick={() => {
              setMessage("");
              startTransition(async () => {
                try {
                  const response = await fetch("/api/auth/otp/send", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ email: loginEmail.trim() }),
                  });
                  const data = (await response.json()) as { ok: boolean; error?: string };
                  if (data.ok) {
                    setMessage(emailOtpSentMessage(loginEmail.trim()));
                  } else {
                    setMessage(data.error ?? "Could not send sign-in code.");
                  }
                } catch {
                  setMessage("Could not send sign-in code.");
                }
              });
            }}
            className={settingsAuthButtonClassName}
          >
            Send new code
          </button>
          <button
            type="button"
            disabled={pending}
            onClick={() => {
              setStep("email");
              setCode("");
              setMessage("");
            }}
            className={settingsAuthButtonClassName}
          >
            Use a different email
          </button>
        </div>
      </form>
    );
  }

  return (
    <form onSubmit={handleSendCode} className="flex flex-col gap-4">
      <div className="mx-auto w-full max-w-[20.5rem] min-w-0">
        <SettingsFrame>
          <label htmlFor="settings-login-email" className="sr-only">
            Email for sign-in code
          </label>
          <input
            id="settings-login-email"
            type="email"
            value={loginEmail}
            onChange={(event) => setLoginEmail(event.target.value)}
            placeholder="you@example.com"
            autoComplete="email"
            className="block w-full bg-transparent text-center text-[0.8125rem] text-[#222222] outline-none placeholder:text-[#222222]/35"
          />
        </SettingsFrame>
      </div>
      <div className="flex justify-center">
        <button
          type="submit"
          disabled={pending}
          className={settingsAuthButtonClassName}
        >
          Send code
        </button>
      </div>
      {message ? (
        <p className="whitespace-pre-line text-center text-[0.75rem] leading-snug text-[#222222]/80">
          {message}
        </p>
      ) : (
        <p className="text-center text-[0.75rem] leading-snug text-[#222222]/80">
          {emailOtpHelperText()}
        </p>
      )}
    </form>
  );
}
