import type { SupabaseClient } from "@supabase/supabase-js";
import type { UserSettingsRecord, UserSettingsStoredValues } from "@/lib/user-settings";
import { formValuesToRow } from "@/lib/user-settings";
import { DEFAULT_DAILY_REVIEW_BUDGET } from "@/lib/daily-review-budget";

export async function getUserSettings(
  userId: string,
  supabase: SupabaseClient
): Promise<UserSettingsRecord | null> {
  const { data, error } = await supabase
    .from("user_settings")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }
  return data as UserSettingsRecord | null;
}

export async function upsertUserSettings(
  userId: string,
  values: UserSettingsStoredValues,
  supabase: SupabaseClient
): Promise<UserSettingsRecord> {
  const existing = await getUserSettings(userId, supabase);
  const row = formValuesToRow(values);
  const { data, error } = await supabase
    .from("user_settings")
    .upsert(
      {
        user_id: userId,
        ...row,
        daily_review_budget:
          existing?.daily_review_budget ?? DEFAULT_DAILY_REVIEW_BUDGET,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id" }
    )
    .select("*")
    .single();

  if (error) {
    throw new Error(error.message);
  }
  return data as UserSettingsRecord;
}
