## Context

Pre-Phase 5 hardening shipped. User has since imported 27–32 videos and curated in Collections, generating signal (43 dismissals, topic edits, moves) that is **not** feeding back into extraction. Four extraction-quality gaps surfaced; this change closes the loop before Phase 5 SRS.

Current state:
- 238 expressions, 0 null `example_zh` (already backfilled), 43 dismissals, 32 videos.
- `expression_dismissals` unique on `(video_id, phrase_key)`; extract filters per-video only.
- Extract prompt topic tree hardcoded in `src/lib/topic-seeds.ts` (`TOPIC_SEEDS`); `resolveTopicSlug` already uses DB.
- No canonical phrase key; exact-dup phrases stored as separate rows; near-dups (`let go of` vs `let go of something`) not recognized.
- Collections delete sends empty body → `reason` always null → `formatDismissalHintsForPrompt` returns "" (it filters `reason IS NOT NULL`).
- Cloud `expression_dismissals` may lag repo migrations (phrase/reason/topic_id columns); `recordDismissal` already has a fallback path (merged in this session).

Constraints:
- Single-user app; `user_id` columns are forward-compatible, not for RLS isolation yet.
- Mobile-first 430×932 UI; Collections card aesthetic must be preserved.
- No Re-extract entry in this change (deferred); improvements apply to future imports.

## Goals / Non-Goals

**Goals:**
- Deleted phrases never reappear in any future import (global, reason-aware).
- Extract prompt sees the user's actual curated topic tree.
- Same phrase (exact + rule-normalized near-dups) renders as one card with multiple examples in All/Topic views.
- Calibration table reflects 27-video reality; constants adjust only if clearly justified.
- `review_queue` table exists so Phase 5 spec is scheduling-only.
- Collections delete captures a reason.

**Non-Goals:**
- SRS scheduling logic (Phase 5).
- Re-extract entry for already-imported videos (deferred; user decision).
- LLM-based near-dup detection (rule-based chosen).
- Per-user RLS isolation.
- Cross-video row merging in DB (All/Topic merge at query time; Video view stays per-row).

## Decisions

### D1. Global dismiss blocklist via `user_id` + union query

Add `expression_dismissals.user_id uuid references auth.users (id) on delete cascade` (nullable for backfill; required for new dismissals). Extract pipeline calls both:
- `listDismissedPhraseKeysForVideo(videoId)` (existing, unchanged)
- `listGlobalDismissedPhraseKeys(userId)` (new) — all `phrase_key` for that user across all videos.

Filter = union of both sets. `recordDismissal` writes `user_id` from the authenticated session (service_role fallback: derive from expression's `video_id` → `videos.user_id` if needed; for now single-user, write the authenticated user id or a sentinel).

**Alternatives considered:**
- Separate `global_phrase_blocklist` table: cleaner but duplicates data; dismissed rows already carry everything. Rejected.
- Migrate existing dismissals to global by dropping `video_id` uniqueness: would lose per-video audit. Kept `video_id` + added `user_id`.

### D2. Canonical phrase key with rule-based normalization

New `src/lib/phrase-canonical.ts`:

```
canonicalKey(phrase):
  1. lowercase, collapse whitespace, trim
  2. remove trailing pronoun/placeholder tokens:
     something, sb, sth, oneself, yourself, themselves, things, it, them
     (only when they appear as the final token or after "of"/"on"/"with")
  3. map remaining reflexive variants: yourself/themselves → oneself
  4. return key
```

Examples:
- `let go of something` → `let go of`
- `treat yourself` → `treat oneself`
- `try things on` → `try something on` (rule 2 doesn't drop `something` mid-phrase; here `things` → `something` per a small alias map: `things → something`)
- `Behind the Scenes` → `behind the scenes` (exact dup)

**Display preference** when merging: keep the form that is **most general** (shortest canonical, no pronoun). `treat oneself` over `treat yourself`; `let go of` over `let go of something`. Tiebreak: lowest `created_at`.

**Alternatives considered:**
- LLM-based grouping: accurate but slow, non-deterministic, costs tokens per extract. Rejected for v1.
- Manual alias table only: too small coverage. Rules cover the common patterns; manual "merge with…" action handles exceptions.

### D3. `examples` JSONB column, one row per canonical phrase per video

Migration:
```sql
alter table public.expressions
  add column if not exists examples jsonb default null;
-- examples: [{en: text, zh: text|null}, ...]
-- backward compat: when examples is null, treat example_en/example_zh as examples[0]
```

**Insert path (extract pipeline):** after LLM returns, group items by `canonicalKey(phrase)`. For each canonical group:
- pick display `phrase` (most general form)
- pick `meaning` (first non-empty)
- `examples` = [{en, zh} for each item in group]
- `example_en` / `example_zh` = examples[0] (keep populated for backward compat with Review/old queries)
- one row inserted per canonical phrase per video

**Query path:**
- Video view: `listExpressionsByVideo` unchanged (one row per canonical phrase for that video; `examples` array has all examples from that video).
- All/Topic views: new `listExpressionsMergedByCanonicalKey` — fetch rows, group by `canonicalKey(phrase)` across videos, merge `examples` arrays, return virtual rows. DB rows stay per-video; merge is at the API/query layer.

**Why JSONB over subtable:** user-confirmed decision. Migration is one column; reads are simple (`select examples`); no join explosion. Trade-off: harder to query by example content — acceptable (we never query by example text).

**Why not cross-video row merge in DB:** Video view needs per-video rows; merging in DB would require a join table for video↔expression many-to-many. Query-time merge for All/Topic is cheaper and reversible.

### D4. Dynamic topic tree from DB in extract prompt

`buildSystemPrompt(maxExpressions, topics)`:
- replace `formatTopicTreeForPrompt()` (no-arg, uses `TOPIC_SEEDS`) with `formatTopicTreeForPrompt(topics)` that builds the tree from the DB rows (parent_id nesting).
- `listLeafTopicSlugs(topics)` filters rows with no children.
- `expression-extractor.extractExpressions(cleanedText, { topics, depth, rankPass })` passes topics through.
- `expression-pipeline.extractExpressionsForTranscript` already loads `listTopics(supabase)` for `resolveTopicSlug` — pass the same array to `extractFn`.

`TOPIC_SEEDS` stays as:
- migration seed source (existing)
- test fixture (new tests use it to seed a fake DB)

**Backward compat:** `formatTopicTreeForPrompt()` no-arg form kept (uses `TOPIC_SEEDS`) for tests only; production always passes topics.

### D5. Calibration refresh — script re-run, constant tweak only if justified

Run `npx tsx scripts/extraction-depth-stats.ts --write` against cloud. Inspect 27-video median delete rate vs current 5-video (was 20%). If median shifts materially (e.g. >30%), adjust `STANDARD_CHARS_PER_SLOT` 1000→800 per `docs/decisions.md` 2026-06-26 note. Otherwise just refresh the table and add a dated note. No spec change required if constants hold.

### D6. `review_queue` table (schema only, no scheduling)

Per `docs/database.md`:
```sql
create table public.review_queue (
  id uuid primary key default gen_random_uuid(),
  expression_id uuid not null references public.expressions (id) on delete cascade,
  due_at timestamptz not null,
  source text not null default 'transcript',
  created_at timestamptz not null default now()
);
create index review_queue_due_at_idx on public.review_queue (due_at);
create index review_queue_expression_id_idx on public.review_queue (expression_id);
alter table public.review_queue enable row level security;
-- policies: authenticated select/insert, service_role all
```

No `src/lib/srs.ts` changes; no `due_at` write path. Phase 5 fills it.

### D7. Collections delete reason picker

Restore a lightweight reason picker (bottom sheet or inline chips) on delete action. Reasons from `DISMISS_REASONS`. `dismissExpression` sends `{ reason }`. Existing `dismissExpression` DB function already accepts reason. `formatDismissalHintsForPrompt` now gets real data.

### D8. Multi-example card rendering

`ExpressionCard`:
- if `expression.examples?.length > 1` (or merged virtual row has >1): render `Example one` / `Example two` blocks, each with en (italic) + zh.
- else: render single example (current layout).
- Actions (move/delete) apply to the whole canonical phrase group. Delete dismisses the canonical key globally.

`ExpressionListWithAlphabet`: for All/Topic views, receive already-merged virtual rows; for Video view, receive per-video rows (which may themselves have multi-example `examples` array).

### D9. Re-extract entry (per-video, no re-import)

**Problem:** Items 1–3 (global blocklist, dynamic topic tree, canonical dedup) only affect *future* extracts. To reach the existing 27-video library, the user would otherwise have to re-import each transcript (triggers `DuplicateImportError`) or manually delete rows in Supabase.

**Decision:** Add `POST /api/videos/[id]/reextract`:
- resolve `getLatestTranscriptForVideo(videoId)`
- call existing `extractExpressionsForTranscript(transcriptId, { depth })`
- pipeline already: deletes unlocked transcript-sourced rows for that video → inserts new batch (now with global blocklist + dynamic topic tree + canonical dedup)
- `topic_locked` rows preserved (existing behavior)
- returns `{ ok, expressionCount, videoId, transcriptId }`

**UI:** Collections Video L2 view (the page showing a video's expressions) gains a "Re-extract" button in the header area. On click: confirm dialog (warns it replaces non-locked expressions) → call API → reload list. No UI on Video L1 list (keep it clean).

**Why per-video, not bulk:** `scripts/reprocess-expressions.ts` already does bulk for dev/CLI use. The UI button is for the common single-video case ("this video's extract is noisy, redo it now that I've cleaned up").

**Alternatives considered:**
- Re-use `POST /api/transcripts/[id]/extract` from UI by first fetching the video's transcript id: extra round trip, leaks transcript id to client. New endpoint is cleaner.
- Auto re-extract on migration: too risky (mutates user library without consent). Rejected.

## Risks / Trade-offs

- **Canonical rules over-merge** (`switch it up` vs `switch up`): unlikely with current rules (we only drop final pronouns/placeholders). → Mitigation: rules are conservative; manual "merge with…" handles exceptions; "split" action deferred (rare).
- **`examples` JSONB harder to mutate** (edit one example): acceptable for v1; no example-edit UI exists. → If needed later, migrate to subtable.
- **Global blocklist false positives** (delete `make it` in one video, lose it everywhere): user-confirmed as desired default; reason picker lets future "per-video only" reason (`off_topic`) opt out — but v1 applies global for all reasons. → Document; add "blocked phrases" management page later if needed.
- **Dynamic topic tree prompt bloat** if user creates many topics: 27-video scale fine; >100 topics may need truncation. → Defer.
- **Cloud migration lag**: `expression_dismissals` was missing columns; `recordDismissal` already has fallback. New migrations (`examples`, `user_id`, `review_queue`) must be applied to cloud before deploy. → Migration plan below.
- **example_zh backfill (item 5C)**: 0 null rows already. → Scope reduced to verification + targeted re-backfill for any rows that lose `example_zh` during merge backfill (shouldn't happen, but guard).

## Migration Plan

Order (each as its own PR + cloud migration):

1. `expression_dismissals.user_id` + backfill existing rows with the single user's id.
2. `expressions.examples` jsonb (nullable); backfill script populates `examples = [{en: example_en, zh: example_zh}]` for existing rows; then merge-backfill collapses same-video dups.
3. `review_queue` table.
4. Code: global blocklist query, dynamic topic tree, canonical key + extract dedup, Collections UI.
5. Cloud: `supabase db push` (or MCP `apply_migration`) for each; deploy via `vercel --prod`.

Rollback: each migration is additive (new columns/tables); revert code, leave columns nullable. `examples` backfill is idempotent.

## Open Questions

- Should `off_topic` dismissals be **per-video only** (not global) in v1? Default in this design: all reasons global. User can revisit.
- Canonical rule for `things → something` mid-phrase: confirm coverage doesn't break real phrases (e.g. `pack things up` — would canonicalize to `pack something up`; acceptable? Likely yes).
- Manual "merge with…" UI placement: card action menu vs. multi-select mode. Design defers to implementation.
- Re-extract confirm dialog copy: how strongly to warn about replacing non-locked expressions. Default: "This will replace non-locked expressions for this video. Locked topics stay. Continue?"
