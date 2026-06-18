/**
 * CLI: sync notes from Feishu.
 * Usage: npx tsx scripts/sync-feishu.ts
 */

import { syncFeishuNotes } from "../src/services/feishu-sync";

async function main() {
  const notes = await syncFeishuNotes();
  console.log(`Synced ${notes.length} notes`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
