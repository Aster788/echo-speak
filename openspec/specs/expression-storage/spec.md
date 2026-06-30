# expression-storage

## Purpose

Persist expressions and dismissals in Supabase; support curation and re-extraction rules (Phase 3–3.5).

## Requirements

### Requirement: Expressions table schema

The system SHALL persist expressions in an `expressions` table with columns: `id` (uuid PK), `video_id` (uuid FK → videos.id), `phrase` (text), `meaning` (text), `example_en` (text), `example_zh` (text, nullable), `examples` (jsonb, nullable, array of `{en, zh}`), `topic_id` (uuid FK → topics.id), `source_type` (text: `transcript` or `feishu`), `weight` (numeric), `topic_locked` (boolean, default false), and `created_at` (timestamptz).

#### Scenario: Insert expression row

- **WHEN** a valid expression is inserted with `video_id`, `phrase`, `meaning`, `example_en`, and `topic_id`
- **THEN** the system stores the record with `topic_locked` defaulting to false, `example_zh` nullable, and `examples` nullable

#### Scenario: Examples array populated

- **WHEN** a merged expression with two examples is inserted
- **THEN** `examples = [{en, zh}, {en, zh}]` and `example_en`/`example_zh` mirror `examples[0]`

#### Scenario: Expression requires valid video and topic

- **WHEN** an expression is inserted with a `video_id` or `topic_id` that does not exist
- **THEN** the system rejects the insert (FK constraint violation)

### Requirement: Bilingual example columns migration

The system SHALL migrate existing data by renaming column `example` to `example_en` without data loss, and add nullable column `example_zh`.

#### Scenario: Migration preserves English examples

- **WHEN** Phase 4 migration runs on a database with `example` populated
- **THEN** each row's former `example` value is available as `example_en`

#### Scenario: example_zh initially nullable

- **WHEN** migration completes before backfill
- **THEN** `example_zh` may be null for existing rows until alignment or translation runs

### Requirement: List queries return bilingual fields

The system SHALL include `examples` (and the legacy `example_en`/`example_zh`) in expression list and get responses used by review and collections views.

#### Scenario: Review deck query fields

- **WHEN** caller loads expressions for review by video or topic subtree
- **THEN** each row includes `meaning`, `example_en`, `example_zh`, and `examples` when present

#### Scenario: Collections list fields

- **WHEN** caller loads expressions for any view
- **THEN** each row includes `examples` when present, plus `example_en` and `example_zh` for backward compat

### Requirement: Transcript source type default

The system SHALL set `source_type` to `transcript` for all expressions created by the Phase 3 extraction pipeline.

#### Scenario: Pipeline persistence

- **WHEN** the extraction pipeline saves expressions for a video
- **THEN** each row has `source_type` equal to `transcript`

### Requirement: Default weight

The system SHALL set `weight` to `1.0` for expressions created by the extraction pipeline in v1.

#### Scenario: New extraction batch

- **WHEN** expressions are inserted via the extraction pipeline
- **THEN** each row has `weight` equal to `1.0`

### Requirement: List expressions by video

The system SHALL provide a data-access function to list expressions filtered by `video_id`.

#### Scenario: Query by video

- **WHEN** caller requests expressions for a valid `video_id`
- **THEN** the system returns all matching expression rows ordered by `created_at`

### Requirement: List expressions by topic subtree

The system SHALL provide a data-access function to list expressions for a topic and all its descendant topics.

#### Scenario: Query parent topic subtree

- **WHEN** caller requests expressions for topic `food` which has child topics `drinks` and `cooking`
- **THEN** the system returns expressions whose `topic_id` is `food`, `drinks`, `cooking`, or any other descendant of `food`

### Requirement: Re-extraction replaces transcript-sourced rows

The system SHALL delete existing expressions for the same `video_id` with `source_type = transcript` and `topic_locked = false` before inserting a new extraction batch.

#### Scenario: Re-run extraction

- **WHEN** extraction is triggered again for a video that already has transcript-sourced expressions
- **THEN** the system replaces only unlocked expressions without duplicating phrases

#### Scenario: Locked expressions preserved

- **WHEN** re-extraction runs and some expressions have `topic_locked = true`
- **THEN** those expressions are not deleted or modified

### Requirement: Expression dismissals table

The system SHALL persist user-dismissed phrases in an `expression_dismissals` table with columns: `id` (uuid PK), `video_id` (uuid FK → videos.id), `phrase_key` (text, normalized lowercase collapsed whitespace), `phrase` (text, nullable), `reason` (text, nullable, constrained to `DISMISS_REASONS`), `topic_id` (uuid, nullable, FK → topics(id) on delete set null), `user_id` (uuid, nullable, FK → auth.users(id) on delete cascade), and `dismissed_at` (timestamptz). Unique on `(video_id, phrase_key)`.

#### Scenario: Record dismissal with user and reason

- **WHEN** an authenticated user dismisses `Feel Stuck` with reason `already_know` for a video
- **THEN** the row has `phrase_key = feel stuck`, `user_id` set, `reason = already_know`

#### Scenario: Unique dismissal per video and phrase

- **WHEN** the same normalized phrase is dismissed twice for the same video by the same user
- **THEN** the system upserts on `(video_id, phrase_key)` without error

### Requirement: Dismiss expression removes row and records phrase

The system SHALL delete an expression row and record its normalized phrase in `expression_dismissals` for the parent video.

#### Scenario: Dismiss via UI

- **WHEN** user dismisses an expression by delete button, swipe, or drag-to-trash
- **THEN** the expression row is removed and a dismissal record exists for that video and phrase

### Requirement: Re-extract skips dismissed phrases

The system SHALL NOT insert expressions whose normalized phrase matches an existing dismissal for the same `video_id`.

#### Scenario: Re-extract after dismiss

- **WHEN** re-extraction runs for a video where phrase "feel stuck" was dismissed
- **THEN** the new batch does not include "feel stuck" even if the LLM returns it

#### Scenario: Dismissed phrase with different casing

- **WHEN** dismissal recorded for `feel stuck` and LLM returns `Feel Stuck`
- **THEN** the system treats them as the same phrase and skips insertion

### Requirement: Row Level Security

The system SHALL enable RLS on `expressions` and `expression_dismissals` with policies allowing authenticated users to read and write rows, and grant service_role access for server-side pipeline writes.

#### Scenario: RLS enabled

- **WHEN** the migration is applied
- **THEN** RLS is enabled on both tables and policies exist for authenticated and service_role access

### Requirement: Local schema migration

The system SHALL provide Supabase migrations that create the `expressions` and `expression_dismissals` tables and apply successfully via `supabase db reset` in local development.

#### Scenario: Migration runs cleanly

- **WHEN** a developer runs `supabase db reset` with Supabase CLI
- **THEN** both tables exist with expected columns, constraints, and indexes on `video_id` and `topic_id`

### Requirement: Canonical phrase key column or derivation

The system SHALL expose a canonical phrase key derivation function (`canonicalKey`) used by extract, merge, and query paths. The function SHALL be deterministic and rule-based (no LLM call).

#### Scenario: Deterministic output

- **WHEN** `canonicalKey("Let Go Of Something")` is called twice
- **THEN** both calls return `let go of`

### Requirement: Merge backfill preserves example_zh

The merge backfill SHALL NOT null out `example_zh` on any resulting row; if any source row has a Chinese example, the merged row's `examples[0].zh` and `example_zh` SHALL be non-null.

#### Scenario: Merge preserves zh

- **WHEN** merging two rows where row A has `example_zh = "我放下了它。"` and row B has `example_zh = null`
- **THEN** the merged row's `examples[0]` uses row A's zh and `example_zh` is non-null
