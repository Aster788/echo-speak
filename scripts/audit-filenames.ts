import fs from "node:fs";
import path from "node:path";

const ROOT = path.resolve(import.meta.dirname, "..");
const PUBLIC_DIR = path.join(ROOT, "public");
const SAFE_NAME = /^[a-zA-Z0-9._-]+$/;

function walk(dir: string): string[] {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const files: string[] = [];
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...walk(full));
    } else {
      files.push(full);
    }
  }
  return files;
}

function main() {
  if (!fs.existsSync(PUBLIC_DIR)) {
    console.log("No public/ directory — nothing to audit.");
    return;
  }

  const files = walk(PUBLIC_DIR);
  const violations: string[] = [];

  for (const file of files) {
    const rel = path.relative(PUBLIC_DIR, file);
    const parts = rel.split(path.sep);
    for (const part of parts) {
      if (!SAFE_NAME.test(part)) {
        violations.push(rel);
        break;
      }
    }
  }

  if (violations.length > 0) {
    console.error("URL-unsafe filenames in public/:");
    for (const v of violations) {
      console.error(`  ${v}`);
    }
    process.exit(1);
  }

  console.log(`audit:filenames OK (${files.length} files)`);
}

main();
