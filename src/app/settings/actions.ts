"use server";

import { getAuthenticatedUser } from "@/lib/auth-server";
import { getUserSettings } from "@/db/user-settings";
import { DEFAULT_DAILY_REVIEW_BUDGET } from "@/lib/daily-review-budget";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  emptyFormValues,
  rowToFormValues,
} from "@/lib/user-settings";
import {
  resolveEffectiveSettingsFromEnv,
  resolveStoredSettingsForUser,
} from "@/lib/request-llm";
import type { SettingsLoadResult } from "@/app/settings/types";

export type { SettingsLoadResult } from "@/app/settings/types";

export async function loadSettings(): Promise<SettingsLoadResult> {
  const user = await getAuthenticatedUser();
  if (!user) {
    return {
      isAuthenticated: false,
      email: null,
      values: emptyFormValues(),
      canSave: false,
      reviewBudget: DEFAULT_DAILY_REVIEW_BUDGET,
    };
  }

  const supabase = await createSupabaseServerClient();
  const row = await getUserSettings(user.id, supabase);
  return {
    isAuthenticated: true,
    email: user.email ?? null,
    values: rowToFormValues(row),
    canSave: true,
    reviewBudget:
      row?.daily_review_budget ?? DEFAULT_DAILY_REVIEW_BUDGET,
  };
}

export async function loadStoredSettingsForUser(userId: string) {
  return resolveStoredSettingsForUser(userId);
}

export async function loadEnvFallbackSettings() {
  return resolveEffectiveSettingsFromEnv();
}
