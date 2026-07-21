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

The system SHALL NOT insert any expression whose canonical key matches the authenticated user's global dismissed phrase set, in addition to the existing per-video dismissed phrase set. The effective blocklist is the union of both sets. The system SHALL apply this blocklist before preference ranking and SHALL retain a final pre-persistence check as defense in depth.

#### Scenario: Globally dismissed phrase skipped on new video

- **WHEN** `feel stuck` was dismissed in video X and the LLM returns `Feel Stuck` while extracting video Y for the same user
- **THEN** no expression row is inserted for `feel stuck` in video Y

#### Scenario: Per-video dismissal still respected

- **WHEN** `off topic phrase` was dismissed only for video X (reason `off_topic`)
- **THEN** it is blocked on video X re-extract and also blocked globally per v1 default

#### Scenario: Early and final enforcement

- **WHEN** the LLM returns a dismissed canonical phrase
- **THEN** it is removed before ranking and cannot be inserted even if it reaches the final pipeline filter

### Requirement: User-scoped negative preference examples

The system SHALL provide user-scoped dismissal reason counts and bounded representative dismissal examples for extraction preference context. Negative examples SHALL include `gap_ignore` and Collections dismiss reasons, preserve reason labels, and exclude invalid or empty phrases.

#### Scenario: Ignore history becomes prompt evidence

- **WHEN** the user has `gap_ignore`, `fragment`, and `obscure` dismissals
- **THEN** preference context includes aggregate counts for those reasons and bounded representative phrases

#### Scenario: Different user's dismissals are excluded

- **WHEN** multiple users have dismissal rows
- **THEN** the current user's extraction context does not include another user's negative examples

### Requirement: Collections delete captures reason

The Collections delete action SHALL prompt the user to select a dismiss reason from the collection dismiss reasons (excluding Gaps-only `gap_ignore`) before recording the dismissal. The selected reason SHALL be persisted on the `expression_dismissals` row.

#### Scenario: Reason picker shown

- **WHEN** user taps the delete icon on a Collections expression card
- **THEN** a reason picker appears with the seven collection dismiss reasons (not `gap_ignore`)

#### Scenario: Reason persisted

- **WHEN** user selects `already_know` and confirms
- **THEN** the dismissal row has `reason = 'already_know'`

#### Scenario: Dismiss hints feed from reasons

- **WHEN** `formatDismissalHintsForPrompt` runs after dismissals with reasons exist
- **THEN** the extract prompt includes the learner dismiss patterns section

### Requirement: Gaps Ignore feeds global blocklist

The system SHALL treat Gaps Ignore dismissals like other user dismissals for global blocklist purposes: the dismissed phrase_key SHALL be included in `listGlobalDismissedPhraseKeys(userId)` and SHALL be skipped on extract for other videos for that user.

#### Scenario: Gaps Ignore blocks extract on another video

- **WHEN** the user ignores a gap for “feel stuck” on video X (dismissal recorded with user_id)
- **AND** extraction runs for video Y for the same user and the LLM returns “Feel Stuck”
- **THEN** no expression row for that phrase is inserted on video Y
