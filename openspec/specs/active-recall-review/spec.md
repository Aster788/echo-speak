# active-recall-review

## Purpose

Mobile-first Active Recall review session on `/review`: mode selection, scoped decks, and tarot-style bilingual flip cards (Phase 4).

## Requirements

### Requirement: Review page mode selector

The system SHALL present a mode selector below the page hint banner with two clickable regions: **Video** (left) and **Topic** (right), using assets from `docs/design/phase-4-review/sources/` per design system.

#### Scenario: Initial mode selection

- **WHEN** user opens `/review` before starting a session
- **THEN** the system shows Video and Topic mode options and does not show a review card

#### Scenario: Enter video mode

- **WHEN** user taps Video
- **THEN** the system transitions to video scope selection or review flow for the chosen video

#### Scenario: Enter topic mode

- **WHEN** user taps Topic
- **THEN** the system transitions to topic scope selection or review flow for the chosen topic subtree

### Requirement: Active mode bar during review

The system SHALL replace the dual mode selector with an active bar showing the current mode label (`Video Mode Now` or `Topic Mode Now`) on the left and a **Back** control on the right while a review session is active.

#### Scenario: Back to mode selection

- **WHEN** user taps Back during an active review session
- **THEN** the system clears the current deck and returns to the initial Video / Topic mode selector

### Requirement: Video-scoped review deck

The system SHALL load expressions for a single selected `video_id`, ordered by `created_at` ascending, when the user reviews in Video mode.

#### Scenario: Review one video

- **WHEN** user selects a video with 12 expressions in Video mode
- **THEN** the system presents a 12-card deck containing only expressions for that video

#### Scenario: Empty video deck

- **WHEN** user selects a video with zero expressions
- **THEN** the system shows the empty-state decoration and a message that no cards are available

### Requirement: Topic-scoped review deck

The system SHALL load expressions for the selected topic and all descendant topics (subtree), ordered by `created_at` ascending, when the user reviews in Topic mode.

#### Scenario: Review topic subtree

- **WHEN** user selects topic `food` which has child topics `drinks` and `cooking`
- **THEN** the deck includes expressions assigned to `food`, `drinks`, `cooking`, and any other descendant of `food`

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

The system SHALL show a bottom source area separated by a horizontal rule: video title in Video mode, topic name in Topic mode.

#### Scenario: Video mode footer

- **WHEN** user reviews in Video mode
- **THEN** the card footer shows the title of the expression's source video

#### Scenario: Topic mode footer

- **WHEN** user reviews in Topic mode
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
