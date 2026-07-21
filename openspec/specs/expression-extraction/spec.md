# expression-extraction

## Purpose

Extract and classify expressions from cleaned transcripts using OpenAI (Phase 3).

## Requirements

### Requirement: Extract expressions from cleaned transcript

The system SHALL extract useful English phrases, collocations, and patterns from `transcripts.cleaned_text` using OpenAI and the `extract-expressions` prompt template, persisting each expression with `example_en` set from the model's example sentence. On every Extract and Re-extract, the prompt SHALL include the current bounded extraction preference context when available. The extractor SHALL prioritize precision and MAY return fewer expressions than the configured cap when remaining candidates are weak or conflict with learner preferences.

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

#### Scenario: Preference-aware extraction returns fewer

- **WHEN** only a subset of candidates meet base quality rules and resemble the learner's accepted preferences
- **THEN** extraction may return fewer than the configured maximum rather than filling the cap with weak candidates

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

The system SHALL group LLM-returned expressions by `canonicalKey(phrase)` before insert, merging items that share a canonical key into one row with a multi-entry `examples` array. The system SHALL remove candidates whose canonical key is in the user's global or per-video dismissed phrase set before preference ranking, and SHALL enforce the same blocklist again before persistence.

#### Scenario: Near-dups merged in one batch

- **WHEN** the LLM returns `let go of something` and `let go of` in the same extraction batch
- **THEN** one row is inserted with display phrase `let go of` and `examples` of length 2

#### Scenario: Canonical key blocked by global dismissal

- **WHEN** the user dismissed `treat yourself` globally and the LLM returns `treat oneself` (same canonical key)
- **THEN** no row is inserted

#### Scenario: Blocked candidate does not consume rank budget

- **WHEN** an over-target candidate set contains a globally dismissed canonical key
- **THEN** that candidate is removed before ranking and does not consume a selected slot

### Requirement: Preference-aware extraction and ranking prompts

The system SHALL include bounded accepted and dismissed examples plus aggregate dismissal patterns in both `extract-expressions` and `select-expressions` prompts. The prompts SHALL instruct the model to generalize the learner's preferred expression style and SHALL NOT require copying accepted phrases into unrelated transcripts.

#### Scenario: Positive and negative examples reach extractor

- **WHEN** preference context contains accepted and dismissed examples
- **THEN** the extraction system prompt includes both sets with their intended keep/avoid meaning

#### Scenario: Topic-aware examples reach ranker

- **WHEN** candidate expressions include Topic slugs and matching accepted feedback exists
- **THEN** the rank prompt prioritizes accepted examples relevant to those candidate Topics

### Requirement: No additional mandatory classifier call

The system SHALL reuse the existing extraction and optional over-target rank calls and SHALL NOT add a separate mandatory feedback-classifier LLM call in v1.

#### Scenario: Candidate count is within target

- **WHEN** extracted candidates are within the target count
- **THEN** the system applies prompt guidance and deterministic filters without calling a new preference classifier

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
