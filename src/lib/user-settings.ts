export type UserSettingsFormKey =
  | "LLM_API_KEY"
  | "LLM_BASE_URL"
  | "LLM_MODEL"
  | "FEISHU_APP_ID"
  | "FEISHU_APP_SECRET";

/** Stored in DB but not shown on Settings (deployment env only). */
export type UserSettingsHiddenKey =
  | "NEXT_PUBLIC_SUPABASE_URL"
  | "NEXT_PUBLIC_SUPABASE_ANON_KEY";

export type UserSettingsStoredKey = UserSettingsFormKey | UserSettingsHiddenKey;

/** @deprecated Use UserSettingsFormKey or UserSettingsStoredKey */
export type UserSettingsKey = UserSettingsStoredKey;

export type UserSettingsRecord = {
  user_id: string;
  llm_api_key: string | null;
  llm_base_url: string | null;
  llm_model: string | null;
  supabase_url: string | null;
  supabase_anon_key: string | null;
  feishu_app_id: string | null;
  feishu_app_secret: string | null;
  created_at: string;
  updated_at: string;
};

export type UserSettingsFormValues = Record<UserSettingsFormKey, string>;
export type UserSettingsStoredValues = Record<UserSettingsStoredKey, string>;

type SettingsFieldDef<K extends UserSettingsStoredKey = UserSettingsStoredKey> = {
  key: K;
  label: string;
  secret: boolean;
  placeholder?: string;
};

export const USER_SETTINGS_LLM_FIELDS: SettingsFieldDef<UserSettingsFormKey>[] = [
  { key: "LLM_API_KEY", label: "LLM_API_KEY", secret: true },
  {
    key: "LLM_BASE_URL",
    label: "LLM_BASE_URL",
    secret: false,
  },
  {
    key: "LLM_MODEL",
    label: "LLM_MODEL",
    secret: false,
  },
];

export const USER_SETTINGS_FEISHU_FIELDS: SettingsFieldDef<UserSettingsFormKey>[] = [
  { key: "FEISHU_APP_ID", label: "FEISHU_APP_ID", secret: false },
  { key: "FEISHU_APP_SECRET", label: "FEISHU_APP_SECRET", secret: true },
];

export const USER_SETTINGS_FORM_FIELDS: SettingsFieldDef<UserSettingsFormKey>[] = [
  ...USER_SETTINGS_LLM_FIELDS,
  ...USER_SETTINGS_FEISHU_FIELDS,
];

export const SETTINGS_LLM_HINT =
  "Use your own API keys. AI features won't work if left empty.";

export const SETTINGS_FEISHU_HINT =
  "Use your own Feishu app credentials. Feishu sync won't work if left empty.";

const USER_SETTINGS_HIDDEN_FIELDS: SettingsFieldDef<UserSettingsHiddenKey>[] = [
  { key: "NEXT_PUBLIC_SUPABASE_URL", label: "NEXT_PUBLIC_SUPABASE_URL", secret: false },
  {
    key: "NEXT_PUBLIC_SUPABASE_ANON_KEY",
    label: "NEXT_PUBLIC_SUPABASE_ANON_KEY",
    secret: true,
  },
];

/** All keys persisted in user_settings (form + legacy hidden). */
export const USER_SETTINGS_STORED_FIELDS: SettingsFieldDef[] = [
  ...USER_SETTINGS_FORM_FIELDS,
  ...USER_SETTINGS_HIDDEN_FIELDS,
];

/** @deprecated Use USER_SETTINGS_FORM_FIELDS for UI. */
export const USER_SETTINGS_FIELDS = USER_SETTINGS_STORED_FIELDS;

const KEY_TO_COLUMN: Record<
  UserSettingsStoredKey,
  keyof Omit<UserSettingsRecord, "user_id" | "created_at" | "updated_at">
> = {
  LLM_API_KEY: "llm_api_key",
  LLM_BASE_URL: "llm_base_url",
  LLM_MODEL: "llm_model",
  NEXT_PUBLIC_SUPABASE_URL: "supabase_url",
  NEXT_PUBLIC_SUPABASE_ANON_KEY: "supabase_anon_key",
  FEISHU_APP_ID: "feishu_app_id",
  FEISHU_APP_SECRET: "feishu_app_secret",
};

export function emptyFormValues(): UserSettingsFormValues {
  const values = {} as UserSettingsFormValues;
  for (const field of USER_SETTINGS_FORM_FIELDS) {
    values[field.key] = "";
  }
  return values;
}

export function formValuesToRow(
  values: UserSettingsStoredValues
): Omit<UserSettingsRecord, "user_id" | "created_at" | "updated_at"> {
  const row = {} as Omit<UserSettingsRecord, "user_id" | "created_at" | "updated_at">;
  for (const field of USER_SETTINGS_STORED_FIELDS) {
    const column = KEY_TO_COLUMN[field.key];
    const value = values[field.key]?.trim() ?? "";
    row[column] = value || null;
  }
  return row;
}

export function rowToStoredValues(
  row: Partial<UserSettingsRecord> | null
): UserSettingsStoredValues {
  const values = {} as UserSettingsStoredValues;
  for (const field of USER_SETTINGS_STORED_FIELDS) {
    const column = KEY_TO_COLUMN[field.key];
    values[field.key] = (row?.[column] as string | null) ?? "";
  }
  return values;
}

export function rowToFormValues(
  row: Partial<UserSettingsRecord> | null
): UserSettingsFormValues {
  const values = {} as UserSettingsFormValues;
  for (const field of USER_SETTINGS_FORM_FIELDS) {
    const column = KEY_TO_COLUMN[field.key];
    values[field.key] = (row?.[column] as string | null) ?? "";
  }
  return values;
}

/** Merge editable form input with hidden columns left unchanged in the DB. */
export function mergeFormValuesWithStoredRow(
  form: UserSettingsFormValues,
  row: Partial<UserSettingsRecord> | null
): UserSettingsStoredValues {
  return {
    ...rowToStoredValues(row),
    ...form,
  };
}

export function envFallbackValues(): UserSettingsStoredValues {
  return {
    LLM_API_KEY: process.env.LLM_API_KEY ?? process.env.OPENAI_API_KEY ?? "",
    LLM_BASE_URL: process.env.LLM_BASE_URL ?? process.env.OPENAI_BASE_URL ?? "",
    LLM_MODEL:
      process.env.LLM_MODEL ?? process.env.OPENAI_MODEL ?? "deepseek-chat",
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "",
    FEISHU_APP_ID: process.env.FEISHU_APP_ID ?? "",
    FEISHU_APP_SECRET: process.env.FEISHU_APP_SECRET ?? "",
  };
}

/** Deployment env applies only to hidden Supabase keys (shared site infrastructure). */
const ENV_FALLBACK_KEYS: UserSettingsHiddenKey[] = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
];

export function mergeSettingsWithEnv(
  stored: UserSettingsStoredValues
): UserSettingsStoredValues {
  const env = envFallbackValues();
  const merged = { ...stored };
  for (const key of ENV_FALLBACK_KEYS) {
    merged[key] = stored[key]?.trim() || env[key] || "";
  }
  return merged;
}

export type LlmOverrides = {
  apiKey?: string;
  baseUrl?: string;
  model?: string;
};

export function llmOverridesFromFormValues(
  values: Pick<UserSettingsStoredValues, "LLM_API_KEY" | "LLM_BASE_URL" | "LLM_MODEL">
): LlmOverrides {
  return {
    apiKey: values.LLM_API_KEY?.trim() || undefined,
    baseUrl: values.LLM_BASE_URL?.trim() || undefined,
    model: values.LLM_MODEL?.trim() || undefined,
  };
}
