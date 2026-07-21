## MODIFIED Requirements

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

## ADDED Requirements

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
