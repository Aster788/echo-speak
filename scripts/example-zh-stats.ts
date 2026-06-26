import { readFileSync } from "fs";
import { resolve } from "path";
import { createClient } from "@supabase/supabase-js";
import { isPlausibleAlignment } from "@/services/example-zh";

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

async function main() {
  loadEnvLocal();

  const url =
    process.env.STATS_SUPABASE_URL ??
    process.env.LOCAL_NEXT_PUBLIC_SUPABASE_URL ??
    process.env.NEXT_PUBLIC_SUPABASE_URL ??
    "http://127.0.0.1:54321";
  const key =
    process.env.STATS_SUPABASE_SERVICE_ROLE_KEY ??
    process.env.LOCAL_SUPABASE_SERVICE_ROLE_KEY ??
    process.env.SUPABASE_SERVICE_ROLE_KEY ??
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU";

  const supabase = createClient(url, key);

  const { data: rows, error } = await supabase
    .from("expressions")
    .select("example_en, example_zh, video_id, videos(title)");

  if (error) throw error;

  const byVideo = new Map<
    string,
    { nulls: number; implausible: number; total: number; title: string }
  >();
  let nulls = 0;
  let implausible = 0;
  let total = 0;

  for (const row of rows ?? []) {
    total += 1;
    const title =
      (row.videos as { title: string } | null)?.title ?? row.video_id;
    const cur = byVideo.get(title) ?? {
      nulls: 0,
      implausible: 0,
      total: 0,
      title,
    };
    cur.total += 1;

    const exampleEn = row.example_en as string;
    const exampleZh = (row.example_zh as string | null) ?? "";

    if (!exampleZh.trim()) {
      nulls += 1;
      cur.nulls += 1;
    } else if (!isPlausibleAlignment(exampleEn, exampleZh)) {
      implausible += 1;
      cur.implausible += 1;
    }

    byVideo.set(title, cur);
  }

  const plausible = total - nulls - implausible;

  console.log(`Supabase: ${url}`);
  console.log(`Overall: ${total} expressions`);
  console.log(
    `  null: ${nulls} (${total ? ((100 * nulls) / total).toFixed(1) : 0}%)`
  );
  console.log(
    `  implausible (quality gate): ${implausible} (${total ? ((100 * implausible) / total).toFixed(1) : 0}%)`
  );
  console.log(
    `  plausible: ${plausible} (${total ? ((100 * plausible) / total).toFixed(1) : 0}%)`
  );
  console.log("\nPer video:");
  for (const { title, nulls: n, implausible: bad, total: t } of [
    ...byVideo.values(),
  ].sort((a, b) => b.implausible + b.nulls - (a.implausible + a.nulls))) {
    const ok = t - n - bad;
    console.log(
      `  ${title}: ${ok}/${t} ok, ${n} null, ${bad} implausible`
    );
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
