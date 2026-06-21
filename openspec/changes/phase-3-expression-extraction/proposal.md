## Why

Phase 2 stores cleaned transcripts, but Echo Speak's core value is turning passive input into recallable expressions. Without extraction and persistence, transcripts are inert text. Phase 3 closes the gap between stored transcripts and a queryable expression library—the prerequisite for multi-dimensional topic review (Phase 4) and Feishu normalization (Phase 6).

## What Changes

- Add **`topics` table** with hierarchical taxonomy (`parent_id`) and seed data (broad categories + finer subtopics).
- Add **`expressions` table** with `topic_id` FK (expressions attach to **leaf** topics for precise classification).
- Implement **`expression-extractor`** using OpenAI + `prompts/extract-expressions.md`, classifying to the **most specific** matching topic slug.
- Add **`expression-pipeline`** orchestration: load transcript → extract → resolve topic slug → persist expressions linked to video.
- Wire **`scripts/reprocess-expressions.ts`** CLI and **`POST /api/transcripts/[id]/extract`** API.
- Align **`src/types/expression.ts`**, **`src/db/expressions.ts`**, and new **`src/db/topics.ts`** with schema.
- Add tests for topic resolution, extractor parsing, and pipeline orchestration.

### In Scope (Phase 3)

- AI extraction from `transcripts.cleaned_text`
- Hierarchical topic assignment (prefer leaf subtopic; fall back to parent or `uncategorized`)
- Seed topic tree (system topics, user-extensible in Phase 3.5)
- Persist expressions with `source_type: transcript`
- CLI and API entry points for extraction
- Query helpers: expressions by video, expressions by topic subtree (for Phase 4 prep)

### Out of Scope (defer to Phase 3.5)

- Topic tree management UI (create / edit / delete topics)
- Drag-and-drop reassignment of expressions between topics
- Merge and normalize duplicate or overlapping topics
- Expression library browse cards

### Out of Scope (later phases)

- Review queue, SRS scheduling (Phase 4–5)
- Auto-run extraction on every import
- Feishu sync as expression source (Phase 6)
- Gap detection (Phase 7)
- Multi-tag per expression (one `topic_id` in v1)
- Cross-video phrase deduplication

## Capabilities

### New Capabilities

- `expression-extraction`: Extract phrases, meanings, examples, and hierarchical topic slugs from cleaned transcript text via OpenAI; expose CLI and API triggers.
- `topic-storage`: Persist hierarchical topics with parent-child relationships, seed taxonomy, and slug-to-id resolution.
- `expression-storage`: Persist expressions in Supabase with `topic_id` FK, RLS, and data-access helpers.

### Modified Capabilities

<!-- No existing spec requirements change. transcript-storage remains as-is. -->

## Impact

- `supabase/migrations/` — `topics` + `expressions` tables, seed data, RLS
- `src/db/topics.ts` — new: list tree, resolve slug, list subtree IDs
- `src/services/expression-extractor.ts` — implement with hierarchical topic output
- `src/services/expression-pipeline.ts` — new orchestration service
- `src/db/expressions.ts` — align types; bulk insert; list by video / topic subtree
- `src/types/expression.ts`, `src/types/topic.ts` — new aligned types
- `src/lib/topic-seeds.ts` — seed taxonomy for migration and prompt
- `prompts/extract-expressions.md` — hierarchical topic classification schema
- `scripts/reprocess-expressions.ts`, `src/app/api/transcripts/[id]/extract/route.ts`
- `tests/` — topic resolution, extractor, pipeline tests
- `docs/database.md`, `docs/progress.md`, `docs/next-task.md` — update after apply
