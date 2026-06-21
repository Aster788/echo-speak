## ADDED Requirements

### Requirement: Expressions table schema

The system SHALL persist expressions in an `expressions` table with columns: `id` (uuid PK), `video_id` (uuid FK → videos.id), `phrase` (text), `meaning` (text), `example` (text), `topic_id` (uuid FK → topics.id), `source_type` (text: `transcript` or `feishu`), `weight` (numeric), and `created_at` (timestamptz).

#### Scenario: Insert expression row

- **WHEN** a valid expression is inserted with `video_id`, `phrase`, `meaning`, `example`, and `topic_id`
- **THEN** the system stores the record and returns a uuid `id`

#### Scenario: Expression requires valid video and topic

- **WHEN** an expression is inserted with a `video_id` or `topic_id` that does not exist
- **THEN** the system rejects the insert (FK constraint violation)

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

### Requirement: Row Level Security

The system SHALL enable RLS on `expressions` with policies allowing authenticated users to read and write rows, and grant service_role access for server-side pipeline writes.

#### Scenario: RLS enabled

- **WHEN** the migration is applied
- **THEN** RLS is enabled on `expressions` and policies exist for authenticated and service_role access

### Requirement: Local schema migration

The system SHALL provide a Supabase migration that creates the `expressions` table and applies successfully via `supabase db reset` in local development.

#### Scenario: Migration runs cleanly

- **WHEN** a developer runs `supabase db reset` with Supabase CLI
- **THEN** the `expressions` table exists with expected columns, constraints, and indexes on `video_id` and `topic_id`
