# active-recall-review

## Purpose

Mobile-first Active Recall review on `/review`: Today's Review, Video/Topic practice, mode selection, and tarot-style bilingual flip cards (Phase 4–5).

## Requirements

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

#### Scenario: Back from Video or Topic practice

- **WHEN** user taps Back during Video or Topic practice
- **THEN** system returns to scope picker or mode selector per flow

### Requirement: Video and Topic practice decks

The system SHALL load all non-dismissed expressions in scope with random shuffle, regardless of `due_at` or New status.

#### Scenario: Video practice full deck

- **WHEN** user selects a video with 20 expressions
- **THEN** all 20 appear in random order

#### Scenario: Empty video deck

- **WHEN** user selects a video with zero expressions
- **THEN** the system shows the empty-state decoration and a message that no cards are available

#### Scenario: Empty topic deck

- **WHEN** user selects a topic subtree with zero expressions
- **THEN** the system shows the empty-state decoration and a message that no cards are available

### Requirement: Empty-state alphabet decoration

The system SHALL show the alphabet collage decoration full-width when the user has not entered card review OR when the selected scope has no cards, and SHALL hide the decoration while an active flip card is displayed.

#### Scenario: Decoration before mode pick

- **WHEN** user is on initial mode selector
- **THEN** the alphabet decoration is visible behind the selector area

#### Scenario: Decoration hidden during card review

- **WHEN** user is viewing a flip card in an active session
- **THEN** the alphabet decoration is not visible

### Requirement: Flip card front side

The system SHALL display the card front with `meaning` as the primary line and `example_zh` as the secondary line, centered with literary typography per design system.

#### Scenario: Front content

- **WHEN** user views the front of a card for an expression with `meaning` "感到卡住" and `example_zh` "我最近感到卡住了。"
- **THEN** the front shows those two Chinese lines as the main area content

#### Scenario: Missing example_zh on front

- **WHEN** `example_zh` is null for an expression
- **THEN** the front still shows `meaning` and omits or placeholders the second line without blocking flip

### Requirement: Flip card back side

The system SHALL display the card back with `phrase` as the primary line and `example_en` as the secondary line.

#### Scenario: Back content

- **WHEN** user flips to the back of a card for phrase "feel stuck" with example_en "I've been feeling stuck lately."
- **THEN** the back shows the phrase prominently and the full English sentence below

### Requirement: Card source footer

The system SHALL show the source video title in the card footer for Today's Review and Video Practice, and the assigned topic name for Topic Practice.

#### Scenario: Today's Review footer

- **WHEN** user reviews in Today's Review
- **THEN** card footer shows source video title

#### Scenario: Video mode footer

- **WHEN** user reviews in Video Practice
- **THEN** the card footer shows the title of the expression's source video

#### Scenario: Topic mode footer

- **WHEN** user reviews in Topic Practice
- **THEN** the card footer shows the name of the expression's assigned topic

### Requirement: Card flip interaction

The system SHALL flip the card between front and back on tap of the card body (excluding the back rating action area) with a 150–200ms animation.

#### Scenario: Flip to back

- **WHEN** user taps the front card body
- **THEN** the card animates to the back side

#### Scenario: Flip to front from back body

- **WHEN** user taps the back card body outside the rating action area
- **THEN** the card animates to the front side without submitting a rating

### Requirement: Rating action row

The system SHALL display three equal-width English labels on the card back footer: `mastered`, `again`, and `unsure`, separated by vertical rules matching the card border style.

#### Scenario: English-only rating labels

- **WHEN** user views the back rating row
- **THEN** no Chinese labels appear in the rating action area

#### Scenario: Rate and advance

- **WHEN** user taps one of `mastered`, `again`, or `unsure`
- **THEN** the system records the rating (see `review-ratings` spec), shows the design-system feedback animation, and advances to the next card or session end

### Requirement: Tarot card visual treatment

The system SHALL render review cards with paper texture, vintage 1px border, minimal corner radius, random palette background from the design-system Card Palette, and auto-selected text color for readability.

#### Scenario: Card aesthetic

- **WHEN** a review card is displayed
- **THEN** it occupies roughly 65–75% of the viewport height within the mobile container and reads as a physical paper card, not a dashboard widget

### Requirement: Mobile-first review layout

The system SHALL implement `/review` within the existing mobile container (`max-w-[430px]`), design-system colors, and 150–200ms motion limits.

#### Scenario: Mobile container

- **WHEN** user opens `/review` on a phone-width viewport
- **THEN** the review UI fits the 430px centered shell without horizontal scroll

### Requirement: Home direct entry to Today's Review

The system SHALL provide a Home CTA that starts Today's Review immediately without mode selection.

#### Scenario: Home CTA

- **WHEN** user taps Start today's review on Home
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

### Requirement: Caught up and Continue Today UI

After completing today's budget slice, the system SHALL show `🎉 You're all caught up.` and `Continue Today` when more Due/New remain unshown today.

#### Scenario: Caught up display

- **WHEN** user completes 40/40 with 80 Due remaining
- **THEN** caught up message and Continue Today are visible
