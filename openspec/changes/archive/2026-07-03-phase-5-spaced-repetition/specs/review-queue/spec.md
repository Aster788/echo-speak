## ADDED Requirements

### Requirement: Review queue scheduling columns

The system SHALL extend `review_queue` with: `memory_state` (`learning` | `reviewing`), `interval_days`, `last_reviewed_at`, `first_reviewed_at`, plus unique constraint on `expression_id`.

#### Scenario: Schema migration

- **WHEN** migration runs
- **THEN** columns exist with sensible defaults for existing rows (`first_reviewed_at` null until first review)

### Requirement: One row per expression

The system SHALL enforce at most one `review_queue` row per `expression_id`.

#### Scenario: Upsert on schedule

- **WHEN** `scheduleAfterRating` runs twice for the same expression
- **THEN** a single row is updated

### Requirement: Upsert review queue entry

The system SHALL provide `upsertReviewQueue` updating `due_at`, `memory_state`, `interval_days`, `last_reviewed_at`, and `first_reviewed_at` (set once on first review).

#### Scenario: First review sets first_reviewed_at

- **WHEN** scheduling runs for an expression with null `first_reviewed_at`
- **THEN** `first_reviewed_at` is set to review timestamp

### Requirement: List due expressions

The system SHALL provide `listDueExpressions(now)` returning non-dismissed expressions with `due_at <= now()`, ordered by `due_at` ascending.

#### Scenario: Due ordering

- **WHEN** three expressions are due at 08:00, 09:00, 10:00
- **THEN** results are ordered 08:00, 09:00, 10:00

### Requirement: List New expressions for selection

The system SHALL provide `listNewExpressions()` returning non-dismissed expressions where `first_reviewed_at IS NULL`.

#### Scenario: New query

- **WHEN** expression E has never been reviewed
- **THEN** E appears in New query results

### Requirement: Count eligible for Today's Review display

The system SHALL provide counts for UI: due count, new count, and today's slice size given daily budget.

#### Scenario: Display 40 of 120

- **WHEN** 120 expressions are due and budget is 40
- **THEN** today's slice is 40 and UI can show `40 / 120`

## REMOVED Requirements

### Requirement: No scheduling logic in this capability

**Reason**: Phase 5 implements full scheduling.

**Migration**: See `srs-scheduling` and requirements above.
