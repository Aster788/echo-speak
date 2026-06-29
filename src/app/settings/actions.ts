"use server";

import { getAuthenticatedUser } from "@/lib/auth-server";
import {
  emptyFormValues,
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
    };
  }

  const values = await resolveStoredSettingsForUser(user.id);
  return {
    isAuthenticated: true,
    email: user.email ?? null,
    values,
    canSave: true,
  };
}

export async function loadStoredSettingsForUser(userId: string) {
  return resolveStoredSettingsForUser(userId);
}

export async function loadEnvFallbackSettings() {
  return resolveEffectiveSettingsFromEnv();
}
