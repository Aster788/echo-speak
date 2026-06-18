/**
 * CLI: import a transcript file into Supabase.
 * Usage: npx tsx scripts/import-transcript.ts <file> --title "Video title"
 */

async function main() {
  const args = process.argv.slice(2);
  if (args.length < 1) {
    console.error("Usage: import-transcript.ts <file> [--title <title>]");
    process.exit(1);
  }
  console.log("import-transcript: not yet implemented", args);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
