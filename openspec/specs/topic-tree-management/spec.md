# topic-tree-management

## Purpose

Mobile-first **Collections** UI for curating the topic tree and expressions (Phase 3.5; route `/collections` from Pre-Phase 5).

## Requirements

### Requirement: Topic tree browser

The system SHALL provide a **Collections** page at `/collections` (Topic tab) displaying the hierarchical topic tree with expression counts. `/topics` redirects to `/collections`.

#### Scenario: View topic tree

- **WHEN** user opens Collections Topic tab
- **THEN** the system shows root topics with expandable children and expression counts sorted a→z among siblings

#### Scenario: View expressions in topic

- **WHEN** user selects a topic node
- **THEN** the system navigates to Topic level two listing expressions for that topic only (not subtree aggregate on this view)

### Requirement: Create user topic

The system SHALL allow users to create a child topic under any existing topic with a unique slug derived from the name.

#### Scenario: Create child topic

- **WHEN** user creates topic "Meal Prep" under `food`
- **THEN** the system inserts a topic with `is_system = false`, `parent_id` pointing to `food`, and a unique slug

#### Scenario: Duplicate slug

- **WHEN** user creates a topic whose slug conflicts with an existing slug
- **THEN** the system rejects the request with a clear error

### Requirement: Rename user topic

The system SHALL allow renaming topics where `is_system = false`.

#### Scenario: Rename user topic

- **WHEN** user renames a user-created topic
- **THEN** the system updates `name` and `slug` accordingly

#### Scenario: Rename system topic blocked

- **WHEN** user attempts to rename a topic with `is_system = true`
- **THEN** the system rejects the request

### Requirement: Delete empty user topic

The system SHALL allow deleting user-created topics that have no expressions and no child topics.

#### Scenario: Delete empty topic

- **WHEN** user deletes an empty user-created leaf topic
- **THEN** the system removes the topic row

#### Scenario: Delete non-empty topic blocked

- **WHEN** user attempts to delete a topic with expressions or children
- **THEN** the system rejects the request with a clear error

### Requirement: Drag or pick to reassign expression topic

The system SHALL allow moving an expression to a different topic via the **Move sheet** picker on Collections cards.

#### Scenario: Move expression via picker

- **WHEN** user opens Move sheet from an expression card and chooses topic `cooking`
- **THEN** the system updates `topic_id` and sets `topic_locked = true`

### Requirement: Dismiss expression

The system SHALL allow users to permanently remove an unwanted expression from their library via the **delete (bin) icon** on Collections cards.

#### Scenario: Delete button

- **WHEN** user taps delete on an expression card
- **THEN** the system dismisses the expression (deletes row + records dismissal)

### Requirement: Topic locked survives re-extraction

The system SHALL NOT change `topic_id` on expressions where `topic_locked = true` when re-extraction runs.

#### Scenario: Re-extract with locked expression

- **WHEN** re-extraction runs for a video that has locked expressions
- **THEN** locked expressions remain unchanged; only unlocked transcript-sourced expressions are replaced

### Requirement: Mobile-first layout

The topic management UI SHALL use route `/collections` with Topic tab, centered 430px container, vintage scrapbook styling.

#### Scenario: Mobile layout

- **WHEN** user views Collections Topic tab
- **THEN** the layout is centered with max width 430px
