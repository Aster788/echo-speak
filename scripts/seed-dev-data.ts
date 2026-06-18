/**
 * CLI: seed local dev data.
 * Usage: npx tsx scripts/seed-dev-data.ts
 */

async function main() {
  console.log("seed-dev-data: run supabase db reset for SQL seed, or implement here");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
