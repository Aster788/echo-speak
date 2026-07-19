## ADDED Requirements

### Requirement: videos creator column

The system SHALL add nullable `creator` (text) to the `videos` table. Creator SHALL be derived from the Feishu H1 heading at sync time and persisted on the matched or created `videos` row — not on expressions, not from LLM or YouTube oEmbed.

#### Scenario: Creator derived from H1 on create

- **WHEN** Feishu sync parses H1 `# 🌟 [Leah's Diary](channel-url)` and creates a video from the following H3
- **THEN** the `videos` row has `creator` equal to `Leah's Diary`

#### Scenario: Feishu sync backfills creator on existing video

- **WHEN** Feishu sync matches an existing video by `youtube_url` and `creator` is null
- **THEN** the system sets `creator` from the current H1-derived name

#### Scenario: Transcript import unchanged in Phase 6

- **WHEN** a transcript is imported via the existing pipeline
- **THEN** `creator` may remain null until Feishu sync or a future backfill sets it

### Requirement: videos source includes feishu

The system SHALL allow `videos.source` value `feishu` for rows created by Feishu sync when no YouTube URL is present or as the creating path.

#### Scenario: Feishu-created video source

- **WHEN** Feishu sync creates a video row
- **THEN** `source` may be `feishu` in addition to `youtube` or `manual`
