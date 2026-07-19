## Requirements

### Requirement: Gaps table schema

The system SHALL persist knowledge gaps in a `gaps` table with columns: `id` (uuid PK), `expression_id` (uuid FK → `expressions.id`, unique, ON DELETE CASCADE), `reason` (text), `status` (text: `pending` | `accepted` | `ignored`), and `created_at` (timestamptz).

#### Scenario: Migration creates gaps table

- **WHEN** a developer applies the Phase 7 migration
- **THEN** `gaps` exists with the columns, unique constraint on `expression_id`, and cascade delete from `expressions`

### Requirement: Gap definition is transcript not in Feishu per video

The system SHALL treat an expression as a gap candidate when it has `source_type = transcript` on a `video_id` and no expression on the same `video_id` with `source_type = feishu` shares the same `canonicalKey(phrase)`.

#### Scenario: Transcript phrase missing from Feishu notes

- **WHEN** video V has transcript expression “let go of something” and no Feishu expression whose `canonicalKey` equals `let go of`
- **THEN** that transcript expression is a gap candidate for V

#### Scenario: Matching Feishu phrase is not a gap

- **WHEN** video V has transcript and Feishu expressions that share the same `canonicalKey`
- **THEN** the transcript expression is not a gap candidate

#### Scenario: Cross-video Feishu match does not close the gap

- **WHEN** video V has a transcript phrase and only video W has a matching Feishu phrase
- **THEN** the transcript expression on V remains a gap candidate

### Requirement: Deterministic refresh without LLM

The system SHALL compute gaps with a deterministic refresh (`refreshGapsForVideo`) using stored expressions and `canonicalKey`. The system SHALL NOT call an LLM to produce the core set of gaps for Phase 7.

#### Scenario: Refresh uses expression rows only

- **WHEN** `refreshGapsForVideo(V)` runs
- **THEN** the result is derived only from transcript and Feishu expression rows on V plus `canonicalKey`, with no LLM request

### Requirement: Refresh upserts pending and clears stale pending

On refresh for a video, the system SHALL insert a `pending` gap for each new candidate expression that has no gap row, leave `ignored` and `accepted` rows unchanged, and delete `pending` rows whose expression is no longer a candidate.

#### Scenario: New candidate becomes pending

- **WHEN** refresh finds a candidate with no existing gap row
- **THEN** the system inserts `status = pending` and `reason = in_transcript_not_in_feishu`

#### Scenario: Ignored gap stays ignored

- **WHEN** refresh finds a candidate whose gap row is `ignored`
- **THEN** the system does not change that row back to `pending`

#### Scenario: Feishu catch-up clears pending

- **WHEN** a pending gap’s transcript key later matches a Feishu expression on the same video
- **THEN** refresh deletes that pending gap row

### Requirement: Refresh after extract and Feishu sync

The system SHALL run gap refresh for a video after transcript extraction completes for that video, and for each video touched by a Feishu sync ingest.

#### Scenario: Extraction triggers refresh

- **WHEN** extraction finishes for video V
- **THEN** the system calls gap refresh for V

#### Scenario: Feishu sync triggers refresh for touched videos

- **WHEN** Feishu sync upserts expressions for videos V1 and V2
- **THEN** the system calls gap refresh for V1 and V2

### Requirement: Accept and Ignore actions

The system SHALL allow the user to set a pending gap to `accepted` or `ignored`. Accept SHALL NOT create a Feishu-sourced expression or write to Feishu. Ignore SHALL prevent that `expression_id` from reappearing as `pending` on later refreshes.

#### Scenario: Accept pending gap

- **WHEN** the user accepts a pending gap
- **THEN** `status` becomes `accepted` and no new `source_type = feishu` row is inserted

#### Scenario: Ignore pending gap

- **WHEN** the user ignores a pending gap
- **THEN** `status` becomes `ignored` and a later refresh does not recreate a pending row for that expression

### Requirement: Gaps page lists pending gaps

The Gaps page (`/gaps`) SHALL list pending gaps with phrase and enough context to identify the source video. When there are no pending gaps, the page SHALL show an empty state. The page SHALL expose Accept and Ignore actions for each pending gap.

#### Scenario: Pending gaps render

- **WHEN** at least one gap has `status = pending`
- **THEN** `/gaps` lists those gaps with Accept and Ignore controls

#### Scenario: Empty pending set

- **WHEN** there are no pending gaps
- **THEN** `/gaps` shows an empty state (not a hard-coded false “always empty” stub that ignores data)

### Requirement: Empty Feishu set still yields gaps

When a video has transcript expressions and zero Feishu expressions, the system SHALL treat all transcript expressions on that video as gap candidates (subject to Ignore rules).

#### Scenario: Video with extract but no Feishu notes

- **WHEN** video V has three transcript expressions and no Feishu expressions
- **THEN** refresh creates pending gaps for those three expressions (unless already ignored/accepted)
