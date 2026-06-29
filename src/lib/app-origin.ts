import { headers } from "next/headers";

/** Origin of the app the user is actually visiting (dev port, Vercel, etc.). */
export async function getAppOrigin(request?: Request): Promise<string> {
  const fromEnv = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (fromEnv) {
    return fromEnv.replace(/\/$/, "");
  }

  if (request) {
    return new URL(request.url).origin;
  }

  const headerList = await headers();
  const host = headerList.get("x-forwarded-host") ?? headerList.get("host");
  const proto = headerList.get("x-forwarded-proto") ?? "http";
  if (host) {
    return `${proto}://${host}`;
  }

  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }

  return "http://localhost:3000";
}

/** Must match an entry in Supabase Auth redirect URLs (exact match; no query string). */
export function settingsAuthCallbackUrl(origin: string): string {
  return `${origin}/auth/callback`;
}
