# daily-review-budget

## Purpose

Daily Today's Review budget, deck building (Due then New), Continue Today, and caught-up UI (Phase 5).

## Requirements

### Requirement: Daily review budget

The system SHALL support a user-configurable daily review budget with options 10, 20, 30, 40, 50, and Unlimited, defaulting to **40**, stored in `user_settings`.

#### Scenario: Default budget

- **WHEN** user has not changed settings
- **THEN** daily budget is 40 cards

### Requirement: Today's Review deck builder

The system SHALL build Today's Review sessions by:

1. Filling up to daily budget with Due expressions (`due_at <= now`), ordered by `due_at` ascending.
2. If budget remains, filling with New expressions (`first_reviewed_at IS NULL`) via weighted random per `srs-scheduling` spec.

#### Scenario: Due then New

- **WHEN** budget is 40, Due count is 35, and New count is 500
- **THEN** session contains 35 Due + 5 New cards

#### Scenario: Due fills entire budget

- **WHEN** budget is 40 and Due count is 120
- **THEN** session contains 40 Due cards and 0 New cards

#### Scenario: Only New on first use

- **WHEN** budget is 40, Due count is 0, and New count is 200
- **THEN** session contains 40 New cards selected by weighted random

### Requirement: Continue Today

The system SHALL offer **Continue Today** after today's budget slice is complete, building a new round from Due + New expressions **not yet shown today**.

#### Scenario: Continue excludes shown cards

- **WHEN** user completes 40/40 and taps Continue Today with 80 Due remaining
- **THEN** the next round draws from the 80 unshown Due (then New if budget allows)

### Requirement: Caught up state

The system SHALL show caught up when today's budget slice is complete **and** no additional Due or New expressions can roll into today.

Display:

- Line 1: `🎉 You're all caught up.`
- Line 2: `Continue Today` (when more Due/New exist beyond today's roll) OR hide when truly no more cards for the day

#### Scenario: Budget complete with rollover

- **WHEN** user finishes 40/120 Due today
- **THEN** UI shows caught up message and Continue Today

#### Scenario: Budget complete no rollover

- **WHEN** user finishes today's slice and zero unshown Due and zero New remain
- **THEN** UI shows caught up without implying database is empty of expressions forever

### Requirement: Budget display format

The system SHALL display Today's Review as `slice / budget` (e.g. `18 / 40` or `40 / 120` with `Continue later` when eligible exceeds budget).

#### Scenario: Home CTA format

- **WHEN** 18 cards in today's slice and budget 40
- **THEN** Home shows Start today's review with `18 / 40` on a second line

### Requirement: Today's Review naming in UI

The system SHALL use **Today's Review** in all user-facing copy. The word **Due** SHALL NOT appear in UI.

#### Scenario: No Due in UI

- **WHEN** user views Home or Review page
- **THEN** labels use Today's Review, not Due
