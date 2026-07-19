"use server";

import { getLastSuccessfulSyncLog } from "@/db/sync-logs";
import { getUserSettings } from "@/db/user-settings";
import { getAuthenticatedUser } from "@/lib/auth-server";
import {
  formatFeishuSyncStatusLabel,
  isFeishuSyncStale,
} from "@/lib/feishu-sync-policy";
import { getSupabaseAdmin } from "@/lib/supabase";
import {
  syncFeishuNotesForUser,
  type FeishuSyncMode,
  type FeishuSyncResult,
} from "@/services/feishu-sync";

export type FeishuHomeStatus = {
  line: string | null;
  shouldAutoSync: boolean;
  userId: string | null;
};

export type FeishuManualSyncOk = {
  ok: true;
  summary: string;
  result: FeishuSyncResult;
};

export type FeishuManualSyncErr = {
  ok: false;
  error: string;
};

export async function getFeishuHomeStatus(): Promise<FeishuHomeStatus> {
  const user = await getAuthenticatedUser();
  if (!user) {
    return { line: null, shouldAutoSync: false, userId: null };
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
      userId: user.id,
    };
  }

  const lastLog = await getLastSuccessfulSyncLog(user.id, supabase);
  const lastSyncedAt =
    settings?.last_feishu_sync_at ?? lastLog?.synced_at ?? null;

  return {
    line: formatFeishuSyncStatusLabel(lastSyncedAt),
    shouldAutoSync: isFeishuSyncStale(lastSyncedAt),
    userId: user.id,
  };
}

/** Call only with a userId captured outside Next.js `after()`. */
export async function runFeishuSyncForUserId(
  userId: string,
  mode: FeishuSyncMode = "incremental"
): Promise<void> {
  try {
    let sectionOffset = 0;
    // Cap background chunks so Home after() cannot approach the platform timeout.
    for (let chunk = 0; chunk < 3; chunk += 1) {
      const result = await syncFeishuNotesForUser(userId, {
        mode,
        sectionOffset,
        supabase: getSupabaseAdmin(),
      });
      if (!result || result.complete) return;
      sectionOffset = result.nextSectionOffset;
    }
  } catch {
    // Silent on Home — errors logged via sync_logs only.
  }
}

export async function triggerFeishuSyncIfStale(): Promise<void> {
  const status = await getFeishuHomeStatus();
  if (!status.shouldAutoSync || !status.userId) return;
  await runFeishuSyncForUserId(status.userId, "incremental");
}

export async function runFeishuSyncManual(
  mode: FeishuSyncMode = "incremental",
  options: { sectionOffset?: number } = {}
): Promise<FeishuManualSyncOk | FeishuManualSyncErr> {
  const user = await getAuthenticatedUser();
  if (!user) {
    return { ok: false, error: "Sign in to sync Feishu notes." };
  }

  try {
    const result = await syncFeishuNotesForUser(user.id, {
      mode,
      sectionOffset: options.sectionOffset,
      supabase: getSupabaseAdmin(),
    });
    if (!result) {
      return {
        ok: true,
        summary: "Sync already in progress.",
        result: {
          docsProcessed: 0,
          videoSectionsProcessed: 0,
          expressionsUpserted: 0,
          tablesParsed: 0,
          sentencesExtracted: 0,
          skippedTranscriptDuplicates: 0,
          skippedSubsumedVocab: 0,
          complete: true,
          nextSectionOffset: 0,
          totalSections: 0,
        },
      };
    }

    const progress =
      result.totalSections > 0
        ? ` (${Math.min(
            (options.sectionOffset ?? 0) + result.videoSectionsProcessed,
            result.totalSections
          )}/${result.totalSections} videos)`
        : "";

    return {
      ok: true,
      summary: result.complete
        ? `Synced ${result.expressionsUpserted} expressions from ${result.videoSectionsProcessed} videos across ${result.docsProcessed} docs${progress}.`
        : `Syncing… ${result.expressionsUpserted} expressions from ${result.videoSectionsProcessed} videos${progress}. Continuing.`,
      result,
    };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Feishu sync failed.",
    };
  }
}
