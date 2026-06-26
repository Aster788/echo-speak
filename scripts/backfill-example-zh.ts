import { readFileSync } from "fs";
import { resolve } from "path";
import { backfillMissingExampleZh } from "@/services/expression-pipeline";

function loadEnvLocal(): void {
  try {
    const envPath = resolve(process.cwd(), ".env.local");
    const content = readFileSync(envPath, "utf-8");
    for (const line of content.split("\n")) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eq = trimmed.indexOf("=");
      if (eq === -1) continue;
      const key = trimmed.slice(0, eq).trim();
      const value = trimmed.slice(eq + 1).trim();
      if (!(key in process.env)) {
        process.env[key] = value;
      }
    }
  } catch {
    // .env.local optional if vars already exported
  }
}

function applyLocalOverride(): void {
  const localUrl =
    process.env.STATS_SUPABASE_URL ??
    process.env.LOCAL_NEXT_PUBLIC_SUPABASE_URL;
  const localKey =
    process.env.STATS_SUPABASE_SERVICE_ROLE_KEY ??
    process.env.LOCAL_SUPABASE_SERVICE_ROLE_KEY;

  if (localUrl) {
    process.env.NEXT_PUBLIC_SUPABASE_URL = localUrl;
  }
  if (localKey) {
    process.env.SUPABASE_SERVICE_ROLE_KEY = localKey;
  }
}

async function main() {
  loadEnvLocal();
  applyLocalOverride();

  const force = process.argv.includes("--force");
  const result = await backfillMissingExampleZh({
    force,
  });

  console.log(
    `Backfill complete (${force ? "force" : "null-only"}): ${result.updated} updated, ${result.skipped} skipped, ${result.unchanged} unchanged.`
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
