# srs-scheduling

## Purpose

Global per-expression SRS rules: memory states, rating intervals, weighted New selection, and scheduler API (Phase 5).

## Requirements

### Requirement: Memory state model

The system SHALL track per-expression memory states `learning` and `reviewing` on `review_queue`, and treat an expression as **New** when `first_reviewed_at IS NULL`. New is a query state, not a persisted queue row type.

#### Scenario: New definition

- **WHEN** an expression has `first_reviewed_at IS NULL`
- **THEN** the system classifies it as New regardless of `review_queue` row presence

#### Scenario: First review leaves New

- **WHEN** user completes the first review of expression E
- **THEN** the system sets `first_reviewed_at` and E is no longer New

#### Scenario: Reviewing promotion

- **WHEN** the two most recent `review_history` rows for expression E are both `mastered`
- **THEN** `memory_state` becomes `reviewing`

#### Scenario: Mastered streak reset

- **WHEN** user rates `again` or `unsure` after a `mastered`
- **THEN** consecutive `mastered` streak resets and `memory_state` is `learning`

### Requirement: Rating schedule rules

The system SHALL apply the following when `scheduleAfterRating` runs after session persistence:

| Rating | Next interval | memory_state after |
|--------|---------------|-------------------|
| `unsure` | 1 day | `learning` |
| `again` | 2 days | `learning` |
| `mastered` | SRS growth, max 365 days | `learning` or `reviewing` per consecutive rule |

#### Scenario: Unsure schedules one day

- **WHEN** user rates `unsure` at session end for expression E
- **THEN** `due_at` is approximately 1 day from review time and `memory_state` is `learning`

#### Scenario: Again schedules two days

- **WHEN** user rates `again`
- **THEN** `due_at` is approximately 2 days from review time and `memory_state` is `learning`

#### Scenario: Mastered grows interval capped at 365 days

- **WHEN** user rates `mastered` on a reviewing expression with prior interval 300 days
- **THEN** next interval does not exceed 365 days

#### Scenario: Expressions never graduate

- **WHEN** an expression reaches 365-day interval and user rates `mastered` again
- **THEN** interval remains 365 days and the expression stays in the review cycle

### Requirement: Global expression-level scheduling

The system SHALL maintain exactly one SRS record per `expression_id`. Scheduling SHALL NOT branch by video or topic.

#### Scenario: Video practice updates global state

- **WHEN** user rates `mastered` in Video Practice for expression E
- **THEN** the same `review_queue` row updates as would Today's Review

### Requirement: Weighted random New selection

The system SHALL select New expressions (`first_reviewed_at IS NULL`) using weighted random when Today's Review budget remains after Due fill.

Goals:

- Slightly prioritize recently imported expressions.
- Avoid consecutive cards from the same video or topic where possible.
- Retain minimum weight for older unseen expressions (anti-starvation).

#### Scenario: Recent import bias

- **WHEN** two unseen expressions differ only by import recency
- **THEN** the more recently imported expression has higher selection weight

#### Scenario: Anti-starvation floor

- **WHEN** an expression has been New for a long time
- **THEN** it still has non-zero weight and can appear in Today's Review

### Requirement: No persistent New queue

The system SHALL NOT maintain a separate New queue table or enqueue job. New availability is determined solely by `first_reviewed_at IS NULL` at query time.

#### Scenario: Continuous import

- **WHEN** new expressions are extracted from a newly imported video
- **THEN** they are immediately eligible as New without migration or queue insert

### Requirement: Scheduler extensibility

The system SHALL expose `scheduleAfterRating` such that future eligibility rules (e.g. `reviews_since_last`) can be added without changing review UI call sites. Phase 5 eligibility uses `due_at` only.

#### Scenario: v1 due eligibility

- **WHEN** building Today's Review Due slice
- **THEN** only expressions with `due_at <= now()` are Due candidates

### Requirement: Unit tests

The system SHALL include unit tests for rating rules, 365-day cap, consecutive `mastered` promotion, and weighted New selection properties.

#### Scenario: CI coverage

- **WHEN** tests run
- **THEN** each rating class and promotion rule has at least one assertion
