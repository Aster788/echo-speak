## Context

Phase 1–2 provide `videos`, `transcripts`, and import pipeline. Expression scaffolding exists but `expressions` / `topics` tables do not. The learner wants **multi-dimensional review**: broad categories (e.g. `food`) and finer subtopics (e.g. `drinks`, `cooking`) for flexible study granularity.

Feishu notes use coarse categories (Phase 6); topic **management UI** (CRUD, drag-drop, merge) is deferred to **Phase 3.5**. Phase 3 establishes the hierarchical data model and AI initial assignment.

## Goals / Non-Goals

**Goals:**

- Hierarchical `topics` table with `parent_id` (tree, not flat list)
- Seed system topics: broad parents + common leaf children
- Expressions link to **leaf** `topic_id` when possible
- LLM classifies to **most specific** matching slug; fall back to parent or `uncategorized`
- Extraction pipeline shared by CLI and API
- Subtree query helper for Phase 4 ("review all food" = food + descendants)

**Non-Goals:**

- Topic management UI, drag-drop, merge/normalize (Phase 3.5)
- Review cards or SRS (Phase 4–5)
- Feishu-sourced expressions (Phase 6)
- Multi-tag per expression (v1: single `topic_id`)
- Auto-extract on import (explicit trigger in v1)
- Extraction depth modes (standard vs deep, elastic per-chunk cap) — deferred post–Phase 3.5

## Decisions

### 1. Schema: `topics` tree + `expressions.topic_id`

**Decision:** Two tables:

`**topics`**

- `id` (uuid PK)
- `name` (text, display e.g. "Drinks")
- `slug` (text, unique, e.g. `drinks`)
- `parent_id` (uuid FK → topics, nullable for roots)
- `is_system` (boolean, true for seed topics)
- `created_at` (timestamptz)

`**expressions**`

- `id`, `video_id`, `phrase`, `meaning`, `example`
- `topic_id` (uuid FK → topics) — **not** free-text `topic`
- `source_type`, `weight`, `created_at`

**Rationale:** Hierarchy enables broad + fine review dimensions. FK enables merge/reparent in Phase 3.5 without string surgery.

**Deferred to Phase 3.5:** `merged_into_id` on topics for soft-merge tracking.

### 2. Seed taxonomy (system topics)

**Decision:** Migration seeds parent + leaf topics. Initial tree:


| Parent (root)   | Children (leaves)                            |
| --------------- | -------------------------------------------- |
| `food`          | `drinks`, `cooking`, `dining-out`, `grocery` |
| `workout`       | `gym`, `recovery`                            |
| `travel`        | `packing`, `airport`, `hotel`                |
| `shopping`      | *(leaf root — no children in v1)*            |
| `productivity`  | *(leaf root)*                                |
| `daily`         | *(leaf root)*                                |
| `work`          | *(leaf root)*                                |
| `social`        | *(leaf root)*                                |
| `uncategorized` | *(catch-all leaf root)*                      |


Roots without children are valid **leaf attach points** until user adds children in Phase 3.5.

**Rationale:** Matches learner content (vlogs: food subthemes, workout subthemes) while keeping seed set manageable.

### 3. Expression attaches to leaf topic

**Decision:** Pipeline resolves LLM `topic_slug` to a `topic_id`. Prefer leaf nodes. If LLM returns a parent slug (e.g. `food`), attach to that node only when it has no children; otherwise attach to `uncategorized`.

**Rationale:** Parent nodes represent review **scopes** (subtree), not storage buckets—unless they are leaf roots.

### 4. Topic classification in prompt

**Decision:** Prompt includes full seed tree as slug list with parent → children. LLM returns `topic_slug` per expression, choosing the **most specific** applicable slug.

Pipeline:

1. Look up slug in DB
2. If slug is a parent with children → coerce to `uncategorized` (log warning)
3. If slug unknown → `uncategorized`
4. If slug valid leaf (or leaf root) → assign `topic_id`

**Rationale:** Semi-dynamic: seeds constrain LLM; user can extend tree in Phase 3.5 without code changes.

### 5. Orchestration: `expression-pipeline.ts`

**Decision:** `extractExpressionsForTranscript(transcriptId)`:

1. Load transcript + video
2. Load topic slug map from DB (cached per run)
3. Call `extractExpressions(cleaned_text, topicTree)`
4. Resolve slugs → `topic_id`
5. Delete existing transcript-sourced expressions for video
6. Bulk insert

### 6. Subtree queries (Phase 4 prep)

**Decision:** Add `listTopicSubtreeIds(topicId)` and `listExpressionsByTopicSubtree(topicId)` using recursive CTE or precomputed path (v1: recursive query in SQL function or app layer).

**Rationale:** "Review food" must include `drinks`, `cooking`, etc.

### 7. Extraction trigger, idempotency, service role

Unchanged from prior design:

- Explicit API + CLI trigger (not auto on import)
- Delete-then-insert for `source_type = transcript`
- `getSupabaseAdmin()` for server writes
- `weight = 1.0` default
- 50k char limit on extraction input
- Max 20 expressions per transcript (prompt rule)

### 8. OpenAI response shape

```json
{
  "phrase": "string",
  "definition": "string",
  "example": "string",
  "topic_slug": "drinks"
}
```

Maps `definition` → `meaning`; `topic_slug` → `topic_id`.

## Future: Extraction depth (deferred post–Phase 3.5)

Phase 3 ships a fixed cap of **20 expressions per chunk** (see `prompts/extract-expressions.md`). Early user review confirmed this is a reasonable default after manual curation (delete ~3 trivial items per batch).

**Do not implement until Phase 3.5 curation (dismissal, topic dock) is live and the user has reviewed ≥5 transcripts.**

### Option A — Product toggle

- Import or extract UI: **Standard extract** (20/chunk, default) vs **Deep extract** (30–40/chunk)
- Deep mode shows explicit cost/条数 expectation

### Option B — Elastic per-chunk cap

- Formula (example): `min(30, max(10, chunkChars / 500))`
- Short clips yield fewer items; full 12k chunks yield more than 20

### Revisit triggers

- Phase 3.5 dismissal + topic management shipped
- User repeatedly hits 20-cap on single-chunk transcripts and still feels important phrases are missing after curation
- Cost/latency trade-off validated across multiple video lengths

## Risks / Trade-offs

- **[Risk] LLM picks parent instead of child** → Mitigation: prompt emphasizes most specific; pipeline coerces parent-with-children to `uncategorized`.
- **[Risk] Seed tree too small** → Mitigation: Phase 3.5 user can add topics; `uncategorized` catch-all.
- **[Risk] Re-extract overwrites user topic edits** → Mitigation: document behavior; Phase 3.5 may add "lock user-assigned topic" flag (open question).
- **[Risk] Subtree query performance** → Mitigation: index `topics.parent_id`; small tree in v1.

## Migration Plan

1. Migration creates `topics`, seeds data, creates `expressions` with `topic_id` FK.
2. Indexes: `topics.parent_id`, `topics.slug` (unique), `expressions.video_id`, `expressions.topic_id`.
3. RLS + service_role grants (mirror Phase 2).
4. Verify: import → extract → expressions appear under correct leaf topics in Studio.

## Open Questions

- Re-extract after Phase 3.5 user edits: preserve manual `topic_id`? **Defer to Phase 3.5** — add `topic_locked` or skip re-extract overwrite for edited rows.
- Import page "Extract" button? **Default:** yes, minimal action on success.

