# Extraction depth calibration (Scheme 2)

_Auto-generated 2026-06-26._

## Summary

- Videos: 5
- Total extracted (kept + deleted): 120
- Total deleted: 25
- Total kept: 95
- Median delete rate: 20.0%

## Scheme 2 table

| video_title | extracted | deleted | kept | clean_text_chars | notes |
|-------------|-----------|---------|------|------------------|-------|
| 10 things I wish I knew before starting my internship \| INTERNSHIP ADVICE | 20 | 6 | 14 | 9176 | 已会×6 |
| 29 easy things that make you a cool person | 20 | 4 | 16 | 4653 | 已会×2; 重复拆条×1 |
| a normal day in my life | 20 | 5 | 15 | 2676 | 已会×5 |
| adult friendships are dying (and we're to blame) | 20 | 3 | 17 | 3888 | 其他×1; 已会×1 |
| Getting Married Q&A \| how we met, wedding plans, prenup? | 40 | 7 | 33 | 21168 | 已会×4; 其他×2 |

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
