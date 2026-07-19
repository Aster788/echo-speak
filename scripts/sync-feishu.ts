/**
 * CLI: sync notes from Feishu.
 * Usage: npx tsx scripts/sync-feishu.ts [--full] [--fixture path]
 */

import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { getSupabaseAdmin } from "../src/lib/supabase";
import { syncFeishuNotesForUser } from "../src/services/feishu-sync";

async function main() {
  const args = process.argv.slice(2);
  const mode = args.includes("--full") ? "full" : "incremental";
  const fixtureIndex = args.indexOf("--fixture");
  const fixturePath =
    fixtureIndex >= 0 ? args[fixtureIndex + 1] : undefined;

  const userId = process.env.FEISHU_SYNC_USER_ID;
  if (!userId) {
    throw new Error("Set FEISHU_SYNC_USER_ID to the Supabase auth user id.");
  }

  const markdownOverride = fixturePath
    ? readFileSync(resolve(fixturePath), "utf8")
    : undefined;

  const summary = await syncFeishuNotesForUser(userId, {
    mode,
    supabase: getSupabaseAdmin(),
    markdownOverride,
  });

  if (!summary) {
    console.log("Sync skipped (debounced or in progress).");
    return;
  }

  console.log(
    `Synced ${summary.expressionsUpserted} expressions from ${summary.videoSectionsProcessed} video sections across ${summary.docsProcessed} docs.`
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
