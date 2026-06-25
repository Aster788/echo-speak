## MODIFIED Requirements

### Requirement: Expressions table schema

The system SHALL persist expressions in an `expressions` table with columns: `id` (uuid PK), `video_id` (uuid FK → videos.id), `phrase` (text), `meaning` (text), `example_en` (text), `example_zh` (text, nullable), `topic_id` (uuid FK → topics.id), `source_type` (text: `transcript` or `feishu`), `weight` (numeric), `topic_locked` (boolean, default false), and `created_at` (timestamptz).

#### Scenario: Insert expression row

- **WHEN** a valid expression is inserted with `video_id`, `phrase`, `meaning`, `example_en`, and `topic_id`
- **THEN** the system stores the record with `topic_locked` defaulting to false and `example_zh` nullable until filled

#### Scenario: Expression requires valid video and topic

- **WHEN** an expression is inserted with a `video_id` or `topic_id` that does not exist
- **THEN** the system rejects the insert (FK constraint violation)

## ADDED Requirements

### Requirement: Bilingual example columns migration

The system SHALL migrate existing data by renaming column `example` to `example_en` without data loss, and add nullable column `example_zh`.

#### Scenario: Migration preserves English examples

- **WHEN** Phase 4 migration runs on a database with `example` populated
- **THEN** each row's former `example` value is available as `example_en`

#### Scenario: example_zh initially nullable

- **WHEN** migration completes before backfill
- **THEN** `example_zh` may be null for existing rows until alignment or translation runs

### Requirement: List queries return bilingual fields

The system SHALL include `example_en` and `example_zh` in expression list and get responses used by review and library views.

#### Scenario: Review deck query fields

- **WHEN** caller loads expressions for review by video or topic subtree
- **THEN** each row includes `meaning`, `example_en`, and `example_zh` when present
