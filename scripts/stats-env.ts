import { readFileSync } from "fs";
import { resolve } from "path";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const LOCAL_SERVICE_ROLE_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU";

function loadEnvFile(filename: string): void {
  try {
    const content = readFileSync(resolve(process.cwd(), filename), "utf-8");
    for (const line of content.split("\n")) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eq = trimmed.indexOf("=");
      if (eq === -1) continue;
      const key = trimmed.slice(0, eq).trim();
      const value = trimmed.slice(eq + 1).trim();
      if (!(key in process.env)) process.env[key] = value;
    }
  } catch {
    // optional
  }
}

export function loadStatsEnv(): void {
  loadEnvFile(".env.local");
  loadEnvFile(".env.development.local");
}

export function getStatsSupabaseUrl(): string {
  if (process.env.STATS_SUPABASE_URL?.trim()) {
    return process.env.STATS_SUPABASE_URL.trim();
  }
  // Stats scripts default to local CLI (where dismiss audit + 120 expressions live).
  return "http://127.0.0.1:54321";
}

export function getStatsServiceRoleKey(): string {
  if (process.env.STATS_SUPABASE_SERVICE_ROLE_KEY?.trim()) {
    return process.env.STATS_SUPABASE_SERVICE_ROLE_KEY.trim();
  }
  if (getStatsSupabaseUrl().includes("127.0.0.1")) {
    return LOCAL_SERVICE_ROLE_KEY;
  }
  const fromEnv = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!fromEnv) {
    throw new Error(
      "Set STATS_SUPABASE_SERVICE_ROLE_KEY or SUPABASE_SERVICE_ROLE_KEY for cloud stats."
    );
  }
  return fromEnv;
}

export function getStatsClient(): SupabaseClient {
  loadStatsEnv();
  return createClient(getStatsSupabaseUrl(), getStatsServiceRoleKey());
}
