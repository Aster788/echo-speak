# expression-merge

## Purpose

Canonical phrase deduplication, multi-example storage, cross-video query-time merge, and manual merge actions for the expression library (pre-Phase 5).

## Requirements

### Requirement: Canonical phrase key derivation

The system SHALL derive a canonical phrase key for any expression phrase using rule-based normalization: lowercase, collapse whitespace, trim, then drop trailing pronoun/placeholder tokens (`something`, `sb`, `sth`, `oneself`, `yourself`, `themselves`, `things`, `it`, `them`) when they appear as the final token or after a preposition, and map `yourself`/`themselves` reflexive variants to `oneself`.

#### Scenario: Exact duplicate collapses

- **WHEN** two expressions have phrases `Behind the Scenes` and `behind the scenes`
- **THEN** both derive canonical key `behind the scenes`

#### Scenario: Pronoun placeholder dropped

- **WHEN** expressions have phrases `let go of something` and `let go of`
- **THEN** both derive canonical key `let go of`

#### Scenario: Reflexive normalized

- **WHEN** expressions have phrases `treat yourself` and `treat oneself`
- **THEN** both derive canonical key `treat oneself`

#### Scenario: Mid-phrase things alias

- **WHEN** expressions have phrases `try things on` and `try something on`
- **THEN** both derive canonical key `try something on`

### Requirement: Examples JSONB column

The system SHALL add an `examples` jsonb column to `expressions`, nullable, storing an array of `{en: string, zh: string|null}` objects. When `examples` is null, the system SHALL treat `example_en`/`example_zh` as `examples[0]` for backward compatibility.

#### Scenario: Migration adds column

- **WHEN** the migration runs on an existing database
- **THEN** `expressions.examples` exists as nullable jsonb and existing rows have `examples = null`

#### Scenario: Backward compat read

- **WHEN** a row has `examples = null` and `example_en = "I let go of it."`, `example_zh = "我放下了它。"`
- **THEN** readers treat the row as having `examples = [{en: "I let go of it.", zh: "我放下了它。"}]`

### Requirement: One row per canonical phrase per video on insert

The system SHALL insert at most one expression row per canonical phrase key per `video_id` per extraction batch. Multiple LLM-returned items sharing a canonical key SHALL be merged into one row with an `examples` array containing each item's example, preserving `example_en`/`example_zh` as `examples[0]`.

#### Scenario: Same phrase twice in one video

- **WHEN** the LLM returns `behind the scenes` with example A and again with example B for the same video
- **THEN** exactly one expression row is inserted with `examples = [{en: A.en, zh: A.zh}, {en: B.en, zh: B.zh}]` and `example_en = A.en`

#### Scenario: Near-dup in one video

- **WHEN** the LLM returns `let go of something` and `let go of` for the same video
- **THEN** one row is inserted with display phrase `let go of` (most general form) and `examples` containing both examples

### Requirement: Display phrase selection on merge

When merging multiple items into one row, the system SHALL choose the display `phrase` as the most general form: prefer the form with no trailing pronoun/placeholder; tiebreak by shortest length; final tiebreak by earliest `created_at`.

#### Scenario: General form preferred

- **WHEN** merging `treat yourself` and `treat oneself`
- **THEN** the stored `phrase` is `treat oneself`

### Requirement: Cross-video merge at query time for All and Topic views

The system SHALL provide a data-access function `listExpressionsMergedByCanonicalKey` that groups expression rows by canonical key across all videos (or within a topic subtree), concatenating their `examples` arrays into one virtual row per canonical key. Video view SHALL NOT merge across videos.

#### Scenario: All view merge

- **WHEN** `behind the scenes` exists in video X with 1 example and video Y with 1 example
- **THEN** the All view receives one virtual row with `examples` of length 2

#### Scenario: Video view unmerged

- **WHEN** the same phrase exists in two videos and the user opens Video view for video X
- **THEN** only video X's row is shown, with its own `examples` array only

### Requirement: Merge backfill script

The system SHALL provide `scripts/merge-duplicate-expressions.ts` that, for each video, collapses existing rows sharing a canonical key into one row (preserving `topic_locked` and the most general display phrase), populating `examples` from the merged rows' `example_en`/`example_zh`.

#### Scenario: Backfill idempotent

- **WHEN** the script runs twice
- **THEN** the second run is a no-op (rows already canonical per video)

#### Scenario: Locked topic preserved

- **WHEN** one of the merged rows has `topic_locked = true`
- **THEN** the resulting row has `topic_locked = true` and `topic_id` from the locked row

### Requirement: Manual merge action

The system SHALL allow the user to merge two expression cards in Collections (All/Topic views) via a "merge with…" action, specifying a target canonical key; the system SHALL combine their `examples` arrays and delete the redundant row.

#### Scenario: Merge two cards

- **WHEN** user merges card A into card B
- **THEN** card B's `examples` array gains A's examples and card A's row is deleted

### Requirement: Multi-example card rendering

The system SHALL render an expression card with multiple examples as one card showing the phrase, meaning, and numbered `Example one` / `Example two` blocks (each with English in italics and Chinese below), instead of separate cards per example.

#### Scenario: Two examples

- **WHEN** a canonical phrase has `examples = [{en, zh}, {en, zh}]`
- **THEN** the card renders both example blocks within a single dashed-border box

#### Scenario: Single example unchanged

- **WHEN** a canonical phrase has one example
- **THEN** the card renders as before with no "Example one" label
