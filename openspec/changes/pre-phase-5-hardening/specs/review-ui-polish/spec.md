# review-ui-polish

## Purpose

Review finish page, hierarchical Back navigation, and small visual fixes on `/review`.

## ADDED Requirements

### Requirement: Review finish page

When the user completes all cards in a deck (or deck was empty after scope pick), the system SHALL show a finish state per `review-page-finish-ref.png`:

- Retain **Video Mode Now** (or Topic Mode Now) bar and **Back** button, Header, Divider
- Main copy: `You have completed.`
- Link below: `choose another mode` → returns to Video/Topic **mode selector**
- Congrats illustration (`congrats.jpeg` processed transparent) as primary visual below copy

#### Scenario: Deck completed

- **WHEN** user rates the last card in a non-empty deck
- **THEN** the finish page appears with Congrats illustration and copy above

#### Scenario: Choose another mode

- **WHEN** user taps choose another mode on finish page
- **THEN** the system returns to Video Mode / Topic Mode selector (initial `/review` phase)

### Requirement: Hierarchical Back navigation

Back controls SHALL navigate **one level up** in the review session state machine, never skip levels.

| Phase | Back destination |
|-------|------------------|
| pick-scope (Choose a video/topic) | mode selector |
| reviewing (active cards) | pick-scope for current mode |
| complete (You have completed.) | pick-scope for current mode |
| mode selector | no Back (or noop) |

Navbar Review reset MAY still return to mode selector (existing behavior).

#### Scenario: Back during reviewing

- **WHEN** user taps Back while reviewing cards in Video mode
- **THEN** the system returns to Choose a video list, not mode selector

#### Scenario: Back on finish page

- **WHEN** user taps Back on finish page
- **THEN** the system returns to Choose a video/topic for the active mode

### Requirement: Scope sticky note tint

Review scope picker sticky notes SHALL use a lighter `sticky-note.png` tint matching Video Mode button color (`#E0DBC8` family).

#### Scenario: Sticky note color

- **WHEN** user views Choose a video/topic
- **THEN** sticky notes appear lighter and consistent with mode button palette

### Requirement: Review card divider contrast

The divider between expression content and source footer on the review card SHALL use a darker border color than current (visible on light card backgrounds).

#### Scenario: Divider visible

- **WHEN** review card renders on `#E0DBC8`-class background
- **THEN** the footer divider is clearly visible

### Requirement: Again feedback color

Floating `+1` labels on **Again** rating SHALL use the same color as the card's primary text (`textColor` from card palette), not fixed `#222222`.

#### Scenario: Again on dark card

- **WHEN** user taps Again on a dark-background card
- **THEN** +1 floats use light text color matching the card

### Requirement: Broken heart asset

Unsure rating feedback SHALL use `docs/design/phase-4-review/sources/broken-heart.png` (processed to `public/review/broken-heart.png`).

#### Scenario: Unsure animation

- **WHEN** user taps Unsure
- **THEN** the broken-heart image matches the updated asset

### Requirement: Report form categories

Report issue dialog SHALL offer error types: **英文有误**, **中文有误**, **标点有误** (replacing **其他**). **标点有误** uses the same single-line **请输入正确内容** field (no separate description field).

#### Scenario: Punctuation error type

- **WHEN** user selects 标点有误 and submits correct content
- **THEN** the system applies the correction per existing report handler rules

### Requirement: Report success button contrast

The **提交成功：）** success toast/button background SHALL be darkened for sufficient contrast vs text.

#### Scenario: Success visible

- **WHEN** report submits successfully
- **THEN** success feedback is readable on mobile outdoors
