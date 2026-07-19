## ADDED Requirements

### Requirement: Per-user Feishu credentials required

The system SHALL obtain Feishu API credentials from the authenticated user's `user_settings` (`feishu_app_id`, `feishu_app_secret`) for all sync runs.

#### Scenario: Authenticated sync with credentials

- **WHEN** a signed-in user's sync runs and both Feishu fields are non-empty
- **THEN** the system uses those credentials to call the Feishu Open API

#### Scenario: Missing credentials skip sync silently on Home

- **WHEN** a signed-in user opens Home and either Feishu field is empty
- **THEN** the system does not run auto-sync and does not show an error on Home

#### Scenario: Unauthenticated request rejected

- **WHEN** an unauthenticated client calls the sync API
- **THEN** the system returns HTTP 401

### Requirement: Tenant access token acquisition

The system SHALL exchange app id and secret for a Feishu `tenant_access_token` before any Feishu API call.

#### Scenario: Successful token exchange

- **WHEN** valid app credentials are provided
- **THEN** the system receives a tenant access token and uses it in subsequent API requests

#### Scenario: Invalid credentials logged not surfaced on Home

- **WHEN** Feishu rejects the credential exchange during a background Home sync
- **THEN** the system writes a failed `sync_logs` row and does not show an error on Home

### Requirement: List and fetch note documents

The system SHALL list accessible Feishu cloud documents and fetch text or Markdown content for each document selected for sync.

#### Scenario: Fetch note content

- **WHEN** sync processes a document token returned by the list API
- **THEN** the system retrieves content suitable for structure-aware parsing

#### Scenario: Skip unreadable documents

- **WHEN** a listed document cannot be read due to permissions or unsupported type
- **THEN** the system records the failure in sync `details` and continues with remaining documents

### Requirement: Structure-aware document parsing

The system SHALL parse each fetched document into video sections keyed by H3 headings, with creator from H1, and typed blocks including **Section** markers (`【…】`), tables, bullets, and standalone phrases.

#### Scenario: H3 defines video section

- **WHEN** the parser encounters `### 🍊 [Video title](https://www.youtube.com/watch?v=…)`
- **THEN** it starts a new video section with `videoTitle`, normalized `youtubeUrl`, and collects following blocks until the next H3 or H1

#### Scenario: H1 sets creator context

- **WHEN** the parser encounters `# 🌟 Creator Name` before H3 sections
- **THEN** subsequent H3 sections inherit `creatorName` until the next H1

#### Scenario: Section marker is not a Topic

- **WHEN** the parser encounters `【观点】`
- **THEN** it records Section label `观点` and attaches it to following bullets until the next Section or H3, without mapping to any Echo Topic

#### Scenario: Markdown table becomes table block

- **WHEN** the parser encounters a pipe table with a header separator row
- **THEN** it emits a `table` block for rule-based vocab extraction

### Requirement: Video resolve from H3 YouTube URL

The system SHALL resolve each parsed H3 section to a `videos` row by normalized `youtube_url` when present, reusing an existing imported video or creating a new row with the H3 title.

#### Scenario: Match existing transcript video

- **WHEN** an H3 section contains a YouTube URL that already exists in `videos`
- **THEN** the system uses that `video_id` for all expressions ingested from the section

#### Scenario: Create video from H3 when URL is new

- **WHEN** an H3 section contains a YouTube URL with no matching `videos` row
- **THEN** the system creates a video with `title` from the H3 heading, `youtube_url` normalized, and `source = feishu`

### Requirement: Sentence-first ingest order

The system SHALL ingest bullet and standalone phrase blocks before vocabulary tables within each H3 section.

#### Scenario: Sentences processed before tables

- **WHEN** an H3 section contains both bullet blocks and a table block
- **THEN** the system completes sentence extraction and persistence before parsing the table

### Requirement: Rule-based table vocabulary extraction

The system SHALL parse vocabulary tables without an LLM, pairing adjacent English and Chinese cells into expressions.

#### Scenario: Six-column vocab row

- **WHEN** a table row is `|sew|缝|loose|松动的|wiggly|不平整的|`
- **THEN** the system produces three candidate vocab items: (`sew`, `缝`), (`loose`, `松动的`), (`wiggly`, `不平整的`)

#### Scenario: Table path skips LLM

- **WHEN** expressions originate from a table block
- **THEN** the system does not call the LLM for those rows

### Requirement: Table vocab subsumption filter

The system SHALL skip a table vocabulary item when its English word appears as a whole word in any `phrase` or `example_en` already ingested from the same H3 section in the current sync run.

#### Scenario: Word covered by sentence phrase

- **WHEN** the table contains `crochet` and a bullet in the same H3 was ingested with `phrase` containing `crochet`
- **THEN** the system does not create a separate vocab card for `crochet`

#### Scenario: Standalone word kept

- **WHEN** the table contains `sew` and no ingested phrase or example from the same H3 contains `sew` as a whole word
- **THEN** the system creates a vocab expression with `phrase = sew` and `meaning` from the table

### Requirement: LLM sentence extraction for bullets and phrases

The system SHALL extract structured expressions from `bullet` and `phrase` blocks using an LLM prompt for sentence-level notes. The current Section label and `videoTitle` MAY be passed as extract context. The LLM SHALL NOT assign Echo Topics.

#### Scenario: Bullet with inline gloss

- **WHEN** a bullet contains `I'm getting ready to **head out (出门)**`
- **THEN** the extractor returns `phrase` for the target expression, `meaning` from the gloss, and `example_en` as the source sentence

#### Scenario: Resolve Chinese examples

- **WHEN** an extracted expression has `example_en` but no Chinese example
- **THEN** the system calls `resolveExampleZh` before persistence

### Requirement: Silent auto-sync on Home

The system SHALL run incremental Feishu sync in the background when the user opens Home, without blocking render, when credentials are present and sync is stale.

#### Scenario: Auto-sync when stale

- **WHEN** an authenticated user with Feishu credentials opens Home and `last_feishu_sync_at` is null or more than 6 hours ago
- **THEN** the system starts incremental sync in the background and renders Home immediately

#### Scenario: No sync when fresh

- **WHEN** an authenticated user opens Home and `last_feishu_sync_at` is within the last 6 hours
- **THEN** the system does not start a new sync

#### Scenario: No spinner or toast on Home

- **WHEN** background auto-sync runs on Home
- **THEN** the user sees no sync button, spinner, or toast

### Requirement: Light Feishu sync status on Home

The system SHALL display a single subtle status line directly below the "Start today's review" CTA showing last successful Feishu sync time or credential state.

#### Scenario: Recently synced

- **WHEN** user opens Home and last successful sync was 2 hours ago
- **THEN** the line reads similar to `Feishu ✓ Synced 2 hours ago`

#### Scenario: Never synced

- **WHEN** user has Feishu credentials but no successful sync yet
- **THEN** the line reads similar to `Feishu · Not synced yet`

#### Scenario: Missing credentials

- **WHEN** user has no Feishu credentials saved
- **THEN** the line reads similar to `Feishu · Add credentials in Settings`

#### Scenario: In-progress sync shows last success

- **WHEN** background sync is running
- **THEN** the status line still shows the previous successful sync time (no in-progress spinner)

### Requirement: Manual sync entry points

The system SHALL expose manual Feishu sync via Settings (optional), `POST /api/feishu/sync`, and `scripts/sync-feishu.ts` CLI using the same core service.

#### Scenario: Settings manual sync

- **WHEN** user triggers sync from Settings
- **THEN** the system runs sync and may show a result message in Settings only

#### Scenario: CLI sync

- **WHEN** developer runs `npx tsx scripts/sync-feishu.ts`
- **THEN** the same sync service runs and prints a summary count to stdout

### Requirement: Incremental sync cursor

The system SHALL support incremental sync by processing only Feishu documents whose `updated_at` is later than `last_feishu_sync_at`. Within a changed document, re-parse all H3 sections.

#### Scenario: Cursor advances only on success

- **WHEN** sync completes with `status = success`
- **THEN** the system sets `last_feishu_sync_at` to the sync start timestamp

#### Scenario: Failed sync preserves cursor

- **WHEN** sync fails before completing any document ingest
- **THEN** the system does not advance `last_feishu_sync_at`

### Requirement: Weight bump on re-ingest per video

The system SHALL increase `weight` by `0.5` (capped at `3.0`) when upserting an existing `source_type = feishu` expression on the same `video_id`.

#### Scenario: Re-sync existing feishu phrase

- **WHEN** sync re-ingests a phrase that already exists with `source_type = feishu` on that video
- **THEN** the system sets `weight` to `min(previous_weight + 0.5, 3.0)`

### Requirement: Skip transcript duplicate phrases

The system SHALL NOT insert a `source_type = feishu` row when the same `video_id` already has a `source_type = transcript` expression with the same canonical phrase key.

#### Scenario: Phrase already from transcript extract

- **WHEN** Feishu sync encounters a phrase on a video that already has that phrase from transcript extraction
- **THEN** the system skips feishu insert and records the skip in sync `details`

### Requirement: Dismissal-aware ingest

The system SHALL NOT insert expressions whose canonical phrase key matches an existing dismissal for that `video_id`.

#### Scenario: Skip dismissed phrase from notes

- **WHEN** note text contains a phrase previously dismissed for that video
- **THEN** the system does not re-insert that expression

### Requirement: Creator on video not expression

The system SHALL write H1-derived creator to `videos.creator` when resolving the H3 video, not to any expression column.

#### Scenario: Creator on video row

- **WHEN** sync ingests an H3 under H1 `Leah's Diary`
- **THEN** the linked `videos` row has `creator = Leah's Diary` and expressions have no creator column

### Requirement: Static Section-to-Topic mapping during sync

The system SHALL resolve `topic_id` at ingest via `feishu-section-topic-map` (slug/name match on topics, including parents with children; optional overrides). The system SHALL fetch Docx blocks and convert to Markdown for ingest (not `raw_content`). The system SHALL NOT call LLM topic classification during Feishu sync.

#### Scenario: Mapped section joins Topic review

- **WHEN** sync ingests a bullet under Section `Travel` and topic slug `travel` exists
- **THEN** the expression has `feishu_section = Travel`, `topic_id` set to that topic, and appears in Topic-scoped Collections and Review

#### Scenario: Unmapped section saved only

- **WHEN** sync ingests a bullet under Section `观点`
- **THEN** the expression has `feishu_section = 观点` and `topic_id` is null
