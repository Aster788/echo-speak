/**
 * Home page asset pipeline: docs/design/phase-4-review/sources → public/home/
 * Run: npm run process-home-assets
 */
import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";

const ROOT = path.resolve(import.meta.dirname, "..");
const SOURCES = path.join(ROOT, "docs/design/phase-4-review/sources");
const OUT = path.join(ROOT, "public/home");

const WHITE_THRESHOLD = 242;

function isWhite(r: number, g: number, b: number, a: number) {
  return a > 10 && r >= WHITE_THRESHOLD && g >= WHITE_THRESHOLD && b >= WHITE_THRESHOLD;
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

async function processHello() {
  const src = path.join(SOURCES, "Hello.jpeg");
  const raw = await sharp(src).png().toBuffer();
  const transparent = await removeEdgeWhiteBackground(raw);
  const outPath = path.join(OUT, "hello.png");

  await sharp(transparent)
    .trim({ threshold: 8 })
    .resize({ width: 390, fit: "inside" })
    .png({ compressionLevel: 9 })
    .toFile(outPath);

  const meta = await sharp(outPath).metadata();
  console.log(`  hello.png (${meta.width}×${meta.height})`);
  return { width: meta.width ?? 390, height: meta.height ?? 400 };
}

async function main() {
  fs.mkdirSync(OUT, { recursive: true });

  console.log("Processing home assets...");
  await processHello();

  console.log(`Done → ${OUT}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
