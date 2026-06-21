## 1. Database & types

- [x] 1.1 Add migration with `topics` table (`name`, `slug`, `parent_id`, `is_system`) and seed hierarchical taxonomy
- [x] 1.2 Add migration `expressions` table with `topic_id` FK (not free-text `topic`), plus `video_id`, `phrase`, `meaning`, `example`, `source_type`, `weight`
- [x] 1.3 Add indexes on `topics.slug`, `topics.parent_id`, `expressions.video_id`, `expressions.topic_id`; RLS and service_role grants
- [x] 1.4 Add `src/types/topic.ts` and align `src/types/expression.ts` (`topicId`, `meaning`, `sourceType`, `weight`)
- [x] 1.5 Add `src/db/topics.ts`: `listTopics`, `getTopicBySlug`, `listTopicSubtreeIds`, `listTopicTree`
- [x] 1.6 Update `src/db/expressions.ts`: bulk insert, list by video, list by topic subtree; use `getSupabaseAdmin()` for pipeline
- [x] 1.7 Add `src/lib/topic-seeds.ts` shared by migration seed script and prompt documentation
- [x] 1.8 Update `docs/database.md` with `topics` table and `expressions.topic_id`

## 2. Extraction service

- [x] 2.1 Extend `prompts/extract-expressions.md` with hierarchical `topic_slug` and instruction to pick most specific leaf
- [x] 2.2 Harden `src/services/expression-extractor.ts`: parse `topic_slug`, map `definition` → `meaning`, 50k limit, error handling
- [x] 2.3 Add `src/lib/topic-resolve.ts`: resolve slug to `topic_id`, coerce invalid/parent-with-children to `uncategorized`
- [x] 2.4 Add `tests/expression-extractor.test.ts` and `tests/topic-resolve.test.ts`

## 3. Pipeline orchestration

- [x] 3.1 Create `src/services/expression-pipeline.ts` with `extractExpressionsForTranscript(transcriptId)`
- [x] 3.2 Implement delete-then-insert idempotency for `source_type = transcript`
- [x] 3.3 Add `tests/expression-pipeline.test.ts` with mocked DB, topics, and extractor

## 4. API & CLI

- [x] 4.1 Add `src/app/api/transcripts/[id]/extract/route.ts` (`POST`) returning `{ expressionCount, videoId }`
- [x] 4.2 Implement `scripts/reprocess-expressions.ts` with `--transcript-id` and batch-all mode
- [x] 4.3 Add minimal "Extract expressions" action on import success UI

## 5. Verification & docs

- [x] 5.1 Manual test: import sample transcript → extract → confirm expressions under correct leaf topics in Supabase Studio
- [x] 5.2 Manual test: subtree query returns child-topic expressions when querying parent `food`
- [x] 5.3 Update `docs/progress.md` and `docs/next-task.md` for Phase 3 completion; point next work to Phase 3.5 topic tree management
