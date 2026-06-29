import { getAuthenticatedUser } from "@/lib/auth-server";
import { getUserSettings } from "@/db/user-settings";
import {
  envFallbackValues,
  llmOverridesFromFormValues,
  mergeSettingsWithEnv,
  rowToFormValues,
  rowToStoredValues,
  type LlmOverrides,
} from "@/lib/user-settings";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { runWithLlmOverridesAsync } from "@/lib/llm-context";

export async function resolveLlmOverridesForRequest(): Promise<LlmOverrides | undefined> {
  const user = await getAuthenticatedUser();
  if (!user) {
    return undefined;
  }

  const supabase = await createSupabaseServerClient();
  const row = await getUserSettings(user.id, supabase);
  const stored = rowToFormValues(row);
  return llmOverridesFromFormValues(stored);
}

export async function withRequestLlmOverrides<T>(fn: () => Promise<T>): Promise<T> {
  const overrides = await resolveLlmOverridesForRequest();
  return runWithLlmOverridesAsync(overrides, fn);
}

export async function resolveStoredSettingsForUser(userId: string) {
  const supabase = await createSupabaseServerClient();
  const row = await getUserSettings(userId, supabase);
  return rowToFormValues(row);
}

export async function resolveEffectiveSettingsForUser(userId: string) {
  const supabase = await createSupabaseServerClient();
  const row = await getUserSettings(userId, supabase);
  const stored = rowToStoredValues(row);
  return mergeSettingsWithEnv(stored);
}

export function resolveEffectiveSettingsFromEnv() {
  return envFallbackValues();
}
