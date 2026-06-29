import type { UserSettingsFormValues } from "@/lib/user-settings";

export type SettingsLoadResult = {
  isAuthenticated: boolean;
  email: string | null;
  values: UserSettingsFormValues;
  canSave: boolean;
};
