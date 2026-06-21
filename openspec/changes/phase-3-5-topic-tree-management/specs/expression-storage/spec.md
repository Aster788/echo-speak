## MODIFIED Requirements

### Requirement: Expressions table schema

The system SHALL persist expressions in an `expressions` table with columns: `id` (uuid PK), `video_id` (uuid FK → videos.id), `phrase` (text), `meaning` (text), `example` (text), `topic_id` (uuid FK → topics.id), `source_type` (text: `transcript` or `feishu`), `weight` (numeric), `topic_locked` (boolean, default false), and `created_at` (timestamptz).

#### Scenario: Insert expression row

- **WHEN** a valid expression is inserted with `video_id`, `phrase`, `meaning`, `example`, and `topic_id`
- **THEN** the system stores the record with `topic_locked` defaulting to false

#### Scenario: Expression requires valid video and topic

- **WHEN** an expression is inserted with a `video_id` or `topic_id` that does not exist
- **THEN** the system rejects the insert (FK constraint violation)

### Requirement: Re-extraction replaces transcript-sourced rows

The system SHALL delete existing expressions for the same `video_id` with `source_type = transcript` and `topic_locked = false` before inserting a new extraction batch.

#### Scenario: Re-run extraction

- **WHEN** extraction is triggered again for a video that already has transcript-sourced expressions
- **THEN** the system replaces only unlocked expressions without duplicating phrases

#### Scenario: Locked expressions preserved

- **WHEN** re-extraction runs and some expressions have `topic_locked = true`
- **THEN** those expressions are not deleted or modified

### Requirement: Expression dismissals table

The system SHALL persist user-dismissed phrases in an `expression_dismissals` table with columns: `id` (uuid PK), `video_id` (uuid FK → videos.id), `phrase_key` (text, normalized lowercase collapsed whitespace), and `dismissed_at` (timestamptz).

#### Scenario: Record dismissal

- **WHEN** user dismisses an expression with phrase "Feel Stuck" for a video
- **THEN** the system stores `phrase_key` as `feel stuck` with the expression's `video_id`

#### Scenario: Unique dismissal per video and phrase

- **WHEN** the same normalized phrase is dismissed twice for the same video
- **THEN** the system upserts or ignores duplicate without error

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
