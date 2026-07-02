## MODIFIED Requirements

### Requirement: Submit rating server action

The system SHALL record ratings via server action, insert `review_history` (with `mode` and `scope_id` for analytics), and invoke `scheduleAfterRating` to update global `review_queue`. Scheduling SHALL ignore `mode` and `scope_id`.

#### Scenario: Successful submit with schedule

- **WHEN** user submits a valid rating in any review mode
- **THEN** `review_history` is inserted and global `review_queue` is updated

#### Scenario: Analytics context preserved

- **WHEN** user rates in Video Practice with `mode=video` and `scope_id=V`
- **THEN** `review_history` stores `video` and V but scheduler uses only `expression_id`

#### Scenario: Schedule failure handling

- **WHEN** history insert succeeds but queue update fails
- **THEN** system returns error without leaving inconsistent state

## REMOVED Requirements

### Requirement: No SRS scheduling in Phase 4

**Reason**: Phase 5 activates scheduling on every rating.

**Migration**: `scheduleAfterRating` in submit path.
