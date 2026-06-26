/**
 * A/B: sync vs LLM clean, then extract — full side-by-side report.
 *
 * Usage:
 *   npx tsx scripts/ab-clean-extract.ts [--title-substr "29 easy"] [--out docs/ab-clean-extract.md]
 *
 * Local Supabase (recommended):
 *   STATS_SUPABASE_URL=http://127.0.0.1:54321 \
 *   STATS_SUPABASE_SERVICE_ROLE_KEY="$(supabase status --output json | python3 -c "import sys,json; print(json.load(sys.stdin)['SERVICE_ROLE_KEY'])")" \
 *   npx tsx scripts/ab-clean-extract.ts
 */

import { mkdirSync, readFileSync, writeFileSync } from "fs";
import { dirname, resolve } from "path";
import { createClient } from "@supabase/supabase-js";
import type { ExtractedExpression } from "@/types/expression";
import {
  cleanTranscript,
  cleanTranscriptSync,
} from "@/services/transcript-cleaner";
import { extractExpressions } from "@/services/expression-extractor";

const LOCAL_SERVICE_ROLE_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU";

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
      if (!(key in process.env)) process.env[key] = value;
    }
  } catch {
    // optional
  }
}

function argValue(flag: string, fallback: string): string {
  const idx = process.argv.indexOf(flag);
  return idx >= 0 && process.argv[idx + 1] ? process.argv[idx + 1] : fallback;
}

function isLocalSupabaseUrl(url: string): boolean {
  return /127\.0\.0\.1|localhost/.test(url);
}

function resolveSupabaseKey(url: string): string {
  if (process.env.STATS_SUPABASE_SERVICE_ROLE_KEY?.trim()) {
    return process.env.STATS_SUPABASE_SERVICE_ROLE_KEY.trim();
  }
  if (isLocalSupabaseUrl(url)) {
    return LOCAL_SERVICE_ROLE_KEY;
  }
  const fromEnv = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (fromEnv) return fromEnv;
  return LOCAL_SERVICE_ROLE_KEY;
}

function slugify(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 48);
}

function formatExpressionBlock(
  index: number,
  item: ExtractedExpression
): string {
  return [
    `#### ${index}. ${item.phrase}`,
    "",
    `- **meaning:** ${item.definition}`,
    `- **example_en:** ${item.example}`,
    `- **topic:** ${item.topic_slug}`,
    "",
  ].join("\n");
}

function buildSideBySideMarkdown(input: {
  title: string;
  rawChars: number;
  dbCleanedChars: number;
  dbMatchesSync: boolean;
  syncCleanedChars: number;
  llmCleanedChars: number;
  syncExtract: ExtractedExpression[];
  llmExtract: ExtractedExpression[];
  generatedAt: string;
}): string {
  const syncPhrases = new Set(
    input.syncExtract.map((e) => e.phrase.toLowerCase())
  );
  const llmPhrases = new Set(
    input.llmExtract.map((e) => e.phrase.toLowerCase())
  );
  const overlap = input.syncExtract.filter((e) =>
    llmPhrases.has(e.phrase.toLowerCase())
  );
  const onlySync = input.syncExtract.filter(
    (e) => !llmPhrases.has(e.phrase.toLowerCase())
  );
  const onlyLlm = input.llmExtract.filter(
    (e) => !syncPhrases.has(e.phrase.toLowerCase())
  );

  const lines: string[] = [
    `# A/B: Sync vs LLM clean + extract`,
    "",
    `**Video:** ${input.title}`,
    `**Generated:** ${input.generatedAt}`,
    "",
    "## Summary",
    "",
    "| Metric | Sync clean | LLM clean | DB (current) |",
    "|--------|------------|-----------|--------------|",
    `| raw_text chars | ${input.rawChars} | ${input.rawChars} | — |`,
    `| cleaned_text chars | ${input.syncCleanedChars} | ${input.llmCleanedChars} | ${input.dbCleanedChars} |`,
    `| expressions extracted | ${input.syncExtract.length} | ${input.llmExtract.length} | — |`,
    `| DB cleaned == sync | — | — | ${input.dbMatchesSync ? "yes" : "no"} |`,
    "",
    "| Phrase overlap | Count |",
    "|----------------|-------|",
    `| Exact phrase match (both paths) | ${overlap.length} |`,
    `| Sync-only phrases | ${onlySync.length} |`,
    `| LLM-only phrases | ${onlyLlm.length} |`,
    "",
    "## Side-by-side (all expressions)",
    "",
    "Compare **sync clean → LLM extract** (left) vs **LLM clean → LLM extract** (right). Extract always uses the LLM; only clean differs.",
    "",
    "| # | Sync clean → extract: phrase | Sync clean → extract: example_en | LLM clean → extract: phrase | LLM clean → extract: example_en |",
    "|---|------------------------------|----------------------------------|-----------------------------|--------------------------------|",
  ];

  const maxRows = Math.max(input.syncExtract.length, input.llmExtract.length);
  for (let i = 0; i < maxRows; i += 1) {
    const sync = input.syncExtract[i];
    const llm = input.llmExtract[i];
    const esc = (s: string) => s.replace(/\|/g, "\\|").replace(/\n/g, " ");
    lines.push(
      `| ${i + 1} | ${sync ? esc(sync.phrase) : "—"} | ${sync ? esc(sync.example) : "—"} | ${llm ? esc(llm.phrase) : "—"} | ${llm ? esc(llm.example) : "—"} |`
    );
  }

  lines.push("", "## Sync path — full detail", "");
  input.syncExtract.forEach((item, i) => {
    lines.push(formatExpressionBlock(i + 1, item));
  });

  lines.push("## LLM path — full detail", "");
  input.llmExtract.forEach((item, i) => {
    lines.push(formatExpressionBlock(i + 1, item));
  });

  if (onlySync.length > 0) {
    lines.push("## Sync-only phrases", "");
    for (const item of onlySync) {
      lines.push(`- **${item.phrase}** — ${item.example}`);
    }
    lines.push("");
  }

  if (onlyLlm.length > 0) {
    lines.push("## LLM-only phrases", "");
    for (const item of onlyLlm) {
      lines.push(`- **${item.phrase}** — ${item.example}`);
    }
    lines.push("");
  }

  lines.push(
    "## How to re-run",
    "",
    "```bash",
    "STATS_SUPABASE_URL=http://127.0.0.1:54321 \\",
    'STATS_SUPABASE_SERVICE_ROLE_KEY="$(supabase status --output json | python3 -c \\"import sys,json; print(json.load(sys.stdin)[\'SERVICE_ROLE_KEY\'])\\")" \\',
    `npx tsx scripts/ab-clean-extract.ts --title-substr "${input.title.slice(0, 20)}"`,
    "```",
    ""
  );

  return lines.join("\n");
}

async function main() {
  loadEnvLocal();

  const substr = argValue("--title-substr", "29 easy things");
  const url = process.env.STATS_SUPABASE_URL ?? "http://127.0.0.1:54321";
  const key = resolveSupabaseKey(url);

  const supabase = createClient(url, key);
  const { data: rows, error } = await supabase
    .from("transcripts")
    .select("raw_text, cleaned_text, videos(title)")
    .not("raw_text", "is", null);

  if (error) throw error;

  const match = (rows ?? []).find((row) =>
    ((row.videos as { title: string } | null)?.title ?? "")
      .toLowerCase()
      .includes(substr.toLowerCase())
  );

  if (!match?.raw_text) {
    throw new Error(`No transcript matching title substr: ${substr}`);
  }

  const title = (match.videos as { title: string }).title;
  const rawText = match.raw_text as string;
  const dbCleaned = (match.cleaned_text as string | null) ?? "";

  console.log(`Video: ${title}`);
  console.log(`Supabase: ${url}`);
  console.log("Running sync clean + extract…");

  const syncCleaned = cleanTranscriptSync(rawText);
  const syncExtract = await extractExpressions(syncCleaned);

  console.log("Running LLM clean + extract…");
  const llmCleaned = await cleanTranscript(rawText);
  const llmExtract = await extractExpressions(llmCleaned);

  const generatedAt = new Date().toISOString().slice(0, 10);
  const defaultOut = `docs/ab-clean-extract-${slugify(title)}.md`;
  const outPath = resolve(process.cwd(), argValue("--out", defaultOut));

  const markdown = buildSideBySideMarkdown({
    title,
    rawChars: rawText.length,
    dbCleanedChars: dbCleaned.length,
    dbMatchesSync: syncCleaned === dbCleaned,
    syncCleanedChars: syncCleaned.length,
    llmCleanedChars: llmCleaned.length,
    syncExtract,
    llmExtract,
    generatedAt,
  });

  mkdirSync(dirname(outPath), { recursive: true });
  writeFileSync(outPath, markdown, "utf-8");

  console.log(`\nWrote ${outPath}`);
  console.log(
    `Sync: ${syncExtract.length} expressions | LLM: ${llmExtract.length} expressions`
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
