import { readFileSync } from "fs";
import { resolve } from "path";
import { listTranscriptsWithCleanedText } from "@/db/transcripts";
import { extractExpressionsForTranscript } from "@/services/expression-pipeline";

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

function parseArgs(args: string[]): { transcriptId?: string } {
  let transcriptId: string | undefined;

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === "--transcript-id" && args[i + 1]) {
      transcriptId = args[++i];
    }
  }

  return { transcriptId };
}

async function main() {
  loadEnvLocal();
  const { transcriptId } = parseArgs(process.argv.slice(2));

  if (transcriptId) {
    const result = await extractExpressionsForTranscript(transcriptId);
    console.log("Extraction complete");
    console.log(`  Transcript ID: ${result.transcriptId}`);
    console.log(`  Video ID:      ${result.videoId}`);
    console.log(`  Expressions:   ${result.expressionCount}`);
    return;
  }

  const transcripts = await listTranscriptsWithCleanedText();
  if (transcripts.length === 0) {
    console.log("No transcripts with cleaned text found.");
    return;
  }

  console.log(`Processing ${transcripts.length} transcript(s)…`);
  for (const transcript of transcripts) {
    try {
      const result = await extractExpressionsForTranscript(transcript.id);
      console.log(
        `  ${transcript.id}: ${result.expressionCount} expression(s)`
      );
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Extraction failed";
      console.error(`  ${transcript.id}: ${message}`);
    }
  }
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
