# global-dismiss-blocklist

## Purpose

User-scoped global phrase blocklist applied across all videos during extraction and re-extract (pre-Phase 5).

## Requirements

### Requirement: User-scoped dismissals

The system SHALL add a `user_id` column to `expression_dismissals` (nullable uuid referencing `auth.users(id)` on delete cascade). New dismissals SHALL record the authenticated user's id; existing rows SHALL be backfilled with the single user's id.

#### Scenario: New dismissal records user

- **WHEN** an authenticated user dismisses an expression
- **THEN** the `expression_dismissals` row has `user_id` set to that user's id

#### Scenario: Backfill existing rows

- **WHEN** the migration runs on a database with existing dismissal rows
- **THEN** each row receives the single authenticated user's id

### Requirement: Global dismissed phrase set per user

The system SHALL provide `listGlobalDismissedPhraseKeys(userId)` returning the set of all `phrase_key` values dismissed by that user across all videos.

#### Scenario: Cross-video blocklist

- **WHEN** user dismissed `feel stuck` in video X and a new video Y is imported
- **THEN** `listGlobalDismissedPhraseKeys(user)` includes `feel stuck`

### Requirement: Extract filters against global blocklist

The system SHALL NOT insert any expression whose canonical key matches the user's global dismissed phrase set, in addition to the existing per-video dismissed phrase set. The effective blocklist is the union of both sets.

#### Scenario: Globally dismissed phrase skipped on new video

- **WHEN** `feel stuck` was dismissed in video X and the LLM returns `Feel Stuck` while extracting video Y for the same user
- **THEN** no expression row is inserted for `feel stuck` in video Y

#### Scenario: Per-video dismissal still respected

- **WHEN** `off topic phrase` was dismissed only for video X (reason `off_topic`)
- **THEN** it is still blocked on video X re-extract and also blocked globally per v1 default

### Requirement: Collections delete captures reason

The Collections delete action SHALL prompt the user to select a dismiss reason from `DISMISS_REASONS` before recording the dismissal. The selected reason SHALL be persisted on the `expression_dismissals` row.

#### Scenario: Reason picker shown

- **WHEN** user taps the delete icon on a Collections expression card
- **THEN** a reason picker appears with the seven `DISMISS_REASONS`

#### Scenario: Reason persisted

- **WHEN** user selects `already_know` and confirms
- **THEN** the dismissal row has `reason = 'already_know'`

#### Scenario: Dismiss hints feed from reasons

- **WHEN** `formatDismissalHintsForPrompt` runs after dismissals with reasons exist
- **THEN** the extract prompt includes the learner dismiss patterns section
