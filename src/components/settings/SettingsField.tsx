"use client";

import { useRef, useState, type InputHTMLAttributes } from "react";
import { SettingsFrame } from "@/components/settings/SettingsFrame";
import { pageHintFont } from "@/lib/page-hint-font";
import type { UserSettingsFormKey } from "@/lib/user-settings";

type SettingsFieldProps = Omit<InputHTMLAttributes<HTMLInputElement>, "type"> & {
  fieldKey: UserSettingsFormKey;
  label: string;
  secret?: boolean;
};

function EyeIcon({ open }: { open: boolean }) {
  if (open) {
    return (
      <svg
        width="14"
        height="14"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        aria-hidden="true"
      >
        <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z" />
        <circle cx="12" cy="12" r="3" />
      </svg>
    );
  }

  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      aria-hidden="true"
    >
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-10-8-10-8a18.45 18.45 0 0 1 5.06-5.94" />
      <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 10 8 10 8a18.5 18.5 0 0 1-2.16 3.19" />
      <path d="M1 1l22 22" />
      <path d="M14.12 14.12a3 3 0 1 1-4.24-4.24" />
    </svg>
  );
}

export function SettingsField({
  fieldKey,
  label,
  secret = false,
  className = "",
  id,
  ...inputProps
}: SettingsFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [revealed, setRevealed] = useState(false);
  const inputId = id ?? `settings-${fieldKey}`;
  const inputType = secret && !revealed ? "password" : "text";

  function focusInput() {
    inputRef.current?.focus();
  }

  return (
    <SettingsFrame className={secret ? "pr-6" : undefined}>
      <div
        className={`${pageHintFont.className} flex w-full min-w-0 items-center gap-[1ch] text-[0.8125rem] font-normal tracking-[0.01em] text-[#222222]`}
      >
        <label htmlFor={inputId} className="shrink-0 cursor-text">
          {label}:
        </label>
        <div
          className="flex min-w-0 flex-1 items-center overflow-hidden"
          onClick={(event) => {
            if (event.target === event.currentTarget) {
              focusInput();
            }
          }}
        >
          <input
            ref={inputRef}
            id={inputId}
            name={fieldKey}
            type={inputType}
            className={`min-w-0 flex-1 bg-transparent text-[0.8125rem] font-normal text-[#222222] outline-none placeholder:text-[#222222]/35 ${className}`}
            style={{ overflowX: "auto" }}
            spellCheck={false}
            autoComplete="off"
            {...inputProps}
          />
          {secret ? (
            <button
              type="button"
              onClick={() => setRevealed((current) => !current)}
              className="-ml-0.5 shrink-0 p-0.5 text-[#222222]/55 hover:text-[#222222]"
              aria-label={revealed ? "Hide value" : "Show value"}
            >
              <EyeIcon open={revealed} />
            </button>
          ) : null}
        </div>
      </div>
    </SettingsFrame>
  );
}
