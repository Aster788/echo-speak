/**
 * Asset pipeline: docs/design/phase-4-review/sources → public/nav/
 * Run: npm run process-nav-assets
 */
import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";

const ROOT = path.resolve(import.meta.dirname, "..");
const SOURCES = path.join(ROOT, "docs/design/phase-4-review/sources");
const OUT = path.join(ROOT, "public/nav");

const SIGN_SRC = path.join(SOURCES, "navigation-bar-button.png");

/** Source filename → output slug (URL-safe lowercase) */
const LETTER_SOURCES: Record<string, string> = {
  a: "A.png",
  c: "C.png",
  e: "E.png",
  h: "H.png",
  k: "K.png",
  o: "O.png",
  p: "P.png",
  s: "S.png",
};

const TARGET_WOOD = { r: 0xe0, g: 0xdb, b: 0xc8 };

/** Softer than nav text (#222 @ 80%) — lighter ink, narrow alpha band reduces mottle */
const LETTER_INK = { r: 0x52, g: 0x52, b: 0x52 };

/** Keep only dark letter strokes; drop white + tan paper backing. */
async function extractBlackLetterOnly(buffer: Buffer): Promise<Buffer> {
  const { data, info } = await sharp(buffer)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const pixels = new Uint8Array(data);
  const { r: inkR, g: inkG, b: inkB } = LETTER_INK;

  for (let i = 0; i < pixels.length; i += 4) {
    const r = pixels[i];
    const g = pixels[i + 1];
    const b = pixels[i + 2];
    const lum = r * 0.299 + g * 0.587 + b * 0.114;

    if (lum < 100) {
      const edge = Math.min(1, (100 - lum) / 55);
      const alpha = Math.round(150 + edge * 55);
      pixels[i] = inkR;
      pixels[i + 1] = inkG;
      pixels[i + 2] = inkB;
      pixels[i + 3] = alpha;
    } else {
      pixels[i + 3] = 0;
    }
  }

  return sharp(Buffer.from(pixels), {
    raw: { width: info.width, height: info.height, channels: 4 },
  })
    .png()
    .toBuffer();
}

async function processLetter(slug: string, sourceFile: string) {
  const srcPath = path.join(SOURCES, sourceFile);
  const raw = await sharp(srcPath).png().toBuffer();
  const transparent = await extractBlackLetterOnly(raw);
  const outPath = path.join(OUT, `brand-letter-${slug}.png`);

  await sharp(transparent)
    .trim({ threshold: 12 })
    .resize({ height: 48, fit: "inside", withoutEnlargement: false })
    .png()
    .toFile(outPath);

  console.log(`  brand-letter-${slug}.png ← ${sourceFile}`);
}

async function processSignButton() {
  const { data, info } = await sharp(SIGN_SRC)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const pixels = new Uint8Array(data);
  const { r: tr, g: tg, b: tb } = TARGET_WOOD;

  for (let i = 0; i < pixels.length; i += 4) {
    const r = pixels[i];
    const g = pixels[i + 1];
    const b = pixels[i + 2];
    const a = pixels[i + 3];

    if (a < 10) continue;

    const brightness = (r + g + b) / 3;
    const saturation = Math.max(r, g, b) - Math.min(r, g, b);

    if (brightness > 210 && saturation < 30) {
      pixels[i + 3] = 0;
      continue;
    }

    // Hanging string — neutral grey, slightly darkened
    if (saturation < 22 && brightness >= 70 && brightness <= 195) {
      const factor = 0.78;
      pixels[i] = Math.round(r * factor);
      pixels[i + 1] = Math.round(g * factor);
      pixels[i + 2] = Math.round(b * factor);
      continue;
    }

    // Wood board — map to #E0DBC8 (highlight surface / Video Mode)
    const grain = (r * 0.299 + g * 0.587 + b * 0.114) / 255;
    const shade = 0.88 + (grain - 0.5) * 0.16;
    pixels[i] = Math.min(255, Math.round(tr * shade));
    pixels[i + 1] = Math.min(255, Math.round(tg * shade));
    pixels[i + 2] = Math.min(255, Math.round(tb * shade));
  }

  const outPath = path.join(OUT, "sign-button.png");
  await sharp(Buffer.from(pixels), {
    raw: { width: info.width, height: info.height, channels: 4 },
  })
    .png()
    .toFile(outPath);

  console.log("  sign-button.png");
}

async function main() {
  fs.mkdirSync(OUT, { recursive: true });

  console.log("Processing brand letters from individual sources...");
  for (const [slug, sourceFile] of Object.entries(LETTER_SOURCES)) {
    await processLetter(slug, sourceFile);
  }

  console.log("Processing sign button...");
  await processSignButton();

  console.log(`Done → ${OUT}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
