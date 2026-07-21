## MODIFIED Requirements

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

## ADDED Requirements

### Requirement: User-scoped negative preference examples

The system SHALL provide user-scoped dismissal reason counts and bounded representative dismissal examples for extraction preference context. Negative examples SHALL include `gap_ignore` and Collections dismiss reasons, preserve reason labels, and exclude invalid or empty phrases.

#### Scenario: Ignore history becomes prompt evidence

- **WHEN** the user has `gap_ignore`, `fragment`, and `obscure` dismissals
- **THEN** preference context includes aggregate counts for those reasons and bounded representative phrases

#### Scenario: Different user's dismissals are excluded

- **WHEN** multiple users have dismissal rows
- **THEN** the current user's extraction context does not include another user's negative examples
