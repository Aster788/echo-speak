import { getSupabase } from "@/lib/supabase";
import type { SupabaseClient } from "@supabase/supabase-js";

export type SyncLogRow = {
  id: string;
  user_id: string;
  sync_type: "full" | "incremental";
  status: "success" | "failed";
  synced_at: string;
  details: Record<string, unknown> | null;
};

export type SyncLogInsert = {
  userId: string;
  syncType: "full" | "incremental";
  status: "success" | "failed";
  syncedAt?: Date;
  details?: Record<string, unknown>;
};

export async function insertSyncLog(
  input: SyncLogInsert,
  client?: SupabaseClient
): Promise<SyncLogRow> {
  const supabase = client ?? getSupabase();
  const { data, error } = await supabase
    .from("sync_logs")
    .insert({
      user_id: input.userId,
      sync_type: input.syncType,
      status: input.status,
      synced_at: (input.syncedAt ?? new Date()).toISOString(),
      details: input.details ?? null,
    })
    .select("*")
    .single();
  if (error) throw error;
  return data as SyncLogRow;
}

export async function getLastSuccessfulSyncLog(
  userId: string,
  client?: SupabaseClient
): Promise<SyncLogRow | null> {
  const supabase = client ?? getSupabase();
  const { data, error } = await supabase
    .from("sync_logs")
    .select("*")
    .eq("user_id", userId)
    .eq("status", "success")
    .order("synced_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return (data as SyncLogRow | null) ?? null;
}
