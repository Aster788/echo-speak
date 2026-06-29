/**
 * Settings page asset pipeline: docs/design/phase-4-review/sources → public/settings/
 * Run: npm run process-settings-assets
 */
import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";

const ROOT = path.resolve(import.meta.dirname, "..");
const SOURCES = path.join(ROOT, "docs/design/phase-4-review/sources");
const OUT = path.join(ROOT, "public/settings");

async function processFrame() {
  const src = path.join(SOURCES, "input.jpeg");
  const outPath = path.join(OUT, "frame.png");

  await sharp(src)
    .trim({ threshold: 12 })
    .resize({ width: 860 })
    .png({ compressionLevel: 9 })
    .toFile(outPath);

  const meta = await sharp(outPath).metadata();
  console.log(`  frame.png (${meta.width}×${meta.height})`);
}

async function main() {
  fs.mkdirSync(OUT, { recursive: true });

  console.log("Processing settings assets...");
  await processFrame();

  // Legacy alias used elsewhere
  fs.copyFileSync(path.join(OUT, "frame.png"), path.join(OUT, "input.png"));

  const legacyLabel = path.join(OUT, "label-frame.png");
  if (fs.existsSync(legacyLabel)) {
    fs.unlinkSync(legacyLabel);
  }

  console.log(`Done → ${OUT}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
