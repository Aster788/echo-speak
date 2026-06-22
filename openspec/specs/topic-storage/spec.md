# topic-storage

## Purpose

Hierarchical topic taxonomy and server-side topic CRUD/merge/dismiss operations (Phase 3–3.5).

## Requirements

### Requirement: Topics table schema

The system SHALL persist topics in a `topics` table with columns: `id` (uuid PK), `name` (text), `slug` (text, unique), `parent_id` (uuid FK → topics, nullable), `is_system` (boolean), `merged_into_id` (uuid FK → topics, nullable), and `created_at` (timestamptz).

#### Scenario: Root topic

- **WHEN** a topic is inserted with `parent_id` null
- **THEN** the system stores it as a root-level topic

#### Scenario: Child topic

- **WHEN** a topic is inserted with `parent_id` referencing an existing topic
- **THEN** the system stores it as a child of that parent

#### Scenario: Unique slug

- **WHEN** a topic is inserted with a `slug` that already exists
- **THEN** the system rejects the insert

### Requirement: Seed hierarchical taxonomy

The system SHALL seed system topics (`is_system = true`) including at minimum:

- Root `food` with children `drinks`, `cooking`, `dining-out`, `grocery`
- Root `workout` with children `gym`, `recovery`
- Root `travel` with children `packing`, `airport`, `hotel`
- Root topics `shopping`, `productivity`, `daily`, `work`, `social`, `uncategorized`

#### Scenario: Seed applied on migration

- **WHEN** the Phase 3 migration runs
- **THEN** the seeded parent-child relationships exist and are queryable

#### Scenario: User extends seed tree

- **WHEN** user creates a child topic under `food` after Phase 3.5 ships
- **THEN** the new topic has `is_system = false` and appears in the tree under `food`

### Requirement: Resolve topic by slug

The system SHALL provide a function to look up a topic by `slug` and return its `id`, `parent_id`, and whether it has children.

#### Scenario: Resolve leaf slug

- **WHEN** caller resolves slug `drinks`
- **THEN** the system returns the `drinks` topic and indicates it has no children

#### Scenario: Resolve parent slug

- **WHEN** caller resolves slug `food`
- **THEN** the system returns the `food` topic and indicates it has children

### Requirement: List topic subtree

The system SHALL provide a function to return all topic IDs in a subtree rooted at a given topic ID (including the root).

#### Scenario: Subtree of food

- **WHEN** caller requests subtree IDs for `food`
- **THEN** the system returns IDs for `food` and all descendant topics such as `drinks` and `cooking`

### Requirement: Create user topic

The system SHALL provide a server-side function to create a user topic with `is_system = false` under a specified parent.

#### Scenario: Create child

- **WHEN** caller creates topic "Meal Prep" under `food`
- **THEN** the system inserts the topic with a unique slug and correct `parent_id`

### Requirement: Merge topics

The system SHALL provide a server-side function to merge a leaf source topic into a target topic.

#### Scenario: Successful merge

- **WHEN** caller merges empty-child source topic into target
- **THEN** all expressions are reassigned to target, source topic is deleted, and affected expressions have `topic_locked = true`

#### Scenario: Merge blocked for parent source

- **WHEN** source topic has children
- **THEN** the system rejects the merge

### Requirement: Delete empty user topic

The system SHALL allow deleting user-created topics with no expressions and no children.

#### Scenario: Delete allowed

- **WHEN** user topic has zero expressions and zero children
- **THEN** the system deletes the topic

#### Scenario: Delete blocked

- **WHEN** topic has expressions or children
- **THEN** the system rejects deletion

### Requirement: Dismiss expression

The system SHALL provide a server-side function to dismiss an expression: delete the row and record normalized phrase in `expression_dismissals`.

#### Scenario: Dismiss expression

- **WHEN** caller dismisses expression id `E` with phrase "on paper" for video `V`
- **THEN** the expression row is deleted and dismissal `on paper` exists for video `V`

#### Scenario: List dismissals for re-extract

- **WHEN** caller requests dismissed phrase keys for video `V`
- **THEN** the system returns all normalized phrase keys for that video

### Requirement: Row Level Security on topics

The system SHALL enable RLS on `topics` with policies allowing authenticated users to read topics and service_role to manage seed data and pipeline reads.

#### Scenario: RLS enabled

- **WHEN** the migration is applied
- **THEN** RLS is enabled on `topics` with appropriate policies
