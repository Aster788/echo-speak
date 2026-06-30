# expression-extraction

## Purpose

Extract and classify expressions from cleaned transcripts using OpenAI (Phase 3).

## Requirements

### Requirement: Extract expressions from cleaned transcript

The system SHALL extract useful English phrases, collocations, and patterns from `transcripts.cleaned_text` using OpenAI and the `extract-expressions` prompt template, persisting each expression with `example_en` set from the model's example sentence.

#### Scenario: Successful extraction

- **WHEN** extraction is triggered for a transcript with non-empty `cleaned_text` and OpenAI is configured
- **THEN** the system returns a list of expressions each containing `phrase`, `definition`, `example` (stored as `example_en`), and `topic_slug`

#### Scenario: Empty cleaned text

- **WHEN** extraction is triggered for a transcript with null or empty `cleaned_text`
- **THEN** the system rejects the request with a clear validation error

#### Scenario: Transcript exceeds length limit

- **WHEN** `cleaned_text` exceeds 100,000 characters
- **THEN** the system rejects extraction with a clear error message

#### Scenario: Long transcript within limit

- **WHEN** `cleaned_text` exceeds 12,000 characters but is within 100,000 characters
- **THEN** the system splits the text into chunks, extracts from each chunk, and merges deduplicated expressions

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

### Requirement: Extract pipeline dedups by canonical phrase key

The system SHALL group LLM-returned expressions by `canonicalKey(phrase)` before insert, merging items that share a canonical key into one row with a multi-entry `examples` array, and SHALL skip any whose canonical key is in the user's global or per-video dismissed phrase set.

#### Scenario: Near-dups merged in one batch

- **WHEN** the LLM returns `let go of something` and `let go of` in the same extraction batch
- **THEN** one row is inserted with display phrase `let go of` and `examples` of length 2

#### Scenario: Canonical key blocked by global dismissal

- **WHEN** the user dismissed `treat yourself` globally and the LLM returns `treat oneself` (same canonical key)
- **THEN** no row is inserted

### Requirement: Extraction API endpoint

The system SHALL provide `POST /api/transcripts/[id]/extract` that runs the extraction pipeline for the given transcript ID.

#### Scenario: Successful API extraction

- **WHEN** client sends `POST /api/transcripts/{id}/extract` for a valid transcript with cleaned text
- **THEN** the system persists expressions and returns a JSON summary with `expressionCount` and `videoId`

#### Scenario: Transcript not found

- **WHEN** client sends `POST /api/transcripts/{id}/extract` for a non-existent transcript ID
- **THEN** the system responds with HTTP 404

### Requirement: Extraction CLI

The system SHALL provide `scripts/reprocess-expressions.ts` to run extraction from the command line.

#### Scenario: Extract single transcript

- **WHEN** developer runs `npx tsx scripts/reprocess-expressions.ts --transcript-id <id>`
- **THEN** the system runs the same pipeline as the API and prints the number of expressions created

#### Scenario: Extract all transcripts

- **WHEN** developer runs `npx tsx scripts/reprocess-expressions.ts` without `--transcript-id`
- **THEN** the system processes all transcripts that have non-empty `cleaned_text` and reports results per transcript

### Requirement: Re-extraction replaces unlocked transcript-sourced rows

The system SHALL delete existing expressions for the same `video_id` with `source_type = transcript` and `topic_locked = false` before inserting a new extraction batch.

#### Scenario: Re-run extraction

- **WHEN** extraction is triggered again for a video that already has transcript-sourced expressions
- **THEN** the system replaces only unlocked expressions without duplicating phrases

#### Scenario: Locked expressions preserved

- **WHEN** re-extraction runs and some expressions have `topic_locked = true`
- **THEN** those expressions are not deleted or modified

### Requirement: Populate example_zh on insert

The system SHALL attempt to set `example_zh` for each inserted expression by aligning `example_en` to paired Chinese blocks in `transcripts.raw_text` before persisting the row.

#### Scenario: Alignment success from raw_text

- **WHEN** `example_en` appears in an English block of `raw_text` with a paired Chinese block
- **THEN** the system stores that Chinese block as `example_zh`

#### Scenario: Alignment failure fallback

- **WHEN** alignment cannot resolve `example_zh` from `raw_text`
- **THEN** the system calls DeepSeek to translate `example_en` into a single Chinese sentence and stores the result as `example_zh`

#### Scenario: Missing raw_text

- **WHEN** transcript has no `raw_text` and alignment is impossible
- **THEN** the system uses DeepSeek translation fallback or leaves `example_zh` null if translation is unavailable, without failing the entire extraction batch

### Requirement: Backfill example_zh for existing expressions

The system SHALL provide a script or command to backfill `example_zh` for expressions where it is null, using the same alignment-then-DeepSeek order as the pipeline.

#### Scenario: Backfill existing library

- **WHEN** developer runs the backfill command after migration
- **THEN** expressions with null `example_zh` are updated where alignment or translation succeeds
