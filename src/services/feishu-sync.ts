import { insertSyncLog } from "@/db/sync-logs";
import { getUserSettings } from "@/db/user-settings";
import { parseFeishuDoc } from "@/lib/feishu-doc-parser";
import {
  fetchDocumentMarkdownContent,
  fetchDocumentTitle,
  fetchTenantAccessToken,
  listAccessibleDocuments,
  type FeishuCredentials,
  type FeishuDocumentRef,
} from "@/lib/feishu-client";
import { parseFeishuDocxTokens } from "@/lib/feishu-doc-urls";
import { FEISHU_SYNC_DEBOUNCE_MINUTES } from "@/lib/feishu-sync-policy";
import { getSupabase } from "@/lib/supabase";
import { ingestFeishuVideoSection } from "@/services/feishu-expression-ingest";
import type { SupabaseClient } from "@supabase/supabase-js";

export type FeishuSyncMode = "incremental" | "full";

export type FeishuSyncResult = {
  docsProcessed: number;
  videoSectionsProcessed: number;
  expressionsUpserted: number;
  tablesParsed: number;
  sentencesExtracted: number;
  skippedTranscriptDuplicates: number;
  skippedSubsumedVocab: number;
};

const syncStartedAt = new Map<string, number>();

function credentialsFromSettings(
  settings: Awaited<ReturnType<typeof getUserSettings>>
): FeishuCredentials | null {
  const appId = settings?.feishu_app_id?.trim();
  const appSecret = settings?.feishu_app_secret?.trim();
  if (!appId || !appSecret) return null;
  return { appId, appSecret };
}

async function updateLastFeishuSyncAt(
  userId: string,
  syncedAt: Date,
  supabase: SupabaseClient
): Promise<void> {
  const { error } = await supabase
    .from("user_settings")
    .update({
      last_feishu_sync_at: syncedAt.toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("user_id", userId);
  if (error) throw error;
}

function shouldDebounce(userId: string): boolean {
  const started = syncStartedAt.get(userId);
  if (!started) return false;
  const debounceMs = FEISHU_SYNC_DEBOUNCE_MINUTES * 60 * 1000;
  return Date.now() - started < debounceMs;
}

export async function syncFeishuNotesForUser(
  userId: string,
  options: {
    mode?: FeishuSyncMode;
    supabase?: SupabaseClient;
    markdownOverride?: string;
  } = {}
): Promise<FeishuSyncResult | null> {
  const supabase = options.supabase ?? getSupabase();
  const mode = options.mode ?? "incremental";

  if (shouldDebounce(userId)) {
    return null;
  }

  syncStartedAt.set(userId, Date.now());
  const syncStarted = new Date();

  try {
    const settings = await getUserSettings(userId, supabase);
    const credentials = credentialsFromSettings(settings);
    if (!credentials) {
      throw new Error("Feishu credentials are required in Settings.");
    }

    let docs: Array<{ token: string; name: string; updatedAt: string; content?: string }>;

    if (options.markdownOverride) {
      docs = [
        {
          token: "fixture",
          name: "fixture",
          updatedAt: new Date().toISOString(),
          content: options.markdownOverride,
        },
      ];
    } else {
      const tenantToken = await fetchTenantAccessToken(credentials);
      const listed = await listAccessibleDocuments(tenantToken);
      const configuredTokens = parseFeishuDocxTokens(
        settings?.feishu_document_urls
      );

      const byToken = new Map<string, FeishuDocumentRef>();
      for (const doc of listed) {
        byToken.set(doc.token, doc);
      }

      for (const token of configuredTokens) {
        if (byToken.has(token)) continue;
        let name = token;
        try {
          name = await fetchDocumentTitle(tenantToken, token);
        } catch {
          // Still try content fetch later; title is best-effort.
        }
        byToken.set(token, {
          token,
          name,
          updatedAt: new Date().toISOString(),
        });
      }

      if (byToken.size === 0) {
        throw new Error(
          "No Feishu documents found. Add FEISHU_DOCUMENT_URLS in Settings (docx URL shared with the Echo Speak app). drive/v1/files only lists the app's own folder, not collaborator docs."
        );
      }

      const cursor = settings?.last_feishu_sync_at
        ? new Date(settings.last_feishu_sync_at)
        : null;

      docs = [...byToken.values()]
        .filter((doc) => {
          if (mode === "full" || !cursor) return true;
          // Configured docs always included on full; on incremental, include when
          // list API has a newer updatedAt, or when the doc was only from URLs
          // (unknown mtime → treat as due).
          if (!listed.some((item) => item.token === doc.token)) return true;
          return new Date(doc.updatedAt) > cursor;
        })
        .map((doc) => ({ ...doc }));
    }

    let videoSectionsProcessed = 0;
    let expressionsUpserted = 0;
    let tablesParsed = 0;
    let sentencesExtracted = 0;
    let skippedTranscriptDuplicates = 0;
    let skippedSubsumedVocab = 0;
    const errors: Array<{ doc: string; error: string }> = [];

    if (!options.markdownOverride) {
      const tenantToken = await fetchTenantAccessToken(credentials);
      for (const doc of docs) {
        try {
          doc.content = await fetchDocumentMarkdownContent(
            tenantToken,
            doc.token
          );
        } catch (error) {
          errors.push({
            doc: doc.name,
            error: error instanceof Error ? error.message : String(error),
          });
        }
      }
    }

    for (const doc of docs) {
      if (!doc.content) continue;
      try {
        const sections = parseFeishuDoc(doc.content);
        for (const section of sections) {
          const result = await ingestFeishuVideoSection(section, { supabase });
          videoSectionsProcessed += 1;
          expressionsUpserted += result.expressionsUpserted;
          tablesParsed += result.tablesParsed;
          sentencesExtracted += result.sentencesExtracted;
          skippedTranscriptDuplicates += result.skippedTranscriptDuplicates;
          skippedSubsumedVocab += result.skippedSubsumedVocab;
        }
      } catch (error) {
        errors.push({
          doc: doc.name,
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }

    const summary: FeishuSyncResult = {
      docsProcessed: docs.filter((doc) => doc.content).length,
      videoSectionsProcessed,
      expressionsUpserted,
      tablesParsed,
      sentencesExtracted,
      skippedTranscriptDuplicates,
      skippedSubsumedVocab,
    };

    const failed = errors.length > 0 && videoSectionsProcessed === 0;
    await insertSyncLog(
      {
        userId,
        syncType: mode,
        status: failed ? "failed" : "success",
        syncedAt: syncStarted,
        details: { ...summary, errors: errors.length ? errors : undefined },
      },
      supabase
    );

    if (!failed) {
      await updateLastFeishuSyncAt(userId, syncStarted, supabase);
    }

    return summary;
  } catch (error) {
    await insertSyncLog(
      {
        userId,
        syncType: mode,
        status: "failed",
        syncedAt: syncStarted,
        details: {
          error: error instanceof Error ? error.message : String(error),
        },
      },
      supabase
    );
    throw error;
  } finally {
    syncStartedAt.delete(userId);
  }
}

/** @deprecated Use syncFeishuNotesForUser */
export async function syncFeishuNotes(): Promise<never> {
  throw new Error("Use syncFeishuNotesForUser with an authenticated user id.");
}
