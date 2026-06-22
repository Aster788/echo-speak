/**
 * Import page asset pipeline: docs/design/phase-4-review/sources → public/import/
 * Run: npm run process-import-assets
 */
import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";

const ROOT = path.resolve(import.meta.dirname, "..");
const SOURCES = path.join(ROOT, "docs/design/phase-4-review/sources");
const OUT = path.join(ROOT, "public/import");

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

async function removeAllWhiteBackground(buffer: Buffer): Promise<Buffer> {
  const { data, info } = await sharp(buffer)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const pixels = new Uint8Array(data);
  for (let i = 0; i < pixels.length; i += 4) {
    if (isWhite(pixels[i], pixels[i + 1], pixels[i + 2], pixels[i + 3])) {
      pixels[i + 3] = 0;
    }
  }

  return sharp(Buffer.from(pixels), {
    raw: { width: info.width, height: info.height, channels: 4 },
  })
    .png()
    .toBuffer();
}

async function processNotebook() {
  const src = path.join(SOURCES, "notebook.jpeg");
  const raw = await sharp(src).png().toBuffer();
  const transparent = await removeEdgeWhiteBackground(raw);
  const outPath = path.join(OUT, "notebook.png");

  await sharp(transparent)
    .trim({ threshold: 10 })
    .png({ compressionLevel: 9 })
    .toFile(outPath);

  console.log("  notebook.png");
}

async function processPageFlag() {
  const src = path.join(SOURCES, "page-flag.png");
  const raw = await sharp(src).png().toBuffer();
  const transparent = await removeEdgeWhiteBackground(raw);
  const outPath = path.join(OUT, "page-flag.png");

  await sharp(transparent)
    .trim({ threshold: 8 })
    .png({ compressionLevel: 9 })
    .toFile(outPath);

  const meta = await sharp(outPath).metadata();
  console.log(`  page-flag.png (${meta.width}×${meta.height})`);
}

async function processPenButton() {
  const src = path.join(SOURCES, "pen-button.jpeg");
  const raw = await sharp(src).png().toBuffer();
  const transparent = await removeAllWhiteBackground(raw);
  const outPath = path.join(OUT, "pen-button.png");

  await sharp(transparent)
    .extract({ left: 80, top: 80, width: 576, height: 576 })
    .trim({ threshold: 12 })
    .resize({ height: 56, fit: "inside" })
    .png()
    .toFile(outPath);

  console.log("  pen-button.png");
}

async function processStickyNotes() {
  const src = path.join(SOURCES, "sticky-notes.jpeg");
  const raw = await sharp(src).png().toBuffer();
  const transparent = await removeAllWhiteBackground(raw);
  const outPath = path.join(OUT, "sticky-notes.png");

  await sharp(transparent)
    .trim({ threshold: 5 })
    .png({ compressionLevel: 9 })
    .toFile(outPath);

  const meta = await sharp(outPath).metadata();
  console.log(
    `  sticky-notes.png (${meta.width}×${meta.height})`
  );
}

async function main() {
  fs.mkdirSync(OUT, { recursive: true });

  console.log("Processing import assets...");
  await processNotebook();
  await processPageFlag();
  await processPenButton();
  await processStickyNotes();

  console.log(`Done → ${OUT}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
