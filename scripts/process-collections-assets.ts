/**
 * Collections page asset pipeline: docs/design/phase-4-review/sources → public/collections/
 * Run: npm run process-collections-assets
 */
import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";

const ROOT = path.resolve(import.meta.dirname, "..");
const SOURCES = path.join(ROOT, "docs/design/phase-4-review/sources");
const OUT = path.join(ROOT, "public/collections");

const WHITE_THRESHOLD = 220;

function isWhite(r: number, g: number, b: number, a: number) {
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  return (
    a > 10 &&
    r >= WHITE_THRESHOLD &&
    g >= WHITE_THRESHOLD &&
    b >= WHITE_THRESHOLD &&
    max - min <= 28
  );
}

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

async function processRaster(
  sourceName: string,
  outName: string,
  resize?: { width: number }
) {
  const src = path.join(SOURCES, sourceName);
  const raw = await sharp(src).png().toBuffer();
  const transparent = await removeEdgeWhiteBackground(raw);
  const outPath = path.join(OUT, outName);

  let pipeline = sharp(transparent).trim({ threshold: 8 });
  if (resize) {
    pipeline = pipeline.resize({ width: resize.width, fit: "inside" });
  }
  await pipeline.png({ compressionLevel: 9 }).toFile(outPath);

  const meta = await sharp(outPath).metadata();
  console.log(`  ${outName} (${meta.width}×${meta.height})`);
}

async function main() {
  fs.mkdirSync(OUT, { recursive: true });

  console.log("Processing collections assets...");
  await processRaster("title.jpeg", "title.png");
  await processRaster("arrow.jpeg", "arrow.png", { width: 20 });
  await processRaster("Rectangle.jpeg", "rectangle.png");
  await processRaster("paper.jpeg", "paper.png");
  await processRaster("input.jpeg", "input.png");
  await processRaster("bin.png", "bin.png", { width: 24 });
  await processRaster("move.png", "move.png", { width: 24 });
  await processRaster("back.png", "back.png", { width: 28 });
  await processRaster("target.png", "target.png", { width: 20 });
  await processRaster("down-arrow.png", "down-arrow.png", { width: 16 });

  console.log(`Done → ${OUT}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
