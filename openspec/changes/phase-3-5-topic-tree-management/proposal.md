## Why

Phase 3 seeds a hierarchical topic tree and assigns expressions via AI, but real content does not fit fixed buckets. The learner needs to **curate** their taxonomy: add fine-grained topics (e.g. `drinks` under `food`), move expressions between topics, and merge duplicates (e.g. `cooking` + `cookings`). Without management UI, misclassified expressions block effective multi-dimensional review in Phase 4.

## What Changes

- **Topic CRUD UI**: create, rename, delete user topics; respect `is_system` protections on seed roots where appropriate.
- **Drag-and-drop reassignment**: move expressions between topics (change `topic_id`).
- **Dismiss / delete expressions**: user removes unwanted AI extractions; dismissal records prevent re-extract from bringing them back.
- **Mac-style topic dock**: fixed bottom bar with topic icons + trash; drag expression to trash to dismiss.
- **Merge / normalize**: combine two topics into one canonical topic; reassign all expressions; handle slug conflicts.
- **Topic tree browser**: hierarchical view of topics with expression counts per node.
- **API / server actions** backing the UI (no direct client DB writes for destructive ops).

### In Scope (Phase 3.5)

- Topic tree page (mobile-first, design system basics)
- Create child topic under any parent
- Rename user-created topics; delete empty user topics
- Drag expression to different topic (single `topic_id` update)
- Dismiss expression: delete row + record in `expression_dismissals` (normalized phrase per video)
- Delete UX: per-row delete button, mobile swipe-to-delete, drag-to-trash on topic dock
- Topic dock: fixed bottom bar with topic icons + trash on the right; long-press expression → drag to topic or trash
- Trash drop: ~0.5s hover → 150–200ms opacity fade; optional confetti/fireworks easter egg
- Merge topic A into topic B (reassign expressions, remove or redirect A)
- Protect re-extract from overwriting user-assigned topics (`topic_locked`) or dismissed phrases

### Out of Scope (defer)

- Multi-tag per expression
- Feishu category import mapping (Phase 6)
- Review cards / SRS (Phase 4–5)
- Bulk auto-normalize via LLM (manual merge only in v1)
- Desktop-specific layout
- Extraction depth modes (standard vs deep) — deferred to post–Phase 3.5 enhancement

## Capabilities

### New Capabilities

- `topic-tree-management`: User-facing CRUD, drag-drop reassignment, and merge/normalize for hierarchical topics and their expressions.

### Modified Capabilities

- `expression-storage`: Add `topic_locked` so user-assigned topics survive re-extraction; add `expression_dismissals` so user-deleted phrases are not re-inserted.
- `topic-storage`: Add user-created topics (`is_system = false`), merge metadata (`merged_into_id`), and delete guards.

## Impact

- `src/app/topics/` — topic tree management page + topic dock + trash
- `src/app/api/topics/` or Server Actions — CRUD, merge, move expression, dismiss expression
- `src/db/topics.ts` — create, update, delete, merge helpers
- `src/db/expressions.ts` — `updateExpressionTopic`, `dismissExpression`, dismissal lookups
- `src/db/expression-dismissals.ts` (or module in expressions) — record/list dismissed phrases per video
- `supabase/migrations/` — `topic_locked` on expressions, `merged_into_id` on topics, `expression_dismissals` table
- `src/services/expression-pipeline.ts` — skip locked rows and dismissed phrases on re-extract
- `src/lib/merge-expressions.ts` — filter dismissed phrases after chunk merge
- `docs/design-system.md` — dock, drag, trash fade, optional celebration motion
- `docs/progress.md`, `docs/next-task.md`, `docs/database.md` — update after apply
