## ADDED Requirements

### Requirement: Topics table schema

The system SHALL persist topics in a `topics` table with columns: `id` (uuid PK), `name` (text), `slug` (text, unique), `parent_id` (uuid FK → topics, nullable), `is_system` (boolean), and `created_at` (timestamptz).

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

### Requirement: Row Level Security on topics

The system SHALL enable RLS on `topics` with policies allowing authenticated users to read topics and service_role to manage seed data and pipeline reads.

#### Scenario: RLS enabled

- **WHEN** the migration is applied
- **THEN** RLS is enabled on `topics` with appropriate policies
