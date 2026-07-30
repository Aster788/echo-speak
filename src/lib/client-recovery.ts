/**
 * Detect errors that commonly appear when iOS Chrome freezes a tab
 * (aborted chunk/RSC fetches) or after a deploy skew — a hard reload heals them.
 */

export const CLIENT_RECOVER_RELOAD_KEY = "echo-speak:recover-reload";

const RECOVERABLE_PATTERN =
  /ChunkLoadError|Loading chunk|Failed to fetch dynamically imported module|error loading dynamically imported module|AbortError|Fetch is aborted|The operation was aborted|Load failed|NetworkError|Failed to fetch|network error|UNEXPECTED_RESPONSE|Invalid response|Connection closed/i;

export function isRecoverableClientError(
  message?: string | null,
  name?: string | null
): boolean {
  const text = `${name ?? ""} ${message ?? ""}`.trim();
  if (!text) return false;
  return RECOVERABLE_PATTERN.test(text);
}

export function shouldAutoReloadNow(
  now: number = Date.now(),
  lastReloadAt: number | null = readLastReloadAt(),
  cooldownMs = 15_000
): boolean {
  if (lastReloadAt == null) return true;
  return now - lastReloadAt >= cooldownMs;
}

export function readLastReloadAt(): number | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.sessionStorage.getItem(CLIENT_RECOVER_RELOAD_KEY);
    if (!raw) return null;
    const n = Number(raw);
    return Number.isFinite(n) ? n : null;
  } catch {
    return null;
  }
}

export function markReloadAttempt(now: number = Date.now()): void {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.setItem(CLIENT_RECOVER_RELOAD_KEY, String(now));
  } catch {
    // private mode — still attempt reload below
  }
}

/** Returns true if a reload was triggered. */
export function reloadOnceForRecoverableError(
  message?: string | null,
  name?: string | null
): boolean {
  if (typeof window === "undefined") return false;
  if (!isRecoverableClientError(message, name)) return false;
  if (!shouldAutoReloadNow()) return false;
  markReloadAttempt();
  window.location.reload();
  return true;
}
