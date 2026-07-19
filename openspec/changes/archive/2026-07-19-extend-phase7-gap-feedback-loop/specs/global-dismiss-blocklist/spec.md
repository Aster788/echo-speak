## ADDED Requirements

### Requirement: Gaps Ignore feeds global blocklist

The system SHALL treat Gaps Ignore dismissals like other user dismissals for global blocklist purposes: the dismissed phrase_key SHALL be included in `listGlobalDismissedPhraseKeys(userId)` and SHALL be skipped on extract for other videos for that user.

#### Scenario: Gaps Ignore blocks extract on another video

- **WHEN** the user ignores a gap for “feel stuck” on video X (dismissal recorded with user_id)
- **AND** extraction runs for video Y for the same user and the LLM returns “Feel Stuck”
- **THEN** no expression row for that phrase is inserted on video Y
