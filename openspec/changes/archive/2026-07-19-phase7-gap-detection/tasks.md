## 1. Schema & docs

- [x] 1.1 Add Supabase migration creating `gaps` (`id`, `expression_id` unique FK CASCADE → expressions, `reason`, `status`, `created_at`) plus index on `(status, created_at desc)`
- [x] 1.2 Update `docs/database.md` to mark `gaps` as implemented and link the migration
- [x] 1.3 Record Phase 7 ADR in `docs/decisions.md` (deterministic per-video transcript vs Feishu via `canonicalKey`)

## 2. Data access & detector

- [x] 2.1 Add `src/db/gaps.ts` helpers: list pending (with expression + video join), insert pending, set status, delete pending by ids, load existing gaps for a video
- [x] 2.2 Replace LLM stub in `src/services/gap-detector.ts` with `refreshGapsForVideo(videoId)` using `canonicalKey` set difference (transcript − Feishu); preserve ignored/accepted; clear stale pending
- [x] 2.3 Add unit tests for refresh rules (match closes gap, ignore sticky, empty Feishu → all transcript candidates, cross-video Feishu does not close)
- [x] 2.4 Remove or stop calling `prompts/gap-detection.md` from the product path (delete prompt if unused)

## 3. Triggers

- [x] 3.1 Call `refreshGapsForVideo` after transcript extraction completes for that video
- [x] 3.2 Call `refreshGapsForVideo` for each video touched by Feishu sync ingest
- [x] 3.3 Add optional one-shot backfill helper (script or Gaps page load) to refresh all videos that have transcript expressions

## 4. API & Gaps UI

- [x] 4.1 Add API routes (or server actions) to list pending gaps, accept, and ignore
- [x] 4.2 Rebuild `/gaps` to render pending gaps (phrase, meaning, video context) with Accept / Ignore; real empty state when none
- [x] 4.3 Update or replace `GapCard` to drop LLM-era priority/evidence requirements and match design-system density at 430×932
- [x] 4.4 Verify Gaps page at iPhone 15 Plus viewport (430×932)

## 5. Close-out

- [x] 5.1 Update `docs/progress.md` and `docs/next-task.md` for Phase 7 implementation status
- [x] 5.2 Apply migration to local (and note cloud apply step); smoke: extract + Feishu video shows pending gaps; Accept/Ignore persist across refresh
