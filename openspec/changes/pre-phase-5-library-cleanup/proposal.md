## Why

Pre-Phase 5 hardening shipped, but real use of 27 imported videos surfaced four extraction-quality problems that block a trustworthy Phase 5 SRS library: (1) dismissals only block re-extract **per-video**, so deleted phrases reappear in new imports; (2) extraction cap calibration is based on 5 videos, now 27 are available; (3) the extract prompt uses a **hardcoded** `TOPIC_SEEDS` tree that drifts from the user's curated `topics` table; (4) the same phrase is extracted multiple times (exact dups + near-dups like `let go of` vs `let go of something`, `treat oneself` vs `treat yourself`) and shown as redundant cards instead of one card with multiple examples. Phase 5 should schedule a clean, deduplicated, well-classified library.

**Why now:** User has 238 expressions across 27 videos and is actively curating in Collections. Curation signal (deletes, moves, topic tree edits) is being generated but not fed back into extraction. Fixing this loop before SRS means Phase 5 schedules expressions users actually keep.

---

## What Changes

### 1. Global dismiss blocklist (user-scoped)

- Dismissed phrases block extraction **across all videos** for the user, not just the source video.
- `expression_dismissals` gains `user_id` (nullable for existing rows; required going forward) and the extract pipeline consults a **global** phrase set in addition to the per-video set.
- Collections delete restores a `reason` picker (Phase 3.5 had it, Collections dropped it); reason feeds the existing `formatDismissalHintsForPrompt` soft hints.
- **BREAKING** (internal): `listDismissedPhraseKeysForVideo` semantics unchanged, but extract pipeline additionally calls a new `listGlobalDismissedPhraseKeys`.

### 2. Calibration refresh from 27 videos

- Re-run `scripts/extraction-depth-stats.ts --write` against cloud DB; update `docs/extraction-depth-calibration.md`.
- Decide (in design) whether to tune `STANDARD_CHARS_PER_SLOT` (1000→800 per prior note) and/or floor/ceiling, or keep current constants and only update the reference table.
- No schema change; constants in `src/lib/extraction-depth.ts` may adjust.

### 3. Dynamic topic tree in extract prompt

- `buildSystemPrompt` builds `{{TOPIC_TREE}}` and `{{LEAF_SLUGS}}` from `listTopics(supabase)` at extract time, not from hardcoded `TOPIC_SEEDS`.
- `TOPIC_SEEDS` demoted to migration-time seed only (still used by `supabase/migrations` and tests as fixture).
- `expression-extractor` accepts a `topics` parameter so the pipeline passes the same DB topics used by `resolveTopicSlug`.
- Tests cover: prompt reflects user-created topic, deleted topic, renamed slug.

### 4. Merge duplicate expressions

- **Normalization rules** collapse near-dups to a canonical phrase key:
  - lowercase + collapse whitespace (existing)
  - strip/normalize pronoun placeholders: `something` / `sb` / `sth` / `oneself` / `yourself` / `things` / `it` → dropped or unified (e.g. `let go of something` → `let go of`, `treat yourself` → `treat oneself`, `try things on` → `try something on`)
  - preference rule: keep the more general form (`treat oneself` over `treat yourself`; `try something on` over `try things on`)
- **Storage (decided: JSONB array):** `expressions` gains `examples jsonb` column = `[{en, zh}, ...]`. Existing `example_en` / `example_zh` retained for backward compat and treated as `examples[0]` when `examples` is null. One expression row per canonical phrase **per video** (Video view stays unmerged; All/Topic views merge across videos by canonical key).
- **UI:** All and Topic views render one card per canonical phrase with multiple `Example one` / `Example two` blocks; Video view keeps current one-row-per-example behavior (user-confirmed).
- **Backfill:** one-shot script merges existing 238 rows by canonical key within each video (preserving `topic_locked` and the best example set); inter-video merge for All/Topic happens at query time (no row deletion across videos).
- **Manual merge:** Collections gains a "merge with…" action for cases the rules miss.
- Extract pipeline writes `examples` array and dedups by canonical key before insert.

### 5. Other pre-Phase 5 tasks (user-confirmed: A, C, D + Re-extract)

- **A. Dismiss reason picker in Collections:** restore the `DismissReason` selector on the delete action so global blocklist rows carry `reason`; enables reason-aware global filtering in future.
- **C. example_zh backfill:** run existing backfill for any `example_zh IS NULL` rows after merge; target ≥95% non-null.
- **D. SRS prep (review_queue):** add `review_queue` table per `docs/database.md` (id, expression_id, due_at, source, created_at) + indexes; no scheduling logic yet (Phase 5 fills it). Pre-emptive so Phase 5 spec is smaller.
- **Re-extract entry:** add a UI + API entry point to re-run the extraction pipeline on an already-imported video without re-importing the transcript. Resolves the video's latest transcript, calls the existing extract pipeline (which now benefits from global blocklist + dynamic topic tree + canonical dedup), preserves `topic_locked` expressions, and replaces unlocked transcript-sourced rows. Lets items 1–3 reach the existing 27-video library, not only future imports.

### Out of Scope (deferred)

- Feishu sync (Phase 6), gap detection (Phase 7), speech scoring.
- Per-user RLS isolation (single-user app for now; `user_id` columns are forward-compatible).
- LLM-based near-dup detection (rule-based normalization chosen).
- Bulk Re-extract across all videos at once (v1 is per-video; a "re-extract all" script already exists as `scripts/reprocess-expressions.ts`).

---

## Capabilities

### New Capabilities

- `expression-merge`: Canonical phrase normalization, `examples` JSONB storage, merge backfill, manual merge action, multi-example card rendering in All/Topic views.
- `global-dismiss-blocklist`: User-scoped phrase blocklist consulted by extract across all videos; reason-aware.
- `review-queue`: `review_queue` table + indexes (scheduling deferred to Phase 5).
- `extraction-depth`: Calibration table refresh from 27 videos; constant adjustment gated on median delete rate.
- `reextract`: UI + API entry to re-run extraction on an already-imported video without re-importing the transcript.

### Modified Capabilities

- `expression-extraction`: Prompt topic tree sourced from `topics` table at runtime; extract pipeline dedups by canonical phrase key and writes `examples` array; consults global dismiss blocklist.
- `expression-storage`: Add `examples` jsonb column and `user_id` on `expression_dismissals`; list queries return `examples`; canonical phrase key derivation.
- `collections-page`: Delete action restores reason picker; All/Topic views render merged multi-example cards; manual "merge with…" action; Video L2 view gains Re-extract action.

---

## Impact

| Area | Workstreams |
|------|-------------|
| `supabase/migrations/` | `expressions.examples`, `expression_dismissals.user_id`, `review_queue` table |
| `src/lib/extraction-depth.ts`, `docs/extraction-depth-calibration.md` | Calibration refresh |
| `src/lib/topic-seeds.ts`, `src/services/expression-extractor.ts`, `src/services/expression-pipeline.ts` | Dynamic topic tree, canonical-key dedup, global blocklist |
| `src/db/expressions.ts`, `src/db/expression-dismissals.ts`, `src/db/review-queue.ts` (new) | Schema access |
| `src/components/collections/` | Multi-example card, reason picker, manual merge, Re-extract action |
| `src/app/collections/CollectionsManager.tsx` | Merge rendering, reason picker, Re-extract trigger |
| `src/app/api/videos/[id]/reextract/route.ts` (new) | Re-extract API endpoint |
| `scripts/` | Merge backfill, calibration re-run, example_zh backfill |
| `tests/` | Canonical key, dynamic topic prompt, global blocklist, merge render |

**Phase 5 unaffected:** `review_queue` is created empty; SRS scheduling logic is Phase 5 scope.

---

## Delivery model

One umbrella change; implement as separate PRs in this order:

1. `feat/global-dismiss-blocklist` (A: reason picker + user_id + global filter)
2. `feat/dynamic-topic-tree-prompt` (item 3 + tests)
3. `feat/expression-merge` (item 4: schema + rules + backfill + UI)
4. `feat/reextract-entry` (Re-extract API + Collections Video L2 button)
5. `chore/calibration-refresh` (item 2: re-run script, optional constant tweak)
6. `chore/example-zh-backfill` (item 5C)
7. `feat/review-queue-schema` (item 5D: table + indexes only)

Tag: `pre-phase-5-library-cleanup` after all merge to `main`.

---

## Relationship to Phase 5

**Gate:** Open `phase-5-spaced-repetition` after this change merges to `main`. Phase 5 then implements scheduling on a clean, deduplicated, well-classified library with `review_queue` already in place.
