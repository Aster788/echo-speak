## MODIFIED Requirements

### Requirement: Hierarchical topic classification

The system SHALL assign each extracted expression exactly one `topic_id` by resolving a `topic_slug` to the most specific applicable topic in the **runtime `topics` table** (not a hardcoded seed list). The extract prompt's `{{TOPIC_TREE}}` and `{{LEAF_SLUGS}}` SHALL be built from `listTopics(supabase)` at extract time.

#### Scenario: Leaf topic match

- **WHEN** the model returns `topic_slug` `drinks` and `drinks` exists as a leaf under `food` in the `topics` table
- **THEN** the system stores the expression with `topic_id` pointing to `drinks`

#### Scenario: User-created topic available to model

- **WHEN** the user created a topic `vlog` under `daily` in Collections, then imports a new video
- **THEN** the extract prompt's topic tree includes `vlog` and the model may assign `topic_slug = vlog`

#### Scenario: Deleted topic absent from prompt

- **WHEN** the user deleted topic `old-topic` and then imports a new video
- **THEN** the extract prompt's topic tree does not include `old-topic`

#### Scenario: Parent slug with children

- **WHEN** the model returns a parent slug that has child topics (e.g. `food` when `drinks`/`cooking` exist)
- **THEN** the system assigns `topic_id` to `uncategorized` instead of the parent

#### Scenario: Unknown slug

- **WHEN** the model returns a slug not present in the `topics` table
- **THEN** the system assigns `topic_id` to `uncategorized`

## ADDED Requirements

### Requirement: Extract pipeline dedups by canonical phrase key

The system SHALL group LLM-returned expressions by `canonicalKey(phrase)` before insert, merging items that share a canonical key into one row with a multi-entry `examples` array, and SHALL skip any whose canonical key is in the user's global or per-video dismissed phrase set.

#### Scenario: Near-dups merged in one batch

- **WHEN** the LLM returns `let go of something` and `let go of` in the same extraction batch
- **THEN** one row is inserted with display phrase `let go of` and `examples` of length 2

#### Scenario: Canonical key blocked by global dismissal

- **WHEN** the user dismissed `treat yourself` globally and the LLM returns `treat oneself` (same canonical key)
- **THEN** no row is inserted
