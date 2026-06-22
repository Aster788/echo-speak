# topic-tree-management

## Purpose

Mobile-first `/topics` UI for curating the topic tree and expressions (Phase 3.5).

## Requirements

### Requirement: Topic tree browser

The system SHALL provide a `/topics` page displaying the hierarchical topic tree with expression counts per topic.

#### Scenario: View topic tree

- **WHEN** user opens `/topics`
- **THEN** the system shows root topics with expandable children and expression counts

#### Scenario: View expressions in topic

- **WHEN** user selects a topic node
- **THEN** the system lists expressions directly assigned to that topic (not subtree aggregate on this view)

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

The system SHALL allow moving an expression to a different topic by drag-and-drop or a "Move to…" picker.

#### Scenario: Move expression via drag

- **WHEN** user drags an expression onto topic `drinks`
- **THEN** the system updates `expressions.topic_id` to `drinks` and sets `topic_locked = true`

#### Scenario: Move expression via picker

- **WHEN** user selects "Move to…" and chooses topic `cooking`
- **THEN** the system updates `topic_id` and sets `topic_locked = true`

### Requirement: Dismiss expression

The system SHALL allow users to permanently remove an unwanted expression from their library via delete button, swipe-to-delete, or drag-to-trash.

#### Scenario: Delete button

- **WHEN** user taps delete on an expression row
- **THEN** the system dismisses the expression (deletes row + records dismissal)

#### Scenario: Swipe to delete on mobile

- **WHEN** user swipes an expression row to reveal delete and confirms
- **THEN** the system dismisses the expression

#### Scenario: Drag to trash on dock

- **WHEN** user long-presses an expression, drags it to the trash icon on the topic dock, and holds for ~0.5s
- **THEN** the system dismisses the expression after a 150–200ms fade-out

### Requirement: Topic dock for move and dismiss

The system SHALL display a fixed bottom dock on `/topics` with topic targets and a trash icon on the right for drag-and-drop curation.

#### Scenario: Dock visible

- **WHEN** user views expressions on `/topics`
- **THEN** a bottom dock shows topic icons and a trash icon anchored on the right

#### Scenario: Drag expression to topic on dock

- **WHEN** user drags an expression onto a topic icon in the dock
- **THEN** the system moves the expression to that topic and sets `topic_locked = true`

#### Scenario: Drag expression to trash on dock

- **WHEN** user drags an expression onto the trash icon and holds briefly
- **THEN** the system dismisses the expression with a fade-out animation

#### Scenario: Celebration easter egg optional

- **WHEN** user dismisses via trash drag
- **THEN** the system MAY show a brief confetti or fireworks effect as an optional delight (not required on every dismiss)

### Requirement: Merge topics

The system SHALL allow merging a source topic into a target topic by reassigning all expressions and removing the source topic.

#### Scenario: Merge leaf into leaf

- **WHEN** user merges topic `cookings` into `cooking` and source has 5 expressions
- **THEN** all 5 expressions receive `topic_id` of `cooking` with `topic_locked = true`, and `cookings` is deleted

#### Scenario: Merge topic with children blocked

- **WHEN** user attempts to merge a topic that has child topics
- **THEN** the system rejects the merge with a clear error

#### Scenario: Merge confirmation

- **WHEN** user initiates a merge
- **THEN** the system shows a confirmation with expression count before executing

### Requirement: Topic locked survives re-extraction

The system SHALL NOT change `topic_id` on expressions where `topic_locked = true` when re-extraction runs.

#### Scenario: Re-extract with locked expression

- **WHEN** re-extraction runs for a video that has locked expressions
- **THEN** locked expressions remain unchanged; only unlocked transcript-sourced expressions are replaced

### Requirement: Mobile-first layout

The topic management UI SHALL use a centered mobile container with `max-width: 430px` and design-system text colors (`#222` / `#fff`).

#### Scenario: Mobile layout

- **WHEN** user views `/topics` on phone or desktop
- **THEN** the layout is centered with max width 430px
