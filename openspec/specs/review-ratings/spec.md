# review-ratings

## Purpose

Persist Active Recall self-evaluations for Phase 5 SRS scheduling (Phase 4).

## Requirements

### Requirement: Review history table

The system SHALL persist review events in a `review_history` table with columns: `id` (uuid PK), `expression_id` (uuid FK → expressions.id), `rating` (text), `reviewed_at` (timestamptz), `mode` (text: `todays_review`, `video`, or `topic`), and `scope_id` (uuid).

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

The system SHALL record ratings via server action, insert `review_history` (with `mode` and `scope_id` for analytics), and invoke `scheduleAfterRating` to update global `review_queue`. Scheduling SHALL ignore `mode` and `scope_id`.

#### Scenario: Successful submit with schedule

- **WHEN** user submits a valid rating in any review mode
- **THEN** `review_history` is inserted and global `review_queue` is updated

#### Scenario: Analytics context preserved

- **WHEN** user rates in Video Practice with `mode=video` and `scope_id=V`
- **THEN** `review_history` stores `video` and V but scheduler uses only `expression_id`

#### Scenario: Schedule failure handling

- **WHEN** history insert succeeds but queue update fails
- **THEN** system returns error without leaving inconsistent state

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
