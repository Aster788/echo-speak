import { readFileSync } from "fs";
import { readFile } from "fs/promises";
import { resolve } from "path";
import { parseTranscriptFile } from "@/lib/transcript-parse";
import { importTranscript } from "@/services/transcript-importer";

function loadEnvLocal(): void {
  try {
    const envPath = resolve(process.cwd(), ".env.local");
    const content = readFileSync(envPath, "utf-8");
    for (const line of content.split("\n")) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eq = trimmed.indexOf("=");
      if (eq === -1) continue;
      const key = trimmed.slice(0, eq).trim();
      const value = trimmed.slice(eq + 1).trim();
      if (!(key in process.env)) {
        process.env[key] = value;
      }
    }
  } catch {
    // .env.local optional if vars already exported
  }
}

function parseArgs(args: string[]): {
  file: string;
  title?: string;
  url?: string;
} {
  let file: string | undefined;
  let title: string | undefined;
  let url: string | undefined;

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === "--title" && args[i + 1]) {
      title = args[++i];
    } else if (arg === "--url" && args[i + 1]) {
      url = args[++i];
    } else if (!arg.startsWith("--")) {
      file = arg;
    }
  }

  if (!file) {
    console.error(
      'Usage: npx tsx scripts/import-transcript.ts <file> [--title "Video title"] [--url "https://..."]'
    );
    process.exit(1);
  }

  return { file, title, url };
}

async function main() {
  loadEnvLocal();

  const { file, title, url } = parseArgs(process.argv.slice(2));
  const resolved = resolve(process.cwd(), file);
  const buffer = await readFile(resolved);
  const filename = resolved.split("/").pop() ?? file;
  const rawText = parseTranscriptFile(buffer, filename);

  let resolvedTitle = title ?? "";
  if (!resolvedTitle && !url) {
    resolvedTitle = filename.replace(/\.(txt|srt)$/i, "").replace(/[-_]/g, " ");
  }

  const result = await importTranscript({
    title: resolvedTitle,
    rawText,
    youtube_url: url ?? null,
  });

  console.log("Import complete");
  console.log(`  Video ID:      ${result.video.id}`);
  console.log(`  Transcript ID: ${result.transcript.id}`);
  console.log(`  Title:         ${result.video.title}`);
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
