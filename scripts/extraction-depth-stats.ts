#!/usr/bin/env npx tsx
/**
 * Auto-generate Scheme 2 calibration table from cloud DB (via `.env.local`) or local CLI.
 *
 *   npx tsx scripts/extraction-depth-stats.ts
 *   npx tsx scripts/extraction-depth-stats.ts --write
 *
 * Override target: STATS_SUPABASE_URL / STATS_SUPABASE_SERVICE_ROLE_KEY
 * Local only: STATS_SUPABASE_URL=http://127.0.0.1:54321
 */

import { writeFileSync } from "fs";
import { resolve } from "path";
import {
  buildScheme2Rows,
  formatScheme2Markdown,
  summarizeScheme2,
} from "@/lib/extraction-depth-stats";
import { getStatsClient, getStatsSupabaseUrl } from "./stats-env";

async function main() {
  const client = getStatsClient();
  const rows = await buildScheme2Rows(client);
  const summary = summarizeScheme2(rows);
  const markdown = formatScheme2Markdown(rows);

  console.log(`Supabase: ${getStatsSupabaseUrl()}\n`);
  console.log(markdown);

  if (process.argv.includes("--write")) {
    const outPath = resolve(
      process.cwd(),
      "docs/extraction-depth-calibration.md"
    );
    writeFileSync(outPath, markdown, "utf-8");
    console.log(`\nWrote ${outPath}`);
  }

  console.log(
    `\nMedian delete rate: ${(summary.medianDeleteRate * 100).toFixed(1)}% ` +
      `(target reference ~15% / 3 per 20)`
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
