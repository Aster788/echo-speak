## MODIFIED Requirements

### Requirement: Expressions table schema

The system SHALL persist expressions in an `expressions` table with columns: `id` (uuid PK), `video_id` (uuid FK → videos.id), `phrase` (text), `meaning` (text), `example_en` (text), `example_zh` (text, nullable), `examples` (jsonb, nullable, array of `{en, zh}`), `topic_id` (uuid FK → topics.id), `source_type` (text: `transcript` or `feishu`), `weight` (numeric), `topic_locked` (boolean, default false), and `created_at` (timestamptz).

#### Scenario: Insert expression row

- **WHEN** a valid expression is inserted with `video_id`, `phrase`, `meaning`, `example_en`, and `topic_id`
- **THEN** the system stores the record with `topic_locked` defaulting to false, `example_zh` nullable, and `examples` nullable

#### Scenario: Examples array populated

- **WHEN** a merged expression with two examples is inserted
- **THEN** `examples = [{en, zh}, {en, zh}]` and `example_en`/`example_zh` mirror `examples[0]`

### Requirement: Expression dismissals table

The system SHALL persist user-dismissed phrases in an `expression_dismissals` table with columns: `id` (uuid PK), `video_id` (uuid FK → videos.id), `phrase_key` (text, normalized lowercase collapsed whitespace), `phrase` (text, nullable), `reason` (text, nullable, constrained to `DISMISS_REASONS`), `topic_id` (uuid, nullable, FK → topics(id) on delete set null), `user_id` (uuid, nullable, FK → auth.users(id) on delete cascade), and `dismissed_at` (timestamptz). Unique on `(video_id, phrase_key)`.

#### Scenario: Record dismissal with user and reason

- **WHEN** an authenticated user dismisses `Feel Stuck` with reason `already_know` for a video
- **THEN** the row has `phrase_key = feel stuck`, `user_id` set, `reason = already_know`

#### Scenario: Unique dismissal per video and phrase

- **WHEN** the same normalized phrase is dismissed twice for the same video by the same user
- **THEN** the system upserts on `(video_id, phrase_key)` without error

## ADDED Requirements

### Requirement: Canonical phrase key column or derivation

The system SHALL expose a canonical phrase key derivation function (`canonicalKey`) used by extract, merge, and query paths. The function SHALL be deterministic and rule-based (no LLM call).

#### Scenario: Deterministic output

- **WHEN** `canonicalKey("Let Go Of Something")` is called twice
- **THEN** both calls return `let go of`

### Requirement: List queries return examples array

The system SHALL include `examples` (and the legacy `example_en`/`example_zh`) in expression list and get responses used by review and collections views.

#### Scenario: Collections list fields

- **WHEN** caller loads expressions for any view
- **THEN** each row includes `examples` when present, plus `example_en` and `example_zh` for backward compat

### Requirement: Merge backfill preserves example_zh

The merge backfill SHALL NOT null out `example_zh` on any resulting row; if any source row has a Chinese example, the merged row's `examples[0].zh` and `example_zh` SHALL be non-null.

#### Scenario: Merge preserves zh

- **WHEN** merging two rows where row A has `example_zh = "我放下了它。"` and row B has `example_zh = null`
- **THEN** the merged row's `examples[0]` uses row A's zh and `example_zh` is non-null
