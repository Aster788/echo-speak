## ADDED Requirements

### Requirement: Gaps Ignore uses dismiss with gap_ignore

The system SHALL include `gap_ignore` in the allowed dismiss reasons. When Gaps Ignore dismisses an expression, the system SHALL persist `reason = gap_ignore` on the `expression_dismissals` row and delete the expression row.

#### Scenario: gap_ignore recorded

- **WHEN** Gaps Ignore dismisses phrase “feel stuck” on a video
- **THEN** `expression_dismissals` contains that video + phrase_key with `reason = gap_ignore` and the expression row is gone

### Requirement: Gaps Accept bumps weight and locks topic

When a gap is accepted, the system SHALL update the linked transcript expression with `weight = min(weight + 0.5, 3.0)` and `topic_locked = true` without changing `source_type` or inventing a Feishu row.

#### Scenario: Accept updates expression fields only

- **WHEN** Gaps Accept runs for a transcript expression
- **THEN** `weight` and `topic_locked` are updated as specified and `source_type` remains `transcript`
