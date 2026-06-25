# topic-storage (delta)

## Purpose

Relax seed-topic (`is_system`) guards for Collections curation; add topic reparent API.

## MODIFIED Requirements

### Requirement: Delete empty user topic

The system SHALL allow deleting topics that have no expressions and no child topics, **including seed taxonomy topics** (`is_system = true`), when the user deletes from Collections.

#### Scenario: Delete empty seed topic

- **WHEN** user deletes an empty leaf topic that was seeded (e.g. `travel` with 0 expressions)
- **THEN** the system removes the topic row

#### Scenario: Delete non-empty topic blocked

- **WHEN** user attempts to delete a topic with expressions or children
- **THEN** the system rejects the request with a clear error

## ADDED Requirements

### Requirement: Reparent topic subtree

The system SHALL provide a server function to move a topic under a new parent by updating `parent_id`, moving the entire subtree, and rejecting moves that would create a cycle or set a topic as its own descendant.

#### Scenario: Reparent topic

- **WHEN** user moves topic `cooking` under `food` via Collections Move sheet
- **THEN** `cooking.parent_id` becomes `food.id` and all descendants remain attached under `cooking`

#### Scenario: Reparent seed topic

- **WHEN** user moves a seed topic such as `social` under another root
- **THEN** the reparent succeeds (no `is_system` block)

#### Scenario: Cycle prevented

- **WHEN** user attempts to move a parent topic under its own descendant
- **THEN** the system rejects the move with a clear error
