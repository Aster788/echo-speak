"use server";

import { getLastSuccessfulSyncLog } from "@/db/sync-logs";
import { getUserSettings } from "@/db/user-settings";
import { getAuthenticatedUser } from "@/lib/auth-server";
import {
  formatFeishuSyncStatusLabel,
  isFeishuSyncStale,
} from "@/lib/feishu-sync-policy";
import { getSupabaseAdmin } from "@/lib/supabase";
import { syncFeishuNotesForUser, type FeishuSyncMode } from "@/services/feishu-sync";

export type FeishuHomeStatus = {
  line: string | null;
  shouldAutoSync: boolean;
};

export async function getFeishuHomeStatus(): Promise<FeishuHomeStatus> {
  const user = await getAuthenticatedUser();
  if (!user) {
    return { line: null, shouldAutoSync: false };
  }

  const supabase = getSupabaseAdmin();
  const settings = await getUserSettings(user.id, supabase);
  const hasCredentials =
    Boolean(settings?.feishu_app_id?.trim()) &&
    Boolean(settings?.feishu_app_secret?.trim());

  if (!hasCredentials) {
    return {
      line: "Feishu · Add credentials in Settings",
      shouldAutoSync: false,
    };
  }

  const lastLog = await getLastSuccessfulSyncLog(user.id, supabase);
  const lastSyncedAt =
    settings?.last_feishu_sync_at ?? lastLog?.synced_at ?? null;

  return {
    line: formatFeishuSyncStatusLabel(lastSyncedAt),
    shouldAutoSync: isFeishuSyncStale(lastSyncedAt),
  };
}

export async function triggerFeishuSyncIfStale(): Promise<void> {
  const status = await getFeishuHomeStatus();
  if (!status.shouldAutoSync) return;

  const user = await getAuthenticatedUser();
  if (!user) return;

  try {
    await syncFeishuNotesForUser(user.id, {
      mode: "incremental",
      supabase: getSupabaseAdmin(),
    });
  } catch {
    // Silent on Home — errors logged via sync_logs only.
  }
}

export async function runFeishuSyncManual(
  mode: FeishuSyncMode = "incremental"
): Promise<{ ok: true; summary: string } | { ok: false; error: string }> {
  const user = await getAuthenticatedUser();
  if (!user) {
    return { ok: false, error: "Sign in to sync Feishu notes." };
  }

  try {
    const summary = await syncFeishuNotesForUser(user.id, {
      mode,
      supabase: getSupabaseAdmin(),
    });
    if (!summary) {
      return { ok: true, summary: "Sync already in progress." };
    }
    return {
      ok: true,
      summary: `Synced ${summary.expressionsUpserted} expressions from ${summary.videoSectionsProcessed} videos across ${summary.docsProcessed} docs.`,
    };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Feishu sync failed.",
    };
  }
}
