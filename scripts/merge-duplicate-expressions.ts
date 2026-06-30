import { readFileSync } from "fs";
import { resolve } from "path";
import { createClient } from "@supabase/supabase-js";
import { canonicalKey, pickDisplayPhrase } from "@/lib/phrase-canonical";
import type { Expression, ExpressionExample } from "@/types/expression";

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
    // .env.local optional
  }
}

function rowExamples(expr: Expression): ExpressionExample[] {
  if (expr.examples && expr.examples.length > 0) return expr.examples;
  return [{ en: expr.example_en, zh: expr.example_zh }];
}

async function main() {
  loadEnvLocal();
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
    process.exit(1);
  }

  const supabase = createClient(url, key);
  const dryRun = process.argv.includes("--dry-run");

  // Group expressions by video, then by canonical key.
  const { data, error } = await supabase
    .from("expressions")
    .select("*")
    .order("created_at", { ascending: true });
  if (error) throw error;

  const all = (data ?? []) as Expression[];
  const byVideo = new Map<string, Expression[]>();
  for (const row of all) {
    const list = byVideo.get(row.video_id) ?? [];
    list.push(row);
    byVideo.set(row.video_id, list);
  }

  let collapsed = 0;
  let videosTouched = 0;
  const mergedIds: string[] = [];

  for (const [videoId, rows] of byVideo) {
    const groups = new Map<string, Expression[]>();
    for (const row of rows) {
      const key = canonicalKey(row.phrase) || row.phrase.toLowerCase();
      const list = groups.get(key) ?? [];
      list.push(row);
      groups.set(key, list);
    }

    let videoChanged = false;
    for (const group of groups.values()) {
      if (group.length < 2) continue;

      // Keep the row with topic_locked=true if any; else earliest (group is
      // ordered by created_at ascending).
      const lockedRow = group.find((g) => g.topic_locked);
      const keeper = lockedRow ?? group[0];
      const victims = group.filter((g) => g.id !== keeper.id);

      const combined = [
        ...rowExamples(keeper),
        ...victims.flatMap(rowExamples),
      ];
      const displayPhrase = pickDisplayPhrase(group.map((g) => g.phrase));
      const topicLocked = group.some((g) => g.topic_locked);
      const topicId = lockedRow?.topic_id ?? keeper.topic_id;

      // Non-null example_zh wins for examples[0].zh
      if (combined[0] && !combined[0].zh) {
        const zhWinner = combined.find((e) => e.zh);
        if (zhWinner) combined[0] = { ...combined[0], zh: zhWinner.zh };
      }

      if (!dryRun) {
        const { error: updErr } = await supabase
          .from("expressions")
          .update({
            phrase: displayPhrase,
            example_en: combined[0]?.en ?? keeper.example_en,
            example_zh: combined[0]?.zh ?? keeper.example_zh,
            examples: combined,
            topic_locked: topicLocked,
            topic_id: topicId,
          })
          .eq("id", keeper.id);
        if (updErr) throw updErr;

        const { error: delErr } = await supabase
          .from("expressions")
          .delete()
          .in(
            "id",
            victims.map((v) => v.id)
          );
        if (delErr) throw delErr;
      }

      collapsed += victims.length;
      mergedIds.push(...victims.map((v) => v.id));
      videoChanged = true;
    }

    if (videoChanged) videosTouched += 1;
  }

  console.log(
    `Merge backfill ${dryRun ? "(dry-run) " : ""}complete: ${collapsed} rows collapsed across ${videosTouched} videos.`
  );
  if (mergedIds.length && dryRun) {
    console.log("Would delete:", mergedIds.join(", "));
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
