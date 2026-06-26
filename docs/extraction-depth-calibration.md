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

Re-run: `npx tsx scripts/extraction-depth-stats.ts`
