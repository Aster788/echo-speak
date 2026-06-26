#!/usr/bin/env npx tsx
/**
 * Print dismissal reason counts and recent phrase samples.
 *
 *   npx tsx scripts/dismissal-stats.ts
 */

import {
  formatDismissalHintsForPrompt,
  listDismissalReasonCounts,
  listRecentDismissalSamples,
} from "@/lib/dismissal-hints";
import { DISMISS_REASON_LABELS } from "@/types/dismiss-reason";
import { getStatsClient, getStatsSupabaseUrl } from "./stats-env";

async function main() {
  const client = getStatsClient();
  const counts = await listDismissalReasonCounts(client);
  const samples = await listRecentDismissalSamples(20, client);
  const hints = await formatDismissalHintsForPrompt(client);

  console.log(`Supabase: ${getStatsSupabaseUrl()}\n`);
  console.log("## Dismissal reason counts\n");
  if (counts.length === 0) {
    console.log("(none yet — dismiss with a reason in Topics)\n");
  } else {
    for (const row of counts) {
      console.log(`- ${DISMISS_REASON_LABELS[row.reason]}: ${row.count}`);
    }
    console.log();
  }

  console.log("## Recent dismissed phrases\n");
  if (samples.length === 0) {
    console.log("(none)\n");
  } else {
    for (const row of samples) {
      console.log(`- "${row.phrase}" → ${DISMISS_REASON_LABELS[row.reason]}`);
    }
    console.log();
  }

  if (hints) {
    console.log("## Prompt hints block\n");
    console.log(hints);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
