## MODIFIED Requirements

### Requirement: Accept and Ignore actions

The system SHALL allow the user to Accept or Ignore a pending gap.

On **Ignore**, the system SHALL dismiss the linked transcript expression using the same dismiss path as Collections delete (delete expression row and record `expression_dismissals` with reason `gap_ignore`). The gap row SHALL be removed (including via ON DELETE CASCADE when the expression is deleted). Ignore SHALL NOT write to Feishu.

On **Accept**, the system SHALL set the gap `status` to `accepted`, increase the linked expression’s `weight` by `0.5` capped at `3.0`, and set `topic_locked = true` on that expression. Accept SHALL NOT create a Feishu-sourced expression or write to Feishu.

#### Scenario: Ignore dismisses expression

- **WHEN** the user ignores a pending gap for transcript expression E
- **THEN** E is deleted, a dismissal with `reason = gap_ignore` exists for E’s video and phrase, and the gap no longer appears in pending

#### Scenario: Ignore does not write Feishu

- **WHEN** the user ignores a pending gap
- **THEN** no Feishu document is modified and no `source_type = feishu` row is inserted

#### Scenario: Accept locks and bumps weight

- **WHEN** the user accepts a pending gap for expression E with `weight = 1.0` and `topic_locked = false`
- **THEN** gap `status` is `accepted`, E.`weight` is `1.5`, and E.`topic_locked` is `true`

#### Scenario: Accept weight cap

- **WHEN** the user accepts a pending gap for expression E with `weight = 2.8`
- **THEN** E.`weight` becomes `3.0`

#### Scenario: Accept does not invent Feishu row

- **WHEN** the user accepts a pending gap
- **THEN** no new `source_type = feishu` row is inserted

## ADDED Requirements

### Requirement: Dismissed phrases do not reappear as gaps

After a Gaps Ignore dismisses a phrase, subsequent gap refresh and extraction SHALL NOT recreate a pending gap for that phrase on the same video while the dismissal remains (expression absent + blocklist).

#### Scenario: Refresh after Ignore stays clean

- **WHEN** a gap was ignored (expression dismissed) and `refreshGapsForVideo` runs for that video
- **THEN** no new pending gap is created for that dismissed phrase

### Requirement: Accepted phrases survive re-extract

Because Accept sets `topic_locked = true`, re-extraction SHALL retain the accepted transcript expression (existing unlocked-delete rules), and the accepted gap row SHALL remain unless the expression is later removed by an explicit dismiss.

#### Scenario: Re-extract keeps accepted expression

- **WHEN** an accepted gap’s expression has `topic_locked = true` and re-extract runs for the video
- **THEN** that expression row still exists after re-extract
