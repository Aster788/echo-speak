# review-ratings

## Purpose

Persist Active Recall self-evaluations for Phase 5 SRS scheduling (Phase 4).

## Requirements

### Requirement: Review history table

The system SHALL persist review events in a `review_history` table with columns: `id` (uuid PK), `expression_id` (uuid FK → expressions.id), `rating` (text), `reviewed_at` (timestamptz), `mode` (text: `video` or `topic`), and `scope_id` (uuid, the video_id or topic_id active during the session).

#### Scenario: Insert review event

- **WHEN** user rates an expression `mastered` in Video mode for video `V`
- **THEN** the system inserts a row with `rating = mastered`, `mode = video`, and `scope_id = V`

#### Scenario: Invalid expression

- **WHEN** client submits a rating for a non-existent `expression_id`
- **THEN** the system rejects the request with a clear error

### Requirement: Allowed rating values

The system SHALL accept only `mastered`, `again`, and `unsure` as rating values.

#### Scenario: Valid ratings

- **WHEN** client submits rating `again`
- **THEN** the system persists `again`

#### Scenario: Invalid rating rejected

- **WHEN** client submits rating `forgotten` or a numeric score
- **THEN** the system rejects the request with validation error

### Requirement: Submit rating server action

The system SHALL provide a server-side entry point (Server Action or authenticated API) to record a rating without direct client database writes.

#### Scenario: Successful submit

- **WHEN** authenticated review session calls submit with valid `expression_id`, `rating`, `mode`, and `scope_id`
- **THEN** the system inserts into `review_history` and returns success

### Requirement: No SRS scheduling in Phase 4

The system SHALL NOT compute or persist `next_review_at` or enqueue `review_queue` rows when a rating is submitted in Phase 4.

#### Scenario: Rating without schedule side effect

- **WHEN** user submits `mastered` for an expression
- **THEN** only `review_history` is written; no due date is updated

### Requirement: Review history query for debugging

The system SHALL provide a data-access function to list review history for an `expression_id` ordered by `reviewed_at` descending.

#### Scenario: List history for expression

- **WHEN** caller requests history for an expression with 3 prior ratings
- **THEN** the system returns 3 rows newest first

### Requirement: Row Level Security

The system SHALL enable RLS on `review_history` with policies allowing authenticated users to read and insert their review rows, and grant service_role access for server-side writes.

#### Scenario: RLS enabled

- **WHEN** the migration is applied
- **THEN** RLS is enabled on `review_history` with authenticated insert/select policies
