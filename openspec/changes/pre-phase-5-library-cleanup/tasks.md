## 1. Global dismiss blocklist (PR 1: `feat/global-dismiss-blocklist`)

- [x] 1.1 Migration: add `expression_dismissals.user_id uuid references auth.users(id) on delete cascade` (nullable)
- [x] 1.2 Backfill: set `user_id` on existing dismissal rows to the single authenticated user's id (script or migration)
- [x] 1.3 `src/db/expression-dismissals.ts`: `recordDismissal` writes `user_id` from authenticated session (service_role fallback derives from video owner)
- [x] 1.4 `src/db/expression-dismissals.ts`: add `listGlobalDismissedPhraseKeys(userId)`
- [x] 1.5 `src/services/expression-pipeline.ts`: union per-video + global dismissed key sets before filtering
- [x] 1.6 Tests: global blocklist skips phrase on a different video
- [x] 1.7 Tests: per-video blocklist still respected

## 2. Collections delete reason picker (PR 1 cont.)

- [x] 2.1 `src/components/collections/`: reason picker component (chips or bottom sheet) with `DISMISS_REASONS`
- [x] 2.2 `CollectionsManager.dismissExpression`: send `{ reason }` in request body
- [x] 2.3 Keep optimistic UI update (current behavior); reason picker precedes the API call
- [ ] 2.4 Manual regression: dismiss with reason; verify `expression_dismissals.reason` populated in DB
- [ ] 2.5 Verify `formatDismissalHintsForPrompt` now produces non-empty output

## 3. Dynamic topic tree in extract prompt (PR 2: `feat/dynamic-topic-tree-prompt`)

- [x] 3.1 `src/lib/topic-seeds.ts`: `formatTopicTreeForPrompt(topics: Topic[])` builds tree from DB rows via `parent_id`
- [x] 3.2 `src/lib/topic-seeds.ts`: `listLeafTopicSlugs(topics: Topic[])` filters rows with no children
- [x] 3.3 Keep no-arg overloads (using `TOPIC_SEEDS`) for test fixtures only; mark deprecated for prod
- [x] 3.4 `src/services/expression-extractor.ts`: `extractExpressions(cleanedText, { topics, depth, rankPass })` passes topics to `buildSystemPrompt`
- [x] 3.5 `src/services/expression-pipeline.ts`: pass `listTopics(supabase)` result into `extractFn`
- [x] 3.6 Tests: prompt includes a user-created topic slug; LLM may classify to it
- [x] 3.7 Tests: deleted topic absent from prompt; renamed slug reflected
- [x] 3.8 Tests: `TOPIC_SEEDS`-based no-arg path still works for unit tests

## 4. Canonical phrase key + extract dedup (PR 3: `feat/expression-merge` schema + extract)

- [x] 4.1 `src/lib/phrase-canonical.ts`: `canonicalKey(phrase)` with rules (lowercase, collapse ws, drop trailing pronouns/placeholders, reflexive → oneself, things → something mid-phrase)
- [x] 4.2 Unit tests: all scenarios from spec (exact dup, pronoun drop, reflexive, things→something, deterministic)
- [x] 4.3 `src/lib/phrase-canonical.ts`: `pickDisplayPhrase(phrases: string[])` — most general form
- [x] 4.4 Migration: `alter table public.expressions add column examples jsonb default null`
- [x] 4.5 `src/db/expressions.ts`: `createExpressions` writes `examples` array and mirrors `examples[0]` to `example_en`/`example_zh`
- [x] 4.6 `src/services/expression-pipeline.ts`: group LLM items by `canonicalKey`, merge into one row per canonical per video, pick display phrase via `pickDisplayPhrase`
- [x] 4.7 Tests: same phrase twice in one batch → one row, `examples` length 2
- [x] 4.8 Tests: near-dup in one batch → one row, display = general form
- [x] 4.9 Tests: canonical key blocked by global dismissal → no insert

## 5. Merge backfill + manual merge (PR 3 cont.)

- [x] 5.1 `scripts/merge-duplicate-expressions.ts`: for each video, collapse rows sharing canonical key; preserve `topic_locked`; populate `examples`
- [x] 5.2 Backfill preserves `example_zh` (non-null wins for `examples[0].zh`)
- [x] 5.3 Idempotency test: second run is no-op
- [x] 5.4 Run backfill against cloud DB; verify row count drops and no `example_zh` nulls introduced
- [x] 5.5 `src/app/api/expressions/[id]/merge/route.ts`: POST merges source into target (combines `examples`, deletes source row)
- [x] 5.6 `src/db/expressions.ts`: `mergeExpressions(sourceId, targetId)` helper

## 6. Collections multi-example UI (PR 3 cont.)

- [x] 6.1 `src/db/expressions.ts`: `listExpressionsMergedByCanonicalKey(scope)` for All/Topic views (groups across videos, concatenates `examples`)
- [x] 6.2 `src/app/api/expressions/route.ts`: All view returns merged virtual rows
- [x] 6.3 `src/app/api/topics/[id]/expressions/route.ts`: Topic view returns merged virtual rows
- [x] 6.4 Video view endpoint unchanged (per-video rows, may have multi-example `examples`)
- [x] 6.5 `src/components/collections/ExpressionCard.tsx`: render `examples` array as numbered `Example one`/`Example two` blocks; single-example stays as-is
- [x] 6.6 `ExpressionListWithAlphabet`: accept merged virtual rows for All/Topic; per-video rows for Video
- [x] 6.7 Manual "merge with…" action UI (card action menu → picker → API call)
- [ ] 6.8 Manual regression: All view shows one card for `behind the scenes` with 2 examples; Video view shows per-video rows
- [ ] 6.9 Mobile layout check at 430×932

## 7. Re-extract entry (PR 4: `feat/reextract-entry`)

- [x] 7.1 `src/app/api/videos/[id]/reextract/route.ts`: resolve `getLatestTranscriptForVideo(videoId)`, call `extractExpressionsForTranscript(transcriptId, { depth })`, return summary
- [x] 7.2 Endpoint accepts optional `{ depth }` body and passes through `resolveExtractionDepth`
- [x] 7.3 404 when video or transcript not found
- [x] 7.4 Reuses pipeline: global blocklist + dynamic topic tree + canonical dedup + `topic_locked` preservation all active
- [x] 7.5 `src/components/collections/`: Re-extract button in Video L2 header (CollectionsBackHeader area)
- [x] 7.6 Confirm dialog: "This will replace non-locked expressions for this video. Locked topics stay. Continue?"
- [x] 7.7 On success: reload `videoExpressions` via `loadVideoExpressions(videoId)`; show success toast
- [x] 7.8 Loading state on the button while re-extract runs
- [x] 7.9 Tests: endpoint resolves latest transcript and delegates to pipeline
- [ ] 7.10 Manual regression: re-extract a video with a globally-dismissed phrase → phrase absent; locked topic row preserved
- [ ] 7.11 Mobile layout check at 430×932 (button reachable in Video L2 header)

## 8. Calibration refresh (PR 5: `chore/calibration-refresh`)

- [x] 8.1 Run `npx tsx scripts/extraction-depth-stats.ts --write` against cloud DB
- [x] 8.2 Verify Scheme 2 table lists ≥27 videos
- [x] 8.3 Compute 27-video median delete rate; compare to 5-video 20% baseline
- [x] 8.4 If median >30%, apply design-confirmed constant change (`STANDARD_CHARS_PER_SLOT` 1000→800); record in `docs/decisions.md` (N/A: median 16.7%)
- [x] 8.5 If median within 15–30%, append dated note to `docs/extraction-depth-calibration.md` and leave constants
- [x] 8.6 Update `docs/progress.md` with calibration refresh result

## 9. example_zh verification (PR 5 cont. — item 5C)

- [x] 9.1 Verify 0 null `example_zh` rows in cloud (current state per design)
- [x] 9.2 After merge backfill, re-verify no nulls introduced
- [x] 9.3 If any nulls appear, run `scripts/backfill-example-zh.ts` for those rows (N/A: 0 nulls)
- [x] 9.4 Target ≥95% non-null confirmed (100%)

## 10. review_queue schema (PR 6: `feat/review-queue-schema`)

- [x] 10.1 Migration: `create table public.review_queue (...)` per design D6
- [x] 10.2 Indexes: `review_queue_due_at_idx`, `review_queue_expression_id_idx`
- [x] 10.3 RLS: authenticated select/insert policies; service_role full grant
- [x] 10.4 `src/db/review-queue.ts`: empty stub data-access module (no enqueue logic)
- [x] 10.5 `src/types/review.ts`: `ReviewQueueEntry` type
- [x] 10.6 Apply migration to cloud; verify table exists empty
- [x] 10.7 Update `docs/database.md` status: `review_queue` → implemented (schema only)

## 11. Cloud deploy + docs

- [x] 11.1 Apply all migrations to cloud (`supabase db push` or MCP `apply_migration`)
- [ ] 11.2 `npx vercel --prod` deploy
- [ ] 11.3 Smoke test: import a new video → verify global blocklist + dynamic topic tree + dedup all active
- [ ] 11.4 Smoke test: Collections delete with reason → verify DB row has reason
- [ ] 11.5 Smoke test: All view merged cards render; Video view per-video
- [ ] 11.6 Smoke test: Re-extract a video → unlocked rows replaced, locked preserved, dismissed phrases absent
- [x] 11.7 Update `docs/progress.md`, `docs/next-task.md`
- [ ] 11.8 `openspec archive pre-phase-5-library-cleanup` after all PRs merge
- [ ] 11.9 Tag `pre-phase-5-library-cleanup` on merge commit (per git-workflow rule)
