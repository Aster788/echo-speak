# Extraction depth calibration (Scheme 2)

_Auto-generated 2026-06-30._

## Summary

- Videos: 27
- Total extracted (kept + deleted): 281
- Total deleted: 51
- Total kept: 230
- Median delete rate: 16.7%

## Scheme 2 table

| video_title | extracted | deleted | kept | clean_text_chars | notes |
|-------------|-----------|---------|------|------------------|-------|
| 10 things I wish I knew before starting my internship \| INTERNSHIP ADVICE | 9 | 3 | 6 | 9020 | — |
| 29 easy things that make you a cool person | 6 | 0 | 6 | 4640 | — |
| 5 simple ways to be more attractive, according to science | 6 | 1 | 5 | 7285 | — |
| 谷爱凌的演讲，你能听懂多少 | 5 | 3 | 2 | 2359 | — |
| 没有安排的一天，反而过得最舒服 | 8 | 0 | 8 | 8270 | — |
| a normal day in my life | 6 | 0 | 6 | 2717 | — |
| a week in my life vlog | 18 | 4 | 14 | 16979 | — |
| adult friendships are dying (and we're to blame) | 6 | 1 | 5 | 3983 | — |
| COACHELLA 2026 VLOG weekend 2 bieberchella w: my best friends | 21 | 4 | 17 | 20988 | — |
| Day in the Life of a Software Engineer \| Realistic Work Day | 7 | 1 | 6 | 6920 | — |
| Everything I Know About Love | 9 | 3 | 6 | 9258 | — |
| figuring out my 20s | 11 | 2 | 9 | 11349 | — |
| Getting Married Q&A \| how we met, wedding plans, prenup? | 18 | 8 | 10 | 21198 | — |
| How Language Shapes The Way You Think | 6 | 1 | 5 | 5202 | — |
| How much I spend in a week living in Boston | 7 | 1 | 6 | 6892 | — |
| I GOT LAID OFF \| what happened, how I feel, what’s next? | 9 | 0 | 9 | 9461 | — |
| i woke up at 5am for a week | 18 | 0 | 18 | 17401 | — |
| My 2024 Home Office Tour \| cozy + creative desk setup, office furniture, organization system | 18 | 5 | 13 | 16284 | — |
| My First Week as a Software Engineer in NYC | 7 | 0 | 7 | 7124 | — |
| Olympic Champion Eileen Gu Speaks at Harvard University | 8 | 2 | 6 | 8334 | — |
| Our Honeymoon in Tokyo luxury shopping, cherry blossoms, omakase chef friends | 10 | 4 | 6 | 9777 | — |
| SUNDAY RESET VLOG post travel unpacking, cooking & relaxing | 11 | 2 | 9 | 10744 | — |
| What did Gu Ailing say in the speech | 6 | 0 | 6 | 3820 | — |
| what i eat as a busy girl living in nyc \| healthy & easy meals | 18 | 2 | 16 | 15599 | — |
| What I spend in a Week at 30 \| *smart* budgeting sheet, fighting over money, IU tickets | 6 | 0 | 6 | 17548 | — |
| what i spend in a week living in nyc | 18 | 2 | 16 | 14107 | — |
| You are not running out of time | 9 | 2 | 7 | 8699 | — |

## Cap reference (Standard)

Formula: `selectCap = clamp(round(chunkChars / 1000), 6, 15)` per chunk; video target = sum of chunk caps.

Re-run: `npx tsx scripts/extraction-depth-stats.ts --write`

## Calibration notes (2026-06-26)

Standard formula: `selectCap = clamp(round(chunkChars / 1000), 6, 15)` per chunk.

**Verdict:** Reasonable defaults for P1, slightly **tight** vs post-dismiss kept counts — acceptable trade-off (cleaner extract, not matching a personal keep-list; see `docs/decisions.md` 2026-06-26c).

| Constant | Assessment | Notes |
|----------|------------|-------|
| **÷1000** | Mostly OK, a bit tight | Old ~20/chunk ≈ 250 chars/slot; new ≈ 800 chars/slot at 5k chars. Delete rate was ~20% and mostly「已会」— noise was quality more than quantity. To align with historical *kept* counts, try **800** first. |
| **6 (floor)** | OK but conservative | Short clips (<3k) get 6 slots; 3–5 min vlogs often felt low after re-extract (e.g. 29 easy: kept 16 historically → cap 6). |
| **15 (ceiling)** | OK | Single chunk tops out ~12 at 12k chars; long Q&A uses **sum of per-chunk** caps (e.g. Getting Married ≈ 21). |

**vs Scheme 2 kept (old fixed-20 extract):** internship 14→cap 9; 29 easy 16→6; Getting Married 33→~21. Re-extract on 3 sample videos confirmed fewer, cleaner phrases (no clip inflection).

**If tuning later:** (1) `STANDARD_CHARS_PER_SLOT` 1000→800; (2) floor 6→5 only if still too many on short clips; (3) keep max 15 unless single chunks exceed 20k chars regularly. Use **Deep** mode or Feishu curation for per-video「want more」.

## Calibration notes (2026-06-30)

27-video refresh against cloud DB (`ejgybfiywdbnfzckjqao`).

- **Median delete rate: 16.7%** (5-video baseline was 20.0%; target band 15–30%).
- **Verdict:** Within band — **constants unchanged** (`STANDARD_CHARS_PER_SLOT` stays 1000; floor 6, ceiling 15).
- Totals: 281 extracted (230 kept + 51 deleted) across 27 videos with expressions.
- Merge backfill: 0 rows collapsed (no within-video canonical duplicates after manual curation).
- `example_zh`: 0 null rows post-backfill.
- Scheme 2 `notes` column empty for historical dismissals (deleted before reason picker shipped); new dismissals after deploy will populate `reason`.

Re-run against cloud (default when `.env.local` has `NEXT_PUBLIC_SUPABASE_URL`):

```bash
npx tsx scripts/extraction-depth-stats.ts --write
```

Local override: `STATS_SUPABASE_URL=http://127.0.0.1:54321 npx tsx scripts/extraction-depth-stats.ts --write`
