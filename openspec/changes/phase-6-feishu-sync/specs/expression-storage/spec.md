## ADDED Requirements

### Requirement: Feishu section column on expressions

The system SHALL add nullable `feishu_section` (text) on `expressions` for note Section labels (e.g. `闲逛`, `观点`). The system SHALL NOT add `feishu_creator` or `video_title` on expressions.

#### Scenario: Section persisted on expression

- **WHEN** sync ingests a bullet under `【闲逛】`
- **THEN** the row has `feishu_section` equal to `闲逛`

#### Scenario: Transcript expression has null section

- **WHEN** the extraction pipeline inserts a transcript-sourced expression
- **THEN** `feishu_section` is null

### Requirement: Creator and video title via video_id

The system SHALL resolve creator and video title by joining `expressions.video_id` to `videos`, using `videos.creator` and `videos.title` respectively. The system SHALL NOT duplicate creator or video title on the expression row.

#### Scenario: Feishu expression creator from video

- **WHEN** a feishu expression is listed with its parent video
- **THEN** creator displays as `videos.creator` and title as `videos.title`

#### Scenario: Transcript expression title from video

- **WHEN** a transcript expression is listed with its parent video
- **THEN** video title displays as `videos.title` (unchanged behavior)

### Requirement: Feishu section-to-topic static mapping

The system SHALL resolve `topic_id` at Feishu ingest using static rules in `feishu-section-topic-map` (no LLM). The system SHALL always persist the raw Section label on `feishu_section`. The system SHALL set `topic_id` when the section label matches a Topic slug or name (case-insensitive), including Topics that have children, or via an explicit slug override. Unmapped sections SHALL keep `topic_id` null (never Uncategorized). Re-sync SHALL update `topic_id` from the map unless `topic_locked` is true.

#### Scenario: Section matches topic slug

- **WHEN** sync ingests a bullet under Section `Work` and a topic with slug `work` exists
- **THEN** `feishu_section` is `Work` and `topic_id` points to that topic

#### Scenario: Section matches parent topic with children

- **WHEN** sync ingests a bullet under Section `Shopping` and topic `Shopping` has child topics
- **THEN** `topic_id` still points to `Shopping`

#### Scenario: Unmapped section stays null

- **WHEN** sync ingests a bullet under Section `观点` and no topic slug/name matches `观点`
- **THEN** `feishu_section` is `观点` and `topic_id` is null

#### Scenario: Manual move preserved on re-sync

- **WHEN** a feishu expression has `topic_locked = true` and sync runs again
- **THEN** the system updates `feishu_section` and content fields but does not change `topic_id`

### Requirement: Feishu source type on ingest

The system SHALL set `source_type` to `feishu` for all expressions created by the Feishu sync ingest path.

#### Scenario: Feishu ingest persistence

- **WHEN** the Feishu sync service saves extracted expressions
- **THEN** each inserted row has `source_type` equal to `feishu`

### Requirement: Feishu upsert scoped per video

The system SHALL upsert Feishu-sourced expressions by `(video_id, canonicalKey(phrase), source_type = feishu)`, updating meaning, examples, and `feishu_section` when changed.

#### Scenario: Upsert updates existing feishu row on same video

- **WHEN** sync extracts a phrase whose canonical key matches an existing `source_type = feishu` row on the same `video_id`
- **THEN** the system updates that row instead of inserting a duplicate

### Requirement: Feishu sync does not delete transcript expressions

The system SHALL NOT delete or replace transcript-sourced expressions when Feishu sync runs.

#### Scenario: Transcript duplicate not duplicated as feishu

- **WHEN** a phrase already exists as `source_type = transcript` on the video
- **THEN** Feishu sync does not insert a second feishu row for that canonical key

### Requirement: Nullable topic_id migration

The system SHALL allow `topic_id` to be null on `expressions` when `source_type = feishu`.

#### Scenario: Migration applies cleanly

- **WHEN** Phase 6 migration runs
- **THEN** `feishu_section` and `videos.creator` exist and `topic_id` is nullable for feishu rows

## MODIFIED Requirements

### Requirement: Expressions table schema

The system SHALL persist expressions in an `expressions` table with columns: `id` (uuid PK), `video_id` (uuid FK → videos.id), `phrase` (text), `meaning` (text), `example_en` (text), `example_zh` (text, nullable), `examples` (jsonb, nullable), `topic_id` (uuid FK → topics.id, **nullable when `source_type = feishu`**), `source_type` (text: `transcript` or `feishu`), `weight` (numeric), `topic_locked` (boolean), `feishu_section` (text, nullable), and `created_at` (timestamptz). Creator and video title SHALL be read from `videos` via `video_id`, not stored on the expression.

#### Scenario: Insert feishu expression with optional topic

- **WHEN** Feishu sync inserts an expression under a mapped Section
- **THEN** `feishu_section` is set, `topic_id` may be set when the static map matches, and creator/title come from the linked `videos` row

### Requirement: Default weight

The system SHALL set `weight` to `1.0` for expressions created by the extraction pipeline in v1. The Feishu sync ingest path SHALL set `weight` to `1.0` on insert and increase existing Feishu rows on the same `video_id` per the weight-bump rules in `feishu-sync`.

#### Scenario: New Feishu expression

- **WHEN** expressions are inserted via Feishu sync on a video
- **THEN** each new row has `weight` equal to `1.0`

#### Scenario: Re-sync weight bump

- **WHEN** Feishu sync upserts an existing feishu phrase on the same `video_id`
- **THEN** `weight` becomes `min(previous_weight + 0.5, 3.0)`

### Requirement: Re-extraction replaces transcript-sourced rows

The system SHALL delete existing expressions for the same `video_id` with `source_type = transcript` and `topic_locked = false` before inserting a new extraction batch. Feishu sync SHALL NOT trigger this delete path.

#### Scenario: Feishu sync does not replace transcript batch

- **WHEN** Feishu sync runs for a user
- **THEN** the system does not delete transcript-sourced expressions on any video
