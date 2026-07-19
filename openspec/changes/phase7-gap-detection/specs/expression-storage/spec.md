## ADDED Requirements

### Requirement: Gap detection reads without mutating source types

The system SHALL allow gap detection to read transcript-sourced and Feishu-sourced expressions for the same `video_id` and compare them with `canonicalKey`. Gap detection SHALL NOT delete, merge, or change `source_type` on expression rows as a side effect of computing or refreshing gaps.

#### Scenario: Refresh does not alter expression rows

- **WHEN** gap refresh runs for a video that has both transcript and Feishu expressions
- **THEN** expression row counts and `source_type` values for that video remain unchanged; only `gaps` rows may be inserted, updated, or deleted

#### Scenario: Canonical key comparison uses shared function

- **WHEN** gap detection compares a transcript phrase to Feishu phrases on the same video
- **THEN** it uses the same `canonicalKey` derivation as extract and Feishu upsert paths
