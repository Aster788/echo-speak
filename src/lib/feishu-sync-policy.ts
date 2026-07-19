/** Hours after last sync before Home triggers background incremental sync. */
export const FEISHU_AUTO_SYNC_STALE_HOURS = 6;

/** Skip starting a new sync if one began within this many minutes. */
export const FEISHU_SYNC_DEBOUNCE_MINUTES = 5;

/**
 * Video sections per Server Action / API invocation.
 * Full Sync all loops client-side; keeps each run under Vercel's 300s limit
 * (each section may call LLM for sentences + example_zh).
 */
export const FEISHU_SYNC_MAX_SECTIONS_PER_RUN = 2;

export function isFeishuSyncStale(
  lastSyncedAt: string | null | undefined,
  now: Date = new Date()
): boolean {
  if (!lastSyncedAt) return true;
  const last = new Date(lastSyncedAt).getTime();
  const staleMs = FEISHU_AUTO_SYNC_STALE_HOURS * 60 * 60 * 1000;
  return now.getTime() - last >= staleMs;
}

export function formatFeishuSyncStatusLabel(
  syncedAt: string | null | undefined,
  now: Date = new Date()
): string {
  if (!syncedAt) return "Feishu · Not synced yet";
  const diffMs = now.getTime() - new Date(syncedAt).getTime();
  const diffMinutes = Math.floor(diffMs / (60 * 1000));
  if (diffMinutes < 1) return "Feishu ✓ Synced just now";
  if (diffMinutes < 60) {
    return `Feishu ✓ Synced ${diffMinutes} minute${diffMinutes === 1 ? "" : "s"} ago`;
  }
  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 48) {
    return `Feishu ✓ Synced ${diffHours} hour${diffHours === 1 ? "" : "s"} ago`;
  }
  const diffDays = Math.floor(diffHours / 24);
  return `Feishu ✓ Synced ${diffDays} day${diffDays === 1 ? "" : "s"} ago`;
}
