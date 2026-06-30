## ADDED Requirements

### Requirement: Delete action with reason picker

The Collections delete action SHALL present a reason picker with the seven `DISMISS_REASONS` before dismissing an expression. The chosen reason SHALL be sent to the dismiss API.

#### Scenario: Reason picker appears on delete

- **WHEN** the user taps the delete icon on an expression card
- **THEN** a picker shows the seven reasons (`single_word`, `fragment`, `duplicate`, `obscure`, `already_know`, `off_topic`, `other`)

#### Scenario: Dismissal carries reason

- **WHEN** the user selects `already_know` and confirms
- **THEN** the request body to `/api/expressions/[id]/dismiss` contains `{ reason: "already_know" }`

### Requirement: Multi-example card rendering in All and Topic views

The All and Topic views SHALL render one card per canonical phrase, displaying all merged examples as numbered `Example one`, `Example two`, … blocks within a single dashed-border box. The Video view SHALL render per-video rows (which may themselves have a multi-entry `examples` array).

#### Scenario: All view merged card

- **WHEN** the All view receives a virtual row for `behind the scenes` with `examples` of length 2
- **THEN** one card renders with both examples labeled `Example one` and `Example two`

#### Scenario: Video view per-video row

- **WHEN** the Video view is open for video X and `behind the scenes` also exists in video Y
- **THEN** only video X's row renders (with its own examples), not a cross-video merge

### Requirement: Manual merge with action

Collections SHALL provide a "merge with…" action on expression cards in All/Topic views that lets the user pick another expression to merge into this one, combining `examples` arrays and deleting the source row.

#### Scenario: Merge action available

- **WHEN** the user opens actions on a card in All view
- **THEN** a "merge with…" action is present alongside move and delete

#### Scenario: Merge executes

- **WHEN** the user merges card A into card B
- **THEN** card B's `examples` array gains A's examples and card A's row is deleted from the database

### Requirement: Re-extract action in Video L2 view

The Collections Video L2 view SHALL expose a "Re-extract" action that re-runs extraction on the current video without re-importing, after confirmation, and reloads the list on success.

#### Scenario: Re-extract button in Video L2 header

- **WHEN** the user is on the Video L2 page showing a video's expressions
- **THEN** a "Re-extract" action is visible in the page header

#### Scenario: Confirm dialog before re-extract

- **WHEN** the user taps Re-extract
- **THEN** a confirm dialog warns that non-locked expressions will be replaced and asks to continue

#### Scenario: List reloads after re-extract

- **WHEN** the re-extract API returns success
- **THEN** the video's expression list reloads with the new batch
