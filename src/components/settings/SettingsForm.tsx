"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition, type FormEvent } from "react";
import { SettingsAuthStrip } from "@/components/settings/SettingsAuthStrip";
import { SettingsField } from "@/components/settings/SettingsField";
import {
  SETTINGS_FEISHU_HINT,
  SETTINGS_LLM_HINT,
  USER_SETTINGS_FEISHU_FIELDS,
  USER_SETTINGS_LLM_FIELDS,
  type UserSettingsFormKey,
} from "@/lib/user-settings";
import type { MagicLinkAuthReason } from "@/lib/auth-magic-link";
import type { SettingsLoadResult } from "@/app/settings/types";

type SettingsFormProps = {
  initial: SettingsLoadResult;
  authReason?: MagicLinkAuthReason | null;
};

function SettingsFieldGroup({
  hint,
  fields,
  values,
  onChange,
}: {
  hint: string;
  fields: typeof USER_SETTINGS_LLM_FIELDS;
  values: SettingsLoadResult["values"];
  onChange: (key: UserSettingsFormKey, value: string) => void;
}) {
  return (
    <div className="flex flex-col gap-3">
      <p className="text-[0.75rem] leading-snug text-[#222222]/80">{hint}</p>
      {fields.map((field) => (
        <SettingsField
          key={field.key}
          fieldKey={field.key}
          label={field.label}
          secret={field.secret}
          value={values[field.key]}
          onChange={(event) => onChange(field.key, event.target.value)}
          placeholder="请输入"
        />
      ))}
    </div>
  );
}

export function SettingsForm({ initial, authReason }: SettingsFormProps) {
  const router = useRouter();
  const [state, setState] = useState(initial);
  const [values, setValues] = useState(initial.values);
  const [saveState, setSaveState] = useState<"idle" | "saved" | "error">("idle");
  const [saveMessage, setSaveMessage] = useState("");
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    setState(initial);
    setValues(initial.values);
  }, [initial]);

  useEffect(() => {
    if (saveState !== "saved") return;
    const timer = window.setTimeout(() => setSaveState("idle"), 2000);
    return () => window.clearTimeout(timer);
  }, [saveState]);

  function refreshSettings() {
    router.refresh();
  }

  function handleFieldChange(key: UserSettingsFormKey, value: string) {
    setValues((current) => ({
      ...current,
      [key]: value,
    }));
  }

  function handleSave(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaveState("idle");
    setSaveMessage("");
    startTransition(async () => {
      try {
        const response = await fetch("/api/settings/save", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(values),
        });
        const result = (await response.json()) as {
          ok: boolean;
          error?: string;
        };
        if (result.ok) {
          setSaveState("saved");
          refreshSettings();
        } else {
          setSaveState("error");
          setSaveMessage(result.error ?? "Could not save settings.");
        }
      } catch {
        setSaveState("error");
        setSaveMessage("Could not save settings.");
      }
    });
  }

  return (
    <div className="mt-3 flex flex-col gap-4">
      <SettingsAuthStrip
        isAuthenticated={state.isAuthenticated}
        email={state.email}
        authReason={authReason}
        onAuthChange={refreshSettings}
      />

      {state.isAuthenticated ? (
        <form onSubmit={handleSave} className="flex flex-col gap-4">
          <SettingsFieldGroup
            hint={SETTINGS_LLM_HINT}
            fields={USER_SETTINGS_LLM_FIELDS}
            values={values}
            onChange={handleFieldChange}
          />

          <SettingsFieldGroup
            hint={SETTINGS_FEISHU_HINT}
            fields={USER_SETTINGS_FEISHU_FIELDS}
            values={values}
            onChange={handleFieldChange}
          />

          <div className="flex flex-col items-stretch">
            <button
              type="submit"
              disabled={pending}
              className="rounded-[1rem] border-[2.5px] border-[#D4D4D4] px-4 py-2.5 text-center text-[0.8125rem] font-medium text-[#222222] transition-opacity duration-150 hover:opacity-80 disabled:opacity-50"
            >
              Save settings
            </button>
            {saveState === "saved" ? (
              <p className="mt-2 text-center text-[0.75rem] text-[#222222]/80">
                Settings saved.
              </p>
            ) : saveState === "error" && saveMessage ? (
              <p className="mt-2 text-center text-[0.75rem] text-[#222222]/80">
                {saveMessage}
              </p>
            ) : null}
          </div>
        </form>
      ) : (
        <p className="text-[0.75rem] leading-snug text-[#222222]/80">
          Sign in above to view and save your LLM and Feishu keys.
        </p>
      )}
    </div>
  );
}
