# Architecture Decision Records

## # Decision Log

---

2026-06-19

Decision:

No speech recognition.

Reason:

Speaking assessment is unnecessary.

User can self-evaluate.

---

2026-06-19

Decision:

Active Recall is the core feature.

Reason:

The goal is speaking recall, not expression collection.

---

2026-06-19

Decision:

Feishu is source of truth.

Reason:

Notes are maintained there.

---

2026-06-19

Decision:

Transcript is imported once.

Reason:

Transcript rarely changes.

---

2026-06-21

Decision:

Phase 4 review ratings use `mastered` | `again` | `unsure` (design-system is source of truth).

Reason:

Consistent API, UI, and SRS prep; replaces informal `review_again` / `forgotten` naming.

---

2026-06-21

Decision:

Rename `expressions.example` → `example_en`; add `example_zh` for review card front.

Reason:

Imports use bilingual transcripts; front card needs Chinese sentence aligned to English example.

**Fill order (2026-06-26):** Always DeepSeek single-sentence translation of `example_en` → `example_zh`. Raw-text alignment is retained in `example-zh-alignment.ts` for stats only, not the pipeline.

**Clean default (2026-06-26):** Sync clean (`keepEnglishLinesOnly` + strip timestamps) for Web and CLI. Opt-in LLM clean via `IMPORT_USE_LLM_CLEANER=1`.

---

2026-06-21

Decision:

Import `raw_text` is always bilingual paste (English + Chinese blocks); `cleaned_text` remains English-only for extraction.

Reason:

User workflow always pastes paired EN/ZH subtitles. Chinese is stripped only in `cleaned_text`, not in `raw_text`, so `example_zh` can be aligned without re-importing.

**Alignment model:** split `raw_text` into alternating EN/ZH blocks (multi-line blocks OK); map `example_en` to the paired ZH block. Messy ASR lines (`>>`, `[music]`) may fail → DeepSeek fallback.

---

2026-06-25

Decision:

**Local Supabase CLI for development; Supabase Cloud + Vercel for production** (Mac + phone).

Context:

Single-user app; phone needs the same DB as Mac. Local `supabase start` is fast for migrations and `db reset`; production must not share that database.

Decision:

| Use case | Supabase | Next.js |
|----------|----------|---------|
| Dev on Mac | `supabase start` + `.env.local` → `127.0.0.1:54321` | `npm run dev` |
| Mac + phone daily use | Cloud project `echo-speak` (`ejgybfiywdbnfzckjqao`) | Vercel `echo-speak` |

Consequences:

- Migrations live in `supabase/migrations/`; apply to cloud via `supabase db push` or dashboard.
- `SUPABASE_SERVICE_ROLE_KEY` only on server (`.env.local` / Vercel); never Settings UI.
- Optional data copy: `docs/cloud-data.md`.
- Smoke test: import + review on production URL from Mac and phone.

---

2026-06-26

Decision:

**Settings + Auth: `user_settings` per account; site-hosted Supabase** (Pre-Phase 5 P2, `feat/settings-auth`).

Context:

Shared Vercel deployment: each user brings their own LLM and Feishu credentials; the site owner hosts one Supabase project (database + Auth) for all users. Server-only credentials must never appear in the Settings UI.

Decision:

1. **Auth:** Supabase email OTP (6-digit code, 5 min expiry) via `@supabase/ssr`; session refreshed in Next.js middleware; send/verify/sign-out via API routes.
2. **Storage:** `user_settings` keyed by `user_id` with RLS + table grants; Settings UI fields: LLM (3) + Feishu (2). Values stored plaintext at rest (RLS isolation); column encryption deferred.
3. **Site-provided (not in Settings UI):** `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` — deployment env only.
4. **Runtime:** Authenticated requests use **only** that user's saved LLM keys (`runWithLlmOverrides`); no deployment env fallback for LLM or Feishu when logged in. Unauthenticated dev requests may still use `.env.local` LLM keys.

Consequences:

- Multi-user deployments require sign-in before saving; each user pays their own LLM bill.
- Empty LLM fields → AI features unavailable for that user (not the owner's keys).
- Empty Feishu fields → sync unavailable for that user.
- `.env.local.example` documents all vars including service role (with note).
- English-learning prompts remain default; arbitrary target language is future work.

---

2026-06-26

Decision:

**Always LLM `example_zh` + default sync clean** (Pre-Phase 5 P0, `example-zh-quality`).

Context:

User sample audit (5 videos) showed subtitle alignment could not guarantee semantically appropriate Chinese (misalignment, fragments, unrelated context). A/B clean tests on bilingual paste showed sync clean preserves phrase-friendly extract input. Cost of per-expression LLM translation is ~¥0.2–0.6/month at one import/day.

Decision:

1. **`example_zh`:** `resolveExampleZh(example_en)` always calls DeepSeek; no raw-text alignment in pipeline.
2. **`cleaned_text`:** Default `cleanTranscriptSync` on import (Web + CLI). LLM clean only when `IMPORT_USE_LLM_CLEANER=1`.
3. **Extract:** Unchanged — always LLM via `extract-expressions` prompt.
4. **Backfill:** `npx tsx scripts/backfill-example-zh.ts --force` re-translates all rows (idempotent).
5. **Stats:** `scripts/example-zh-stats.ts`; alignment quality gate in `example-zh-alignment.ts` for auditing only.
6. **A/B tooling:** `scripts/ab-clean-extract.ts` + reports under `docs/ab-clean-extract-*.md`.

Consequences:

- Review card Chinese is independent of fragmented bilingual subtitles.
- New imports use less clean API; extract + example_zh LLM calls remain.
- Phrase quality tuning deferred to Pre-Phase 5 P1 extraction depth.

---

2026-06-26

Decision:

**Extraction depth +「值得学」quality pass** (Pre-Phase 5 P1, `feat/extraction-depth-tuning`).

Context:

Extract relied on a short LLM prompt and a fixed 20 expressions/chunk cap. User curation showed ~3 trivial items deleted per 20-item batch (noise: single words, fragments, duplicate splits from one sentence). Directions D (second LLM pass) and E (dismiss feedback) deferred.

Decision:

1. **Prompt tightening (A):** `prompts/extract-expressions.md` — explicit include/exclude rules, good/bad table, transferable collocation forms; dynamic `{{MAX_EXPRESSIONS}}` per chunk.
2. **Cap / mode (B):** Standard: `clamp(round(chars/1000), 6, 15)` per chunk; Deep: `clamp(round(chars/600), 12, 30)`. Video target = sum of chunk caps.
3. **Post-filter (C):** `filterLowQualityExpressions` — reject single-word / stopword-only phrases; dedupe substring overlaps; one phrase per duplicate `example` sentence.
4. **Rank pass (D):** Overfetch first pass (`getChunkExtractCap`); second LLM via `prompts/select-expressions.md` when merged count > video target. `EXTRACTION_RANK_PASS=0` to disable.
5. **Dismiss reasons (E):** `expression_dismissals.reason` + Topics reason picker; `formatDismissalHintsForPrompt` feeds extract prompt; `scripts/dismissal-stats.ts`.
6. **Calibration:** User fills Scheme 2 table in `docs/extraction-depth-calibration.md`.

Consequences:

- Default short vlog (~4k chars) targets ~6 items/chunk (not 10).
- +1 LLM call per extract when rank pass runs.
- Re-extract improves after dismiss audit via prompt hints.

---

2026-06-26 (c)

Decision:

**P1 extraction depth — Definition of Done excludes a personal “must-keep” phrase list.**

Context:

After re-extract on three sample videos, the user noted specific phrases they still wanted (e.g. `whole ass or no ass`, `make the most of`, `unblock yourself`, `take a step back`). Tighter caps + rank pass intentionally trade recall of every good item for lower noise. Feishu sync (Phase 6) will curate from notes; it does not guarantee the same phrases reappear from transcript extract alone.

Decision:

1. **P1 is done when:** default extract is cleaner (post-filter, lemma forms, elastic cap, dismiss hints, Scheme 2 calibration data) — not when every user-favored phrase from a prior batch is present.
2. **Personal keep-list gaps** are addressed later via: Feishu word lists, manual add, per-video Deep re-extract, or `topic_locked` — not more global prompt/cap tuning in P1.
3. **Re-extract validation** on 3 videos (internship, 29 easy things, Getting Married) accepted as sufficient for P1 gate.

Consequences:

- Avoid blocking Collections / Phase 5 gate on subjective phrase recall.
- Future “I want this exact phrase” is a curation/sync feature, not extract depth regression.

---

2026-06-25

Decision:

**Harden `example_zh` alignment** for YouTube-style interleaved bilingual paste (Pre-Phase 5 P0).

Context:

Review card front uses `example_zh`. User sample audit (5 videos × 20 cards) found **0 null** but heavy **misalignment** and **fragmentation**: loose substring matching caused unrelated cards to share one Chinese block (e.g. six sentences all mapped to「真正说出他们对你美好想法的人。」); subtitle fragments without sentence endings were stored as complete translations.

Decision:

1. **Parse** `raw_text` into EN→ZH block pairs; score candidates with token recall/precision/F1 (not first substring hit).
2. **Merge** up to 6 consecutive pairs when `example_en` spans fragmented EN blocks.
3. **Quality gate** (`isPlausibleAlignment`): reject English copied into `example_zh`, Latin-heavy text, incomplete tails, and fragments missing `。！？` for long examples; allow short complete sentences (e.g.「下次见。」).
4. **Resolve order:** align → keep plausible existing → DeepSeek translate.
5. **Backfill:** `npx tsx scripts/backfill-example-zh.ts --force` (idempotent; skips unchanged rows). Local dev: prefix with `STATS_SUPABASE_URL=http://127.0.0.1:54321`.
6. **Stats:** `npx tsx scripts/example-zh-stats.ts` reports null % and quality-gate pass rate per video.

Metrics (local DB, 120 expressions):

| Metric | Before (user audit) | Before (automated gate) | After alignment backfill |
|--------|---------------------|-------------------------|------------------------|
| `example_zh` null | 0% | 0% | 0% |
| Sample misaligned / bad (manual, 100 cards) | 20 / 29 / 1 ok | — | Superseded by Always LLM |
| Quality-gate implausible (automated) | — | 5 (4.2%) | 0 (0%) |

Consequences:

- Superseded by 2026-06-26 Always LLM decision; alignment code kept in `example-zh-alignment.ts` for audit scripts.

---

2026-06-21

Decision:

Use DeepSeek API for `example_zh` (superseded 2026-06-26: always LLM, no alignment in pipeline).

Reason:

Per-sentence cost is negligible at personal scale (~$0.0001 per expression). Cheaper than blocking review UX.