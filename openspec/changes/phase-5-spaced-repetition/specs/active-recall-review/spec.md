## MODIFIED Requirements

### Requirement: Review page mode selector

The system SHALL present three regions: **Today's Review** (first, with `slice / budget` count), **Video Practice**, and **Topic Practice**. UI SHALL NOT use the word "Due".

#### Scenario: Review page layout

- **WHEN** user opens `/review`
- **THEN** Today's Review appears first with count badge (e.g. `18 / 40`)

#### Scenario: Enter Video Practice

- **WHEN** user taps Video Practice
- **THEN** system shows video scope picker then full random deck for that video

#### Scenario: Enter Topic Practice

- **WHEN** user taps Topic Practice
- **THEN** system shows topic scope picker then full random deck for subtree

### Requirement: Active mode bar during review

The system SHALL show `Today's Review Now`, `Video Practice Now`, or `Topic Practice Now` during active sessions, with **Back** to mode selector.

#### Scenario: Back from Today's Review

- **WHEN** user taps Back during Today's Review
- **THEN** system returns to three-mode selector

### Requirement: Card source footer

Footer shows video title for Today's Review and Video Practice; topic name for Topic Practice.

#### Scenario: Today's Review footer

- **WHEN** user reviews in Today's Review
- **THEN** card footer shows source video title

## ADDED Requirements

### Requirement: Home direct entry to Today's Review

The system SHALL provide a Home CTA that starts Today's Review immediately without mode selection.

#### Scenario: Home CTA

- **WHEN** user taps Today's Review on Home
- **THEN** Today's Review session begins directly

### Requirement: Session Queue for Unsure

The system SHALL reinsert `unsure` cards into the active session after a random delay of 4–8 cards, at most 3 times per expression per session. `again` and `mastered` SHALL NOT reinsert.

#### Scenario: Unsure reinsert

- **WHEN** user rates `unsure` on card at index 5
- **THEN** the same card reappears after 4–8 subsequent cards

#### Scenario: Again no reinsert

- **WHEN** user rates `again`
- **THEN** card does not reappear in the same session

#### Scenario: Unsure cap

- **WHEN** user rates `unsure` 3 times on the same card in one session
- **THEN** no further session reinserts for that card this session

### Requirement: Video and Topic practice decks

The system SHALL load all non-dismissed expressions in scope with random shuffle, regardless of `due_at` or New status.

#### Scenario: Video practice full deck

- **WHEN** user selects a video with 20 expressions
- **THEN** all 20 appear in random order

### Requirement: Caught up and Continue Today UI

After completing today's budget slice, the system SHALL show `🎉 You're all caught up.` and `Continue Today` when more Due/New remain unshown today.

#### Scenario: Caught up display

- **WHEN** user completes 40/40 with 80 Due remaining
- **THEN** caught up message and Continue Today are visible

## REMOVED Requirements

### Requirement: Due-scoped review deck

**Reason**: Replaced by Today's Review selection (Due + New + budget) in `daily-review-budget` spec.

**Migration**: Use `buildTodaysReviewDeck()` instead of due-only loader.

### Requirement: Home due count surfacing

**Reason**: Replaced by Today's Review `slice / budget` on Home CTA.

**Migration**: Home shows `Today's Review (18 / 40)` not due count alone.
