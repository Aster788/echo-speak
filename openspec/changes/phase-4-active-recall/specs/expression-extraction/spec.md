## MODIFIED Requirements

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

## ADDED Requirements

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
