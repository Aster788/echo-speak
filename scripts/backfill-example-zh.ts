import { backfillMissingExampleZh } from "@/services/expression-pipeline";

async function main() {
  const result = await backfillMissingExampleZh();
  console.log(
    `Backfill complete: ${result.updated} updated, ${result.skipped} skipped.`
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
