/**
 * Review page asset pipeline: docs/design/phase-4-review/sources → public/review/
 * Run: npm run process-review-assets
 */
import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";

const ROOT = path.resolve(import.meta.dirname, "..");
const SOURCES = path.join(ROOT, "docs/design/phase-4-review/sources");
const OUT = path.join(ROOT, "public/review");

const WHITE_THRESHOLD = 242;

function isWhite(r: number, g: number, b: number, a: number) {
  return a > 10 && r >= WHITE_THRESHOLD && g >= WHITE_THRESHOLD && b >= WHITE_THRESHOLD;
}

/** Flood-fill white from image edges (outer background only). */
function floodFillEdgeWhite(
  pixels: Uint8Array,
  width: number,
  height: number
) {
  const visited = new Uint8Array(width * height);
  const queue: number[] = [];

  const pushIfWhite = (x: number, y: number) => {
    const idx = y * width + x;
    if (visited[idx]) return;
    const i = idx * 4;
    if (!isWhite(pixels[i], pixels[i + 1], pixels[i + 2], pixels[i + 3])) return;
    visited[idx] = 1;
    queue.push(idx);
  };

  for (let x = 0; x < width; x++) {
    pushIfWhite(x, 0);
    pushIfWhite(x, height - 1);
  }
  for (let y = 0; y < height; y++) {
    pushIfWhite(0, y);
    pushIfWhite(width - 1, y);
  }

  while (queue.length > 0) {
    const idx = queue.pop()!;
    const x = idx % width;
    const y = (idx - x) / width;
    pixels[idx * 4 + 3] = 0;

    if (x > 0) pushIfWhite(x - 1, y);
    if (x < width - 1) pushIfWhite(x + 1, y);
    if (y > 0) pushIfWhite(x, y - 1);
    if (y < height - 1) pushIfWhite(x, y + 1);
  }
}

async function removeEdgeWhiteBackground(buffer: Buffer): Promise<Buffer> {
  const { data, info } = await sharp(buffer)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const pixels = new Uint8Array(data);
  floodFillEdgeWhite(pixels, info.width, info.height);

  return sharp(Buffer.from(pixels), {
    raw: { width: info.width, height: info.height, channels: 4 },
  })
    .png()
    .toBuffer();
}

async function processStickyNote() {
  const src = path.join(SOURCES, "sticky-note.png");
  const raw = await sharp(src).png().toBuffer();
  const transparent = await removeEdgeWhiteBackground(raw);
  const outPath = path.join(OUT, "sticky-note.png");

  await sharp(transparent)
    .trim({ threshold: 8 })
    .png({ compressionLevel: 9 })
    .toFile(outPath);

  const meta = await sharp(outPath).metadata();
  console.log(`  sticky-note.png (${meta.width}×${meta.height})`);
}

async function processConfusedButton() {
  const src = path.join(SOURCES, "confused.png");
  const raw = await sharp(src).png().toBuffer();
  const transparent = await removeEdgeWhiteBackground(raw);
  const outPath = path.join(OUT, "confused.png");

  await sharp(transparent)
    .trim({ threshold: 8 })
    .resize({ width: 80, fit: "inside" })
    .png({ compressionLevel: 9 })
    .toFile(outPath);

  const meta = await sharp(outPath).metadata();
  console.log(`  confused.png (${meta.width}×${meta.height})`);
}

async function processPaper() {
  const src = path.join(SOURCES, "paper.jpeg");
  const raw = await sharp(src).png().toBuffer();
  const transparent = await removeEdgeWhiteBackground(raw);
  const outPath = path.join(OUT, "paper.png");

  await sharp(transparent)
    .trim({ threshold: 8 })
    .png({ compressionLevel: 9 })
    .toFile(outPath);

  const meta = await sharp(outPath).metadata();
  console.log(`  paper.png (${meta.width}×${meta.height})`);
}

async function processBrokenHeart() {
  const src = path.join(SOURCES, "broken-heart.png");
  const raw = await sharp(src).png().toBuffer();
  const transparent = await removeEdgeWhiteBackground(raw);
  const outPath = path.join(OUT, "broken-heart.png");

  await sharp(transparent)
    .trim({ threshold: 8 })
    .resize({ width: 72, fit: "inside" })
    .png({ compressionLevel: 9 })
    .toFile(outPath);

  const meta = await sharp(outPath).metadata();
  console.log(`  broken-heart.png (${meta.width}×${meta.height})`);
}

async function processCongrats() {
  const src = path.join(SOURCES, "congrats.jpeg");
  const raw = await sharp(src).png().toBuffer();
  const transparent = await removeEdgeWhiteBackground(raw);
  const outPath = path.join(OUT, "congrats.png");

  await sharp(transparent)
    .trim({ threshold: 8 })
    .resize({ width: 360, fit: "inside" })
    .png({ compressionLevel: 9 })
    .toFile(outPath);

  const meta = await sharp(outPath).metadata();
  console.log(`  congrats.png (${meta.width}×${meta.height})`);
}

async function main() {
  fs.mkdirSync(OUT, { recursive: true });

  console.log("Processing review assets...");
  await processStickyNote();
  await processConfusedButton();
  await processPaper();
  await processBrokenHeart();
  await processCongrats();

  console.log(`Done → ${OUT}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
