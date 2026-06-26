function decodeJwtPayload(token: string): Record<string, unknown> | null {
  try {
    const part = token.split(".")[1];
    if (!part) {
      return null;
    }
    const json = Buffer.from(
      part.replace(/-/g, "+").replace(/_/g, "/"),
      "base64"
    ).toString();
    return JSON.parse(json) as Record<string, unknown>;
  } catch {
    return null;
  }
}

function isLocalSupabaseUrl(url: string): boolean {
  return /127\.0\.0\.1|localhost/.test(url);
}

export function assertSupabaseKeyMatchesUrl(url: string, key: string): void {
  const payload = decodeJwtPayload(key);
  if (!payload) {
    throw new Error(
      "Supabase API key is not a valid JWT. Check SUPABASE_SERVICE_ROLE_KEY in your env files."
    );
  }

  const isLocalUrl = isLocalSupabaseUrl(url);
  const isDemoKey = payload.iss === "supabase-demo";

  if (isLocalUrl && !isDemoKey) {
    throw new Error(
      "Supabase URL points to local CLI (127.0.0.1) but the service role key is for cloud. " +
        "Run `npm run sync-dev-supabase-env` (after `npx supabase start`), then restart `npm run dev`. " +
        "Or remove .env.development.local to use cloud Supabase from .env.local instead."
    );
  }

  if (!isLocalUrl && isDemoKey) {
    throw new Error(
      "Supabase URL points to cloud but the service role key is the local demo key. " +
        "Use the cloud service_role secret from Supabase Dashboard in .env.local, or remove .env.development.local overrides."
    );
  }
}

export function isSupabaseConfigError(message: string): boolean {
  return (
    message.includes("PGRST301") ||
    message.includes("Supabase URL points to") ||
    message.includes("Supabase API key is not a valid JWT") ||
    message.includes("Supabase URL and service role key must be set")
  );
}
