# collections-page

## Purpose

Vintage scrapbook **Collections** surface at `/collections` replacing `/topics` and `/library`. Three top-level views: **Topic | Video | All** (default **Topic**). Mobile-first 430px.

## ADDED Requirements

### Requirement: Collections route and navigation

The system SHALL serve Collections at `/collections`, redirect `/topics` and `/library` to `/collections`, and show **Collections** in the navbar (replacing Topics and Library).

#### Scenario: Open Collections

- **WHEN** user taps Collections in the navbar
- **THEN** the system opens `/collections` with the Topic view selected by default

#### Scenario: Legacy routes redirect

- **WHEN** user navigates to `/topics` or `/library`
- **THEN** the system redirects to `/collections`

### Requirement: View switcher tabs

The system SHALL display three view tabs in order **Topic | Video | All**, each rendered as a `title.jpeg` frame button. The active tab SHALL show a raised shadow or float effect.

#### Scenario: Switch to Video view

- **WHEN** user taps the Video tab
- **THEN** the Video view replaces the main content and the Video tab appears active

#### Scenario: Switch to All view

- **WHEN** user taps the All tab
- **THEN** the All view replaces the main content and the All tab appears active

### Requirement: Page description copy

The system SHALL show the page hint:

```text
Build your personal library of natural English expressions.
```

#### Scenario: Description visible

- **WHEN** user opens any Collections view
- **THEN** the description appears below the header divider

### Requirement: Topic view level one — topic tree only

The Topic view level-one page SHALL display only the topic tree (no expression list, no merge panel, no topic dock).

Each topic row SHALL show: topic name, expression count, tree icons (**`arrow.jpeg`** on parent topics with children—tappable to expand/collapse with rotation animation; **`target.png`** on leaf topics only), **move** (`move.png`), and **delete** (`bin.png`) on the right.

Parent topics with children SHALL start expanded or collapsed per last session state; tapping **arrow** toggles visibility of child rows and rotates the arrow icon to reflect state.

All topics in the tree—including seed categories such as Daily, Food, Productivity—SHALL be eligible for **move** and **delete** subject to structural rules (no delete while topic has expressions or child topics). The product SHALL NOT treat seed topics as immutable “system” topics in the Collections UI.

The page SHALL include **New topic name** input and **Add** to create topics (root or child per existing API rules).

Topics at the same tree level SHALL sort by name a→z (case-insensitive).

#### Scenario: View topic tree

- **WHEN** user opens Collections with Topic tab active
- **THEN** the system shows the hierarchical topic list with counts and action icons, not expressions

#### Scenario: Add topic

- **WHEN** user enters a name and taps Add
- **THEN** the system creates a topic and refreshes the tree

#### Scenario: Select topic drills down

- **WHEN** user taps a topic row body (not arrow/move/delete icons)
- **THEN** the topic row briefly shows active float/shadow, then navigates to Topic view level two for that topic

#### Scenario: Expand collapse parent topic

- **WHEN** user taps arrow on a parent topic
- **THEN** child topics toggle visible/hidden and the arrow icon rotates to indicate expanded vs collapsed

#### Scenario: Leaf topic shows target icon

- **WHEN** a topic has no child topics
- **THEN** the row shows `target.png` instead of `arrow.jpeg`

### Requirement: Topic view level two — expressions in topic

Topic level two SHALL list expressions assigned to the selected topic, each in a `Rectangle.jpeg` card showing: phrase (English), meaning (Chinese), example_en, example_zh when present. If only sentence-level content exists (no phrase), the card SHALL show example_en and example_zh only.

Cards SHALL sort by phrase a→z (case-insensitive; tie-break `id`).

Header SHALL include `back.png` (top right) returning to Topic level one, and topic context on the left aligned with back.

Each card SHALL expose move (`move.png`) and delete (`bin.png`) in the top-right corner.

#### Scenario: Back from topic detail

- **WHEN** user taps back on Topic level two
- **THEN** the system returns to Topic level one with prior tree expansion preserved where possible

#### Scenario: Delete expression from card

- **WHEN** user taps delete on an expression card
- **THEN** the system dismisses the expression and removes the card with fade-out

### Requirement: Video view — list then detail

Video view SHALL use a two-level pattern analogous to Topic: level one lists videos with expression counts, sorted by video title a→z; level two lists expressions for the selected video in `Rectangle.jpeg` cards (same fields as Topic level two).

Level two header SHALL show the video title (italic, left-aligned, multi-line allowed) aligned horizontally with `back.png` on the right.

#### Scenario: Browse by video

- **WHEN** user selects a video in Video view level one
- **THEN** the system shows expressions for that video only on level two

### Requirement: All view — flat library

All view SHALL show every expression in `Rectangle.jpeg` cards with the same card content as Topic level two.

Header SHALL show italic summary on the left: `共 {videoCount} 个 video ｜ {expressionCount} 条 expressions` with accurate counts, aligned with `back.png` on the right. Tapping back SHALL return to **Topic** tab level one (default Collections home).

All expressions SHALL sort by phrase a→z.

#### Scenario: All view counts

- **WHEN** user opens All view with 6 videos and 120 expressions in the database
- **THEN** the summary shows the correct video and expression counts

### Requirement: Move sheet UI

Move operations for topics and expressions SHALL use a dedicated paper modal (`paper.jpeg` background with paperclip and star decorations per reference), not inline dropdowns on cards.

The modal SHALL display:

```text
Move into...
[dropdown of target topics]
Cancel    Move
```

On successful move, the system SHALL show a success message with fireworks animation (reuse review report success pattern).

#### Scenario: Move expression via modal

- **WHEN** user taps move on an expression card and selects a target topic then Move
- **THEN** the system updates `topic_id`, sets `topic_locked = true`, closes the modal, and shows success feedback

#### Scenario: Move topic via modal

- **WHEN** user taps move on a topic row and selects a new parent topic then Move
- **THEN** the system updates `parent_id` for that topic (entire subtree moves with it), prevents cycles, and shows success feedback

#### Scenario: Delete seed topic when empty

- **WHEN** user deletes an empty leaf seed topic (e.g. Travel with 0 expressions and no children)
- **THEN** the system deletes the topic (no `is_system` block in Collections)

#### Scenario: Cancel move

- **WHEN** user taps Cancel on the move modal
- **THEN** the modal closes with no data change

### Requirement: Vintage asset processing

New and reused JPEG/PNG sources under `docs/design/phase-4-review/sources/` SHALL be processed to transparent backgrounds where noted (congrats, Hello, input, title, arrow, Rectangle, paper, etc.) and copied to `public/collections/` (or appropriate public subfolder). `npm run audit:filenames` MUST pass after add/rename.

#### Scenario: Asset audit

- **WHEN** Collections assets are added to `public/`
- **THEN** `npm run audit:filenames` succeeds

## MODIFIED Requirements

### Requirement: Mobile-first layout

The Collections UI SHALL use a centered mobile container with `max-width: 430px` and design-system palette. Route SHALL be `/collections` (not `/topics`).

#### Scenario: Mobile layout

- **WHEN** user views Collections on phone or desktop
- **THEN** the layout is centered with max width 430px

### Requirement: Drag or pick to reassign expression topic

The system SHALL allow moving an expression to a different topic via the **Move sheet** (picker). Drag-to-dock is removed.

#### Scenario: Move expression via picker

- **WHEN** user opens Move sheet from an expression card and chooses topic `cooking`
- **THEN** the system updates `topic_id` and sets `topic_locked = true`

### Requirement: Dismiss expression

The system SHALL allow dismissing an expression via the **delete (bin) icon** on cards. Swipe-to-delete and drag-to-trash are removed.

#### Scenario: Delete button

- **WHEN** user taps delete on an expression card
- **THEN** the system dismisses the expression (deletes row + records dismissal)
