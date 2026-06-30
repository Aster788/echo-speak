## ADDED Requirements

### Requirement: review_queue table schema

The system SHALL create a `review_queue` table with columns: `id` (uuid PK), `expression_id` (uuid FK → expressions(id) on delete cascade), `due_at` (timestamptz not null), `source` (text not null default `transcript`), `created_at` (timestamptz not null default now()).

#### Scenario: Migration creates table

- **WHEN** the migration runs
- **THEN** `review_queue` exists with the specified columns, FK, and defaults

### Requirement: review_queue indexes

The system SHALL create indexes on `review_queue(due_at)` and `review_queue(expression_id)`.

#### Scenario: Due date index

- **WHEN** the migration runs
- **THEN** `review_queue_due_at_idx` exists on `due_at`

### Requirement: Row Level Security on review_queue

The system SHALL enable RLS on `review_queue` with policies allowing authenticated users to select and insert, and grant service_role all access.

#### Scenario: RLS enabled

- **WHEN** the migration runs
- **THEN** RLS is enabled and policies exist for authenticated select/insert and service_role full access

### Requirement: No scheduling logic in this capability

The system SHALL NOT write `due_at` or enqueue rows in this capability; scheduling is deferred to Phase 5 Spaced Repetition.

#### Scenario: Empty table after migration

- **WHEN** the migration completes
- **THEN** `review_queue` has zero rows and no automated enqueue process runs
