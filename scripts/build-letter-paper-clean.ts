/**
 * Sync letter-paper assets from design sources.
 *
 * Usage: npx tsx scripts/build-letter-paper-clean.ts
 */
import fs from "fs";
import path from "path";
import sharp from "sharp";

const ROOT = path.join(__dirname, "..");
const SOURCE = path.join(
  ROOT,
  "docs/design/phase-4-review/sources/letter-paper.png"
);
const FULL_OUTPUT = path.join(ROOT, "public/import/letter-paper.png");
const BOOKS_OUTPUT = path.join(ROOT, "public/import/letter-books.png");

const BOOK_TOP_RATIO = 0.54;
const BOOK_WIDTH_RATIO = 0.58;

async function build() {
  fs.copyFileSync(SOURCE, FULL_OUTPUT);
  console.log(`Copied ${SOURCE} → ${FULL_OUTPUT}`);

  const meta = await sharp(SOURCE).metadata();
  const width = meta.width ?? 1006;
  const height = meta.height ?? 1262;
  const bookTop = Math.floor(height * BOOK_TOP_RATIO);
  const bookWidth = Math.floor(width * BOOK_WIDTH_RATIO);

  await sharp(SOURCE)
    .extract({
      left: 0,
      top: bookTop,
      width: bookWidth,
      height: height - bookTop,
    })
    .png({ compressionLevel: 9 })
    .toFile(BOOKS_OUTPUT);

  console.log(`Wrote ${BOOKS_OUTPUT} (crop from y=${bookTop})`);
}

build().catch((error) => {
  console.error(error);
  process.exit(1);
});
