import type { SupabaseClient } from "@supabase/supabase-js";
import type { UserSettingsRecord, UserSettingsStoredValues } from "@/lib/user-settings";
import { formValuesToRow } from "@/lib/user-settings";

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
  const row = formValuesToRow(values);
  const { data, error } = await supabase
    .from("user_settings")
    .upsert(
      {
        user_id: userId,
        ...row,
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
