# extraction-preference-context

## Purpose

Runtime preference context from complete Accept/Ignore and dismissal history to personalize expression extraction and ranking (Phase 7.1b).

## Requirements

### Requirement: Build preference context from complete feedback history

The system SHALL build an extraction preference context on every Extract and Re-extract from the learner's complete available feedback history: accepted gaps joined to their retained expressions as positive feedback, and expression dismissals as negative feedback.

#### Scenario: All historical feedback contributes

- **WHEN** the learner has feedback from the first through the most recent extraction
- **THEN** the preference builder considers all of those rows when computing counts and selecting examples

#### Scenario: Re-extract reads latest feedback

- **WHEN** the learner Accepts or Ignores a gap and then runs Re-extract
- **THEN** that newest feedback is available to the preference context for that run

### Requirement: Bounded representative examples

The system SHALL include at most 12 accepted and 12 dismissed raw examples in prompt context. It SHALL deduplicate examples by canonical phrase key and select examples by Topic relevance where available, then accepted weight, recency, and diversity.

#### Scenario: Large history remains bounded

- **WHEN** the learner has 500 accepted and 500 dismissed feedback rows
- **THEN** the prompt context contains no more than 12 positive and 12 negative raw examples

#### Scenario: Same-Topic examples are preferred for ranking

- **WHEN** ranking candidates for Topic `work` and accepted examples exist for `work` and unrelated Topics
- **THEN** the selected positive examples prioritize `work` before unrelated examples

#### Scenario: Duplicate canonical forms collapse

- **WHEN** feedback contains `let go of something` and `let go of` with the same canonical key
- **THEN** at most one representative example for that canonical key is included

### Requirement: Runtime-only generated context

The system SHALL generate preference context at extraction time and SHALL NOT persist a generated preference summary in v1.

#### Scenario: Feedback update applies without cache refresh

- **WHEN** feedback changes after one extraction
- **THEN** the next extraction derives context from current database rows without reading a stored summary

### Requirement: Graceful feedback-query fallback

The system SHALL continue extraction with an empty preference context when feedback history cannot be loaded, while retaining existing extraction quality and blocklist behavior.

#### Scenario: Feedback query fails

- **WHEN** the preference-history query returns an error
- **THEN** extraction proceeds without preference examples and does not fail solely because feedback is unavailable

### Requirement: Preference diagnostics

The system SHALL expose internal per-run diagnostics containing total accepted/dismissed history counts, positive/negative sample counts, raw candidate count, hard-blocked count, selected count, and persisted count.

#### Scenario: Extraction reports feedback counters

- **WHEN** an extraction completes using preference context
- **THEN** its internal result or logs contain the required counters for tests and diagnostics
